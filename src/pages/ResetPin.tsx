import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { PINInput } from '@/components/PINInput';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/version';

const ResetPin: React.FC = () => {
  const { language } = useLanguage();
  const { resetPinWithToken } = useSecurity();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<'enter' | 'confirm' | 'success' | 'expired'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isValidToken, setIsValidToken] = useState(false);

  const token = searchParams.get('token');
  const expiresAt = searchParams.get('expires');

  useEffect(() => {
    if (!token || !expiresAt) {
      setStep('expired');
      return;
    }

    const expiryTime = parseInt(expiresAt, 10);
    if (isNaN(expiryTime) || Date.now() > expiryTime) {
      setStep('expired');
      return;
    }

    setIsValidToken(true);
    setTimeRemaining(expiryTime - Date.now());

    const interval = setInterval(() => {
      const remaining = expiryTime - Date.now();
      if (remaining <= 0) {
        setStep('expired');
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token, expiresAt]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePinEntry = async (pin: string) => {
    if (step === 'enter') {
      setFirstPin(pin);
      setStep('confirm');
    } else if (step === 'confirm') {
      if (pin === firstPin) {
        const success = await resetPinWithToken(token || '', pin);
        if (success) {
          setStep('success');
          toast.success(
            language === 'fr'
              ? 'Code PIN réinitialisé avec succès !'
              : 'PIN code reset successfully!'
          );
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          toast.error(
            language === 'fr'
              ? 'Erreur lors de la réinitialisation'
              : 'Error during reset'
          );
        }
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
          setStep('enter');
          setFirstPin('');
        }, 500);
        toast.error(
          language === 'fr'
            ? 'Les codes PIN ne correspondent pas'
            : 'PIN codes do not match'
        );
      }
    }
  };

  if (step === 'expired') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'fr' ? 'Lien expiré' : 'Link Expired'}
          </h1>
          
          <p className="text-muted-foreground">
            {language === 'fr'
              ? 'Ce lien de réinitialisation a expiré ou est invalide. Veuillez demander un nouveau lien.'
              : 'This reset link has expired or is invalid. Please request a new link.'
            }
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'fr' ? 'PIN réinitialisé !' : 'PIN Reset!'}
          </h1>
          
          <p className="text-muted-foreground">
            {language === 'fr'
              ? 'Votre nouveau code PIN a été configuré avec succès. Redirection...'
              : 'Your new PIN code has been set successfully. Redirecting...'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full">
        {/* Logo/Icon */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg">
          <Shield className="w-10 h-10 text-primary" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="text-muted-foreground">
            {step === 'enter'
              ? language === 'fr' ? 'Créer un nouveau code PIN' : 'Create a new PIN code'
              : language === 'fr' ? 'Confirmer votre nouveau code PIN' : 'Confirm your new PIN code'
            }
          </p>
        </div>

        {/* Time remaining */}
        {isValidToken && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            timeRemaining < 2 * 60 * 1000
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          )}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {language === 'fr' ? 'Expire dans' : 'Expires in'}: {formatTime(timeRemaining)}
            </span>
          </div>
        )}

        {/* PIN Input */}
        <PINInput
          length={4}
          onComplete={handlePinEntry}
          error={error}
          showConfirm={true}
        />

        {/* Hint */}
        {step === 'confirm' && (
          <p className="text-sm text-muted-foreground text-center">
            {language === 'fr'
              ? 'Entrez à nouveau le même code pour confirmer'
              : 'Enter the same code again to confirm'
            }
          </p>
        )}

        {/* Security Info */}
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground/70">
            {language === 'fr'
              ? 'Choisissez un code PIN sécurisé que vous n\'oublierez pas'
              : 'Choose a secure PIN code that you will remember'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPin;
