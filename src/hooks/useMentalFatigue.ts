import { useMemo } from 'react';
import { Trade } from './useTrades';
import { parseISO, differenceInHours, isToday, subDays, isWithinInterval } from 'date-fns';

export interface MentalFatigueIndex {
  score: number; // 0-100, higher = more fatigued
  level: 'low' | 'moderate' | 'high' | 'critical';
  factors: {
    name: string;
    contribution: number;
    detail: string;
  }[];
  recommendation: string;
  shouldPause: boolean;
}

export const useMentalFatigue = (trades: Trade[], language: string = 'fr'): MentalFatigueIndex => {
  return useMemo(() => {
    const now = new Date();
    const todayTrades = trades.filter(t => isToday(parseISO(t.trade_date)));
    const last24hTrades = trades.filter(t => {
      const tradeDate = parseISO(t.trade_date);
      return differenceInHours(now, tradeDate) <= 24;
    });
    const last7dTrades = trades.filter(t => {
      const tradeDate = parseISO(t.trade_date);
      return isWithinInterval(tradeDate, { start: subDays(now, 7), end: now });
    });

    let fatigueScore = 0;
    const factors: MentalFatigueIndex['factors'] = [];

    // Factor 1: Trading hours today
    if (todayTrades.length > 0) {
      const tradeTimes = todayTrades.map(t => parseISO(t.trade_date));
      const firstTrade = Math.min(...tradeTimes.map(d => d.getTime()));
      const lastTrade = Math.max(...tradeTimes.map(d => d.getTime()));
      const hoursTrading = differenceInHours(new Date(lastTrade), new Date(firstTrade));

      let hourContribution = 0;
      let hourDetail = '';

      if (hoursTrading >= 8) {
        hourContribution = 30;
        hourDetail = language === 'fr' ? `${hoursTrading}h de trading - très long` : `${hoursTrading}h trading - very long`;
      } else if (hoursTrading >= 6) {
        hourContribution = 20;
        hourDetail = language === 'fr' ? `${hoursTrading}h de trading - long` : `${hoursTrading}h trading - long`;
      } else if (hoursTrading >= 4) {
        hourContribution = 10;
        hourDetail = language === 'fr' ? `${hoursTrading}h de trading` : `${hoursTrading}h trading`;
      } else {
        hourDetail = language === 'fr' ? `${hoursTrading}h de trading - normal` : `${hoursTrading}h trading - normal`;
      }

      fatigueScore += hourContribution;
      factors.push({
        name: language === 'fr' ? 'Durée de session' : 'Session duration',
        contribution: hourContribution,
        detail: hourDetail,
      });
    }

    // Factor 2: Consecutive trades
    const consecutiveContribution = Math.min(30, todayTrades.length * 3);
    if (todayTrades.length > 0) {
      factors.push({
        name: language === 'fr' ? 'Trades consécutifs' : 'Consecutive trades',
        contribution: consecutiveContribution,
        detail: language === 'fr' 
          ? `${todayTrades.length} trades aujourd'hui`
          : `${todayTrades.length} trades today`,
      });
      fatigueScore += consecutiveContribution;
    }

    // Factor 3: Successive losses
    const recentTrades = [...todayTrades].sort((a, b) => 
      parseISO(b.trade_date).getTime() - parseISO(a.trade_date).getTime()
    );
    
    let consecutiveLosses = 0;
    for (const trade of recentTrades) {
      if (trade.result === 'loss') consecutiveLosses++;
      else break;
    }

    let lossContribution = 0;
    if (consecutiveLosses >= 5) {
      lossContribution = 35;
    } else if (consecutiveLosses >= 3) {
      lossContribution = 25;
    } else if (consecutiveLosses >= 2) {
      lossContribution = 15;
    } else if (consecutiveLosses === 1) {
      lossContribution = 5;
    }

    if (consecutiveLosses > 0) {
      factors.push({
        name: language === 'fr' ? 'Pertes successives' : 'Successive losses',
        contribution: lossContribution,
        detail: language === 'fr'
          ? `${consecutiveLosses} perte(s) consécutive(s)`
          : `${consecutiveLosses} consecutive loss(es)`,
      });
      fatigueScore += lossContribution;
    }

    // Factor 4: Total PnL impact (negative P&L adds stress)
    const todayPnL = todayTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    let pnlContribution = 0;
    if (todayPnL < -100) {
      pnlContribution = 20;
    } else if (todayPnL < -50) {
      pnlContribution = 10;
    } else if (todayPnL < 0) {
      pnlContribution = 5;
    }

    if (todayPnL < 0) {
      factors.push({
        name: language === 'fr' ? 'P&L négatif' : 'Negative P&L',
        contribution: pnlContribution,
        detail: language === 'fr'
          ? `${todayPnL.toFixed(2)} aujourd'hui`
          : `${todayPnL.toFixed(2)} today`,
      });
      fatigueScore += pnlContribution;
    }

    // Factor 5: Weekly trading intensity
    const avgTradesPerDay = last7dTrades.length / 7;
    let intensityContribution = 0;
    if (avgTradesPerDay > 10) {
      intensityContribution = 15;
    } else if (avgTradesPerDay > 5) {
      intensityContribution = 8;
    }

    if (intensityContribution > 0) {
      factors.push({
        name: language === 'fr' ? 'Intensité hebdo' : 'Weekly intensity',
        contribution: intensityContribution,
        detail: language === 'fr'
          ? `~${avgTradesPerDay.toFixed(1)} trades/jour`
          : `~${avgTradesPerDay.toFixed(1)} trades/day`,
      });
      fatigueScore += intensityContribution;
    }

    // Determine level and recommendation
    fatigueScore = Math.min(100, fatigueScore);

    let level: MentalFatigueIndex['level'] = 'low';
    let recommendation = '';
    let shouldPause = false;

    if (fatigueScore >= 70) {
      level = 'critical';
      recommendation = language === 'fr'
        ? '🛑 Pause recommandée – fatigue détectée. Arrêtez de trader maintenant.'
        : '🛑 Break recommended – fatigue detected. Stop trading now.';
      shouldPause = true;
    } else if (fatigueScore >= 50) {
      level = 'high';
      recommendation = language === 'fr'
        ? '⚠️ Niveau de fatigue élevé. Envisagez une pause de 30 minutes.'
        : '⚠️ High fatigue level. Consider a 30-minute break.';
      shouldPause = true;
    } else if (fatigueScore >= 30) {
      level = 'moderate';
      recommendation = language === 'fr'
        ? '📊 Fatigue modérée. Restez vigilant et suivez votre plan.'
        : '📊 Moderate fatigue. Stay vigilant and follow your plan.';
    } else {
      level = 'low';
      recommendation = language === 'fr'
        ? '✅ Niveau d\'énergie bon. Conditions optimales pour trader.'
        : '✅ Good energy level. Optimal conditions for trading.';
    }

    return {
      score: fatigueScore,
      level,
      factors,
      recommendation,
      shouldPause,
    };
  }, [trades, language]);
};
