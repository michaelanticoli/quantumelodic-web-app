import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, Pause, ShieldCheck, Music2, FileText, Sparkles, Star } from "lucide-react";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ZodiacWheel } from "@/components/ZodiacWheel";
import { AspectLegend } from "@/components/AspectLegend";
import { PlanetDetailsTable } from "@/components/PlanetDetailsTable";
import { BirthDataForm } from "@/components/BirthDataForm";
import { BottomNav } from "@/components/BottomNav";
import { GeneratingState } from "@/components/GeneratingState";
import { CosmicWaveform, paletteFromSign } from "@/components/CosmicWaveform";
import { NatalHarmonicReport } from "@/components/reports/NatalHarmonicReport";
import { ReportNarrationButton } from "@/components/ReportNarrationButton";
import { useCosmicReading } from "@/hooks/useCosmicReading";
import { useCosmicReadingContext } from "@/contexts/CosmicReadingContext";
import { useQuantumMelodicData } from "@/hooks/useQuantumMelodicData";
import { useToast } from "@/hooks/use-toast";
import { generateChartMusic } from "@/lib/cosmicReadings";
import {
  createDownloadableAudioUrl,
  createNatalHarmonicPdfUrl,
  downloadNatalChartSvg,
  downloadNatalHarmonicPdf,
  triggerFileDownload,
} from "@/utils/downloadHelpers";
import type { BirthData } from "@/types/astrology";

// ─── Offer constants ────────────────────────────────────────────────────────
// TODO: Replace with your live $25 Stripe payment link.
// Set its success redirect to: https://quantumelodies.com/?paid=true
const CHECKOUT_URL = 'https://buy.stripe.com/9B614mbaWfPu5ebcCZe7m0b';
const PRICE = '$25';
const PAID_SESSION_KEY = 'quantumelodic_paid';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
});

// ─── Paywall sub-components ─────────────────────────────────────────────────

const ResonanceGuarantee = () => (
  <motion.div
    className="mt-8 py-5 px-5 border border-border/40"
    style={{ borderLeft: '2px solid hsl(168 95% 55%)' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.6 }}
  >
    <p className="font-ui text-[10px] uppercase tracking-[0.25em] text-accent mb-2">
      THE RESONANCE GUARANTEE
    </p>
    <p className="font-body text-sm text-foreground/70 leading-relaxed">
      If the composition doesn't feel like yours, say so within seven days. Full refund — and you keep the
      report. This work is meant to resonate. If it doesn't, you owe nothing.
    </p>
  </motion.div>
);

interface SampleCardProps {
  name: string;
  chart: string;
  musicalKey: string;
  src: string;
  delay?: number;
}

