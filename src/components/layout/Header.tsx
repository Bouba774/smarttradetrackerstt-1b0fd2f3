import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { language } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const locale = language === 'fr' ? fr : enUS;
  const dateFormat = language === 'fr' ? 'EEE d MMM' : 'EEE MMM d';
  
  const formattedDate = format(currentTime, dateFormat, { locale });
  const formattedTime = format(currentTime, 'HH:mm:ss');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
            <span className="font-display font-bold text-primary-foreground">STT</span>
          </div>
          <h1 className="font-display text-lg font-semibold text-foreground hidden sm:block">
            Smart Trade Tracker
          </h1>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <div className="glass-card px-4 py-2 flex items-center gap-3">
            <span className="text-muted-foreground capitalize">{formattedDate}</span>
            <span className="text-primary font-display font-semibold neon-text">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
