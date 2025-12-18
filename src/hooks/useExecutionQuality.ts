import { useMemo } from 'react';
import { Trade } from './useTrades';

export interface ExecutionQuality {
  entryTiming: {
    score: number;
    label: string;
    detail: string;
  };
  slSizing: {
    score: number;
    label: string;
    detail: string;
  };
  tpOptimization: {
    score: number;
    label: string;
    detail: string;
  };
  overallScore: number;
}

export const useExecutionQuality = (trades: Trade[], language: 'fr' | 'en' = 'fr'): ExecutionQuality => {
  return useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        entryTiming: { score: 0, label: language === 'fr' ? 'Aucune donnée' : 'No data', detail: '' },
        slSizing: { score: 0, label: language === 'fr' ? 'Aucune donnée' : 'No data', detail: '' },
        tpOptimization: { score: 0, label: language === 'fr' ? 'Aucune donnée' : 'No data', detail: '' },
        overallScore: 0,
      };
    }

    const closedTrades = trades.filter(t => t.result && t.result !== 'pending');
    if (closedTrades.length === 0) {
      return {
        entryTiming: { score: 0, label: language === 'fr' ? 'Aucune donnée' : 'No data', detail: '' },
        slSizing: { score: 0, label: language === 'fr' ? 'Aucune donnée' : 'No data', detail: '' },
        tpOptimization: { score: 0, label: language === 'fr' ? 'Aucune donnée' : 'No data', detail: '' },
        overallScore: 0,
      };
    }

    // Entry Timing Analysis
    // Good entry = price moved in intended direction after entry
    // Calculate based on win rate and how close entry was to ideal
    let goodEntries = 0;
    let earlyEntries = 0;
    let lateEntries = 0;

    closedTrades.forEach(trade => {
      const isLong = trade.direction === 'long';
      const entryPrice = trade.entry_price;
      const exitPrice = trade.exit_price || entryPrice;
      const sl = trade.stop_loss;
      const tp = trade.take_profit;

      if (sl && tp) {
        const totalRange = Math.abs(tp - sl);
        const entryFromSL = Math.abs(entryPrice - sl);
        const entryPosition = entryFromSL / totalRange;

        // For a long trade, ideal entry is closer to SL
        // For a short trade, ideal entry is closer to TP (which is below entry)
        if (isLong) {
          if (entryPosition < 0.3) goodEntries++;
          else if (entryPosition < 0.5) earlyEntries++; // Could have waited
          else lateEntries++;
        } else {
          if (entryPosition > 0.7) goodEntries++;
          else if (entryPosition > 0.5) earlyEntries++;
          else lateEntries++;
        }
      } else {
        // Without SL/TP, use result as proxy
        if (trade.result === 'win') goodEntries++;
        else if (trade.result === 'loss') lateEntries++;
        else earlyEntries++;
      }
    });

    const entryScore = Math.round((goodEntries / closedTrades.length) * 100);
    let entryLabel = '';
    let entryDetail = '';

    if (entryScore >= 70) {
      entryLabel = language === 'fr' ? 'Optimal' : 'Optimal';
      entryDetail = language === 'fr' ? 'Vos entrées sont bien chronométrées' : 'Your entries are well-timed';
    } else if (entryScore >= 50) {
      entryLabel = language === 'fr' ? 'Acceptable' : 'Acceptable';
      entryDetail = language === 'fr' ? 'Amélioration possible sur le timing' : 'Room for timing improvement';
    } else if (lateEntries > earlyEntries) {
      entryLabel = language === 'fr' ? 'Trop tard' : 'Too late';
      entryDetail = language === 'fr' ? 'Tendance à entrer après le mouvement' : 'Tendency to enter after the move';
    } else {
      entryLabel = language === 'fr' ? 'Trop tôt' : 'Too early';
      entryDetail = language === 'fr' ? 'Tendance à entrer avant confirmation' : 'Tendency to enter before confirmation';
    }

    // SL Sizing Analysis
    const tradesWithSL = closedTrades.filter(t => t.stop_loss);
    let tightSL = 0;
    let wideSL = 0;
    let optimalSL = 0;

    tradesWithSL.forEach(trade => {
      const entryPrice = trade.entry_price;
      const sl = trade.stop_loss!;
      const slDistance = Math.abs(entryPrice - sl);
      const slPercentage = (slDistance / entryPrice) * 100;

      // Typical SL ranges: <0.5% is tight, 0.5-2% is optimal, >2% is wide
      if (slPercentage < 0.3) tightSL++;
      else if (slPercentage <= 2) optimalSL++;
      else wideSL++;
    });

    const slScore = tradesWithSL.length > 0 
      ? Math.round((optimalSL / tradesWithSL.length) * 100) 
      : 0;
    
    let slLabel = '';
    let slDetail = '';

    if (tradesWithSL.length === 0) {
      slLabel = language === 'fr' ? 'Non défini' : 'Not set';
      slDetail = language === 'fr' ? 'Définissez vos Stop Loss' : 'Set your Stop Losses';
    } else if (slScore >= 60) {
      slLabel = language === 'fr' ? 'Optimal' : 'Optimal';
      slDetail = language === 'fr' ? 'Vos SL sont bien dimensionnés' : 'Your SLs are well-sized';
    } else if (tightSL > wideSL) {
      slLabel = language === 'fr' ? 'Trop serré' : 'Too tight';
      slDetail = language === 'fr' ? 'Risque de sortie prématurée' : 'Risk of premature exit';
    } else {
      slLabel = language === 'fr' ? 'Trop large' : 'Too wide';
      slDetail = language === 'fr' ? 'Risque de pertes importantes' : 'Risk of significant losses';
    }

    // TP Optimization Analysis
    const tradesWithTP = closedTrades.filter(t => t.take_profit && t.exit_price);
    let tpHit = 0;
    let tpMissed = 0;
    let tpOptimal = 0;

    tradesWithTP.forEach(trade => {
      const tp = trade.take_profit!;
      const exitPrice = trade.exit_price!;
      const entryPrice = trade.entry_price;
      const isLong = trade.direction === 'long';

      // Check if TP was reached
      if (isLong) {
        if (exitPrice >= tp * 0.95) tpHit++;
        else if (exitPrice >= entryPrice) tpOptimal++; // Partial profit
        else tpMissed++;
      } else {
        if (exitPrice <= tp * 1.05) tpHit++;
        else if (exitPrice <= entryPrice) tpOptimal++;
        else tpMissed++;
      }
    });

    const tpScore = tradesWithTP.length > 0 
      ? Math.round(((tpHit + tpOptimal * 0.5) / tradesWithTP.length) * 100) 
      : 0;

    let tpLabel = '';
    let tpDetail = '';

    if (tradesWithTP.length === 0) {
      tpLabel = language === 'fr' ? 'Non défini' : 'Not set';
      tpDetail = language === 'fr' ? 'Définissez vos Take Profit' : 'Set your Take Profits';
    } else if (tpScore >= 70) {
      tpLabel = language === 'fr' ? 'Optimisé' : 'Optimized';
      tpDetail = language === 'fr' ? 'Vos TP sont bien placés' : 'Your TPs are well-placed';
    } else if (tpHit < tpMissed) {
      tpLabel = language === 'fr' ? 'Non optimisé' : 'Not optimized';
      tpDetail = language === 'fr' ? 'TP rarement atteint, ajustez vos cibles' : 'TP rarely hit, adjust targets';
    } else {
      tpLabel = language === 'fr' ? 'Partiellement' : 'Partial';
      tpDetail = language === 'fr' ? 'Profits partiels fréquents' : 'Frequent partial profits';
    }

    const overallScore = Math.round((entryScore + slScore + tpScore) / 3);

    return {
      entryTiming: { score: entryScore, label: entryLabel, detail: entryDetail },
      slSizing: { score: slScore, label: slLabel, detail: slDetail },
      tpOptimization: { score: tpScore, label: tpLabel, detail: tpDetail },
      overallScore,
    };
  }, [trades, language]);
};