const SampleCard = ({ name, chart, musicalKey, src, delay = 0 }: SampleCardProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el || audioError) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {
        setAudioError(true);
        setIsPlaying(false);
      }
    }
  };

  return (
    <motion.div
      className="rounded-[18px] border border-border/40 bg-card/50 backdrop-blur-sm p-5 hover:border-accent/40 transition-all duration-300"
      style={{ boxShadow: '0 0 40px hsl(168 75% 45% / 0.08)' }}
      {...fadeUp(delay)}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60 mb-0.5">
            {chart}
          </p>
          <p className="font-playfair text-base text-foreground">{name}</p>
        </div>
        <span className="font-data text-[10px] tracking-[0.15em] text-accent shrink-0 pt-0.5">
          {musicalKey}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        onError={() => { setAudioError(true); setIsPlaying(false); }}
        preload="none"
      />

      {audioError ? (
        <p className="font-body text-xs text-muted-foreground/50 italic">
          Audio sample not yet available.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 rounded-full border border-accent/40 flex items-center justify-center hover:border-accent hover:bg-accent/10 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isPlaying
              ? <Pause className="w-3.5 h-3.5 text-accent" />
              : <Play className="w-3.5 h-3.5 text-accent ml-0.5" />}
          </button>
          {isPlaying && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-accent/40 bg-accent/10">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-ui text-[9px] uppercase tracking-[0.2em] text-accent">Playing</span>
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

const SAMPLES: SampleCardProps[] = [
  { name: 'Albert Einstein', chart: 'Pisces Sun · Sagittarius Moon', musicalKey: 'E♭ MAJOR · LYDIAN', src: '/samples/einstein.mp3' },
];

const SamplesSection = () => (
  <motion.section id="samples" className="mb-14" {...fadeUp(0.1)}>
    <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-accent mb-4 text-center">
      LISTEN — ONE CHART
    </p>
    <div className="space-y-4">
      {SAMPLES.map((s, i) => (
        <SampleCard key={s.src} {...s} delay={0.05 * i} />
      ))}
    </div>
  </motion.section>
);

const OfferCard = () => (
  <motion.section className="mb-12" {...fadeUp(0.1)}>
    <div
      className="rounded-[18px] border bg-card/60 backdrop-blur-sm p-6"
      style={{ borderColor: 'hsl(168 95% 55% / 0.5)', boxShadow: '0 0 40px hsl(168 75% 45% / 0.12)' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="font-playfair text-xl text-foreground">The Composition</h2>
        <span className="font-data text-2xl text-foreground shrink-0">{PRICE}</span>
      </div>
      <ul className="space-y-1.5 mb-6">
        {[
          'Your piece of music, composed from your exact chart',
          'Full written analysis, narrated in the maker’s voice',
          'Delivered within 24 hours',
        ].map(item => (
          <li key={item} className="flex items-start gap-2 font-body text-sm text-foreground/70">
            <span className="text-accent mt-0.5 shrink-0">—</span>
            {item}
          </li>
        ))}
      </ul>
      <a
        href={CHECKOUT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center py-3.5 rounded-full font-ui text-xs uppercase tracking-[0.2em] transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ background: 'hsl(168 95% 55%)', color: 'hsl(240 6% 4%)' }}
      >
        Order the Composition — {PRICE}
      </a>
      <p className="font-body text-[11px] text-muted-foreground/60 leading-relaxed mt-4">
        Want the notated score, lossless master, and a commercial license? Reply after purchase.
      </p>
    </div>

    <ResonanceGuarantee />
  </motion.section>
);


interface LandingViewProps {
  onStartFree: () => void;
  onUnlock: () => void;
}

const LandingView = ({ onStartFree, onUnlock }: LandingViewProps) => (
  <motion.main
    key="paywall"
    className="relative z-10 min-h-screen px-5 pt-10 pb-24"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4 }}
  >
    <div className="max-w-2xl mx-auto">

      {/* ── Hero ── */}
      <motion.header className="text-center mb-14 pt-8" {...fadeUp(0.05)}>
        <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-accent/70 mb-5">
          <span className="text-accent">—</span> WHAT KEY IS YOUR CHART IN?
        </p>
        <h1 className="font-hero font-[200] leading-[0.9] tracking-[-0.03em] text-foreground mb-6">
          <span className="block text-[44px] md:text-[64px]">Your cosmos,</span>
          <em className="block text-[44px] md:text-[64px] font-instrument text-gold italic">
            composed.
          </em>
        </h1>
        <div className="divider-gold max-w-[80px] mx-auto mb-6" />
        <p className="font-body text-foreground/70 text-base md:text-[1.15rem] max-w-sm mx-auto leading-relaxed">
          Your birth chart, rendered as a piece of music only you will ever have.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStartFree}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-ui text-xs uppercase tracking-[0.22em] transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{ background: 'hsl(40 10% 96%)', color: 'hsl(240 6% 4%)' }}
          >
            Find your key — free
          </button>
          <a
            href="#samples"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-foreground/25 font-ui text-xs uppercase tracking-[0.22em] text-foreground hover:border-accent hover:text-accent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-center"
          >
            Hear a chart
          </a>
        </div>
        <p className="font-data text-[10px] uppercase tracking-[0.18em] text-foreground/35 mt-4">
          No account · No card · Your chart in 30 seconds
        </p>
      </motion.header>

      {/* ── One sample ── */}
      <SamplesSection />

      {/* ── The offer ── */}
      <OfferCard />

      {/* ── About ── */}
      <motion.section className="glass-card p-6 mb-10" {...fadeUp(0.1)}>
        <p className="font-instrument text-base text-foreground/90 leading-relaxed italic mb-3">
          Your birth carried a sound worth hearing.
        </p>
        <p className="font-body text-sm text-foreground/70 leading-relaxed">
          One composer-astrologer's system: every aspect mapped to its interval, every planet given an
          instrument. Composed from your exact placements — never a template.
        </p>
      </motion.section>

      {/* ── Already paid? ── */}
      <motion.p
        className="text-center text-[11px] text-muted-foreground/50 tracking-wide mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Already purchased?{' '}
        <button
          onClick={onUnlock}
          className="underline underline-offset-2 hover:text-foreground/70 transition-colors"
        >
          Access your reading
        </button>
      </motion.p>

      {/* ── Footer ── */}
      <motion.footer
        className="text-center space-y-1 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <p className="font-data text-[9px] uppercase tracking-[0.25em] text-foreground/40">
          QUANTUMELODIES.COM · PART OF THE MOONTUNER SYSTEM
        </p>
      </motion.footer>

    </div>
  </motion.main>
);


