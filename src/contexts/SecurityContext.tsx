import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SecuritySettings {
  pinEnabled: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  pinLength: 4 | 6;
  autoLockTimeout: number;
  confidentialMode: boolean;
  maxAttempts: number;
  wipeOnMaxAttempts: boolean;
  biometricEnabled: boolean;
}

interface LockoutState {
  failedAttempts: number;
  isBlocked: boolean;
  blockEndTime: number | null;
  blockCount: number;
  lastBlockTime: number | null;
  requiresReauth: boolean;
  biometricUsedAfterBlock: boolean;
}

interface DeviceInfo {
  deviceName: string;
  os: string;
  browser: string;
}

interface PinAttempt {
  timestamp: number;
  success: boolean;
  method: 'pin' | 'biometric';
  blocked?: boolean;
  device?: DeviceInfo;
}

interface SecurityContextType {
  isLocked: boolean;
  isSetupMode: boolean;
  settings: SecuritySettings;
  failedAttempts: number;
  remainingAttempts: number;
  isBlocked: boolean;
  blockTimeRemaining: number;
  blockCount: number;
  requiresReauth: boolean;
  attemptHistory: PinAttempt[];
  biometricAvailable: boolean;
  canUseBiometric: boolean;
  isLoading: boolean;
  
  // Actions
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  disablePin: (pin: string) => Promise<boolean>;
  toggleConfidentialMode: () => Promise<void>;
  toggleBiometric: () => Promise<void>;
  updateSettings: (updates: Partial<SecuritySettings>) => Promise<void>;
  resetSecurity: () => Promise<void>;
  enterSetupMode: () => void;
  exitSetupMode: () => void;
  requestPinReset: () => Promise<boolean>;
  resetPinWithToken: (token: string, newPin: string) => Promise<boolean>;
  clearAttemptHistory: () => void;
}

const defaultSettings: SecuritySettings = {
  pinEnabled: false,
  pinHash: null,
  pinSalt: null,
  pinLength: 4,
  autoLockTimeout: 0,
  confidentialMode: false,
  maxAttempts: 5,
  wipeOnMaxAttempts: false,
  biometricEnabled: false,
};

const defaultLockoutState: LockoutState = {
  failedAttempts: 0,
  isBlocked: false,
  blockEndTime: null,
  blockCount: 0,
  lastBlockTime: null,
  requiresReauth: false,
  biometricUsedAfterBlock: false,
};

const SecurityContext = createContext<SecurityContextType | null>(null);

const LOCK_STATE_KEY = 'smart-trade-tracker-lock-state';
const LOCKOUT_STATE_KEY = 'smart-trade-tracker-lockout';
const ATTEMPT_HISTORY_KEY = 'smart-trade-tracker-pin-history';

const LOCKOUT_DURATIONS = [
  15 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
];

const MAX_HISTORY_ENTRIES = 50;

// Secure PIN hashing via Edge Function
const hashPinSecure = async (pin: string): Promise<{ hash: string; salt: string }> => {
  const { data, error } = await supabase.functions.invoke('hash-pin', {
    body: { pin, action: 'create' },
  });
  
  if (error) {
    console.error('Error hashing PIN:', error);
    throw new Error('Failed to hash PIN');
  }
  
  return { hash: data.hash, salt: data.salt };
};

// Verify PIN via Edge Function
const verifyPinSecure = async (pin: string, existingHash: string, existingSalt: string): Promise<boolean> => {
  const { data, error } = await supabase.functions.invoke('hash-pin', {
    body: { pin, action: 'verify', existingHash, existingSalt },
  });
  
  if (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
  
  return data.valid;
};

// Check if WebAuthn/biometric is available
const checkBiometricAvailability = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) {
    return false;
  }
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
};

// Device detection utilities
const getOS = (): string => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  if (/Win/.test(platform)) return 'Windows';
  if (/Mac/.test(platform)) {
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
    return 'macOS';
  }
  if (/Linux/.test(platform)) {
    if (/Android/.test(userAgent)) return 'Android';
    return 'Linux';
  }
  return 'Unknown';
};

const getBrowser = (): string => {
  const userAgent = navigator.userAgent;
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/OPR\/|Opera/.test(userAgent)) return 'Opera';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return 'Unknown';
};

