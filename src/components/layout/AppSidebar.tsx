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
  Brain,
  Video,
  BookOpen,
  Calculator,
  Trophy,
  Settings,
  User,
} from 'lucide-react';

const AppSidebar: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/add-trade', icon: PlusCircle, label: t('addTrade') },
    { path: '/history', icon: History, label: t('history') },
    { path: '/reports', icon: FileText, label: t('reports') },
    { path: '/psychology', icon: Brain, label: t('psychology') },
    { path: '/video-journal', icon: Video, label: t('videoJournal') },
    { path: '/journal', icon: BookOpen, label: t('journal') },
    { path: '/calculator', icon: Calculator, label: t('calculator') },
    { path: '/challenges', icon: Trophy, label: t('challenges') },
    { path: '/profile', icon: User, label: t('profile') },
  ];

  return (
    <Sidebar 
      className={cn(
        "border-r border-primary/20 bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-primary/20">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300",
          collapsed && "justify-center"
        )}>
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon shrink-0">
            <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-bold text-foreground text-sm leading-tight">
                Smart Trade
              </h1>
              <p className="text-[10px] text-primary neon-text">Tracker</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
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
                      tooltip={collapsed ? item.label : undefined}
                    >
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group relative",
                          isActive
                            ? "bg-primary/20 text-primary shadow-neon border-l-2 border-primary"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        )}
                      >
                        <Icon className={cn(
                          "w-5 h-5 shrink-0 transition-all duration-300",
                          isActive && "scale-110"
                        )} />
                        {!collapsed && (
                          <span className="text-sm font-medium truncate">
                            {item.label}
                          </span>
                        )}
                        {isActive && !collapsed && (
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

      <SidebarFooter className="p-4 border-t border-primary/20">
        {!collapsed && (
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">
              Smart Trade Tracker v1.0
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
