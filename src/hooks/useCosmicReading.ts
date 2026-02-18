import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { BirthData, ChartData, CosmicReading } from '@/types/astrology';
import { generateProceduralAudio } from '@/utils/proceduralAudio';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  const [audioSource, setAudioSource] = useState<'elevenlabs' | 'procedural' | null>(null);

  const generateReading = useCallback(async (birthData: BirthData) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setAudioSource(null);

    try {
      // Stage 1: Geocoding (server-side)
      setStage('geocoding');
      setProgress(5);

      // Small delay for visual smoothness
      await new Promise(r => setTimeout(r, 400));
      setProgress(15);

      // Stage 2: Calculate birth chart
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
      setProgress(45);

      // Stage 3: Generate music
      setStage('generating');
      setProgress(55);

      let url: string | null = null;
      let source: 'elevenlabs' | 'procedural' | null = null;

      // Attempt ElevenLabs generation
      try {
        const musicResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-music`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sunSign: chart.sunSign,
            moonSign: chart.moonSign,
            ascendant: chart.ascendant,
            name: birthData.name,
          }),
        });

        setProgress(75);

        const contentType = musicResponse.headers.get('content-type') || '';

        if (musicResponse.ok && contentType.includes('audio/')) {
          const audioBlob = await musicResponse.blob();
          url = URL.createObjectURL(audioBlob);
          source = 'elevenlabs';
          setProgress(90);
        } else {
          // ElevenLabs unavailable — fall back to procedural
          const data = await musicResponse.json().catch(() => null);
          console.warn('ElevenLabs unavailable, using procedural fallback:', data?.error);
          setProgress(70);
        }
      } catch (musicErr) {
        console.warn('Music generation error, using procedural fallback:', musicErr);
        setProgress(70);
      }

      // Procedural fallback if ElevenLabs didn't produce audio
      if (!url) {
        try {
          setProgress(75);
          url = await generateProceduralAudio(chart);
          source = 'procedural';
          setProgress(90);
          toast('Cosmic tones generated', {
            description: 'Using procedural synthesis based on your planetary frequencies.',
          });
        } catch (procErr) {
          console.warn('Procedural audio also failed:', procErr);
          setProgress(90);
        }
      }

      if (url) {
        setAudioUrl(url);
        setAudioSource(source);
      }

      setProgress(100);

      // Get musical mode
      const musicalMode = signModes[chart.sunSign] || 'D Dorian';

      const cosmicReading: CosmicReading = {
        birthData,
        chartData: chart,
        audioUrl: url ?? undefined,
        musicalMode,
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
    setAudioSource(null);

    // Clean up audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
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
