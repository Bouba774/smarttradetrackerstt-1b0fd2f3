import { useMemo } from 'react';
import { Trade } from './useTrades';
import { parseISO, differenceInMinutes } from 'date-fns';

export type TraderProfileType = 'impulsive' | 'patient' | 'hesitant' | 'aggressive' | 'balanced';

export interface TraderProfile {
  type: TraderProfileType;
  label: string;
  description: string;
  advice: string[];
  characteristics: {
    name: string;
    value: number;
  }[];
  icon: string;
}

export const useTraderProfile = (trades: Trade[], language: 'fr' | 'en' = 'fr'): TraderProfile | null => {
  return useMemo(() => {
    if (!trades || trades.length < 5) return null;

    const closedTrades = trades.filter(t => t.result && t.result !== 'pending');
    if (closedTrades.length < 5) return null;

    // Calculate metrics to determine profile
    let impulsivityScore = 0;
    let patienceScore = 0;
    let hesitancyScore = 0;
    let aggressivenessScore = 0;

    // 1. Trading frequency (trades per day)
    const tradesByDay: Record<string, number> = {};
    closedTrades.forEach(t => {
      const day = t.trade_date.split('T')[0];
      tradesByDay[day] = (tradesByDay[day] || 0) + 1;
    });
    const avgTradesPerDay = Object.values(tradesByDay).reduce((a, b) => a + b, 0) / Object.keys(tradesByDay).length;

    if (avgTradesPerDay > 5) {
      impulsivityScore += 30;
      aggressivenessScore += 20;
    } else if (avgTradesPerDay < 2) {
      patienceScore += 30;
      hesitancyScore += 20;
    }

    // 2. Trade duration
    const tradesWithDuration = closedTrades.filter(t => t.duration_seconds);
    if (tradesWithDuration.length > 0) {
      const avgDuration = tradesWithDuration.reduce((sum, t) => sum + (t.duration_seconds || 0), 0) / tradesWithDuration.length;
      const avgMinutes = avgDuration / 60;

      if (avgMinutes < 15) {
        impulsivityScore += 25;
        aggressivenessScore += 15;
      } else if (avgMinutes > 240) {
        patienceScore += 25;
      } else if (avgMinutes > 60) {
        patienceScore += 15;
      }
    }

    // 3. Emotions analysis
    const emotionCounts: Record<string, number> = {};
    closedTrades.forEach(t => {
      if (t.emotions) {
        emotionCounts[t.emotions] = (emotionCounts[t.emotions] || 0) + 1;
      }
    });

    const impulsiveEmotions = (emotionCounts['Impulsif'] || 0) + (emotionCounts['impulsive'] || 0);
    const stressedEmotions = (emotionCounts['Stressé'] || 0) + (emotionCounts['stressed'] || 0);
    const calmEmotions = (emotionCounts['Calme'] || 0) + (emotionCounts['calm'] || 0);
    const patientEmotions = (emotionCounts['Patient'] || 0) + (emotionCounts['patient'] || 0);
    const fearfulEmotions = (emotionCounts['Craintif'] || 0) + (emotionCounts['fearful'] || 0);

    const totalWithEmotion = closedTrades.filter(t => t.emotions).length;
    if (totalWithEmotion > 0) {
      impulsivityScore += Math.round((impulsiveEmotions / totalWithEmotion) * 40);
      impulsivityScore += Math.round((stressedEmotions / totalWithEmotion) * 20);
      patienceScore += Math.round((calmEmotions / totalWithEmotion) * 30);
      patienceScore += Math.round((patientEmotions / totalWithEmotion) * 40);
      hesitancyScore += Math.round((fearfulEmotions / totalWithEmotion) * 40);
    }

    // 4. Lot size variance (aggressive = high variance)
    const lotSizes = closedTrades.map(t => t.lot_size);
    const avgLot = lotSizes.reduce((a, b) => a + b, 0) / lotSizes.length;
    const variance = lotSizes.reduce((sum, lot) => sum + Math.pow(lot - avgLot, 2), 0) / lotSizes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgLot > 0 ? stdDev / avgLot : 0;

    if (coefficientOfVariation > 0.5) {
      aggressivenessScore += 30;
    } else if (coefficientOfVariation < 0.2) {
      patienceScore += 15;
    }

    // 5. Win/loss streaks behavior
    let currentStreak = 0;
    let tradesAfterLossStreak = 0;
    let quickTradesAfterLoss = 0;

    for (let i = 1; i < closedTrades.length; i++) {
      const prev = closedTrades[i - 1];
      const curr = closedTrades[i];

      if (prev.result === 'loss') {
        currentStreak++;
        if (currentStreak >= 2) {
          tradesAfterLossStreak++;
          // Check if trade was made quickly after loss (revenge trading indicator)
          const prevDate = parseISO(prev.trade_date);
          const currDate = parseISO(curr.trade_date);
          if (differenceInMinutes(currDate, prevDate) < 30) {
            quickTradesAfterLoss++;
          }
        }
      } else {
        currentStreak = 0;
      }
    }

    if (tradesAfterLossStreak > 0 && quickTradesAfterLoss / tradesAfterLossStreak > 0.5) {
      impulsivityScore += 20;
      aggressivenessScore += 15;
    }

    // 6. SL/TP usage
    const tradesWithSL = closedTrades.filter(t => t.stop_loss).length;
    const tradesWithTP = closedTrades.filter(t => t.take_profit).length;
    const slUsage = tradesWithSL / closedTrades.length;
    const tpUsage = tradesWithTP / closedTrades.length;

    if (slUsage < 0.5) {
      aggressivenessScore += 20;
      impulsivityScore += 10;
    }
    if (slUsage > 0.8 && tpUsage > 0.8) {
      patienceScore += 20;
    }
    if (slUsage > 0.9) {
      hesitancyScore += 15; // Very cautious
    }

    // Determine profile
    const scores = {
      impulsive: impulsivityScore,
      patient: patienceScore,
      hesitant: hesitancyScore,
      aggressive: aggressivenessScore,
    };

    const maxScore = Math.max(...Object.values(scores));
    const dominantTraits = Object.entries(scores).filter(([_, score]) => score >= maxScore * 0.8);

    let profileType: TraderProfileType = 'balanced';
    if (maxScore > 50) {
      if (dominantTraits.length === 1) {
        profileType = dominantTraits[0][0] as TraderProfileType;
      } else if (scores.impulsive > 50 && scores.aggressive > 50) {
        profileType = 'aggressive';
      } else if (scores.patient > 50 && scores.hesitant > 50) {
        profileType = 'hesitant';
      } else {
        profileType = dominantTraits[0][0] as TraderProfileType;
      }
    }

    const profiles: Record<TraderProfileType, Omit<TraderProfile, 'characteristics'>> = {
      impulsive: {
        type: 'impulsive',
        label: language === 'fr' ? 'Trader Impulsif' : 'Impulsive Trader',
        description: language === 'fr' 
          ? 'Vous avez tendance à prendre des décisions rapidement, parfois sans analyse complète.'
          : 'You tend to make quick decisions, sometimes without complete analysis.',
        advice: language === 'fr' ? [
          'Attendez 5 minutes avant chaque trade pour confirmer votre analyse',
          'Utilisez une checklist pré-trade obligatoire',
          'Limitez-vous à 3 trades maximum par jour',
          'Pratiquez la respiration profonde avant de trader',
        ] : [
          'Wait 5 minutes before each trade to confirm your analysis',
          'Use a mandatory pre-trade checklist',
          'Limit yourself to maximum 3 trades per day',
          'Practice deep breathing before trading',
        ],
        icon: '⚡',
      },
      patient: {
        type: 'patient',
        label: language === 'fr' ? 'Trader Patient' : 'Patient Trader',
        description: language === 'fr'
          ? 'Vous prenez le temps d\'analyser et attendez les meilleures opportunités.'
          : 'You take time to analyze and wait for the best opportunities.',
        advice: language === 'fr' ? [
          'Continuez à maintenir votre discipline',
          'Ne manquez pas les bonnes opportunités par excès de prudence',
          'Fixez des alertes pour ne pas rater les setups',
          'Documentez ce qui fait vos meilleures entrées',
        ] : [
          'Continue to maintain your discipline',
          'Don\'t miss good opportunities due to excessive caution',
          'Set alerts to not miss setups',
          'Document what makes your best entries',
        ],
        icon: '🧘',
      },
      hesitant: {
        type: 'hesitant',
        label: language === 'fr' ? 'Trader Hésitant' : 'Hesitant Trader',
        description: language === 'fr'
          ? 'Vous avez parfois du mal à prendre des décisions et manquez des opportunités.'
          : 'You sometimes struggle to make decisions and miss opportunities.',
        advice: language === 'fr' ? [
          'Définissez des règles d\'entrée claires et suivez-les',
          'Commencez avec des positions plus petites pour gagner en confiance',
          'Tenez un journal des opportunités manquées',
          'Travaillez sur votre confiance avec un compte démo',
        ] : [
          'Define clear entry rules and follow them',
          'Start with smaller positions to build confidence',
          'Keep a journal of missed opportunities',
          'Work on your confidence with a demo account',
        ],
        icon: '🤔',
      },
      aggressive: {
        type: 'aggressive',
        label: language === 'fr' ? 'Trader Agressif' : 'Aggressive Trader',
        description: language === 'fr'
          ? 'Vous prenez des risques importants et tradez activement.'
          : 'You take significant risks and trade actively.',
        advice: language === 'fr' ? [
          'Réduisez votre taille de position de 50%',
          'Utilisez TOUJOURS un Stop Loss',
          'Ne risquez jamais plus de 2% par trade',
          'Prenez des pauses après 2 pertes consécutives',
        ] : [
          'Reduce your position size by 50%',
          'ALWAYS use a Stop Loss',
          'Never risk more than 2% per trade',
          'Take breaks after 2 consecutive losses',
        ],
        icon: '🔥',
      },
      balanced: {
        type: 'balanced',
        label: language === 'fr' ? 'Trader Équilibré' : 'Balanced Trader',
        description: language === 'fr'
          ? 'Vous avez un bon équilibre entre prudence et prise de risque.'
          : 'You have a good balance between caution and risk-taking.',
        advice: language === 'fr' ? [
          'Continuez à suivre votre plan de trading',
          'Documentez vos meilleures pratiques',
          'Partagez votre expérience avec d\'autres traders',
          'Cherchez à optimiser vos performances existantes',
        ] : [
          'Continue to follow your trading plan',
          'Document your best practices',
          'Share your experience with other traders',
          'Seek to optimize your existing performance',
        ],
        icon: '⚖️',
      },
    };

    const selectedProfile = profiles[profileType];

    return {
      ...selectedProfile,
      characteristics: [
        { name: language === 'fr' ? 'Impulsivité' : 'Impulsivity', value: Math.min(100, scores.impulsive) },
        { name: language === 'fr' ? 'Patience' : 'Patience', value: Math.min(100, scores.patient) },
        { name: language === 'fr' ? 'Hésitation' : 'Hesitancy', value: Math.min(100, scores.hesitant) },
        { name: language === 'fr' ? 'Agressivité' : 'Aggressiveness', value: Math.min(100, scores.aggressive) },
      ],
    };
  }, [trades, language]);
};
