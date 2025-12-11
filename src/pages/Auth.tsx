import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, TrendingUp, Zap } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email invalide');
const passwordSchema = z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères');
const nicknameSchema = z.string().min(2, 'Le pseudo doit contenir au moins 2 caractères');

const Auth: React.FC = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; nickname?: string }>({});

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

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error(language === 'fr' ? 'Email ou mot de passe incorrect' : 'Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(language === 'fr' ? 'Connexion réussie!' : 'Login successful!');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, nickname);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error(language === 'fr' ? 'Cet email est déjà utilisé' : 'This email is already registered');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(language === 'fr' ? 'Compte créé avec succès!' : 'Account created successfully!');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(language === 'fr' ? 'Une erreur est survenue' : 'An error occurred');
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
          <div className="flex mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${
                isLogin 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {language === 'fr' ? 'Connexion' : 'Login'}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${
                !isLogin 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {language === 'fr' ? 'Inscription' : 'Sign Up'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-foreground">
                  {language === 'fr' ? 'Pseudo' : 'Nickname'}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className={`pl-10 bg-secondary/50 border-border ${errors.nickname ? 'border-loss' : ''}`}
                    placeholder={language === 'fr' ? 'Votre pseudo de trader' : 'Your trader nickname'}
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                {language === 'fr' ? 'Mot de passe' : 'Password'}
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
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-primary hover:opacity-90 font-display h-12"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {language === 'fr' ? 'Chargement...' : 'Loading...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {isLogin 
                    ? (language === 'fr' ? 'Se connecter' : 'Login')
                    : (language === 'fr' ? 'Créer un compte' : 'Create Account')
                  }
                </div>
              )}
            </Button>

            {/* Legal consent message */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              {language === 'fr' ? (
                <>
                  En continuant, vous acceptez nos{' '}
                  <Link to="/privacy-policy" className="text-profit hover:underline">
                    règles de confidentialité
                  </Link>
                  {' '}et{' '}
                  <Link to="/terms-of-use" className="text-profit hover:underline">
                    conditions d'utilisation
                  </Link>
                  .
                </>
              ) : (
                <>
                  By continuing, you agree to our{' '}
                  <Link to="/privacy-policy" className="text-profit hover:underline">
                    privacy policy
                  </Link>
                  {' '}and{' '}
                  <Link to="/terms-of-use" className="text-profit hover:underline">
                    terms of use
                  </Link>
                  .
                </>
              )}
            </p>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {isLogin 
              ? (language === 'fr' ? "Pas encore de compte?" : "Don't have an account?")
              : (language === 'fr' ? 'Déjà un compte?' : 'Already have an account?')
            }
            {' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin 
                ? (language === 'fr' ? "S'inscrire" : 'Sign up')
                : (language === 'fr' ? 'Se connecter' : 'Login')
              }
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Créé par un trader pour les traders. ALPHA FX.
        </p>
      </div>
    </div>
  );
};

export default Auth;
