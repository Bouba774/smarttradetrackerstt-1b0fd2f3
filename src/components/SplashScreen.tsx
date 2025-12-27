import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  minDuration = 2000 
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, minDuration / 50);

    // Start exit animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, minDuration);

    // Complete and unmount
    const completeTimer = setTimeout(() => {
      onComplete();
    }, minDuration + 500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [minDuration, onComplete]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-all duration-500",
        isExiting && "opacity-0 scale-110"
      )}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-profit/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-profit/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Logo container */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated logo */}
        <div className="relative">
          {/* Outer glow rings */}
          <div className="absolute inset-0 -m-4 rounded-3xl bg-gradient-to-r from-primary via-profit to-primary opacity-30 blur-xl animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute inset-0 -m-2 rounded-2xl bg-gradient-to-r from-profit via-primary to-profit opacity-40 blur-lg animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
          
          {/* Logo */}
          <img 
            src="/assets/app-logo.jpg" 
            alt="Smart Trade Tracker" 
            className={cn(
              "w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover relative z-10",
              "animate-logo-glow",
              "transform transition-transform duration-1000",
              !isExiting && "animate-bounce-gentle"
            )}
          />
        </div>

        {/* App name with typing effect */}
        <div className="text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 animate-fade-in">
            Smart Trade Tracker
          </h1>
          <p className="text-primary neon-text text-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
            ALPHA FX
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 sm:w-64 h-1 bg-secondary/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-profit to-primary rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading text */}
        <p className="text-muted-foreground text-sm animate-pulse">
          Chargement...
        </p>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-profit animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

export default SplashScreen;
