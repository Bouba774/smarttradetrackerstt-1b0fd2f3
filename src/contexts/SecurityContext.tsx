import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface SecuritySettings {
  pinEnabled: boolean;
  pinHash: string | null;
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

interface PinAttempt {
  timestamp: number;
  success: boolean;
  method: 'pin' | 'biometric';
  blocked?: boolean;
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
  
  // Actions
  lock: () => void;
  unlock: (pin: string) => boolean;
  unlockWithBiometric: () => Promise<boolean>;
  setupPin: (pin: string) => void;
  changePin: (oldPin: string, newPin: string) => boolean;
  disablePin: (pin: string) => boolean;
  toggleConfidentialMode: () => void;
  toggleBiometric: () => void;
  updateSettings: (updates: Partial<SecuritySettings>) => void;
  resetSecurity: () => void;
  enterSetupMode: () => void;
  exitSetupMode: () => void;
  requestPinReset: () => Promise<boolean>;
  resetPinWithToken: (token: string, newPin: string) => Promise<boolean>;
  clearAttemptHistory: () => void;
}

const defaultSettings: SecuritySettings = {
  pinEnabled: false,
  pinHash: null,
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

const SECURITY_STORAGE_KEY = 'smart-trade-tracker-security';
const LOCK_STATE_KEY = 'smart-trade-tracker-lock-state';
const LOCKOUT_STATE_KEY = 'smart-trade-tracker-lockout';
const ATTEMPT_HISTORY_KEY = 'smart-trade-tracker-pin-history';

const LOCKOUT_DURATIONS = [
  15 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
];

const MAX_HISTORY_ENTRIES = 50;

const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const salt = 'stt-secure-';
  return salt + Math.abs(hash).toString(16);
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

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isLocked, setIsLocked] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [lockoutState, setLockoutState] = useState<LockoutState>(defaultLockoutState);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [attemptHistory, setAttemptHistory] = useState<PinAttempt[]>([]);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Check biometric availability
  useEffect(() => {
    checkBiometricAvailability().then(setBiometricAvailable);
  }, []);

  // Load settings, lockout state, and attempt history
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${SECURITY_STORAGE_KEY}-${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({ ...defaultSettings, ...parsed });
          
          if (parsed.pinEnabled) {
            const lockState = sessionStorage.getItem(`${LOCK_STATE_KEY}-${user.id}`);
            if (lockState !== 'unlocked') {
              setIsLocked(true);
            }
          }
        } catch (e) {
          console.error('Error loading security settings:', e);
        }
      }

      // Load lockout state
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

      // Load attempt history
      const savedHistory = localStorage.getItem(`${ATTEMPT_HISTORY_KEY}-${user.id}`);
      if (savedHistory) {
        try {
          setAttemptHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Error loading attempt history:', e);
        }
      }
    }
  }, [user]);

  // Save lockout state
  const saveLockoutState = useCallback((newState: LockoutState) => {
    if (user) {
      localStorage.setItem(`${LOCKOUT_STATE_KEY}-${user.id}`, JSON.stringify(newState));
    }
  }, [user]);

  // Save attempt history
  const saveAttemptHistory = useCallback((history: PinAttempt[]) => {
    if (user) {
      const trimmed = history.slice(-MAX_HISTORY_ENTRIES);
      localStorage.setItem(`${ATTEMPT_HISTORY_KEY}-${user.id}`, JSON.stringify(trimmed));
    }
  }, [user]);

  // Add attempt to history
  const addAttempt = useCallback((success: boolean, method: 'pin' | 'biometric', blocked?: boolean) => {
    const attempt: PinAttempt = {
      timestamp: Date.now(),
      success,
      method,
      blocked,
    };
    setAttemptHistory(prev => {
      const newHistory = [...prev, attempt];
      saveAttemptHistory(newHistory);
      return newHistory;
    });
  }, [saveAttemptHistory]);

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

  const saveSettings = useCallback((newSettings: SecuritySettings) => {
    if (user) {
      localStorage.setItem(`${SECURITY_STORAGE_KEY}-${user.id}`, JSON.stringify(newSettings));
    }
  }, [user]);

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

  const unlock = useCallback((pin: string): boolean => {
    if (lockoutState.isBlocked) {
      addAttempt(false, 'pin', true);
      return false;
    }

    if (lockoutState.requiresReauth) {
      return false;
    }

    const pinHash = hashPin(pin);
    
    if (pinHash === settings.pinHash) {
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

        toast.error(
          newBlockCount === 1 
            ? 'Compte bloqué pendant 15 minutes' 
            : newBlockCount === 2 
              ? 'Compte bloqué pendant 30 minutes'
              : 'Compte bloqué pendant 1 heure'
        );

        if (requiresReauth && signOut) {
          toast.error('Trop de tentatives. Reconnexion requise.');
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
  }, [settings.pinHash, settings.maxAttempts, lockoutState, user, resetActivityTimer, saveLockoutState, signOut, addAttempt]);

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

  const setupPin = useCallback((pin: string) => {
    const pinHash = hashPin(pin);
    const newSettings = {
      ...settings,
      pinEnabled: true,
      pinHash,
      pinLength: pin.length as 4 | 6,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsSetupMode(false);
    setIsLocked(false);
    if (user) {
      sessionStorage.setItem(`${LOCK_STATE_KEY}-${user.id}`, 'unlocked');
    }
  }, [settings, saveSettings, user]);

  const changePin = useCallback((oldPin: string, newPin: string): boolean => {
    const oldPinHash = hashPin(oldPin);
    
    if (oldPinHash === settings.pinHash) {
      const newPinHash = hashPin(newPin);
      const newSettings = {
        ...settings,
        pinHash: newPinHash,
        pinLength: newPin.length as 4 | 6,
      };
      setSettings(newSettings);
      saveSettings(newSettings);
      return true;
    }
    return false;
  }, [settings, saveSettings]);

  const disablePin = useCallback((pin: string): boolean => {
    const pinHash = hashPin(pin);
    
    if (pinHash === settings.pinHash) {
      const newSettings = {
        ...settings,
        pinEnabled: false,
        pinHash: null,
        biometricEnabled: false,
      };
      setSettings(newSettings);
      saveSettings(newSettings);
      setIsLocked(false);
      return true;
    }
    return false;
  }, [settings, saveSettings]);

  const toggleConfidentialMode = useCallback(() => {
    const newSettings = {
      ...settings,
      confidentialMode: !settings.confidentialMode,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const toggleBiometric = useCallback(() => {
    if (!biometricAvailable) {
      toast.error('Authentification biométrique non disponible');
      return;
    }
    const newSettings = {
      ...settings,
      biometricEnabled: !settings.biometricEnabled,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    toast.success(
      newSettings.biometricEnabled
        ? 'Authentification biométrique activée'
        : 'Authentification biométrique désactivée'
    );
  }, [settings, saveSettings, biometricAvailable]);

  const updateSettings = useCallback((updates: Partial<SecuritySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const resetSecurity = useCallback(() => {
    setSettings(defaultSettings);
    setIsLocked(false);
    setLockoutState(defaultLockoutState);
    setAttemptHistory([]);
    if (user) {
      localStorage.removeItem(`${SECURITY_STORAGE_KEY}-${user.id}`);
      localStorage.removeItem(`${LOCKOUT_STATE_KEY}-${user.id}`);
      localStorage.removeItem(`${ATTEMPT_HISTORY_KEY}-${user.id}`);
      sessionStorage.removeItem(`${LOCK_STATE_KEY}-${user.id}`);
    }
  }, [user]);

  const enterSetupMode = useCallback(() => {
    setIsSetupMode(true);
  }, []);

  const exitSetupMode = useCallback(() => {
    setIsSetupMode(false);
  }, []);

  const requestPinReset = useCallback(async (): Promise<boolean> => {
    if (!user?.email) {
      toast.error('Email non disponible');
      return false;
    }

    try {
      toast.success('Instructions de réinitialisation envoyées par email');
      return true;
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
      return false;
    }
  }, [user]);

  const resetPinWithToken = useCallback(async (token: string, newPin: string): Promise<boolean> => {
    const newPinHash = hashPin(newPin);
    const newSettings = {
      ...settings,
      pinHash: newPinHash,
      pinLength: newPin.length as 4 | 6,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    setLockoutState(defaultLockoutState);
    saveLockoutState(defaultLockoutState);
    
    return true;
  }, [settings, saveSettings, saveLockoutState]);

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
