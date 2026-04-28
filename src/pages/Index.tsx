import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Loader2, Music2 } from "lucide-react";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ZodiacWheel } from "@/components/ZodiacWheel";
import { AspectLegend } from "@/components/AspectLegend";
import { PlanetDetailsTable } from "@/components/PlanetDetailsTable";
import { BirthDataForm } from "@/components/BirthDataForm";
import { BottomNav } from "@/components/BottomNav";
import { GeneratingState } from "@/components/GeneratingState";
import { CosmicWaveform, paletteFromSign } from "@/components/CosmicWaveform";
import { useCosmicReading } from "@/hooks/useCosmicReading";
import { useCosmicReadingContext } from "@/contexts/CosmicReadingContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { downloadChartImage, downloadAudio, downloadPdfReport } from "@/utils/downloadHelpers";
import { ensureCosmicReadingRecord, fetchUnlockedMusic, refreshCosmicReadingAccess, startReadingCheckout } from "@/lib/cosmicReadings";
import { supabase } from "@/integrations/supabase/client";
import type { BirthData } from "@/types/astrology";

type AppState = "input" | "generating" | "result";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const cosmicCtx = useCosmicReadingContext();
  const { user, session } = useAuth();
  const {
    audioSource: persistedAudioSource,
    audioUrl: persistedAudioUrl,
    setReadingData,
    updateReading,
  } = cosmicCtx;

  const [appState, setAppState] = useState<AppState>(cosmicCtx.reading ? "result" : "input");

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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [refreshingAccess, setRefreshingAccess] = useState(false);

  // Song checkout OTP state (for purchasing the AI-generated song without a full account)
  const [showSongModal, setShowSongModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

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

  useEffect(() => {
    if (!session || !reading || reading.id) return;

    let cancelled = false;

    ensureCosmicReadingRecord(session, reading)
      .then((record) => {
        if (cancelled) return;
        updateReading({
          id: record.id,
          unlockStatus: record.unlockStatus,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("Unable to create reading record:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [session, reading, updateReading]);

  useEffect(() => {
    const readingId = searchParams.get("reading_id");
    const checkout = searchParams.get("checkout");

    if (!session || !reading?.id || readingId !== reading.id || checkout !== "success") {
      return;
    }

    let cancelled = false;
    setRefreshingAccess(true);

    refreshCosmicReadingAccess(reading.id)
      .then((data) => {
        if (cancelled || !data) return;
        if (data.unlock_status === "unlocked") {
          updateReading({ unlockStatus: "unlocked" });
          toast({
            title: "Purchase confirmed",
            description: "Your song and downloads are now ready.",
          });
          setSearchParams((current) => {
            current.delete("checkout");
            return current;
          }, { replace: true });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn("Unable to refresh reading access:", error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRefreshingAccess(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, reading?.id, searchParams, updateReading, toast, setSearchParams]);

  // Handle song purchase — if not signed in, show the OTP modal instead of redirecting to /auth
  const handleGetSong = async () => {
    if (!reading) return;

    if (!user || !session) {
      setShowSongModal(true);
      return;
    }

    setCheckoutLoading(true);
    try {
      const record = await ensureCosmicReadingRecord(session, reading);
      updateReading({
        id: record.id,
        unlockStatus: record.unlockStatus,
      });

      if (record.unlockStatus === "unlocked") {
        toast({ title: "Song already unlocked", description: "Your personalized song is ready." });
        return;
      }

      const data = await startReadingCheckout(session, record.id);
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout";
      toast({ title: "Checkout unavailable", description: message, variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Send OTP magic link — lets users sign in without creating a password account
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail) return;
    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: { emailRedirectTo: window.location.href },
      });
      if (error) throw error;
      setOtpSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to send link";
      toast({ title: "Email error", description: message, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRefreshUnlock = async () => {
    if (!reading?.id) return;
    setRefreshingAccess(true);
    try {
      const data = await refreshCosmicReadingAccess(reading.id);
      if (data?.unlock_status === "unlocked") {
        updateReading({ unlockStatus: "unlocked" });
        toast({ title: "Access refreshed", description: "Your premium reading is unlocked." });
      } else {
        toast({ title: "Still processing", description: "Payment confirmation has not arrived yet." });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh access";
      toast({ title: "Refresh failed", description: message, variant: "destructive" });
    } finally {
      setRefreshingAccess(false);
    }
  };

  const handleDownloadFullMusic = async () => {
    if (!reading || !session) {
      throw new Error("Please sign in to download your personalized song");
    }

    const filenameBase = reading.birthData.name.trim()
      ? reading.birthData.name.replace(/\s+/g, "-").toLowerCase()
      : "quantumelodic";
    const fullAudioUrl = await fetchUnlockedMusic(session, reading);
    try {
      await downloadAudio(
        fullAudioUrl,
        `${filenameBase}-full-composition.mp3`,
      );
    } finally {
      // Allow time for the browser to begin downloading before revoking the blob URL.
      setTimeout(() => URL.revokeObjectURL(fullAudioUrl), 10_000);
    }
  };

  const handleFormSubmit = async (data: BirthData) => {
    setAppState("generating");
    try {
      const result = await generateReading(data);
      if (result) {
        // Persist the chart immediately, but wait for a real preview blob before storing procedural audio state.
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
        {appState === "input" && (
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
                <span className="block text-4xl md:text-6xl text-gold-gradient">Astro-Harmonic</span>
                <span className="block text-4xl md:text-6xl text-foreground/85">Natal Analysis</span>
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
              transition={{ delay: 0.2, type: "spring", stiffness: 80, damping: 16 }}
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
              isUnlocked={true}
              songPurchased={reading.unlockStatus === "unlocked"}
              isSignedIn={Boolean(user && session)}
              checkoutLoading={checkoutLoading}
              refreshingAccess={refreshingAccess}
              showSongModal={showSongModal}
              otpEmail={otpEmail}
              otpSent={otpSent}
              otpLoading={otpLoading}
              onGetSong={handleGetSong}
              onSongModalClose={() => { setShowSongModal(false); setOtpSent(false); setOtpEmail(''); }}
              onOtpEmailChange={setOtpEmail}
              onOtpSubmit={handleSendOtp}
              onRefreshAccess={handleRefreshUnlock}
              onDownloadMusic={handleDownloadFullMusic}
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
  isUnlocked: boolean;
  /** Whether the user has purchased the AI-generated song */
  songPurchased: boolean;
  /** Whether the user is currently signed in */
  isSignedIn: boolean;
  checkoutLoading: boolean;
  refreshingAccess: boolean;
  showSongModal: boolean;
  otpEmail: string;
  otpSent: boolean;
  otpLoading: boolean;
  onGetSong: () => Promise<void>;
  onSongModalClose: () => void;
  onOtpEmailChange: (email: string) => void;
  onOtpSubmit: (e: React.FormEvent) => Promise<void>;
  onRefreshAccess: () => Promise<void>;
  onDownloadMusic: () => Promise<void>;
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
  isUnlocked,
  songPurchased,
  isSignedIn,
  checkoutLoading,
  refreshingAccess,
  showSongModal,
  otpEmail,
  otpSent,
  otpLoading,
  onGetSong,
  onSongModalClose,
  onOtpEmailChange,
  onOtpSubmit,
  onRefreshAccess,
  onDownloadMusic,
  onBack,
  onExplore,
}: ResultsViewProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    if (!audioUrl) return;
    setAudioError(false);

    const audio = new Audio();
    // Only set crossOrigin for non-blob URLs to avoid CORS issues with blob URLs
    if (!audioUrl.startsWith("blob:")) {
      audio.crossOrigin = "anonymous";
    }
    audio.preload = "metadata";
    audio.src = audioUrl;

    audioRef.current = audio;
    setAudioEl(audio);

    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onErr = () => {
      console.warn("Audio load error for URL:", audioUrl);
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
  }, [audioUrl]);

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
  const audioCaption = audioSource === "tone"
    ? "Tone.js synthesis · planetary composition"
    : "Short preview · chart-derived frequencies";

  const handleDownloadChart = async () => {
    setIsDownloading("chart");
    try {
      await downloadChartImage("chart-wheel-container", `${name.replace(/\s+/g, "-").toLowerCase()}-chart.png`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading("pdf");
    try {
      await downloadPdfReport(reading, "chart-wheel-container");
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadMusic = async () => {
    if (!songPurchased) return;
    setIsDownloading("music");
    try {
      await onDownloadMusic();
    } finally {
      setIsDownloading(null);
    }
  };

  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareText =
    "✨ My natal chart has been translated into a living musical composition! Discover your Quantumelodic Harmonic Analysis at MoonTuner.";
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
        ✦ Explore Interactive Chart ✦
      </motion.button>

      {/* Planet Details Table */}
      <div className="mb-6">
        <PlanetDetailsTable planets={chartData.planets} />
      </div>

      {/* "Get your cosmic song" premium CTA — shown when song hasn't been purchased yet */}
      {!songPurchased && (
        <motion.div
          className="mb-6 rounded-2xl border border-primary/25 bg-card/70 backdrop-blur-sm overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Decorative top accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full border border-primary/30 bg-primary/10 p-2 shrink-0">
                <Music2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Your Cosmic Symphony Awaits</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Your full chart and report are yours — free, always. Want to hear your natal chart transformed into a personalized AI-generated musical composition?
                </p>

                {/* Song modal / OTP form */}
                <AnimatePresence>
                  {showSongModal && (
                    <motion.div
                      className="mt-4 rounded-xl border border-primary/15 bg-background/60 p-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {otpSent ? (
                        <div className="text-center py-2">
                          <p className="text-sm font-medium text-foreground">Check your email ✓</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            We sent a sign-in link to <span className="text-primary">{otpEmail}</span>. Click it to continue to checkout — no password needed.
                          </p>
                          <button
                            onClick={onSongModalClose}
                            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={(e) => void onOtpSubmit(e)}>
                          <p className="text-xs text-muted-foreground mb-3">
                            Enter your email to receive a secure sign-in link — no password or account creation required.
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              required
                              value={otpEmail}
                              onChange={(e) => onOtpEmailChange(e.target.value)}
                              placeholder="your@email.com"
                              className="flex-1 min-w-0 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
                            />
                            <button
                              type="submit"
                              disabled={otpLoading || !otpEmail}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/20 border border-primary/40 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/30 transition-all disabled:opacity-50"
                            >
                              {otpLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Send link
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={onSongModalClose}
                            className="mt-2 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showSongModal && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => void onGetSong()}
                      disabled={checkoutLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-amber-500 px-4 py-3 text-sm font-medium tracking-wide text-primary-foreground disabled:opacity-60"
                    >
                      {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                      Get my AI-generated Song
                    </button>
                    {reading.id && isSignedIn && (
                      <button
                        onClick={() => void onRefreshAccess()}
                        disabled={refreshingAccess}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground disabled:opacity-60"
                      >
                        {refreshingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Refresh access
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
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
          style={{ border: "1px solid hsl(43 88% 58% / 0.14)" }}
        >
          <CosmicWaveform
            audioElement={audioEl}
            idleIntensity={isPlaying ? 0.85 : 0.28}
            palette={paletteFromSign(chartData.sunSign)}
          />
          {audioUrl && !audioError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md"
                style={{
                  background: "hsl(228 35% 6% / 0.5)",
                  border: "1px solid hsl(43 88% 58% / 0.3)",
                  boxShadow: "0 0 20px hsl(43 88% 58% / 0.15)",
                }}
                whileHover={{ scale: 1.08, boxShadow: "0 0 30px hsl(43 88% 58% / 0.35)" }}
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
          {audioError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[10px] text-destructive/60 tracking-wider">Audio unavailable</p>
            </div>
          )}
        </div>

        {audioUrl ? (
          <>
            {(audioSource === "procedural" || audioSource === "tone") && (
              <p className="text-[10px] text-muted-foreground/40 tracking-widest text-center mb-2 uppercase">
                {audioCaption}
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
                    background: "linear-gradient(90deg, hsl(43 88% 58%), hsl(292 70% 62%))",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
              </div>
            </div>

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
            {previewLoading ? "Preparing your audio preview…" : "Audio unavailable — explore your chart data above"}
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
          disabled={!!isDownloading && isDownloading !== "share-copied"}
          className="py-2.5 rounded-xl border border-accent/25 text-accent/80 text-[10px] tracking-widest uppercase hover:bg-accent/8 hover:border-accent/50 transition-all disabled:opacity-40"
        >
          {isDownloading === "pdf" ? "…" : "⬇ Report"}
        </button>
        {songPurchased && audioUrl ? (
          <button
            onClick={handleDownloadMusic}
            disabled={!!isDownloading && isDownloading !== "share-copied"}
            className="py-2.5 rounded-xl border border-highlight/25 text-highlight/80 text-[10px] tracking-widest uppercase hover:bg-highlight/8 hover:border-highlight/50 transition-all disabled:opacity-40"
          >
            {isDownloading === "music" ? "…" : "⬇ Song"}
          </button>
        ) : (
          <div />
        )}
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
    </div>
  );
};

export default Index;
