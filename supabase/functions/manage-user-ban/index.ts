import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header to verify the requesting user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user making the request
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdminData, error: adminError } = await supabaseAdmin.rpc("is_admin", {
      _user_id: requestingUser.id,
    });

    if (adminError || !isAdminData) {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin only." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the action from request body
    const { action, user_id, reason, is_permanent, expires_at } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-ban
    if (user_id === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: "Cannot ban yourself" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Action: ${action} for user: ${user_id}`);

    if (action === 'ban') {
      // Ban user in auth (this disables their account)
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { ban_duration: is_permanent ? 'none' : '876000h' } // 100 years if permanent, otherwise use expires_at logic
      );

      if (updateError) {
        console.error("Error banning user:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to ban user", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also record in banned_users table
      const { error: insertError } = await supabaseAdmin
        .from('banned_users')
        .upsert({
          user_id,
          banned_by: requestingUser.id,
          reason: reason || null,
          is_permanent: is_permanent !== false,
          expires_at: expires_at || null,
        }, { onConflict: 'user_id' });

      if (insertError) {
        console.error("Error recording ban:", insertError);
      }

      console.log(`User ${user_id} has been banned`);

      return new Response(
        JSON.stringify({ success: true, message: "User has been banned" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === 'unban') {
      // Unban user in auth
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { ban_duration: 'none' }
      );

      if (updateError) {
        console.error("Error unbanning user:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to unban user", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Remove from banned_users table
      const { error: deleteError } = await supabaseAdmin
        .from('banned_users')
        .delete()
        .eq('user_id', user_id);

      if (deleteError) {
        console.error("Error removing ban record:", deleteError);
      }

      console.log(`User ${user_id} has been unbanned`);

      return new Response(
        JSON.stringify({ success: true, message: "User has been unbanned" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === 'disable') {
      // Disable user (different from ban - just prevents login)
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { user_metadata: { disabled: true } }
      );

      if (updateError) {
        console.error("Error disabling user:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to disable user", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`User ${user_id} has been disabled`);

      return new Response(
        JSON.stringify({ success: true, message: "User has been disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === 'enable') {
      // Enable user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { user_metadata: { disabled: false } }
      );

      if (updateError) {
        console.error("Error enabling user:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to enable user", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`User ${user_id} has been enabled`);

      return new Response(
        JSON.stringify({ success: true, message: "User has been enabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'ban', 'unban', 'disable', or 'enable'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
