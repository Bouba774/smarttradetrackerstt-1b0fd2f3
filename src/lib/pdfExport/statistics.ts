import { Trade, ExportStats, EquityPoint } from './types';

export const calculateStats = (trades: Trade[]): ExportStats => {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakeven: 0,
      winrate: 0,
      totalPnL: 0,
      bestTrade: 0,
      worstTrade: 0,
      avgProfit: 0,
      profitFactor: 0,
      avgLotSize: 0,
      totalVolume: 0,
    };
  }

  const winningTrades = trades.filter(t => t.result === 'win').length;
  const losingTrades = trades.filter(t => t.result === 'loss').length;
  const breakeven = trades.filter(t => t.result === 'breakeven').length;
  const totalPnL = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const profits = trades.filter(t => (t.profit_loss || 0) > 0).reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const losses = Math.abs(trades.filter(t => (t.profit_loss || 0) < 0).reduce((sum, t) => sum + (t.profit_loss || 0), 0));
  const pnls = trades.map(t => t.profit_loss || 0);
  const totalVolume = trades.reduce((sum, t) => sum + t.lot_size, 0);

  return {
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    breakeven,
    winrate: trades.length > 0 ? Math.round((winningTrades / trades.length) * 100) : 0,
    totalPnL,
    bestTrade: Math.max(...pnls, 0),
    worstTrade: Math.min(...pnls, 0),
    avgProfit: trades.length > 0 ? totalPnL / trades.length : 0,
    profitFactor: losses > 0 ? profits / losses : profits > 0 ? Infinity : 0,
    avgLotSize: trades.length > 0 ? totalVolume / trades.length : 0,
    totalVolume,
  };
};

export const calculateEquityCurve = (trades: Trade[]): EquityPoint[] => {
  if (trades.length === 0) return [];

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
  );

  let cumulative = 0;
  return sortedTrades.map(trade => {
    cumulative += trade.profit_loss || 0;
    return {
      date: trade.trade_date,
      equity: cumulative,
    };
  });
};
