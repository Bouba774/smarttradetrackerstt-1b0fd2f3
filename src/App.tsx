import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SecurityProvider, useSecurity } from "@/contexts/SecurityContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Layout from "@/components/layout/Layout";
import { CookieConsent } from "@/components/CookieConsent";
import LockScreen from "@/components/LockScreen";
import { usePinSecurity } from "@/hooks/usePinSecurity";
import { toast } from "sonner";

import { useSessionTracking } from "@/hooks/useSessionTracking";
import ChunkErrorBoundary from "@/components/ChunkErrorBoundary";
import { usePrefetchOnAuth } from "@/hooks/useRoutePrefetch";
import PageSkeleton from "@/components/ui/PageSkeleton";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

// Constants for brute force protection
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout

// Protected route wrapper with lock screen guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isLocked, isPinConfigured, isLoading: securityLoading } = useSecurity();

  if (loading || securityLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If PIN is configured and app is locked, don't render protected content
  // The lock screen will be shown by AppContent
  if (isPinConfigured && isLocked) {
    return null;
  }

  return <>{children}</>;
};

// Component to conditionally render layout
const AppContent = () => {
  const { user } = useAuth();
  const { 
    isLocked, 
    unlockApp, 
    isPinConfigured, 
    isLoading: securityLoading,
    failedAttempts,
    setFailedAttempts,
    lockCooldownEnd,
    setLockCooldown,
    clearLockCooldown,
  } = useSecurity();
  const {
    isBiometricEnabled,
    verifyPin,
    maxAttempts,
    shouldWipeOnMaxAttempts,
    wipeLocalData,
    requestPinReset,
    isVerifying,
    checkBiometricAvailability,
    verifyBiometric,
    pinStatus,
  } = usePinSecurity();

  // Check if biometric is actually available (credentials registered)
  const [biometricReady, setBiometricReady] = useState(false);
  
  useEffect(() => {
    if (isBiometricEnabled && user) {
      checkBiometricAvailability().then(setBiometricReady);
    } else {
      setBiometricReady(false);
    }
  }, [isBiometricEnabled, user, checkBiometricAvailability]);
  // Handle PIN verification with brute force protection
  const handlePinVerify = useCallback(async (pin: string): Promise<boolean> => {
    try {
      // Check if we're in cooldown
      if (lockCooldownEnd && lockCooldownEnd > Date.now()) {
        return false;
      }

      const isValid = await verifyPin({ pin });
      
      if (isValid) {
        unlockApp();
        setFailedAttempts(0);
        return true;
      }
      
      // Increment failed attempts
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      // Check if we should lock out (brute force protection)
      if (newAttempts >= MAX_PIN_ATTEMPTS) {
        const cooldownEnd = Date.now() + LOCKOUT_DURATION_MS;
        setLockCooldown(cooldownEnd);
        toast.error('Trop de tentatives. Veuillez patienter 1 minute.');
      }
      
      // Check if we should wipe data
      if (shouldWipeOnMaxAttempts && newAttempts >= (maxAttempts || MAX_PIN_ATTEMPTS)) {
        await wipeLocalData();
        toast.error('Données effacées après trop de tentatives');
      }
      
      return false;
    } catch {
      setFailedAttempts(failedAttempts + 1);
      return false;
    }
  }, [verifyPin, unlockApp, failedAttempts, setFailedAttempts, lockCooldownEnd, setLockCooldown, shouldWipeOnMaxAttempts, maxAttempts, wipeLocalData]);

  // Handle biometric authentication using proper WebAuthn credential
  const handleBiometricUnlock = useCallback(async (): Promise<boolean> => {
    try {
      // First check if biometric is properly configured
      const isAvailable = await checkBiometricAvailability();
      if (!isAvailable) {
        // Don't show error - just silently fail and let user use PIN
        return false;
      }

      // Use the proper verification that requires registered credentials
      const success = await verifyBiometric();
      
      if (success) {
        unlockApp();
        setFailedAttempts(0);
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Biometric authentication failed:', error);
      return false;
    }
  }, [checkBiometricAvailability, verifyBiometric, unlockApp, setFailedAttempts]);

  const handleForgotPin = useCallback(async () => {
    const success = await requestPinReset();
    if (success) {
      toast.success('Email de réinitialisation envoyé');
    } else {
      toast.error('Erreur lors de l\'envoi de l\'email');
    }
  }, [requestPinReset]);

  const handleCooldownEnd = useCallback(() => {
    clearLockCooldown();
  }, [clearLockCooldown]);

  // Show loading state
  if (securityLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  // Show lock screen if locked and user is authenticated with PIN configured
  if (user && isLocked && isPinConfigured) {
    // Only show biometric option if credentials are actually registered
    const showBiometricOption = isBiometricEnabled && biometricReady;
    
    return (
      <LockScreen
        onUnlock={handlePinVerify}
        onBiometricUnlock={showBiometricOption ? handleBiometricUnlock : undefined}
        failedAttempts={failedAttempts}
        maxAttempts={maxAttempts || MAX_PIN_ATTEMPTS}
        showBiometric={showBiometricOption}
        pinLength={pinStatus?.pinLength || 4}
        isVerifying={isVerifying}
        onForgotPin={handleForgotPin}
        cooldownEndTime={lockCooldownEnd}
        onCooldownEnd={handleCooldownEnd}
      />
    );
  }

  return (
    <>
      <ChunkErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public landing page - redirects to dashboard if logged in */}
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
            
            {/* Auth pages */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
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
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
