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

// Translations for all 8 supported languages
const translations: Record<string, {
  subject: (name: string) => string;
  welcome: (name: string) => string;
  intro: string;
  journalTitle: string;
  journalDesc: string;
  psychTitle: string;
  psychDesc: string;
  challengesTitle: string;
  challengesDesc: string;
  ctaButton: string;
  tip: string;
  footerNote: string;
  tagline: string;
}> = {
  en: {
    subject: (name) => `🎉 Welcome ${name}! Your trading journey begins`,
    welcome: (name) => `Welcome ${name}!`,
    intro: "Congratulations on joining the Smart Trade Tracker community! You've taken the first step towards a more structured and professional trading approach.",
    journalTitle: 'Trading Journal',
    journalDesc: 'Record every trade with precision',
    psychTitle: 'Psychological Analysis',
    psychDesc: 'Understand your emotions and patterns',
    challengesTitle: 'Challenges & Gamification',
    challengesDesc: 'Progress with motivating goals',
    ctaButton: '🚀 Start now',
    tip: 'Tip: Start by recording your first trade to see the magic happen!',
    footerNote: 'You received this email because you just created your Smart Trade Tracker account.',
    tagline: 'Your intelligent trading journal'
  },
  fr: {
    subject: (name) => `🎉 Bienvenue ${name} ! Votre aventure trading commence`,
    welcome: (name) => `Bienvenue ${name} !`,
    intro: "Félicitations pour avoir rejoint la communauté Smart Trade Tracker ! Vous avez fait le premier pas vers une approche plus structurée et professionnelle du trading.",
    journalTitle: 'Journal de Trading',
    journalDesc: 'Enregistrez chaque trade avec précision',
    psychTitle: 'Analyse Psychologique',
    psychDesc: 'Comprenez vos émotions et patterns',
    challengesTitle: 'Défis & Gamification',
    challengesDesc: 'Progressez avec des objectifs motivants',
    ctaButton: '🚀 Commencer maintenant',
    tip: 'Conseil : Commencez par enregistrer votre premier trade pour voir la magie opérer !',
    footerNote: 'Vous recevez cet email car vous venez de créer votre compte Smart Trade Tracker.',
    tagline: 'Votre journal de trading intelligent'
  },
  es: {
    subject: (name) => `🎉 ¡Bienvenido ${name}! Tu viaje de trading comienza`,
    welcome: (name) => `¡Bienvenido ${name}!`,
    intro: "¡Felicidades por unirte a la comunidad Smart Trade Tracker! Has dado el primer paso hacia un enfoque de trading más estructurado y profesional.",
    journalTitle: 'Diario de Trading',
    journalDesc: 'Registra cada operación con precisión',
    psychTitle: 'Análisis Psicológico',
    psychDesc: 'Comprende tus emociones y patrones',
    challengesTitle: 'Desafíos y Gamificación',
    challengesDesc: 'Progresa con objetivos motivadores',
    ctaButton: '🚀 Empezar ahora',
    tip: 'Consejo: ¡Comienza registrando tu primera operación para ver la magia suceder!',
    footerNote: 'Recibiste este email porque acabas de crear tu cuenta de Smart Trade Tracker.',
    tagline: 'Tu diario de trading inteligente'
  },
  pt: {
    subject: (name) => `🎉 Bem-vindo ${name}! Sua jornada de trading começa`,
    welcome: (name) => `Bem-vindo ${name}!`,
    intro: "Parabéns por se juntar à comunidade Smart Trade Tracker! Você deu o primeiro passo para uma abordagem de trading mais estruturada e profissional.",
    journalTitle: 'Diário de Trading',
    journalDesc: 'Registre cada operação com precisão',
    psychTitle: 'Análise Psicológica',
    psychDesc: 'Entenda suas emoções e padrões',
    challengesTitle: 'Desafios e Gamificação',
    challengesDesc: 'Progrida com objetivos motivadores',
    ctaButton: '🚀 Começar agora',
    tip: 'Dica: Comece registrando sua primeira operação para ver a mágica acontecer!',
    footerNote: 'Você recebeu este email porque acabou de criar sua conta Smart Trade Tracker.',
    tagline: 'Seu diário de trading inteligente'
  },
  de: {
    subject: (name) => `🎉 Willkommen ${name}! Ihre Trading-Reise beginnt`,
    welcome: (name) => `Willkommen ${name}!`,
    intro: "Herzlichen Glückwunsch zum Beitritt zur Smart Trade Tracker-Community! Sie haben den ersten Schritt zu einem strukturierteren und professionelleren Trading-Ansatz gemacht.",
    journalTitle: 'Trading-Tagebuch',
    journalDesc: 'Erfassen Sie jeden Trade präzise',
    psychTitle: 'Psychologische Analyse',
    psychDesc: 'Verstehen Sie Ihre Emotionen und Muster',
    challengesTitle: 'Herausforderungen & Gamification',
    challengesDesc: 'Fortschritt mit motivierenden Zielen',
    ctaButton: '🚀 Jetzt starten',
    tip: 'Tipp: Beginnen Sie mit der Aufzeichnung Ihres ersten Trades, um die Magie zu erleben!',
    footerNote: 'Sie haben diese E-Mail erhalten, weil Sie gerade Ihr Smart Trade Tracker-Konto erstellt haben.',
    tagline: 'Ihr intelligentes Trading-Tagebuch'
  },
  it: {
    subject: (name) => `🎉 Benvenuto ${name}! Il tuo viaggio nel trading inizia`,
    welcome: (name) => `Benvenuto ${name}!`,
    intro: "Congratulazioni per esserti unito alla community di Smart Trade Tracker! Hai fatto il primo passo verso un approccio al trading più strutturato e professionale.",
    journalTitle: 'Diario di Trading',
    journalDesc: 'Registra ogni operazione con precisione',
    psychTitle: 'Analisi Psicologica',
    psychDesc: 'Comprendi le tue emozioni e i tuoi pattern',
    challengesTitle: 'Sfide e Gamification',
    challengesDesc: 'Progredisci con obiettivi motivanti',
    ctaButton: '🚀 Inizia ora',
    tip: 'Consiglio: Inizia registrando la tua prima operazione per vedere la magia accadere!',
    footerNote: 'Hai ricevuto questa email perché hai appena creato il tuo account Smart Trade Tracker.',
    tagline: 'Il tuo diario di trading intelligente'
  },
  tr: {
    subject: (name) => `🎉 Hoş geldin ${name}! Trading yolculuğun başlıyor`,
    welcome: (name) => `Hoş geldin ${name}!`,
    intro: "Smart Trade Tracker topluluğuna katıldığın için tebrikler! Daha yapılandırılmış ve profesyonel bir trading yaklaşımına doğru ilk adımı attın.",
    journalTitle: 'Trading Günlüğü',
    journalDesc: 'Her işlemi hassasiyetle kaydet',
    psychTitle: 'Psikolojik Analiz',
    psychDesc: 'Duygularını ve kalıplarını anla',
    challengesTitle: 'Meydan Okumalar ve Oyunlaştırma',
    challengesDesc: 'Motive edici hedeflerle ilerle',
    ctaButton: '🚀 Şimdi başla',
    tip: 'İpucu: Sihri görmek için ilk işlemini kaydederek başla!',
    footerNote: 'Bu e-postayı, Smart Trade Tracker hesabınızı yeni oluşturduğunuz için aldınız.',
    tagline: 'Akıllı trading günlüğünüz'
  },
  ar: {
    subject: (name) => `🎉 مرحباً ${name}! رحلتك في التداول تبدأ`,
    welcome: (name) => `مرحباً ${name}!`,
    intro: "تهانينا على انضمامك إلى مجتمع Smart Trade Tracker! لقد اتخذت الخطوة الأولى نحو نهج تداول أكثر تنظيماً واحترافية.",
    journalTitle: 'مذكرة التداول',
    journalDesc: 'سجل كل صفقة بدقة',
    psychTitle: 'التحليل النفسي',
    psychDesc: 'افهم مشاعرك وأنماطك',
    challengesTitle: 'التحديات والألعاب',
    challengesDesc: 'تقدم بأهداف محفزة',
    ctaButton: '🚀 ابدأ الآن',
    tip: 'نصيحة: ابدأ بتسجيل أول صفقة لك لترى السحر يحدث!',
    footerNote: 'تلقيت هذا البريد الإلكتروني لأنك أنشأت للتو حساب Smart Trade Tracker الخاص بك.',
    tagline: 'مذكرة التداول الذكية الخاصة بك'
  }
};

