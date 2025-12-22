import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_SETTINGS_KEY = 'smart-trade-tracker-session-settings';

export type SessionMode = 'classic' | 'killzones';

// Sessions defined in NEW YORK TIME (EST/EDT)
// UTC offset: EST = UTC-5, EDT = UTC-4
export interface SessionRange {
  start: number; // Hour in NY Time (0-23)
  end: number;   // Hour in NY Time (0-23)
}

export interface ClassicSessions {
  sydney: SessionRange;
  tokyo: SessionRange;
  london: SessionRange;
  newYork: SessionRange;
}

export interface KillzoneSessions {
  asia: SessionRange;
  london: SessionRange;
  newYork: SessionRange;
  londonClose: SessionRange;
}

export interface SessionSettings {
  mode: SessionMode;
  classic: ClassicSessions;
  killzones: KillzoneSessions;
}

// Default sessions in NY Time
export const DEFAULT_CLASSIC_SESSIONS: ClassicSessions = {
  sydney: { start: 17, end: 2 },    // 17:00 - 02:00 NY Time
  tokyo: { start: 19, end: 4 },     // 19:00 - 04:00 NY Time
  london: { start: 3, end: 12 },    // 03:00 - 12:00 NY Time
  newYork: { start: 8, end: 17 },   // 08:00 - 17:00 NY Time
};

export const DEFAULT_KILLZONE_SESSIONS: KillzoneSessions = {
  asia: { start: 20, end: 0 },       // 20:00 - 00:00 NY Time (ICT Asia Killzone)
  london: { start: 2, end: 5 },      // 02:00 - 05:00 NY Time (ICT London Killzone)
  newYork: { start: 7, end: 10 },    // 07:00 - 10:00 NY Time (ICT NY Killzone)
  londonClose: { start: 10, end: 12 }, // 10:00 - 12:00 NY Time (ICT London Close)
};

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  mode: 'classic',
  classic: DEFAULT_CLASSIC_SESSIONS,
  killzones: DEFAULT_KILLZONE_SESSIONS,
};

// Legacy export for backward compatibility
export type SessionHours = {
  asia: { start: number; end: number };
  london: { start: number; end: number };
  newYork: { start: number; end: number };
};

export const DEFAULT_SESSION_HOURS: SessionHours = {
  asia: { start: 0, end: 8 },
  london: { start: 7, end: 16 },
  newYork: { start: 12, end: 21 },
};

/**
 * Convert UTC hour to New York Time hour
 * Note: This is a simplified conversion. For production, consider using date-fns-tz
 */