const getDeviceName = (): string => {
  const userAgent = navigator.userAgent;
  if (/iPhone/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';
  if (/Android/.test(userAgent)) return /Mobile/.test(userAgent) ? 'Android Phone' : 'Android Tablet';
  const os = getOS();
  if (os === 'Windows') return 'PC Windows';
  if (os === 'macOS') return 'Mac';
  if (os === 'Linux') return 'PC Linux';
  return 'Unknown Device';
};

const generateFingerprint = (): string => {
  const components = [navigator.userAgent, navigator.language, navigator.platform, screen.width, screen.height];
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isLocked, setIsLocked] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [lockoutState, setLockoutState] = useState<LockoutState>(defaultLockoutState);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [attemptHistory, setAttemptHistory] = useState<PinAttempt[]>([]);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());
  const isSavingRef = useRef(false);

  // Check biometric availability
  useEffect(() => {
    checkBiometricAvailability().then(setBiometricAvailable);
  }, []);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Load general settings from user_settings
        const { data: userSettingsData, error: userSettingsError } = await supabase
          .from('user_settings')
          .select('pin_enabled, auto_lock_timeout, confidential_mode, known_devices')
          .eq('user_id', user.id)
          .single();

        if (userSettingsError && userSettingsError.code !== 'PGRST116') {
          console.error('Error loading user settings:', userSettingsError);
        }

        // Load secure credentials from separate table
        const { data: credentialsData, error: credentialsError } = await supabase
          .from('secure_credentials')
          .select('pin_hash, pin_salt, pin_length, max_attempts, wipe_on_max_attempts, biometric_enabled')
          .eq('user_id', user.id)
          .single();

        if (credentialsError && credentialsError.code !== 'PGRST116') {
          console.error('Error loading secure credentials:', credentialsError);
        }

        const pinEnabled = userSettingsData?.pin_enabled ?? false;
        const dbSettings: SecuritySettings = {
          pinEnabled,
          pinHash: credentialsData?.pin_hash ?? null,
          pinSalt: credentialsData?.pin_salt ?? null,
          pinLength: (credentialsData?.pin_length as 4 | 6) ?? 4,
          autoLockTimeout: userSettingsData?.auto_lock_timeout ?? 0,
          confidentialMode: userSettingsData?.confidential_mode ?? false,
          maxAttempts: credentialsData?.max_attempts ?? 5,
          wipeOnMaxAttempts: credentialsData?.wipe_on_max_attempts ?? false,
          biometricEnabled: credentialsData?.biometric_enabled ?? false,
        };
        setSettings(dbSettings);

        // Check if should lock
        if (dbSettings.pinEnabled) {
          const lockState = sessionStorage.getItem(`${LOCK_STATE_KEY}-${user.id}`);
          if (lockState !== 'unlocked') {
            setIsLocked(true);
          }
        }

        // Check for new device
        const knownDevices: string[] = (userSettingsData?.known_devices as string[]) || [];
        const fingerprint = generateFingerprint();
        if (dbSettings.pinEnabled && !knownDevices.includes(fingerprint)) {
          // New device detected, send email
          sendSecurityEmail('new_device');
          // Save device to known list
          const updatedDevices = [...knownDevices, fingerprint].slice(-10);
          await supabase
            .from('user_settings')
            .update({ known_devices: updatedDevices })
            .eq('user_id', user.id);
        }

        // Ensure default records exist
        if (!userSettingsData) {
          await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              pin_enabled: false,
              auto_lock_timeout: 0,
              confidential_mode: false,
              known_devices: [],
            }, { onConflict: 'user_id' });
        }
      } catch (e) {
        console.error('Error loading security settings:', e);
      }

      // Load lockout state from localStorage (device-specific)
      const savedLockout = localStorage.getItem(`${LOCKOUT_STATE_KEY}-${user.id}`);
      if (savedLockout) {
        try {
          const parsed = JSON.parse(savedLockout);
          
          if (parsed.lastBlockTime && Date.now() - parsed.lastBlockTime > 24 * 60 * 60 * 1000) {
            parsed.blockCount = 0;
            parsed.requiresReauth = false;
            parsed.biometricUsedAfterBlock = false;
          }
          
          if (parsed.blockEndTime && Date.now() >= parsed.blockEndTime) {
            parsed.isBlocked = false;
            parsed.blockEndTime = null;
            parsed.failedAttempts = 0;
          }
          
          setLockoutState(parsed);
        } catch (e) {
          console.error('Error loading lockout state:', e);
        }
      }

      // Load attempt history from localStorage (device-specific)
      const savedHistory = localStorage.getItem(`${ATTEMPT_HISTORY_KEY}-${user.id}`);
      if (savedHistory) {
        try {
          setAttemptHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Error loading attempt history:', e);
        }
      }

      setIsLoading(false);
    };

    loadSettings();
  }, [user]);

  // Save settings to database (split between user_settings and secure_credentials)
  const saveSettingsToDb = useCallback(async (newSettings: SecuritySettings) => {
    if (!user || isSavingRef.current) return;
    
    isSavingRef.current = true;
    try {
      // Save general settings to user_settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          pin_enabled: newSettings.pinEnabled,
          auto_lock_timeout: newSettings.autoLockTimeout,
          confidential_mode: newSettings.confidentialMode,
        }, { onConflict: 'user_id' });

      if (settingsError) {
        console.error('Error saving user settings:', settingsError);
      }

      // Save sensitive credentials to secure_credentials table
      const { error: credentialsError } = await supabase
        .from('secure_credentials')
        .upsert({
          user_id: user.id,
          pin_hash: newSettings.pinHash,
          pin_salt: newSettings.pinSalt,
          pin_length: newSettings.pinLength,
          max_attempts: newSettings.maxAttempts,
          wipe_on_max_attempts: newSettings.wipeOnMaxAttempts,
          biometric_enabled: newSettings.biometricEnabled,
        }, { onConflict: 'user_id' });

      if (credentialsError) {
        console.error('Error saving secure credentials:', credentialsError);
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    } finally {
      isSavingRef.current = false;
    }
  }, [user]);

  // Save lockout state (device-specific)
  const saveLockoutState = useCallback((newState: LockoutState) => {
    if (user) {
      localStorage.setItem(`${LOCKOUT_STATE_KEY}-${user.id}`, JSON.stringify(newState));
    }
  }, [user]);

  // Get current device info
  const getCurrentDevice = useCallback((): DeviceInfo => ({
    deviceName: getDeviceName(),
    os: getOS(),
    browser: getBrowser(),
  }), []);

  // Send security email
  const sendSecurityEmail = useCallback(async (
    type: 'new_device' | 'account_blocked' | 'pin_reset',
    resetUrl?: string
  ) => {
    if (!user?.email) return;
    
    const deviceInfo = getCurrentDevice();
    
    try {
      await supabase.functions.invoke('security-email', {
        body: {
          type,
          email: user.email,
          language,
          deviceInfo: {
            ...deviceInfo,
            timestamp: new Date().toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US'),
          },
          resetUrl,
        },
      });
    } catch (error) {
      console.error('Error sending security email:', error);
    }
  }, [user, language, getCurrentDevice]);

  // Save attempt history
  const saveAttemptHistory = useCallback((history: PinAttempt[]) => {
    if (user) {
      const trimmed = history.slice(-MAX_HISTORY_ENTRIES);
      localStorage.setItem(`${ATTEMPT_HISTORY_KEY}-${user.id}`, JSON.stringify(trimmed));
    }
  }, [user]);

  // Add attempt to history with device info
  const addAttempt = useCallback((success: boolean, method: 'pin' | 'biometric', blocked?: boolean) => {
    const attempt: PinAttempt = {
      timestamp: Date.now(),
      success,
      method,
      blocked,
      device: getCurrentDevice(),
    };
    setAttemptHistory(prev => {
      const newHistory = [...prev, attempt];
      saveAttemptHistory(newHistory);
      return newHistory;
    });
  }, [saveAttemptHistory, getCurrentDevice]);

  // Update block time remaining countdown
  useEffect(() => {
    if (!lockoutState.isBlocked || !lockoutState.blockEndTime) {
      setBlockTimeRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, lockoutState.blockEndTime! - Date.now());
      setBlockTimeRemaining(remaining);

      if (remaining === 0) {
        const newState = {
          ...lockoutState,
          isBlocked: false,
          blockEndTime: null,
          failedAttempts: 0,
          biometricUsedAfterBlock: false,
        };
        setLockoutState(newState);
        saveLockoutState(newState);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [lockoutState.isBlocked, lockoutState.blockEndTime, saveLockoutState]);

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Auto-lock timeout handler
  useEffect(() => {
    if (!settings.pinEnabled || settings.autoLockTimeout === 0 || isLocked) {
      return;
    }

    const checkInactivity = () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      
      if (elapsed >= settings.autoLockTimeout) {
        setIsLocked(true);
        if (user) {
          sessionStorage.removeItem(`${LOCK_STATE_KEY}-${user.id}`);
        }
      }
    };

    const interval = setInterval(checkInactivity, 1000);

    const handleActivity = () => {
      resetActivityTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [settings.pinEnabled, settings.autoLockTimeout, isLocked, user, resetActivityTimer]);

  // Lock on visibility change
  useEffect(() => {
    if (!settings.pinEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && settings.autoLockTimeout > 0) {
        setIsLocked(true);
        if (user) {
          sessionStorage.removeItem(`${LOCK_STATE_KEY}-${user.id}`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings.pinEnabled, settings.autoLockTimeout, user]);

  const lock = useCallback(() => {
    if (settings.pinEnabled) {
      setIsLocked(true);
      if (user) {
        sessionStorage.removeItem(`${LOCK_STATE_KEY}-${user.id}`);
      }
    }
  }, [settings.pinEnabled, user]);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    if (lockoutState.isBlocked) {
      addAttempt(false, 'pin', true);
      return false;
    }

    if (lockoutState.requiresReauth) {
      return false;
    }

    // Verify PIN using secure server-side hashing
    const isValid = settings.pinHash && settings.pinSalt 
      ? await verifyPinSecure(pin, settings.pinHash, settings.pinSalt)
      : false;
    
    if (isValid) {
      setIsLocked(false);
      const newState = { ...defaultLockoutState };
      setLockoutState(newState);
      saveLockoutState(newState);
      resetActivityTimer();
      addAttempt(true, 'pin');
      if (user) {
        sessionStorage.setItem(`${LOCK_STATE_KEY}-${user.id}`, 'unlocked');
      }
      return true;
    } else {
      const newAttempts = lockoutState.failedAttempts + 1;
      
      if (newAttempts >= settings.maxAttempts) {
        const newBlockCount = lockoutState.blockCount + 1;
        const lockoutDuration = LOCKOUT_DURATIONS[Math.min(newBlockCount - 1, LOCKOUT_DURATIONS.length - 1)];
        const blockEndTime = Date.now() + lockoutDuration;
        
        const requiresReauth = newBlockCount >= 3;
        
        const newState: LockoutState = {
          failedAttempts: newAttempts,
          isBlocked: true,
          blockEndTime,
          blockCount: newBlockCount,
          lastBlockTime: Date.now(),
          requiresReauth,
          biometricUsedAfterBlock: false,
        };
        
        setLockoutState(newState);
        saveLockoutState(newState);
        addAttempt(false, 'pin', true);

        // Send blocked email notification
        sendSecurityEmail('account_blocked');

        toast.error(
          newBlockCount === 1 
            ? language === 'fr' ? 'Compte bloqué pendant 15 minutes' : 'Account blocked for 15 minutes'
            : newBlockCount === 2 
              ? language === 'fr' ? 'Compte bloqué pendant 30 minutes' : 'Account blocked for 30 minutes'
              : language === 'fr' ? 'Compte bloqué pendant 1 heure' : 'Account blocked for 1 hour'
        );

        if (requiresReauth && signOut) {
          toast.error(language === 'fr' ? 'Trop de tentatives. Reconnexion requise.' : 'Too many attempts. Re-login required.');
          setTimeout(() => {
            signOut();
          }, 2000);
        }
      } else {
        const newState: LockoutState = {
          ...lockoutState,
          failedAttempts: newAttempts,
        };
        setLockoutState(newState);
        saveLockoutState(newState);
        addAttempt(false, 'pin');
      }
      
      return false;
    }
  }, [settings.pinHash, settings.maxAttempts, lockoutState, user, resetActivityTimer, saveLockoutState, signOut, addAttempt, sendSecurityEmail, language]);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!settings.biometricEnabled || !biometricAvailable) {
      return false;
    }

    // After a block, biometric can only be used once
    if (lockoutState.blockCount > 0 && lockoutState.biometricUsedAfterBlock) {
      toast.error('Veuillez entrer votre code PIN');
      return false;
    }

    try {
      // Simple WebAuthn challenge for biometric verification
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        },
      });

      if (credential) {
        setIsLocked(false);
        
        // If used after a block, mark it
        if (lockoutState.blockCount > 0) {
          const newState = {
            ...lockoutState,
            biometricUsedAfterBlock: true,
            failedAttempts: 0,
            isBlocked: false,
          };
          setLockoutState(newState);
          saveLockoutState(newState);
        } else {
          const newState = { ...defaultLockoutState };
          setLockoutState(newState);
          saveLockoutState(newState);
        }
        
        resetActivityTimer();
        addAttempt(true, 'biometric');
        if (user) {
          sessionStorage.setItem(`${LOCK_STATE_KEY}-${user.id}`, 'unlocked');
        }
        return true;
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      addAttempt(false, 'biometric');
    }
    return false;
  }, [settings.biometricEnabled, biometricAvailable, lockoutState, user, resetActivityTimer, saveLockoutState, addAttempt]);

  const setupPin = useCallback(async (pin: string) => {
    const { hash: pinHash, salt: pinSalt } = await hashPinSecure(pin);
    const newSettings = {
      ...settings,
      pinEnabled: true,
      pinHash,
      pinSalt,
      pinLength: pin.length as 4 | 6,
    };
    setSettings(newSettings);
    await saveSettingsToDb(newSettings);
    setIsSetupMode(false);
    setIsLocked(false);
    if (user) {
      sessionStorage.setItem(`${LOCK_STATE_KEY}-${user.id}`, 'unlocked');
      // Add current device to known devices
      const fingerprint = generateFingerprint();
      const { data } = await supabase
        .from('user_settings')
        .select('known_devices')
        .eq('user_id', user.id)
        .single();
      const knownDevices: string[] = (data?.known_devices as string[]) || [];
      if (!knownDevices.includes(fingerprint)) {
        const updatedDevices = [...knownDevices, fingerprint].slice(-10);
        await supabase
          .from('user_settings')
          .update({ known_devices: updatedDevices })
          .eq('user_id', user.id);
      }
    }
  }, [settings, saveSettingsToDb, user]);

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    // Verify old PIN
    const isValid = settings.pinHash && settings.pinSalt 
      ? await verifyPinSecure(oldPin, settings.pinHash, settings.pinSalt)
      : false;
    
    if (isValid) {
      const { hash: newPinHash, salt: newPinSalt } = await hashPinSecure(newPin);
      const newSettings = {
        ...settings,
        pinHash: newPinHash,
        pinSalt: newPinSalt,
        pinLength: newPin.length as 4 | 6,
      };
      setSettings(newSettings);
      await saveSettingsToDb(newSettings);
      return true;
    }
    return false;
  }, [settings, saveSettingsToDb]);

  const disablePin = useCallback(async (pin: string): Promise<boolean> => {
    // Verify PIN
    const isValid = settings.pinHash && settings.pinSalt 
      ? await verifyPinSecure(pin, settings.pinHash, settings.pinSalt)
      : false;
    
    if (isValid) {
      const newSettings = {
        ...settings,
        pinEnabled: false,
        pinHash: null,
        pinSalt: null,
        biometricEnabled: false,
      };
      setSettings(newSettings);
      await saveSettingsToDb(newSettings);
      setIsLocked(false);
      return true;
    }
    return false;
  }, [settings, saveSettingsToDb]);

  const toggleConfidentialMode = useCallback(async () => {
    const newSettings = {
      ...settings,
      confidentialMode: !settings.confidentialMode,
    };
    setSettings(newSettings);
    await saveSettingsToDb(newSettings);
  }, [settings, saveSettingsToDb]);

  const toggleBiometric = useCallback(async () => {
    if (!biometricAvailable) {
      toast.error('Authentification biométrique non disponible');
      return;
    }
    const newSettings = {
      ...settings,
      biometricEnabled: !settings.biometricEnabled,
    };
    setSettings(newSettings);
    await saveSettingsToDb(newSettings);
    toast.success(
      newSettings.biometricEnabled
        ? 'Authentification biométrique activée'
        : 'Authentification biométrique désactivée'
    );
  }, [settings, saveSettingsToDb, biometricAvailable]);

  const updateSettings = useCallback(async (updates: Partial<SecuritySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettingsToDb(newSettings);
  }, [settings, saveSettingsToDb]);

  const resetSecurity = useCallback(async () => {
    setSettings(defaultSettings);
    setIsLocked(false);
    setLockoutState(defaultLockoutState);
    setAttemptHistory([]);
    if (user) {
      localStorage.removeItem(`${LOCKOUT_STATE_KEY}-${user.id}`);
      localStorage.removeItem(`${ATTEMPT_HISTORY_KEY}-${user.id}`);
      sessionStorage.removeItem(`${LOCK_STATE_KEY}-${user.id}`);
      await saveSettingsToDb(defaultSettings);
    }
  }, [user, saveSettingsToDb]);

  const enterSetupMode = useCallback(() => {
    setIsSetupMode(true);
  }, []);

  const exitSetupMode = useCallback(() => {
    setIsSetupMode(false);
  }, []);

  const requestPinReset = useCallback(async (): Promise<boolean> => {
    if (!user?.email) {
      toast.error(language === 'fr' ? 'Email non disponible' : 'Email not available');
      return false;
    }

    try {
      // Generate reset token (10 minutes validity)
      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // Store token temporarily
      localStorage.setItem(`pin-reset-token-${user.id}`, JSON.stringify({ token, expiresAt }));
      
      // Build reset URL
      const resetUrl = `${window.location.origin}/reset-pin?token=${token}&expires=${expiresAt}`;
      
      // Send email with reset link
      await sendSecurityEmail('pin_reset', resetUrl);
      
      toast.success(
        language === 'fr' 
          ? 'Un lien de réinitialisation a été envoyé à votre email'
          : 'A reset link has been sent to your email'
      );
      return true;
    } catch (error) {
      console.error('Error requesting PIN reset:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'envoi' : 'Error sending email');
      return false;
    }
  }, [user, language, sendSecurityEmail]);

  const resetPinWithToken = useCallback(async (token: string, newPin: string): Promise<boolean> => {
    const { hash: newPinHash, salt: newPinSalt } = await hashPinSecure(newPin);
    const newSettings = {
      ...settings,
      pinHash: newPinHash,
      pinSalt: newPinSalt,
      pinLength: newPin.length as 4 | 6,
    };
    setSettings(newSettings);
    await saveSettingsToDb(newSettings);
    
    setLockoutState(defaultLockoutState);
    saveLockoutState(defaultLockoutState);
    
    return true;
  }, [settings, saveSettingsToDb, saveLockoutState]);

  const clearAttemptHistory = useCallback(() => {
    setAttemptHistory([]);
    if (user) {
      localStorage.removeItem(`${ATTEMPT_HISTORY_KEY}-${user.id}`);
    }
    toast.success('Historique effacé');
  }, [user]);

  // Can use biometric: enabled, available, and (no block OR not used after block)
  const canUseBiometric = settings.biometricEnabled && 
    biometricAvailable && 
    !lockoutState.isBlocked &&
    !(lockoutState.blockCount > 0 && lockoutState.biometricUsedAfterBlock);

  const remainingAttempts = settings.maxAttempts - lockoutState.failedAttempts;

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        isSetupMode,
        settings,
        failedAttempts: lockoutState.failedAttempts,
        remainingAttempts,
        isBlocked: lockoutState.isBlocked,
        blockTimeRemaining,
        blockCount: lockoutState.blockCount,
        requiresReauth: lockoutState.requiresReauth,
        attemptHistory,
        biometricAvailable,
        canUseBiometric,
        isLoading,
        lock,
        unlock,
        unlockWithBiometric,
        setupPin,
        changePin,
        disablePin,
        toggleConfidentialMode,
        toggleBiometric,
        updateSettings,
        resetSecurity,
        enterSetupMode,
        exitSetupMode,
        requestPinReset,
        resetPinWithToken,
        clearAttemptHistory,
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
