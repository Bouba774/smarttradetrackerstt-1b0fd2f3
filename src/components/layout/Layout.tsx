import React from 'react';
import Header from './Header';
import AppSidebar from './AppSidebar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-profit/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <AppSidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 pt-20 pb-6 px-4 md:px-6 relative z-10 overflow-auto">
            <div className="container mx-auto max-w-7xl">
              {children}
            </div>
            {isDashboard && <Footer />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
