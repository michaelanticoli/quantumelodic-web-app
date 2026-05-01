import type { CosmicReading } from '@/types/astrology';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const MUSIC_TIMEOUT_MS = 120_000;

export async function ensureCosmicReadingRecord(_session: unknown, reading: CosmicReading) {
  return { id: reading.id ?? null, unlockStatus: 'unlocked' } as const;
}

export async function refreshCosmicReadingAccess(_readingId: string) {
  return null;
}

export interface MusicGenerationResult {
  url: string;
  source: 'elevenlabs' | 'tone';
}

/**
 * Generate music for a reading through the ElevenLabs-backed `generate-music`
 * edge function. This stays network-bound so generation never locks the UI with
 * a CPU-heavy local offline render.
 */
export async function generateChartMusic(
  sunSign: string,
  moonSign: string,
  ascendant: string,
  name: string,
  planets: Array<{ name: string; symbol: string; degree: number; sign: string; signNumber: number; isRetrograde: boolean }>,
  options: { signal?: AbortSignal } = {},
): Promise<MusicGenerationResult> {
  // 1. Try ElevenLabs via edge function
  try {
    const response = await fetchWithTimeout(
      `${SUPABASE_URL}/functions/v1/generate-music`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ sunSign, moonSign, ascendant, name, planets }),
        signal: options.signal,
      },
      MUSIC_TIMEOUT_MS,
    );

    const contentType = response.headers.get('Content-Type') || '';

    if (response.ok && contentType.startsWith('audio/')) {
      const blob = await response.blob();
      return { url: URL.createObjectURL(blob), source: 'elevenlabs' };
    }

    let message = `Music generation failed with status ${response.status}`;
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null) as { error?: string } | null;
      message = data?.error || message;
    }
    throw new Error(message);
  } catch (err) {
    console.warn('ElevenLabs music request failed:', err);
    throw err;
  }
}

// Legacy alias retained for any older callers
export async function generateFreeMusic(
  sunSign: string,
  moonSign: string,
  ascendant: string,
  name: string,
  planets: Array<{ name: string; symbol: string; degree: number; sign: string; signNumber: number; isRetrograde: boolean }>,
): Promise<string> {
  const result = await generateChartMusic(sunSign, moonSign, ascendant, name, planets);
  return result.url;
}

export async function fetchUnlockedMusic(_session: unknown, reading: CosmicReading): Promise<string> {
  if (!reading.chartData) throw new Error('Reading is missing chart data');
  const result = await generateChartMusic(
    reading.chartData.sunSign,
    reading.chartData.moonSign,
    reading.chartData.ascendant,
    reading.birthData.name || 'Unknown',
    reading.chartData.planets,
  );
  return result.url;
}
