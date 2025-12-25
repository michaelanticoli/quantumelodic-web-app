import { useState, useCallback } from 'react';
import type { BirthData, ChartData, CosmicReading } from '@/types/astrology';

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

// Geocoding now handled server-side in the edge function

export function useCosmicReading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<CosmicReading | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'geocoding' | 'calculating' | 'generating' | 'complete'>('idle');

  const generateReading = useCallback(async (birthData: BirthData) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setStage('geocoding');

    try {
      // Step 1 & 2: Calculate birth chart (geocoding handled server-side)
      setProgress(10);
      setStage('calculating');
      setProgress(30);
      
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

      // Step 3: Generate music
      setStage('generating');
      setProgress(60);

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

      if (!musicResponse.ok) {
        const contentType = musicResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await musicResponse.json();
          throw new Error(errorData.error || 'Failed to generate music');
        }
        throw new Error('Failed to generate music');
      }

      // Get audio blob and create URL
      const audioBlob = await musicResponse.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setProgress(100);

      // Get musical mode
      const musicalMode = signModes[chart.sunSign] || 'D Dorian';

      const cosmicReading: CosmicReading = {
        birthData,
        chartData: chart,
        audioUrl: url,
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
    progress,
    stage,
    generateReading,
    reset,
  };
}
