import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// This function is designed to be called by a cron job
// It handles automatic cleanup of old data per GDPR retention policy
Deno.serve(async (req) => {
  // Only allow internal/cron calls or authenticated admin calls
  const authHeader = req.headers.get('Authorization');
  
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // If there's an auth header, verify it's an admin
  if (authHeader && authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (user) {
      const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  try {
    console.log('[GDPR-Cleanup] Starting scheduled cleanup...');

    // Run the cleanup function
    const { data, error } = await supabaseAdmin.rpc('scheduled_gdpr_cleanup');

    if (error) {
      console.error('[GDPR-Cleanup] Error:', error);
      throw error;
    }

    console.log('[GDPR-Cleanup] Cleanup completed:', data);

    return new Response(JSON.stringify({
      success: true,
      result: data,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[GDPR-Cleanup] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Cleanup failed';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
