import type { CosmicReading, ChartData } from '@/types/astrology';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { detectKeyFromBlob, keyMatches, type DetectedKey } from '@/lib/keyDetect';

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
  /** Key the chart assigned to this composition (from the edge function). */
  assignedKey?: string;
  assignedMode?: string;
  assignedTempo?: number;
  /** Key measured from the returned audio, when detection succeeded. */
  detectedKey?: DetectedKey | null;
  /** True when the measured tonic/quality matches the assigned key. */
  keyVerified?: boolean;
  /** Number of regeneration attempts used to hit the assigned key. */
  attempts?: number;
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
  options: { signal?: AbortSignal; verifyKey?: boolean; maxAttempts?: number } = {},
): Promise<MusicGenerationResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Music generation service is not configured');
  }

  const verifyKey = options.verifyKey !== false;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 2);

  let lastResult: MusicGenerationResult | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

    const assignedKey = response.headers.get('X-Key') || undefined;
    const assignedMode = response.headers.get('X-Mode') || undefined;
    const tempoHeader = response.headers.get('X-Tempo');
    const assignedTempo = tempoHeader ? Number(tempoHeader) : undefined;

    let detectedKey: DetectedKey | null = null;
    let verified = true;
    if (verifyKey && assignedKey) {
      detectedKey = await detectKeyFromBlob(audioBlob);
      verified = detectedKey ? keyMatches(assignedKey, detectedKey) : true;
      console.log(
        `[music] attempt ${attempt}: assigned ${assignedKey} ${assignedMode ?? ''} @${assignedTempo ?? '?'}bpm — measured ${detectedKey?.label ?? 'n/a'} (${detectedKey ? detectedKey.confidence.toFixed(2) : '—'}) → ${verified ? 'match' : 'mismatch'}`,
      );
    }

    const result: MusicGenerationResult = {
      url: URL.createObjectURL(audioBlob),
      source: 'elevenlabs',
      assignedKey,
      assignedMode,
      assignedTempo,
      detectedKey,
      keyVerified: verified,
      attempts: attempt,
    };

    if (verified || attempt === maxAttempts) {
      if (lastResult) URL.revokeObjectURL(lastResult.url);
      return result;
    }

    // Off-key render — discard and try once more before accepting it.
    if (lastResult) URL.revokeObjectURL(lastResult.url);
    lastResult = result;
  }

  // Unreachable in practice; the loop always returns.
  return lastResult!;
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
