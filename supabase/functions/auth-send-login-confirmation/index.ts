import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginConfirmationRequest {
  email: string;
  password: string;
  language: string;
  userAgent?: string;
}

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getEmailContent = (language: string, confirmUrl: string, userAgent?: string) => {
  const isFrench = language === 'fr';
  
  const subject = isFrench 
    ? '🔐 Confirmez votre connexion - Smart Trade Tracker'
    : '🔐 Confirm your login - Smart Trade Tracker';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 480px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px;">🔐</span>
              </div>
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">
                ${isFrench ? 'Tentative de connexion' : 'Login Attempt'}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                ${isFrench 
                  ? 'Une tentative de connexion a été détectée sur votre compte Smart Trade Tracker. Pour vous connecter, cliquez sur le bouton ci-dessous.'
                  : 'A login attempt was detected on your Smart Trade Tracker account. To log in, click the button below.'}
              </p>
              
              ${userAgent ? `
              <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                  <strong style="color: #6366f1;">${isFrench ? 'Appareil détecté:' : 'Detected device:'}</strong><br>
                  ${userAgent.substring(0, 100)}...
                </p>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);">
                      ${isFrench ? '✓ Confirmer la connexion' : '✓ Confirm Login'}
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px; text-align: center;">
                ${isFrench 
                  ? 'Ce lien expire dans 15 minutes et ne peut être utilisé qu\'une seule fois.'
                  : 'This link expires in 15 minutes and can only be used once.'}
              </p>
              
              <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; margin-top: 24px;">
                <p style="color: #ef4444; font-size: 13px; margin: 0; text-align: center;">
                  ⚠️ ${isFrench 
                    ? 'Si vous n\'avez pas tenté de vous connecter, ignorez cet email et sécurisez votre compte.'
                    : 'If you did not attempt to log in, ignore this email and secure your account.'}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.2); text-align: center;">
              <p style="color: #475569; font-size: 12px; margin: 0;">
                Smart Trade Tracker - ALPHA FX<br>
                ${isFrench ? 'Votre journal de trading intelligent' : 'Your intelligent trading journal'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, language, userAgent }: LoginConfirmationRequest = await req.json();

    console.log(`Login confirmation request for: ${email}`);

    // 1. Verify credentials first (without actually logging in)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.log("Invalid credentials for:", email);
      // Return generic error to prevent enumeration
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: language === 'fr' 
            ? 'Authentification échouée. Vérifiez vos identifiants.'
            : 'Authentication failed. Check your credentials.'
        }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sign out immediately - we only validated credentials
    await supabase.auth.signOut();

    const userId = authData.user.id;

    // 2. Check if user needs email confirmation (existing user migration)
    const { data: needsConfirm } = await supabase.rpc('check_user_needs_email_confirmation', {
      p_user_id: userId
    });

    // 3. Generate secure token
    const token = generateToken();
    const tokenHash = await hashToken(token);

    // 4. Store token in database
    const { error: tokenError } = await supabase.rpc('create_login_token', {
      p_user_id: userId,
      p_token_hash: tokenHash,
      p_expires_minutes: 15,
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      p_user_agent: userAgent
    });

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to create confirmation token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 5. Build confirmation URL
    const origin = req.headers.get('origin') || 'https://sfdudueswogeusuofbbi.lovable.app';
    const confirmUrl = `${origin}/verify-login?token=${token}`;

    // 6. Send email via Resend
    const resend = new Resend(resendApiKey);
    const { subject, html } = getEmailContent(language, confirmUrl, userAgent);

    const { error: emailError } = await resend.emails.send({
      from: "Smart Trade Tracker <noreply@resend.dev>",
      to: [email],
      subject,
      html,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Login confirmation email sent to: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: language === 'fr'
          ? 'Un email de confirmation a été envoyé à votre adresse.'
          : 'A confirmation email has been sent to your address.',
        needsEmailConfirmation: needsConfirm
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in auth-send-login-confirmation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});