import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { BirthData, ChartData, CosmicReading } from '@/types/astrology';
import { RequestTimeoutError } from '@/lib/fetchWithTimeout';
import { calculateChartData } from '@/lib/chartService';
import { chartToScore } from '@/utils/chartToScore';
import { renderPreviewScoreToAudioUrl } from '@/utils/tonePlayer';

const PREVIEW_RENDER_TIMEOUT_MS = 25_000;
const CHART_REQUEST_TIMEOUT_MS = 25_000;
// Overall hard limit: two serial chart attempts (Supabase + backend) plus headroom.
const GENERATION_HARD_TIMEOUT_MS = 60_000;
const PREVIEW_COMPOSITION_SECONDS = 18;

// Musical modes associated with each zodiac sign
const signModes: Record<string, string> = {
  'Aries': 'A Phrygian',
  'Taurus': 'F Ionian',
  'Gemini': 'G Mixolydian',
  'Cancer': 'A Aeolian',
  'Leo': 'D Lydian',
  'Virgo': 'D Dorian',
  'Libra': 'Bb Ionian',
  'Scorpio': 'B Locrian',
  'Sagittarius': 'E Mixolydian',
  'Capricorn': 'C Dorian',
  'Aquarius': 'F# Lydian',
  'Pisces': 'E Phrygian',
};

export function useCosmicReading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<CosmicReading | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'geocoding' | 'calculating' | 'generating' | 'complete'>('idle');
  const [audioSource, setAudioSource] = useState<'elevenlabs' | 'procedural' | 'tone' | null>(null);
  const previewRequestRef = useRef(0);
  const previewScheduleRef = useRef<number | null>(null);

  const clearScheduledPreview = useCallback(() => {
    if (previewScheduleRef.current !== null) {
      window.clearTimeout(previewScheduleRef.current);
      previewScheduleRef.current = null;
    }
  }, []);

  const generatePreviewAudio = useCallback(async (chart: ChartData, requestId: number) => {
    setPreviewLoading(true);
    setAudioSource('tone');

    try {
      const previewPromise = renderPreviewScoreToAudioUrl(
        chartToScore(chart),
        PREVIEW_COMPOSITION_SECONDS,
      ).then((url) => ({ kind: 'ready' as const, url }));
      const timeoutPromise = new Promise<{ kind: 'timeout' }>((resolve) =>
        setTimeout(() => resolve({ kind: 'timeout' }), PREVIEW_RENDER_TIMEOUT_MS)
      );

      const previewResult = await Promise.race([previewPromise, timeoutPromise]);

      if (previewResult.kind === 'timeout') {
        throw new Error(`Preview render timed out after ${PREVIEW_RENDER_TIMEOUT_MS / 1000} seconds`);
      }

      const { url } = previewResult;

      if (previewRequestRef.current !== requestId) {
        URL.revokeObjectURL(url);
        return;
      }

      setAudioUrl((current) => {
        if (current && current !== url) {
          URL.revokeObjectURL(current);
        }
        return url;
      });
      setReading((current) => current ? { ...current, audioUrl: url, audioSource: 'tone' } : current);
      toast('Cosmic preview ready', {
        description: 'Your deterministic chart composition is ready to play.',
      });
    } catch (audioErr) {
      if (previewRequestRef.current !== requestId) {
        return;
      }

      console.warn('Preview audio render failed or timed out:', audioErr);
      setAudioSource(null);
      setAudioUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      setReading((current) => current ? { ...current, audioUrl: undefined, audioSource: undefined } : current);
    } finally {
      if (previewRequestRef.current === requestId) {
        setPreviewLoading(false);
      }
    }
  }, []);

  const schedulePreviewAudio = useCallback((chart: ChartData, requestId: number) => {
    clearScheduledPreview();
    setPreviewLoading(true);
    setAudioSource('tone');

    previewScheduleRef.current = window.setTimeout(() => {
      previewScheduleRef.current = null;

      if (previewRequestRef.current !== requestId) {
        setPreviewLoading(false);
        return;
      }

      void generatePreviewAudio(chart, requestId);
    }, 120);
  }, [clearScheduledPreview, generatePreviewAudio]);

  const generateReading = useCallback(async (birthData: BirthData) => {
    previewRequestRef.current += 1;
    clearScheduledPreview();
    setLoading(true);
    setError(null);
    setProgress(0);
    setPreviewLoading(false);
    setAudioSource(null);
    setAudioUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });

    try {
      // Stage 1: Visual progress smoothness
      setStage('geocoding');
      setProgress(5);
      await new Promise(r => setTimeout(r, 300));
      setProgress(15);

      // Stage 2: Calculate birth chart via edge function
      setStage('calculating');
      setProgress(25);

      const hardTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new RequestTimeoutError(GENERATION_HARD_TIMEOUT_MS, 'Chart generation timed out. Please check your internet connection and try again. If the problem persists, try a more specific location.')),
          GENERATION_HARD_TIMEOUT_MS,
        )
      );

      const chart: ChartData = await Promise.race([
        calculateChartData(birthData, CHART_REQUEST_TIMEOUT_MS),
        hardTimeoutPromise,
      ]);
      setChartData(chart);
      setProgress(50);

      // Stage 3: Finalize chart result, then generate audio in the background
      setStage('generating');
      setProgress(60);
      setProgress(70);

      const musicalMode = signModes[chart.sunSign] || 'D Dorian';

      const cosmicReading: CosmicReading = {
        birthData,
        chartData: chart,
        musicalMode,
        unlockStatus: 'unlocked',
        audioSource: undefined,
        audioUrl: undefined,
      };

      setReading(cosmicReading);
      setStage('complete');
      setProgress(100);

      const previewRequestId = previewRequestRef.current;

      // Render the deterministic Tone.js composition after the result screen is visible.
      schedulePreviewAudio(chart, previewRequestId);

      return cosmicReading;

    } catch (err) {
      const message = err instanceof RequestTimeoutError
        ? 'Chart generation took too long. Please try a more specific location or try again in a moment.'
        : err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Cosmic reading error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearScheduledPreview, schedulePreviewAudio]);

  const reset = useCallback(() => {
    clearScheduledPreview();
    setLoading(false);
    setError(null);
    setReading(null);
    setChartData(null);
    setPreviewLoading(false);
    setProgress(0);
    setStage('idle');
    setAudioSource(null);
    setAudioUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    previewRequestRef.current += 1;
  }, [clearScheduledPreview]);

  return {
    loading,
    error,
    reading,
    chartData,
    audioUrl,
    audioSource,
    previewLoading,
    progress,
    stage,
    generateReading,
    reset,
  };
}
