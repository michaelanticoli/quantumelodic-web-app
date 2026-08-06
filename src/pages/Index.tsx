import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, Pause } from "lucide-react";
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
import { useCosmicReadingContext } from "@/contexts/cosmicReadingStore";
import { useQuantumMelodicData } from "@/hooks/useQuantumMelodicData";
import { useToast } from "@/hooks/use-toast";
import { generateChartMusic } from "@/lib/cosmicReadings";
import debut1Asset from "@/assets/moontuner-debut-1.mp3.asset.json";
import debutLiteAsset from "@/assets/moontuner-debut-lite.mp3.asset.json";
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
  <motion.p
    className="mt-6 py-4 px-5 border border-border/40 font-body text-xs text-foreground/60 leading-relaxed"
    style={{ borderLeft: '2px solid hsl(168 95% 55%)' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.6 }}
  >
    If it doesn't feel like yours, say so within seven days — full refund, and you keep the report.
  </motion.p>
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

