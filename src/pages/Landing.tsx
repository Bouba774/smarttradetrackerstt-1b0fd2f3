import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  BarChart3, 
  Brain, 
  Video, 
  Calculator,
  Trophy,
  Shield,
  ArrowRight,
  Target,
  Heart,
  Eye,
  Zap,
  Activity,
  Book,
  Bot,
  ChevronDown,
  Quote,
  Lock,
  Users,
  FileText,
  Globe
} from 'lucide-react';
import ScrollReveal from '@/components/landing/ScrollReveal';
import heroDashboard from '@/assets/hero-dashboard.jpg';
import missionPsychology from '@/assets/mission-psychology.jpg';
import featuresAnalytics from '@/assets/features-analytics.jpg';
import uniqueGrowth from '@/assets/unique-growth.jpg';
import { APP_NAME, APP_VERSION } from '@/lib/version';

const Landing = () => {
  const { language, setLanguage } = useLanguage();
  const [activeTraders, setActiveTraders] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [tradesRecorded, setTradesRecorded] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setActiveTraders(Math.floor(2500 * easeOut));
      setAverageRating(parseFloat((4.8 * easeOut).toFixed(1)));
      setTradesRecorded(Math.floor(150 * easeOut));
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: BarChart3, title: language === 'fr' ? 'Tableau de Bord' : 'Dashboard', desc: language === 'fr' ? 'Vue complète de vos performances de trading avec statistiques en temps réel et graphiques visuels.' : 'Complete view of your trading performance with real-time statistics and visual charts.' },
    { icon: TrendingUp, title: language === 'fr' ? 'Saisie de Trade & Historique' : 'Trade Entry & History', desc: language === 'fr' ? 'Enregistrez chaque trade avec des informations détaillées et consultez votre historique complet.' : 'Record every trade with detailed information and view your complete history.' },
    { icon: Activity, title: language === 'fr' ? 'Rapports & Analytics Avancés' : 'Advanced Reports & Analytics', desc: language === 'fr' ? 'Analyses approfondies avec courbes equity, taux de réussite et filtrage par date.' : 'In-depth analysis with equity curves, success rates and date filtering.' },
    { icon: Heart, title: language === 'fr' ? 'Analyse Émotionnelle' : 'Emotional Analysis', desc: language === 'fr' ? 'Suivez vos états émotionnels et comprenez leur impact sur vos décisions de trading.' : 'Track your emotional states and understand their impact on your trading decisions.' },
    { icon: Brain, title: language === 'fr' ? 'Outils Psychologiques' : 'Psychological Tools', desc: language === 'fr' ? 'Identifiez les patterns comportementaux pour surmonter la peur, la cupidité et le trading impulsif.' : 'Identify behavioral patterns to overcome fear, greed and impulsive trading.' },
    { icon: Video, title: language === 'fr' ? 'Journal Vidéo/Audio' : 'Video/Audio Journal', desc: language === 'fr' ? 'Enregistrez jusqu\'à 60 secondes de vidéo ou audio pour capturer vos pensées et analyses.' : 'Record up to 60 seconds of video or audio to capture your thoughts and analyses.' },
    { icon: Book, title: language === 'fr' ? 'Leçons & Routine Quotidienne' : 'Lessons & Daily Routine', desc: language === 'fr' ? 'Checklists pré-marché, objectifs quotidiens et suivi des leçons pour des habitudes constantes.' : 'Pre-market checklists, daily objectives and lesson tracking for consistent habits.' },
    { icon: Trophy, title: language === 'fr' ? 'Défis & Gamification' : 'Challenges & Gamification', desc: language === 'fr' ? 'Progressez de Débutant à Légende en relevant des défis de trading stimulants.' : 'Progress from Beginner to Legend by taking on stimulating trading challenges.' },
    { icon: Calculator, title: language === 'fr' ? 'Calculatrice de Lot' : 'Lot Calculator', desc: language === 'fr' ? 'Calculez les tailles de position optimales pour Forex, Crypto, Indices et Métaux.' : 'Calculate optimal position sizes for Forex, Crypto, Indices and Metals.' },
    { icon: Bot, title: language === 'fr' ? 'Assistant IA 24/7' : 'AI Assistant 24/7', desc: language === 'fr' ? 'Obtenez des insights personnalisés d\'une IA qui connaît vos données de trading.' : 'Get personalized insights from an AI that knows your trading data.' },
  ];

  const testimonials = [
    { text: language === 'fr' ? "Smart Trade Tracker a complètement transformé ma façon de trader. L'analyse émotionnelle m'a aidé à identifier mes erreurs récurrentes. Je suis enfin rentable de façon constante." : "Smart Trade Tracker completely transformed the way I trade. The emotional analysis helped me identify my recurring mistakes. I'm finally consistently profitable.", name: "Thomas M.", role: language === 'fr' ? "Trader Forex" : "Forex Trader", initials: "TM" },
    { text: language === 'fr' ? "Le journal vidéo est une fonctionnalité géniale. Pouvoir revoir mes analyses du moment me permet de comprendre mes biais. Indispensable pour progresser." : "The video journal is an amazing feature. Being able to review my analyses from the moment allows me to understand my biases. Essential for progress.", name: "Sophie L.", role: language === 'fr' ? "Trader Crypto" : "Crypto Trader", initials: "SL" },
    { text: language === 'fr' ? "Après 2 ans de pertes, j'ai découvert grâce à l'app que je faisais de l'overtrading. Les statistiques sont claires et les défis me gardent motivé." : "After 2 years of losses, I discovered through the app that I was overtrading. The statistics are clear and the challenges keep me motivated.", name: "Marc D.", role: language === 'fr' ? "Day Trader" : "Day Trader", initials: "MD" },
    { text: language === 'fr' ? "L'assistant IA est incroyablement utile. Il analyse mes patterns et me donne des conseils personnalisés. C'est comme avoir un mentor disponible 24/7." : "The AI assistant is incredibly useful. It analyzes my patterns and gives me personalized advice. It's like having a mentor available 24/7.", name: "Julie B.", role: language === 'fr' ? "Swing Trader" : "Swing Trader", initials: "JB" },
    { text: language === 'fr' ? "La calculatrice de lot et la conversion de devises automatique m'ont fait gagner un temps fou. Interface claire, données précises. Je recommande à 100%." : "The lot calculator and automatic currency conversion saved me a crazy amount of time. Clear interface, precise data. I recommend it 100%.", name: "Alexandre K.", role: language === 'fr' ? "Trader Indices" : "Indices Trader", initials: "AK" },
    { text: language === 'fr' ? "Les routines quotidiennes et les checklists pré-marché ont développé ma discipline. Mes résultats ont doublé en 3 mois. Merci Smart Trade Tracker!" : "The daily routines and pre-market checklists have developed my discipline. My results have doubled in 3 months. Thanks Smart Trade Tracker!", name: "Camille R.", role: language === 'fr' ? "Trader Métaux" : "Metals Trader", initials: "CR" },
  ];

  const uniqueFeatures = [
    { icon: Zap, title: language === 'fr' ? 'Système Tout-en-Un' : 'All-in-One System', desc: language === 'fr' ? 'Tout ce dont vous avez besoin pour suivre, analyser et améliorer votre trading en un seul endroit.' : 'Everything you need to track, analyze and improve your trading in one place.' },
    { icon: Activity, title: language === 'fr' ? 'Conversion de Devise Automatique' : 'Automatic Currency Conversion', desc: language === 'fr' ? 'Taux de change en temps réel pour USD, EUR, GBP, JPY, XAF et XOF.' : 'Real-time exchange rates for USD, EUR, GBP, JPY, XAF and XOF.' },
    { icon: Eye, title: language === 'fr' ? 'UX Claire & Intuitive' : 'Clear & Intuitive UX', desc: language === 'fr' ? 'Design moderne optimisé pour le trading mobile en déplacement.' : 'Modern design optimized for mobile trading on the go.' },
    { icon: Brain, title: language === 'fr' ? 'Intégration Psychologique Profonde' : 'Deep Psychological Integration', desc: language === 'fr' ? 'Suivi émotionnel intégré à chaque aspect de votre journal de trading.' : 'Emotional tracking integrated into every aspect of your trading journal.' },
    { icon: Shield, title: language === 'fr' ? 'Conçu pour la Vraie Discipline' : 'Built for Real Discipline', desc: language === 'fr' ? 'Outils conçus par un trader pour renforcer discipline et constance.' : 'Tools designed by a trader to reinforce discipline and consistency.' },
  ];

  const commitments = [
    { icon: Lock, title: language === 'fr' ? 'Protection de la Vie Privée' : 'Privacy Protection', desc: language === 'fr' ? 'Vos données de trading sont cryptées et sécurisées' : 'Your trading data is encrypted and secured' },
    { icon: Shield, title: language === 'fr' ? 'Pas de Vente de Données' : 'No Data Selling', desc: language === 'fr' ? 'Vos informations ne sont jamais vendues à des tiers' : 'Your information is never sold to third parties' },
    { icon: FileText, title: language === 'fr' ? 'Transparence Totale' : 'Total Transparency', desc: language === 'fr' ? 'Politiques claires et communication honnête' : 'Clear policies and honest communication' },
    { icon: Users, title: language === 'fr' ? 'Gestion Sécurisée' : 'Secure Management', desc: language === 'fr' ? 'Stockage local et cloud avec sécurité aux normes de l\'industrie' : 'Local and cloud storage with industry-standard security' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-profit/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">{APP_NAME}</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('mission')} className="text-muted-foreground hover:text-foreground transition-colors">Mission</button>
              <button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-foreground transition-colors">{language === 'fr' ? 'Fonctionnalités' : 'Features'}</button>
              <button onClick={() => scrollToSection('unique')} className="text-muted-foreground hover:text-foreground transition-colors">{language === 'fr' ? 'Ce qui nous rend unique' : 'What makes us unique'}</button>
            </nav>
            
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    language === 'fr' 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    language === 'en' 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  EN
                </button>
              </div>
              
              <Link to="/auth">
                <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-neon">{language === 'fr' ? 'Commencer' : 'Get Started'}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroDashboard} alt="Trading dashboard interface" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-profit/10 border border-profit/30 mb-8">
                <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
                <span className="text-sm text-profit font-medium">Version {APP_VERSION} {language === 'fr' ? 'disponible' : 'available'}</span>
              </div>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={100}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-foreground">{language === 'fr' ? 'Maîtrisez votre ' : 'Master your '}</span>
                <span className="text-gradient-primary neon-text">trading</span>
                <br />
                <span className="text-foreground">{language === 'fr' ? 'avec ' : 'with '}</span>
                <span className="text-profit neon-text">{language === 'fr' ? 'discipline' : 'discipline'}</span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={200}>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
                {language === 'fr' ? 'Le journal de trading complet pour suivre vos trades, analyser vos performances et maîtriser vos émotions. Transformez chaque trade en opportunité d\'apprentissage.' : 'The complete trading journal to track your trades, analyze your performance and master your emotions. Transform every trade into a learning opportunity.'}
              </p>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-lg shadow-neon group">
                    {language === 'fr' ? 'Commencer maintenant' : 'Get started now'}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <button onClick={() => scrollToSection('features')} className="flex items-center gap-2 px-8 py-4 text-lg text-muted-foreground hover:text-foreground transition-colors">
                  {language === 'fr' ? 'Découvrir les fonctionnalités' : 'Discover features'}
                </button>
              </div>
            </ScrollReveal>
            
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
              {[
                { icon: TrendingUp, value: '10+ Metrics', label: language === 'fr' ? 'Suivi en temps réel' : 'Real-time tracking' },
                { icon: Shield, value: '100%', label: language === 'fr' ? 'Données sécurisées' : 'Secure data' },
                { icon: Activity, value: '24/7', label: language === 'fr' ? 'Analyse émotionnelle' : 'Emotional analysis' },
              ].map((stat, index) => (
                <ScrollReveal key={index} animation="scale" delay={400 + index * 100}>
                  <div className="glass-card p-4 sm:p-6 text-center rounded-xl">
                    <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section id="mission" className="py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-4">
                <span className="text-primary font-medium">{language === 'fr' ? 'Notre Mission' : 'Our Mission'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
                {language === 'fr' ? 'Discipline et clarté pour réussir' : 'Discipline and clarity to succeed'}
              </h2>
            </ScrollReveal>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <ScrollReveal animation="fade-right">
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={missionPsychology} alt="Trading Psychology" className="w-full h-auto rounded-2xl" />
                  <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
                    <span className="text-primary font-medium">{language === 'fr' ? 'Maîtrisez votre psychologie' : 'Master your psychology'}</span>
                  </div>
                </div>
              </ScrollReveal>
              
              <ScrollReveal animation="fade-left">
                <div className="space-y-8">
                  <p className="text-lg text-muted-foreground">
                    {language === 'fr' ? 'Smart Trade Tracker a été créé avec un seul objectif : aider les traders à développer la discipline et la clarté dont ils ont besoin pour réussir.' : 'Smart Trade Tracker was created with a single goal: to help traders develop the discipline and clarity they need to succeed.'}
                  </p>
                  <p className="text-lg text-muted-foreground">
                    {language === 'fr' ? 'Notre mission est de fournir les outils qui transforment un trading dispersé en un parcours structuré et basé sur les données vers la maîtrise.' : 'Our mission is to provide the tools that transform scattered trading into a structured, data-driven journey to mastery.'}
                  </p>
                  
                  <div className="grid gap-6">
                    {[
                      { icon: Target, title: language === 'fr' ? 'Objectif clair' : 'Clear Goal', desc: language === 'fr' ? 'Chaque fonctionnalité est conçue pour améliorer votre discipline' : 'Every feature is designed to improve your discipline' },
                      { icon: TrendingUp, title: language === 'fr' ? 'Progression constante' : 'Constant Progress', desc: language === 'fr' ? 'Suivez votre évolution trade après trade' : 'Track your evolution trade after trade' },
                      { icon: Brain, title: language === 'fr' ? 'Maîtrise psychologique' : 'Psychological Mastery', desc: language === 'fr' ? 'Comprenez vos émotions pour de meilleures décisions' : 'Understand your emotions for better decisions' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                          <p className="text-muted-foreground text-sm">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* What is STT Section */}
        <section className="py-20 sm:py-32 bg-card/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-4">
                <span className="text-primary font-medium">{language === 'fr' ? "Qu'est-ce que Smart Trade Tracker?" : "What is Smart Trade Tracker?"}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
                {language === 'fr' ? 'La solution aux problèmes les plus courants' : 'The solution to the most common problems'}
              </h2>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={100}>
              <p className="text-lg text-muted-foreground text-center max-w-4xl mx-auto mb-12">
                {language === 'fr' ? 'Smart Trade Tracker est un journal de trading complet conçu pour vous aider à suivre chaque trade, analyser vos performances et maîtriser vos émotions.' : 'Smart Trade Tracker is a complete trading journal designed to help you track every trade, analyze your performance and master your emotions.'}
              </p>
            </ScrollReveal>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Heart, title: language === 'fr' ? 'Trading émotionnel' : 'Emotional Trading', desc: language === 'fr' ? 'Comprenez comment vos émotions affectent vos décisions' : 'Understand how your emotions affect your decisions' },
                { icon: Activity, title: language === 'fr' ? 'Inconsistance' : 'Inconsistency', desc: language === 'fr' ? 'Développez des habitudes avec des routines quotidiennes et des checklists' : 'Develop habits with daily routines and checklists' },
                { icon: Zap, title: 'Overtrading', desc: language === 'fr' ? 'Suivez votre activité et identifiez les patterns nuisibles' : 'Track your activity and identify harmful patterns' },
                { icon: BarChart3, title: language === 'fr' ? 'Manque de données' : 'Lack of Data', desc: language === 'fr' ? 'Chaque trade est enregistré avec tous les détails pour l\'analyse' : 'Every trade is recorded with all details for analysis' },
              ].map((item, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 100}>
                  <div className="glass-card-hover p-6 rounded-xl text-center h-full">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <ScrollReveal animation="fade-right">
                <div>
                  <div className="mb-4">
                    <span className="text-primary font-medium">{language === 'fr' ? 'Notre Vision' : 'Our Vision'}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-8">
                    {language === 'fr' ? 'Un monde où chaque trader réussit' : 'A world where every trader succeeds'}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {language === 'fr' ? 'Nous envisageons un monde où chaque trader dispose des outils pour devenir constamment rentable. Notre objectif est de vous aider à prendre des décisions basées sur les données, atteindre l\'équilibre psychologique et maîtriser la discipline qui sépare les traders performants des autres. La maîtrise à long terme se construit trade après trade — et nous sommes là pour vous aider à suivre chaque étape de ce parcours.' : 'We envision a world where every trader has the tools to become consistently profitable. Our goal is to help you make data-driven decisions, achieve psychological balance and master the discipline that separates successful traders from the rest. Long-term mastery is built trade by trade — and we\'re here to help you track every step of that journey.'}
                  </p>
                </div>
              </ScrollReveal>
              
              <ScrollReveal animation="fade-left">
                <div className="relative">
                  <img src={featuresAnalytics} alt="Trading Analytics Dashboard" className="w-full h-auto rounded-2xl" />
                  <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
                    <span className="text-primary font-medium">{language === 'fr' ? 'Dashboard en temps réel' : 'Real-time Dashboard'}</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-32 bg-card/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-4">
                <span className="text-primary font-medium">{language === 'fr' ? 'Fonctionnalités Principales' : 'Main Features'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
                {language === 'fr' ? 'Tout ce dont vous avez besoin pour exceller' : 'Everything you need to excel'}
              </h2>
            </ScrollReveal>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 50}>
                  <div className="glass-card-hover p-6 rounded-xl h-full">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* What Makes Us Unique */}
        <section id="unique" className="py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <ScrollReveal animation="fade-right" className="order-2 lg:order-1">
                <div className="relative">
                  <img src={uniqueGrowth} alt="Growth Chart" className="w-full h-auto rounded-2xl" />
                  <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
                    <h3 className="text-foreground font-semibold">{language === 'fr' ? 'Croissance' : 'Growth'}</h3>
                    <p className="text-profit text-sm">{language === 'fr' ? 'Constante & Mesurable' : 'Constant & Measurable'}</p>
                  </div>
                </div>
              </ScrollReveal>
              
              <ScrollReveal animation="fade-left" className="order-1 lg:order-2">
                <div className="mb-4">
                  <span className="text-primary font-medium">{language === 'fr' ? 'Ce Qui Nous Rend Unique' : 'What Makes Us Unique'}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
                  {language === 'fr' ? 'Une approche différente' : 'A different approach'}
                </h2>
                
                <div className="space-y-4">
                  {uniqueFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 glass-card p-4 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 sm:py-32 bg-card/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-4">
                <span className="text-primary font-medium">{language === 'fr' ? 'Témoignages' : 'Testimonials'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-foreground mb-6">
                {language === 'fr' ? 'Ce que disent nos traders' : 'What our traders say'}
              </h2>
              <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-16">
                {language === 'fr' ? 'Découvrez comment Smart Trade Tracker a aidé des centaines de traders à améliorer leur discipline et leurs performances.' : 'Discover how Smart Trade Tracker has helped hundreds of traders improve their discipline and performance.'}
              </p>
            </ScrollReveal>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 100}>
                  <div className="glass-card-hover p-6 rounded-xl relative h-full">
                    <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
                    <p className="text-foreground/80 text-sm mb-6 leading-relaxed">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {testimonial.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            
            <ScrollReveal animation="scale" delay={200}>
              <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto mt-16">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-gradient-primary mb-1">{activeTraders}+</div>
                  <div className="text-sm text-muted-foreground">{language === 'fr' ? 'Traders actifs' : 'Active traders'}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-gradient-primary mb-1">{averageRating}/5</div>
                  <div className="text-sm text-muted-foreground">{language === 'fr' ? 'Note moyenne' : 'Average rating'}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-gradient-primary mb-1">{tradesRecorded}K+</div>
                  <div className="text-sm text-muted-foreground">{language === 'fr' ? 'Trades enregistrés' : 'Trades recorded'}</div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-4">
                <span className="text-primary font-medium">{language === 'fr' ? 'Notre Engagement' : 'Our Commitment'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-16">
                {language === 'fr' ? 'Envers nos utilisateurs' : 'To our users'}
              </h2>
            </ScrollReveal>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {commitments.map((item, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 100}>
                  <div className="glass-card p-6 rounded-xl text-center h-full">
                    <div className="w-12 h-12 rounded-full bg-profit/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-profit" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-12 sm:py-20 bg-card/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal animation="blur">
              <blockquote className="text-xl sm:text-2xl md:text-3xl font-light text-foreground/80 italic">
                "{language === 'fr' ? 'La discipline est le pont entre les objectifs et l\'accomplissement.' : 'Discipline is the bridge between goals and accomplishment.'}"
              </blockquote>
            </ScrollReveal>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 sm:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal animation="fade-up">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
                {language === 'fr' ? 'Commencez votre parcours aujourd\'hui' : 'Start your journey today'}
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                {language === 'fr' ? 'Chaque trader performant suit ses trades. Chaque trader constant connaît ses données. Commencez à enregistrer vos trades aujourd\'hui et découvrez le pouvoir de la discipline et du trading basé sur les données.' : 'Every successful trader tracks their trades. Every consistent trader knows their data. Start recording your trades today and discover the power of discipline and data-driven trading.'}
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-10 py-6 text-lg shadow-neon group">
                  {language === 'fr' ? 'Démarrer maintenant — C\'est gratuit' : 'Start now — It\'s free'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>
        </section>
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
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">{language === 'fr' ? 'Confidentialité' : 'Privacy'}</Link>
            <Link to="/terms-of-use" className="text-muted-foreground hover:text-primary transition-colors">{language === 'fr' ? 'Conditions' : 'Terms'}</Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">{language === 'fr' ? 'À propos' : 'About'}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
