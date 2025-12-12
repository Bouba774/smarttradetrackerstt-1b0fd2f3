import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  BarChart3, 
  Brain, 
  Target, 
  Video, 
  Calculator,
  Trophy,
  Shield,
  Sparkles,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import ParticleBackground from '@/components/landing/ParticleBackground';
import TradingChartAnimation from '@/components/landing/TradingChartAnimation';
import BullBearAnimation from '@/components/landing/BullBearAnimation';
import MiniWidgets from '@/components/landing/MiniWidgets';
import QuoteRotator from '@/components/landing/QuoteRotator';
import DigitalClock from '@/components/landing/DigitalClock';
import { APP_NAME, APP_VERSION } from '@/lib/version';

const Landing = () => {
  const { t, language } = useLanguage();

  const features = [
    { icon: BarChart3, title: language === 'fr' ? 'Dashboard Pro' : 'Pro Dashboard', desc: language === 'fr' ? 'Statistiques avancées en temps réel' : 'Advanced real-time statistics' },
    { icon: TrendingUp, title: language === 'fr' ? 'Suivi des Trades' : 'Trade Tracking', desc: language === 'fr' ? 'Enregistrez chaque position avec précision' : 'Record every position accurately' },
    { icon: Brain, title: language === 'fr' ? 'Analyse Psychologique' : 'Psychological Analysis', desc: language === 'fr' ? 'Comprenez vos émotions de trading' : 'Understand your trading emotions' },
    { icon: Video, title: language === 'fr' ? 'Journal Vidéo' : 'Video Journal', desc: language === 'fr' ? 'Enregistrez vos analyses en vidéo' : 'Record your analyses on video' },
    { icon: Calculator, title: language === 'fr' ? 'Calculatrice de Lot' : 'Lot Calculator', desc: language === 'fr' ? 'Calculs précis par actif' : 'Precise calculations per asset' },
    { icon: Trophy, title: language === 'fr' ? 'Défis & Gamification' : 'Challenges & Gamification', desc: language === 'fr' ? 'Progressez avec des objectifs' : 'Progress with objectives' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-profit/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">{APP_NAME}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <DigitalClock />
          <Link to="/auth">
            <Button variant="outline" className="border-primary/50 hover:bg-primary/10 hover:border-primary">
              {language === 'fr' ? 'Connexion' : 'Login'}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-4 sm:px-8 pt-8 sm:pt-16 pb-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Content */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                {language === 'fr' ? 'Journal de Trading Intelligent' : 'Intelligent Trading Journal'}
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">
                {language === 'fr' ? 'Maîtrisez votre' : 'Master your'}
              </span>
              <br />
              <span className="text-gradient-primary neon-text">
                {language === 'fr' ? 'Trading' : 'Trading'}
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {language === 'fr' 
                ? 'Suivez vos performances, analysez vos émotions et atteignez vos objectifs avec le journal de trading le plus complet.'
                : 'Track your performance, analyze your emotions, and reach your goals with the most complete trading journal.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-lg shadow-neon group">
                  {language === 'fr' ? 'Commencer Gratuitement' : 'Start for Free'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground px-8 py-6 text-lg group">
                  {language === 'fr' ? 'En savoir plus' : 'Learn more'}
                  <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Trading Chart Animation */}
          <div className="mb-16">
            <div className="glass-card p-4 sm:p-6 rounded-2xl overflow-hidden">
              <TradingChartAnimation />
            </div>
          </div>

          {/* Bull vs Bear Animation */}
          <div className="mb-16">
            <BullBearAnimation />
          </div>

          {/* Mini Widgets */}
          <div className="mb-16">
            <MiniWidgets />
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-10">
              {language === 'fr' ? 'Tout ce dont vous avez besoin' : 'Everything you need'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="glass-card-hover p-6 rounded-xl group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quote Rotator */}
          <div className="mb-16">
            <QuoteRotator />
          </div>

          {/* Security Badge */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-profit/10 border border-profit/30">
              <Shield className="w-5 h-5 text-profit" />
              <span className="text-profit font-medium">
                {language === 'fr' ? 'Données sécurisées & cryptées' : 'Secure & encrypted data'}
              </span>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center glass-card p-8 sm:p-12 rounded-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {language === 'fr' ? 'Prêt à transformer votre trading ?' : 'Ready to transform your trading?'}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {language === 'fr' 
                ? 'Rejoignez les traders qui utilisent Smart Trade Tracker pour améliorer leurs performances.'
                : 'Join traders who use Smart Trade Tracker to improve their performance.'}
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-10 py-6 text-lg shadow-neon">
                {language === 'fr' ? 'Créer mon compte' : 'Create my account'}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 sm:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>{APP_NAME} V{APP_VERSION}</span>
            <span>•</span>
            <span>{language === 'fr' ? 'Créé par un trader pour les traders' : 'Created by a trader for traders'}</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
              {language === 'fr' ? 'Confidentialité' : 'Privacy'}
            </Link>
            <Link to="/terms-of-use" className="text-muted-foreground hover:text-primary transition-colors">
              {language === 'fr' ? 'Conditions' : 'Terms'}
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
              {language === 'fr' ? 'À propos' : 'About'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
