import type { CosmicReading, ChartData } from '@/types/astrology';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const MUSIC_GENERATION_TIMEOUT_MS = 180_000;

export async function ensureCosmicReadingRecord(_session: unknown, reading: CosmicReading) {
  return { id: reading.id ?? null, unlockStatus: 'unlocked' } as const;
}

export async function refreshCosmicReadingAccess(_readingId: string) {
  return null;
}

export interface MusicGenerationResult {
  url: string;
  source: 'elevenlabs';
}

/**
 * Generate the chart's finished MP3 through the ElevenLabs music edge function.
 * Tone.js remains available elsewhere for tiny interactive previews, but full songs
 * must come back as ElevenLabs-rendered tracks.
 */
export async function generateChartMusic(
  sunSign: string,
  moonSign: string,
  ascendant: string,
  name: string,
  planets: Array<{ name: string; symbol: string; degree: number; sign: string; signNumber: number; isRetrograde: boolean }>,
  options: { signal?: AbortSignal } = {},
): Promise<MusicGenerationResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Music generation service is not configured');
  }

  const response = await fetchWithTimeout(`${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/generate-music`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ sunSign, moonSign, ascendant, name, planets }),
    signal: options.signal,
  }, MUSIC_GENERATION_TIMEOUT_MS);

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || contentType.includes('application/json')) {
    const errorData = contentType.includes('application/json')
      ? await response.json().catch(() => null) as { error?: string; unavailable?: boolean } | null
      : null;
    throw new Error(errorData?.error || 'ElevenLabs music generation failed');
  }

  const audioBlob = await response.blob();
  if (audioBlob.size === 0) {
    throw new Error('ElevenLabs returned an empty audio file');
  }

  return { url: URL.createObjectURL(audioBlob), source: 'elevenlabs' };
}

export async function generateFreeMusic(
  sunSign: string,
  moonSign: string,
  ascendant: string,
  name: string,
  planets: Array<{ name: string; symbol: string; degree: number; sign: string; signNumber: number; isRetrograde: boolean }>,
): Promise<string> {
  const r = await generateChartMusic(sunSign, moonSign, ascendant, name, planets);
  return r.url;
}

export async function fetchUnlockedMusic(_session: unknown, reading: CosmicReading): Promise<string> {
  if (!reading.chartData) throw new Error('Reading is missing chart data');
  const r = await generateChartMusic(
    reading.chartData.sunSign,
    reading.chartData.moonSign,
    reading.chartData.ascendant,
    reading.birthData.name || 'Unknown',
    reading.chartData.planets,
  );
  return r.url;
}
