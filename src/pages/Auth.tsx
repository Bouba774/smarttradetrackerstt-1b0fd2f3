import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, TrendingUp, Zap, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { createPasswordSchema, validatePassword } from '@/lib/passwordValidation';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import TurnstileWidget from '@/components/TurnstileWidget';

// Cloudflare Turnstile Site Key from environment variables
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

const Auth: React.FC = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; nickname?: string }>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const emailSchema = z.string().email(t('invalidEmail'));
  const passwordSchema = createPasswordSchema(language);
  const nicknameSchema = z.string().min(2, t('nicknameMin2'));

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    if (!isForgotPassword) {
      // Only apply strict password validation on signup
      if (!isLogin) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          newErrors.password = language === 'fr' 
            ? 'Le mot de passe ne respecte pas les critères de sécurité'
            : 'Password does not meet security requirements';
        }
      } else {
        // For login, just check minimum length
        if (password.length < 6) {
          newErrors.password = t('passwordMin6');
        }
      }

      if (!isLogin) {
        try {
          nicknameSchema.parse(nickname);
        } catch (e) {
          if (e instanceof z.ZodError) {
            newErrors.nickname = e.errors[0].message;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check captcha if site key is configured
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      toast.error(language === 'fr' ? 'Veuillez compléter le captcha' : 'Please complete the captcha');
      return;
    }
    
    setIsSubmitting(true);

    // Backend verification of Turnstile token
    if (TURNSTILE_SITE_KEY && captchaToken) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-turnstile', {
          body: { token: captchaToken }
        });

        if (error || !data?.success) {
          console.error('Turnstile verification failed:', error || data);
          toast.error(language === 'fr' 
            ? 'Vérification captcha échouée. Veuillez réessayer.' 
            : 'Captcha verification failed. Please try again.');
          setIsSubmitting(false);
          setCaptchaToken(null);
          return;
        }
      } catch (err) {
        console.error('Error verifying Turnstile:', err);
        toast.error(language === 'fr' 
          ? 'Erreur de vérification. Veuillez réessayer.' 
          : 'Verification error. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success(language === 'fr' 
            ? 'Email envoyé ! Vérifiez votre boîte mail.' 
            : 'Email sent! Check your inbox.');
          setIsForgotPassword(false);
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error(t('invalidCredentials'));
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(t('loginSuccess'));
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, nickname);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error(t('emailAlreadyUsed'));
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(t('accountCreated'));
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
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

        {/* Auth Card */}
        <div className="glass-card p-8 animate-fade-in">
          {isForgotPassword ? (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {language === 'fr' ? 'Retour' : 'Back'}
                </button>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {language === 'fr' ? 'Mot de passe oublié' : 'Forgot password'}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {language === 'fr' 
                  ? 'Entrez votre email pour recevoir un lien de réinitialisation.' 
                  : 'Enter your email to receive a reset link.'}
              </p>
            </>
          ) : (
            <div className="flex mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${
                  isLogin 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('login')}
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${
                  !isLogin 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('signUp')}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-foreground">
                  {t('nickname')}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className={`pl-10 bg-secondary/50 border-border ${errors.nickname ? 'border-loss' : ''}`}
                    placeholder={t('yourTraderNickname')}
                  />
                </div>
                {errors.nickname && (
                  <p className="text-loss text-xs">{errors.nickname}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 bg-secondary/50 border-border ${errors.email ? 'border-loss' : ''}`}
                  placeholder="trader@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-loss text-xs">{errors.email}</p>
              )}
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  {t('password')}
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
                {/* Show password strength indicator only on signup */}
                {!isLogin && <PasswordStrengthIndicator password={password} />}
              </div>
            )}

            {/* Forgot password link */}
            {isLogin && !isForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  {language === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}
                </button>
              </div>
            )}

            {/* Cloudflare Turnstile */}
            {TURNSTILE_SITE_KEY && (
              <TurnstileWidget
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
                theme={theme === 'dark' ? 'dark' : 'light'}
                language={language === 'fr' ? 'fr' : 'en'}
              />
            )}

            <Button
              type="submit"
              disabled={isSubmitting || (!!TURNSTILE_SITE_KEY && !captchaToken)}
              className="w-full bg-gradient-primary hover:opacity-90 font-display h-12"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t('loading')}
                </div>
              ) : isForgotPassword ? (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {language === 'fr' ? 'Envoyer le lien' : 'Send reset link'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {isLogin ? t('signIn') : t('createAccount')}
                </div>
              )}
            </Button>

            {/* Legal consent message */}
            {!isForgotPassword && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                {t('consentMessage')}{' '}
                <Link to="/privacy-policy" className="text-profit hover:underline">
                  {t('privacyRules')}
                </Link>
                {' '}{t('and_connector')}{' '}
                <Link to="/terms-of-use" className="text-profit hover:underline">
                  {t('termsOfUse')}
                </Link>
                .
              </p>
            )}
          </form>

          {!isForgotPassword && (
            <p className="text-center text-xs text-muted-foreground mt-6">
              {isLogin ? t('noAccountYet') : t('alreadyHaveAccount')}
              {' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? t('signUp') : t('signIn')}
              </button>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          {t('slogan')}
        </p>
      </div>
    </div>
  );
};

export default Auth;
