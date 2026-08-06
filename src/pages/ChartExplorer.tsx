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
import { useCosmicReadingContext } from '@/contexts/cosmicReadingStore';
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
  
