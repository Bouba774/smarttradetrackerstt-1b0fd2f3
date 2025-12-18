import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from './useTrades';
import { format, isToday, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';

export interface DailySummary {
  strengths: string[];
  improvements: string[];
  encouragement: string;
  todayStats: {
    trades: number;
    winRate: number;
    pnl: number;
    bestTrade: number;
    worstTrade: number;
  };
}

export const useAIDailySummary = (trades: Trade[], language: string = 'fr') => {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get today's trades
      const today = new Date();
      const todayTrades = trades.filter(trade => {
        const tradeDate = parseISO(trade.trade_date);
        return isWithinInterval(tradeDate, {
          start: startOfDay(today),
          end: endOfDay(today),
        });
      });

      // Calculate today's stats
      const wins = todayTrades.filter(t => t.result === 'win').length;
      const losses = todayTrades.filter(t => t.result === 'loss').length;
      const pnl = todayTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      const pnls = todayTrades.map(t => t.profit_loss || 0);
      const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
      const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;

      const todayStats = {
        trades: todayTrades.length,
        winRate: todayTrades.length > 0 ? Math.round((wins / todayTrades.length) * 100) : 0,
        pnl: Math.round(pnl * 100) / 100,
        bestTrade: Math.round(bestTrade * 100) / 100,
        worstTrade: Math.round(worstTrade * 100) / 100,
      };

      // Build context for AI
      const emotions = todayTrades.map(t => t.emotions).filter(Boolean);
      const setups = todayTrades.map(t => t.setup || t.custom_setup).filter(Boolean);
      const hasStopLoss = todayTrades.filter(t => t.stop_loss !== null).length;
      const hasTakeProfit = todayTrades.filter(t => t.take_profit !== null).length;

      const contextData = {
        trades: todayStats.trades,
        wins,
        losses,
        winRate: todayStats.winRate,
        pnl: todayStats.pnl,
        emotions: emotions.join(', '),
        setups: setups.join(', '),
        disciplineRate: todayTrades.length > 0 
          ? Math.round(((hasStopLoss + hasTakeProfit) / (todayTrades.length * 2)) * 100) 
          : 0,
        bestTrade,
        worstTrade,
      };

      const systemPrompt = language === 'fr' 
        ? `Tu es un coach de trading bienveillant. Analyse les performances de trading du jour et donne un résumé en français.
           Format ta réponse en JSON avec:
           - "strengths": array de 2-3 points forts (commence par "Aujourd'hui tu as bien fait...")
           - "improvements": array de 2-3 axes d'amélioration (commence par "À améliorer demain...")
           - "encouragement": une phrase motivante personnalisée
           Sois spécifique et constructif.`
        : `You are a supportive trading coach. Analyze today's trading performance and provide a summary in English.
           Format your response as JSON with:
           - "strengths": array of 2-3 strengths (start with "Today you did well...")
           - "improvements": array of 2-3 improvements (start with "To improve tomorrow...")
           - "encouragement": a personalized motivational phrase
           Be specific and constructive.`;

      const userPrompt = `Voici les données de trading du jour:
- Trades: ${contextData.trades}
- Gains: ${contextData.wins}, Pertes: ${contextData.losses}
- Winrate: ${contextData.winRate}%
- PnL total: ${contextData.pnl}$
- Meilleur trade: ${contextData.bestTrade}$
- Pire trade: ${contextData.worstTrade}$
- Émotions: ${contextData.emotions || 'Non renseignées'}
- Setups utilisés: ${contextData.setups || 'Non renseignés'}
- Score discipline (SL/TP): ${contextData.disciplineRate}%`;

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
        // Extract JSON from response
        const jsonMatch = data.response?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch {
        // Fallback if parsing fails
        aiResponse = {
          strengths: todayStats.winRate >= 50 
            ? [language === 'fr' ? 'Bon taux de réussite aujourd\'hui' : 'Good win rate today']
            : [language === 'fr' ? 'Tu as tradé avec discipline' : 'You traded with discipline'],
          improvements: [
            language === 'fr' ? 'Continue à respecter ton plan' : 'Keep following your plan',
          ],
          encouragement: language === 'fr' 
            ? 'Chaque jour est une opportunité d\'apprentissage!' 
            : 'Every day is a learning opportunity!',
        };
      }

      setSummary({
        ...aiResponse,
        todayStats,
      });
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
      
      // Provide fallback summary
      const today = new Date();
      const todayTrades = trades.filter(trade => {
        const tradeDate = parseISO(trade.trade_date);
        return isWithinInterval(tradeDate, {
          start: startOfDay(today),
          end: endOfDay(today),
        });
      });

      setSummary({
        strengths: [language === 'fr' ? 'Tu as tradé aujourd\'hui' : 'You traded today'],
        improvements: [language === 'fr' ? 'Continue demain' : 'Keep going tomorrow'],
        encouragement: language === 'fr' ? 'Reste discipliné!' : 'Stay disciplined!',
        todayStats: {
          trades: todayTrades.length,
          winRate: 0,
          pnl: 0,
          bestTrade: 0,
          worstTrade: 0,
        },
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
