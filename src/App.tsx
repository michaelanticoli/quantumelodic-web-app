import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PixelPerfectOverlay } from "@/components/PixelPerfectOverlay";
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
      // Use Ctrl+Shift+P to avoid conflict with browser print (Ctrl+P)
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
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/explore" element={<ChartExplorer />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <PixelPerfectOverlay 
          isOpen={pixelPerfectMode} 
          onClose={() => setPixelPerfectMode(false)} 
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
