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
import { AdminProvider } from "@/contexts/AdminContext";
import Layout from "@/components/layout/Layout";
import { CookieConsent } from "@/components/CookieConsent";
import LockScreen from "@/components/LockScreen";
import { useSessionTracking } from "@/hooks/useSessionTracking";

// Critical pages loaded immediately
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages
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
const PrivacyCenter = lazy(() => import("./pages/PrivacyCenter"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ResetPin = lazy(() => import("./pages/ResetPin"));
const AIChatBot = lazy(() => import("@/components/AIChatBot"));
const ChangelogModal = lazy(() => import("@/components/ChangelogModal"));

// Admin pages
const AdminSecretValidation = lazy(() => import("./pages/AdminSecretValidation"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));

// Admin page wrappers
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAddTrade = lazy(() => import("./pages/admin/AdminAddTrade"));
const AdminHistory = lazy(() => import("./pages/admin/AdminHistory"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminComparison = lazy(() => import("./pages/admin/AdminComparison"));
const AdminPsychology = lazy(() => import("./pages/admin/AdminPsychology"));
const AdminJournal = lazy(() => import("./pages/admin/AdminJournal"));
const AdminCalculator = lazy(() => import("./pages/admin/AdminCalculator"));
const AdminCurrencyConversion = lazy(() => import("./pages/admin/AdminCurrencyConversion"));
const AdminChallenges = lazy(() => import("./pages/admin/AdminChallenges"));
const AdminSessions = lazy(() => import("./pages/admin/AdminSessions"));
const AdminRolesPage = lazy(() => import("./pages/admin/AdminRolesPage"));
const AdminAuditHistory = lazy(() => import("./pages/admin/AdminAuditHistory"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAbout = lazy(() => import("./pages/admin/AdminAbout"));

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
          
          {/* Auth pages */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-pin" element={<ResetPin />} />
          
          {/* Public pages without authentication */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
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
            <AdminProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppContent />
                  <CookieConsent />
                </BrowserRouter>
              </TooltipProvider>
            </AdminProvider>
          </SecurityProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;