import { useMemo } from 'react';
import { Trade } from '@/hooks/useTrades';

export interface StrategyStats {
  strategy: string;
  trades: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  totalPnl: number;
  avgPnl: number;
  wins: number;
  losses: number;
}

export interface StrategyAnalysis {
  strategies: StrategyStats[];
  bestStrategy: string | null;
  worstStrategy: string | null;
  setupCategories: Record<string, StrategyStats[]>;
}

// Categorize setups into types
const SETUP_CATEGORIES: Record<string, string[]> = {
  'Scalping': ['Scalping', 'Quick Trade', 'M1', 'M5'],
  'Day Trading': ['Day Trading', 'Intraday', 'H1', 'H4'],
  'Swing': ['Swing', 'D1', 'W1', 'Position'],
  'ICT': ['ICT', 'Order Block', 'FVG', 'Liquidity', 'BOS', 'CHoCH', 'Mitigation'],
  'SMC': ['SMC', 'Smart Money', 'Institutional'],
  'Technical': ['RSI', 'MACD', 'Moving Average', 'EMA', 'SMA', 'Bollinger'],
  'Price Action': ['Breakout', 'Support/Resistance', 'Trendline', 'Channel', 'Pattern'],
};

const categorizeSetup = (setup: string): string => {
  const upperSetup = setup.toUpperCase();
  for (const [category, keywords] of Object.entries(SETUP_CATEGORIES)) {
    if (keywords.some(kw => upperSetup.includes(kw.toUpperCase()))) {
      return category;
    }
  }
  return 'Other';
};

export const useStrategyAnalysis = (trades: Trade[]): StrategyAnalysis => {
  return useMemo(() => {
    const strategyData: Record<string, { 
      trades: Trade[]; 
      wins: number; 
      losses: number; 
      totalProfit: number;
      totalLoss: number;
      totalPnl: number;
    }> = {};

    // Group trades by setup/strategy
    trades.forEach(trade => {
      const strategy = trade.setup || trade.custom_setup || 'Unknown';
      
      if (!strategyData[strategy]) {
        strategyData[strategy] = { 
          trades: [], 
          wins: 0, 
          losses: 0, 
          totalProfit: 0,
          totalLoss: 0,
          totalPnl: 0 
        };
      }
      
      strategyData[strategy].trades.push(trade);
      strategyData[strategy].totalPnl += trade.profit_loss || 0;
      
      if (trade.result === 'win') {
        strategyData[strategy].wins++;
        strategyData[strategy].totalProfit += trade.profit_loss || 0;
      } else if (trade.result === 'loss') {
        strategyData[strategy].losses++;
        strategyData[strategy].totalLoss += Math.abs(trade.profit_loss || 0);
      }
    });

    // Calculate stats for each strategy
    const strategies: StrategyStats[] = Object.entries(strategyData).map(([strategy, data]) => {
      const totalTrades = data.trades.length;
      const winRate = totalTrades > 0 ? Math.round((data.wins / totalTrades) * 100) : 0;
      const profitFactor = data.totalLoss > 0 
        ? Math.round((data.totalProfit / data.totalLoss) * 100) / 100 
        : data.totalProfit > 0 ? Infinity : 0;
      const expectancy = totalTrades > 0 
        ? Math.round((data.totalPnl / totalTrades) * 100) / 100 
        : 0;
      const avgPnl = totalTrades > 0 
        ? Math.round((data.totalPnl / totalTrades) * 100) / 100 
        : 0;

      return {
        strategy,
        trades: totalTrades,
        winRate,
        profitFactor,
        expectancy,
        totalPnl: Math.round(data.totalPnl * 100) / 100,
        avgPnl,
        wins: data.wins,
        losses: data.losses,
      };
    }).sort((a, b) => b.trades - a.trades);

    // Find best and worst strategies (minimum 3 trades)
    const qualifiedStrategies = strategies.filter(s => s.trades >= 3);
    const bestStrategy = qualifiedStrategies.length > 0
      ? qualifiedStrategies.reduce((best, curr) => curr.winRate > best.winRate ? curr : best).strategy
      : null;
    const worstStrategy = qualifiedStrategies.length > 0
      ? qualifiedStrategies.reduce((worst, curr) => curr.winRate < worst.winRate ? curr : worst).strategy
      : null;

    // Group by category
    const setupCategories: Record<string, StrategyStats[]> = {};
    strategies.forEach(stat => {
      const category = categorizeSetup(stat.strategy);
      if (!setupCategories[category]) setupCategories[category] = [];
      setupCategories[category].push(stat);
    });

    return {
      strategies,
      bestStrategy,
      worstStrategy,
      setupCategories,
    };
  }, [trades]);
};
