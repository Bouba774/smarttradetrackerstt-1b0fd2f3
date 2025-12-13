import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword } from '@/lib/passwordValidation';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

const ResetPassword: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    // Handle the password reset token from URL hash
    const handlePasswordReset = async () => {
      setIsLoading(true);
      
      // Check if we have hash parameters (from email link)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      console.log('Reset password - type:', type, 'has access token:', !!accessToken);
      
      if (type === 'recovery' && accessToken && refreshToken) {
        // Set the session with the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          console.error('Error setting session:', error);
          toast.error(language === 'fr' 
            ? 'Lien invalide ou expiré. Veuillez réessayer.' 
            : 'Invalid or expired link. Please try again.');
          navigate('/auth');
          return;
        }
        
        if (data.session) {
          setIsValidToken(true);
          // Clear the hash from URL for cleaner display
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        // Check if there's already a valid session (e.g., from previous token exchange)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsValidToken(true);
        } else {
          toast.error(language === 'fr' 
            ? 'Lien invalide ou expiré. Veuillez réessayer.' 
            : 'Invalid or expired link. Please try again.');
          navigate('/auth');
        }
      }
      
      setIsLoading(false);
    };
    
    handlePasswordReset();
  }, [navigate, language]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = language === 'fr' 
        ? 'Le mot de passe ne respecte pas les critères de sécurité'
        : 'Password does not meet security requirements';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = language === 'fr' 
        ? 'Les mots de passe ne correspondent pas' 
        : 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSuccess(true);
        toast.success(language === 'fr' 
          ? 'Mot de passe mis à jour avec succès !' 
          : 'Password updated successfully!');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while checking token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-profit/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-profit/10 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10 text-center">
          <div className="glass-card p-8 animate-fade-in">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              {language === 'fr' ? 'Vérification du lien...' : 'Verifying link...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-profit/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-profit/10 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10 text-center">
          <div className="glass-card p-8 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-profit/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-profit" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {language === 'fr' ? 'Mot de passe réinitialisé !' : 'Password reset!'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {language === 'fr' 
                ? 'Redirection vers le tableau de bord...' 
                : 'Redirecting to dashboard...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If token is not valid, don't show the form (user will be redirected)
  if (!isValidToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-profit/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-profit/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-neon">
              <TrendingUp className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Smart Trade Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-1">ALPHA FX</p>
        </div>

        {/* Reset Password Card */}
        <div className="glass-card p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-foreground mb-2">
            {language === 'fr' ? 'Nouveau mot de passe' : 'New password'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {language === 'fr' 
              ? 'Entrez votre nouveau mot de passe ci-dessous.' 
              : 'Enter your new password below.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                {language === 'fr' ? 'Nouveau mot de passe' : 'New password'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 bg-secondary/50 border-border ${errors.password ? 'border-loss' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-loss text-xs">{errors.password}</p>
              )}
              <PasswordStrengthIndicator password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                {language === 'fr' ? 'Confirmer le mot de passe' : 'Confirm password'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 bg-secondary/50 border-border ${errors.confirmPassword ? 'border-loss' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-loss text-xs">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-primary hover:opacity-90 font-display h-12"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t('loading')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {language === 'fr' ? 'Réinitialiser le mot de passe' : 'Reset password'}
                </div>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          {t('slogan')}
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
