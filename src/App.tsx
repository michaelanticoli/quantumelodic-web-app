import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PixelPerfectOverlay } from "@/components/PixelPerfectOverlay";
import { CosmicReadingProvider } from "@/contexts/CosmicReadingContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Learn from "./pages/Learn";
import Guide from "./pages/Guide";
import ChartExplorer from "./pages/ChartExplorer";
import NotFound from "./pages/NotFound";

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
        <CosmicReadingProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/explore" element={<ChartExplorer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <PixelPerfectOverlay 
            isOpen={pixelPerfectMode} 
            onClose={() => setPixelPerfectMode(false)} 
          />
        </CosmicReadingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
