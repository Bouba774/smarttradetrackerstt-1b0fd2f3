import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyLoginRequest {
  token: string;
}

const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token }: VerifyLoginRequest = await req.json();

    if (!token || token.length !== 64) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Verifying login token");

    // Hash the token to compare with stored hash
    const tokenHash = await hashToken(token);

    // Verify the token using the database function
    const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_login_token', {
      p_token_hash: tokenHash
    });

    if (verifyError) {
      console.error("Token verification error:", verifyError);
      return new Response(
        JSON.stringify({ success: false, error: "Verification failed" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = verifyResult?.[0];
    
    if (!result || !result.is_valid) {
      console.log("Invalid token:", result?.error_message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result?.error_message || "Token invalide" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = result.user_id;
    console.log("Token verified for user:", userId);

    // Get user email to create a magic link
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update profile to mark email as confirmed (for migrated users)
    await supabase
      .from('profiles')
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Generate a magic link for the user
    const origin = req.headers.get('origin') || 'https://sfdudueswogeusuofbbi.lovable.app';
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
      options: {
        redirectTo: `${origin}/dashboard`,
      }
    });

    if (magicLinkError) {
      console.error("Error generating magic link:", magicLinkError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate login link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Return the hashed tokens needed for client-side authentication
    const properties = magicLinkData.properties;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        email: userData.user.email,
        // Return the action link which contains the token
        actionLink: magicLinkData.properties.action_link
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in auth-verify-login:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});