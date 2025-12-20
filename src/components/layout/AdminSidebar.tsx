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
  BookOpen,
  Calculator,
  ArrowRightLeft,
  Trophy,
  User,
  Settings,
  Info,
  X,
  ShieldCheck,
  Crown,
  Shield,
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';
import { Badge } from '@/components/ui/badge';

const AdminSidebar: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : state === 'expanded';

  const navItems = [
    { path: '/app/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/app/admin/add-trade', icon: PlusCircle, label: t('addTrade') },
    { path: '/app/admin/history', icon: History, label: t('history') },
    { path: '/app/admin/reports', icon: FileText, label: t('reports') },
    { path: '/app/admin/comparison', icon: GitCompare, label: t('periodComparison') },
    { path: '/app/admin/psychology', icon: Brain, label: t('psychology') },
    { path: '/app/admin/journal', icon: BookOpen, label: t('journal') },
    { path: '/app/admin/calculator', icon: Calculator, label: t('calculator') },
    { path: '/app/admin/currency-conversion', icon: ArrowRightLeft, label: t('currencyConversion') },
    { path: '/app/admin/challenges', icon: Trophy, label: t('challenges') },
    { path: '/app/admin/sessions', icon: ShieldCheck, label: language === 'fr' ? 'Sessions' : 'Sessions' },
    { path: '/app/admin/roles', icon: Crown, label: language === 'fr' ? 'Rôles' : 'Roles' },
    { path: '/app/admin/profile', icon: User, label: t('profile') },
    { path: '/app/admin/settings', icon: Settings, label: t('settings') },
    { path: '/app/admin/about', icon: Info, label: t('about') },
  ];

  const handleNavClick = () => {
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
      {/* Mobile overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300",
          isMobile && isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />
      
      <Sidebar 
        className={cn(
          "border-r border-destructive/30 bg-sidebar/95 backdrop-blur-xl z-50",
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
        <SidebarHeader className="p-3 sm:p-4 border-b border-destructive/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-destructive to-warning flex items-center justify-center shadow-lg shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-foreground text-sm leading-tight">
                  Admin Panel
                </h1>
                <Badge variant="destructive" className="text-[10px] h-4 px-1">
                  RESTRICTED
                </Badge>
              </div>
            </div>
            
            {isMobile && (
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/50 hover:bg-destructive/20 transition-colors"
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
                {navItems.map((item, index) => {
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
                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                            isActive
                              ? "bg-destructive/20 text-destructive shadow-lg border-l-2 border-destructive"
                              : "text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:translate-x-1"
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
                            <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
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

        <SidebarFooter className="p-3 sm:p-4 border-t border-destructive/30">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">
              Admin Panel V{APP_VERSION}
            </p>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
};

export default AdminSidebar;
