import { useMemo } from 'react';
import { Trade } from '@/hooks/useTrades';
import { parseISO, differenceInMinutes, differenceInHours, isSameDay } from 'date-fns';

export interface SabotageAlert {
  type: 'trading_after_loss' | 'lot_increase_after_win' | 'emotional_trading' | 'revenge_trading' | 'overtrading' | 'fomo';
  severity: 'warning' | 'danger';
  message: { fr: string; en: string };
  count: number;
  details: string[];
}

export interface SelfSabotageAnalysis {
  alerts: SabotageAlert[];
  sabotageScore: number; // 0-100, lower is better
  patterns: {
    tradingAfterLoss: number;
    lotIncreaseAfterWin: number;
    emotionalTrades: number;
    revengeTrades: number;
    overtradingDays: number;
  };
  recommendations: { fr: string; en: string }[];
}

export const useSelfSabotage = (trades: Trade[], language: string = 'fr'): SelfSabotageAnalysis => {
  return useMemo(() => {
    const alerts: SabotageAlert[] = [];
    const patterns = {
      tradingAfterLoss: 0,
      lotIncreaseAfterWin: 0,
      emotionalTrades: 0,
      revengeTrades: 0,
      overtradingDays: 0,
    };
    const details: Record<string, string[]> = {
      tradingAfterLoss: [],
      lotIncreaseAfterWin: [],
      emotionalTrades: [],
      revengeTrades: [],
      overtradingDays: [],
    };

    if (trades.length < 2) {
      return {
        alerts: [],
        sabotageScore: 0,
        patterns,
        recommendations: [],
      };
    }

    // Sort trades by date
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

    // Analyze trading after loss
    for (let i = 1; i < sortedTrades.length; i++) {
      const prevTrade = sortedTrades[i - 1];
      const currentTrade = sortedTrades[i];
      
      if (prevTrade.result === 'loss') {
        const minutesDiff = differenceInMinutes(
          parseISO(currentTrade.trade_date),
          parseISO(prevTrade.trade_date)
        );
        
        if (minutesDiff < 30 && minutesDiff >= 0) {
          patterns.tradingAfterLoss++;
          details.tradingAfterLoss.push(`Trade ${i + 1}: ${minutesDiff}min après perte`);
        }
      }
    }

    // Analyze lot increase after win
    for (let i = 1; i < sortedTrades.length; i++) {
      const prevTrade = sortedTrades[i - 1];
      const currentTrade = sortedTrades[i];
      
      if (prevTrade.result === 'win' && currentTrade.lot_size > prevTrade.lot_size * 1.5) {
        patterns.lotIncreaseAfterWin++;
        details.lotIncreaseAfterWin.push(
          `Lot: ${prevTrade.lot_size} → ${currentTrade.lot_size} (+${Math.round((currentTrade.lot_size / prevTrade.lot_size - 1) * 100)}%)`
        );
      }
    }

    // Analyze emotional trading
    const negativeEmotions = ['Stressé', 'Impulsif', 'Frustré', 'Anxieux', 'Fatigué', 'Euphorique'];
    sortedTrades.forEach(trade => {
      if (trade.emotions && negativeEmotions.some(e => trade.emotions?.includes(e))) {
        patterns.emotionalTrades++;
        details.emotionalTrades.push(`${trade.asset}: ${trade.emotions}`);
      }
    });

    // Analyze revenge trading (multiple losses followed by quick trade)
    let consecutiveLosses = 0;
    for (let i = 0; i < sortedTrades.length; i++) {
      const trade = sortedTrades[i];
      
      if (trade.result === 'loss') {
        consecutiveLosses++;
      } else {
        if (consecutiveLosses >= 2 && i < sortedTrades.length - 1) {
          const nextTrade = sortedTrades[i + 1];
          const hoursDiff = differenceInHours(
            parseISO(nextTrade.trade_date),
            parseISO(trade.trade_date)
          );
          
          if (hoursDiff < 1 && hoursDiff >= 0) {
            patterns.revengeTrades++;
            details.revengeTrades.push(`Après ${consecutiveLosses} pertes consécutives`);
          }
        }
        consecutiveLosses = 0;
      }
    }

    // Analyze overtrading days
    const tradesByDay: Record<string, number> = {};
    sortedTrades.forEach(trade => {
      const day = trade.trade_date.split('T')[0];
      tradesByDay[day] = (tradesByDay[day] || 0) + 1;
    });
    
    Object.entries(tradesByDay).forEach(([day, count]) => {
      if (count > 10) {
        patterns.overtradingDays++;
        details.overtradingDays.push(`${day}: ${count} trades`);
      }
    });

    // Generate alerts
    if (patterns.tradingAfterLoss >= 3) {
      alerts.push({
        type: 'trading_after_loss',
        severity: patterns.tradingAfterLoss >= 5 ? 'danger' : 'warning',
        message: {
          fr: 'Tu trades trop vite après une perte',
          en: 'You trade too quickly after a loss',
        },
        count: patterns.tradingAfterLoss,
        details: details.tradingAfterLoss.slice(0, 3),
      });
    }

    if (patterns.lotIncreaseAfterWin >= 2) {
      alerts.push({
        type: 'lot_increase_after_win',
        severity: patterns.lotIncreaseAfterWin >= 4 ? 'danger' : 'warning',
        message: {
          fr: 'Tu augmentes ton lot après un gain',
          en: 'You increase lot size after a win',
        },
        count: patterns.lotIncreaseAfterWin,
        details: details.lotIncreaseAfterWin.slice(0, 3),
      });
    }

    if (patterns.emotionalTrades >= 5) {
      alerts.push({
        type: 'emotional_trading',
        severity: patterns.emotionalTrades >= 10 ? 'danger' : 'warning',
        message: {
          fr: 'Trading émotionnel détecté',
          en: 'Emotional trading detected',
        },
        count: patterns.emotionalTrades,
        details: details.emotionalTrades.slice(0, 3),
      });
    }

    if (patterns.revengeTrades >= 2) {
      alerts.push({
        type: 'revenge_trading',
        severity: 'danger',
        message: {
          fr: 'Pattern de revenge trading détecté',
          en: 'Revenge trading pattern detected',
        },
        count: patterns.revengeTrades,
        details: details.revengeTrades.slice(0, 3),
      });
    }

    if (patterns.overtradingDays >= 2) {
      alerts.push({
        type: 'overtrading',
        severity: 'warning',
        message: {
          fr: 'Tendance à l\'overtrading',
          en: 'Overtrading tendency detected',
        },
        count: patterns.overtradingDays,
        details: details.overtradingDays.slice(0, 3),
      });
    }

    // Calculate sabotage score
    const totalIssues = 
      patterns.tradingAfterLoss * 2 +
      patterns.lotIncreaseAfterWin * 3 +
      patterns.emotionalTrades +
      patterns.revengeTrades * 4 +
      patterns.overtradingDays * 2;
    
    const maxExpected = trades.length * 0.3;
    const sabotageScore = Math.min(100, Math.round((totalIssues / Math.max(maxExpected, 1)) * 100));

    // Generate recommendations
    const recommendations: { fr: string; en: string }[] = [];
    
    if (patterns.tradingAfterLoss > 0) {
      recommendations.push({
        fr: 'Attends au moins 30 minutes après une perte avant de reprendre',
        en: 'Wait at least 30 minutes after a loss before trading again',
      });
    }
    
    if (patterns.lotIncreaseAfterWin > 0) {
      recommendations.push({
        fr: 'Garde une taille de position constante, indépendamment des résultats précédents',
        en: 'Keep position size consistent regardless of previous results',
      });
    }
    
    if (patterns.emotionalTrades > 0) {
      recommendations.push({
        fr: 'Évite de trader quand tu te sens stressé ou impulsif',
        en: 'Avoid trading when feeling stressed or impulsive',
      });
    }

    return {
      alerts,
      sabotageScore,
      patterns,
      recommendations,
    };
  }, [trades, language]);
};
