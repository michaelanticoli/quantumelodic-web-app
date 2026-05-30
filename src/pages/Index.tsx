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

// ─── Paywall constants ──────────────────────────────────────────────────────
// Update FOUNDING_CLAIMED manually as purchases arrive (or replace with an API call).
const FOUNDING_CLAIMED = 3;
const FOUNDING_TOTAL = 50;
// Replace with your live Stripe payment link. Add ?paid=true as the success redirect param.
const CHECKOUT_URL = 'https://buy.stripe.com/YOUR_LINK_HERE';
const PAID_SESSION_KEY = 'quantumelodic_paid';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
});

// ─── Paywall sub-components ─────────────────────────────────────────────────

const RefundGuarantee = () => (
  <motion.div
    className="flex items-start gap-3 mt-4 px-4 py-3 rounded-xl border border-accent/15 bg-accent/5"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
  >
    <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
    <p className="text-[11px] text-muted-foreground leading-relaxed">
      If the composition doesn't feel like yours, email me within 7 days. I'll refund you in full — and you keep the report.
      This work is meant to resonate. If it doesn't, you owe me nothing.
    </p>
  </motion.div>
);

const CtaButton = ({ delay = 0 }: { delay?: number }) => (
  <div>
    <motion.a
      href={CHECKOUT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-center py-4 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base tracking-wide hover:opacity-90 transition-opacity"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      Order your Astro-Harmonic Report — $47
    </motion.a>
    <RefundGuarantee />
  </div>
);

const DemoAudioPlayer = () => {
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
      className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-5"
      {...fadeUp(0.15)}
    >
      <div className="flex items-center gap-2 mb-3">
        <Music2 className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Sample composition
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Every chart sounds different. Below is an excerpt from a real Astro-Harmonic reading — same system,
        different birth data, different music.
      </p>

      {/* Replace /sample-composition.mp3 with your actual audio file in /public */}
      <audio
        ref={audioRef}
        src="/sample-composition.mp3"
        onEnded={() => setIsPlaying(false)}
        onError={() => { setAudioError(true); setIsPlaying(false); }}
        preload="none"
      />

      {audioError ? (
        <p className="text-xs text-muted-foreground/50 italic px-1">
          Audio sample not yet available.
        </p>
      ) : (
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border/50 hover:border-accent/40 transition-all group"
        >
          <span className="w-8 h-8 rounded-full border border-accent/40 flex items-center justify-center group-hover:border-accent transition-colors">
            {isPlaying
              ? <Pause className="w-3.5 h-3.5 text-accent" />
              : <Play className="w-3.5 h-3.5 text-accent ml-0.5" />}
          </span>
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {isPlaying ? 'Pause sample' : 'Play sample (2 min excerpt)'}
          </span>
        </button>
      )}
    </motion.div>
  );
};

