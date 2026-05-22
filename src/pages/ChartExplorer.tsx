import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { CosmicBackground } from '@/components/CosmicBackground';
import { InteractiveZodiacWheel } from '@/components/InteractiveZodiacWheel';
import { PlanetDetailPanel } from '@/components/PlanetDetailPanel';
import { AspectDetailPanel } from '@/components/AspectDetailPanel';
import { AspectPatternPanel } from '@/components/AspectPatternPanel';
import { QuantumMelodicSummary } from '@/components/QuantumMelodicSummary';
import { PlanetChoirMixer } from '@/components/PlanetChoirMixer';
import { CosmicWaveform, paletteFromSign } from '@/components/CosmicWaveform';
import { ZodiacSignDetailPanel } from '@/components/ZodiacSignDetailPanel';
import { useQuantumMelodicData } from '@/hooks/useQuantumMelodicData';
import { useCosmicReadingContext } from '@/contexts/CosmicReadingContext';
import type { PlanetPosition, ChartData } from '@/types/astrology';
import type { ComputedAspect, QuantumMelodicReading } from '@/types/quantumMelodic';

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
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // Planet choir mixer state
  const [enabledPlanets, setEnabledPlanets] = useState<Set<string>>(new Set());
  const [activeElements, setActiveElements] = useState<Set<string>>(new Set());

  // Choir audio element state — lifted so CosmicWaveform can react to it
  const [choirAudio, setChoirAudio] = useState<HTMLAudioElement | null>(null);

  const { error, dataReady, buildReading, getSignData } = useQuantumMelodicData();
  const [reading, setReading] = useState<QuantumMelodicReading | null>(null);
  const readingBuilt = useRef(false);

  // Redirect if no chart data
  useEffect(() => {
    if (!chartData) {
      navigate('/');
    }
  }, [chartData, navigate]);

  // Build reading as soon as data is ready — guard against double-fire
  useEffect(() => {
    if (!dataReady || !chartData?.planets || readingBuilt.current) return;
    const result = buildReading(chartData.planets);
    if (result) {
      setReading(result);
      readingBuilt.current = true;
    }
  }, [dataReady, buildReading, chartData]);

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

      const elementPlanets = reading.planets
        .filter(p => p.signData?.element === element && p.position.name !== 'Ascendant')
        .map(p => p.position.name);

      setEnabledPlanets(prevEnabled => {
        const nextEnabled = new Set(prevEnabled);
        if (isActive) {
          elementPlanets.forEach(name => nextEnabled.delete(name));
        } else {
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
    setSelectedSign(null);
    setSelectedPlanet(planet);
  };

  const handleAspectClick = (aspect: ComputedAspect) => {
    setSelectedPlanet(null);
    setSelectedAspectPattern(null);
    setSelectedSign(null);
    setSelectedAspect(aspect);
  };

  const handleAspectPatternClick = (aspectName: string) => {
    setSelectedPlanet(null);
    setSelectedAspect(null);
    setSelectedSign(null);
    setSelectedAspectPattern(aspectName);
  };

  const handleSignClick = (signName: string) => {
    setSelectedPlanet(null);
    setSelectedAspect(null);
    setSelectedAspectPattern(null);
    setSelectedSign(signName);
  };

  const handleClose = () => {
    setSelectedPlanet(null);
    setSelectedAspect(null);
    setSelectedAspectPattern(null);
    setSelectedSign(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-5 backdrop-blur-md bg-background/40 border-b border-foreground/5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground text-[11px] tracking-[0.2em] uppercase transition-colors"
            whileHover={{ x: -2 }}
          >
            ← Back
          </motion.button>

          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/60 tracking-[0.3em] uppercase mb-1">
              Interactive Explorer
            </p>
            <h1 className="font-display text-base font-medium tracking-tight text-foreground">
              {chartName}
            </h1>
          </div>

          <div className="w-12" />
        </div>
      </header>

      {/* Main Content — shown immediately, QM data loads progressively */}
      <main className="relative z-10 pt-20 pb-8 px-4">
        {error ? (
          <div className="text-center text-destructive py-20">
            <p>{error}</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Interactive Wheel — renders immediately with planets data */}
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
                onSignClick={handleSignClick}
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

            {/* Audio Visualizer — reacts to choir audio when playing */}
            <motion.div
              className="w-full h-24 rounded-xl overflow-hidden mb-4"
              style={{ border: '1px solid hsl(43 74% 52% / 0.12)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CosmicWaveform
                audioElement={choirAudio}
                idleIntensity={0.5}
                palette={paletteFromSign(chartData.sunSign)}
              />
            </motion.div>

            {/* QM loading indicator — only shown while QM data is loading */}
            {!reading && !error && (
              <motion.div
                className="flex items-center justify-center gap-3 py-4 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-4 h-4 border border-primary/60 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-xs text-muted-foreground tracking-wide">Loading harmonic data…</span>
              </motion.div>
            )}

            {/* Planet Choir Mixer — available to all users */}
            {reading && (
              <PlanetChoirMixer
                reading={reading}
                enabledPlanets={enabledPlanets}
                onTogglePlanet={handleTogglePlanet}
                activeElements={activeElements}
                onToggleElement={handleToggleElement}
                onAudioChange={setChoirAudio}
              />
            )}

            {/* QuantumMelodic Summary */}
            {reading && (
              <div className="mt-4">
                <QuantumMelodicSummary
                  reading={reading}
                  chartData={chartData}
                  subjectName={chartName}
                  readingId={cosmicCtx.reading?.id ?? null}
                  isUnlocked={true}
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

        {selectedSign && (
          <ZodiacSignDetailPanel
            signName={selectedSign}
            signData={getSignData(selectedSign)}
            isDataReady={dataReady}
            dataError={error}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChartExplorer;
