import { useState, useEffect, useCallback } from 'react';
import { useSessionSettings, SessionType } from './useSessionSettings';
import { 
  getNYHour, 
  getNYMinute, 
  getKillzoneForNYHour,
  SESSION_LABELS,
  getTradingDayStart,
  getTradingDayEnd,
  getNYTime,
} from '@/lib/timezone';

interface NYTimeInfo {
  nyTime: Date;
  nyHour: number;
  nyMinute: number;
  formattedTime: string;
  currentSession: SessionType;
  sessionLabel: { fr: string; en: string };
  tradingDayStart: Date;
  tradingDayEnd: Date;
  isAfterReset: boolean;
}

/**
 * Hook to get current New York time and active session in real-time
 * Uses Intl API for accurate timezone conversion regardless of user's local timezone
 */
export const useNYTime = (refreshInterval = 1000): NYTimeInfo => {
  const { settings, getSessionForHour } = useSessionSettings();
  
  const getNYTimeInfo = useCallback((): NYTimeInfo => {
    const now = new Date();
    const nyHour = getNYHour(now);
    const nyMinute = getNYMinute(now);
    const nyTime = getNYTime(now);
    
    // Determine session based on mode
    let currentSession: SessionType;
    if (settings.mode === 'killzones') {
      currentSession = getKillzoneForNYHour(nyHour);
    } else {
      currentSession = getSessionForHour(nyHour);
    }
    
    // Format time string
    const formattedTime = `${nyHour.toString().padStart(2, '0')}:${nyMinute.toString().padStart(2, '0')}`;
    
    // Trading day boundaries
    const tradingDayStart = getTradingDayStart(now);
    const tradingDayEnd = getTradingDayEnd(now);
    const isAfterReset = nyHour >= 17;
    
    return {
      nyTime,
      nyHour,
      nyMinute,
      formattedTime,
      currentSession,
      sessionLabel: SESSION_LABELS[currentSession] || SESSION_LABELS.none,
      tradingDayStart,
      tradingDayEnd,
      isAfterReset,
    };
  }, [settings.mode, getSessionForHour]);
  
  const [timeInfo, setTimeInfo] = useState<NYTimeInfo>(getNYTimeInfo);
  
  useEffect(() => {
    // Update immediately
    setTimeInfo(getNYTimeInfo());
    
    const interval = setInterval(() => {
      setTimeInfo(getNYTimeInfo());
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [getNYTimeInfo, refreshInterval]);
  
  return timeInfo;
};

export default useNYTime;
