import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, TrendingUp, Shield, Zap } from 'lucide-react';

const Index: React.FC = () => {
  const { t } = useLanguage();
  const userName = 'Trader'; // This will come from auth later

  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard Pro',
      description: 'Statistiques avancées et visualisations en temps réel',
    },
    {
      icon: TrendingUp,
      title: 'Analyse de Performance',
      description: 'Identifiez vos forces et faiblesses automatiquement',
    },
    {
      icon: Shield,
      title: 'Gestion du Risque',
      description: 'Calculatrice de lot professionnelle intégrée',
    },
    {
      icon: Zap,
      title: 'Insights Automatiques',
      description: 'Recommandations personnalisées basées sur vos trades',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
          <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
          <span className="text-sm text-primary font-medium">Trading Journal Pro</span>
        </div>
        
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
          <span className="text-foreground">{t('welcome')}, </span>
          <span className="text-gradient-primary neon-text">{userName}</span>
        </h1>
        
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Transformez votre trading avec des analyses avancées, un suivi précis et des insights automatiques.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/add-trade">
            <Button size="lg" className="gap-2 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-neon font-display">
              {t('startTrading')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10 font-display">
              {t('viewDashboard')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="glass-card-hover p-6 animate-fade-in"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Stats Preview */}
      <div className="mt-12 glass-card p-6 w-full max-w-3xl animate-fade-in" style={{ animationDelay: '500ms' }}>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-display text-3xl font-bold profit-text">+24.5%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Ce mois</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-primary neon-text">67%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Winrate</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-foreground">142</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Trades</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
