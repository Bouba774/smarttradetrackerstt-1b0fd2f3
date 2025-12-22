import { useMemo } from 'react';
import { Trade } from '@/hooks/useTrades';
import { parseISO, startOfDay, format } from 'date-fns';

export interface DisciplineMetrics {
  slRespect: number;      // % of trades with SL
  tpRespect: number;      // % of trades with TP
  planRespect: number;    // % of trades with setup defined
  riskManagement: number; // Consistent lot sizing
  noOvertrading: number;  // Not exceeding daily trade limit
}

export interface DailyDiscipline {
  date: string;
  score: number;
  trades: number;
}

export interface DisciplineAnalysis {
  overallScore: number;
  metrics: DisciplineMetrics;
  history: DailyDiscipline[];
  streak: number;
  bestStreak: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  improvements: { fr: string; en: string }[];
}

const DAILY_TRADE_LIMIT = 10;
const LOT_VARIANCE_THRESHOLD = 0.5; // 50% variance allowed

export const useDisciplineScore = (trades: Trade[]): DisciplineAnalysis => {
  return useMemo(() => {
    if (trades.length === 0) {
      return {
        overallScore: 0,
        metrics: {
          slRespect: 0,
          tpRespect: 0,
          planRespect: 0,
          riskManagement: 0,
          noOvertrading: 100,
        },
        history: [],
        streak: 0,
        bestStreak: 0,
        grade: 'F',
        improvements: [],
      };
    }

    // Calculate metrics
    const tradesWithSL = trades.filter(t => t.stop_loss !== null).length;
    const tradesWithTP = trades.filter(t => t.take_profit !== null).length;
    const tradesWithSetup = trades.filter(t => t.setup || t.custom_setup).length;
    
    const slRespect = Math.round((tradesWithSL / trades.length) * 100);
    const tpRespect = Math.round((tradesWithTP / trades.length) * 100);
    const planRespect = Math.round((tradesWithSetup / trades.length) * 100);

    // Risk management - check lot size consistency
    const lotSizes = trades.map(t => t.lot_size);
    const avgLot = lotSizes.reduce((a, b) => a + b, 0) / lotSizes.length;
    const lotVariance = lotSizes.filter(lot => 
      Math.abs(lot - avgLot) / avgLot <= LOT_VARIANCE_THRESHOLD
    ).length;
    const riskManagement = Math.round((lotVariance / trades.length) * 100);

    // Overtrading check
    const tradesByDay: Record<string, number> = {};
    trades.forEach(trade => {
      const day = format(parseISO(trade.trade_date), 'yyyy-MM-dd');
      tradesByDay[day] = (tradesByDay[day] || 0) + 1;
    });
    
    const daysTraded = Object.keys(tradesByDay).length;
    const daysOvertraded = Object.values(tradesByDay).filter(count => count > DAILY_TRADE_LIMIT).length;
    const noOvertrading = daysTraded > 0 
      ? Math.round(((daysTraded - daysOvertraded) / daysTraded) * 100) 
      : 100;

    const metrics: DisciplineMetrics = {
      slRespect,
      tpRespect,
      planRespect,
      riskManagement,
      noOvertrading,
    };

    // Calculate overall score (weighted average only on filled criteria)
    // A criterion is considered "filled" if there's data to evaluate it
    const hasSlData = trades.length > 0;
    const hasTpData = trades.length > 0;
    const hasSetupData = trades.length > 0;
    const hasRiskData = trades.length > 0;
    const hasOvertradingData = daysTraded > 0;

    // Calculate weighted score only on criteria that are actively measured
    // If a user has 0% on a metric because they haven't used it yet vs deliberately not using it
    const weights = {
      sl: hasSlData ? 0.25 : 0,
      tp: hasTpData ? 0.20 : 0,
      plan: hasSetupData ? 0.20 : 0,
      risk: hasRiskData ? 0.20 : 0,
      overtrading: hasOvertradingData ? 0.15 : 0,
    };

    const totalWeight = weights.sl + weights.tp + weights.plan + weights.risk + weights.overtrading;

    const overallScore = totalWeight > 0 ? Math.round(
      ((slRespect * weights.sl) + 
       (tpRespect * weights.tp) + 
       (planRespect * weights.plan) + 
       (riskManagement * weights.risk) + 
       (noOvertrading * weights.overtrading)) / totalWeight
    ) : 0;

    // Calculate daily discipline history
    const dailyScores: Record<string, { score: number; trades: number }> = {};
    
    Object.entries(tradesByDay).forEach(([day, count]) => {
      const dayTrades = trades.filter(t => format(parseISO(t.trade_date), 'yyyy-MM-dd') === day);
      
      const daySL = dayTrades.filter(t => t.stop_loss !== null).length / dayTrades.length;
      const dayTP = dayTrades.filter(t => t.take_profit !== null).length / dayTrades.length;
      const daySetup = dayTrades.filter(t => t.setup || t.custom_setup).length / dayTrades.length;
      const dayOvertrading = count <= DAILY_TRADE_LIMIT ? 1 : 0.5;
      
      const dayScore = Math.round(
        ((daySL * 0.3) + (dayTP * 0.25) + (daySetup * 0.25) + (dayOvertrading * 0.2)) * 100
      );
      
      dailyScores[day] = { score: dayScore, trades: count };
    });

    const history: DailyDiscipline[] = Object.entries(dailyScores)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    // Calculate streaks (days with score >= 70)
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    history.forEach((day, index) => {
      if (day.score >= 70) {
        tempStreak++;
        if (index === history.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        tempStreak = 0;
      }
    });
    
    if (tempStreak > bestStreak) bestStreak = tempStreak;

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 75) grade = 'B';
    else if (overallScore >= 60) grade = 'C';
    else if (overallScore >= 40) grade = 'D';
    else grade = 'F';

    // Generate improvement suggestions
    const improvements: { fr: string; en: string }[] = [];
    
    if (slRespect < 80) {
      improvements.push({
        fr: 'Place systématiquement un Stop Loss sur chaque trade',
        en: 'Always set a Stop Loss on every trade',
      });
    }
    if (tpRespect < 80) {
      improvements.push({
        fr: 'Définis un Take Profit pour chaque position',
        en: 'Define a Take Profit for every position',
      });
    }
    if (planRespect < 70) {
      improvements.push({
        fr: 'Documente ta stratégie/setup pour chaque trade',
        en: 'Document your strategy/setup for each trade',
      });
    }
    if (riskManagement < 70) {
      improvements.push({
        fr: 'Garde une taille de lot plus constante',
        en: 'Keep a more consistent lot size',
      });
    }
    if (noOvertrading < 80) {
      improvements.push({
        fr: 'Limite-toi à maximum 10 trades par jour',
        en: 'Limit yourself to maximum 10 trades per day',
      });
    }

    return {
      overallScore,
      metrics,
      history,
      streak: currentStreak,
      bestStreak,
      grade,
      improvements,
    };
  }, [trades]);
};
