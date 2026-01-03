import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Mail } from 'lucide-react';

type ConfirmationStatus = 'loading' | 'success' | 'error';

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle Supabase email confirmation
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check for token_hash and type in URL (Supabase email confirmation)
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      // Handle hash-based tokens (from email links)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');

        if (hashAccessToken && hashRefreshToken) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken
            });

            if (error) {
              console.error('Session error:', error);
              setStatus('error');
              setErrorMessage(language === 'fr' 
                ? 'Erreur lors de la confirmation.'
                : 'Confirmation error.');
              return;
            }

            setStatus('success');
            toast.success(language === 'fr' 
              ? 'Email confirmé avec succès !'
              : 'Email confirmed successfully!');
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
            return;
          } catch (err) {
            console.error('Hash token error:', err);
          }
        }
      }

      // Handle token_hash based confirmation
      if (tokenHash && type === 'signup') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'signup'
          });

          if (error) {
            console.error('OTP verification error:', error);
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }

          setStatus('success');
          toast.success(language === 'fr' 
            ? 'Email confirmé avec succès !'
            : 'Email confirmed successfully!');
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          return;
        } catch (err) {
          console.error('Token verification error:', err);
        }
      }

      // If no tokens found, show error
      setStatus('error');
      setErrorMessage(language === 'fr' 
        ? 'Lien de confirmation invalide ou expiré.'
        : 'Invalid or expired confirmation link.');
    };

    handleEmailConfirmation();
  }, [searchParams, navigate, language]);

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

        {/* Confirmation Card */}
        <div className="glass-card p-8 animate-fade-in text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">
                {language === 'fr' ? 'Confirmation en cours...' : 'Confirming...'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'fr' 
                  ? 'Nous vérifions votre email.'
                  : 'We are verifying your email.'}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-profit" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">
                {language === 'fr' ? 'Email confirmé !' : 'Email confirmed!'}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {language === 'fr' 
                  ? 'Votre compte est maintenant actif. Redirection en cours...'
                  : 'Your account is now active. Redirecting...'}
              </p>
              <div className="flex items-center justify-center gap-2 text-profit">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {language === 'fr' ? 'Redirection...' : 'Redirecting...'}
                </span>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <XCircle className="w-16 h-16 text-loss" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">
                {language === 'fr' ? 'Erreur de confirmation' : 'Confirmation error'}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Retour à la connexion' : 'Back to login'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;