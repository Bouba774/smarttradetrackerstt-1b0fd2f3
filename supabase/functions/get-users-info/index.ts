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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin using the database function
    const { data: isAdminData, error: adminError } = await supabaseAdmin.rpc("is_admin", {
      _user_id: user.id,
    });

    if (adminError || !isAdminData) {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin only." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all users from auth.users using the admin API
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map users to return only necessary info
    const usersInfo = users.map((u) => ({
      id: u.id,
      email: u.email,
      email_confirmed_at: u.email_confirmed_at,
      phone: u.phone,
      created_at: u.created_at,
      updated_at: u.updated_at,
      last_sign_in_at: u.last_sign_in_at,
      app_metadata: u.app_metadata,
      user_metadata: u.user_metadata,
      is_anonymous: u.is_anonymous,
      confirmed_at: u.confirmed_at,
    }));

    return new Response(
      JSON.stringify({ users: usersInfo }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
