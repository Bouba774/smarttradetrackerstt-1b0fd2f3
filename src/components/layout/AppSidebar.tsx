import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminRole } from '@/hooks/useAdminRole';
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
  BookOpen,
  Calculator,
  ArrowRightLeft,
  Trophy,
  User,
  Settings,
  Info,
  X,
  Activity,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

const AppSidebar: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const { isAdmin } = useAdminRole();
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : state === 'expanded';

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), adminOnly: false },
    { path: '/add-trade', icon: PlusCircle, label: t('addTrade'), adminOnly: false },
    { path: '/history', icon: History, label: t('history'), adminOnly: false },
    { path: '/reports', icon: FileText, label: t('reports'), adminOnly: false },
    { path: '/comparison', icon: GitCompare, label: t('periodComparison'), adminOnly: false },
    { path: '/psychology', icon: Brain, label: t('psychology'), adminOnly: false },
    { path: '/journal', icon: BookOpen, label: t('journal'), adminOnly: false },
    { path: '/calculator', icon: Calculator, label: t('calculator'), adminOnly: false },
    { path: '/currency-conversion', icon: ArrowRightLeft, label: t('currencyConversion'), adminOnly: false },
    { path: '/challenges', icon: Trophy, label: t('challenges'), adminOnly: false },
    { path: '/sessions', icon: ShieldCheck, label: language === 'fr' ? 'Admin Sessions' : 'Admin Sessions', adminOnly: true },
    { path: '/admin-roles', icon: Crown, label: language === 'fr' ? 'Gestion Rôles' : 'Role Management', adminOnly: true },
    { path: '/profile', icon: User, label: t('profile'), adminOnly: false },
    { path: '/settings', icon: Settings, label: t('settings'), adminOnly: false },
    { path: '/about', icon: Info, label: t('about'), adminOnly: false },
  ];

  // Filter nav items based on admin status
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
  };

  const handleClose = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

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
              <SidebarMenu>
                {visibleNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <SidebarMenuItem 
                      key={item.path}
                      className={cn(
                        "opacity-0 translate-x-[-20px]",
                        isOpen && "animate-[slideInLeft_0.3s_ease-out_forwards]"
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
                          onClick={handleNavClick}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative touch-target",
                            isActive
                              ? "bg-primary/20 text-primary shadow-neon border-l-2 border-primary"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:translate-x-1 active:bg-primary/20"
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
