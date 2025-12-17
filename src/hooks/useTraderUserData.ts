import { useMemo } from 'react';
import { Trade } from '@/hooks/useTrades';
import { useAuth } from '@/contexts/AuthContext';
import { useAdvancedStats } from '@/hooks/useAdvancedStats';

const LEVEL_TITLES: Record<number, string> = {
  1: 'Débutant',
  2: 'Intermédiaire',
  3: 'Analyste',
  4: 'Pro',
  5: 'Expert',
  6: 'Légende'
};

export interface TraderUserData {
  nickname: string;
  userLevel: string;
  totalPoints: number;
  stats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    breakevenTrades: number;
    buyPositions: number;
    sellPositions: number;
    winrate: string;
    netProfit: string;
    totalProfit: string;
    totalLoss: string;
    profitFactor: string;
    expectancy: string;
    expectancyPercent: string;
    avgProfitPerTrade: string;
    avgLossPerTrade: string;
    avgRiskReward: string;
    bestProfit: string;
    worstLoss: string;
    longestWinStreak: number;
    longestLossStreak: number;
    currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
    maxDrawdown: string;
    maxDrawdownPercent: string;
    avgLotSize: string;
    avgTradeDuration: string;
    totalTimeInPosition: string;
  };
  recentTrades: Array<{
    asset: string;
    direction: string;
    pnl: number;
    setup: string;
    emotion: string;
    result: string | null;
    date: string;
  }>;
  bestHours: string[];
  worstHours: string[];
  mostProfitableSetup: string;
  setupStats: Array<{
    setup: string;
    count: number;
    profit: string;
  }>;
}

export const useTraderUserData = (trades: Trade[]): TraderUserData => {
  const { profile } = useAuth();
  const stats = useAdvancedStats(trades);

  return useMemo(() => {
    // Get recent trades (last 10)
    const recentTrades = trades.slice(0, 10).map(t => ({
      asset: t.asset,
      direction: t.direction,
      pnl: t.profit_loss || 0,
      setup: t.setup || t.custom_setup || 'N/A',
      emotion: t.emotions || 'N/A',
      result: t.result,
      date: t.trade_date
    }));

    // Calculate most profitable setup
    const setupStats: Record<string, { count: number; profit: number }> = {};
    trades.forEach(t => {
      const setup = t.setup || t.custom_setup || 'Unknown';
      if (!setupStats[setup]) {
        setupStats[setup] = { count: 0, profit: 0 };
      }
      setupStats[setup].count++;
      setupStats[setup].profit += t.profit_loss || 0;
    });

    const mostProfitableSetup = Object.entries(setupStats)
      .sort((a, b) => b[1].profit - a[1].profit)[0]?.[0] || 'N/A';

    // Calculate trading hours patterns
    const hourStats: Record<number, { wins: number; losses: number; profit: number }> = {};
    trades.forEach(t => {
      const hour = new Date(t.trade_date).getHours();
      if (!hourStats[hour]) {
        hourStats[hour] = { wins: 0, losses: 0, profit: 0 };
      }
      if (t.result === 'win') hourStats[hour].wins++;
      if (t.result === 'loss') hourStats[hour].losses++;
      hourStats[hour].profit += t.profit_loss || 0;
    });

    const sortedHours = Object.entries(hourStats).sort((a, b) => b[1].profit - a[1].profit);
    const bestHours = sortedHours.slice(0, 2).map(([h]) => `${h}h-${parseInt(h) + 1}h`);
    const worstHours = sortedHours.slice(-2).map(([h]) => `${h}h-${parseInt(h) + 1}h`);

    // Get user level
    const level = profile?.level || 1;
    const userLevel = `${LEVEL_TITLES[level] || 'Débutant'} (Niveau ${level})`;

    return {
      nickname: profile?.nickname || 'Trader',
      userLevel,
      totalPoints: profile?.total_points || 0,
      stats: {
        totalTrades: stats.totalTrades,
        winningTrades: stats.winningTrades,
        losingTrades: stats.losingTrades,
        breakevenTrades: stats.breakevenTrades,
        buyPositions: stats.buyPositions,
        sellPositions: stats.sellPositions,
        winrate: stats.winrate.toFixed(1),
        netProfit: stats.netProfit.toFixed(2),
        totalProfit: stats.totalProfit.toFixed(2),
        totalLoss: stats.totalLoss.toFixed(2),
        profitFactor: stats.profitFactor.toFixed(2),
        expectancy: stats.expectancy.toFixed(2),
        expectancyPercent: stats.expectancyPercent.toFixed(2),
        avgProfitPerTrade: stats.avgProfitPerTrade.toFixed(2),
        avgLossPerTrade: stats.avgLossPerTrade.toFixed(2),
        avgRiskReward: stats.avgRiskReward.toFixed(2),
        bestProfit: stats.bestProfit.toFixed(2),
        worstLoss: stats.worstLoss.toFixed(2),
        longestWinStreak: stats.longestWinStreak,
        longestLossStreak: stats.longestLossStreak,
        currentStreak: stats.currentStreak,
        maxDrawdown: stats.maxDrawdown.toFixed(2),
        maxDrawdownPercent: stats.maxDrawdownPercent.toFixed(2),
        avgLotSize: stats.avgLotSize.toFixed(2),
        avgTradeDuration: stats.avgTradeDuration,
        totalTimeInPosition: stats.totalTimeInPosition,
      },
      recentTrades,
      bestHours: bestHours.length > 0 ? bestHours : ['N/A'],
      worstHours: worstHours.length > 0 ? worstHours : ['N/A'],
      mostProfitableSetup,
      setupStats: Object.entries(setupStats).map(([setup, data]) => ({
        setup,
        count: data.count,
        profit: data.profit.toFixed(2)
      }))
    };
  }, [trades, stats, profile]);
};
