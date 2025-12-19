import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Get allowed origins from environment or use defaults
const getAllowedOrigin = (origin: string): string => {
  const allowedOrigins = [
    'https://sfdudueswogeusuofbbi.lovableproject.com',
    'https://smarttradetracker.app',
    'https://www.smarttradetracker.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  return 'https://sfdudueswogeusuofbbi.lovableproject.com';
};

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(origin),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

interface SecurityEmailRequest {
  type: 'new_device' | 'account_blocked' | 'pin_reset';
  email: string;
  language: 'fr' | 'en';
  deviceInfo?: {
    deviceName: string;
    os: string;
    browser: string;
    timestamp: string;
  };
  resetToken?: string;
  resetUrl?: string;
}

const getEmailContent = (request: SecurityEmailRequest) => {
  const { type, language, deviceInfo, resetUrl } = request;

  switch (type) {
    case 'new_device':
      return {
        subject: language === 'fr' 
          ? '🔔 Nouvelle connexion détectée - Smart Trade Tracker'
          : '🔔 New login detected - Smart Trade Tracker',
        html: language === 'fr' ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ Alerte de Sécurité</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin-top: 0;">Nouvelle connexion détectée</h2>
              <p style="color: #64748b; line-height: 1.6;">
                Une connexion à votre compte Smart Trade Tracker a été effectuée depuis un nouvel appareil :
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">📱 Appareil</td>
                    <td style="padding: 8px 0; color: #1e293b;">${deviceInfo?.deviceName || 'Inconnu'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">💻 Système</td>
                    <td style="padding: 8px 0; color: #1e293b;">${deviceInfo?.os || 'Inconnu'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">🌐 Navigateur</td>
                    <td style="padding: 8px 0; color: #1e293b;">${deviceInfo?.browser || 'Inconnu'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">🕐 Date/Heure</td>
                    <td style="padding: 8px 0; color: #1e293b;">${deviceInfo?.timestamp || new Date().toLocaleString('fr-FR')}</td>
                  </tr>
                </table>
              </div>
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⚠️ Ce n'était pas vous ?</strong><br>
                  Changez immédiatement votre mot de passe et votre code PIN dans les paramètres de sécurité.
                </p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center;">
                Cet email a été envoyé automatiquement par Smart Trade Tracker.<br>
                Ne partagez jamais vos identifiants avec quiconque.
              </p>
            </div>
          </div>
        ` : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ Security Alert</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin-top: 0;">New login detected</h2>
              <p style="color: #64748b; line-height: 1.6;">
                A login to your Smart Trade Tracker account was made from a new device:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">📱 Device</td>
                    <td style="padding: 8px 0; color: #1e293b;">${deviceInfo?.deviceName || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">💻 System</td>
                    <td style="padding: 8px 0; color: #1e293b;">${deviceInfo?.os || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">🌐 Browser</td>
                    <td style="padding: 8px 0; color: #1e293b;">${deviceInfo?.browser || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 500;">🕐 Date/Time</td>
                    <td style="padding: 8px 0; color: #1e293b;">${deviceInfo?.timestamp || new Date().toLocaleString('en-US')}</td>
                  </tr>
                </table>
              </div>
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⚠️ Wasn't you?</strong><br>
                  Change your password and PIN immediately in security settings.
                </p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center;">
                This email was sent automatically by Smart Trade Tracker.<br>
                Never share your credentials with anyone.
              </p>
            </div>
          </div>
        `
      };

    case 'account_blocked':
      return {
        subject: language === 'fr'
          ? '🔒 Compte temporairement bloqué - Smart Trade Tracker'
          : '🔒 Account temporarily blocked - Smart Trade Tracker',
        html: language === 'fr' ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Compte Bloqué</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin-top: 0;">Tentatives de connexion échouées détectées</h2>
              <p style="color: #64748b; line-height: 1.6;">
                Votre compte Smart Trade Tracker a été temporairement bloqué suite à plusieurs tentatives de connexion infructueuses.
              </p>
              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
                <p style="color: #991b1b; margin: 0;">
                  <strong>Détails de l'appareil :</strong><br>
                  📱 ${deviceInfo?.deviceName || 'Inconnu'}<br>
                  💻 ${deviceInfo?.os || 'Inconnu'}<br>
                  🌐 ${deviceInfo?.browser || 'Inconnu'}<br>
                  🕐 ${deviceInfo?.timestamp || new Date().toLocaleString('fr-FR')}
                </p>
              </div>
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⚠️ Si ce n'était pas vous</strong><br>
                  Quelqu'un essaie peut-être d'accéder à votre compte. Nous vous recommandons de changer votre mot de passe immédiatement.
                </p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center;">
                Cet email a été envoyé automatiquement par Smart Trade Tracker.
              </p>
            </div>
          </div>
        ` : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Account Blocked</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin-top: 0;">Failed login attempts detected</h2>
              <p style="color: #64748b; line-height: 1.6;">
                Your Smart Trade Tracker account has been temporarily blocked due to multiple unsuccessful login attempts.
              </p>
              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
                <p style="color: #991b1b; margin: 0;">
                  <strong>Device details:</strong><br>
                  📱 ${deviceInfo?.deviceName || 'Unknown'}<br>
                  💻 ${deviceInfo?.os || 'Unknown'}<br>
                  🌐 ${deviceInfo?.browser || 'Unknown'}<br>
                  🕐 ${deviceInfo?.timestamp || new Date().toLocaleString('en-US')}
                </p>
              </div>
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⚠️ If this wasn't you</strong><br>
                  Someone may be trying to access your account. We recommend changing your password immediately.
                </p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center;">
                This email was sent automatically by Smart Trade Tracker.
              </p>
            </div>
          </div>
        `
      };

    case 'pin_reset':
      return {
        subject: language === 'fr'
          ? '🔑 Réinitialisation de votre code PIN - Smart Trade Tracker'
          : '🔑 Reset your PIN code - Smart Trade Tracker',
        html: language === 'fr' ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔑 Réinitialisation du PIN</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin-top: 0;">Réinitialiser votre code PIN</h2>
              <p style="color: #64748b; line-height: 1.6;">
                Vous avez demandé à réinitialiser votre code PIN. Cliquez sur le bouton ci-dessous pour définir un nouveau code.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Réinitialiser mon PIN
                </a>
              </div>
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⏱️ Ce lien expire dans 10 minutes</strong><br>
                  Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center;">
                Cet email a été envoyé automatiquement par Smart Trade Tracker.<br>
                Ne partagez jamais ce lien avec quiconque.
              </p>
            </div>
          </div>
        ` : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔑 PIN Reset</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin-top: 0;">Reset your PIN code</h2>
              <p style="color: #64748b; line-height: 1.6;">
                You requested to reset your PIN code. Click the button below to set a new code.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Reset my PIN
                </a>
              </div>
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⏱️ This link expires in 10 minutes</strong><br>
                  If you didn't request this reset, ignore this email.
                </p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center;">
                This email was sent automatically by Smart Trade Tracker.<br>
                Never share this link with anyone.
              </p>
            </div>
          </div>
        `
      };

    default:
      return { subject: '', html: '' };
  }
};

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const request: SecurityEmailRequest = await req.json();
    console.log("Sending security email:", { type: request.type, email: request.email });

    const { subject, html } = getEmailContent(request);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Smart Trade Tracker <security@smarttradetracker.app>",
        to: [request.email],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorData }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in security-email function:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
