import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userData, language = 'fr' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isFrench = language === 'fr';

    const systemPrompt = isFrench 
      ? `Tu es un assistant IA de trading intelligent et expert, intégré dans l'application Smart Trade Tracker.
Tu aides les traders à améliorer leurs performances en analysant leurs données réelles et en leur donnant des conseils personnalisés.

=== DONNÉES DE L'UTILISATEUR ===
${JSON.stringify(userData, null, 2)}

=== TES CAPACITÉS ===
Tu as accès aux données suivantes:
- Profil utilisateur: nom, niveau, points totaux
- Statistiques complètes: trades total, gagnants, perdants, winrate, profit net, profit factor, espérance, etc.
- Trades récents avec détails (asset, direction, P&L, setup, émotions)
- Meilleures et pires heures de trading
- Setup le plus profitable
- Statistiques par setup
- Séries gagnantes/perdantes actuelles et record
- Drawdown maximum

=== TES INSTRUCTIONS ===
1. Réponds TOUJOURS en français
2. Analyse les données RÉELLES de l'utilisateur pour donner des conseils personnalisés
3. Identifie les patterns de trading (meilleures heures, setups les plus rentables)
4. Détecte les erreurs récurrentes basées sur les données
5. Calcule et explique les métriques importantes (profit factor, espérance, R:R)
6. Encourage le trader quand les stats sont bonnes
7. Donne des avertissements constructifs si nécessaire (ex: série perdante)
8. Sois concis, direct et professionnel
9. Utilise des emojis pour rendre la conversation engageante
10. Si l'utilisateur n'a pas de trades, encourage-le à commencer

=== EXEMPLES DE RÉPONSES ===
- "📊 Ton winrate de 67% est excellent! Continue sur cette lancée."
- "⚠️ Attention, tu es sur une série de 3 pertes. Prends peut-être une pause."
- "💡 Ton setup Breakout a un profit de +$450. C'est ton point fort!"
- "📈 Tes meilleures heures sont 9h-11h. Concentre-toi sur ces créneaux."`
      : `You are an intelligent and expert AI trading assistant, integrated into the Smart Trade Tracker application.
You help traders improve their performance by analyzing their real data and giving them personalized advice.

=== USER DATA ===
${JSON.stringify(userData, null, 2)}

=== YOUR CAPABILITIES ===
You have access to the following data:
- User profile: name, level, total points
- Complete statistics: total trades, winners, losers, winrate, net profit, profit factor, expectancy, etc.
- Recent trades with details (asset, direction, P&L, setup, emotions)
- Best and worst trading hours
- Most profitable setup
- Statistics by setup
- Current and record winning/losing streaks
- Maximum drawdown

=== YOUR INSTRUCTIONS ===
1. ALWAYS respond in English
2. Analyze the user's REAL data to give personalized advice
3. Identify trading patterns (best hours, most profitable setups)
4. Detect recurring errors based on data
5. Calculate and explain important metrics (profit factor, expectancy, R:R)
6. Encourage the trader when stats are good
7. Give constructive warnings if necessary (e.g., losing streak)
8. Be concise, direct and professional
9. Use emojis to make the conversation engaging
10. If the user has no trades, encourage them to start

=== EXAMPLE RESPONSES ===
- "📊 Your 67% winrate is excellent! Keep it up."
- "⚠️ Watch out, you're on a 3-loss streak. Maybe take a break."
- "💡 Your Breakout setup has a profit of +$450. That's your strength!"
- "📈 Your best hours are 9-11am. Focus on these time slots."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes dépassée, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants. Veuillez ajouter des crédits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
