import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { BirthData, ChartData, CosmicReading } from '@/types/astrology';
import { chartToScore } from '@/utils/chartToScore';
import { renderScoreToAudioUrl } from '@/utils/tonePlayer';

const ELEVENLABS_TIMEOUT_MS = 60_000; // 60 s — ElevenLabs generation can be slow
const TONE_RENDER_TIMEOUT_MS = 45_000; // 45 s — Tone offline render (Safari guard)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

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

      // Stage 3: Generate music — try ElevenLabs first, fall back to Tone.js
      setStage('generating');
      setProgress(60);

      let url: string | null = null;
      let finalAudioSource: 'elevenlabs' | 'tone' = 'tone';

      // ── Attempt 1: ElevenLabs via Supabase edge function ──────────────────
      if (SUPABASE_URL) {
        setProgress(65);
        const elAbort = new AbortController();
        const elTimer = setTimeout(() => elAbort.abort(), ELEVENLABS_TIMEOUT_MS);
        try {
          const musicResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-music`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: elAbort.signal,
            body: JSON.stringify({
              sunSign: chart.sunSign,
              moonSign: chart.moonSign,
              ascendant: chart.ascendant,
              name: birthData.name,
              planets: chart.planets,
            }),
          });
          clearTimeout(elTimer);
          setProgress(85);

          const contentType = musicResponse.headers.get('content-type') || '';
          if (musicResponse.ok && contentType.startsWith('audio/')) {
            const audioBlob = await musicResponse.blob();
            url = URL.createObjectURL(audioBlob);
            finalAudioSource = 'elevenlabs';
            setProgress(95);
            toast('✨ Cosmic composition ready', {
              description: 'Your personalised QuantumMelodic track — powered by ElevenLabs',
            });
          } else {
            // Not audio: parse reason and fall through to Tone.js
            const json = await musicResponse.json().catch(() => ({})) as Record<string, unknown>;
            console.warn('generate-music did not return audio, falling back to Tone.js:', json);
            toast('Generating synthesised audio', {
              description: 'ElevenLabs is unavailable right now — using local composition instead.',
            });
          }
        } catch (elErr) {
          clearTimeout(elTimer);
          if (elErr instanceof Error && elErr.name === 'AbortError') {
            console.warn('ElevenLabs request timed out after 60 s — falling back to Tone.js');
            toast('Generating synthesised audio', {
              description: 'ElevenLabs took too long — using local composition instead.',
            });
          } else {
            console.warn('ElevenLabs request failed — falling back to Tone.js:', elErr);
            toast('Generating synthesised audio', {
              description: 'ElevenLabs unavailable — using local composition instead.',
            });
          }
        }
      }

      // ── Attempt 2: Tone.js offline render (fallback) ───────────────────────
      if (!url) {
        setProgress(70);
        try {
          const score = chartToScore(chart);

          // Race against a hard timeout so Safari can't hang at 70% forever
          const renderPromise = renderScoreToAudioUrl(score);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Tone.js render timed out after ${TONE_RENDER_TIMEOUT_MS / 1000} s`)), TONE_RENDER_TIMEOUT_MS)
          );

          url = await Promise.race([renderPromise, timeoutPromise]);
          setProgress(90);
          toast('Cosmic composition ready', {
            description: `${score.mode} in ${score.rootNote} · ${score.bpm} BPM · ${score.tracks.length} planetary voices`,
          });
        } catch (audioErr) {
          console.warn('Tone.js render failed or timed out:', audioErr);
          setProgress(90);
          toast('Reading complete', {
            description: 'Audio could not be rendered in your browser — reading data is available.',
          });
        }
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
