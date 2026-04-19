import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { BirthData, ChartData, CosmicReading } from '@/types/astrology';
import { generateProceduralAudio } from '@/utils/proceduralAudio';

const PREVIEW_RENDER_TIMEOUT_MS = 20_000;

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

  const generatePreviewAudio = useCallback(async (chart: ChartData, requestId: number) => {
    setPreviewLoading(true);
    setAudioSource('procedural');

    try {
      const previewPromise = generateProceduralAudio(chart);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Preview render timed out after ${PREVIEW_RENDER_TIMEOUT_MS / 1000} seconds`)), PREVIEW_RENDER_TIMEOUT_MS)
      );

      const url = await Promise.race([previewPromise, timeoutPromise]);

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
      setReading((current) => current ? { ...current, audioUrl: url, audioSource: 'procedural' } : current);
      toast('Cosmic preview ready', {
        description: 'Short procedural preview generated from your chart frequencies.',
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
      toast('Reading complete', {
        description: 'Preview audio could not be rendered in your browser — chart data is available.',
      });
    } finally {
      if (previewRequestRef.current === requestId) {
        setPreviewLoading(false);
      }
    }
  }, []);

  const generateReading = useCallback(async (birthData: BirthData) => {
    previewRequestRef.current += 1;
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

      const chartResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: birthData.date,
          time: birthData.time,
          location: birthData.location,
        }),
      });

      if (!chartResponse.ok) {
        const errorData = await chartResponse.json();
        throw new Error(errorData.error || 'Failed to calculate birth chart');
      }

      const chart: ChartData = await chartResponse.json();
      setChartData(chart);
      setProgress(50);

      // Stage 3: Finalize chart result, then generate preview audio in the background
      setStage('generating');
      setProgress(60);
      setProgress(70);

      const musicalMode = signModes[chart.sunSign] || 'D Dorian';

      const cosmicReading: CosmicReading = {
        birthData,
        chartData: chart,
        musicalMode,
        unlockStatus: 'preview',
      };

      setReading(cosmicReading);
      setStage('complete');
      setProgress(100);

      const previewRequestId = previewRequestRef.current;
      void generatePreviewAudio(chart, previewRequestId);

      return cosmicReading;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Cosmic reading error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [generatePreviewAudio]);

  const reset = useCallback(() => {
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
  }, []);

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
