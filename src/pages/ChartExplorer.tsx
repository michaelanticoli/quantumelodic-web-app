import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { CosmicBackground } from '@/components/CosmicBackground';
import { InteractiveZodiacWheel } from '@/components/InteractiveZodiacWheel';
import { PlanetDetailPanel } from '@/components/PlanetDetailPanel';
import { AspectDetailPanel } from '@/components/AspectDetailPanel';
import { AspectPatternPanel } from '@/components/AspectPatternPanel';
import { QuantumMelodicSummary } from '@/components/QuantumMelodicSummary';
import { PlanetChoirMixer } from '@/components/PlanetChoirMixer';
import { AudioReactiveGradient, paletteFromSign } from '@/components/AudioReactiveGradient';
import { useQuantumMelodicData } from '@/hooks/useQuantumMelodicData';
import { useCosmicReadingContext } from '@/contexts/CosmicReadingContext';
import type { PlanetPosition, ChartData } from '@/types/astrology';
import type { ComputedAspect } from '@/types/quantumMelodic';

interface LocationState {
  chartData: ChartData;
  name: string;
}

const ChartExplorer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cosmicCtx = useCosmicReadingContext();
  const locState = location.state as LocationState | null;
  
  // Prefer context reading over location state so chart persists across navigation
  const chartData = cosmicCtx.reading?.chartData ?? locState?.chartData ?? null;
  const chartName = cosmicCtx.reading?.birthData.name ?? locState?.name ?? '';
  
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<ComputedAspect | null>(null);
  const [selectedAspectPattern, setSelectedAspectPattern] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  
  // Planet choir mixer state
  const [enabledPlanets, setEnabledPlanets] = useState<Set<string>>(new Set());
  const [activeElements, setActiveElements] = useState<Set<string>>(new Set());
  
  const { loading, error, buildReading } = useQuantumMelodicData();

  // Redirect if no chart data
  useEffect(() => {
    if (!chartData) {
      navigate('/');
    }
  }, [chartData, navigate]);

  const reading = useMemo(() => {
    if (!chartData?.planets) return null;
    return buildReading(chartData.planets);
  }, [chartData?.planets, buildReading]);

  // Initialize all planets as enabled once reading is available
  useEffect(() => {
    if (reading) {
      const allNames = new Set(
        reading.planets
          .filter(p => p.position.name !== 'Ascendant')
          .map(p => p.position.name)
      );
      setEnabledPlanets(allNames);
    }
  }, [reading]);

  const handleTogglePlanet = useCallback((name: string) => {
    setEnabledPlanets(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const handleToggleElement = useCallback((element: string) => {
    if (!reading) return;
    
    setActiveElements(prev => {
      const next = new Set(prev);
      const isActive = next.has(element);
      
      if (isActive) {
        next.delete(element);
      } else {
        next.add(element);
      }
      
      // Get planets of this element
      const elementPlanets = reading.planets
        .filter(p => p.signData?.element === element && p.position.name !== 'Ascendant')
        .map(p => p.position.name);
      
      setEnabledPlanets(prevEnabled => {
        const nextEnabled = new Set(prevEnabled);
        if (isActive) {
          // Turning element OFF - disable those planets
          elementPlanets.forEach(name => nextEnabled.delete(name));
        } else {
          // Turning element ON - enable those planets
          elementPlanets.forEach(name => nextEnabled.add(name));
        }
        return nextEnabled;
      });
      
      return next;
    });
  }, [reading]);

  if (!chartData) {
    return null;
  }

  const handlePlanetClick = (planet: PlanetPosition) => {
    setSelectedAspect(null);
    setSelectedAspectPattern(null);
    setSelectedPlanet(planet);
  };

  const handleAspectClick = (aspect: ComputedAspect) => {
    setSelectedPlanet(null);
    setSelectedAspectPattern(null);
    setSelectedAspect(aspect);
  };

  const handleAspectPatternClick = (aspectName: string) => {
    setSelectedPlanet(null);
    setSelectedAspect(null);
    setSelectedAspectPattern(aspectName);
  };

  const handleClose = () => {
    setSelectedPlanet(null);
    setSelectedAspect(null);
    setSelectedAspectPattern(null);
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
              {chartName}'s Chart
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
                planets={chartData.planets}
                aspects={reading?.aspects || []}
                onPlanetClick={handlePlanetClick}
                onAspectClick={handleAspectClick}
                onPlanetHover={setHoveredElement}
                selectedPlanet={selectedPlanet}
                selectedAspect={selectedAspect}
                enabledPlanets={enabledPlanets}
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

            {/* Audio Visualizer */}
            <motion.div
              className="w-full h-28 rounded-2xl overflow-hidden mb-4 shadow-lg shadow-primary/10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AudioReactiveGradient
                idleIntensity={0.35}
                borderRadius={0}
                palette={paletteFromSign(chartData.sunSign)}
              />
            </motion.div>

            {/* Planet Choir Mixer */}
            {reading && (
              <PlanetChoirMixer
                reading={reading}
                enabledPlanets={enabledPlanets}
                onTogglePlanet={handleTogglePlanet}
                activeElements={activeElements}
                onToggleElement={handleToggleElement}
              />
            )}

            {/* QuantumMelodic Summary */}
            {reading && (
              <div className="mt-4">
                <QuantumMelodicSummary
                  reading={reading}
                  onAspectPatternClick={handleAspectPatternClick}
                />
              </div>
            )}

            {/* Instruction hint */}
            <motion.p
              className="text-center text-xs text-muted-foreground/60 mt-6 tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Tap any planet or aspect line to explore · Click aspect patterns to hear chordal recipes · Toggle planets to create custom choirs
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

        {selectedAspectPattern && reading && (
          <AspectPatternPanel
            aspectName={selectedAspectPattern}
            aspects={reading.aspects}
            reading={reading}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChartExplorer;
