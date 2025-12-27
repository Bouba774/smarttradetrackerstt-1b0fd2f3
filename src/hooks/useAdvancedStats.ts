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
  totalLots: number;
  
  // Win rate
  winrate: number;
  winrateDisplay: string; // Display format: "65.5%" or "--"
  
  // Profit/Loss
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  netProfitDisplay: string; // Display format: "+$500" or "--"
  
  // Best/Worst
  bestProfit: number;
  worstLoss: number;
  
  // Averages
  avgProfitPerTrade: number;
  avgLossPerTrade: number;
  avgTradeResult: number;
  avgLotSize: number;
  
  // Risk metrics
  profitFactor: number | null; // null = infinity (no losses)
  profitFactorDisplay: string; // "1.50", "∞", or "N/A"
  expectancy: number;
  expectancyDisplay: string; // "$15.50" or "--"
  expectancyPercent: number;
  avgRiskReward: number | null; // null = N/A
  avgRiskRewardDisplay: string; // "1:2.5" or "N/A"
  isRRBelowOne: boolean; // Flag for warning badge when R:R < 1
  
  // Streaks
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  
  // Drawdown
  maxDrawdown: number;
  maxDrawdownPercent: number;
  maxDrawdownDisplay: string; // "-$500 (5.0%)" or "--"
  
  // Time metrics
  avgTradeDuration: string;
  totalTimeInPosition: string;
  
  // Flag to indicate if there are any trades
  hasTrades: boolean;
}

// Utility: Round to specified decimals
const round = (value: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

// Utility: Clamp value between min and max
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Utility: Format duration from seconds
const formatDurationFromSeconds = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  
  const totalSeconds = Math.floor(seconds);
  
  // If less than 1 minute, show seconds
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const mins = Math.floor((totalSeconds % (60 * 60)) / 60);
  const secs = totalSeconds % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  // Only show seconds if no larger unit and seconds > 0
  if (parts.length === 0 && secs > 0) parts.push(`${secs}s`);
  
  return parts.length > 0 ? parts.join(' ') : '0s';
};

// Legacy function for backward compatibility
const formatDuration = (minutes: number): string => {
  return formatDurationFromSeconds(minutes * 60);
};

// Calculate streaks from sorted trades
const calculateStreaks = (trades: Trade[]) => {
  const defaultResult = { 
    longestWin: 0, 
    longestLoss: 0, 
    current: { type: 'none' as const, count: 0 } 
  };
  
  if (trades.length === 0) return defaultResult;

  // Filter only win/loss trades (breakeven breaks streaks)
  const relevantTrades = trades
    .filter(t => t.result === 'win' || t.result === 'loss')
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

  if (relevantTrades.length === 0) return defaultResult;

  let longestWin = 0;
  let longestLoss = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  relevantTrades.forEach(trade => {
    if (trade.result === 'win') {
      currentWinStreak++;
      currentLossStreak = 0;
      longestWin = Math.max(longestWin, currentWinStreak);
    } else if (trade.result === 'loss') {
      currentLossStreak++;
      currentWinStreak = 0;
      longestLoss = Math.max(longestLoss, currentLossStreak);
    }
  });

  // Current streak from most recent trades
  const lastTrade = relevantTrades[relevantTrades.length - 1];
  let currentCount = 0;
  const currentType = lastTrade.result as 'win' | 'loss';

  for (let i = relevantTrades.length - 1; i >= 0; i--) {
    if (relevantTrades[i].result === currentType) {
      currentCount++;
    } else {
      break;
    }
  }

  return {
    longestWin,
    longestLoss,
    current: { type: currentType, count: currentCount }
  };
};

