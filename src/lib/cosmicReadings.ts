import type { CosmicReading } from '@/types/astrology';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const MUSIC_TIMEOUT_MS = 60_000;

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
 * Generate music for a reading. Tries the ElevenLabs-backed `generate-music`
 * edge function first (full QM-enriched composition); on any failure falls back
 * to the local deterministic Tone.js render so the user always hears something.
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

    // Edge function returned a JSON error / unavailable flag — fall through to local
    console.warn('ElevenLabs music unavailable, falling back to Tone.js', response.status, contentType);
  } catch (err) {
    console.warn('ElevenLabs music request failed, falling back to Tone.js:', err);
  }

  // 2. Fallback: deterministic Tone.js composition
  const [{ chartToScore }, { renderPreviewScoreToAudioUrl }] = await Promise.all([
    import('@/utils/chartToScore'),
    import('@/utils/tonePlayer'),
  ]);

  const url = await renderPreviewScoreToAudioUrl(
    chartToScore({
      planets,
      sunSign,
      moonSign,
      ascendant,
      source: `local-tone:${name || 'unknown'}`,
    }),
    18,
  );
  return { url, source: 'tone' };
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
