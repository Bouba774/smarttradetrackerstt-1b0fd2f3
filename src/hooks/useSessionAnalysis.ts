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

export interface SessionHoursConfig {
  asia: { start: number; end: number };
  london: { start: number; end: number };
  newYork: { start: number; end: number };
}

// Default session hours in UTC
const DEFAULT_SESSION_HOURS: SessionHoursConfig = {
  asia: { start: 0, end: 8 },      // 00:00 - 08:00 UTC
  london: { start: 7, end: 16 },   // 07:00 - 16:00 UTC
  newYork: { start: 12, end: 21 }, // 12:00 - 21:00 UTC
};

const getSession = (hour: number, sessionHours: SessionHoursConfig): MarketSession => {
  const { asia, london, newYork } = sessionHours;
  
  // Check for overlap periods first
  const inLondon = hour >= london.start && hour < london.end;
  const inNewYork = hour >= newYork.start && hour < newYork.end;
  const inAsia = hour >= asia.start && hour < asia.end;
  
  // London-NY overlap
  if (inLondon && inNewYork) return 'overlap';
  // Asia-London overlap  
  if (inAsia && inLondon) return 'overlap';
  
  if (inLondon) return 'london';
  if (inNewYork) return 'newYork';
  if (inAsia) return 'asia';
  
  // Default to asia for hours outside defined sessions
  return 'asia';
};

export const useSessionAnalysis = (
  trades: Trade[], 
  language: string = 'fr',
  customSessionHours?: SessionHoursConfig
): SessionAnalysis => {
  return useMemo(() => {
    // Use custom hours or defaults
    const sessionHours = customSessionHours || (() => {
      // Try to load from localStorage
      try {
        const saved = localStorage.getItem('smart-trade-tracker-session-hours');
        if (saved) {
          return { ...DEFAULT_SESSION_HOURS, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error('Error loading session hours:', e);
      }
      return DEFAULT_SESSION_HOURS;
    })();

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
      const session = getSession(hour, sessionHours);
      
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
