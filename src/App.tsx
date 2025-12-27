import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Layout from "@/components/layout/Layout";
import { CookieConsent } from "@/components/CookieConsent";
import LockScreen from "@/components/LockScreen";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import ChunkErrorBoundary from "@/components/ChunkErrorBoundary";
import { usePrefetchOnAuth } from "@/hooks/useRoutePrefetch";
import PageSkeleton from "@/components/ui/PageSkeleton";
import SplashScreen from "@/components/SplashScreen";

// Critical pages loaded immediately
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages with webpackChunkName for better caching
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ "./pages/Dashboard"));
const AddTrade = lazy(() => import(/* webpackChunkName: "add-trade" */ "./pages/AddTrade"));
const History = lazy(() => import(/* webpackChunkName: "history" */ "./pages/History"));
const Reports = lazy(() => import(/* webpackChunkName: "reports" */ "./pages/Reports"));
const PeriodComparison = lazy(() => import(/* webpackChunkName: "comparison" */ "./pages/PeriodComparison"));
const PsychologicalAnalysis = lazy(() => import(/* webpackChunkName: "psychology" */ "./pages/PsychologicalAnalysis"));
const Journal = lazy(() => import(/* webpackChunkName: "journal" */ "./pages/Journal"));
const Calculator = lazy(() => import(/* webpackChunkName: "calculator" */ "./pages/Calculator"));
const CurrencyConversion = lazy(() => import(/* webpackChunkName: "currency" */ "./pages/CurrencyConversion"));
const Challenges = lazy(() => import(/* webpackChunkName: "challenges" */ "./pages/Challenges"));
const Profile = lazy(() => import(/* webpackChunkName: "profile" */ "./pages/Profile"));
const Settings = lazy(() => import(/* webpackChunkName: "settings" */ "./pages/Settings"));
const SessionsAdmin = lazy(() => import(/* webpackChunkName: "sessions" */ "./pages/SessionsAdmin"));
const AdminRoles = lazy(() => import(/* webpackChunkName: "admin-roles" */ "./pages/AdminRoles"));
const PrivacyPolicy = lazy(() => import(/* webpackChunkName: "legal" */ "./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import(/* webpackChunkName: "legal" */ "./pages/TermsOfUse"));
const About = lazy(() => import(/* webpackChunkName: "about" */ "./pages/About"));
const PrivacyCenter = lazy(() => import(/* webpackChunkName: "privacy" */ "./pages/PrivacyCenter"));
const ResetPassword = lazy(() => import(/* webpackChunkName: "auth" */ "./pages/ResetPassword"));
const ResetPin = lazy(() => import(/* webpackChunkName: "auth" */ "./pages/ResetPin"));
const Help = lazy(() => import(/* webpackChunkName: "help" */ "./pages/Help"));
const AIChatBot = lazy(() => import(/* webpackChunkName: "ai-chat" */ "@/components/AIChatBot"));
const ChangelogModal = lazy(() => import(/* webpackChunkName: "changelog" */ "@/components/ChangelogModal"));

// Admin pages
const AdminSecretValidation = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/AdminSecretValidation"));
const AdminLayout = lazy(() => import(/* webpackChunkName: "admin" */ "./components/layout/AdminLayout"));

// Admin page wrappers - grouped in same chunk
const AdminDashboard = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminDashboard"));
const AdminAddTrade = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminAddTrade"));
const AdminHistory = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminHistory"));
const AdminReports = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminReports"));
const AdminComparison = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminComparison"));
const AdminPsychology = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminPsychology"));
const AdminJournal = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminJournal"));
const AdminCalculator = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminCalculator"));
const AdminCurrencyConversion = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminCurrencyConversion"));
const AdminChallenges = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminChallenges"));
const AdminSessions = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminSessions"));
const AdminRolesPage = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminRolesPage"));
const AdminAuditHistory = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminAuditHistory"));
const AdminProfile = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminProfile"));
const AdminSettings = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminSettings"));
const AdminAbout = lazy(() => import(/* webpackChunkName: "admin-pages" */ "./pages/admin/AdminAbout"));

// Improved loading fallback with skeleton
const PageLoader = () => <PageSkeleton type="default" />;
const DashboardLoader = () => <PageSkeleton type="dashboard" />;
const ListLoader = () => <PageSkeleton type="list" />;
const FormLoader = () => <PageSkeleton type="form" />;

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Component to conditionally render layout
const AppContent = () => {
  const { user } = useAuth();
  
  // Track user sessions
  useSessionTracking();
  
  // Prefetch priority routes after authentication
  usePrefetchOnAuth(!!user);

  return (
    <>
      {/* Lock Screen - appears on top of everything when locked */}
      {user && <LockScreen />}
      
      <ChunkErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<Landing />} />
            
            {/* Auth pages */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-pin" element={<ResetPin />} />
            
            {/* Public pages without authentication */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-use" element={<TermsOfUse />} />
            <Route path="/aide" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            
            {/* Admin verification page */}
            <Route path="/admin-verify" element={<ProtectedRoute><AdminSecretValidation /></ProtectedRoute>} />
            
            {/* ========== USER ROUTES ========== */}
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/add-trade" element={<ProtectedRoute><Layout><AddTrade /></Layout></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
            <Route path="/comparison" element={<ProtectedRoute><Layout><PeriodComparison /></Layout></ProtectedRoute>} />
            <Route path="/psychology" element={<ProtectedRoute><Layout><PsychologicalAnalysis /></Layout></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><Layout><Journal /></Layout></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><Layout><Calculator /></Layout></ProtectedRoute>} />
            <Route path="/currency-conversion" element={<ProtectedRoute><Layout><CurrencyConversion /></Layout></ProtectedRoute>} />
            <Route path="/challenges" element={<ProtectedRoute><Layout><Challenges /></Layout></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute><Layout><SessionsAdmin /></Layout></ProtectedRoute>} />
            <Route path="/admin-roles" element={<ProtectedRoute><Layout><AdminRoles /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            <Route path="/privacy-center" element={<ProtectedRoute><Layout><PrivacyCenter /></Layout></ProtectedRoute>} />
            
            {/* ========== ADMIN ROUTES ========== */}
            <Route path="/app/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="add-trade" element={<AdminAddTrade />} />
              <Route path="history" element={<AdminHistory />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="comparison" element={<AdminComparison />} />
              <Route path="psychology" element={<AdminPsychology />} />
              <Route path="journal" element={<AdminJournal />} />
              <Route path="calculator" element={<AdminCalculator />} />
              <Route path="currency-conversion" element={<AdminCurrencyConversion />} />
              <Route path="challenges" element={<AdminChallenges />} />
              <Route path="sessions" element={<AdminSessions />} />
              <Route path="roles" element={<AdminRolesPage />} />
              <Route path="audit" element={<AdminAuditHistory />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="about" element={<AdminAbout />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ChunkErrorBoundary>
      {user && (
        <Suspense fallback={null}>
          <AIChatBot />
          <ChangelogModal />
        </Suspense>
      )}
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first visit of the session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <SecurityProvider>
              <AdminProvider>
                <TooltipProvider>
                  {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppContent />
                    <CookieConsent />
                  </BrowserRouter>
                </TooltipProvider>
              </AdminProvider>
            </SecurityProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;