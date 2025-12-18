import { useMemo } from 'react';
import { Trade } from '@/hooks/useTrades';
import { parseISO, getDay, getHours } from 'date-fns';

export interface HeatmapCell {
  day: number;      // 0-6 (Sunday-Saturday)
  hour: number;     // 0-23
  pnl: number;
  trades: number;
  winRate: number;
  intensity: number; // -1 to 1 (red to green)
}

export interface DayPerformance {
  day: number;
  dayName: string;
  pnl: number;
  trades: number;
  winRate: number;
}

export interface HourPerformance {
  hour: number;
  hourLabel: string;
  pnl: number;
  trades: number;
  winRate: number;
}

export interface PerformanceHeatmap {
  cells: HeatmapCell[];
  byDay: DayPerformance[];
  byHour: HourPerformance[];
  bestDay: { day: string; pnl: number } | null;
  worstDay: { day: string; pnl: number } | null;
  bestHour: { hour: string; pnl: number } | null;
  worstHour: { hour: string; pnl: number } | null;
}

const DAY_NAMES = {
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export const usePerformanceHeatmap = (trades: Trade[], language: string = 'fr'): PerformanceHeatmap => {
  return useMemo(() => {
    const dayNames = DAY_NAMES[language as 'fr' | 'en'] || DAY_NAMES.en;
    
    // Initialize data structures
    const cellData: Record<string, { pnl: number; trades: number; wins: number }> = {};
    const dayData: Record<number, { pnl: number; trades: number; wins: number }> = {};
    const hourData: Record<number, { pnl: number; trades: number; wins: number }> = {};

    // Initialize all cells
    for (let d = 0; d < 7; d++) {
      dayData[d] = { pnl: 0, trades: 0, wins: 0 };
      for (let h = 0; h < 24; h++) {
        cellData[`${d}-${h}`] = { pnl: 0, trades: 0, wins: 0 };
        if (d === 0) hourData[h] = { pnl: 0, trades: 0, wins: 0 };
      }
    }

    // Populate with trade data
    trades.forEach(trade => {
      const tradeDate = parseISO(trade.trade_date);
      const day = getDay(tradeDate);
      const hour = getHours(tradeDate);
      const key = `${day}-${hour}`;
      const pnl = trade.profit_loss || 0;
      const isWin = trade.result === 'win';

      cellData[key].pnl += pnl;
      cellData[key].trades++;
      if (isWin) cellData[key].wins++;

      dayData[day].pnl += pnl;
      dayData[day].trades++;
      if (isWin) dayData[day].wins++;

      hourData[hour].pnl += pnl;
      hourData[hour].trades++;
      if (isWin) hourData[hour].wins++;
    });

    // Find max absolute PnL for normalization
    const allPnls = Object.values(cellData).map(c => Math.abs(c.pnl));
    const maxPnl = Math.max(...allPnls, 1);

    // Build cells array
    const cells: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const data = cellData[`${d}-${h}`];
        const winRate = data.trades > 0 ? Math.round((data.wins / data.trades) * 100) : 0;
        const intensity = data.trades > 0 ? data.pnl / maxPnl : 0;
        
        cells.push({
          day: d,
          hour: h,
          pnl: Math.round(data.pnl * 100) / 100,
          trades: data.trades,
          winRate,
          intensity,
        });
      }
    }

    // Build day performance
    const byDay: DayPerformance[] = [1, 2, 3, 4, 5, 6, 0].map(d => ({
      day: d,
      dayName: dayNames[d],
      pnl: Math.round(dayData[d].pnl * 100) / 100,
      trades: dayData[d].trades,
      winRate: dayData[d].trades > 0 ? Math.round((dayData[d].wins / dayData[d].trades) * 100) : 0,
    }));

    // Build hour performance
    const byHour: HourPerformance[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      hourLabel: `${h.toString().padStart(2, '0')}:00`,
      pnl: Math.round(hourData[h].pnl * 100) / 100,
      trades: hourData[h].trades,
      winRate: hourData[h].trades > 0 ? Math.round((hourData[h].wins / hourData[h].trades) * 100) : 0,
    }));

    // Find best/worst day and hour
    const tradedDays = byDay.filter(d => d.trades > 0);
    const tradedHours = byHour.filter(h => h.trades > 0);

    const bestDay = tradedDays.length > 0
      ? tradedDays.reduce((best, curr) => curr.pnl > best.pnl ? curr : best)
      : null;
    const worstDay = tradedDays.length > 0
      ? tradedDays.reduce((worst, curr) => curr.pnl < worst.pnl ? curr : worst)
      : null;
    const bestHour = tradedHours.length > 0
      ? tradedHours.reduce((best, curr) => curr.pnl > best.pnl ? curr : best)
      : null;
    const worstHour = tradedHours.length > 0
      ? tradedHours.reduce((worst, curr) => curr.pnl < worst.pnl ? curr : worst)
      : null;

    return {
      cells,
      byDay,
      byHour,
      bestDay: bestDay ? { day: bestDay.dayName, pnl: bestDay.pnl } : null,
      worstDay: worstDay ? { day: worstDay.dayName, pnl: worstDay.pnl } : null,
      bestHour: bestHour ? { hour: bestHour.hourLabel, pnl: bestHour.pnl } : null,
      worstHour: worstHour ? { hour: worstHour.hourLabel, pnl: worstHour.pnl } : null,
    };
  }, [trades, language]);
};
