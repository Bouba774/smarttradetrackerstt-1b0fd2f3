import React from 'react';
import { ArrowLeft, TrendingUp, Target, Eye, Sparkles, Shield, Heart, Rocket, BarChart3, Brain, Video, BookOpen, Trophy, Calculator, Bot, Globe, Palette, Zap, Lock, FileText, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppVersionFooter } from '@/components/AppVersionFooter';
import { useLanguage } from '@/contexts/LanguageContext';

const About: React.FC = () => {
  const { t } = useLanguage();

  const { language } = useLanguage();

  const features = [
    { icon: BarChart3, title: t('featureDashboard'), description: language === 'fr' ? '30+ statistiques en temps réel, graphiques et indicateurs de performance' : '30+ real-time statistics, charts and performance indicators' },
    { icon: TrendingUp, title: t('featureTradeEntry'), description: language === 'fr' ? 'Enregistrement complet avec images, édition et transfert depuis calculatrice' : 'Complete recording with images, editing and transfer from calculator' },
    { icon: Sparkles, title: t('featureReports'), description: language === 'fr' ? 'Export PDF professionnel et comparaison de périodes' : 'Professional PDF export and period comparison' },
    { icon: Brain, title: language === 'fr' ? 'Analyse Psychologique' : 'Psychological Analysis', description: language === 'fr' ? 'Score de discipline, profil trader, fatigue mentale, patterns récurrents' : 'Discipline score, trader profile, mental fatigue, recurring patterns' },
    { icon: Target, title: language === 'fr' ? 'Mémoire Émotionnelle' : 'Emotional Memory', description: language === 'fr' ? 'Corrélation émotions-résultats, détection d\'auto-sabotage, R-multiple' : 'Emotion-results correlation, self-sabotage detection, R-multiple' },
    { icon: Video, title: t('featureVideoJournal'), description: language === 'fr' ? 'Enregistrement vidéo/audio jusqu\'à 60 secondes avec changement de caméra' : 'Video/audio recording up to 60 seconds with camera switching' },
    { icon: BookOpen, title: t('featureLessons'), description: language === 'fr' ? 'Checklist éditable, objectifs quotidiens et calendrier historique' : 'Editable checklist, daily objectives and historical calendar' },
    { icon: Trophy, title: language === 'fr' ? 'Défis & Récompenses' : 'Challenges & Rewards', description: language === 'fr' ? 'Coffres de récompense, badges et système de niveaux' : 'Reward chests, badges and level system' },
    { icon: Calculator, title: t('featureCalculator'), description: language === 'fr' ? 'Calcul automatique avec transfert direct vers formulaire de trade' : 'Automatic calculation with direct transfer to trade form' },
    { icon: Bot, title: t('featureAI'), description: language === 'fr' ? 'Résumé quotidien IA et assistant conversationnel personnalisé' : 'Daily AI summary and personalized conversational assistant' },
    { icon: Lock, title: language === 'fr' ? 'Sécurité PIN' : 'PIN Security', description: language === 'fr' ? 'Protection PIN, biométrie, verrouillage auto et alertes email' : 'PIN protection, biometrics, auto-lock and email alerts' },
    { icon: Shield, title: language === 'fr' ? 'Mode Confidentiel' : 'Confidential Mode', description: language === 'fr' ? 'Masquage des données sensibles et synchronisation multi-appareils' : 'Sensitive data masking and multi-device sync' },
  ];

  const uniqueFeatures = [
    { icon: Zap, title: t('allInOneSystem'), description: language === 'fr' ? 'Journal, statistiques, psychologie, IA et sécurité dans une seule app' : 'Journal, statistics, psychology, AI and security in one app' },
    { icon: Globe, title: language === 'fr' ? '51 Devises' : '51 Currencies', description: language === 'fr' ? 'Conversion automatique en temps réel avec taux de change actualisés' : 'Automatic real-time conversion with updated exchange rates' },
    { icon: Palette, title: t('cleanUX'), description: language === 'fr' ? 'Interface mobile-first responsive et mode focus anti-distraction' : 'Mobile-first responsive interface and anti-distraction focus mode' },
    { icon: Brain, title: language === 'fr' ? 'Suite Psychologique Complète' : 'Complete Psychological Suite', description: language === 'fr' ? '15+ outils d\'analyse psychologique et comportementale' : '15+ psychological and behavioral analysis tools' },
    { icon: Target, title: t('builtForDiscipline'), description: language === 'fr' ? 'Streaks de discipline, heatmap de performance et score automatique' : 'Discipline streaks, performance heatmap and automatic score' },
  ];

  const problems = [
    { title: t('emotionalTrading'), desc: language === 'fr' ? 'Détection d\'auto-sabotage et mémoire émotionnelle pour éviter les répétitions' : 'Self-sabotage detection and emotional memory to avoid repetition' },
    { title: t('inconsistency'), desc: language === 'fr' ? 'Score de discipline automatique et streaks pour renforcer les bonnes habitudes' : 'Automatic discipline score and streaks to reinforce good habits' },
    { title: t('overtrading'), desc: language === 'fr' ? 'Mode Focus avec limites de trades et alertes de fatigue mentale' : 'Focus mode with trade limits and mental fatigue alerts' },
    { title: t('lackOfData'), desc: language === 'fr' ? '30+ statistiques, heatmap, analyse par session et stratégie' : '30+ statistics, heatmap, session and strategy analysis' },
    { title: t('confusion'), desc: language === 'fr' ? 'Résumé IA quotidien et profil de trader personnalisé' : 'Daily AI summary and personalized trader profile' },
  ];

  const commitments = [
    { icon: Lock, title: language === 'fr' ? 'Protection Avancée' : 'Advanced Protection', desc: language === 'fr' ? 'PIN, biométrie, verrouillage auto et alertes de connexion suspecte' : 'PIN, biometrics, auto-lock and suspicious login alerts' },
    { icon: Shield, title: t('noDataSale'), desc: language === 'fr' ? 'Vos données ne sont jamais vendues ni partagées à des tiers' : 'Your data is never sold or shared with third parties' },
    { icon: Eye, title: language === 'fr' ? 'Mode Confidentiel' : 'Confidential Mode', desc: language === 'fr' ? 'Masquez vos données sensibles en un clic' : 'Hide your sensitive data with one click' },
    { icon: Zap, title: language === 'fr' ? 'Sync Multi-Appareils' : 'Multi-Device Sync', desc: language === 'fr' ? 'Paramètres de sécurité synchronisés sur tous vos appareils' : 'Security settings synchronized across all your devices' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-profit" />
            <span className="font-display font-semibold text-foreground">{t('aboutSmartTradeTracker')}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-screen">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 space-y-8">
          
          {/* Mission Statement */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('missionStatement')}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t('missionDesc')}
            </p>
          </section>

          {/* What is Smart Trade Tracker */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-profit/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-profit" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('whatIs')}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('whatIsDesc')}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-profit mt-1">•</span>
                  <span><strong className="text-foreground">{problem.title}</strong> — {problem.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Our Vision */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('ourVision')}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t('visionDesc')}
            </p>
          </section>

          {/* Key Features */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('keyFeatures')}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                  <feature.icon className="w-5 h-5 text-profit shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* What Makes Us Unique */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-profit/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-profit" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('whatMakesUnique')}</h2>
            </div>
            <div className="space-y-4">
              {uniqueFeatures.map((feature, index) => (
                <div key={index} className="flex gap-3">
                  <feature.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Our Commitment */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('ourCommitment')}</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              {commitments.map((commitment, index) => (
                <li key={index} className="flex items-start gap-3">
                  <commitment.icon className="w-4 h-4 text-profit shrink-0 mt-1" />
                  <span><strong className="text-foreground">{commitment.title}</strong> — {commitment.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Call to Action */}
          <section className="glass-card p-6 sm:p-8 text-center bg-gradient-to-br from-primary/10 to-profit/10">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-neon">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">{t('callToAction')}</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              {t('callToActionDesc')}
            </p>
            <p className="text-profit font-display font-semibold mb-4">
              {t('disciplineQuote')}
            </p>
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                {t('contactUs')}: <a href="mailto:alphafx@outlook.fr" className="text-profit hover:underline font-medium">alphafx@outlook.fr</a>
              </p>
            </div>
          </section>

          {/* Legal Information */}
          <section className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('legalInformation')}</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/privacy-policy" className="flex-1">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Shield className="w-4 h-4 text-profit" />
                  {t('privacyPolicy')}
                </Button>
              </Link>
              <Link to="/terms-of-use" className="flex-1">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4 text-profit" />
                  {t('termsOfService')}
                </Button>
              </Link>
              <Link to="/aide" className="flex-1">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <HelpCircle className="w-4 h-4 text-profit" />
                  {t('help') || 'Aide'}
                </Button>
              </Link>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('slogan')}
            </p>
            <AppVersionFooter />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default About;