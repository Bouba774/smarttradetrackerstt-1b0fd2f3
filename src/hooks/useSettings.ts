import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SETTINGS_STORAGE_KEY = 'smart-trade-tracker-settings';

export interface AppSettings {
  vibration: boolean;
  sounds: boolean;
  animations: boolean;
  fontSize: 'small' | 'standard' | 'large';
  background: 'default' | 'gradient' | 'dark' | 'light';
  currency: string;
}

const defaultSettings: AppSettings = {
  vibration: true,
  sounds: true,
  animations: true,
  fontSize: 'standard',
  background: 'default',
  currency: 'USD',
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        // Load from localStorage as fallback for non-authenticated users
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setSettings({ ...defaultSettings, ...parsed });
          } catch (e) {
            console.error('Error loading settings from localStorage:', e);
          }
        }
        setIsLoaded(true);
        return;
      }

      try {
        // First try to get from database
        const { data, error } = await supabase
          .from('user_settings')
          .select('vibration, sounds, animations, font_size, background, currency')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading settings from database:', error);
        }

        if (data) {
          const dbSettings: AppSettings = {
            vibration: data.vibration ?? defaultSettings.vibration,
            sounds: data.sounds ?? defaultSettings.sounds,
            animations: data.animations ?? defaultSettings.animations,
            fontSize: (data.font_size as AppSettings['fontSize']) ?? defaultSettings.fontSize,
            background: (data.background as AppSettings['background']) ?? defaultSettings.background,
            currency: data.currency ?? defaultSettings.currency,
          };
          setSettings(dbSettings);
          // Also save to localStorage for offline access
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(dbSettings));
        } else {
          // No settings in DB yet, create them
          const { error: insertError } = await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              vibration: defaultSettings.vibration,
              sounds: defaultSettings.sounds,
              animations: defaultSettings.animations,
              font_size: defaultSettings.fontSize,
              background: defaultSettings.background,
              currency: defaultSettings.currency,
            }, { onConflict: 'user_id' });

          if (insertError) {
            console.error('Error creating settings:', insertError);
          }
        }
      } catch (e) {
        console.error('Error loading settings:', e);
        // Fallback to localStorage
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setSettings({ ...defaultSettings, ...parsed });
          } catch (e) {
            console.error('Error parsing localStorage settings:', e);
          }
        }
      }

      setIsLoaded(true);
    };

    loadSettings();
  }, [user]);

  // Save settings to database and localStorage
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));

    if (user && !isSyncing) {
      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            vibration: newSettings.vibration,
            sounds: newSettings.sounds,
            animations: newSettings.animations,
            font_size: newSettings.fontSize,
            background: newSettings.background,
            currency: newSettings.currency,
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error saving settings to database:', error);
        }
      } catch (e) {
        console.error('Error saving settings:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [user, isSyncing]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
    return newSettings;
  }, [settings, saveSettings]);

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));

    if (user) {
      try {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            vibration: defaultSettings.vibration,
            sounds: defaultSettings.sounds,
            animations: defaultSettings.animations,
            font_size: defaultSettings.fontSize,
            background: defaultSettings.background,
            currency: defaultSettings.currency,
          }, { onConflict: 'user_id' });
      } catch (e) {
        console.error('Error resetting settings:', e);
      }
    }
  }, [user]);

  return {
    settings,
    isLoaded,
    updateSetting,
    saveSettings,
    resetSettings,
    defaultSettings,
  };
};

export default useSettings;
