import { useMemo } from 'react';
import { Trade } from '@/hooks/useTrades';
import { parseISO, getHours } from 'date-fns';

export type MarketSession = 'london' | 'newYork' | 'asia' | 'overlap';

export interface SessionStats {
  session: MarketSession;
  trades: number;
  winRate: number;
  pnl: number;
  drawdown: number;
  wins: number;
  losses: number;
}

export interface SessionAnalysis {
  sessions: SessionStats[];
  bestSession: MarketSession | null;
  bestSessionBadge: string;
  totalBySession: Record<MarketSession, number>;
}

// Session hours in UTC
const SESSION_HOURS = {
  asia: { start: 0, end: 8 },      // 00:00 - 08:00 UTC
  london: { start: 7, end: 16 },   // 07:00 - 16:00 UTC
  newYork: { start: 12, end: 21 }, // 12:00 - 21:00 UTC
};

const getSession = (hour: number): MarketSession => {
  // Check for overlap periods first
  if (hour >= 12 && hour < 16) return 'overlap'; // London-NY overlap
  if (hour >= 7 && hour < 8) return 'overlap';   // Asia-London overlap
  
  if (hour >= SESSION_HOURS.london.start && hour < SESSION_HOURS.london.end) return 'london';
  if (hour >= SESSION_HOURS.newYork.start && hour < SESSION_HOURS.newYork.end) return 'newYork';
  return 'asia';
};

export const useSessionAnalysis = (trades: Trade[], language: string = 'fr'): SessionAnalysis => {
  return useMemo(() => {
    const sessionData: Record<MarketSession, { trades: Trade[]; pnl: number; wins: number; losses: number }> = {
      london: { trades: [], pnl: 0, wins: 0, losses: 0 },
      newYork: { trades: [], pnl: 0, wins: 0, losses: 0 },
      asia: { trades: [], pnl: 0, wins: 0, losses: 0 },
      overlap: { trades: [], pnl: 0, wins: 0, losses: 0 },
    };

    // Categorize trades by session
    trades.forEach(trade => {
      const tradeDate = parseISO(trade.trade_date);
      const hour = getHours(tradeDate);
      const session = getSession(hour);
      
      sessionData[session].trades.push(trade);
      sessionData[session].pnl += trade.profit_loss || 0;
      if (trade.result === 'win') sessionData[session].wins++;
      if (trade.result === 'loss') sessionData[session].losses++;
    });

    // Calculate stats for each session
    const sessions: SessionStats[] = (['london', 'newYork', 'asia', 'overlap'] as MarketSession[]).map(session => {
      const data = sessionData[session];
      const totalTrades = data.trades.length;
      const winRate = totalTrades > 0 ? Math.round((data.wins / totalTrades) * 100) : 0;
      
      // Calculate drawdown
      let maxDrawdown = 0;
      let peak = 0;
      let runningPnl = 0;
      data.trades
        .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
        .forEach(trade => {
          runningPnl += trade.profit_loss || 0;
          if (runningPnl > peak) peak = runningPnl;
          const drawdown = peak - runningPnl;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

      return {
        session,
        trades: totalTrades,
        winRate,
        pnl: Math.round(data.pnl * 100) / 100,
        drawdown: Math.round(maxDrawdown * 100) / 100,
        wins: data.wins,
        losses: data.losses,
      };
    });

    // Find best session (highest win rate with at least 3 trades)
    let bestSession: MarketSession | null = null;
    let bestWinRate = 0;
    sessions.forEach(s => {
      if (s.trades >= 3 && s.winRate > bestWinRate) {
        bestWinRate = s.winRate;
        bestSession = s.session;
      }
    });

    const sessionNames: Record<MarketSession, { fr: string; en: string }> = {
      london: { fr: 'Londres', en: 'London' },
      newYork: { fr: 'New York', en: 'New York' },
      asia: { fr: 'Asie', en: 'Asia' },
      overlap: { fr: 'Chevauchement', en: 'Overlap' },
    };

    const bestSessionBadge = bestSession 
      ? language === 'fr' 
        ? `🏆 Meilleur trader session ${sessionNames[bestSession].fr}`
        : `🏆 Best ${sessionNames[bestSession].en} Session Trader`
      : '';

    return {
      sessions,
      bestSession,
      bestSessionBadge,
      totalBySession: {
        london: sessionData.london.trades.length,
        newYork: sessionData.newYork.trades.length,
        asia: sessionData.asia.trades.length,
        overlap: sessionData.overlap.trades.length,
      },
    };
  }, [trades, language]);
};
