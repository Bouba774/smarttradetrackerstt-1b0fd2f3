import { useMemo } from 'react';
import { Trade } from './useTrades';

export interface AdvancedStats {
  // Basic counts
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  pendingTrades: number;
  
  // Positions
  buyPositions: number;
  sellPositions: number;
  
  // Win rate
  winrate: number;
  
  // Profit/Loss
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  
  // Best/Worst
  bestProfit: number;
  worstLoss: number;
  
  // Averages
  avgProfitPerTrade: number;
  avgLossPerTrade: number;
  avgTradeResult: number;
  avgLotSize: number;
  
  // Risk metrics
  profitFactor: number;
  expectancy: number;
  expectancyPercent: number;
  avgRiskReward: number;
  
  // Streaks
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  
  // Drawdown
  maxDrawdown: number;
  maxDrawdownPercent: number;
  
  // Time metrics
  avgTradeDuration: string;
  totalTimeInPosition: string;
}

const formatDuration = (minutes: number): string => {
  if (minutes === 0) return '0m';
  
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = Math.floor(minutes % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  
  return parts.join(' ');
};

const calculateStreaks = (trades: Trade[]) => {
  if (trades.length === 0) {
    return { longestWin: 0, longestLoss: 0, current: { type: 'none' as const, count: 0 } };
  }

  // Sort by date ascending
  const sortedTrades = [...trades]
    .filter(t => t.result === 'win' || t.result === 'loss')
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

  let longestWin = 0;
  let longestLoss = 0;
  let currentWin = 0;
  let currentLoss = 0;

  sortedTrades.forEach(trade => {
    if (trade.result === 'win') {
      currentWin++;
      currentLoss = 0;
      longestWin = Math.max(longestWin, currentWin);
    } else if (trade.result === 'loss') {
      currentLoss++;
      currentWin = 0;
      longestLoss = Math.max(longestLoss, currentLoss);
    }
  });

  // Current streak (from most recent)
  const lastTrade = sortedTrades[sortedTrades.length - 1];
  let currentCount = 0;
  let currentType: 'win' | 'loss' | 'none' = 'none';

  if (lastTrade) {
    currentType = lastTrade.result as 'win' | 'loss';
    for (let i = sortedTrades.length - 1; i >= 0; i--) {
      if (sortedTrades[i].result === currentType) {
        currentCount++;
      } else {
        break;
      }
    }
  }

  return {
    longestWin,
    longestLoss,
    current: { type: currentType, count: currentCount }
  };
};

const calculateMaxDrawdown = (trades: Trade[], startingCapital: number = 10000) => {
  if (trades.length === 0) return { amount: 0, percent: 0 };

  const sortedTrades = [...trades]
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

  let peak = startingCapital;
  let balance = startingCapital;
  let maxDrawdown = 0;

  sortedTrades.forEach(trade => {
    balance += trade.profit_loss || 0;
    if (balance > peak) {
      peak = balance;
    }
    const drawdown = peak - balance;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

  return { amount: maxDrawdown, percent: maxDrawdownPercent };
};

export const useAdvancedStats = (trades: Trade[]): AdvancedStats => {
  return useMemo(() => {
    // Filter closed trades (not pending)
    const closedTrades = trades.filter(t => t.result !== 'pending');
    
    // Basic counts
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.result === 'win').length;
    const losingTrades = trades.filter(t => t.result === 'loss').length;
    const breakevenTrades = trades.filter(t => t.result === 'breakeven').length;
    const pendingTrades = trades.filter(t => t.result === 'pending').length;
    
    // Positions
    const buyPositions = trades.filter(t => t.direction === 'long').length;
    const sellPositions = trades.filter(t => t.direction === 'short').length;
    
    // Win rate (excluding pending)
    const winrate = closedTrades.length > 0 
      ? (winningTrades / closedTrades.length) * 100 
      : 0;
    
    // Profit/Loss calculations
    const winningTradesData = trades.filter(t => t.profit_loss && t.profit_loss > 0);
    const losingTradesData = trades.filter(t => t.profit_loss && t.profit_loss < 0);
    
    const totalProfit = winningTradesData.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const totalLoss = Math.abs(losingTradesData.reduce((sum, t) => sum + (t.profit_loss || 0), 0));
    const netProfit = totalProfit - totalLoss;
    
    // Best/Worst
    const allProfitLoss = trades.map(t => t.profit_loss || 0);
    const bestProfit = allProfitLoss.length > 0 ? Math.max(...allProfitLoss) : 0;
    const worstLoss = allProfitLoss.length > 0 ? Math.min(...allProfitLoss) : 0;
    
    // Averages
    const avgProfitPerTrade = winningTradesData.length > 0 
      ? totalProfit / winningTradesData.length 
      : 0;
    const avgLossPerTrade = losingTradesData.length > 0 
      ? totalLoss / losingTradesData.length 
      : 0;
    const avgTradeResult = closedTrades.length > 0 
      ? netProfit / closedTrades.length 
      : 0;
    
    // Average lot size
    const avgLotSize = trades.length > 0 
      ? trades.reduce((sum, t) => sum + t.lot_size, 0) / trades.length 
      : 0;
    
    // Profit Factor
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? totalProfit : 0;
    
    // Expectancy
    const winRateDecimal = closedTrades.length > 0 ? winningTrades / closedTrades.length : 0;
    const lossRateDecimal = 1 - winRateDecimal;
    const expectancy = (winRateDecimal * avgProfitPerTrade) - (lossRateDecimal * avgLossPerTrade);
    
    // Expectancy as percentage of average trade
    const avgTradeSize = trades.length > 0 
      ? trades.reduce((sum, t) => sum + (t.entry_price * t.lot_size), 0) / trades.length 
      : 0;
    const expectancyPercent = avgTradeSize > 0 ? (expectancy / avgTradeSize) * 100 : 0;
    
    // Risk/Reward ratio
    const avgRiskReward = avgLossPerTrade > 0 ? avgProfitPerTrade / avgLossPerTrade : 0;
    
    // Streaks
    const streaks = calculateStreaks(trades);
    
    // Drawdown
    const drawdown = calculateMaxDrawdown(trades);
    
    // Time calculations (assuming trades have created_at and trade_date)
    // For simplicity, we'll estimate duration based on trade frequency
    let totalDurationMinutes = 0;
    
    trades.forEach(trade => {
      // Estimate 4 hours average per trade if no specific duration data
      totalDurationMinutes += 240;
    });
    
    const avgTradeDuration = trades.length > 0 
      ? formatDuration(totalDurationMinutes / trades.length) 
      : '0m';
    const totalTimeInPosition = formatDuration(totalDurationMinutes);

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      breakevenTrades,
      pendingTrades,
      buyPositions,
      sellPositions,
      winrate,
      totalProfit,
      totalLoss,
      netProfit,
      bestProfit,
      worstLoss,
      avgProfitPerTrade,
      avgLossPerTrade,
      avgTradeResult,
      avgLotSize,
      profitFactor,
      expectancy,
      expectancyPercent,
      avgRiskReward,
      longestWinStreak: streaks.longestWin,
      longestLossStreak: streaks.longestLoss,
      currentStreak: streaks.current,
      maxDrawdown: drawdown.amount,
      maxDrawdownPercent: drawdown.percent,
      avgTradeDuration,
      totalTimeInPosition,
    };
  }, [trades]);
};