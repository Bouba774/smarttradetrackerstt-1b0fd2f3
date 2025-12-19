import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  GitCompare,
  Brain,
  Video,
  BookOpen,
  Calculator,
  ArrowRightLeft,
  Trophy,
  User,
  Settings,
  Info,
  X,
  Globe,
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

const AppSidebar: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const { state, toggleSidebar, isMobile } = useSidebar();
  const isOpen = state === 'expanded';

  const navItems = [
    { path: '/market-overview', icon: Globe, label: t('marketOverview') || 'Market Overview' },
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/add-trade', icon: PlusCircle, label: t('addTrade') },
    { path: '/history', icon: History, label: t('history') },
    { path: '/reports', icon: FileText, label: t('reports') },
    { path: '/comparison', icon: GitCompare, label: t('periodComparison') },
    { path: '/psychology', icon: Brain, label: t('psychology') },
    { path: '/video-journal', icon: Video, label: t('videoJournal') },
    { path: '/journal', icon: BookOpen, label: t('journal') },
    { path: '/calculator', icon: Calculator, label: t('calculator') },
    { path: '/currency-conversion', icon: ArrowRightLeft, label: t('currencyConversion') },
    { path: '/challenges', icon: Trophy, label: t('challenges') },
    { path: '/profile', icon: User, label: t('profile') },
    { path: '/settings', icon: Settings, label: t('settings') },
    { path: '/about', icon: Info, label: t('about') },
  ];

  const handleNavClick = () => {
    if (isMobile) {
      // Close immediately without animation delay
      requestAnimationFrame(() => {
        toggleSidebar();
      });
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className={cn(
            "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-75",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={toggleSidebar}
        />
      )}
      
      <Sidebar 
        className={cn(
          "border-r border-primary/20 bg-sidebar/95 backdrop-blur-xl transition-transform duration-100 z-50",
          // Mobile-specific styles
          isMobile && "fixed inset-y-0 left-0",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0",
          // Mobile width
          isMobile && "w-[70vw] max-w-[360px]",
          // Very small screens
          "max-[420px]:w-[78vw]",
          // Desktop styles
          !isMobile && (isOpen ? "w-64" : "w-16")
        )}
        collapsible="icon"
      >
        <SidebarHeader className="p-3 sm:p-4 border-b border-primary/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon shrink-0">
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-foreground text-sm leading-tight">
                  Smart Trade
                </h1>
                <p className="text-[10px] text-primary neon-text">Tracker</p>
              </div>
            </div>
            
            {/* Close button on mobile */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/50 hover:bg-primary/20 transition-colors touch-target"
                aria-label="Close menu"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="py-2 sm:py-4 overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={!isMobile && !isOpen ? item.label : undefined}
                      >
                        <Link
                          to={item.path}
                          onClick={handleNavClick}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-75 group relative touch-target",
                            isActive
                              ? "bg-primary/20 text-primary shadow-neon border-l-2 border-primary"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20"
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5 shrink-0 transition-all duration-300",
                            isActive && "scale-110"
                          )} />
                          <span className="text-sm font-medium truncate">
                            {item.label}
                          </span>
                          {isActive && (
                            <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3 sm:p-4 border-t border-primary/20">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">
              Smart Trade Tracker V{APP_VERSION}
            </p>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
};

export default AppSidebar;
