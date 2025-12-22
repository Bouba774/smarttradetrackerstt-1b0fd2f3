import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from './useTrades';
import { parseISO } from 'date-fns';
import { getTradingDayStart, getTradingDayEnd, getNYTime } from '@/lib/timezone';

export interface DailySummary {
  strengths: string[];
  improvements: string[];
  encouragement: string;
  todayStats: {
    trades: number;
    winRate: number;
    winRateDisplay: string;
    pnl: number;
    pnlDisplay: string;
    bestTrade: number;
    worstTrade: number;
  };
  noActivity: boolean;
}

/**
 * Hook for generating AI daily trading summary
 * CRITICAL: Uses NY Time for daily reset at 17:00 NY (23:00 Cameroon)
 */
export const useAIDailySummary = (trades: Trade[], language: string = 'fr') => {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // CRITICAL: Use NY trading day boundaries (17:00 NY to 17:00 NY next day)
      const now = new Date();
      const tradingDayStart = getTradingDayStart(now);
      const tradingDayEnd = getTradingDayEnd(now);
      
      // Filter trades within the current trading day
      const todayTrades = trades.filter(trade => {
        const tradeDate = parseISO(trade.trade_date);
        return tradeDate >= tradingDayStart && tradeDate < tradingDayEnd;
      });

      // Calculate today's stats - only count closed trades for winrate
      const closedTrades = todayTrades.filter(t => 
        t.result === 'win' || t.result === 'loss' || t.result === 'breakeven'
      );
      const wins = closedTrades.filter(t => t.result === 'win').length;
      const losses = closedTrades.filter(t => t.result === 'loss').length;
      
      // Calculate PnL only from trades with valid profit_loss
      const tradesWithPnl = todayTrades.filter(t => 
        t.profit_loss !== null && t.profit_loss !== undefined && Number.isFinite(t.profit_loss)
      );
      const pnl = tradesWithPnl.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      const pnls = tradesWithPnl.map(t => t.profit_loss || 0).filter(p => p !== 0);
      const bestTrade = pnls.filter(p => p > 0).length > 0 ? Math.max(...pnls.filter(p => p > 0)) : 0;
      const worstTrade = pnls.filter(p => p < 0).length > 0 ? Math.min(...pnls.filter(p => p < 0)) : 0;

      // Winrate is calculated on closed trades only
      const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;
      
      const todayStats = {
        trades: todayTrades.length,
        winRate,
        winRateDisplay: closedTrades.length > 0 ? `${winRate}%` : '--',
        pnl: Math.round(pnl * 100) / 100,
        pnlDisplay: tradesWithPnl.length > 0 
          ? `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` 
          : '--',
        bestTrade: Math.round(bestTrade * 100) / 100,
        worstTrade: Math.round(worstTrade * 100) / 100,
      };

      // CRITICAL: If no trades, display specific message - NO HALLUCINATION
      if (todayTrades.length === 0) {
        const noActivityMessage = language === 'fr'
          ? "Aucun trade enregistré. Analyse en attente."
          : "No trades recorded. Analysis pending.";
        
        setSummary({
          strengths: [],
          improvements: [],
          encouragement: noActivityMessage,
          todayStats: {
            trades: 0,
            winRate: 0,
            winRateDisplay: '--',
            pnl: 0,
            pnlDisplay: '--',
            bestTrade: 0,
            worstTrade: 0,
          },
          noActivity: true,
        });
        return;
      }

      // Extract improvement points from trade notes and emotions
      const tradeNotes = todayTrades
        .map(t => t.notes)
        .filter((note): note is string => !!note && note.trim().length > 0);
      
      const tradeEmotions = todayTrades
        .map(t => t.emotions)
        .filter((emotion): emotion is string => !!emotion && emotion.trim().length > 0);

      const setups = todayTrades.map(t => t.setup || t.custom_setup).filter(Boolean);
      const hasStopLoss = todayTrades.filter(t => t.stop_loss !== null).length;
      const hasTakeProfit = todayTrades.filter(t => t.take_profit !== null).length;
      const disciplineRate = todayTrades.length > 0 
        ? Math.round(((hasStopLoss + hasTakeProfit) / (todayTrades.length * 2)) * 100) 
        : 0;

      const contextData = {
        trades: todayStats.trades,
        wins,
        losses,
        winRate: todayStats.winRate,
        pnl: todayStats.pnl,
        emotions: tradeEmotions.join(', '),
        notes: tradeNotes.slice(0, 5).join(' | '), // Limit notes to avoid too long context
        setups: setups.join(', '),
        disciplineRate,
        bestTrade,
        worstTrade,
      };

      const systemPrompt = language === 'fr' 
        ? `Tu es un coach de trading bienveillant. Analyse les performances de trading du jour et donne un résumé en français.
           
           RÈGLES IMPORTANTES:
           - Les "improvements" doivent être extraits des notes et émotions RÉELLES des trades si disponibles
           - Si les notes mentionnent des erreurs, les inclure dans "improvements"
           - Sois spécifique basé sur les données réelles, pas générique
           
           Format ta réponse en JSON avec:
           - "strengths": array de 2-3 points forts basés sur les stats réelles
           - "improvements": array de 2-3 axes d'amélioration basés sur les notes/émotions
           - "encouragement": une phrase motivante personnalisée
           
           Si les notes sont vides, base-toi sur les stats (winrate, discipline, etc.)`
        : `You are a supportive trading coach. Analyze today's trading performance and provide a summary in English.
           
           IMPORTANT RULES:
           - "improvements" must be extracted from REAL trade notes and emotions if available
           - If notes mention errors, include them in "improvements"
           - Be specific based on real data, not generic
           
           Format your response as JSON with:
           - "strengths": array of 2-3 strengths based on real stats
           - "improvements": array of 2-3 improvements based on notes/emotions
           - "encouragement": a personalized motivational phrase
           
           If notes are empty, base on stats (winrate, discipline, etc.)`;

      const userPrompt = `Données de trading du jour:
- Trades: ${contextData.trades}
- Gains: ${contextData.wins}, Pertes: ${contextData.losses}
- Winrate: ${contextData.winRate}%
- PnL total: ${contextData.pnl}$
- Meilleur trade: ${contextData.bestTrade}$
- Pire trade: ${contextData.worstTrade}$
- Score discipline (SL/TP): ${contextData.disciplineRate}%
- Émotions ressenties: ${contextData.emotions || 'Non renseignées'}
- Notes des trades: ${contextData.notes || 'Aucune note'}
- Setups utilisés: ${contextData.setups || 'Non renseignés'}`;

      const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
      });

      if (fnError) throw fnError;

      // Parse AI response
      let aiResponse;
      try {
        const jsonMatch = data.response?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch {
        // Fallback based on actual stats
        aiResponse = {
          strengths: todayStats.winRate >= 50 
            ? [language === 'fr' ? `Bon winrate de ${todayStats.winRate}%` : `Good win rate of ${todayStats.winRate}%`]
            : disciplineRate >= 80
              ? [language === 'fr' ? 'Bonne discipline avec SL/TP' : 'Good discipline with SL/TP']
              : [language === 'fr' ? 'Tu as tradé aujourd\'hui' : 'You traded today'],
          improvements: tradeNotes.length > 0
            ? [language === 'fr' ? 'Analyse tes notes pour identifier les patterns' : 'Analyze your notes to identify patterns']
            : [language === 'fr' ? 'Ajoute des notes à tes trades' : 'Add notes to your trades'],
          encouragement: language === 'fr' 
            ? 'Chaque trade est une leçon!' 
            : 'Every trade is a lesson!',
        };
      }

      setSummary({
        ...aiResponse,
        todayStats,
        noActivity: false,
      });
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
      
      // Provide fallback summary using NY trading day
      const now = new Date();
      const tradingDayStart = getTradingDayStart(now);
      const tradingDayEnd = getTradingDayEnd(now);
      const todayTrades = trades.filter(trade => {
        const tradeDate = parseISO(trade.trade_date);
        return tradeDate >= tradingDayStart && tradeDate < tradingDayEnd;
      });

      const noActivity = todayTrades.length === 0;

      setSummary({
        strengths: noActivity ? [] : [language === 'fr' ? 'Tu as tradé aujourd\'hui' : 'You traded today'],
        improvements: noActivity ? [] : [language === 'fr' ? 'Continue demain' : 'Keep going tomorrow'],
        encouragement: noActivity 
          ? (language === 'fr' ? 'Aucune activité enregistrée.' : 'No activity recorded.')
          : (language === 'fr' ? 'Reste discipliné!' : 'Stay disciplined!'),
        todayStats: {
          trades: todayTrades.length,
          winRate: 0,
          winRateDisplay: '--',
          pnl: 0,
          pnlDisplay: '--',
          bestTrade: 0,
          worstTrade: 0,
        },
        noActivity,
      });
    } finally {
      setIsLoading(false);
    }
  }, [trades, language]);

  return {
    summary,
    isLoading,
    error,
    generateSummary,
  };
};
