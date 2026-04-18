import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { BirthData, ChartData, CosmicReading } from '@/types/astrology';
import { chartToScore } from '@/utils/chartToScore';
import { renderPreviewScoreToAudioUrl } from '@/utils/tonePlayer';

const TONE_RENDER_TIMEOUT_MS = 45_000;

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
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'geocoding' | 'calculating' | 'generating' | 'complete'>('idle');
  const [audioSource, setAudioSource] = useState<'elevenlabs' | 'tone' | null>(null);

  const generateReading = useCallback(async (birthData: BirthData) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Stage 1: Visual progress smoothness
      setStage('geocoding');
      setProgress(5);
      await new Promise(r => setTimeout(r, 300));
      setProgress(15);

      // Stage 2: Calculate birth chart via edge function
      setStage('calculating');
      setProgress(25);

      const chartResponse = await fetch(`${SUPABASE_URL}/functions/v1/calculate-chart`, {
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

      // Stage 3: Generate preview audio locally
      setStage('generating');
      setProgress(60);

      let url: string | null = null;
      const finalAudioSource = 'tone' as const;

      setProgress(70);
      try {
        const score = chartToScore(chart);

        const renderPromise = renderPreviewScoreToAudioUrl(score);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Tone.js render timed out after ${TONE_RENDER_TIMEOUT_MS / 1000} s`)), TONE_RENDER_TIMEOUT_MS)
        );

        url = await Promise.race([renderPromise, timeoutPromise]);
        setProgress(90);
        toast('Cosmic preview ready', {
          description: `30-second preview · ${score.mode} in ${score.rootNote} · ${score.bpm} BPM`,
        });
      } catch (audioErr) {
        console.warn('Tone.js render failed or timed out:', audioErr);
        setProgress(90);
        toast('Reading complete', {
          description: 'Preview audio could not be rendered in your browser — chart data is available.',
        });
      }

      setAudioSource(finalAudioSource);
      setAudioUrl(url);
      setProgress(100);

      const musicalMode = signModes[chart.sunSign] || 'D Dorian';

      const cosmicReading: CosmicReading = {
        birthData,
        chartData: chart,
        audioUrl: url ?? undefined,
        musicalMode,
        audioSource: finalAudioSource,
        unlockStatus: 'preview',
      };

      setReading(cosmicReading);
      setStage('complete');

      return cosmicReading;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Cosmic reading error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setReading(null);
    setChartData(null);
    setProgress(0);
    setStage('idle');

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      // Note: setAudioUrl handled separately to avoid stale closure
    }
  }, [audioUrl]);

  return {
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
  };
}
