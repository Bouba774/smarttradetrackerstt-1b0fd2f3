import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'used';

const VerifyLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage(language === 'fr' 
          ? 'Lien de vérification invalide.'
          : 'Invalid verification link.');
        return;
      }

      try {
        console.log('Verifying login token...');
        
        const { data, error } = await supabase.functions.invoke('auth-verify-login', {
          body: { token }
        });

        if (error) {
          console.error('Verification error:', error);
          setStatus('error');
          setErrorMessage(language === 'fr' 
            ? 'Erreur lors de la vérification.'
            : 'Verification error.');
          return;
        }

        if (!data.success) {
          // Determine the type of error
          if (data.error?.includes('expiré') || data.error?.includes('expired')) {
            setStatus('expired');
          } else if (data.error?.includes('utilisé') || data.error?.includes('used')) {
            setStatus('used');
          } else {
            setStatus('error');
          }
          setErrorMessage(data.error || (language === 'fr' 
            ? 'Erreur de vérification.'
            : 'Verification error.'));
          return;
        }

        // Success! Now we need to authenticate the user
        setStatus('success');
        setIsRedirecting(true);

        // Use the action link to complete authentication
        if (data.actionLink) {
          // Extract the token from the action link and use verifyOtp
          const url = new URL(data.actionLink);
          const tokenHash = url.searchParams.get('token');
          const type = url.searchParams.get('type') as 'magiclink';
          
          if (tokenHash && type) {
            const { error: otpError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'magiclink'
            });

            if (otpError) {
              console.error('OTP verification error:', otpError);
              // Still redirect to auth, but with an error
              toast.error(language === 'fr' 
                ? 'Erreur lors de la connexion automatique. Veuillez vous reconnecter.'
                : 'Auto-login error. Please log in again.');
              navigate('/auth');
              return;
            }
          }
        }

        // Show success message
        toast.success(language === 'fr' 
          ? 'Connexion confirmée ! Bienvenue !'
          : 'Login confirmed! Welcome!');

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);

      } catch (err) {
        console.error('Token verification failed:', err);
        setStatus('error');
        setErrorMessage(language === 'fr' 
          ? 'Une erreur inattendue est survenue.'
          : 'An unexpected error occurred.');
      }
    };

    verifyToken();
  }, [token, navigate, language]);

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="w-16 h-16 text-primary animate-spin" />,
          title: language === 'fr' ? 'Vérification en cours...' : 'Verifying...',
          description: language === 'fr' 
            ? 'Nous confirmons votre connexion.'
            : 'We are confirming your login.',
          showRetry: false
        };
      
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-profit" />,
          title: language === 'fr' ? 'Connexion confirmée !' : 'Login confirmed!',
          description: isRedirecting 
            ? (language === 'fr' 
                ? 'Redirection vers votre tableau de bord...'
                : 'Redirecting to your dashboard...')
            : (language === 'fr' 
                ? 'Votre connexion a été validée avec succès.'
                : 'Your login has been successfully validated.'),
          showRetry: false
        };
      
      case 'expired':
        return {
          icon: <XCircle className="w-16 h-16 text-warning" />,
          title: language === 'fr' ? 'Lien expiré' : 'Link expired',
          description: language === 'fr' 
            ? 'Ce lien de confirmation a expiré. Veuillez vous reconnecter pour recevoir un nouveau lien.'
            : 'This confirmation link has expired. Please log in again to receive a new link.',
          showRetry: true
        };
      
      case 'used':
        return {
          icon: <XCircle className="w-16 h-16 text-muted-foreground" />,
          title: language === 'fr' ? 'Lien déjà utilisé' : 'Link already used',
          description: language === 'fr' 
            ? 'Ce lien de confirmation a déjà été utilisé. Si vous n\'êtes pas connecté, veuillez vous reconnecter.'
            : 'This confirmation link has already been used. If you are not logged in, please log in again.',
          showRetry: true
        };
      
      case 'error':
      default:
        return {
          icon: <XCircle className="w-16 h-16 text-loss" />,
          title: language === 'fr' ? 'Erreur de vérification' : 'Verification error',
          description: errorMessage,
          showRetry: true
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-profit/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-profit/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/app-logo.jpg" 
              alt="Smart Trade Tracker" 
              className="w-16 h-16 rounded-2xl object-cover"
            />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Smart Trade Tracker
          </h1>
        </div>

        {/* Verification Card */}
        <div className="glass-card p-8 animate-fade-in text-center">
          <div className="flex justify-center mb-6">
            {content.icon}
          </div>
          
          <h2 className="text-xl font-bold text-foreground mb-3">
            {content.title}
          </h2>
          
          <p className="text-muted-foreground text-sm mb-6">
            {content.description}
          </p>

          {content.showRetry && (
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Se reconnecter' : 'Log in again'}
              </Button>
              
              <Link
                to="/"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
              </Link>
            </div>
          )}

          {status === 'success' && isRedirecting && (
            <div className="flex items-center justify-center gap-2 text-profit">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {language === 'fr' ? 'Redirection...' : 'Redirecting...'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyLogin;