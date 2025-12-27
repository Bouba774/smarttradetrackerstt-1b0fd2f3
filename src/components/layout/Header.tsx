import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSidebar } from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { language } = useLanguage();
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const locale = language === 'fr' ? fr : enUS;
  
  // Format: "Mar 9 Déc 2025   06 : 29 : 17"
  const dayName = format(currentTime, 'EEE', { locale });
  const dayNumber = format(currentTime, 'd', { locale });
  const month = format(currentTime, 'MMM', { locale });
  const year = format(currentTime, 'yyyy', { locale });
  const hours = format(currentTime, 'HH', { locale });
  const minutes = format(currentTime, 'mm', { locale });
  const seconds = format(currentTime, 'ss', { locale });
  
  // Capitalize first letter
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  
  const formattedDate = `${capitalizedDay} ${dayNumber} ${capitalizedMonth} ${year}`;
  const formattedTime = `${hours} : ${minutes} : ${seconds}`;
  const fullDateTime = `${formattedDate}   ${formattedTime}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20 px-2 sm:px-4 py-2 sm:py-3">
      <div className="w-full flex items-center justify-between gap-2">
        {/* Left side - Hamburger menu + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 touch-target",
              "bg-secondary/50 hover:bg-primary/20 active:bg-primary/30",
              "border border-primary/20 hover:border-primary/40"
            )}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-primary" />
          </button>
          
          {/* Logo */}
          <img 
            src="/assets/app-logo.jpg" 
            alt="Smart Trade Tracker" 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0 object-cover animate-logo-glow"
          />
          <h1 className="font-display text-sm sm:text-lg font-semibold text-foreground hidden sm:block truncate">
            Smart Trade Tracker
          </h1>
        </div>
        
        {/* Right side - Date & Time - Always visible on all screens */}
        <div className="flex items-center shrink-0">
          <div className="glass-card px-2 sm:px-4 py-1.5 sm:py-2 flex items-center">
            {/* Full date & time - responsive font size, never hidden */}
            <span 
              className={cn(
                "text-primary font-display font-semibold neon-text whitespace-nowrap tracking-wide",
                "text-[10px] min-[360px]:text-xs sm:text-sm"
              )}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {fullDateTime}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;