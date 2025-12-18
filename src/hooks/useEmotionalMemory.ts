import { useMemo } from 'react';
import { Trade } from './useTrades';

export interface EmotionalPattern {
  emotion: string;
  lossCount: number;
  winCount: number;
  avgLoss: number;
  avgWin: number;
  totalLoss: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface EmotionalMemory {
  patterns: EmotionalPattern[];
  warnings: {
    emotion: string;
    message: string;
    severity: 'info' | 'warning' | 'danger';
  }[];
  insights: string[];
  emotionToAvoid: string | null;
  bestEmotion: string | null;
}

export const useEmotionalMemory = (trades: Trade[], language: string = 'fr'): EmotionalMemory => {
  return useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        patterns: [],
        warnings: [],
        insights: [],
        emotionToAvoid: null,
        bestEmotion: null,
      };
    }

    // Analyze emotions linked to losses and wins
    const emotionStats: Record<string, {
      losses: number[];
      wins: number[];
      trades: Trade[];
    }> = {};

    trades.forEach(trade => {
      const emotion = trade.emotions || 'Neutre';
      if (!emotionStats[emotion]) {
        emotionStats[emotion] = { losses: [], wins: [], trades: [] };
      }
      emotionStats[emotion].trades.push(trade);
      
      if (trade.profit_loss) {
        if (trade.profit_loss < 0) {
          emotionStats[emotion].losses.push(Math.abs(trade.profit_loss));
        } else if (trade.profit_loss > 0) {
          emotionStats[emotion].wins.push(trade.profit_loss);
        }
      }
    });

    // Build patterns
    const patterns: EmotionalPattern[] = Object.entries(emotionStats)
      .filter(([_, stats]) => stats.trades.length >= 2)
      .map(([emotion, stats]) => {
        const lossCount = stats.losses.length;
        const winCount = stats.wins.length;
        const avgLoss = lossCount > 0 ? stats.losses.reduce((a, b) => a + b, 0) / lossCount : 0;
        const avgWin = winCount > 0 ? stats.wins.reduce((a, b) => a + b, 0) / winCount : 0;
        const totalLoss = stats.losses.reduce((a, b) => a + b, 0);
        
        const lossRatio = stats.trades.length > 0 ? lossCount / stats.trades.length : 0;
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (lossRatio > 0.6 || (avgLoss > avgWin * 1.5)) {
          riskLevel = 'high';
        } else if (lossRatio > 0.4) {
          riskLevel = 'medium';
        }

        return {
          emotion,
          lossCount,
          winCount,
          avgLoss,
          avgWin,
          totalLoss,
          riskLevel,
        };
      })
      .sort((a, b) => b.totalLoss - a.totalLoss);

    // Generate warnings based on patterns
    const warnings: EmotionalMemory['warnings'] = [];

    patterns.forEach(pattern => {
      if (pattern.riskLevel === 'high') {
        warnings.push({
          emotion: pattern.emotion,
          message: language === 'fr'
            ? `⚠️ Vous perdez souvent quand vous êtes ${pattern.emotion.toLowerCase()}. ${pattern.lossCount} pertes avec cette émotion.`
            : `⚠️ You often lose when feeling ${pattern.emotion.toLowerCase()}. ${pattern.lossCount} losses with this emotion.`,
          severity: 'danger',
        });
      } else if (pattern.riskLevel === 'medium') {
        warnings.push({
          emotion: pattern.emotion,
          message: language === 'fr'
            ? `📊 Performances mitigées quand ${pattern.emotion.toLowerCase()}. Soyez vigilant.`
            : `📊 Mixed performance when ${pattern.emotion.toLowerCase()}. Stay vigilant.`,
          severity: 'warning',
        });
      }
    });

    // Find best and worst emotions
    const emotionsWithEnoughData = patterns.filter(p => p.lossCount + p.winCount >= 3);
    
    let emotionToAvoid: string | null = null;
    let bestEmotion: string | null = null;

    if (emotionsWithEnoughData.length > 0) {
      // Emotion with highest loss ratio
      const sortedByLossRatio = [...emotionsWithEnoughData].sort((a, b) => {
        const ratioA = a.lossCount / (a.lossCount + a.winCount);
        const ratioB = b.lossCount / (b.lossCount + b.winCount);
        return ratioB - ratioA;
      });
      
      if (sortedByLossRatio[0] && sortedByLossRatio[0].lossCount / (sortedByLossRatio[0].lossCount + sortedByLossRatio[0].winCount) > 0.5) {
        emotionToAvoid = sortedByLossRatio[0].emotion;
      }

      // Emotion with highest win ratio
      const sortedByWinRatio = [...emotionsWithEnoughData].sort((a, b) => {
        const ratioA = a.winCount / (a.lossCount + a.winCount);
        const ratioB = b.winCount / (b.lossCount + b.winCount);
        return ratioB - ratioA;
      });

      if (sortedByWinRatio[0] && sortedByWinRatio[0].winCount / (sortedByWinRatio[0].lossCount + sortedByWinRatio[0].winCount) > 0.5) {
        bestEmotion = sortedByWinRatio[0].emotion;
      }
    }

    // Generate insights
    const insights: string[] = [];

    if (emotionToAvoid) {
      insights.push(language === 'fr'
        ? `Évitez de trader quand vous vous sentez "${emotionToAvoid}" - historique de pertes élevé.`
        : `Avoid trading when feeling "${emotionToAvoid}" - high loss history.`
      );
    }

    if (bestEmotion) {
      insights.push(language === 'fr'
        ? `Vos meilleures performances sont quand vous êtes "${bestEmotion}".`
        : `Your best performances are when you feel "${bestEmotion}".`
      );
    }

    // Check for recurring patterns
    const highRiskPatterns = patterns.filter(p => p.riskLevel === 'high');
    if (highRiskPatterns.length > 1) {
      insights.push(language === 'fr'
        ? `Attention: ${highRiskPatterns.length} états émotionnels sont associés à des pertes.`
        : `Warning: ${highRiskPatterns.length} emotional states are associated with losses.`
      );
    }

    // Compare recent vs historical performance for each emotion
    const recentTrades = trades.slice(0, Math.min(20, Math.floor(trades.length / 2)));
    const olderTrades = trades.slice(Math.min(20, Math.floor(trades.length / 2)));

    if (recentTrades.length >= 5 && olderTrades.length >= 5) {
      const recentLossEmotions: Record<string, number> = {};
      const olderLossEmotions: Record<string, number> = {};

      recentTrades.forEach(t => {
        if (t.result === 'loss' && t.emotions) {
          recentLossEmotions[t.emotions] = (recentLossEmotions[t.emotions] || 0) + 1;
        }
      });

      olderTrades.forEach(t => {
        if (t.result === 'loss' && t.emotions) {
          olderLossEmotions[t.emotions] = (olderLossEmotions[t.emotions] || 0) + 1;
        }
      });

      // Check if any emotion's loss rate is increasing
      Object.entries(recentLossEmotions).forEach(([emotion, count]) => {
        const oldCount = olderLossEmotions[emotion] || 0;
        const recentRate = count / recentTrades.length;
        const oldRate = olderTrades.length > 0 ? oldCount / olderTrades.length : 0;

        if (recentRate > oldRate * 1.5 && count >= 2) {
          insights.push(language === 'fr'
            ? `Les pertes liées à "${emotion}" augmentent récemment. Attention!`
            : `Losses related to "${emotion}" are increasing recently. Be careful!`
          );
        }
      });
    }

    return {
      patterns,
      warnings,
      insights,
      emotionToAvoid,
      bestEmotion,
    };
  }, [trades, language]);
};
