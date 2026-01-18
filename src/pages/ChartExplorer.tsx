import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { CosmicBackground } from '@/components/CosmicBackground';
import { InteractiveZodiacWheel } from '@/components/InteractiveZodiacWheel';
import { PlanetDetailPanel } from '@/components/PlanetDetailPanel';
import { AspectDetailPanel } from '@/components/AspectDetailPanel';
import { QuantumMelodicSummary } from '@/components/QuantumMelodicSummary';
import { useQuantumMelodicData } from '@/hooks/useQuantumMelodicData';
import type { PlanetPosition, ChartData } from '@/types/astrology';
import type { ComputedAspect } from '@/types/quantumMelodic';

interface LocationState {
  chartData: ChartData;
  name: string;
}

const ChartExplorer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<ComputedAspect | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  
  const { loading, error, buildReading } = useQuantumMelodicData();

  // Redirect if no chart data
  useEffect(() => {
    if (!state?.chartData) {
      navigate('/');
    }
  }, [state, navigate]);

  const reading = useMemo(() => {
    if (!state?.chartData?.planets) return null;
    return buildReading(state.chartData.planets);
  }, [state?.chartData?.planets, buildReading]);

  if (!state?.chartData) {
    return null;
  }

  const handlePlanetClick = (planet: PlanetPosition) => {
    setSelectedAspect(null);
    setSelectedPlanet(planet);
  };

  const handleAspectClick = (aspect: ComputedAspect) => {
    setSelectedPlanet(null);
    setSelectedAspect(aspect);
  };

  const handleClose = () => {
    setSelectedPlanet(null);
    setSelectedAspect(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground text-sm tracking-wide transition-colors"
            whileHover={{ x: -2 }}
          >
            ‹ Back
          </motion.button>
          
          <div className="text-center">
            <h1 className="font-display text-lg font-light tracking-wide text-foreground">
              {state.name}'s Chart
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">
              Interactive Explorer
            </p>
          </div>
          
          <div className="w-12" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 pb-8 px-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
              className="w-8 h-8 border border-primary/60 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-20">
            <p>{error}</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Interactive Wheel */}
            <motion.div
              className="relative mx-auto mb-8"
              style={{ maxWidth: '90vmin', maxHeight: '70vh' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <InteractiveZodiacWheel
                planets={state.chartData.planets}
                aspects={reading?.aspects || []}
                onPlanetClick={handlePlanetClick}
                onAspectClick={handleAspectClick}
                onPlanetHover={setHoveredElement}
                selectedPlanet={selectedPlanet}
                selectedAspect={selectedAspect}
              />
              
              {/* Hover tooltip */}
              <AnimatePresence>
                {hoveredElement && (
                  <motion.div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <p className="text-sm text-foreground">{hoveredElement}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* QuantumMelodic Summary */}
            {reading && (
              <QuantumMelodicSummary reading={reading} />
            )}

            {/* Instruction hint */}
            <motion.p
              className="text-center text-xs text-muted-foreground/60 mt-6 tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Tap any planet or aspect line to explore its QuantumMelodic expression
            </motion.p>
          </div>
        )}
      </main>

      {/* Detail Panels */}
      <AnimatePresence>
        {selectedPlanet && reading && (
          <PlanetDetailPanel
            planet={reading.planets.find(p => p.position.name === selectedPlanet.name)!}
            onClose={handleClose}
          />
        )}
        
        {selectedAspect && (
          <AspectDetailPanel
            aspect={selectedAspect}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChartExplorer;
