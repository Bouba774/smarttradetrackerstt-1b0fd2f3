import { useState, useEffect, useCallback } from 'react';
import { useSessionSettings, SessionType } from './useSessionSettings';

interface NYTimeInfo {
  nyTime: Date;
  nyHour: number;
  nyMinute: number;
  formattedTime: string;
  currentSession: SessionType;
  sessionLabel: { fr: string; en: string };
}

const SESSION_LABELS: Record<SessionType, { fr: string; en: string }> = {
  sydney: { fr: 'Sydney', en: 'Sydney' },
  tokyo: { fr: 'Tokyo', en: 'Tokyo' },
  london: { fr: 'Londres', en: 'London' },
  newYork: { fr: 'New York', en: 'New York' },
  asia: { fr: 'Killzone Asie', en: 'Asia Killzone' },
  londonClose: { fr: 'London Close', en: 'London Close' },
  overlap: { fr: 'Chevauchement', en: 'Overlap' },
  none: { fr: 'Hors session', en: 'Off session' },
};

/**
 * Hook to get current New York time and active session in real-time
 */
export const useNYTime = (refreshInterval = 1000): NYTimeInfo => {
  const { settings, getSessionForHour } = useSessionSettings();
  
  const getNYTime = useCallback(() => {
    const now = new Date();
    
    // Create formatter for NY timezone
    const nyFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = nyFormatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    
    // Create a Date object representing NY time
    const nyDate = new Date();
    nyDate.setHours(hour, minute);
    
    const currentSession = getSessionForHour(hour);
    
    // Format time string
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    return {
      nyTime: nyDate,
      nyHour: hour,
      nyMinute: minute,
      formattedTime,
      currentSession,
      sessionLabel: SESSION_LABELS[currentSession] || SESSION_LABELS.none,
    };
  }, [getSessionForHour]);
  
  const [timeInfo, setTimeInfo] = useState<NYTimeInfo>(getNYTime);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInfo(getNYTime());
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [getNYTime, refreshInterval]);
  
  return timeInfo;
};

export default useNYTime;
