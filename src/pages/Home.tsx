import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Target, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/landing/ParticleBackground';
import TradingChartAnimation from '@/components/landing/TradingChartAnimation';
import BullBearAnimation from '@/components/landing/BullBearAnimation';
import QuoteRotator from '@/components/landing/QuoteRotator';
import MiniWidgets from '@/components/landing/MiniWidgets';
import DigitalClock from '@/components/landing/DigitalClock';

// User levels matching the app's progression system
const USER_LEVELS = [
  { level: 1, title: 'Débutant', minPoints: 0 },
  { level: 2, title: 'Intermédiaire', minPoints: 100 },
  { level: 3, title: 'Analyste', minPoints: 300 },
  { level: 4, title: 'Pro', minPoints: 600 },
  { level: 5, title: 'Expert', minPoints: 1000 },
  { level: 6, title: 'Master', minPoints: 1500 },
  { level: 7, title: 'Légende', minPoints: 2500 },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Mock user data - will come from auth later
  const userName = 'Trader';
  const userPoints = 650;
  const currentLevel = USER_LEVELS.reduce((acc, level) => 
    userPoints >= level.minPoints ? level : acc, USER_LEVELS[0]
  );

  useEffect(() => {
    // Hide swipe hint after 5 seconds
    const timer = setTimeout(() => setShowSwipeHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 700);
  };

  // Handle swipe up gesture
  useEffect(() => {
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchStartY - touchEndY > 100) {
        handleStart();
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div 
      className={`min-h-screen relative overflow-hidden transition-all duration-700 ${
        isTransitioning 
          ? 'scale-110 opacity-0' 
          : 'scale-100 opacity-100'
      }`}
      style={{ background: 'linear-gradient(180deg, #0B0F15 0%, #0D1520 50%, #0B0F15 100%)' }}
    >
      {/* Particle Background */}
      <ParticleBackground />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-profit/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[200px]" />
      </div>

      {/* Top Bar with Clock */}
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between">
        <div className="opacity-40 hover:opacity-100 transition-opacity">
          {/* Hamburger icon placeholder */}
          <div className="w-8 h-8 flex flex-col justify-center gap-1.5 cursor-pointer">
            <div className="w-5 h-0.5 bg-foreground rounded-full" />
            <div className="w-4 h-0.5 bg-foreground rounded-full" />
            <div className="w-5 h-0.5 bg-foreground rounded-full" />
          </div>
        </div>
        
        <DigitalClock />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="opacity-60 hover:opacity-100"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-primary" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col px-4 py-20">
        
        {/* Video Loop Section (Background) */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-4xl h-64 md:h-96">
              <TradingChartAnimation />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="flex-shrink-0 text-center pt-8 pb-6 relative z-10 animate-fade-in">
          {/* Bull & Bear Animation */}
          <div className="mb-8">
            <BullBearAnimation />
          </div>

          {/* Title with scan effect */}
          <div className="relative inline-block mb-4">
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold">
              <span className="text-foreground">Smart Trade Tracker</span>
              <br />
              <span 
                className="text-gradient-primary neon-text relative"
                style={{
                  textShadow: '0 0 30px hsl(var(--primary)), 0 0 60px hsl(var(--primary) / 0.5)',
                }}
              >
                ALPHA FX
                {/* Scan line effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="font-display text-lg md:text-xl text-muted-foreground tracking-widest uppercase">
            Analyse. Discipline. Performance.
          </p>
        </section>

        {/* Quote Section */}
        <section className="flex-shrink-0 py-6 relative z-10" style={{ animationDelay: '200ms' }}>
          <QuoteRotator />
        </section>

        {/* Welcome Card */}
        <section className="flex-shrink-0 py-4 relative z-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="glass-card p-6 max-w-md mx-auto text-center relative overflow-hidden group hover:shadow-neon transition-shadow">
            {/* Glow aura */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              Bienvenue
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              {userName}
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Niveau {currentLevel.level} — {currentLevel.title}
              </span>
            </div>
          </div>
        </section>

        {/* Mini Widgets */}
        <section className="flex-shrink-0 py-6 relative z-10 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <MiniWidgets />
        </section>

        {/* CTA Buttons */}
        <section className="flex-shrink-0 py-6 relative z-10 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Button
              size="lg"
              onClick={handleStart}
              className="w-full sm:w-auto gap-3 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-neon font-display text-lg relative overflow-hidden group"
            >
              <span className="relative z-10">Commencer</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              {/* Button glow effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-3 border-primary/30 hover:bg-primary/10 font-display"
            >
              <Play className="w-5 h-5" />
              Vidéo du Jour
            </Button>
          </div>

          <Button
            variant="ghost"
            className="mt-4 mx-auto flex gap-2 text-muted-foreground hover:text-foreground"
          >
            <Target className="w-4 h-4" />
            Mes Objectifs du Jour
          </Button>
        </section>

        {/* Swipe Up Hint */}
        {showSwipeHint && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-20">
            <ChevronUp className="w-6 h-6 text-primary/60" />
            <span className="text-xs text-muted-foreground">Glisser vers le haut</span>
          </div>
        )}
      </div>

      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          {/* Bull charging animation */}
          <div className="relative">
            <svg
              viewBox="0 0 100 100"
              className="w-32 h-32 animate-pulse"
              style={{ 
                filter: 'drop-shadow(0 0 40px rgba(0, 255, 117, 0.8))',
                animation: 'chargeForward 0.7s ease-out forwards',
              }}
            >
              <ellipse cx="50" cy="60" rx="25" ry="18" fill="#00FF75" />
              <circle cx="70" cy="45" r="12" fill="#00FF75" />
              <path d="M 65 35 Q 55 20 45 25" stroke="#00FF75" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M 75 35 Q 85 20 95 25" stroke="#00FF75" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chargeForward {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          50% { transform: translateX(100px) scale(1.2); opacity: 1; }
          100% { transform: translateX(300px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Home;
