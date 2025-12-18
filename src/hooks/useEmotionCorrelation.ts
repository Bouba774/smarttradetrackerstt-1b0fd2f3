import { useMemo } from 'react';
import { Trade } from '@/hooks/useTrades';
import { parseISO, format, isToday, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export interface EmotionCorrelation {
  emotion: string;
  trades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
  avgLotSize: number;
  color: string;
}

export interface EmotionResultsAnalysis {
  correlations: EmotionCorrelation[];
  bestEmotion: string | null;
  worstEmotion: string | null;
  calmPnl: number;
  stressPnl: number;
  calmWinRate: number;
  stressWinRate: number;
  emotionImpact: { emotion: string; impact: 'positive' | 'negative' | 'neutral' }[];
}

const EMOTION_COLORS: Record<string, string> = {
  'Calme': 'hsl(142, 76%, 36%)',
  'Confiant': 'hsl(217, 91%, 60%)',
  'Concentré': 'hsl(280, 70%, 50%)',
  'Stressé': 'hsl(0, 84%, 60%)',
  'Impulsif': 'hsl(30, 100%, 50%)',
  'Frustré': 'hsl(0, 60%, 50%)',
  'Anxieux': 'hsl(45, 100%, 50%)',
  'Fatigué': 'hsl(200, 20%, 50%)',
  'Euphorique': 'hsl(300, 70%, 50%)',
  'Neutre': 'hsl(220, 10%, 50%)',
};

export const useEmotionCorrelation = (trades: Trade[]): EmotionResultsAnalysis => {
  return useMemo(() => {
    const emotionData: Record<string, {
      trades: Trade[];
      wins: number;
      losses: number;
      totalPnl: number;
      totalLot: number;
    }> = {};

    // Group trades by emotion
    trades.forEach(trade => {
      const emotion = trade.emotions || 'Neutre';
      
      if (!emotionData[emotion]) {
        emotionData[emotion] = { trades: [], wins: 0, losses: 0, totalPnl: 0, totalLot: 0 };
      }
      
      emotionData[emotion].trades.push(trade);
      emotionData[emotion].totalPnl += trade.profit_loss || 0;
      emotionData[emotion].totalLot += trade.lot_size;
      
      if (trade.result === 'win') emotionData[emotion].wins++;
      if (trade.result === 'loss') emotionData[emotion].losses++;
    });

    // Calculate correlations
    const correlations: EmotionCorrelation[] = Object.entries(emotionData)
      .map(([emotion, data]) => {
        const totalTrades = data.trades.length;
        return {
          emotion,
          trades: totalTrades,
          winRate: totalTrades > 0 ? Math.round((data.wins / totalTrades) * 100) : 0,
          avgPnl: totalTrades > 0 ? Math.round((data.totalPnl / totalTrades) * 100) / 100 : 0,
          totalPnl: Math.round(data.totalPnl * 100) / 100,
          avgLotSize: totalTrades > 0 ? Math.round((data.totalLot / totalTrades) * 100) / 100 : 0,
          color: EMOTION_COLORS[emotion] || 'hsl(var(--primary))',
        };
      })
      .filter(c => c.trades > 0)
      .sort((a, b) => b.trades - a.trades);

    // Find best and worst emotions (min 3 trades)
    const qualified = correlations.filter(c => c.trades >= 3);
    const bestEmotion = qualified.length > 0
      ? qualified.reduce((best, curr) => curr.winRate > best.winRate ? curr : best).emotion
      : null;
    const worstEmotion = qualified.length > 0
      ? qualified.reduce((worst, curr) => curr.winRate < worst.winRate ? curr : worst).emotion
      : null;

    // Calm vs Stress analysis
    const calmData = emotionData['Calme'] || { trades: [], wins: 0, losses: 0, totalPnl: 0, totalLot: 0 };
    const stressData = emotionData['Stressé'] || { trades: [], wins: 0, losses: 0, totalPnl: 0, totalLot: 0 };

    const calmPnl = calmData.totalPnl;
    const stressPnl = stressData.totalPnl;
    const calmWinRate = calmData.trades.length > 0 
      ? Math.round((calmData.wins / calmData.trades.length) * 100) : 0;
    const stressWinRate = stressData.trades.length > 0 
      ? Math.round((stressData.wins / stressData.trades.length) * 100) : 0;

    // Determine emotion impact
    const avgWinRate = trades.length > 0
      ? (trades.filter(t => t.result === 'win').length / trades.length) * 100
      : 0;

    const emotionImpact = correlations.map(c => ({
      emotion: c.emotion,
      impact: c.winRate > avgWinRate + 10 
        ? 'positive' as const
        : c.winRate < avgWinRate - 10 
          ? 'negative' as const 
          : 'neutral' as const,
    }));

    return {
      correlations,
      bestEmotion,
      worstEmotion,
      calmPnl,
      stressPnl,
      calmWinRate,
      stressWinRate,
      emotionImpact,
    };
  }, [trades]);
};
