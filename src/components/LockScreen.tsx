import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Lock, Fingerprint, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { PINInput } from '@/components/PINInput';
import appLogo from '@/assets/app-logo.jpg';

interface LockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
  onBiometricUnlock?: () => Promise<boolean>;
  onForgotPin?: () => void;
  failedAttempts: number;
  maxAttempts: number;
  showBiometric: boolean;
  pinLength?: number;
  isVerifying?: boolean;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onUnlock,
  onBiometricUnlock,
  onForgotPin,
  failedAttempts,
  maxAttempts,
  showBiometric,
  pinLength = 4,
  isVerifying = false,
}) => {
  const { language } = useLanguage();
  const [error, setError] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const attemptsLeft = maxAttempts - failedAttempts;

  // Reset error state after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Watch for failed attempts changes to trigger error
  useEffect(() => {
    if (failedAttempts > 0) {
      setError(true);
    }
  }, [failedAttempts]);

  const handlePinComplete = useCallback(async (pin: string) => {
    setPinValue(pin);
    const success = await onUnlock(pin);
    if (!success) {
      setError(true);
    }
  }, [onUnlock]);

  const handleBiometric = useCallback(async () => {
    if (onBiometricUnlock) {
      const success = await onBiometricUnlock();
      if (!success) {
        setError(true);
      }
    }
  }, [onBiometricUnlock]);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full">
        {/* App Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={appLogo}
              alt="Smart Trade Tracker"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-display font-semibold text-foreground">
              Smart Trade Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'fr' ? 'Entrez votre code PIN' : 'Enter your PIN code'}
            </p>
          </div>
        </div>

        {/* PIN Input */}
        <PINInput
          length={pinLength}
          onComplete={handlePinComplete}
          onBiometric={showBiometric ? handleBiometric : undefined}
          showBiometric={showBiometric}
          disabled={isVerifying}
          error={error}
        />

        {/* Failed attempts warning */}
        {failedAttempts > 0 && attemptsLeft > 0 && (
          <div className="flex items-center gap-2 text-amber-500 text-sm animate-fade-in">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {language === 'fr'
                ? `${attemptsLeft} tentative${attemptsLeft > 1 ? 's' : ''} restante${attemptsLeft > 1 ? 's' : ''}`
                : `${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining`}
            </span>
          </div>
        )}

        {/* Max attempts reached warning */}
        {attemptsLeft <= 0 && (
          <div className="flex items-center gap-2 text-destructive text-sm animate-fade-in">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {language === 'fr'
                ? 'Nombre maximum de tentatives atteint'
                : 'Maximum attempts reached'}
            </span>
          </div>
        )}

        {/* Forgot PIN */}
        {onForgotPin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onForgotPin}
            className="text-muted-foreground hover:text-foreground"
          >
            {language === 'fr' ? 'Code PIN oublié ?' : 'Forgot PIN?'}
          </Button>
        )}
      </div>

      {/* Loading overlay */}
      {isVerifying && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
};

export default LockScreen;
