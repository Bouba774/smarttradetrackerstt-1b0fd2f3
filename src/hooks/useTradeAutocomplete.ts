import { useMemo } from 'react';
import { useTrades } from './useTrades';

export const useTradeAutocomplete = () => {
  const { trades } = useTrades();

  const suggestions = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { setups: [], timeframes: [] };
    }

    // Get unique setups (from both setup and custom_setup fields)
    const setupSet = new Set<string>();
    trades.forEach(trade => {
      if (trade.setup && trade.setup.trim()) {
        setupSet.add(trade.setup.trim());
      }
      if (trade.custom_setup && trade.custom_setup.trim()) {
        setupSet.add(trade.custom_setup.trim());
      }
    });

    // Get unique custom timeframes (non-standard ones)
    const standardTimeframes = ['M1', 'M5', 'M15', 'M30', 'M45', 'H1', 'H2', 'H3', 'H4', 'D1', 'W1', 'MN'];
    const timeframeSet = new Set<string>();
    trades.forEach(trade => {
      if (trade.timeframe && trade.timeframe.trim()) {
        const tf = trade.timeframe.trim();
        // Only add if it's not a standard timeframe
        if (!standardTimeframes.includes(tf)) {
          timeframeSet.add(tf);
        }
      }
    });

    // Sort by frequency (most used first)
    const setupCounts: Record<string, number> = {};
    trades.forEach(trade => {
      const setup = trade.setup?.trim() || trade.custom_setup?.trim();
      if (setup) {
        setupCounts[setup] = (setupCounts[setup] || 0) + 1;
      }
    });

    const sortedSetups = Array.from(setupSet).sort((a, b) => {
      return (setupCounts[b] || 0) - (setupCounts[a] || 0);
    });

    return {
      setups: sortedSetups,
      timeframes: Array.from(timeframeSet).sort(),
    };
  }, [trades]);

  return suggestions;
};
