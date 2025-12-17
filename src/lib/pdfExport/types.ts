export interface Trade {
  id: string;
  trade_date: string;
  asset: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  profit_loss: number | null;
  result: string | null;
  setup: string | null;
  emotions: string | null;
}

export interface ProfileData {
  nickname: string;
  level: number | null;
  total_points: number | null;
}

export interface ExportStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakeven: number;
  winrate: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
  avgProfit: number;
  profitFactor: number;
  avgLotSize: number;
  totalVolume: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
}
