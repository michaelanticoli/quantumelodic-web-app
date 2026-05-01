import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PixelPerfectOverlay } from "@/components/PixelPerfectOverlay";
import { CosmicReadingProvider } from "@/contexts/CosmicReadingContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";

const About = lazy(() => import("./pages/About"));
const Learn = lazy(() => import("./pages/Learn"));
const Guide = lazy(() => import("./pages/Guide"));
const ChartExplorer = lazy(() => import("./pages/ChartExplorer"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Academy = lazy(() => import("./pages/Academy"));
const LunarReports = lazy(() => import("./pages/LunarReports"));
const Glossary = lazy(() => import("./pages/Glossary"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const [pixelPerfectMode, setPixelPerfectMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setPixelPerfectMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <CosmicReadingProvider>
              <Toaster />
              <Sonner />
              <Analytics />
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/guide" element={<Guide />} />
                  <Route path="/explore" element={<ChartExplorer />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/academy" element={<Academy />} />
                  <Route path="/lunar-reports" element={<LunarReports />} />
                  <Route path="/glossary" element={<Glossary />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <PixelPerfectOverlay 
                isOpen={pixelPerfectMode} 
                onClose={() => setPixelPerfectMode(false)} 
              />
            </CosmicReadingProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
