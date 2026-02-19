import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ZodiacWheel } from '@/components/ZodiacWheel';
import { AspectLegend } from '@/components/AspectLegend';
import { PlanetDetailsTable } from '@/components/PlanetDetailsTable';
import { BirthDataForm } from '@/components/BirthDataForm';
import { BottomNav } from '@/components/BottomNav';
import { GeneratingState } from '@/components/GeneratingState';
import { AudioReactiveGradient } from '@/components/AudioReactiveGradient';
import { useCosmicReading } from '@/hooks/useCosmicReading';
import { useToast } from '@/hooks/use-toast';
import type { BirthData } from '@/types/astrology';

type AppState = 'input' | 'generating' | 'result';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('input');
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    loading,
    error,
    reading,
    chartData,
    audioUrl,
    audioSource,
    progress,
    stage,
    generateReading,
    reset,
  } = useCosmicReading();

  const handleFormSubmit = async (data: BirthData) => {
    setAppState('generating');
    
    try {
      await generateReading(data);
      setAppState('result');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate your cosmic reading';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      setAppState('input');
    }
  };

  const handleGenerationComplete = () => {
    if (!error) {
      setAppState('result');
    }
  };

  const handleBack = () => {
    reset();
    setAppState('input');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* SEO */}
      <title>QuantumMelodies - Your Cosmic Symphony Awaits</title>
      <meta name="description" content="Transform your birth chart into a unique musical composition. Discover your cosmic symphony through advanced astrological and harmonic principles." />

      {/* Cosmic Background */}
      <CosmicBackground />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {appState === 'input' && (
          <motion.main
            key="input"
            className="relative z-10 min-h-screen flex flex-col items-center px-6 pt-12 pb-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Logo / Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="font-display text-3xl md:text-4xl font-light tracking-wide">
                <span className="text-gold-gradient">Quantum</span>
                <span className="text-foreground/90">Melodic</span>
              </h1>
              <p className="text-muted-foreground text-xs tracking-widest uppercase mt-3">
                Find yourself in the frequency
              </p>
            </motion.div>

            {/* Zodiac Wheel - decorative mode */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            >
              <ZodiacWheel />
            </motion.div>

            {/* Birth Data Form */}
            <BirthDataForm onSubmit={handleFormSubmit} isLoading={loading} />
          </motion.main>
        )}

        {appState === 'generating' && (
          <GeneratingState
            key="generating"
            stage={stage === 'idle' || stage === 'complete' ? 'calculating' : stage}
            progress={progress}
            onComplete={handleGenerationComplete}
          />
        )}

        {appState === 'result' && reading && (
          <motion.main
            key="result"
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pb-32"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ResultsView 
              name={reading.birthData.name} 
              chartData={reading.chartData}
              musicalMode={reading.musicalMode}
              audioUrl={reading.audioUrl}
              audioSource={audioSource}
              onBack={handleBack}
              onExplore={() => navigate('/explore', { state: { chartData: reading.chartData, name: reading.birthData.name } })}
            />
          </motion.main>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

// Results View Component with real data
interface ResultsViewProps {
  name: string;
  chartData: {
    planets: Array<{
      name: string;
      symbol: string;
      degree: number;
      sign: string;
      signNumber: number;
      isRetrograde: boolean;
    }>;
    sunSign: string;
    moonSign: string;
    ascendant: string;
    source: string;
  };
  musicalMode: string;
  audioUrl?: string;
  audioSource?: 'elevenlabs' | 'procedural' | null;
  onBack: () => void;
  onExplore: () => void;
}

const ResultsView = ({ name, chartData, musicalMode, audioUrl, audioSource, onBack, onExplore }: ResultsViewProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
      setAudioEl(audio);
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration || 0);
      });
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime || 0);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      return () => {
        audio.pause();
        audioRef.current = null;
        setAudioEl(null);
      };
    }
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="text-center w-full max-w-2xl mx-auto">
      {/* Back button */}
      <motion.button
        className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors text-sm tracking-wide"
        onClick={onBack}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        ‹ New Reading
      </motion.button>

      {/* Zodiac wheel with real planetary positions */}
      <motion.div
        className="mb-4 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ZodiacWheel planets={chartData.planets} animate={false} />
      </motion.div>

      {/* Aspect Legend */}
      <div className="mb-6">
        <AspectLegend />
      </div>

      {/* Track info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-2xl font-light tracking-wide text-foreground mb-2">
          Cosmic Symphony
        </h2>
        <p className="text-muted-foreground text-sm mb-2">
          A unique composition for {name}
        </p>
        <p className="text-xs tracking-widest text-primary/80">
          {chartData.sunSign} ☉ · {chartData.moonSign} ☽ · {musicalMode}
        </p>
        {chartData.source === 'approximate' && (
          <p className="text-xs text-muted-foreground/50 mt-2 italic">
            approximate positions
          </p>
        )}
      </motion.div>

      {/* Planet Details Table */}
      <div className="my-6">
        <PlanetDetailsTable planets={chartData.planets} />
      </div>

      {/* Explore Chart Button */}
      <motion.button
        className="mb-4 px-6 py-2 rounded-full border border-accent/40 text-accent text-xs tracking-widest uppercase hover:bg-accent/10 transition-all"
        onClick={onExplore}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Explore Full Chart
      </motion.button>

      {/* Audio Visualizer + Controls */}
      <motion.div
        className="mt-8 w-full max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Gradient Shader Visualizer */}
        <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 shadow-lg shadow-primary/10">
          <AudioReactiveGradient
            audioElement={audioEl}
            idleIntensity={isPlaying ? 0.5 : 0.25}
            borderRadius={0}
          />
          {/* Overlay play button centered on gradient */}
          {audioUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                className="w-14 h-14 rounded-full bg-background/30 backdrop-blur-md border border-foreground/10 flex items-center justify-center"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </motion.button>
            </div>
          )}
        </div>

        {audioUrl ? (
          <>
            {/* Source label */}
            {audioSource === 'procedural' && (
              <p className="text-xs text-muted-foreground/50 tracking-wide mb-2 text-center">
                ✦ Procedural synthesis from your chart
              </p>
            )}

            {/* Progress bar */}
            <div className="w-full max-w-[280px] mx-auto">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
              </div>
            </div>

            {/* Skip controls */}
            <div className="mt-3 flex items-center justify-center gap-8">
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = Math.max(0, currentTime - 10);
                  }
                }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button 
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = Math.min(duration, currentTime + 10);
                  }
                }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground/40 italic text-center">
            Audio unavailable — explore your chart data below
          </p>
        )}
      </motion.div>

      {/* Share button */}
      <motion.button
        className="mt-8 px-10 py-3 rounded-full border border-primary/40 text-primary text-sm tracking-widest uppercase hover:bg-primary/10 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.01, borderColor: 'hsl(43 74% 52% / 0.6)' }}
        whileTap={{ scale: 0.99 }}
      >
        Share
      </motion.button>
    </div>
  );
};

export default Index;