const getWelcomeEmailContent = (language: string, nickname: string, dashboardUrl: string) => {
  const t = translations[language] || translations.en;
  const isRtl = language === 'ar';
  
  const html = `
<!DOCTYPE html>
<html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject(nickname)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 560px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 80px rgba(34, 197, 94, 0.12), 0 0 0 1px rgba(34, 197, 94, 0.08);">
          
          <!-- Celebratory Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center; background: linear-gradient(180deg, rgba(34, 197, 94, 0.15) 0%, transparent 100%);">
              <div style="font-size: 56px; margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(34, 197, 94, 0.3));">🎉</div>
              <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 8px; font-weight: 700; letter-spacing: -0.5px;">
                ${t.welcome(nickname)}
              </h1>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 16px auto 0;">
                <tr>
                  <td style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 6px 24px rgba(99, 102, 241, 0.35);">
                    <span style="font-size: 24px; line-height: 48px;">📊</span>
                  </td>
                </tr>
              </table>
              <p style="color: #22c55e; font-size: 12px; margin: 12px 0 0; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
                Smart Trade Tracker - ALPHA FX
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent);"></div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.7; margin: 0 0 28px; text-align: center;">
                ${t.intro}
              </p>
              
              <!-- Features Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 28px;">
                <tr>
                  <td style="padding: 14px 16px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 22px;">📊</span>
                        </td>
                        <td style="padding-${isRtl ? 'right' : 'left'}: 12px;">
                          <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 2px;">
                            ${t.journalTitle}
                          </p>
                          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            ${t.journalDesc}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 14px 16px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.15); border-radius: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 22px;">🧠</span>
                        </td>
                        <td style="padding-${isRtl ? 'right' : 'left'}: 12px;">
                          <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 2px;">
                            ${t.psychTitle}
                          </p>
                          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            ${t.psychDesc}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 14px 16px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 22px;">🏆</span>
                        </td>
                        <td style="padding-${isRtl ? 'right' : 'left'}: 12px;">
                          <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 2px;">
                            ${t.challengesTitle}
                          </p>
                          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            ${t.challengesDesc}
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
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 8px 32px rgba(34, 197, 94, 0.35), inset 0 1px 0 rgba(255,255,255,0.15);">
                      ${t.ctaButton}
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                💡 ${t.tip}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="color: #64748b; font-size: 11px; margin: 0 0 8px; text-align: center; line-height: 1.6;">
                ${t.footerNote}
              </p>
              <p style="color: #475569; font-size: 11px; margin: 0; text-align: center;">
                <strong style="color: #64748b;">Smart Trade Tracker</strong> - ALPHA FX<br>
                <span style="color: #4ade80;">${t.tagline}</span>
              </p>
              <p style="color: #334155; font-size: 10px; margin: 12px 0 0; text-align: center;">
                © ${new Date().getFullYear()} Smart Trade Tracker. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: t.subject(nickname), html };
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