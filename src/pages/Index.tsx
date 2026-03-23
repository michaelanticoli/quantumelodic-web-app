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
import { CosmicWaveform, paletteFromSign } from '@/components/CosmicWaveform';
import { useCosmicReading } from '@/hooks/useCosmicReading';
import { useCosmicReadingContext } from '@/contexts/CosmicReadingContext';
import { useToast } from '@/hooks/use-toast';
import { downloadChartImage, downloadAudio, downloadPdfReport } from '@/utils/downloadHelpers';
import type { BirthData } from '@/types/astrology';

type AppState = 'input' | 'generating' | 'result';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const cosmicCtx = useCosmicReadingContext();

  const [appState, setAppState] = useState<AppState>(cosmicCtx.reading ? 'result' : 'input');

  const {
    loading, error, reading: hookReading, audioSource: hookAudioSource,
    progress, stage, generateReading, reset: hookReset,
  } = useCosmicReading();

  const reading = cosmicCtx.reading || hookReading;
  const audioUrl = cosmicCtx.audioUrl || null;
  const audioSource = cosmicCtx.audioSource || hookAudioSource;

  const handleFormSubmit = async (data: BirthData) => {
    setAppState('generating');
    try {
      const result = await generateReading(data);
      if (result) {
        cosmicCtx.setReadingData(result, result.audioUrl ?? null, result.audioSource ?? null);
      }
      setAppState('result');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate your cosmic reading';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setAppState('input');
    }
  };

  const handleGenerationComplete = () => {
    if (!error) setAppState('result');
  };

  const handleBack = () => {
    hookReset();
    cosmicCtx.clearReading();
    setAppState('input');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <title>QuantumMelodic — Your Cosmic Symphony</title>
      <meta name="description" content="Transform your birth chart into a unique musical composition. Discover your cosmic symphony." />

      <CosmicBackground />

      <AnimatePresence mode="wait">
        {appState === 'input' && (
          <motion.main
            key="input"
            className="relative z-10 min-h-screen flex flex-col items-center px-6 pt-10 pb-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {/* Hero Header */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Sigil above title */}
              <motion.div
                className="flex items-center justify-center gap-3 mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
              >
                <div className="h-px w-10 bg-gradient-to-r from-transparent to-primary/40" />
                <span
                  className="text-primary/70 text-sm"
                  style={{ fontFamily: "'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',sans-serif" }}
                >
                  ✦
                </span>
                <div className="h-px w-10 bg-gradient-to-l from-transparent to-primary/40" />
              </motion.div>

              <h1 className="font-display font-semibold tracking-tight leading-none mb-2">
                <span className="block text-4xl md:text-6xl text-gold-gradient">Quantum</span>
                <span className="block text-4xl md:text-6xl text-foreground/85">Melodic</span>
              </h1>
              <p className="font-serif italic text-muted-foreground/70 text-sm md:text-base tracking-wide mt-3">
                Find yourself in the frequency
              </p>
            </motion.div>

            {/* Zodiac Wheel */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 80, damping: 16 }}
            >
              <ZodiacWheel />
            </motion.div>

            {/* Form */}
            <motion.div
              className="w-full max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <BirthDataForm onSubmit={handleFormSubmit} isLoading={loading} />
            </motion.div>

            {/* Subtle scroll hint */}
            <motion.p
              className="mt-8 text-[10px] text-muted-foreground/30 tracking-[0.3em] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Natal chart · Musical composition · Soul resonance
            </motion.p>
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
            className="relative z-10 min-h-screen flex flex-col items-center px-4 pt-8 pb-32"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ResultsView
              name={reading.birthData.name}
              chartData={reading.chartData}
              musicalMode={reading.musicalMode}
              audioUrl={audioUrl ?? reading.audioUrl}
              audioSource={audioSource}
              reading={reading}
              onBack={handleBack}
              onExplore={() => navigate('/explore')}
            />
          </motion.main>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

// ─── Results View ──────────────────────────────────────────────

interface ResultsViewProps {
  name: string;
  chartData: {
    planets: Array<{ name: string; symbol: string; degree: number; sign: string; signNumber: number; isRetrograde: boolean }>;
    sunSign: string;
    moonSign: string;
    ascendant: string;
    source: string;
  };
  musicalMode: string;
  audioUrl?: string | null;
  audioSource?: 'elevenlabs' | 'procedural' | null;
  reading: import('@/types/astrology').CosmicReading;
  onBack: () => void;
  onExplore: () => void;
}

const ResultsView = ({ name, chartData, musicalMode, audioUrl, audioSource, reading, onBack, onExplore }: ResultsViewProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
      setAudioEl(audio);
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration || 0));
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime || 0));
      audio.addEventListener('ended', () => { setIsPlaying(false); setCurrentTime(0); });
      return () => { audio.pause(); audioRef.current = null; setAudioEl(null); };
    }
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (t: number) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleDownloadChart = async () => {
    setIsDownloading('chart');
    try { await downloadChartImage('chart-wheel-container', `${name.replace(/\s+/g, '-').toLowerCase()}-chart.png`); }
    catch (e) { console.error(e); }
    finally { setIsDownloading(null); }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading('pdf');
    try { await downloadPdfReport(reading, 'chart-wheel-container'); }
    catch (e) { console.error(e); }
    finally { setIsDownloading(null); }
  };

  const handleDownloadMusic = async () => {
    if (!audioUrl) return;
    setIsDownloading('music');
    try { await downloadAudio(audioUrl, `${name.replace(/\s+/g, '-').toLowerCase()}-composition.mp3`); }
    finally { setIsDownloading(null); }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'QuantumMelodic — My Cosmic Symphony',
      text: `✨ My cosmic chart has been translated into music! Check out QuantumMelodic to discover yours.`,
      url: 'https://quantumelodic.lovable.app',
    };
    try {
      if (navigator.share) { await navigator.share(shareData); }
      else { await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`); setIsDownloading('share-copied'); setTimeout(() => setIsDownloading(null), 2000); }
    } catch {}
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Back */}
      <motion.button
        className="fixed top-5 left-5 z-50 text-muted-foreground/60 hover:text-foreground transition-colors text-sm tracking-wide flex items-center gap-1.5"
        onClick={onBack}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="text-lg leading-none">‹</span>
        <span>New Reading</span>
      </motion.button>

      {/* Name + Sign header */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground leading-tight">
          {name}
        </h2>
        <p className="text-xs tracking-[0.3em] text-primary/70 uppercase mt-1.5">
          {chartData.sunSign} ☉ · {chartData.moonSign} ☽ · {musicalMode}
        </p>
        {chartData.source === 'approximate' && (
          <p className="text-[10px] text-muted-foreground/40 mt-1 italic">approximate positions</p>
        )}
      </motion.div>

      {/* Zodiac wheel */}
      <motion.div
        id="chart-wheel-container"
        className="flex justify-center mb-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ZodiacWheel planets={chartData.planets} animate={false} />
      </motion.div>

      {/* Aspect Legend */}
      <div className="mb-5 px-2">
        <AspectLegend />
      </div>

      {/* Explore button — prominent */}
      <motion.button
        className="w-full mb-6 py-3.5 rounded-xl border font-display font-medium tracking-wider text-sm uppercase transition-all duration-300"
        style={{
          borderColor: 'hsl(292 70% 62% / 0.4)',
          color: 'hsl(292 70% 72%)',
          background: 'hsl(292 70% 62% / 0.06)',
        }}
        onClick={onExplore}
        whileHover={{ scale: 1.01, boxShadow: '0 0 20px hsl(292 70% 62% / 0.2)' }}
        whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        ✦ Explore Interactive Chart ✦
      </motion.button>

      {/* Planet Details Table */}
      <div className="mb-6">
        <PlanetDetailsTable planets={chartData.planets} />
      </div>

      {/* Audio Visualizer */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="relative w-full h-36 rounded-2xl overflow-hidden mb-3"
          style={{ border: '1px solid hsl(43 88% 58% / 0.14)' }}
        >
          <CosmicWaveform
            audioElement={audioEl}
            idleIntensity={isPlaying ? 0.85 : 0.28}
            palette={paletteFromSign(chartData.sunSign)}
          />
          {audioUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md"
                style={{
                  background: 'hsl(228 35% 6% / 0.5)',
                  border: '1px solid hsl(43 88% 58% / 0.3)',
                  boxShadow: '0 0 20px hsl(43 88% 58% / 0.15)',
                }}
                whileHover={{ scale: 1.08, boxShadow: '0 0 30px hsl(43 88% 58% / 0.35)' }}
                whileTap={{ scale: 0.93 }}
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </motion.button>
            </div>
          )}
        </div>

        {audioUrl ? (
          <>
            {audioSource === 'procedural' && (
              <p className="text-[10px] text-muted-foreground/40 tracking-widest text-center mb-2 uppercase">
                Procedural synthesis · chart-derived frequencies
              </p>
            )}
            <div className="w-full max-w-xs mx-auto mb-2">
              <div
                className="h-0.5 rounded-full overflow-hidden cursor-pointer"
                style={{ background: 'hsl(255 25% 18%)' }}
                onClick={(e) => {
                  if (!audioRef.current || !duration) return;
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, hsl(43 88% 58%), hsl(292 70% 62%))',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8">
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
              </button>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
              </button>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground/30 italic text-center">
            Audio unavailable — explore your chart data above
          </p>
        )}
      </motion.div>

      {/* Actions row */}
      <motion.div
        className="mt-6 grid grid-cols-3 gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={handleDownloadChart}
          disabled={!!isDownloading && isDownloading !== 'share-copied'}
          className="py-2.5 rounded-xl border border-primary/25 text-primary/80 text-[10px] tracking-widest uppercase hover:bg-primary/8 hover:border-primary/50 transition-all disabled:opacity-40"
        >
          {isDownloading === 'chart' ? '…' : '⬇ Chart'}
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={!!isDownloading && isDownloading !== 'share-copied'}
          className="py-2.5 rounded-xl border border-accent/25 text-accent/80 text-[10px] tracking-widest uppercase hover:bg-accent/8 hover:border-accent/50 transition-all disabled:opacity-40"
        >
          {isDownloading === 'pdf' ? '…' : '⬇ Report'}
        </button>
        {audioUrl ? (
          <button
            onClick={handleDownloadMusic}
            disabled={!!isDownloading && isDownloading !== 'share-copied'}
            className="py-2.5 rounded-xl border border-highlight/25 text-highlight/80 text-[10px] tracking-widest uppercase hover:bg-highlight/8 hover:border-highlight/50 transition-all disabled:opacity-40"
          >
            {isDownloading === 'music' ? '…' : '⬇ Music'}
          </button>
        ) : (
          <div />
        )}
      </motion.div>

      {/* Share */}
      <motion.button
        className="mt-3 w-full py-3 rounded-xl border border-foreground/12 text-foreground/50 text-xs tracking-widest uppercase hover:border-foreground/25 hover:text-foreground/70 transition-all"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.998 }}
        onClick={handleShare}
      >
        {isDownloading === 'share-copied' ? '✓ Link Copied' : '↑ Share Your Symphony'}
      </motion.button>
    </div>
  );
};

export default Index;
