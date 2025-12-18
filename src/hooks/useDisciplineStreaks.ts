import { useMemo } from 'react';
import { Trade } from './useTrades';
import { parseISO, differenceInDays, startOfDay, isSameDay } from 'date-fns';

export interface DisciplineStreaks {
  currentStreak: number;
  longestStreak: number;
  streakHistory: {
    startDate: string;
    endDate: string;
    days: number;
    brokenBy: string | null;
  }[];
  disciplineScore: number;
  violations: {
    date: string;
    type: string;
    description: string;
  }[];
  dailyChecks: {
    date: string;
    passed: boolean;
    violations: string[];
  }[];
}

const DISCIPLINE_RULES = {
  maxTradesPerDay: 5,
  maxLossPerDay: 3,
  requireSL: true,
  requireSetup: true,
  maxConsecutiveLosses: 3,
};

export const useDisciplineStreaks = (trades: Trade[], language: string = 'fr'): DisciplineStreaks => {
  return useMemo(() => {
    const defaultStreaks: DisciplineStreaks = {
      currentStreak: 0,
      longestStreak: 0,
      streakHistory: [],
      disciplineScore: 100,
      violations: [],
      dailyChecks: [],
    };

    if (!trades || trades.length === 0) return defaultStreaks;

    // Group trades by day
    const tradesByDay: Record<string, Trade[]> = {};
    trades.forEach(trade => {
      const day = trade.trade_date.split('T')[0];
      if (!tradesByDay[day]) tradesByDay[day] = [];
      tradesByDay[day].push(trade);
    });

    const sortedDays = Object.keys(tradesByDay).sort();
    const dailyChecks: DisciplineStreaks['dailyChecks'] = [];
    const violations: DisciplineStreaks['violations'] = [];
    const streakHistory: DisciplineStreaks['streakHistory'] = [];

    let currentStreakStart: string | null = null;
    let currentStreakDays = 0;
    let longestStreak = 0;

    sortedDays.forEach((day, index) => {
      const dayTrades = tradesByDay[day];
      const dayViolations: string[] = [];

      // Check rule violations
      // 1. Too many trades
      if (dayTrades.length > DISCIPLINE_RULES.maxTradesPerDay) {
        const msg = language === 'fr' 
          ? `Overtrading: ${dayTrades.length} trades (max ${DISCIPLINE_RULES.maxTradesPerDay})`
          : `Overtrading: ${dayTrades.length} trades (max ${DISCIPLINE_RULES.maxTradesPerDay})`;
        dayViolations.push(msg);
        violations.push({ date: day, type: 'overtrading', description: msg });
      }

      // 2. Too many losses in a day
      const losses = dayTrades.filter(t => t.result === 'loss').length;
      if (losses > DISCIPLINE_RULES.maxLossPerDay) {
        const msg = language === 'fr'
          ? `Trop de pertes: ${losses} pertes en une journée`
          : `Too many losses: ${losses} losses in one day`;
        dayViolations.push(msg);
        violations.push({ date: day, type: 'excessive_losses', description: msg });
      }

      // 3. Missing SL
      const tradesWithoutSL = dayTrades.filter(t => !t.stop_loss);
      if (tradesWithoutSL.length > 0) {
        const msg = language === 'fr'
          ? `${tradesWithoutSL.length} trade(s) sans Stop Loss`
          : `${tradesWithoutSL.length} trade(s) without Stop Loss`;
        dayViolations.push(msg);
        violations.push({ date: day, type: 'no_sl', description: msg });
      }

      // 4. Missing setup
      const tradesWithoutSetup = dayTrades.filter(t => !t.setup && !t.custom_setup);
      if (tradesWithoutSetup.length > 0) {
        const msg = language === 'fr'
          ? `${tradesWithoutSetup.length} trade(s) sans setup défini`
          : `${tradesWithoutSetup.length} trade(s) without defined setup`;
        dayViolations.push(msg);
        violations.push({ date: day, type: 'no_setup', description: msg });
      }

      // 5. Check for revenge trading (loss followed by quick trade)
      const sortedDayTrades = [...dayTrades].sort((a, b) => 
        parseISO(a.trade_date).getTime() - parseISO(b.trade_date).getTime()
      );
      
      for (let i = 1; i < sortedDayTrades.length; i++) {
        const prev = sortedDayTrades[i - 1];
        const curr = sortedDayTrades[i];
        if (prev.result === 'loss') {
          const timeDiff = parseISO(curr.trade_date).getTime() - parseISO(prev.trade_date).getTime();
          if (timeDiff < 15 * 60 * 1000) { // Less than 15 minutes
            const msg = language === 'fr'
              ? 'Possible revenge trading détecté'
              : 'Possible revenge trading detected';
            if (!dayViolations.includes(msg)) {
              dayViolations.push(msg);
              violations.push({ date: day, type: 'revenge_trading', description: msg });
            }
          }
        }
      }

      const passed = dayViolations.length === 0;
      dailyChecks.push({ date: day, passed, violations: dayViolations });

      // Update streak
      if (passed) {
        if (!currentStreakStart) {
          currentStreakStart = day;
        }
        currentStreakDays++;
      } else {
        // Streak broken
        if (currentStreakStart && currentStreakDays > 0) {
          streakHistory.push({
            startDate: currentStreakStart,
            endDate: sortedDays[index - 1] || day,
            days: currentStreakDays,
            brokenBy: dayViolations[0] || null,
          });
          if (currentStreakDays > longestStreak) {
            longestStreak = currentStreakDays;
          }
        }
        currentStreakStart = null;
        currentStreakDays = 0;
      }
    });

    // Add current ongoing streak if exists
    if (currentStreakStart && currentStreakDays > 0) {
      // Check if the current streak is still active (last trading day was recent)
      const lastDay = sortedDays[sortedDays.length - 1];
      const daysSinceLastTrade = differenceInDays(new Date(), parseISO(lastDay));
      
      if (daysSinceLastTrade <= 3) { // Consider streak active if traded within last 3 days
        if (currentStreakDays > longestStreak) {
          longestStreak = currentStreakDays;
        }
      }
    }

    // Calculate discipline score (percentage of clean days)
    const cleanDays = dailyChecks.filter(d => d.passed).length;
    const disciplineScore = dailyChecks.length > 0
      ? Math.round((cleanDays / dailyChecks.length) * 100)
      : 100;

    return {
      currentStreak: currentStreakDays,
      longestStreak,
      streakHistory: streakHistory.slice(-10),
      disciplineScore,
      violations: violations.slice(-20),
      dailyChecks: dailyChecks.slice(-30),
    };
  }, [trades, language]);
};
