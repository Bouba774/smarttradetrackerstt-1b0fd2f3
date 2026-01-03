import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  nickname: string;
  language: string;
}

const getWelcomeEmailContent = (language: string, nickname: string, dashboardUrl: string) => {
  const isFrench = language === 'fr';
  
  const subject = isFrench 
    ? `🎉 Bienvenue ${nickname} ! Votre aventure trading commence`
    : `🎉 Welcome ${nickname}! Your trading journey begins`;

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
        <table role="presentation" width="100%" style="max-width: 520px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);">
              <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                ${isFrench ? `Bienvenue ${nickname} !` : `Welcome ${nickname}!`}
              </h1>
              <p style="color: #6366f1; font-size: 16px; margin: 8px 0 0; font-weight: 500;">
                Smart Trade Tracker - ALPHA FX
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="color: #e2e8f0; font-size: 17px; line-height: 1.7; margin: 0 0 24px;">
                ${isFrench 
                  ? 'Félicitations pour avoir rejoint la communauté Smart Trade Tracker ! Vous avez fait le premier pas vers une approche plus structurée et professionnelle du trading.'
                  : 'Congratulations on joining the Smart Trade Tracker community! You\'ve taken the first step towards a more structured and professional trading approach.'}
              </p>
              
              <!-- Features Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td style="padding: 16px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; margin-bottom: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right: 16px; vertical-align: top;">
                          <span style="font-size: 24px;">📊</span>
                        </td>
                        <td>
                          <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 4px;">
                            ${isFrench ? 'Journal de Trading' : 'Trading Journal'}
                          </p>
                          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                            ${isFrench 
                              ? 'Enregistrez chaque trade avec précision'
                              : 'Record every trade with precision'}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 16px; background: rgba(34, 197, 94, 0.1); border-radius: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right: 16px; vertical-align: top;">
                          <span style="font-size: 24px;">🧠</span>
                        </td>
                        <td>
                          <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 4px;">
                            ${isFrench ? 'Analyse Psychologique' : 'Psychological Analysis'}
                          </p>
                          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                            ${isFrench 
                              ? 'Comprenez vos émotions et patterns'
                              : 'Understand your emotions and patterns'}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right: 16px; vertical-align: top;">
                          <span style="font-size: 24px;">🏆</span>
                        </td>
                        <td>
                          <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 4px;">
                            ${isFrench ? 'Défis & Gamification' : 'Challenges & Gamification'}
                          </p>
                          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                            ${isFrench 
                              ? 'Progressez avec des objectifs motivants'
                              : 'Progress with motivating goals'}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);">
                      ${isFrench ? '🚀 Commencer maintenant' : '🚀 Start now'}
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                ${isFrench 
                  ? 'Conseil : Commencez par enregistrer votre premier trade pour voir la magie opérer !'
                  : 'Tip: Start by recording your first trade to see the magic happen!'}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.2); text-align: center;">
              <p style="color: #475569; font-size: 12px; margin: 0;">
                ${isFrench 
                  ? 'Vous recevez cet email car vous venez de créer votre compte Smart Trade Tracker.'
                  : 'You received this email because you just created your Smart Trade Tracker account.'}
              </p>
              <p style="color: #475569; font-size: 12px; margin: 12px 0 0;">
                Smart Trade Tracker - ALPHA FX © ${new Date().getFullYear()}
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

    const { userId, email, nickname, language }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to: ${email} (${nickname})`);

    // Check if welcome email was already sent
    const { data: profile } = await supabase
      .from('profiles')
      .select('welcome_email_sent')
      .eq('user_id', userId)
      .single();

    if (profile?.welcome_email_sent) {
      console.log("Welcome email already sent for user:", userId);
      return new Response(
        JSON.stringify({ success: true, alreadySent: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build dashboard URL
    const origin = req.headers.get('origin') || 'https://sfdudueswogeusuofbbi.lovable.app';
    const dashboardUrl = `${origin}/dashboard`;

    // Send email via Resend
    const resend = new Resend(resendApiKey);
    const { subject, html } = getWelcomeEmailContent(language, nickname, dashboardUrl);

    const { error: emailError } = await resend.emails.send({
      from: "Smart Trade Tracker <noreply@resend.dev>",
      to: [email],
      subject,
      html,
    });

    if (emailError) {
      console.error("Error sending welcome email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send welcome email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark welcome email as sent
    await supabase
      .from('profiles')
      .update({ welcome_email_sent: true })
      .eq('user_id', userId);

    console.log(`Welcome email sent successfully to: ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in auth-send-welcome:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});