// ─── Helper to read/write payment session ───────────────────────────────────
function hasPaidSession(): boolean {
  if (typeof window === 'undefined') return false;
  try { return sessionStorage.getItem(PAID_SESSION_KEY) === 'true'; } catch { return false; }
}

function setPaidSession(): void {
  try { sessionStorage.setItem(PAID_SESSION_KEY, 'true'); } catch { return; }
}

type AppState = "paywall" | "input" | "generating" | "result";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const cosmicCtx = useCosmicReadingContext();
  const {
    audioSource: persistedAudioSource,
    audioUrl: persistedAudioUrl,
    setReadingData,
  } = cosmicCtx;

  // Determine initial state: unlock on ?paid=true redirect, session key, or existing reading
  const [appState, setAppState] = useState<AppState>(() => {
    const returnedFromCheckout = searchParams.get('paid') === 'true';
    if (returnedFromCheckout) {
      setPaidSession();
      return cosmicCtx.reading ? "result" : "input";
    }
    if (hasPaidSession() || cosmicCtx.reading) {
      return cosmicCtx.reading ? "result" : "input";
    }
    return "paywall";
  });

  const handleUnlock = () => {
    setPaidSession();
    setAppState("input");
  };

  const {
    loading,
    error,
    reading: hookReading,
    audioUrl: hookAudioUrl,
    audioSource: hookAudioSource,
    previewLoading,
    progress,
    stage,
    generateReading,
    reset: hookReset,
  } = useCosmicReading();

  const reading = cosmicCtx.reading || hookReading;
  const audioUrl = persistedAudioUrl || hookAudioUrl || hookReading?.audioUrl || null;
  const audioSource = persistedAudioSource || cosmicCtx.reading?.audioSource || hookAudioSource;
  // Safety net: if we're in "result" state but have no reading (race condition
  // or corrupted session data), automatically fall back to the input form.
  useEffect(() => {
    if (appState === "result" && !reading) {
      setAppState("input");
    }
  }, [appState, reading]);

  useEffect(() => {
    if (!hookReading || !hookAudioUrl) return;

    const nextAudioSource = hookAudioSource ?? 'procedural';
    if (persistedAudioUrl === hookAudioUrl && persistedAudioSource === nextAudioSource) {
      return;
    }

    setReadingData({
      ...hookReading,
      audioUrl: hookAudioUrl,
      audioSource: nextAudioSource,
    }, hookAudioUrl, nextAudioSource);
  }, [hookAudioSource, hookAudioUrl, hookReading, persistedAudioSource, persistedAudioUrl, setReadingData]);

  const handleFormSubmit = async (data: BirthData) => {
    setAppState("generating");
    try {
      const result = await generateReading(data);
      if (result) {
        // Persist the chart immediately; audio state is updated via context as it arrives.
        setReadingData(result, null, null);
      }
      setAppState("result");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate your cosmic reading";
      toast({ title: "Error", description: message, variant: "destructive" });
      setAppState("input");
    }
  };

  const handleGenerationComplete = () => {
    if (!error) setAppState("result");
  };

  const handleBack = () => {
    hookReset();
    cosmicCtx.clearReading();
    setAppState("input");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <title>Astro-Harmonics: Your Cosmos Composed</title>
      <meta
        name="description"
        content="Astro-Harmonics translates your birth chart into a piece of music only you will ever have. Every planet voiced. Every aspect rendered as frequency."
      />

      <CosmicBackground />

      <AnimatePresence mode="wait">
        {appState === "paywall" && (
          <PaywallView key="paywall" onUnlock={handleUnlock} />
        )}

        {appState === "input" && (
          <motion.main
            key="input"
            className="relative z-10 min-h-screen flex flex-col items-center px-6 pt-10 pb-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {/* Hero */}
            <motion.div
              className="text-center mb-10 max-w-2xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="label-micro mb-6">Astro · Harmonic · Natal</p>
              <h1 className="font-display font-light leading-[0.92] tracking-[-0.04em] text-foreground">
                <span className="block text-[56px] md:text-[88px]">Your chart,</span>
                <span className="block text-[56px] md:text-[88px] italic text-accent">composed.</span>
              </h1>
              <p className="font-sans text-foreground/60 text-base md:text-lg mt-6 max-w-md mx-auto leading-relaxed">
                A natal reading translated, note by note, into your own cosmic symphony.
              </p>
            </motion.div>

            {/* Wheel */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              <ZodiacWheel />
            </motion.div>

            {/* Form */}
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <BirthDataForm onSubmit={handleFormSubmit} isLoading={loading} />
            </motion.div>

            <motion.p
              className="mt-12 label-micro text-foreground/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Natal chart · Composition · Resonance
            </motion.p>
          </motion.main>
        )}

        {appState === "generating" && (
          <GeneratingState
            key="generating"
            stage={stage === "idle" || stage === "complete" ? "calculating" : stage}
            progress={progress}
            onComplete={handleGenerationComplete}
          />
        )}

        {appState === "result" && reading && (
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
              previewLoading={previewLoading && !audioUrl}
              onMusicReady={(url, source) => setReadingData({
                ...reading,
                audioUrl: url,
                audioSource: source,
              }, url, source)}
              onBack={handleBack}
              onExplore={() => navigate("/explore")}
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
  audioUrl?: string | null;
  audioSource?: "elevenlabs" | "procedural" | "tone" | null;
  reading: import("@/types/astrology").CosmicReading;
  previewLoading: boolean;
  onMusicReady: (url: string, source: "elevenlabs" | "tone") => void;
  onBack: () => void;
  onExplore: () => void;
}

const ResultsView = ({
  name,
  chartData,
  musicalMode,
  audioUrl,
  audioSource,
  reading,
  previewLoading,
  onMusicReady,
  onBack,
  onExplore,
}: ResultsViewProps) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(audioUrl ?? null);
  const [localAudioSource, setLocalAudioSource] = useState<"elevenlabs" | "procedural" | "tone" | null>(audioSource ?? null);
  const [localMusicLoading, setLocalMusicLoading] = useState(false);
  const [preparedPdf, setPreparedPdf] = useState<{ url: string; filename: string } | null>(null);
  const [preparedAudio, setPreparedAudio] = useState<{ url: string; filename: string } | null>(null);

  const activeAudioUrl = localAudioUrl || audioUrl || null;
  const activeAudioSource = localAudioSource || audioSource || null;
  const filenameBase = useMemo(
    () => (name.trim() ? name.trim().replace(/\s+/g, "-").toLowerCase() : "quantumelodic"),
    [name],
  );
  const musicFilename = `${filenameBase}-cosmic-composition.mp3`;
  const reportFilename = `${filenameBase}-natal-harmonic.pdf`;

  useEffect(() => {
    setLocalAudioUrl(audioUrl ?? null);
    setLocalAudioSource(audioSource ?? null);
  }, [audioSource, audioUrl]);

  useEffect(() => () => {
    if (preparedPdf?.url.startsWith("blob:")) URL.revokeObjectURL(preparedPdf.url);
  }, [preparedPdf]);

  useEffect(() => () => {
    if (preparedAudio?.url.startsWith("blob:") && preparedAudio.url !== activeAudioUrl) {
      URL.revokeObjectURL(preparedAudio.url);
    }
  }, [activeAudioUrl, preparedAudio]);

  // QuantumMelodic canonicals (qm_planets, qm_signs, qm_aspects, qm_houses)
  const { dataReady: qmReady, buildReading } = useQuantumMelodicData();
  const qmReading = useMemo(
    () => (qmReady ? buildReading(chartData.planets) : null),
    [qmReady, buildReading, chartData.planets],
  );

  useEffect(() => {
    if (!activeAudioUrl) return;
    setAudioError(false);

    const audio = new Audio();
    // Only set crossOrigin for non-blob URLs to avoid CORS issues with blob URLs
    if (!activeAudioUrl.startsWith("blob:")) {
      audio.crossOrigin = "anonymous";
    }
    audio.preload = "metadata";
    audio.src = activeAudioUrl;

    audioRef.current = audio;
    setAudioEl(audio);

    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onErr = () => {
      console.warn("Audio load error for URL:", activeAudioUrl);
      setAudioError(true);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
      audioRef.current = null;
      setAudioEl(null);
      setIsPlaying(false);
    };
  }, [activeAudioUrl]);

  const togglePlayPause = async () => {
    if (!audioRef.current || audioError) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn("Playback error:", err);
      setIsPlaying(false);
    }
  };

  const formatTime = (t: number) =>
    `${Math.floor(t / 60)}:${Math.floor(t % 60)
      .toString()
      .padStart(2, "0")}`;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleDownloadChart = () => {
    setIsDownloading("chart");
    try {
      // Strip characters that are unsafe in filenames (slashes, colons, etc.)
      const safeName = (reading?.birthData.name ?? 'chart')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .replace(/^-+|-+$/g, '') || 'natal-chart';
      downloadNatalChartSvg(
        reading!.chartData,
        reading!.birthData,
        `${safeName}-natal-chart.svg`,
      );
    } catch (e) {
      console.error(e);
      toast({ title: "Chart download failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (preparedPdf) {
      triggerFileDownload(preparedPdf.url, preparedPdf.filename);
      return;
    }
    if (!qmReading) {
      toast({ title: "Report is still loading", description: "The harmonic dataset is still preparing. Try again in a moment." });
      return;
    }
    setIsDownloading("pdf");
    setShowFullReport(true);
    // Wait two frames so the report mounts before capturing
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      // Primary: jsPDF's built-in save() — most reliable across browsers.
      await downloadNatalHarmonicPdf(reportFilename);
      // Also prepare a blob URL so the "PDF Ready" fallback link stays available.
      try {
        const url = await createNatalHarmonicPdfUrl();
        setPreparedPdf((current) => {
          if (current?.url.startsWith("blob:")) URL.revokeObjectURL(current.url);
          return { url, filename: reportFilename };
        });
      } catch {/* non-fatal: download already triggered */}
      toast({ title: "Report downloaded", description: "Check your downloads folder." });
    } catch (e) {
      console.error(e);
      toast({ title: "Report download failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsDownloading(null);
    }
  };

  const handleGenerateMusic = async () => {
    setLocalMusicLoading(true);
    setAudioError(false);
    setPreparedAudio(null);
    try {
      const result = await generateChartMusic(
        chartData.sunSign,
        chartData.moonSign,
        chartData.ascendant,
        name || "Unknown",
        chartData.planets,
      );
      setLocalAudioUrl((current) => {
        if (current && current !== result.url && current.startsWith("blob:")) URL.revokeObjectURL(current);
        return result.url;
      });
      setLocalAudioSource(result.source);
      onMusicReady(result.url, result.source);
      toast({ title: "Song ready", description: "Your generated composition can now be played or downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Music generation failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setLocalMusicLoading(false);
    }
  };

  const handleDownloadMusic = async () => {
    if (preparedAudio) {
      triggerFileDownload(preparedAudio.url, preparedAudio.filename);
      return;
    }
    if (!activeAudioUrl) {
      await handleGenerateMusic();
      return;
    }
    setIsDownloading("music");
    try {
      const url = await createDownloadableAudioUrl(activeAudioUrl);
      setPreparedAudio((current) => {
        if (current?.url.startsWith("blob:") && current.url !== activeAudioUrl) URL.revokeObjectURL(current.url);
        return { url, filename: musicFilename };
      });
      triggerFileDownload(url, musicFilename);
      toast({ title: "Song ready", description: "If it did not download automatically, use the MP3 ready link below." });
    } catch (e) {
      console.error(e);
      toast({ title: "Song download failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsDownloading(null);
    }
  };

  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareText =
    "My natal chart, composed — note by note. Discover your Quantumelodic Harmonic Analysis at MoonTuner.";
  const shareUrl = "https://quantumelodic.lovable.app";

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "MoonTuner — Quantumelodic Harmonic Analysis", text: shareText, url: shareUrl });
      } else {
        setShowShareMenu((prev) => !prev);
      }
    } catch {
      return;
    }
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    );
    setShowShareMenu(false);
  };
  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };
  const shareViaEmail = () => {
    window.open(
      `mailto:?subject=${encodeURIComponent("My Quantumelodic Harmonic Analysis")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`,
      "_blank",
    );
    setShowShareMenu(false);
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(shareText + "\n" + shareUrl);
    setIsDownloading("share-copied");
    setTimeout(() => setIsDownloading(null), 2000);
    setShowShareMenu(false);
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
      <motion.div className="text-center mb-4" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground leading-tight">{name}</h2>
        <p className="text-xs tracking-[0.3em] text-primary/70 uppercase mt-1.5">
          {chartData.sunSign} ☉ · {chartData.moonSign} ☽ · {musicalMode}
        </p>
        {chartData.source === "approximate" && (
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
        className="w-full mb-6 py-3.5 rounded-xl border border-accent/40 text-accent font-display font-medium tracking-wider text-sm uppercase transition-all duration-300 hover:bg-accent/8 hover:border-accent/60"
        onClick={onExplore}
        whileHover={{ scale: 1.01, boxShadow: "0 0 20px hsl(var(--accent) / 0.2)" }}
        whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Explore interactive chart
      </motion.button>

      {/* Primary downloads */}
      <motion.div
        className="mb-6 grid grid-cols-3 gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <button
          onClick={handleDownloadChart}
          disabled={!!isDownloading && isDownloading !== "share-copied"}
          className="py-2.5 rounded-xl border border-primary/25 text-primary/80 text-[10px] tracking-widest uppercase hover:bg-primary/8 hover:border-primary/50 transition-all disabled:opacity-40"
        >
          {isDownloading === "chart" ? "Saving…" : "Chart PNG"}
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={(!qmReading && !qmReady) || (!!isDownloading && isDownloading !== "share-copied")}
          className="py-2.5 rounded-xl border border-accent/25 text-accent/80 text-[10px] tracking-widest uppercase hover:bg-accent/8 hover:border-accent/50 transition-all disabled:opacity-40"
        >
          {isDownloading === "pdf" ? "Saving…" : preparedPdf ? "PDF Ready" : "Report PDF"}
        </button>
        <button
          onClick={activeAudioUrl ? handleDownloadMusic : handleGenerateMusic}
          disabled={previewLoading || localMusicLoading || (!!isDownloading && isDownloading !== "share-copied")}
          className="py-2.5 rounded-xl border border-highlight/25 text-highlight/80 text-[10px] tracking-widest uppercase hover:bg-highlight/8 hover:border-highlight/50 transition-all disabled:opacity-40"
        >
          {previewLoading || localMusicLoading || isDownloading === "music" ? "Working…" : preparedAudio ? "MP3 Ready" : activeAudioUrl ? "Song MP3" : "Make Song"}
        </button>
      </motion.div>

      {(preparedPdf || preparedAudio) && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {preparedPdf && (
            <a
              href={preparedPdf.url}
              download={preparedPdf.filename}
              className="block text-center py-2.5 rounded-xl border border-accent/35 text-accent text-[10px] tracking-widest uppercase hover:bg-accent/8 transition-all"
            >
              Download prepared PDF
            </a>
          )}
          {preparedAudio && (
            <a
              href={preparedAudio.url}
              download={preparedAudio.filename}
              className="block text-center py-2.5 rounded-xl border border-highlight/35 text-highlight text-[10px] tracking-widest uppercase hover:bg-highlight/8 transition-all"
            >
              Download prepared MP3
            </a>
          )}
        </div>
      )}

      {/* Planet Details Table */}
      <div className="mb-6">
        <PlanetDetailsTable planets={chartData.planets} />
      </div>

      {/* Song status — composing indicator while ElevenLabs generates */}
      {(previewLoading || localMusicLoading) && !activeAudioUrl && (
        <motion.div
          className="mb-6 rounded-2xl border border-primary/15 bg-card/50 backdrop-blur-sm p-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          <p className="text-sm text-muted-foreground">Composing your cosmic symphony…</p>
        </motion.div>
      )}

      {/* Audio Visualizer */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="relative w-full h-36 rounded-2xl overflow-hidden mb-3"
          style={{ border: "1px solid hsl(var(--border))" }}
        >
          <CosmicWaveform
            audioElement={audioEl}
            idleIntensity={isPlaying ? 0.85 : 0.28}
            palette={paletteFromSign(chartData.sunSign)}
          />
          {activeAudioUrl && !audioError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md"
                style={{
                  background: "hsl(var(--background) / 0.5)",
                  border: "1px solid hsl(var(--accent) / 0.4)",
                  boxShadow: "0 0 20px hsl(var(--accent) / 0.15)",
                }}
                whileHover={{ scale: 1.06, boxShadow: "0 0 30px hsl(var(--accent) / 0.35)" }}
                whileTap={{ scale: 0.94 }}
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-accent ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </motion.button>
            </div>
          )}
          {audioError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[10px] text-destructive/60 tracking-wider">Audio unavailable</p>
            </div>
          )}
        </div>

        {activeAudioUrl ? (
          <>
            {(activeAudioSource === "procedural" || activeAudioSource === "tone") && (
              <p className="text-[10px] text-muted-foreground/40 tracking-widest text-center mb-2 uppercase">
                Deterministic chart composition
              </p>
            )}
            <div className="w-full max-w-xs mx-auto mb-2">
              <div
                className="h-0.5 rounded-full overflow-hidden cursor-pointer"
                style={{ background: "hsl(255 25% 18%)" }}
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
                    background: "hsl(var(--accent))",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
              </div>
            </div>

            <audio
              className="mt-3 w-full"
              controls
              preload="metadata"
              src={activeAudioUrl}
            />

            <div className="flex items-center justify-center gap-8">
              <button
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10);
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              <button
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10);
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground/30 italic text-center">
            {previewLoading || localMusicLoading ? "Preparing your audio preview…" : "Audio unavailable — use Make Song above"}
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
          disabled={!!isDownloading && isDownloading !== "share-copied"}
          className="py-2.5 rounded-xl border border-primary/25 text-primary/80 text-[10px] tracking-widest uppercase hover:bg-primary/8 hover:border-primary/50 transition-all disabled:opacity-40"
        >
          {isDownloading === "chart" ? "…" : "⬇ Chart"}
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={(!qmReading && !qmReady) || (!!isDownloading && isDownloading !== "share-copied")}
          className="py-2.5 rounded-xl border border-accent/25 text-accent/80 text-[10px] tracking-widest uppercase hover:bg-accent/8 hover:border-accent/50 transition-all disabled:opacity-40"
        >
          {isDownloading === "pdf" ? "…" : preparedPdf ? "PDF Ready" : "⬇ Report"}
        </button>
        <button
          onClick={activeAudioUrl ? handleDownloadMusic : handleGenerateMusic}
          disabled={previewLoading || localMusicLoading || (!!isDownloading && isDownloading !== "share-copied")}
          className="py-2.5 rounded-xl border border-highlight/25 text-highlight/80 text-[10px] tracking-widest uppercase hover:bg-highlight/8 hover:border-highlight/50 transition-all disabled:opacity-40"
        >
          {previewLoading || localMusicLoading || isDownloading === "music" ? "…" : preparedAudio ? "MP3 Ready" : activeAudioUrl ? "⬇ Song" : "Make Song"}
        </button>
      </motion.div>

      {/* Share */}
      <div className="relative mt-3">
        <motion.button
          className="w-full py-3 rounded-xl border border-foreground/12 text-foreground/50 text-xs tracking-widest uppercase hover:border-foreground/25 hover:text-foreground/70 transition-all"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.998 }}
          onClick={handleShare}
        >
          {isDownloading === "share-copied" ? "✓ Link Copied" : "↑ Share Your Harmonic Analysis"}
        </motion.button>

        {/* Desktop share menu fallback */}
        <AnimatePresence>
          {showShareMenu && (
            <motion.div
              className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl p-2 grid grid-cols-4 gap-1 z-50"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={shareToTwitter}
                className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-base">𝕏</span>
                <span className="text-[9px] text-muted-foreground">Twitter</span>
              </button>
              <button
                onClick={shareToFacebook}
                className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-base">f</span>
                <span className="text-[9px] text-muted-foreground">Facebook</span>
              </button>
              <button
                onClick={shareViaEmail}
                className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-base">✉</span>
                <span className="text-[9px] text-muted-foreground">Email</span>
              </button>
              <button
                onClick={copyLink}
                className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-base">⎘</span>
                <span className="text-[9px] text-muted-foreground">Copy</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Astro-Harmonic Natal Report (powered by QM canonicals) */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          onClick={() => setShowFullReport((v) => !v)}
          disabled={!qmReading}
          className="w-full py-3 rounded-xl border border-primary/25 text-primary/80 text-xs tracking-widest uppercase hover:bg-primary/8 hover:border-primary/50 transition-all disabled:opacity-40"
        >
          {!qmReady
            ? "Loading harmonic dataset…"
            : showFullReport
              ? "▲ Hide Full Astro-Harmonic Report"
              : "▼ View Full Astro-Harmonic Report"}
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={(!qmReading && !qmReady) || (!!isDownloading && isDownloading !== "share-copied")}
          className="w-full py-3 rounded-xl border border-accent/25 text-accent/80 text-xs tracking-widest uppercase hover:bg-accent/8 hover:border-accent/50 transition-all disabled:opacity-40"
        >
          {isDownloading === "pdf" ? "Creating PDF…" : preparedPdf ? "Download Prepared PDF" : "Download Full Report PDF"}
        </button>
        {qmReading && (
          <ReportNarrationButton
            label={`${reading.birthData.name || "Natal"}-narration`}
            getText={() => {
              const who = reading.birthData.name || "this cosmic traveler";
              const sun = chartData.sunSign;
              const moon = chartData.moonSign;
              const asc = chartData.ascendant;
              const el = qmReading.dominantElement?.toLowerCase() || "elemental";
              const mod = qmReading.dominantModality?.toLowerCase() || "rhythmic";
              const key = qmReading.overallKey || "its own key";
              const tempo = qmReading.overallTempo || 90;
              return [
                `A brief harmonic summary for ${who}.`,
                `Your chart unfolds like a living composition. The Sun in ${sun} establishes the key and character of the entire piece, while the Moon in ${moon} provides the emotional undercurrent that colors every phrase. The Ascendant in ${asc} sets the opening tone — the first impression a listener receives.`,
                `With a dominant ${el} element and a ${mod} rhythmic signature, your symphony resolves around ${key} at roughly ${tempo} beats per minute.`,
                `Every aspect woven through this fabric is a moment of dialogue between voices — sometimes consonant, sometimes deliberately tense, always unmistakably yours. This is the music of your cosmos.`,
              ].join(" ");
            }}
          />
        )}
      </div>

      {showFullReport && qmReading && (
        <div ref={reportRef} className="mt-6 rounded-2xl overflow-hidden">
          <NatalHarmonicReport
            birthData={reading.birthData}
            chartData={reading.chartData}
            reading={qmReading}
          />
        </div>
      )}

      {/* Off-screen mount for PDF export when the report isn't visible */}
      {!showFullReport && qmReading && (
        <div ref={reportRef} style={{ position: "fixed", left: -10000, top: 0, width: 580, pointerEvents: "none" }} aria-hidden>
          <NatalHarmonicReport
            birthData={reading.birthData}
            chartData={reading.chartData}
            reading={qmReading}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
