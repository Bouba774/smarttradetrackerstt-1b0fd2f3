import React, { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAdmin } from '@/contexts/AdminContext';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/lib/version';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  GitCompare,
  Brain,
  BookOpen,
  Calculator,
  ArrowRightLeft,
  Trophy,
  User,
  Settings,
  Info,
  X,
} from 'lucide-react';

const AppSidebar: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { isAdminVerified, isInAdminMode } = useAdmin();
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : state === 'expanded';
  
  // Track clicked item for immediate visual feedback
  const [clickedPath, setClickedPath] = useState<string | null>(null);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/add-trade', icon: PlusCircle, label: t('addTrade') },
    { path: '/history', icon: History, label: t('history') },
    { path: '/reports', icon: FileText, label: t('reports') },
    { path: '/comparison', icon: GitCompare, label: t('periodComparison') },
    { path: '/psychology', icon: Brain, label: t('psychology') },
    { path: '/journal', icon: BookOpen, label: t('journal') },
    { path: '/calculator', icon: Calculator, label: t('calculator') },
    { path: '/currency-conversion', icon: ArrowRightLeft, label: t('currencyConversion') },
    { path: '/challenges', icon: Trophy, label: t('challenges') },
    { path: '/profile', icon: User, label: t('profile') },
    { path: '/settings', icon: Settings, label: t('settings') },
    { path: '/about', icon: Info, label: t('about') },
  ];

  // Optimized navigation handler - closes sidebar IMMEDIATELY before navigation
  const handleNavClick = useCallback((e: React.MouseEvent, path: string) => {
    e.preventDefault();
    
    // Immediate visual feedback
    setClickedPath(path);
    
    // Close sidebar FIRST using requestAnimationFrame for UI priority
    requestAnimationFrame(() => {
      if (isMobile && openMobile) {
        setOpenMobile(false);
      }
      
      // Navigate after sidebar close is triggered
      requestAnimationFrame(() => {
        navigate(path);
        // Reset click state after navigation
        setTimeout(() => setClickedPath(null), 150);
      });
    });
  }, [isMobile, openMobile, setOpenMobile, navigate]);

  const handleClose = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return (
    <>
      {/* Mobile overlay with fade animation */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300",
          isMobile && isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />
      
      <Sidebar 
        className={cn(
          "border-r border-primary/20 bg-sidebar/95 backdrop-blur-xl z-50",
          "transition-transform duration-300 ease-out",
          isMobile && "fixed inset-y-0 left-0",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0",
          isMobile && "w-[70vw] max-w-[360px]",
          "max-[420px]:w-[78vw]",
          !isMobile && (isOpen ? "w-64" : "w-16")
        )}
        collapsible="icon"
      >
        <SidebarHeader className="p-3 sm:p-4 border-b border-primary/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/app-logo.jpg" 
                alt="Smart Trade Tracker" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg shrink-0 object-cover animate-logo-glow"
              />
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-foreground text-sm leading-tight">
                  Smart Trade
                </h1>
                <p className="text-[10px] text-primary neon-text">
                  Tracker <span className="text-muted-foreground">V{APP_VERSION}</span>
                </p>
              </div>
            </div>
            
            {/* Close button on mobile */}
            {isMobile && (
              <button
                onClick={handleClose}
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
              <SidebarMenu className={cn(!isMobile && !isOpen && "flex flex-col items-center gap-2")}>
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <SidebarMenuItem 
                      key={item.path}
                      className={cn(
                        "opacity-0 translate-x-[-20px]",
                        isOpen && "animate-[slideInLeft_0.3s_ease-out_forwards]",
                        !isMobile && !isOpen && "opacity-100 translate-x-0 w-auto"
                      )}
                      style={{ 
                        animationDelay: isOpen ? `${index * 30}ms` : '0ms'
                      }}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={!isMobile && !isOpen ? item.label : undefined}
                      >
                        <Link
                          to={item.path}
                          onClick={(e) => handleNavClick(e, item.path)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative touch-target",
                            // Desktop collapsed: circular icon buttons
                            !isMobile && !isOpen && "w-10 h-10 p-0 justify-center rounded-full border border-primary/30 hover:border-primary hover:shadow-neon",
                            // Click feedback - scale down briefly
                            clickedPath === item.path && "scale-95 bg-primary/30",
                            isActive && !clickedPath
                              ? !isMobile && !isOpen 
                                ? "bg-primary/20 text-primary shadow-neon border-primary"
                                : "bg-primary/20 text-primary shadow-neon border-l-2 border-primary"
                              : !clickedPath && "text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20",
                            isMobile || isOpen ? "hover:translate-x-1" : ""
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5 shrink-0 transition-all duration-150",
                            isActive && "scale-110",
                            clickedPath === item.path && "scale-90",
                            !isMobile && !isOpen && "w-4 h-4"
                          )} />
                          {(isMobile || isOpen) && (
                            <span className="text-sm font-medium truncate">
                              {item.label}
                            </span>
                          )}
                          {isActive && (isMobile || isOpen) && !clickedPath && (
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
      </Sidebar>
    </>
  );
};

export default AppSidebar;
