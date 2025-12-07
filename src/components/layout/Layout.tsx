import React from 'react';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-profit/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <Header />
      <Navigation />
      
      <main className="flex-1 pt-20 pb-24 md:pb-6 md:pl-24 px-4 relative z-10">
        <div className="container mx-auto max-w-7xl">
          {children}
        </div>
        {isHomePage && <Footer />}
      </main>
    </div>
  );
};

export default Layout;
