import { useMemo } from 'react';
import { Trade } from './useTrades';
import { parseISO, getHours, getDay } from 'date-fns';

export interface PersonalPattern {
  type: 'positive' | 'negative';
  category: string;
  pattern: string;
  frequency: number;
  impact: string;
  suggestion: string;
}

export interface CognitiveBias {
  type: string;
  detected: boolean;
  confidence: number; // 0-100
  description: string;
  evidence: string[];
  mitigation: string;
}

export interface PatternDetection {
  personalPatterns: PersonalPattern[];
  cognitiveBiases: CognitiveBias[];
  strengths: string[];
  weaknesses: string[];
}

export const usePatternDetection = (trades: Trade[], language: string = 'fr'): PatternDetection => {
  return useMemo(() => {
    const defaultResult: PatternDetection = {
      personalPatterns: [],
      cognitiveBiases: [],
      strengths: [],
      weaknesses: [],
    };

    if (!trades || trades.length < 10) return defaultResult;

    const patterns: PersonalPattern[] = [];
    const biases: CognitiveBias[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // ===== PERSONAL PATTERN DETECTION =====

    // 1. Time-based patterns
    const tradesByHour: Record<number, { wins: number; losses: number; total: number }> = {};
    const tradesByDay: Record<number, { wins: number; losses: number; total: number }> = {};

    trades.forEach(trade => {
      const date = parseISO(trade.trade_date);
      const hour = getHours(date);
      const day = getDay(date);

      if (!tradesByHour[hour]) tradesByHour[hour] = { wins: 0, losses: 0, total: 0 };
      if (!tradesByDay[day]) tradesByDay[day] = { wins: 0, losses: 0, total: 0 };

      tradesByHour[hour].total++;
      tradesByDay[day].total++;

      if (trade.result === 'win') {
        tradesByHour[hour].wins++;
        tradesByDay[day].wins++;
      } else if (trade.result === 'loss') {
        tradesByHour[hour].losses++;
        tradesByDay[day].losses++;
      }
    });

    // Find best/worst hours
    const hourEntries = Object.entries(tradesByHour).filter(([_, data]) => data.total >= 3);
    if (hourEntries.length > 0) {
      const bestHour = hourEntries.reduce((best, [hour, data]) => {
        const winRate = data.wins / data.total;
        const bestWinRate = best[1].wins / best[1].total;
        return winRate > bestWinRate ? [hour, data] : best;
      });
      
      const worstHour = hourEntries.reduce((worst, [hour, data]) => {
        const winRate = data.wins / data.total;
        const worstWinRate = worst[1].wins / worst[1].total;
        return winRate < worstWinRate ? [hour, data] : worst;
      });

      const bestWinRate = Math.round((bestHour[1].wins / bestHour[1].total) * 100);
      const worstWinRate = Math.round((worstHour[1].wins / worstHour[1].total) * 100);

      if (bestWinRate >= 60) {
        patterns.push({
          type: 'positive',
          category: language === 'fr' ? 'Timing' : 'Timing',
          pattern: language === 'fr' 
            ? `Meilleure performance à ${bestHour[0]}h (${bestWinRate}% winrate)`
            : `Best performance at ${bestHour[0]}:00 (${bestWinRate}% winrate)`,
          frequency: bestHour[1].total,
          impact: language === 'fr' ? 'Positif' : 'Positive',
          suggestion: language === 'fr'
            ? `Concentrez vos trades autour de ${bestHour[0]}h`
            : `Focus your trades around ${bestHour[0]}:00`,
        });
        strengths.push(language === 'fr' 
          ? `Excellent timing à ${bestHour[0]}h`
          : `Excellent timing at ${bestHour[0]}:00`
        );
      }

      if (worstWinRate < 40 && worstHour[1].total >= 5) {
        patterns.push({
          type: 'negative',
          category: language === 'fr' ? 'Timing' : 'Timing',
          pattern: language === 'fr'
            ? `Performance faible à ${worstHour[0]}h (${worstWinRate}% winrate)`
            : `Weak performance at ${worstHour[0]}:00 (${worstWinRate}% winrate)`,
          frequency: worstHour[1].total,
          impact: language === 'fr' ? 'Négatif' : 'Negative',
          suggestion: language === 'fr'
            ? `Évitez de trader à ${worstHour[0]}h`
            : `Avoid trading at ${worstHour[0]}:00`,
        });
        weaknesses.push(language === 'fr'
          ? `Performance faible à ${worstHour[0]}h`
          : `Weak performance at ${worstHour[0]}:00`
        );
      }
    }

    // 2. Setup-based patterns
    const setupStats: Record<string, { wins: number; losses: number; total: number; pnl: number }> = {};
    trades.forEach(trade => {
      const setup = trade.setup || trade.custom_setup || 'Unknown';
      if (!setupStats[setup]) setupStats[setup] = { wins: 0, losses: 0, total: 0, pnl: 0 };
      setupStats[setup].total++;
      setupStats[setup].pnl += trade.profit_loss || 0;
      if (trade.result === 'win') setupStats[setup].wins++;
      else if (trade.result === 'loss') setupStats[setup].losses++;
    });

    Object.entries(setupStats).filter(([_, data]) => data.total >= 5).forEach(([setup, data]) => {
      const winRate = (data.wins / data.total) * 100;
      if (winRate >= 70) {
        patterns.push({
          type: 'positive',
          category: 'Setup',
          pattern: language === 'fr'
            ? `Setup "${setup}" très performant (${Math.round(winRate)}%)`
            : `Setup "${setup}" highly performing (${Math.round(winRate)}%)`,
          frequency: data.total,
          impact: language === 'fr' ? 'Très positif' : 'Very positive',
          suggestion: language === 'fr'
            ? `Privilégiez ce setup dans votre trading`
            : `Prioritize this setup in your trading`,
        });
      } else if (winRate < 35) {
        patterns.push({
          type: 'negative',
          category: 'Setup',
          pattern: language === 'fr'
            ? `Setup "${setup}" sous-performant (${Math.round(winRate)}%)`
            : `Setup "${setup}" underperforming (${Math.round(winRate)}%)`,
          frequency: data.total,
          impact: language === 'fr' ? 'Négatif' : 'Negative',
          suggestion: language === 'fr'
            ? `Reconsidérez ou abandonnez ce setup`
            : `Reconsider or abandon this setup`,
        });
      }
    });

    // 3. Consecutive loss behavior
    let afterLossWins = 0;
    let afterLossLosses = 0;
    for (let i = 1; i < trades.length; i++) {
      if (trades[i - 1].result === 'loss') {
        if (trades[i].result === 'win') afterLossWins++;
        else if (trades[i].result === 'loss') afterLossLosses++;
      }
    }

    if (afterLossWins + afterLossLosses >= 5) {
      const afterLossWinRate = (afterLossWins / (afterLossWins + afterLossLosses)) * 100;
      if (afterLossWinRate < 35) {
        patterns.push({
          type: 'negative',
          category: language === 'fr' ? 'Comportement' : 'Behavior',
          pattern: language === 'fr'
            ? `Tendance à perdre après une perte (${Math.round(afterLossWinRate)}%)`
            : `Tendency to lose after a loss (${Math.round(afterLossWinRate)}%)`,
          frequency: afterLossWins + afterLossLosses,
          impact: language === 'fr' ? 'Négatif' : 'Negative',
          suggestion: language === 'fr'
            ? 'Faites une pause après chaque perte'
            : 'Take a break after each loss',
        });
        weaknesses.push(language === 'fr'
          ? 'Difficulté à se remettre après une perte'
          : 'Difficulty recovering after a loss'
        );
      } else if (afterLossWinRate >= 60) {
        strengths.push(language === 'fr'
          ? 'Bonne capacité de récupération après les pertes'
          : 'Good recovery ability after losses'
        );
      }
    }

    // ===== COGNITIVE BIAS DETECTION =====

    // 1. Confirmation Bias - Looking for trades that confirm existing beliefs
    // Detected by: Same direction trades with different setups having similar outcomes
    const longTrades = trades.filter(t => t.direction === 'long');
    const shortTrades = trades.filter(t => t.direction === 'short');
    const longWinRate = longTrades.length > 0 ? longTrades.filter(t => t.result === 'win').length / longTrades.length : 0;
    const shortWinRate = shortTrades.length > 0 ? shortTrades.filter(t => t.result === 'win').length / shortTrades.length : 0;

    if (Math.abs(longTrades.length - shortTrades.length) > trades.length * 0.4) {
      const dominant = longTrades.length > shortTrades.length ? 'long' : 'short';
      const dominantWinRate = dominant === 'long' ? longWinRate : shortWinRate;
      
      biases.push({
        type: language === 'fr' ? 'Biais de confirmation' : 'Confirmation Bias',
        detected: true,
        confidence: Math.min(80, Math.abs(longTrades.length - shortTrades.length) / trades.length * 100),
        description: language === 'fr'
          ? `Forte préférence pour les trades ${dominant} (${Math.round(dominantWinRate * 100)}% winrate)`
          : `Strong preference for ${dominant} trades (${Math.round(dominantWinRate * 100)}% winrate)`,
        evidence: [
          language === 'fr'
            ? `${longTrades.length} longs vs ${shortTrades.length} shorts`
            : `${longTrades.length} longs vs ${shortTrades.length} shorts`
        ],
        mitigation: language === 'fr'
          ? 'Analysez objectivement les opportunités dans les deux directions'
          : 'Objectively analyze opportunities in both directions',
      });
    }

    // 2. Recency Bias - Over-weighting recent trades
    const recentTrades = trades.slice(0, Math.min(10, Math.floor(trades.length * 0.2)));
    const olderTrades = trades.slice(Math.min(10, Math.floor(trades.length * 0.2)));
    
    if (recentTrades.length >= 5 && olderTrades.length >= 10) {
      const recentSetups = new Set(recentTrades.map(t => t.setup).filter(Boolean));
      const olderSetups = new Set(olderTrades.map(t => t.setup).filter(Boolean));
      
      // Check if recent setups are very different from overall pattern
      const recentLotSizes = recentTrades.map(t => t.lot_size);
      const olderLotSizes = olderTrades.map(t => t.lot_size);
      const recentAvgLot = recentLotSizes.reduce((a, b) => a + b, 0) / recentLotSizes.length;
      const olderAvgLot = olderLotSizes.reduce((a, b) => a + b, 0) / olderLotSizes.length;

      if (Math.abs(recentAvgLot - olderAvgLot) / olderAvgLot > 0.3) {
        biases.push({
          type: language === 'fr' ? 'Biais de récence' : 'Recency Bias',
          detected: true,
          confidence: Math.min(70, Math.abs(recentAvgLot - olderAvgLot) / olderAvgLot * 100),
          description: language === 'fr'
            ? 'Changement significatif de taille de position récemment'
            : 'Significant position size change recently',
          evidence: [
            language === 'fr'
              ? `Lot moyen récent: ${recentAvgLot.toFixed(2)} vs historique: ${olderAvgLot.toFixed(2)}`
              : `Recent avg lot: ${recentAvgLot.toFixed(2)} vs historical: ${olderAvgLot.toFixed(2)}`
          ],
          mitigation: language === 'fr'
            ? 'Basez vos décisions sur des données à long terme, pas sur les derniers trades'
            : 'Base your decisions on long-term data, not recent trades',
        });
      }
    }

    // 3. Overconfidence - Increasing position sizes after wins
    let winsFollowedByBiggerLot = 0;
    let totalWinsWithNextTrade = 0;
    for (let i = 0; i < trades.length - 1; i++) {
      if (trades[i].result === 'win') {
        totalWinsWithNextTrade++;
        if (trades[i + 1].lot_size > trades[i].lot_size * 1.2) {
          winsFollowedByBiggerLot++;
        }
      }
    }

    if (totalWinsWithNextTrade >= 5 && winsFollowedByBiggerLot / totalWinsWithNextTrade > 0.4) {
      biases.push({
        type: language === 'fr' ? 'Excès de confiance' : 'Overconfidence',
        detected: true,
        confidence: Math.round((winsFollowedByBiggerLot / totalWinsWithNextTrade) * 100),
        description: language === 'fr'
          ? 'Tendance à augmenter la taille après les gains'
          : 'Tendency to increase size after wins',
        evidence: [
          language === 'fr'
            ? `${winsFollowedByBiggerLot}/${totalWinsWithNextTrade} gains suivis d'une position plus grande`
            : `${winsFollowedByBiggerLot}/${totalWinsWithNextTrade} wins followed by larger position`
        ],
        mitigation: language === 'fr'
          ? 'Maintenez une taille de position constante indépendamment des résultats récents'
          : 'Maintain consistent position sizing regardless of recent results',
      });
      weaknesses.push(language === 'fr'
        ? 'Excès de confiance après les gains'
        : 'Overconfidence after wins'
      );
    }

    // 4. Loss Aversion - Holding losers too long
    const tradesWithDuration = trades.filter(t => t.duration_seconds);
    if (tradesWithDuration.length >= 10) {
      const winDurations = tradesWithDuration.filter(t => t.result === 'win').map(t => t.duration_seconds!);
      const lossDurations = tradesWithDuration.filter(t => t.result === 'loss').map(t => t.duration_seconds!);
      
      if (winDurations.length >= 3 && lossDurations.length >= 3) {
        const avgWinDuration = winDurations.reduce((a, b) => a + b, 0) / winDurations.length;
        const avgLossDuration = lossDurations.reduce((a, b) => a + b, 0) / lossDurations.length;

        if (avgLossDuration > avgWinDuration * 1.5) {
          biases.push({
            type: language === 'fr' ? 'Aversion à la perte' : 'Loss Aversion',
            detected: true,
            confidence: Math.min(80, ((avgLossDuration / avgWinDuration) - 1) * 50),
            description: language === 'fr'
              ? 'Les trades perdants sont gardés plus longtemps que les gagnants'
              : 'Losing trades are held longer than winners',
            evidence: [
              language === 'fr'
                ? `Durée moyenne perte: ${Math.round(avgLossDuration / 60)}min vs gain: ${Math.round(avgWinDuration / 60)}min`
                : `Avg loss duration: ${Math.round(avgLossDuration / 60)}min vs win: ${Math.round(avgWinDuration / 60)}min`
            ],
            mitigation: language === 'fr'
              ? 'Coupez les pertes rapidement selon votre plan'
              : 'Cut losses quickly according to your plan',
          });
        }
      }
    }

    return {
      personalPatterns: patterns,
      cognitiveBiases: biases.filter(b => b.detected),
      strengths,
      weaknesses,
    };
  }, [trades, language]);
};
