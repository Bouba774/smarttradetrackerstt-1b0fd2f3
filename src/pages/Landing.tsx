import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  Zap,
  Activity,
  Book,
  Bot,
  ChevronDown,
  Lock,
  Users,
  FileText,
  Check,
  Star,
  Quote,
  ChevronUp,
  Plus,
  Minus,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';
import ScrollReveal from '@/components/landing/ScrollReveal';
import ParticleBackground from '@/components/landing/ParticleBackground';
import { APP_NAME, APP_VERSION } from '@/lib/version';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import real application screenshots
import screenshotDashboard1 from '@/assets/screenshot-dashboard-1.jpg';
import screenshotDashboard2 from '@/assets/screenshot-dashboard-2.jpg';
import screenshotAddTrade from '@/assets/screenshot-add-trade.jpg';
import screenshotHistory from '@/assets/screenshot-history.jpg';
import screenshotReports from '@/assets/screenshot-reports.jpg';
import screenshotPsychology from '@/assets/screenshot-psychology.jpg';
import screenshotJournal from '@/assets/screenshot-journal.jpg';
import screenshotChallenges from '@/assets/screenshot-challenges.jpg';
import screenshotProfile from '@/assets/screenshot-profile.jpg';

const Landing = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeTraders, setActiveTraders] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [tradesRecorded, setTradesRecorded] = useState(0);
  const [countersStarted, setCountersStarted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const words = language === 'fr' 
    ? ['discipline', 'précision', 'constance', 'confiance', 'maîtrise']
    : ['discipline', 'precision', 'consistency', 'confidence', 'mastery'];

  // Typing effect with rotating words
  useEffect(() => {
    const currentWord = words[wordIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseTime = 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (typedText.length < currentWord.length) {
          setTypedText(currentWord.slice(0, typedText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        // Deleting
        if (typedText.length > 0) {
          setTypedText(currentWord.slice(0, typedText.length - 1));
        } else {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, wordIndex, words]);

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Counter animation with intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersStarted) {
            setCountersStarted(true);
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
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsElement = document.getElementById('stats-section');
    if (statsElement) observer.observe(statsElement);

    return () => observer.disconnect();
  }, [countersStarted]);

  const testimonials = [
    {
      name: 'Marc D.',
      role: language === 'fr' ? 'Trader Forex' : 'Forex Trader',
      rating: 5,
      text: language === 'fr' 
        ? 'Cet outil a transformé ma façon de trader. Mon winrate a augmenté de 15% en 3 mois grâce au suivi psychologique.'
        : 'This tool has transformed my trading. My winrate increased by 15% in 3 months thanks to the psychological tracking.'
    },
    {
      name: 'Sophie L.',
      role: language === 'fr' ? 'Day Trader' : 'Day Trader',
      rating: 5,
      text: language === 'fr'
        ? 'Enfin un journal de trading qui comprend l\'importance des émotions. L\'assistant IA est incroyablement utile.'
        : 'Finally a trading journal that understands the importance of emotions. The AI assistant is incredibly useful.'
    },
    {
      name: 'Thomas B.',
      role: language === 'fr' ? 'Swing Trader' : 'Swing Trader',
      rating: 5,
      text: language === 'fr'
        ? 'Interface intuitive et statistiques complètes. Je recommande à tous les traders sérieux.'
        : 'Intuitive interface and comprehensive statistics. I recommend it to all serious traders.'
    },
    {
      name: 'Emma R.',
      role: language === 'fr' ? 'Crypto Trader' : 'Crypto Trader',
      rating: 4,
      text: language === 'fr'
        ? 'Le calculateur de lot et la conversion de devises en temps réel sont des game changers.'
        : 'The lot calculator and real-time currency conversion are game changers.'
    }
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: BarChart3, title: language === 'fr' ? 'Tableau de Bord' : 'Dashboard', desc: language === 'fr' ? 'Vue complète de vos performances avec statistiques en temps réel.' : 'Complete view of your performance with real-time statistics.' },
    { icon: TrendingUp, title: language === 'fr' ? 'Historique Complet' : 'Full History', desc: language === 'fr' ? 'Enregistrez chaque trade avec tous les détails importants.' : 'Record every trade with all important details.' },
    { icon: Heart, title: language === 'fr' ? 'Analyse Émotionnelle' : 'Emotional Analysis', desc: language === 'fr' ? 'Comprenez l\'impact de vos émotions sur vos décisions.' : 'Understand the impact of your emotions on decisions.' },
    { icon: Brain, title: language === 'fr' ? 'Outils Psychologiques' : 'Psychological Tools', desc: language === 'fr' ? 'Identifiez vos patterns comportementaux.' : 'Identify your behavioral patterns.' },
    { icon: Video, title: language === 'fr' ? 'Journal Vidéo/Audio' : 'Video/Audio Journal', desc: language === 'fr' ? 'Capturez vos analyses en vidéo ou audio.' : 'Capture your analyses in video or audio.' },
    { icon: Calculator, title: language === 'fr' ? 'Calculatrice de Lot' : 'Lot Calculator', desc: language === 'fr' ? 'Calculez vos positions optimales.' : 'Calculate your optimal positions.' },
    { icon: Trophy, title: language === 'fr' ? 'Défis & Gamification' : 'Challenges', desc: language === 'fr' ? 'Progressez avec des défis stimulants.' : 'Progress with stimulating challenges.' },
    { icon: Bot, title: language === 'fr' ? 'Assistant IA' : 'AI Assistant', desc: language === 'fr' ? 'Obtenez des insights personnalisés 24/7.' : 'Get personalized insights 24/7.' },
  ];

  const benefits = [
    language === 'fr' ? 'Suivi de trades illimité' : 'Unlimited trade tracking',
    language === 'fr' ? 'Analyse psychologique avancée' : 'Advanced psychological analysis',
    language === 'fr' ? 'Conversion de devises en temps réel' : 'Real-time currency conversion',
    language === 'fr' ? 'Export PDF professionnel' : 'Professional PDF export',
    language === 'fr' ? 'Assistant IA intégré' : 'Integrated AI assistant',
    language === 'fr' ? 'Données sécurisées' : 'Secured data',
  ];

  const commitments = [
    { icon: Lock, title: language === 'fr' ? 'Vie Privée' : 'Privacy', desc: language === 'fr' ? 'Données cryptées' : 'Encrypted data' },
    { icon: Shield, title: language === 'fr' ? 'Sécurité' : 'Security', desc: language === 'fr' ? 'Protection maximale' : 'Maximum protection' },
    { icon: FileText, title: language === 'fr' ? 'Transparence' : 'Transparency', desc: language === 'fr' ? 'Politiques claires' : 'Clear policies' },
    { icon: Users, title: language === 'fr' ? 'Support' : 'Support', desc: language === 'fr' ? 'Aide disponible' : 'Help available' },
  ];

  const faqs = [
    {
      question: language === 'fr' ? 'Smart Trade Tracker est-il gratuit ?' : 'Is Smart Trade Tracker free?',
      answer: language === 'fr' 
        ? 'Oui, Smart Trade Tracker est entièrement gratuit. Vous pouvez enregistrer un nombre illimité de trades et accéder à toutes les fonctionnalités sans aucun frais.'
        : 'Yes, Smart Trade Tracker is completely free. You can record unlimited trades and access all features without any fees.'
    },
    {
      question: language === 'fr' ? 'Mes données sont-elles sécurisées ?' : 'Is my data secure?',
      answer: language === 'fr'
        ? 'Absolument. Vos données sont cryptées et stockées de manière sécurisée. Nous ne partageons jamais vos informations avec des tiers et vous gardez le contrôle total de vos données.'
        : 'Absolutely. Your data is encrypted and stored securely. We never share your information with third parties and you keep full control of your data.'
    },
    {
      question: language === 'fr' ? 'Quels marchés puis-je suivre ?' : 'What markets can I track?',
      answer: language === 'fr'
        ? 'Vous pouvez suivre tous les marchés : Forex, Crypto, Indices, Métaux, Actions et plus encore. Le calculateur de lot s\'adapte automatiquement à chaque type d\'actif.'
        : 'You can track all markets: Forex, Crypto, Indices, Metals, Stocks and more. The lot calculator automatically adapts to each asset type.'
    },
    {
      question: language === 'fr' ? 'Comment fonctionne l\'assistant IA ?' : 'How does the AI assistant work?',
      answer: language === 'fr'
        ? 'L\'assistant IA analyse vos trades et votre comportement pour vous fournir des insights personnalisés. Il peut répondre à vos questions sur vos performances et vous aider à identifier des patterns.'
        : 'The AI assistant analyzes your trades and behavior to provide personalized insights. It can answer questions about your performance and help you identify patterns.'
    },
    {
      question: language === 'fr' ? 'Puis-je exporter mes données ?' : 'Can I export my data?',
      answer: language === 'fr'
        ? 'Oui, vous pouvez exporter vos données en PDF professionnel avec toutes vos statistiques, graphiques et analyses pour une période de votre choix.'
        : 'Yes, you can export your data as a professional PDF with all your statistics, charts and analyses for a period of your choice.'
    },
    {
      question: language === 'fr' ? 'L\'application fonctionne-t-elle sur mobile ?' : 'Does the app work on mobile?',
      answer: language === 'fr'
        ? 'Oui, Smart Trade Tracker est entièrement responsive et fonctionne parfaitement sur tous les appareils : smartphone, tablette et ordinateur.'
        : 'Yes, Smart Trade Tracker is fully responsive and works perfectly on all devices: smartphone, tablet and computer.'
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Floating Particles Background */}
      <ParticleBackground />
      {/* Clean Background with subtle gradient and parallax */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 transition-transform duration-100"
          style={{
            background: resolvedTheme === 'dark' 
              ? 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(190 100% 50% / 0.08), transparent)'
              : 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(200 100% 45% / 0.06), transparent)',
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        />
        {/* Secondary parallax layer */}
        <div 
          className="absolute inset-0"
          style={{
            background: resolvedTheme === 'dark'
              ? 'radial-gradient(ellipse 60% 40% at 80% 80%, hsl(160 100% 40% / 0.04), transparent)'
              : 'radial-gradient(ellipse 60% 40% at 80% 80%, hsl(160 100% 40% / 0.03), transparent)',
            transform: `translateY(${scrollY * -0.05}px)`
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">{APP_NAME}</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {language === 'fr' ? 'Fonctionnalités' : 'Features'}
              </button>
              <button onClick={() => scrollToSection('benefits')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {language === 'fr' ? 'Avantages' : 'Benefits'}
              </button>
              <button onClick={() => scrollToSection('trust')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {language === 'fr' ? 'Confiance' : 'Trust'}
              </button>
            </nav>
            
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/50 transition-all"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Language Selector */}
              <div className="flex items-center rounded-lg border border-border/50 p-0.5">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    language === 'fr' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    language === 'en' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  EN
                </button>
              </div>
              
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  {language === 'fr' ? 'Connexion' : 'Login'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section - Clean and minimal */}
        <section className="relative min-h-[85vh] flex items-center justify-center">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
                <span className="text-xs text-primary font-medium">
                  {language === 'fr' ? 'Nouvelle version disponible' : 'New version available'}
                </span>
              </div>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={100}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
                <span className="text-foreground">{language === 'fr' ? 'Tradez avec ' : 'Trade with '}</span>
                <span className="text-gradient-primary">
                  {typedText}
                  <span className="inline-block w-[3px] h-[0.9em] bg-primary ml-1 align-middle animate-[blink_0.7s_infinite]" />
                </span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={200}>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                {language === 'fr' 
                  ? 'Le journal de trading intelligent pour suivre vos performances, maîtriser vos émotions et progresser chaque jour.' 
                  : 'The intelligent trading journal to track your performance, master your emotions and progress every day.'}
              </p>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 h-12 text-base group">
                    {language === 'fr' ? 'Commencer gratuitement' : 'Get started free'}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <button 
                  onClick={() => scrollToSection('features')} 
                  className="flex items-center gap-2 px-6 h-12 text-base text-muted-foreground hover:text-foreground transition-colors"
                >
                  {language === 'fr' ? 'En savoir plus' : 'Learn more'}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </ScrollReveal>
            
            {/* Stats with counter animation */}
            <div id="stats-section" className="grid grid-cols-3 gap-6 max-w-xl mx-auto mb-16">
              {[
                { value: activeTraders, suffix: '+', label: language === 'fr' ? 'Traders' : 'Traders' },
                { value: averageRating, suffix: '', label: language === 'fr' ? 'Note' : 'Rating', isRating: true },
                { value: tradesRecorded, suffix: 'K', label: language === 'fr' ? 'Trades' : 'Trades' },
              ].map((stat, index) => (
                <ScrollReveal key={index} animation="scale" delay={400 + index * 100}>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1 flex items-center justify-center gap-1">
                      <span className="tabular-nums">{stat.value}</span>
                      <span>{stat.suffix}</span>
                      {stat.isRating && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Hero Dashboard Images - Responsive showcase */}
            <ScrollReveal animation="fade-up" delay={500}>
              <div className="relative max-w-6xl mx-auto">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-profit/20 to-primary/20 rounded-3xl blur-2xl opacity-50" />
                
                {/* Mobile: Single image */}
                <div className="block md:hidden relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                  <img 
                    src={screenshotDashboard1} 
                    alt={language === 'fr' ? 'Tableau de bord Smart Trade Tracker' : 'Smart Trade Tracker Dashboard'}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                </div>

                {/* Desktop: Multiple images showcase */}
                <div className="hidden md:grid grid-cols-3 gap-4">
                  <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                    <img 
                      src={screenshotDashboard1} 
                      alt={language === 'fr' ? 'Statistiques principales' : 'Main statistics'}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300 translate-y-4">
                    <img 
                      src={screenshotReports} 
                      alt={language === 'fr' ? 'Rapports de trading' : 'Trading reports'}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                    <img 
                      src={screenshotHistory} 
                      alt={language === 'fr' ? 'Historique des trades' : 'Trade history'}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <span className="text-sm text-primary font-medium mb-4 block">
                  {language === 'fr' ? 'Fonctionnalités' : 'Features'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {language === 'fr' ? 'Tout ce qu\'il vous faut' : 'Everything you need'}
                </h2>
              </div>
            </ScrollReveal>

            {/* Features Image Showcase - Responsive grid */}
            <ScrollReveal animation="fade-up" delay={100}>
              <div className="relative max-w-6xl mx-auto mb-16">
                <div className="absolute -inset-4 bg-gradient-to-r from-profit/10 via-primary/10 to-profit/10 rounded-3xl blur-xl" />
                
                {/* Mobile: 2 columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-xl transform hover:scale-[1.03] transition-transform duration-300">
                    <img 
                      src={screenshotDashboard2} 
                      alt={language === 'fr' ? 'Graphiques de performance' : 'Performance charts'}
                      className="w-full h-32 sm:h-40 md:h-48 lg:h-56 object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-xl transform hover:scale-[1.03] transition-transform duration-300">
                    <img 
                      src={screenshotAddTrade} 
                      alt={language === 'fr' ? 'Ajout de trade' : 'Add trade'}
                      className="w-full h-32 sm:h-40 md:h-48 lg:h-56 object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-xl transform hover:scale-[1.03] transition-transform duration-300">
                    <img 
                      src={screenshotPsychology} 
                      alt={language === 'fr' ? 'Analyse psychologique' : 'Psychological analysis'}
                      className="w-full h-32 sm:h-40 md:h-48 lg:h-56 object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-xl transform hover:scale-[1.03] transition-transform duration-300">
                    <img 
                      src={screenshotChallenges} 
                      alt={language === 'fr' ? 'Défis et gamification' : 'Challenges and gamification'}
                      className="w-full h-32 sm:h-40 md:h-48 lg:h-56 object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </ScrollReveal>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 50}>
                  <div className="group p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-24 sm:py-32 bg-card/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <ScrollReveal animation="fade-right">
                <div>
                  <span className="text-sm text-primary font-medium mb-4 block">
                    {language === 'fr' ? 'Avantages' : 'Benefits'}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                    {language === 'fr' ? 'Pourquoi choisir Smart Trade Tracker ?' : 'Why choose Smart Trade Tracker?'}
                  </h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {language === 'fr' 
                      ? 'Une solution complète conçue par un trader pour les traders. Chaque fonctionnalité a été pensée pour améliorer votre discipline et vos performances.' 
                      : 'A complete solution designed by a trader for traders. Every feature has been designed to improve your discipline and performance.'}
                  </p>
                  
                  <div className="grid gap-3">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-profit/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-profit" />
                        </div>
                        <span className="text-foreground text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
              
              <ScrollReveal animation="fade-left">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-profit/10 rounded-3xl blur-xl" />
                  {/* Stack 2 images on desktop, single on mobile */}
                  <div className="grid gap-4">
                    <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-xl transform hover:scale-[1.02] transition-transform duration-300">
                      <img 
                        src={screenshotJournal} 
                        alt={language === 'fr' ? 'Journal de trading' : 'Trading journal'}
                        className="w-full h-48 sm:h-56 md:h-64 object-cover object-top"
                        loading="lazy"
                      />
                    </div>
                    <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-xl transform hover:scale-[1.02] transition-transform duration-300">
                      <img 
                        src={screenshotProfile} 
                        alt={language === 'fr' ? 'Profil utilisateur' : 'User profile'}
                        className="w-full h-48 sm:h-56 md:h-64 object-cover object-top"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section id="trust" className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <span className="text-sm text-primary font-medium mb-4 block">
                  {language === 'fr' ? 'Notre Engagement' : 'Our Commitment'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {language === 'fr' ? 'Votre confiance, notre priorité' : 'Your trust, our priority'}
                </h2>
              </div>
            </ScrollReveal>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {commitments.map((item, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 100}>
                  <div className="text-center p-6 rounded-2xl border border-border/50 bg-card/30">
                    <div className="w-12 h-12 rounded-2xl bg-profit/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-profit" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Psychology/Mission Image Section */}
        <section className="py-24 sm:py-32 bg-card/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <ScrollReveal animation="fade-right">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-loss/10 rounded-3xl blur-xl" />
                  <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-xl transform hover:scale-[1.02] transition-transform duration-300">
                    <img 
                      src={screenshotPsychology} 
                      alt={language === 'fr' ? 'Analyse psychologique du trading' : 'Trading psychological analysis'}
                      className="w-full h-64 sm:h-80 md:h-96 object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-left">
                <div>
                  <span className="text-sm text-primary font-medium mb-4 block">
                    {language === 'fr' ? 'Psychologie du Trading' : 'Trading Psychology'}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                    {language === 'fr' ? 'Maîtrisez vos émotions' : 'Master your emotions'}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'fr' 
                      ? 'La psychologie représente 80% du succès en trading. Notre outil vous aide à identifier vos patterns émotionnels, comprendre vos biais et développer une discipline de fer pour prendre de meilleures décisions.' 
                      : 'Psychology represents 80% of trading success. Our tool helps you identify your emotional patterns, understand your biases and develop iron discipline to make better decisions.'}
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <span className="text-sm text-primary font-medium mb-4 block">
                  {language === 'fr' ? 'Témoignages' : 'Testimonials'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {language === 'fr' ? 'Ce que disent nos traders' : 'What our traders say'}
                </h2>
              </div>
            </ScrollReveal>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {testimonials.map((testimonial, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 100}>
                  <div className="p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 transition-all duration-300 h-full flex flex-col">
                    <Quote className="w-8 h-8 text-primary/30 mb-4" />
                    
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} 
                        />
                      ))}
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
                      "{testimonial.text}"
                    </p>
                    
                    <div className="border-t border-border/50 pt-4">
                      <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 sm:py-32">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <span className="text-sm text-primary font-medium mb-4 block">
                  {language === 'fr' ? 'FAQ' : 'FAQ'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {language === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}
                </h2>
              </div>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={100}>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="border border-border/50 rounded-2xl bg-card/30 px-6 overflow-hidden data-[state=open]:bg-card/60 transition-colors"
                  >
                    <AccordionTrigger className="text-left text-foreground hover:no-underline py-5 [&[data-state=open]>svg]:rotate-180">
                      <span className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="font-medium">{faq.question}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 pl-8">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32 bg-card/20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal animation="fade-up">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                {language === 'fr' ? 'Prêt à transformer votre trading ?' : 'Ready to transform your trading?'}
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                {language === 'fr' 
                  ? 'Rejoignez des milliers de traders qui ont déjà amélioré leur discipline avec Smart Trade Tracker.' 
                  : 'Join thousands of traders who have already improved their discipline with Smart Trade Tracker.'}
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-10 h-12 text-base">
                  {language === 'fr' ? 'Commencer maintenant' : 'Get started now'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">{APP_NAME}</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                {language === 'fr' ? 'Confidentialité' : 'Privacy'}
              </Link>
              <Link to="/terms-of-use" className="hover:text-foreground transition-colors">
                {language === 'fr' ? 'Conditions' : 'Terms'}
              </Link>
              <Link to="/about" className="hover:text-foreground transition-colors">
                {language === 'fr' ? 'À propos' : 'About'}
              </Link>
            </div>
            
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {APP_NAME}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
