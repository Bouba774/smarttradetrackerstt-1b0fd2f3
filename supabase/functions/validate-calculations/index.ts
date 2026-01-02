import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts";

interface TradeData {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  pendingTrades: number;
  buyPositions: number;
  sellPositions: number;
  totalPnL: number;
  bestProfit: number;
  worstLoss: number;
  winrate: number;
}

interface DisciplineData {
  slRespect: number;
  tpRespect: number;
  planRespect: number;
  riskManagement: number;
  noOvertrading: number;
  overallScore: number;
}

interface SessionData {
  sessions: {
    session: string;
    trades: number;
    winRate: number;
    pnl: number;
  }[];
}

interface HeatmapData {
  bestDay: { day: string; pnl: number } | null;
  worstDay: { day: string; pnl: number } | null;
  bestHour: { hour: string; pnl: number } | null;
  worstHour: { hour: string; pnl: number } | null;
}

interface ValidationRequest {
  trades: TradeData;
  discipline: DisciplineData;
  sessions: SessionData;
  heatmap: HeatmapData;
  sabotageScore: number;
  language: string;
}

interface ValidationResult {
  isValid: boolean;
  corrections: {
    field: string;
    issue: string;
    suggestion: string;
  }[];
  insights: string[];
  aiSummary: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const data: ValidationRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { trades, discipline, sessions, heatmap, sabotageScore, language } = data;

    // Local validation checks first
    const corrections: ValidationResult['corrections'] = [];
    const insights: string[] = [];

    // 1. Validate winrate calculation
    if (trades.totalTrades > 0) {
      const expectedWinrate = Math.round((trades.winningTrades / trades.totalTrades) * 100);
      if (Math.abs(expectedWinrate - trades.winrate) > 1) {
        corrections.push({
          field: 'winrate',
          issue: `Winrate affiché (${trades.winrate}%) ne correspond pas au calcul (${expectedWinrate}%)`,
          suggestion: `Le winrate correct est ${expectedWinrate}%`,
        });
      }
    }

    // 2. Validate that winning + losing + pending matches total
    const calculatedTotal = trades.winningTrades + trades.losingTrades + trades.pendingTrades;
    if (calculatedTotal !== trades.totalTrades && trades.totalTrades > 0) {
      // This might be because of breakeven trades
      const breakeven = trades.totalTrades - calculatedTotal;
      if (breakeven > 0) {
        insights.push(
          language === 'fr'
            ? `${breakeven} trade(s) en breakeven non comptabilisé(s)`
            : `${breakeven} breakeven trade(s) not counted`
        );
      }
    }

    // 3. Validate buy + sell matches total (for all trades)
    if (trades.buyPositions + trades.sellPositions !== trades.totalTrades + trades.pendingTrades) {
      insights.push(
        language === 'fr'
          ? `Les positions Buy (${trades.buyPositions}) + Sell (${trades.sellPositions}) ne correspondent pas au total des trades`
          : `Buy (${trades.buyPositions}) + Sell (${trades.sellPositions}) positions don't match total trades`
      );
    }

    // 4. Validate heatmap logic
    if (heatmap.bestDay && heatmap.worstDay && heatmap.bestDay.day === heatmap.worstDay.day && heatmap.bestDay.pnl > 0) {
      corrections.push({
        field: 'heatmap',
        issue: language === 'fr' 
          ? `Le meilleur jour et le pire jour sont identiques avec un PnL positif`
          : `Best and worst day are the same with positive PnL`,
        suggestion: language === 'fr'
          ? `Ne pas afficher "Pire Jour" s'il n'y a qu'un seul jour de trading positif`
          : `Don't show "Worst Day" if there's only one positive trading day`,
      });
    }

    // 5. Validate session analysis
    const emptySessions = sessions.sessions.filter(s => s.trades === 0);
    if (emptySessions.length > 0) {
      insights.push(
        language === 'fr'
          ? `Sessions sans trades: ${emptySessions.map(s => s.session).join(', ')}`
          : `Sessions without trades: ${emptySessions.map(s => s.session).join(', ')}`
      );
    }

    // 6. Validate discipline score logic
    if (discipline.noOvertrading > 100 || discipline.noOvertrading < 0) {
      corrections.push({
        field: 'noOvertrading',
        issue: language === 'fr'
          ? `Score "Pas d'overtrading" invalide: ${discipline.noOvertrading}%`
          : `Invalid "No overtrading" score: ${discipline.noOvertrading}%`,
        suggestion: language === 'fr'
          ? `Le score doit être entre 0% et 100%`
          : `Score should be between 0% and 100%`,
      });
    }

    // 7. Validate sabotage score interpretation
    if (sabotageScore === 0 && trades.totalTrades >= 5) {
      insights.push(
        language === 'fr'
          ? `✅ Excellent! Aucun comportement d'auto-sabotage détecté`
          : `✅ Excellent! No self-sabotage behavior detected`
      );
    }

    // Generate AI summary using Lovable AI
    const systemPrompt = language === 'fr'
      ? `Tu es un analyste de trading expert. Génère un résumé court (2-3 phrases) des performances de trading basé sur les données fournies. Sois constructif et précis. Ne mentionne pas les erreurs techniques, concentre-toi sur les insights trading.`
      : `You are an expert trading analyst. Generate a short summary (2-3 sentences) of trading performance based on the provided data. Be constructive and precise. Don't mention technical errors, focus on trading insights.`;

    const userPrompt = `
Trading Data:
- Total trades: ${trades.totalTrades}
- Win rate: ${trades.winrate}%
- Total PnL: ${trades.totalPnL}
- Best profit: ${trades.bestProfit}
- Worst loss: ${trades.worstLoss}
- Discipline score: ${discipline.overallScore}/100
- Sabotage score: ${sabotageScore}/100 (lower is better)
${heatmap.bestDay ? `- Best trading day: ${heatmap.bestDay.day}` : ''}
${sessions.sessions.filter(s => s.trades > 0).length > 0 
  ? `- Active sessions: ${sessions.sessions.filter(s => s.trades > 0).map(s => `${s.session} (${s.winRate}%)`).join(', ')}` 
  : ''}

Provide 2-3 sentences of actionable trading insights.`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limits exceeded, please try again later.",
          isValid: corrections.length === 0,
          corrections,
          insights,
          aiSummary: language === 'fr' 
            ? "Analyse IA temporairement indisponible." 
            : "AI analysis temporarily unavailable."
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Payment required",
          isValid: corrections.length === 0,
          corrections,
          insights,
          aiSummary: language === 'fr' 
            ? "Analyse IA temporairement indisponible." 
            : "AI analysis temporarily unavailable."
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiSummary = aiData.choices?.[0]?.message?.content || 
      (language === 'fr' ? "Analyse en cours..." : "Analysis in progress...");

    const result: ValidationResult = {
      isValid: corrections.length === 0,
      corrections,
      insights,
      aiSummary,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Validation error:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      isValid: true,
      corrections: [],
      insights: [],
      aiSummary: "",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
