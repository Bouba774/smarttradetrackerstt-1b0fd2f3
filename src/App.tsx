import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import AIChatBot from "@/components/AIChatBot";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AddTrade from "./pages/AddTrade";
import History from "./pages/History";
import Reports from "./pages/Reports";
import PsychologicalAnalysis from "./pages/PsychologicalAnalysis";
import VideoJournal from "./pages/VideoJournal";
import Journal from "./pages/Journal";
import Calculator from "./pages/Calculator";
import Challenges from "./pages/Challenges";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import About from "./pages/About";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

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

  return (
    <>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Landing />} />
        
        {/* Auth page renders without layout */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Public pages without authentication */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/about" element={<About />} />
        
        {/* All other routes with layout */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/add-trade" element={<ProtectedRoute><Layout><AddTrade /></Layout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
        <Route path="/psychology" element={<ProtectedRoute><Layout><PsychologicalAnalysis /></Layout></ProtectedRoute>} />
        <Route path="/video-journal" element={<ProtectedRoute><Layout><VideoJournal /></Layout></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><Layout><Journal /></Layout></ProtectedRoute>} />
        <Route path="/calculator" element={<ProtectedRoute><Layout><Calculator /></Layout></ProtectedRoute>} />
        <Route path="/challenges" element={<ProtectedRoute><Layout><Challenges /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <AIChatBot />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
