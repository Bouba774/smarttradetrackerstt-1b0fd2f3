import { useMemo } from 'react';
import { Trade } from '@/hooks/useTrades';
import { parseISO, getHours } from 'date-fns';
import { 
  useSessionSettings, 
  SessionType, 
  utcToNYTime,
  SessionMode,
  DEFAULT_SESSION_SETTINGS 
} from './useSessionSettings';

export type MarketSession = SessionType;

export interface SessionStats {
  session: SessionType;
  sessionLabel: string;
  trades: number;
  winRate: number;
  pnl: number;
  drawdown: number;
  wins: number;
  losses: number;
}

export interface SessionAnalysis {
  sessions: SessionStats[];
  bestSession: SessionType | null;
  bestSessionBadge: string;
  totalBySession: Record<string, number>;
  mode: SessionMode;
}

// Session labels by mode and language
const SESSION_LABELS: Record<SessionMode, Record<string, { fr: string; en: string }>> = {
  classic: {
    sydney: { fr: 'Sydney', en: 'Sydney' },
    tokyo: { fr: 'Tokyo', en: 'Tokyo' },
    london: { fr: 'Londres', en: 'London' },
    newYork: { fr: 'New York', en: 'New York' },
    overlap: { fr: 'Chevauchement', en: 'Overlap' },
    none: { fr: 'Hors session', en: 'Off session' },
  },
  killzones: {
    asia: { fr: 'Killzone Asie', en: 'Asia Killzone' },
    london: { fr: 'Killzone Londres', en: 'London Killzone' },
    newYork: { fr: 'Killzone NY', en: 'NY Killzone' },
    londonClose: { fr: 'London Close', en: 'London Close' },
    none: { fr: 'Hors killzone', en: 'Outside Killzone' },
  },
};

export const useSessionAnalysis = (
  trades: Trade[],
  language: string = 'fr'
): SessionAnalysis => {
  const { settings, getSessionForDate } = useSessionSettings();
  
  return useMemo(() => {
    const { mode } = settings;
    
    // Define which sessions to track based on mode
    const sessionsToTrack: SessionType[] = mode === 'classic'
      ? ['sydney', 'tokyo', 'london', 'newYork', 'overlap', 'none']
      : ['asia', 'london', 'newYork', 'londonClose', 'none'];
    
    // Initialize data structure
    const sessionData: Record<SessionType, { 
      trades: Trade[]; 
      pnl: number; 
      wins: number; 
      losses: number;
    }> = {} as any;
    
    sessionsToTrack.forEach(session => {
      sessionData[session] = { trades: [], pnl: 0, wins: 0, losses: 0 };
    });

    // Categorize trades by session using NY Time reference
    trades.forEach(trade => {
      const tradeDate = parseISO(trade.trade_date);
      const session = getSessionForDate(tradeDate);
      
      // Ensure session exists in our data structure
      if (!sessionData[session]) {
        sessionData[session] = { trades: [], pnl: 0, wins: 0, losses: 0 };
      }
      
      sessionData[session].trades.push(trade);
      sessionData[session].pnl += trade.profit_loss || 0;
      if (trade.result === 'win') sessionData[session].wins++;
      if (trade.result === 'loss') sessionData[session].losses++;
    });

    // Calculate stats for each session
    const labels = SESSION_LABELS[mode];
    const sessions: SessionStats[] = sessionsToTrack
      .filter(session => sessionData[session].trades.length > 0 || session !== 'none')
      .map(session => {
        const data = sessionData[session];
        const totalTrades = data.trades.length;
        
        // Winrate calculation: wins / total closed trades
        const closedTrades = data.trades.filter(t => 
          t.result === 'win' || t.result === 'loss' || t.result === 'breakeven'
        );
        const winRate = closedTrades.length > 0 
          ? Math.round((data.wins / closedTrades.length) * 100) 
          : 0;
        
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

        const label = labels[session] || labels.none;
        
        return {
          session,
          sessionLabel: language === 'fr' ? label.fr : label.en,
          trades: totalTrades,
          winRate,
          pnl: Math.round(data.pnl * 100) / 100,
          drawdown: Math.round(maxDrawdown * 100) / 100,
          wins: data.wins,
          losses: data.losses,
        };
      });

    // Find best session (highest win rate with at least 3 trades)
    let bestSession: SessionType | null = null;
    let bestWinRate = 0;
    sessions.forEach(s => {
      if (s.trades >= 3 && s.winRate > bestWinRate && s.session !== 'none') {
        bestWinRate = s.winRate;
        bestSession = s.session;
      }
    });

    const bestSessionBadge = bestSession 
      ? language === 'fr' 
        ? `🏆 Meilleur trader ${labels[bestSession]?.fr || bestSession}`
        : `🏆 Best ${labels[bestSession]?.en || bestSession} Trader`
      : '';

    // Build total by session
    const totalBySession: Record<string, number> = {};
    sessionsToTrack.forEach(session => {
      totalBySession[session] = sessionData[session]?.trades.length || 0;
    });

    return {
      sessions,
      bestSession,
      bestSessionBadge,
      totalBySession,
      mode,
    };
  }, [trades, language, settings, getSessionForDate]);
};

// Legacy export for backward compatibility
export interface SessionHoursConfig {
  asia: { start: number; end: number };
  london: { start: number; end: number };
  newYork: { start: number; end: number };
}
