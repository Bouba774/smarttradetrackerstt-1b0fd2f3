import React, { useState, useRef, useCallback } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import { PINInput } from './PINInput';
import { Lock, Shield, AlertTriangle, Clock, KeyRound, Mail, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/version';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

// Safe language hook that doesn't throw if context is unavailable
const useSafeLanguage = () => {
  try {
    // Dynamic import to avoid circular dependencies
    const { useLanguage } = require('@/contexts/LanguageContext');
    return useLanguage();
  } catch {
    return { language: 'en' as const };
  }
};

export const LockScreen: React.FC = () => {
  const { language } = useSafeLanguage();
  const { 
    isLocked, 
    isSetupMode, 
    settings, 
    unlock, 
    unlockWithBiometric,
    setupPin, 
    exitSetupMode,
    failedAttempts,
    remainingAttempts,
    isBlocked,
    blockTimeRemaining,
    blockCount,
    requestPinReset,
    canUseBiometric,
    isLoading,
  } = useSecurity();
  
  const [error, setError] = useState(false);
  const [setupStep, setSetupStep] = useState<'enter' | 'confirm'>('enter');
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use ref for firstPin to persist across re-renders without causing stale closures
  const firstPinRef = useRef<string>('');

  // Don't render anything if not locked and not in setup mode
  if (!isLocked && !isSetupMode) {
    return null;
  }

  // Show loading state while security context is initializing
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg">
            <Shield className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            {language === 'fr' ? 'Chargement...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const handleUnlock = async (pin: string) => {
    if (isBlocked) return;
    
    const success = await unlock(pin);
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const handleBiometricUnlock = async () => {
    if (!canUseBiometric) return;
    
    setIsBiometricLoading(true);
    try {
      await unlockWithBiometric();
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleSetup = useCallback(async (pin: string) => {
    // Prevent double processing
    if (isProcessing) return;
    
    if (setupStep === 'enter') {
      // Store the first PIN and move to confirmation step
      firstPinRef.current = pin;
      setSetupStep('confirm');
    } else if (setupStep === 'confirm') {
      // Compare with stored first PIN
      const storedFirstPin = firstPinRef.current;
      
      if (pin === storedFirstPin && storedFirstPin.length > 0) {
        setIsProcessing(true);
        try {
          await setupPin(pin);
          // Success - reset everything
          setSetupStep('enter');
          firstPinRef.current = '';
        } catch (error) {
          console.error('Error setting up PIN:', error);
          setError(true);
          setTimeout(() => {
            setError(false);
            setSetupStep('enter');
            firstPinRef.current = '';
          }, 500);
        } finally {
          setIsProcessing(false);
        }
      } else {
        // PINs don't match - show error and reset
        setError(true);
        setTimeout(() => {
          setError(false);
          setSetupStep('enter');
          firstPinRef.current = '';
        }, 500);
      }
    }
  }, [setupStep, setupPin, isProcessing]);

  const handleCancelSetup = () => {
    exitSetupMode();
    setSetupStep('enter');
    firstPinRef.current = '';
  };

  const handleForgotPin = async () => {
    setIsRequestingReset(true);
    await requestPinReset();
    setIsRequestingReset(false);
    setShowForgotDialog(false);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getWarningMessage = () => {
    if (isBlocked) {
      return language === 'fr'
        ? `Compte bloqué. Réessayez dans ${formatTime(blockTimeRemaining)}`
        : `Account blocked. Try again in ${formatTime(blockTimeRemaining)}`;
    }
    
    if (failedAttempts === 0) return null;
    
    if (failedAttempts >= 4) {
      return language === 'fr'
        ? '⚠️ Dernier essai avant blocage !'
        : '⚠️ Last attempt before lockout!';
    }
    
    return language === 'fr'
      ? `PIN incorrect. ${remainingAttempts} tentatives restantes`
      : `Incorrect PIN. ${remainingAttempts} attempts remaining`;
  };

  const warningMessage = getWarningMessage();

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full">
        {/* Logo/Icon */}
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br from-primary/20 to-primary/5",
          "border border-primary/20 shadow-lg",
          isBlocked && "from-destructive/20 to-destructive/5 border-destructive/20"
        )}>
          {isSetupMode ? (
            <Shield className="w-10 h-10 text-primary" />
          ) : isBlocked ? (
            <Clock className="w-10 h-10 text-destructive animate-pulse" />
          ) : (
            <Lock className="w-10 h-10 text-primary" />
          )}
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="text-muted-foreground">
            {isSetupMode
              ? setupStep === 'enter'
                ? language === 'fr' ? 'Créer votre code PIN' : 'Create your PIN code'
                : language === 'fr' ? 'Confirmer votre code PIN' : 'Confirm your PIN code'
              : isBlocked
                ? language === 'fr' ? 'Compte temporairement bloqué' : 'Account temporarily blocked'
                : language === 'fr' ? 'Entrez votre code PIN' : 'Enter your PIN code'
            }
          </p>
        </div>

        {/* Blocked State - Countdown */}
        {isBlocked && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className={cn(
              "text-5xl font-mono font-bold",
              "bg-gradient-to-r from-destructive to-destructive/70 bg-clip-text text-transparent"
            )}>
              {formatTime(blockTimeRemaining)}
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === 'fr'
                  ? blockCount === 1 
                    ? 'Blocage de 15 minutes'
                    : blockCount === 2
                      ? 'Blocage de 30 minutes (2ème blocage)'
                      : `Blocage de 1 heure (${blockCount}ème blocage)`
                  : blockCount === 1
                    ? '15 minute lockout'
                    : blockCount === 2
                      ? '30 minute lockout (2nd block)'
                      : `1 hour lockout (${blockCount}${blockCount === 3 ? 'rd' : 'th'} block)`
                }
              </p>
              {blockCount >= 2 && (
                <p className="text-xs text-destructive">
                  {language === 'fr'
                    ? blockCount >= 3
                      ? '⚠️ Prochain blocage: déconnexion complète requise'
                      : '⚠️ Attention: prochain blocage sera de 1 heure'
                    : blockCount >= 3
                      ? '⚠️ Next block: full re-login required'
                      : '⚠️ Warning: next block will be 1 hour'
                  }
                </p>
              )}
            </div>
          </div>
        )}

        {/* Warning/Error Message */}
        {warningMessage && !isBlocked && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg w-full max-w-xs",
            failedAttempts >= 4
              ? "bg-destructive/20 border border-destructive/30 text-destructive"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          )}>
            <AlertTriangle className={cn("w-5 h-5 shrink-0", failedAttempts >= 4 && "animate-pulse")} />
            <span className={cn("text-sm", failedAttempts >= 4 && "font-semibold")}>
              {warningMessage}
            </span>
          </div>
        )}

        {/* Biometric Button - shown when available and not blocked */}
        {canUseBiometric && !isSetupMode && !isBlocked && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleBiometricUnlock}
            disabled={isBiometricLoading}
            className="gap-3 h-14 px-6 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
          >
            <Fingerprint className={cn("w-6 h-6 text-primary", isBiometricLoading && "animate-pulse")} />
            <span className="text-foreground">
              {language === 'fr' ? 'Empreinte / Face ID' : 'Fingerprint / Face ID'}
            </span>
          </Button>
        )}

        {/* Biometric warning after block */}
        {!canUseBiometric && settings.biometricEnabled && blockCount > 0 && !isBlocked && !isSetupMode && (
          <div className="text-xs text-amber-500 text-center px-4">
            {language === 'fr'
              ? '⚠️ Biométrie désactivée après blocage. Veuillez utiliser votre PIN.'
              : '⚠️ Biometric disabled after lockout. Please use your PIN.'
            }
          </div>
        )}

        {/* PIN Input (hidden when blocked) */}
        {!isBlocked && (
          <PINInput
            key={isSetupMode ? `setup-${setupStep}` : 'unlock'}
            length={isSetupMode ? 4 : settings.pinLength}
            onComplete={isSetupMode ? handleSetup : handleUnlock}
            onCancel={isSetupMode ? handleCancelSetup : undefined}
            error={error}
            showConfirm={isSetupMode}
            disabled={isBlocked}
          />
        )}

        {/* Setup hint */}
        {isSetupMode && setupStep === 'confirm' && (
          <p className="text-sm text-muted-foreground text-center">
            {language === 'fr' 
              ? 'Entrez à nouveau le même code pour confirmer'
              : 'Enter the same code again to confirm'
            }
          </p>
        )}

        {/* Forgot PIN Button */}
        {!isSetupMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForgotDialog(true)}
            className="text-muted-foreground hover:text-primary"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            {language === 'fr' ? 'PIN oublié ?' : 'Forgot PIN?'}
          </Button>
        )}

        {/* Security Info */}
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground/70">
            {language === 'fr' 
              ? 'Vos données sont protégées et chiffrées'
              : 'Your data is protected and encrypted'
            }
          </p>
        </div>
      </div>

      {/* Forgot PIN Dialog */}
      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              {language === 'fr' ? 'PIN oublié' : 'Forgot PIN'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr'
                ? 'Un lien de réinitialisation sera envoyé à votre adresse email. Ce lien sera valide pendant 10 minutes.'
                : 'A reset link will be sent to your email address. This link will be valid for 10 minutes.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Button
              onClick={handleForgotPin}
              disabled={isRequestingReset}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isRequestingReset
                ? language === 'fr' ? 'Envoi en cours...' : 'Sending...'
                : language === 'fr' ? 'Envoyer le lien' : 'Send reset link'
              }
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForgotDialog(false)}
              className="w-full"
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LockScreen;
