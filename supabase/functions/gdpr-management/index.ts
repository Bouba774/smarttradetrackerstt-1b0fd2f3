import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action } = body;

    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    switch (action) {
      case 'export-data': {
        // Call the database function to export all user data
        const { data: exportData, error: exportError } = await supabaseAdmin.rpc('export_user_data', {
          p_user_id: user.id
        });

        if (exportError) {
          console.error('Export error:', exportError);
          return new Response(
            JSON.stringify({ error: 'Failed to export data' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: exportData,
            message: 'Your data has been exported successfully.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'request-deletion': {
        const { reason } = body;

        const { data: deletionRequest, error: deletionError } = await supabaseAdmin.rpc('request_account_deletion', {
          p_reason: reason || null
        });

        if (deletionError) {
          console.error('Deletion request error:', deletionError);
          return new Response(
            JSON.stringify({ error: 'Failed to submit deletion request' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            ...deletionRequest
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-requests': {
        const { data: requests } = await supabaseAdmin
          .from('gdpr_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        return new Response(
          JSON.stringify({ success: true, requests: requests || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-consents': {
        const { data: consents } = await supabaseAdmin
          .from('user_consents')
          .select('*')
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, consents: consents || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-consent': {
        const { consentType, granted } = body;

        if (!consentType || typeof granted !== 'boolean') {
          return new Response(
            JSON.stringify({ error: 'Invalid consent data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('user_consents')
          .upsert({
            user_id: user.id,
            consent_type: consentType,
            granted,
            ip_address: clientIP,
            user_agent: userAgent,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,consent_type' });

        if (error) {
          console.error('Consent update error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update consent' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-processing-registry': {
        const { data: registry } = await supabaseAdmin
          .from('data_processing_registry')
          .select('*')
          .eq('is_active', true)
          .order('processing_name');

        return new Response(
          JSON.stringify({ success: true, registry: registry || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Admin actions
      case 'admin-get-pending-requests': {
        // Check if user is admin
        const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });
        
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: requests } = await supabaseAdmin
          .from('gdpr_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        return new Response(
          JSON.stringify({ success: true, requests: requests || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'admin-process-request': {
        const { requestId, newStatus } = body;

        const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });
        
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!requestId || !['processing', 'completed', 'rejected'].includes(newStatus)) {
          return new Response(
            JSON.stringify({ error: 'Invalid request data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('gdpr_requests')
          .update({ 
            status: newStatus,
            processed_by: user.id,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to process request' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log admin action
        await supabaseAdmin.rpc('log_admin_data_access', {
          p_admin_id: user.id,
          p_target_user_id: null,
          p_action: `gdpr_request_${newStatus}`,
          p_table_name: 'gdpr_requests',
          p_ip_address: clientIP
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('[gdpr-management] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