export const utcToNYTime = (utcHour: number, utcDate: Date = new Date()): number => {
  // Determine if we're in EDT (March-November) or EST (November-March)
  const jan = new Date(utcDate.getFullYear(), 0, 1);
  const jul = new Date(utcDate.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  
  // Check if date is in DST
  const isDST = utcDate.getTimezoneOffset() < stdOffset;
  
  // NY offset: -5 for EST, -4 for EDT
  const offset = isDST ? -4 : -5;
  
  let nyHour = utcHour + offset;
  if (nyHour < 0) nyHour += 24;
  if (nyHour >= 24) nyHour -= 24;
  
  return nyHour;
};

/**
 * Convert New York Time hour to UTC hour
 */
export const nyTimeToUtc = (nyHour: number, utcDate: Date = new Date()): number => {
  const jan = new Date(utcDate.getFullYear(), 0, 1);
  const jul = new Date(utcDate.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const isDST = utcDate.getTimezoneOffset() < stdOffset;
  
  const offset = isDST ? 4 : 5;
  
  let utcHour = nyHour + offset;
  if (utcHour < 0) utcHour += 24;
  if (utcHour >= 24) utcHour -= 24;
  
  return utcHour;
};

/**
 * Check if an hour is within a session range (handles overnight sessions)
 */
export const isHourInRange = (hour: number, range: SessionRange): boolean => {
  const { start, end } = range;
  
  if (start < end) {
    // Normal range (e.g., 8-17)
    return hour >= start && hour < end;
  } else if (start > end) {
    // Overnight range (e.g., 17-02)
    return hour >= start || hour < end;
  } else {
    // start === end means full 24h
    return true;
  }
};

export type SessionType = 
  | 'sydney' | 'tokyo' | 'london' | 'newYork' | 'londonClose'
  | 'asia' | 'overlap' | 'none';

export const useSessionSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SESSION_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SESSION_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Error loading session settings:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save settings
  const saveSettings = useCallback((newSettings: SessionSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SESSION_SETTINGS_KEY, JSON.stringify(newSettings));
  }, []);

  // Update mode
  const setMode = useCallback((mode: SessionMode) => {
    saveSettings({ ...settings, mode });
  }, [settings, saveSettings]);

  // Update classic sessions
  const updateClassicSession = useCallback((
    session: keyof ClassicSessions,
    range: SessionRange
  ) => {
    const newSettings = {
      ...settings,
      classic: {
        ...settings.classic,
        [session]: range,
      },
    };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Update killzone sessions
  const updateKillzoneSession = useCallback((
    session: keyof KillzoneSessions,
    range: SessionRange
  ) => {
    const newSettings = {
      ...settings,
      killzones: {
        ...settings.killzones,
        [session]: range,
      },
    };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SESSION_SETTINGS);
    localStorage.setItem(SESSION_SETTINGS_KEY, JSON.stringify(DEFAULT_SESSION_SETTINGS));
  }, []);

  // Get session for a given NY Time hour
  const getSessionForHour = useCallback((nyHour: number): SessionType => {
    if (settings.mode === 'classic') {
      const { sydney, tokyo, london, newYork } = settings.classic;
      
      const inSydney = isHourInRange(nyHour, sydney);
      const inTokyo = isHourInRange(nyHour, tokyo);
      const inLondon = isHourInRange(nyHour, london);
      const inNewYork = isHourInRange(nyHour, newYork);
      
      // Check overlaps
      const overlaps = [inSydney, inTokyo, inLondon, inNewYork].filter(Boolean).length;
      if (overlaps > 1) return 'overlap';
      
      if (inNewYork) return 'newYork';
      if (inLondon) return 'london';
      if (inTokyo) return 'tokyo';
      if (inSydney) return 'sydney';
      
      return 'none';
    } else {
      // Killzones mode
      const { asia, london, newYork, londonClose } = settings.killzones;
      
      // Killzones are non-overlapping by design
      if (isHourInRange(nyHour, londonClose)) return 'londonClose';
      if (isHourInRange(nyHour, newYork)) return 'newYork';
      if (isHourInRange(nyHour, london)) return 'london';
      if (isHourInRange(nyHour, asia)) return 'asia';
      
      return 'none';
    }
  }, [settings]);

  // Get session for a UTC date
  const getSessionForDate = useCallback((utcDate: Date): SessionType => {
    const utcHour = utcDate.getUTCHours();
    const nyHour = utcToNYTime(utcHour, utcDate);
    return getSessionForHour(nyHour);
  }, [getSessionForHour]);

  // Legacy compatibility - return sessionHours in old format
  const sessionHours: SessionHours = {
    asia: settings.mode === 'killzones' 
      ? settings.killzones.asia 
      : { start: 0, end: 8 },
    london: settings.mode === 'killzones'
      ? settings.killzones.london
      : settings.classic.london,
    newYork: settings.classic.newYork,
  };

  return {
    settings,
    isLoaded,
    saveSettings,
    setMode,
    updateClassicSession,
    updateKillzoneSession,
    resetSettings,
    getSessionForHour,
    getSessionForDate,
    // Legacy compatibility
    sessionHours,
    saveSessionHours: (hours: SessionHours) => {
      saveSettings({
        ...settings,
        classic: {
          ...settings.classic,
          london: hours.london,
          newYork: hours.newYork,
        },
      });
    },
    resetSessionHours: resetSettings,
    DEFAULT_SESSION_HOURS,
  };
};

export default useSessionSettings;
