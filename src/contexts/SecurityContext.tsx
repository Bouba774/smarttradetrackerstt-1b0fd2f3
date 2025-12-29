import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SecuritySettings {
  confidentialMode: boolean;
}

interface SecurityContextType {
  settings: SecuritySettings;
  isLoading: boolean;
  toggleConfidentialMode: () => Promise<void>;
  updateSettings: (updates: Partial<SecuritySettings>) => Promise<void>;
  // Lock state management
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: () => void;
  lastActiveTime: number;
  updateLastActiveTime: () => void;
}

const defaultSettings: SecuritySettings = {
  confidentialMode: false,
};

const SecurityContext = createContext<SecurityContextType | null>(null);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const isSavingRef = useRef(false);
  const lockCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoLockTimeoutRef = useRef<number>(0);
  const pinEnabledRef = useRef<boolean>(false);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoading(false);
        setIsLocked(false);
        return;
      }

      try {
        const { data: userSettingsData, error: userSettingsError } = await supabase
          .from('user_settings')
          .select('confidential_mode, auto_lock_timeout, pin_enabled')
          .eq('user_id', user.id)
          .single();

        if (userSettingsError && userSettingsError.code !== 'PGRST116') {
          console.error('Error loading user settings:', userSettingsError);
        }

        const dbSettings: SecuritySettings = {
          confidentialMode: userSettingsData?.confidential_mode ?? false,
        };
        setSettings(dbSettings);

        // Store auto-lock settings
        autoLockTimeoutRef.current = userSettingsData?.auto_lock_timeout ?? 0;
        pinEnabledRef.current = userSettingsData?.pin_enabled ?? false;

        // Check if PIN is enabled and we should lock on app start
        if (userSettingsData?.pin_enabled) {
          // Check secure_credentials to see if PIN is actually set
          const { data: credData } = await supabase
            .from('secure_credentials')
            .select('pin_hash')
            .eq('user_id', user.id)
            .single();

          if (credData?.pin_hash) {
            setIsLocked(true);
          }
        }

        // Ensure default record exists
        if (!userSettingsData) {
          await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              confidential_mode: false,
            }, { onConflict: 'user_id' });
        }
      } catch (e) {
        console.error('Error loading security settings:', e);
      }

      setIsLoading(false);
    };

    loadSettings();
  }, [user]);

  // Handle visibility change (app goes to background)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App came back to foreground
        const now = Date.now();
        const timeSinceLastActive = (now - lastActiveTime) / 1000; // in seconds

        // Check if we should lock based on timeout
        if (pinEnabledRef.current && autoLockTimeoutRef.current >= 0) {
          if (autoLockTimeoutRef.current === 0 || timeSinceLastActive >= autoLockTimeoutRef.current) {
            setIsLocked(true);
          }
        }
        
        setLastActiveTime(now);
      } else {
        // App went to background - record the time
        setLastActiveTime(Date.now());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, lastActiveTime]);

  // Auto-lock check interval
  useEffect(() => {
    if (!user || !pinEnabledRef.current) return;

    const checkAutoLock = () => {
      const now = Date.now();
      const timeSinceLastActive = (now - lastActiveTime) / 1000;

      if (autoLockTimeoutRef.current > 0 && timeSinceLastActive >= autoLockTimeoutRef.current) {
        setIsLocked(true);
      }
    };

    // Check every 10 seconds
    lockCheckIntervalRef.current = setInterval(checkAutoLock, 10000);

    return () => {
      if (lockCheckIntervalRef.current) {
        clearInterval(lockCheckIntervalRef.current);
      }
    };
  }, [user, lastActiveTime]);

  // Update last active time on user interaction
  const updateLastActiveTime = useCallback(() => {
    setLastActiveTime(Date.now());
  }, []);

  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
    setLastActiveTime(Date.now());
  }, []);

  // Save settings to database
  const saveSettingsToDb = useCallback(async (newSettings: SecuritySettings) => {
    if (!user || isSavingRef.current) return;
    
    isSavingRef.current = true;
    try {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          confidential_mode: newSettings.confidentialMode,
        }, { onConflict: 'user_id' });

      if (settingsError) {
        console.error('Error saving user settings:', settingsError);
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    } finally {
      isSavingRef.current = false;
    }
  }, [user]);

  const toggleConfidentialMode = useCallback(async () => {
    const newSettings = {
      ...settings,
      confidentialMode: !settings.confidentialMode,
    };
    setSettings(newSettings);
    await saveSettingsToDb(newSettings);
  }, [settings, saveSettingsToDb]);

  const updateSettings = useCallback(async (updates: Partial<SecuritySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettingsToDb(newSettings);
  }, [settings, saveSettingsToDb]);

  // Refresh auto-lock settings when they change
  useEffect(() => {
    const refreshSettings = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('user_settings')
        .select('auto_lock_timeout, pin_enabled')
        .eq('user_id', user.id)
        .single();

      if (data) {
        autoLockTimeoutRef.current = data.auto_lock_timeout ?? 0;
        pinEnabledRef.current = data.pin_enabled ?? false;
      }
    };

    // Listen for realtime changes
    const channel = supabase
      .channel('user_settings_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_settings',
        filter: `user_id=eq.${user?.id}`,
      }, () => {
        refreshSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <SecurityContext.Provider
      value={{
        settings,
        isLoading,
        toggleConfidentialMode,
        updateSettings,
        isLocked,
        lockApp,
        unlockApp,
        lastActiveTime,
        updateLastActiveTime,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