const ReportPreviewSection = () => {
  const items = [
    { icon: Star, label: 'Planetary Orchestra', desc: 'Every planet voiced to its instrument and frequency — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.' },
    { icon: Music2, label: 'Your Musical Key & Mode', desc: 'Your Sun sign determines the tonic. Your chart shape determines the mode. No two people share the same harmonic signature.' },
    { icon: Sparkles, label: 'Aspect Intervals', desc: 'Every major aspect in your chart is translated into its musical interval — conjunctions, trines, squares, all rendered as frequency relationships.' },
    { icon: FileText, label: 'Narrated PDF Report', desc: 'A full written + narrated breakdown of every placement, read aloud in my cloned voice. Delivered as a downloadable PDF.' },
  ];

  return (
    <motion.section className="space-y-4" {...fadeUp(0.1)}>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-primary/70" />
        <h2 className="font-display text-lg font-semibold">What's in your report</h2>
      </div>
      <div className="space-y-3">
        {items.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="font-display font-medium text-sm">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-5">{desc}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

interface PaywallViewProps {
  onUnlock: () => void;
}

const PaywallView = ({ onUnlock }: PaywallViewProps) => {
  const claimedPct = Math.round((FOUNDING_CLAIMED / FOUNDING_TOTAL) * 100);
  return (
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
        <motion.header className="text-center mb-12 pt-8" {...fadeUp(0.05)}>
          <p className="text-[10px] tracking-[0.4em] text-muted-foreground/50 uppercase mb-5">
            Astro · Harmonic · Natal
          </p>
          <h1 className="font-display font-light leading-[0.92] tracking-[-0.03em] text-foreground mb-6">
            <span className="block text-[44px] md:text-[64px]">Your birth chart,</span>
            <span className="block text-[44px] md:text-[64px] italic text-accent">
              composed into a piece of music
            </span>
            <span className="block text-[44px] md:text-[64px]">only you will ever have.</span>
          </h1>
          <div className="divider-gold max-w-[120px] mx-auto mb-5" />
          <p className="font-sans text-foreground/60 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Every planet voiced. Every aspect rendered as frequency. A PDF report — narrated in my voice —
            built from your exact placements and nothing else.
          </p>
        </motion.header>

        {/* ── Founding Reading Block ── */}
        <motion.section className="glass-card p-6 mb-8 space-y-4" {...fadeUp(0.1)}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="font-display text-base font-semibold tracking-wide">Founding Readings</h2>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            The first {FOUNDING_TOTAL} Astro-Harmonic Reports are{' '}
            <span className="text-foreground font-semibold">$47</span>.
            After the {FOUNDING_TOTAL}th, the price becomes{' '}
            <span className="text-muted-foreground line-through">$97</span>.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You receive the same full reading either way. Founding pricing exists for the people willing to be early —
            the ones who help prove the work resonates.
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 uppercase tracking-widest">
              <span>{FOUNDING_CLAIMED} of {FOUNDING_TOTAL} claimed</span>
              <span>{FOUNDING_TOTAL - FOUNDING_CLAIMED} remaining</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${claimedPct}%` }}
                transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.section>

        {/* ── First CTA ── */}
        <motion.div className="mb-12" {...fadeUp(0.15)}>
          <CtaButton delay={0.15} />
        </motion.div>

        {/* ── Audio Sample ── */}
        <div className="mb-12">
          <DemoAudioPlayer />
        </div>

        {/* ── Credibility ── */}
        <motion.section className="glass-card p-6 mb-12" {...fadeUp(0.1)}>
          <h2 className="font-display text-base font-semibold tracking-wide mb-3">About this work</h2>
          <p className="text-sm text-foreground/75 leading-relaxed">
            I'm Michael — composer, astrologer, and the person who built every piece of this system. The
            Astro-Harmonic Report is years of work in music theory and chart interpretation, synthesized:
            every aspect translated to its musical interval, every planet given a voice and an instrument,
            every element rendered as frequency. The narration is read in my voice — cloned, so I can deliver
            thousands of readings without losing the human imprint. The composition is generated from your
            exact placements, never a template. What you receive is made by one person who believes your
            birth carried a sound worth hearing.
          </p>
        </motion.section>

        {/* ── Sample Report Preview ── */}
        <div className="mb-12">
          <ReportPreviewSection />
        </div>

        {/* ── Second CTA ── */}
        <motion.div className="mb-8" {...fadeUp(0.1)}>
          <CtaButton delay={0.1} />
        </motion.div>

        {/* ── Already paid? ── */}
        <motion.p
          className="text-center text-[11px] text-muted-foreground/50 tracking-wide mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Already purchased?{' '}
          <button
            onClick={onUnlock}
            className="underline underline-offset-2 hover:text-foreground/70 transition-colors"
          >
            Click here to access your reading
          </button>
        </motion.p>

        {/* ── Footer note ── */}
        <motion.p
          className="text-center text-[10px] text-muted-foreground/35 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          Delivered as a PDF within 24 hours · One-time purchase · No subscription
        </motion.p>

      </div>
    </motion.main>
  );
};

// ─── Helper to read/write payment session ───────────────────────────────────
function hasPaidSession(): boolean {
  if (typeof window === 'undefined') return false;
  try { return sessionStorage.getItem(PAID_SESSION_KEY) === 'true'; } catch { return false; }
}

function setPaidSession(): void {
  try { sessionStorage.setItem(PAID_SESSION_KEY, 'true'); } catch {}
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
      <title>Astro-Harmonic Natal Analysis — Your Cosmic Symphony</title>
      <meta
        name="description"
        content="Astro-Harmonic Natal Analysis transforms your birth chart into a unique musical composition. Discover your cosmic symphony."
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
