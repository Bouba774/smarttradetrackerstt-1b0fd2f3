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
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import AnimatedStats from '@/components/landing/AnimatedStats';
import { APP_NAME, APP_VERSION } from '@/lib/version';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Landing = () => {
  const { language, setLanguage, languages, t, isRTL } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeTraders, setActiveTraders] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [tradesRecorded, setTradesRecorded] = useState(0);
  const [countersStarted, setCountersStarted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const words = [
    t('landingWordDiscipline'),
    t('landingWordPrecision'),
    t('landingWordConsistency'),
    t('landingWordConfidence'),
    t('landingWordMastery')
  ];

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

  // Parallax effect - optimized with requestAnimationFrame to avoid forced reflow
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Counter animation with intersection observer - optimized with requestAnimationFrame
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersStarted) {
            setCountersStarted(true);
            const duration = 2000;
            const startTime = performance.now();
            
            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easeOut = 1 - Math.pow(1 - progress, 3);
              
              setActiveTraders(Math.floor(2500 * easeOut));
              setAverageRating(parseFloat((4.8 * easeOut).toFixed(1)));
              setTradesRecorded(Math.floor(150 * easeOut));
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            
            requestAnimationFrame(animate);
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
      role: t('landingForexTrader'),
      rating: 5,
      text: t('landingTestimonial1')
    },
    {
      name: 'Sophie L.',
      role: t('landingDayTrader'),
      rating: 5,
      text: t('landingTestimonial2')
    },
    {
      name: 'Thomas B.',
      role: t('landingSwingTrader'),
      rating: 5,
      text: t('landingTestimonial3')
    },
    {
      name: 'Emma R.',
      role: t('landingCryptoTrader'),
      rating: 4,
      text: t('landingTestimonial4')
    }
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: BarChart3, title: t('landingFeatureDashboard'), desc: t('landingFeatureDashboardDesc') },
    { icon: TrendingUp, title: t('landingFeatureHistory'), desc: t('landingFeatureHistoryDesc') },
    { icon: Brain, title: t('landingFeaturePsychology'), desc: t('landingFeaturePsychologyDesc') },
    { icon: Heart, title: t('landingFeatureEmotional'), desc: t('landingFeatureEmotionalDesc') },
    { icon: Video, title: t('landingFeatureVideo'), desc: t('landingFeatureVideoDesc') },
    { icon: Calculator, title: t('landingFeatureCalculator'), desc: t('landingFeatureCalculatorDesc') },
    { icon: Trophy, title: t('landingFeatureChallenges'), desc: t('landingFeatureChallengesDesc') },
    { icon: Bot, title: t('landingFeatureAI'), desc: t('landingFeatureAIDesc') },
    { icon: Lock, title: t('landingFeaturePIN'), desc: t('landingFeaturePINDesc') },
    { icon: Shield, title: t('landingFeatureConfidential'), desc: t('landingFeatureConfidentialDesc') },
  ];

  const benefits = [
    t('landingMultiDeviceSync'),
    t('landingAdvancedPsychology'),
    t('landingCurrenciesSupported'),
    t('landingPdfExport'),
    t('landingPinBiometric'),
    t('landingFocusMode'),
    t('landingPeriodComparison'),
    t('landingEmailAlerts'),
  ];

  const commitments = [
    { icon: Lock, title: t('landingPrivacy'), desc: t('landingEncryptedData') },
    { icon: Shield, title: t('landingSecurity'), desc: t('landingMaxProtection') },
    { icon: FileText, title: t('landingTransparency'), desc: t('landingClearPolicies') },
    { icon: Users, title: t('landingSupportLabel'), desc: t('landingHelpAvailable') },
  ];

  const faqs = [
    { question: t('landingFaq1Q'), answer: t('landingFaq1A') },
    { question: t('landingFaq2Q'), answer: t('landingFaq2A') },
    { question: t('landingFaq3Q'), answer: t('landingFaq3A') },
    { question: t('landingFaq4Q'), answer: t('landingFaq4A') },
    { question: t('landingFaq5Q'), answer: t('landingFaq5A') },
    { question: t('landingFaq6Q'), answer: t('landingFaq6A') }
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
                {t('landingNavFeatures')}
              </button>
              <button onClick={() => scrollToSection('benefits')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('landingNavBenefits')}
              </button>
              <button onClick={() => scrollToSection('trust')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('landingNavTrust')}
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

              {/* Language Selector Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 transition-all"
                >
                  <span>{languages.find(l => l.code === language)?.flag}</span>
                  <span className="hidden sm:inline">{languages.find(l => l.code === language)?.code.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-64 max-h-80 overflow-y-auto bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="grid grid-cols-2 gap-0.5 p-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all ${
                          language === lang.code
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="truncate">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  {t('login')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section - Clean and minimal */}
        <section className="relative min-h-[85vh] flex items-center justify-center">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center" style={{ contain: 'layout style' }}>
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
                <span className="text-xs text-primary font-medium">
                  {t('landingNewVersion')}
                </span>
              </div>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={100}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
                <span className="text-foreground">{t('landingTradeWith')} </span>
                <br className="sm:hidden" />
                <span 
                  className={`text-gradient-primary inline-block ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{ 
                    width: '11ch',
                    minHeight: '1.2em',
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}
                >
                  {typedText}
                  <span className={`inline-block w-[3px] h-[0.9em] bg-primary ${isRTL ? 'mr-1' : 'ml-1'} align-middle animate-[blink_0.7s_infinite]`} />
                </span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={200}>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                {t('landingHeroDesc')}
              </p>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 h-12 text-base group">
                    {t('landingGetStartedFree')}
                    <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 group-hover:-translate-x-1 rotate-180' : 'ml-2 group-hover:translate-x-1'} transition-transform`} />
                  </Button>
                </Link>
                <button 
                  onClick={() => scrollToSection('features')} 
                  className="flex items-center gap-2 px-6 h-12 text-base text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('landingLearnMore')}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </ScrollReveal>
            
            {/* Stats with counter animation */}
            <div id="stats-section" className="grid grid-cols-3 gap-6 max-w-xl mx-auto mb-16">
              {[
                { value: activeTraders, suffix: '+', label: t('landingTraders'), width: '5ch' },
                { value: averageRating, suffix: '', label: t('landingRating'), isRating: true, width: '3ch' },
                { value: tradesRecorded, suffix: 'K', label: t('landingTrades'), width: '4ch' },
              ].map((stat, index) => (
                <ScrollReveal key={index} animation="scale" delay={400 + index * 100}>
                  <div className="text-center" style={{ minHeight: '60px' }}>
                    <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1 flex items-center justify-center gap-1" style={{ minHeight: '40px' }}>
                      <span className="tabular-nums inline-block text-right" style={{ width: stat.width }}>{stat.value}</span>
                      <span>{stat.suffix}</span>
                      {stat.isRating && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

          </div>
        </section>

        {/* Features Section - Enhanced with Interactive Showcase */}
        <section id="features" className="py-24 sm:py-32 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-profit/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">
                    {t('landingPowerfulFeatures')}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  {t('landingEverythingYouNeed')}
                  <span className="text-gradient-primary"> {t('landingSucceed')}</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('landingFeaturesDesc')}
                </p>
              </div>
            </ScrollReveal>

            {/* Interactive Feature Showcase */}
            <ScrollReveal animation="fade-up" delay={100}>
              <FeatureShowcase />
            </ScrollReveal>

          </div>
        </section>

        {/* Live Stats Demo Section */}
        <section className="py-20 sm:py-28 bg-gradient-to-b from-card/30 to-background relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-profit/10 border border-profit/20 mb-6">
                  <Activity className="w-4 h-4 text-profit animate-pulse" />
                  <span className="text-sm text-profit font-medium">
                    {t('landingLiveStats')}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  {t('landingTrackPerformance')}
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  {t('landingTrackDesc')}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={100}>
              <AnimatedStats />
            </ScrollReveal>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-24 sm:py-32 bg-card/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <ScrollReveal animation="fade-right">
                <div>
                  <span className="text-sm text-primary font-medium mb-4 block">
                    {t('landingBenefits')}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                    {t('landingWhyChoose')} Smart Trade Tracker?
                  </h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t('landingBenefitsDesc')}
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
              
            </div>
          </div>
        </section>

        <section id="trust" className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <span className="text-sm text-primary font-medium mb-4 block">
                  {t('landingOurCommitment')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {t('landingYourTrust')}
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

        {/* Psychology/Mission Section */}
        <section className="py-24 sm:py-32 bg-card/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center">
                <span className="text-sm text-primary font-medium mb-4 block">
                  {t('landingTradingPsychology')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  {t('landingMasterEmotions')}
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  {t('landingPsychologyDesc')}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <span className="text-sm text-primary font-medium mb-4 block">
                  {t('landingTestimonials')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {t('landingWhatTradersSay')}
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
                  {t('landingFaq')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {t('landingFaqTitle')}
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
                {t('landingReadyToTransform')}
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                {t('landingCtaDesc')}
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-10 h-12 text-base">
                  {t('landingGetStartedNow')}
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
                {t('landingPrivacyFooter')}
              </Link>
              <Link to="/terms-of-use" className="hover:text-foreground transition-colors">
                {t('landingTermsFooter')}
              </Link>
              <Link to="/about" className="hover:text-foreground transition-colors">
                {t('landingAboutFooter')}
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
