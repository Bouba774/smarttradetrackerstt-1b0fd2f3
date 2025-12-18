import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Video, 
  Calculator, 
  Trophy, 
  BookOpen, 
  Bot,
  Target,
  Wallet,
  Clock,
  Shield,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface FeatureShowcaseProps {
  language: string;
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ language }) => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: BarChart3,
      titleFr: 'Tableau de Bord Professionnel',
      titleEn: 'Professional Dashboard',
      descFr: 'Vue complète de vos performances avec plus de 20 statistiques en temps réel. Winrate, profit factor, drawdown, espérance mathématique et bien plus.',
      descEn: 'Complete view of your performance with 20+ real-time statistics. Winrate, profit factor, drawdown, mathematical expectancy and more.',
      color: 'from-blue-500 to-cyan-500',
      highlights: language === 'fr' 
        ? ['Statistiques en temps réel', 'Graphiques interactifs', 'Courbe d\'équité'] 
        : ['Real-time statistics', 'Interactive charts', 'Equity curve']
    },
    {
      icon: TrendingUp,
      titleFr: 'Historique Complet des Trades',
      titleEn: 'Complete Trade History',
      descFr: 'Enregistrez chaque trade avec tous les détails : entrée, sortie, SL, TP, émotions, setup, timeframe et jusqu\'à 4 captures d\'écran.',
      descEn: 'Record every trade with all details: entry, exit, SL, TP, emotions, setup, timeframe and up to 4 screenshots.',
      color: 'from-green-500 to-emerald-500',
      highlights: language === 'fr' 
        ? ['Filtres avancés', 'Export PDF/CSV/JSON', 'Captures d\'écran'] 
        : ['Advanced filters', 'PDF/CSV/JSON export', 'Screenshots']
    },
    {
      icon: Brain,
      titleFr: 'Analyse Psychologique',
      titleEn: 'Psychological Analysis',
      descFr: 'Comprenez l\'impact de vos émotions sur vos performances. Suivez votre discipline, identifiez vos patterns et améliorez votre mindset.',
      descEn: 'Understand the impact of your emotions on your performance. Track your discipline, identify your patterns and improve your mindset.',
      color: 'from-purple-500 to-pink-500',
      highlights: language === 'fr' 
        ? ['Score de discipline', 'Analyse émotionnelle', 'Points d\'amélioration'] 
        : ['Discipline score', 'Emotional analysis', 'Improvement points']
    },
    {
      icon: Video,
      titleFr: 'Journal Vidéo & Audio',
      titleEn: 'Video & Audio Journal',
      descFr: 'Capturez vos analyses en vidéo ou audio jusqu\'à 60 secondes. Changez de caméra en plein enregistrement et rejouez vos sessions.',
      descEn: 'Capture your analyses in video or audio up to 60 seconds. Switch cameras during recording and replay your sessions.',
      color: 'from-red-500 to-orange-500',
      highlights: language === 'fr' 
        ? ['Enregistrement 60s', 'Switch caméra live', 'Bibliothèque'] 
        : ['60s recording', 'Live camera switch', 'Library']
    },
    {
      icon: Calculator,
      titleFr: 'Calculatrice de Lot Avancée',
      titleEn: 'Advanced Lot Calculator',
      descFr: 'Calculez vos positions optimales pour Forex, Crypto, Indices, Métaux et Actions. Formules adaptées à chaque type d\'actif.',
      descEn: 'Calculate your optimal positions for Forex, Crypto, Indices, Metals and Stocks. Formulas adapted to each asset type.',
      color: 'from-amber-500 to-yellow-500',
      highlights: language === 'fr' 
        ? ['Multi-actifs', 'Gestion du risque', 'Ratio R:R'] 
        : ['Multi-assets', 'Risk management', 'R:R ratio']
    },
    {
      icon: Trophy,
      titleFr: 'Défis & Gamification',
      titleEn: 'Challenges & Gamification',
      descFr: 'Progressez avec des défis stimulants et débloquez des badges. Montez en niveau de Débutant à Légende et accumulez des points.',
      descEn: 'Progress with stimulating challenges and unlock badges. Level up from Beginner to Legend and accumulate points.',
      color: 'from-indigo-500 to-violet-500',
      highlights: language === 'fr' 
        ? ['6 niveaux', 'Badges exclusifs', 'Progression dynamique'] 
        : ['6 levels', 'Exclusive badges', 'Dynamic progression']
    },
    {
      icon: BookOpen,
      titleFr: 'Leçons & Routine',
      titleEn: 'Lessons & Routine',
      descFr: 'Checklist pré-marché personnalisable, objectifs journaliers, leçons apprises et évaluation quotidienne pour une discipline de fer.',
      descEn: 'Customizable pre-market checklist, daily objectives, lessons learned and daily evaluation for iron discipline.',
      color: 'from-teal-500 to-cyan-500',
      highlights: language === 'fr' 
        ? ['Checklist éditable', 'Journal quotidien', 'Auto-évaluation'] 
        : ['Editable checklist', 'Daily journal', 'Self-evaluation']
    },
    {
      icon: Bot,
      titleFr: 'Assistant IA Intelligent',
      titleEn: 'Intelligent AI Assistant',
      descFr: 'Obtenez des insights personnalisés 24/7. L\'IA analyse vos trades et comportements pour vous aider à progresser.',
      descEn: 'Get personalized insights 24/7. AI analyzes your trades and behaviors to help you progress.',
      color: 'from-fuchsia-500 to-pink-500',
      highlights: language === 'fr' 
        ? ['Analyse personnalisée', 'Conseils contextuels', 'Disponible 24/7'] 
        : ['Personalized analysis', 'Contextual advice', 'Available 24/7']
    },
  ];

  const activeItem = features[activeFeature];
  const ActiveIcon = activeItem.icon;

  return (
    <div className="w-full">
      {/* Feature tabs - scrollable on mobile */}
      <div className="flex overflow-x-auto pb-4 mb-8 gap-2 scrollbar-hide">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <button
              key={index}
              onClick={() => setActiveFeature(index)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border whitespace-nowrap transition-all duration-300 ${
                activeFeature === index
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-105'
                  : 'bg-card/50 text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {language === 'fr' ? feature.titleFr.split(' ')[0] : feature.titleEn.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feature detail card */}
      <div className="relative">
        {/* Animated background gradient */}
        <div className={`absolute -inset-4 bg-gradient-to-r ${activeItem.color} rounded-3xl blur-2xl opacity-20 transition-all duration-500`} />
        
        <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-profit/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Content */}
            <div>
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r ${activeItem.color} mb-6 shadow-lg`}>
                <ActiveIcon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {language === 'fr' ? activeItem.titleFr : activeItem.titleEn}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                {language === 'fr' ? activeItem.descFr : activeItem.descEn}
              </p>
              
              {/* Highlights */}
              <div className="flex flex-wrap gap-2">
                {activeItem.highlights.map((highlight, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right: Visual indicator */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative">
                {/* Animated rings */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${activeItem.color} animate-ping opacity-20`} style={{ animationDuration: '2s' }} />
                <div className={`absolute inset-4 rounded-full bg-gradient-to-r ${activeItem.color} animate-ping opacity-30`} style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                
                <div className={`relative w-40 h-40 rounded-full bg-gradient-to-r ${activeItem.color} flex items-center justify-center shadow-2xl`}>
                  <ActiveIcon className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation arrows */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
            <button
              onClick={() => setActiveFeature((prev) => (prev - 1 + features.length) % features.length)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              {language === 'fr' ? 'Précédent' : 'Previous'}
            </button>
            
            <div className="flex gap-1.5">
              {features.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === activeFeature ? 'bg-primary w-4' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={() => setActiveFeature((prev) => (prev + 1) % features.length)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {language === 'fr' ? 'Suivant' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase;
