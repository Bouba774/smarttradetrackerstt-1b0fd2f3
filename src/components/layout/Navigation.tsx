import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Home,
  LayoutDashboard,
  PlusCircle,
  History,
  Calculator,
  BookOpen,
  Trophy,
  Settings,
  User,
} from 'lucide-react';

const Navigation: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: t('home') },
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/add-trade', icon: PlusCircle, label: t('addTrade') },
    { path: '/history', icon: History, label: t('history') },
    { path: '/calculator', icon: Calculator, label: t('calculator') },
    { path: '/journal', icon: BookOpen, label: t('journal') },
    { path: '/challenges', icon: Trophy, label: t('challenges') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-primary/20 px-2 py-2 md:top-20 md:bottom-auto md:left-0 md:right-auto md:w-20 md:h-[calc(100vh-5rem)] md:border-t-0 md:border-r md:py-6">
      <div className="flex md:flex-col items-center justify-around md:justify-start md:gap-2 h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 md:p-3 rounded-lg transition-all duration-300 group relative",
                isActive
                  ? "bg-primary/20 text-primary shadow-neon"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 md:w-6 md:h-6 transition-transform duration-300",
                isActive && "scale-110"
              )} />
              <span className="text-[10px] md:text-xs mt-1 font-medium truncate max-w-[60px] text-center">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary md:hidden" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