// Calculate max drawdown
const calculateMaxDrawdown = (trades: Trade[], startingCapital: number = 10000) => {
  if (trades.length === 0) return { amount: 0, percent: 0 };

  const sortedTrades = [...trades]
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

  let peak = startingCapital;
  let balance = startingCapital;
  let maxDrawdownAmount = 0;

  sortedTrades.forEach(trade => {
    const pnl = trade.profit_loss ?? 0;
    balance += pnl;
    
    if (balance > peak) {
      peak = balance;
    }
    
    const drawdown = peak - balance;
    if (drawdown > maxDrawdownAmount) {
      maxDrawdownAmount = drawdown;
    }
  });

  const maxDrawdownPercent = peak > 0 ? (maxDrawdownAmount / peak) * 100 : 0;

  return { 
    amount: round(maxDrawdownAmount, 2), 
    percent: round(maxDrawdownPercent, 1) 
  };
};

export const useAdvancedStats = (trades: Trade[]): AdvancedStats => {
  return useMemo(() => {
    // ==========================================
    // STEP 1: Filter valid trades
    // ==========================================
    // Exclude trades with null/undefined PnL for closed trades
    // Closed trades = result is 'win', 'loss', or 'breakeven'
    const closedTrades = trades.filter(t => 
      t.result === 'win' || t.result === 'loss' || t.result === 'breakeven'
    );
    
    // Valid closed trades must have a defined profit_loss
    const validClosedTrades = closedTrades.filter(t => 
      t.profit_loss !== null && t.profit_loss !== undefined && Number.isFinite(t.profit_loss)
    );
    
    const pendingTrades = trades.filter(t => t.result === 'pending' || !t.result).length;
    
    // ==========================================
    // STEP 2: Basic counts
    // ==========================================
    const totalTrades = validClosedTrades.length;
    
    // Win = PnL > 0
    const winningTradesData = validClosedTrades.filter(t => (t.profit_loss ?? 0) > 0);
    const winningTrades = winningTradesData.length;
    
    // Loss = PnL < 0
    const losingTradesData = validClosedTrades.filter(t => (t.profit_loss ?? 0) < 0);
    const losingTrades = losingTradesData.length;
    
    // Breakeven = PnL === 0
    const breakevenTrades = validClosedTrades.filter(t => (t.profit_loss ?? 0) === 0).length;
    
    // ==========================================
    // STEP 3: Positions (from ALL trades including pending)
    // ==========================================
    const buyPositions = trades.filter(t => 
      t.direction === 'long' || (t.direction as string) === 'buy'
    ).length;
    
    const sellPositions = trades.filter(t => 
      t.direction === 'short' || (t.direction as string) === 'sell'
    ).length;
    
    // ==========================================
    // STEP 4: Win Rate - Clamped to 0-100%
    // ==========================================
    let winrate = 0;
    if (totalTrades > 0) {
      winrate = (winningTrades / totalTrades) * 100;
      winrate = clamp(round(winrate, 1), 0, 100);
    }
    
    // ==========================================
    // STEP 5: Profit/Loss Calculations
    // ==========================================
    // Total Profit = Sum of all positive PnL
    const totalProfit = round(
      winningTradesData.reduce((sum, t) => sum + (t.profit_loss ?? 0), 0),
      2
    );
    
    // Total Loss = Absolute sum of all negative PnL
    const totalLoss = round(
      Math.abs(losingTradesData.reduce((sum, t) => sum + (t.profit_loss ?? 0), 0)),
      2
    );
    
    // Net Profit
    const netProfit = round(totalProfit - totalLoss, 2);
    
    // ==========================================
    // STEP 6: Best/Worst
    // ==========================================
    let bestProfit = 0;
    let worstLoss = 0;
    
    if (winningTradesData.length > 0) {
      bestProfit = round(
        Math.max(...winningTradesData.map(t => t.profit_loss ?? 0)),
        2
      );
    }
    
    if (losingTradesData.length > 0) {
      worstLoss = round(
        Math.min(...losingTradesData.map(t => t.profit_loss ?? 0)),
        2
      );
    }
    
    // ==========================================
    // STEP 7: Averages
    // ==========================================
    // Average Profit per winning trade
    const avgProfitPerTrade = winningTrades > 0 
      ? round(totalProfit / winningTrades, 2) 
      : 0;
    
    // Average Loss per losing trade (absolute value)
    const avgLossPerTrade = losingTrades > 0 
      ? round(totalLoss / losingTrades, 2) 
      : 0;
    
    // Average result per trade
    const avgTradeResult = totalTrades > 0 
      ? round(netProfit / totalTrades, 2) 
      : 0;
    
    // Average lot size and total lots (from all trades with valid lot_size)
    const tradesWithLots = trades.filter(t => 
      t.lot_size !== null && t.lot_size !== undefined && Number.isFinite(t.lot_size)
    );
    const totalLots = tradesWithLots.reduce((sum, t) => sum + t.lot_size, 0);
    const avgLotSize = tradesWithLots.length > 0
      ? round(totalLots / tradesWithLots.length, 2)
      : 0;
    
    // ==========================================
    // STEP 8: Performance Indicators (FIXED)
    // ==========================================
    // Profit Factor = TotalProfit / TotalLoss
    // CRITICAL: If losses = 0 and gains > 0, display "∞"
    //           If gains = 0 and losses = 0, display "0"
    let profitFactor: number | null = null;
    let profitFactorDisplay = '0';
    
    if (totalLoss > 0 && totalProfit > 0) {
      profitFactor = round(totalProfit / totalLoss, 2);
      profitFactorDisplay = profitFactor.toFixed(2);
    } else if (totalProfit > 0 && totalLoss === 0) {
      // Has profits but no losses = infinity
      profitFactor = null;
      profitFactorDisplay = '∞';
    } else if (totalProfit === 0 && totalLoss > 0) {
      // Only losses, no profits
      profitFactor = 0;
      profitFactorDisplay = '0';
    } else {
      // No trades or no profit/loss (both 0)
      profitFactor = 0;
      profitFactorDisplay = '0';
    }
    
    // Risk/Reward Ratio = AvgProfit / AvgLoss
    // CRITICAL: Badge RED if R:R < 1 (handled in UI)
    let avgRiskReward: number | null = null;
    let avgRiskRewardDisplay = 'N/A';
    let isRRBelowOne = false;
    
    if (avgLossPerTrade > 0 && avgProfitPerTrade > 0) {
      avgRiskReward = round(avgProfitPerTrade / avgLossPerTrade, 2);
      avgRiskRewardDisplay = avgRiskReward.toFixed(2);
      isRRBelowOne = avgRiskReward < 1;
    } else if (avgProfitPerTrade > 0 && avgLossPerTrade === 0) {
      avgRiskReward = null;
      avgRiskRewardDisplay = '∞';
    } else {
      avgRiskReward = 0;
      avgRiskRewardDisplay = '0';
    }
    
    // Expectancy = (WinRate * AvgProfit) - (LossRate * AvgLoss)
    const winRateDecimal = totalTrades > 0 ? winningTrades / totalTrades : 0;
    const lossRateDecimal = 1 - winRateDecimal;
    const expectancy = round(
      (winRateDecimal * avgProfitPerTrade) - (lossRateDecimal * avgLossPerTrade),
      2
    );
    
    // Expectancy as percentage
    const avgTradeSize = tradesWithLots.length > 0
      ? tradesWithLots.reduce((sum, t) => sum + (t.entry_price * t.lot_size), 0) / tradesWithLots.length
      : 0;
    const expectancyPercent = avgTradeSize > 0 
      ? round((expectancy / avgTradeSize) * 100, 2) 
      : 0;
    
    // ==========================================
    // STEP 9: Streaks
    // ==========================================
    const streaks = calculateStreaks(validClosedTrades);
    
    // ==========================================
    // STEP 10: Drawdown
    // ==========================================
    const drawdown = calculateMaxDrawdown(validClosedTrades);
    
    // ==========================================
    // STEP 11: Time Calculations
    // Calculate duration from exit_timestamp - trade_date if duration_seconds is not set
    // ==========================================
    const calculateTradeDuration = (trade: Trade): number => {
      // First check if duration_seconds is already set and valid
      if (trade.duration_seconds !== null && 
          trade.duration_seconds !== undefined && 
          Number.isFinite(trade.duration_seconds) && 
          trade.duration_seconds > 0) {
        return trade.duration_seconds;
      }
      
      // Otherwise calculate from exit_timestamp and trade_date
      if (trade.exit_timestamp && trade.trade_date) {
        try {
          const exitTime = new Date(trade.exit_timestamp).getTime();
          const entryTime = new Date(trade.trade_date).getTime();
          if (!isNaN(exitTime) && !isNaN(entryTime) && exitTime > entryTime) {
            return Math.floor((exitTime - entryTime) / 1000);
          }
        } catch {
          return 0;
        }
      }
      
      return 0;
    };
    
    // Only include closed trades with valid duration (either from duration_seconds or calculated)
    const tradesWithDuration = validClosedTrades
      .map(t => ({ trade: t, duration: calculateTradeDuration(t) }))
      .filter(({ duration }) => duration > 0);
    
    const totalDurationSeconds = tradesWithDuration.reduce(
      (sum, { duration }) => sum + duration, 
      0
    );
    
    // Calculate average duration in seconds
    const avgDurationSeconds = tradesWithDuration.length > 0 
      ? totalDurationSeconds / tradesWithDuration.length 
      : 0;
    
    // Use seconds-based formatting for accurate display
    const avgTradeDuration = tradesWithDuration.length > 0 
      ? formatDurationFromSeconds(avgDurationSeconds) 
      : '0s';
    
    const totalTimeInPosition = formatDurationFromSeconds(totalDurationSeconds);

    // ==========================================
    // BUILD DISPLAY STRINGS
    // ==========================================
    const hasTrades = totalTrades > 0;
    
    // Winrate display
    const winrateDisplay = hasTrades ? `${winrate.toFixed(1)}%` : '--';
    
    // Net profit display
    const netProfitDisplay = hasTrades 
      ? `${netProfit >= 0 ? '+' : ''}$${netProfit.toFixed(2)}` 
      : '--';
    
    // Expectancy display
    const expectancyDisplay = hasTrades 
      ? `$${expectancy.toFixed(2)}` 
      : '--';
    
    // Max drawdown display
    const maxDrawdownDisplay = drawdown.amount > 0 
      ? `-$${drawdown.amount.toFixed(2)} (${clamp(drawdown.percent, 0, 100).toFixed(1)}%)`
      : '--';

    // ==========================================
    // RETURN FINAL STATS
    // ==========================================
    return {
      totalTrades,
      winningTrades,
      losingTrades,
      breakevenTrades,
      pendingTrades,
      buyPositions,
      sellPositions,
      totalLots: round(totalLots, 2),
      winrate,
      winrateDisplay,
      totalProfit,
      totalLoss,
      netProfit,
      netProfitDisplay,
      bestProfit,
      worstLoss,
      avgProfitPerTrade,
      avgLossPerTrade,
      avgTradeResult,
      avgLotSize,
      profitFactor: profitFactor ?? 0,
      profitFactorDisplay,
      expectancy,
      expectancyDisplay,
      expectancyPercent,
      avgRiskReward: avgRiskReward ?? 0,
      avgRiskRewardDisplay,
      isRRBelowOne,
      longestWinStreak: streaks.longestWin,
      longestLossStreak: streaks.longestLoss,
      currentStreak: streaks.current,
      maxDrawdown: drawdown.amount,
      maxDrawdownPercent: clamp(drawdown.percent, 0, 100),
      maxDrawdownDisplay,
      avgTradeDuration,
      totalTimeInPosition,
      hasTrades,
    };
  }, [trades]);
};