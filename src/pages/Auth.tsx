import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Zap, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { createPasswordSchema, validatePassword } from '@/lib/passwordValidation';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import TurnstileWidget from '@/components/TurnstileWidget';
import { useConnectionSecurity } from '@/hooks/useConnectionSecurity';
import { useEmailValidation } from '@/hooks/useEmailValidation';

// Cloudflare Turnstile Site Key (public key, safe to expose in client code)
const TURNSTILE_SITE_KEY = '0x4AAAAAACG-_s2EZYR5V8_J';

type AuthStep = 'credentials' | 'email_sent' | 'confirm_email';

const Auth: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, user, loading } = useAuth();
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { checkConnection } = useConnectionSecurity();
  const { validateEmail: validateEmailAddress, isValidating: isValidatingEmail } = useEmailValidation();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; nickname?: string }>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Enable Turnstile only if not on localhost
  const isLocalhost = (): boolean => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  };
  
  const hasTurnstile = !isLocalhost();

  const emailSchema = z.string().email(t('invalidEmail'));
  const passwordSchema = createPasswordSchema(language);
  const nicknameSchema = z.string().min(2, t('nicknameMin2'));

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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

    // Check if currently blocked
    if (isBlocked) {
      toast.error(language === 'fr' 
        ? 'Trop de tentatives. Veuillez réessayer plus tard.'
        : 'Too many attempts. Please try again later.');
      return;
    }

    // Check captcha only if Turnstile is enabled (not in preview/dev)
    if (hasTurnstile && !captchaToken) {
      toast.error(language === 'fr' ? 'Veuillez compléter le captcha' : 'Please complete the captcha');
      return;
    }
    
    setIsSubmitting(true);

    // Check rate limit before login attempt
    if (isLogin && !isForgotPassword) {
      try {
        const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
          p_identifier: email.toLowerCase(),
          p_attempt_type: 'login',
          p_max_attempts: 5,
          p_window_minutes: 15,
          p_block_minutes: 30
        });

        if (rateLimitError) {
          // Silent fail - don't expose rate limit errors
        } else if (rateLimitResult) {
          const result = rateLimitResult as { allowed: boolean; blocked: boolean; message: string };
          
          if (!result.allowed || result.blocked) {
            setIsBlocked(true);
            toast.error(language === 'fr' 
              ? 'Trop de tentatives. Veuillez réessayer plus tard.'
              : 'Too many attempts. Please try again later.');
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        // Silent fail - don't expose errors
      }
    }

    // Backend verification of Turnstile token (only if Turnstile is enabled)
    if (hasTurnstile && captchaToken) {
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
        // SECURITY: Always show success message to prevent email enumeration
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        toast.success(language === 'fr' 
          ? 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' 
          : 'If an account exists with this email, you will receive a reset link.');
        setIsForgotPassword(false);
      } else if (isLogin) {
        // NEW FLOW: Send login confirmation email instead of direct login
        const startTime = Date.now();
        
        const { data, error } = await supabase.functions.invoke('auth-send-login-confirmation', {
          body: {
            email,
            password,
            language,
            userAgent: navigator.userAgent
          }
        });
        
        const elapsed = Date.now() - startTime;
        const minDelay = 500;
        if (elapsed < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
        }
        
        if (error || !data?.success) {
          // Generic error message - don't reveal details
          toast.error(t('authError'));
        } else {
          // Show email sent confirmation screen
          setAuthStep('email_sent');
          setResendCooldown(60); // 60 seconds before can resend
          toast.success(language === 'fr'
            ? 'Un email de confirmation a été envoyé.'
            : 'A confirmation email has been sent.');
        }
      } else {
        // SIGNUP FLOW
        const emailValidation = await validateEmailAddress(email, false);
        if (!emailValidation.valid) {
          toast.error(emailValidation.message || (language === 'fr'
            ? 'Veuillez utiliser une adresse email personnelle ou professionnelle valide.'
            : 'Please use a valid personal or professional email address.'));
          setIsSubmitting(false);
          return;
        }

        const startTime = Date.now();
        const { error } = await signUp(email, password, nickname);
        const elapsed = Date.now() - startTime;
        const minDelay = 500;
        
        if (elapsed < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
        }
        
        if (error) {
          if (error.message.includes('User already registered') || 
              error.message.includes('already been registered')) {
            // Show confirmation screen anyway to prevent enumeration
            setAuthStep('confirm_email');
            toast.success(language === 'fr'
              ? 'Si cet email n\'est pas déjà enregistré, vous recevrez un email de confirmation.'
              : 'If this email is not already registered, you will receive a confirmation email.');
          } else {
            toast.error(t('authError'));
          }
        } else {
          // Show confirmation screen
          setAuthStep('confirm_email');
          toast.success(language === 'fr'
            ? 'Un email de confirmation a été envoyé à votre adresse.'
            : 'A confirmation email has been sent to your address.');
        }
      }
    } catch (error) {
      toast.error(t('authError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend email
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        // Resend login confirmation
        const { data, error } = await supabase.functions.invoke('auth-send-login-confirmation', {
          body: {
            email,
            password,
            language,
            userAgent: navigator.userAgent
          }
        });
        
        if (error || !data?.success) {
          toast.error(language === 'fr'
            ? 'Erreur lors de l\'envoi. Veuillez réessayer.'
            : 'Error sending email. Please try again.');
        } else {
          setResendCooldown(60);
          toast.success(language === 'fr'
            ? 'Email renvoyé avec succès.'
            : 'Email resent successfully.');
        }
      } else {
        // Resend signup confirmation
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm-email`
          }
        });
        
        if (error) {
          toast.error(language === 'fr'
            ? 'Erreur lors de l\'envoi. Veuillez réessayer.'
            : 'Error sending email. Please try again.');
        } else {
          setResendCooldown(60);
          toast.success(language === 'fr'
            ? 'Email renvoyé avec succès.'
            : 'Email resent successfully.');
        }
      }
    } catch (err) {
      toast.error(t('authError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to credentials step
  const handleBackToCredentials = () => {
    setAuthStep('credentials');
    setPassword('');
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(t('googleAuthError'));
      }
    } catch (err) {
      toast.error(t('googleAuthError'));
    } finally {
      setIsGoogleLoading(false);
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
      {/* Dev Mode Badge */}
      {!hasTurnstile && (
        <div className="absolute top-4 right-4 z-50">
          <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm">
            <span className="text-xs font-medium text-amber-500">
              🛠️ {language === 'fr' ? 'Mode Dev - Captcha désactivé' : 'Dev Mode - Captcha disabled'}
            </span>
          </div>
        </div>
      )}

      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-profit/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-profit/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Back to landing button */}
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
              className="w-20 h-20 rounded-2xl object-cover animate-logo-glow"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Smart Trade Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-1">ALPHA FX</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8 animate-fade-in">
          {/* Email Sent Confirmation Screen */}
          {authStep === 'email_sent' && (
            <>
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'fr' ? 'Vérifiez votre email' : 'Check your email'}
                </h2>
                <p className="text-muted-foreground text-sm mb-2">
                  {language === 'fr' 
                    ? 'Un email de confirmation a été envoyé à :'
                    : 'A confirmation email has been sent to:'}
                </p>
                <p className="text-foreground font-medium mb-6">{email}</p>
                <p className="text-muted-foreground text-xs mb-6">
                  {language === 'fr'
                    ? 'Cliquez sur le lien dans l\'email pour confirmer votre connexion. Le lien expire dans 15 minutes.'
                    : 'Click the link in the email to confirm your login. The link expires in 15 minutes.'}
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    disabled={resendCooldown > 0 || isSubmitting}
                    variant="outline"
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {resendCooldown > 0 
                      ? `${language === 'fr' ? 'Renvoyer dans' : 'Resend in'} ${resendCooldown}s`
                      : (language === 'fr' ? 'Renvoyer l\'email' : 'Resend email')}
                  </Button>
                  
                  <button
                    onClick={handleBackToCredentials}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3 inline mr-1" />
                    {language === 'fr' ? 'Utiliser une autre adresse' : 'Use a different email'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email Confirmation Screen (Signup) */}
          {authStep === 'confirm_email' && (
            <>
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-profit/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-profit" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'fr' ? 'Confirmez votre email' : 'Confirm your email'}
                </h2>
                <p className="text-muted-foreground text-sm mb-2">
                  {language === 'fr' 
                    ? 'Un email de confirmation a été envoyé à :'
                    : 'A confirmation email has been sent to:'}
                </p>
                <p className="text-foreground font-medium mb-6">{email}</p>
                <p className="text-muted-foreground text-xs mb-6">
                  {language === 'fr'
                    ? 'Cliquez sur le lien dans l\'email pour activer votre compte. Le lien expire dans 24 heures.'
                    : 'Click the link in the email to activate your account. The link expires in 24 hours.'}
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    disabled={resendCooldown > 0 || isSubmitting}
                    variant="outline"
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {resendCooldown > 0 
                      ? `${language === 'fr' ? 'Renvoyer dans' : 'Resend in'} ${resendCooldown}s`
                      : (language === 'fr' ? 'Renvoyer l\'email' : 'Resend email')}
                  </Button>
                  
                  <button
                    onClick={handleBackToCredentials}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3 inline mr-1" />
                    {language === 'fr' ? 'Retour à l\'inscription' : 'Back to signup'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Credentials Form */}
          {authStep === 'credentials' && (
            <>
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

              {/* Google OAuth Button */}
              {!isForgotPassword && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isSubmitting}
                    className="w-full h-12 mb-4 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-secondary/50 dark:hover:bg-secondary dark:text-foreground dark:border-border"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    {t('continueWithGoogle')}
                  </Button>
                  
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t('or')}</span>
                    </div>
                  </div>
                </>
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
            {hasTurnstile && (
              <TurnstileWidget
                siteKey={TURNSTILE_SITE_KEY!}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
                theme={theme === 'dark' ? 'dark' : 'light'}
                language={language === 'fr' ? 'fr' : 'en'}
              />
            )}

            <Button
              type="submit"
              disabled={isSubmitting || (hasTurnstile && !captchaToken)}
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

          {authStep === 'credentials' && !isForgotPassword && (
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
            </>
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
