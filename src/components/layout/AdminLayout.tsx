import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import AdminUserSelector from '@/components/admin/AdminUserSelector';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import PageTransition from '@/components/PageTransition';

const AdminLayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const { isAdminVerified, selectedUser, exitAdminMode } = useAdmin();
  const { language } = useLanguage();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (!roleLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (!isAdminVerified) {
      navigate('/admin-verify');
      return;
    }
  }, [user, authLoading, isAdmin, roleLoading, isAdminVerified, navigate]);

  const handleExitAdminMode = () => {
    exitAdminMode();
    navigate('/dashboard');
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />
      
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Admin Header Bar */}
        <header className="sticky top-0 z-40 border-b border-destructive/30 bg-destructive/5 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setOpenMobile(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <Badge variant="destructive" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                ADMIN
              </Badge>
              
              {selectedUser && (
                <Badge variant="outline" className="flex items-center gap-1 border-primary/50 text-primary">
                  <Eye className="w-3 h-3" />
                  {language === 'fr' ? 'Consultation:' : 'Viewing:'} {selectedUser.nickname}
                </Badge>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExitAdminMode}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              {language === 'fr' ? 'Quitter mode admin' : 'Exit Admin Mode'}
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* User Selector - Always visible */}
            <AdminUserSelector />
            
            {/* Page Content with transitions */}
            <PageTransition>
              <div className="min-h-0">
                <Outlet />
              </div>
            </PageTransition>
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  );
};

export default AdminLayout;
