import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import Layout from "@/components/layout/Layout";
import { CookieConsent } from "@/components/CookieConsent";
import LockScreen from "@/components/LockScreen";
import { useSessionTracking } from "@/hooks/useSessionTracking";

// Critical pages loaded immediately
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages to reduce initial bundle

const Dashboard = lazy(() => import("./pages/Dashboard"));
const AddTrade = lazy(() => import("./pages/AddTrade"));
const History = lazy(() => import("./pages/History"));
const Reports = lazy(() => import("./pages/Reports"));
const PeriodComparison = lazy(() => import("./pages/PeriodComparison"));
const PsychologicalAnalysis = lazy(() => import("./pages/PsychologicalAnalysis"));

const Journal = lazy(() => import("./pages/Journal"));
const Calculator = lazy(() => import("./pages/Calculator"));
const CurrencyConversion = lazy(() => import("./pages/CurrencyConversion"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const SessionsAdmin = lazy(() => import("./pages/SessionsAdmin"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const About = lazy(() => import("./pages/About"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ResetPin = lazy(() => import("./pages/ResetPin"));
const AIChatBot = lazy(() => import("@/components/AIChatBot"));
const ChangelogModal = lazy(() => import("@/components/ChangelogModal"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-primary">Loading...</div>
  </div>
);

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

  return (
    <>
      {/* Lock Screen - appears on top of everything when locked */}
      {user && <LockScreen />}
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<Landing />} />
          
          {/* Auth page renders without layout */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-pin" element={<ResetPin />} />
          
          {/* Public pages without authentication */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/about" element={<About />} />
          
          {/* All other routes with layout */}
          
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {user && (
        <Suspense fallback={null}>
          <AIChatBot />
          <ChangelogModal />
        </Suspense>
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SecurityProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
                <CookieConsent />
              </BrowserRouter>
            </TooltipProvider>
          </SecurityProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
