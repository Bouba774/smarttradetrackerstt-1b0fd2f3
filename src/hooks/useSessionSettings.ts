import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SESSION_SETTINGS_KEY = 'smart-trade-tracker-session-hours';

export interface SessionHours {
  asia: { start: number; end: number };
  london: { start: number; end: number };
  newYork: { start: number; end: number };
}

// Default session hours in UTC
export const DEFAULT_SESSION_HOURS: SessionHours = {
  asia: { start: 0, end: 8 },      // 00:00 - 08:00 UTC
  london: { start: 7, end: 16 },   // 07:00 - 16:00 UTC
  newYork: { start: 12, end: 21 }, // 12:00 - 21:00 UTC
};

export const useSessionSettings = () => {
  const { user } = useAuth();
  const [sessionHours, setSessionHours] = useState<SessionHours>(DEFAULT_SESSION_HOURS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load session hours from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessionHours({ ...DEFAULT_SESSION_HOURS, ...parsed });
      } catch (e) {
        console.error('Error loading session settings:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save session hours
  const saveSessionHours = useCallback((newHours: SessionHours) => {
    setSessionHours(newHours);
    localStorage.setItem(SESSION_SETTINGS_KEY, JSON.stringify(newHours));
  }, []);

  // Update a specific session
  const updateSession = useCallback((
    session: keyof SessionHours, 
    start: number, 
    end: number
  ) => {
    const newHours = {
      ...sessionHours,
      [session]: { start, end },
    };
    saveSessionHours(newHours);
  }, [sessionHours, saveSessionHours]);

  // Reset to defaults
  const resetSessionHours = useCallback(() => {
    setSessionHours(DEFAULT_SESSION_HOURS);
    localStorage.setItem(SESSION_SETTINGS_KEY, JSON.stringify(DEFAULT_SESSION_HOURS));
  }, []);

  // Get session for a given hour based on current settings
  const getSessionForHour = useCallback((hour: number): 'london' | 'newYork' | 'asia' | 'overlap' => {
    const { asia, london, newYork } = sessionHours;
    
    // Check for overlaps first
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
  }, [sessionHours]);

  return {
    sessionHours,
    isLoaded,
    updateSession,
    saveSessionHours,
    resetSessionHours,
    getSessionForHour,
    DEFAULT_SESSION_HOURS,
  };
};

export default useSessionSettings;
