import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Layout from "@/components/layout/Layout";
import AIChatBot from "@/components/AIChatBot";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/home" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/add-trade" element={<AddTrade />} />
                <Route path="/history" element={<History />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/psychology" element={<PsychologicalAnalysis />} />
                <Route path="/video-journal" element={<VideoJournal />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
            <AIChatBot />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
