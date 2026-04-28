import { supabase } from '@/integrations/supabase/client';
import type { CosmicReading } from '@/types/astrology';

function sanitizeErrorMessage(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  return message.replace(/\s+/g, ' ').trim().slice(0, 160) || fallback;
}

export async function ensureCosmicReadingRecord(_session: unknown, reading: CosmicReading) {
  // Full reading (chart, analytics, report, song) is free — always return unlocked.
  return { id: reading.id ?? null, unlockStatus: 'unlocked' } as const;
}

export async function refreshCosmicReadingAccess(_readingId: string) {
  return null;
}

/**
 * Generate the ElevenLabs AI song for a reading.
 * Music generation is free for all users — no authentication required.
 */
export async function generateFreeMusic(
  sunSign: string,
  moonSign: string,
  ascendant: string,
  name: string,
  planets: Array<{ name: string; symbol: string; degree: number; sign: string; signNumber: number; isRetrograde: boolean }>,
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-music`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ sunSign, moonSign, ascendant, name, planets }),
  });

  if (!response.ok) {
    let message = `Unable to generate song (status ${response.status})`;
    try {
      const json = await response.json() as { error?: string };
      if (json.error) message = sanitizeErrorMessage(json.error, message);
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('audio/')) {
    let message = 'Music generation is currently unavailable. Please try again later.';
    try {
      const json = await response.json() as { error?: string; unavailable?: boolean };
      if (json.error) message = sanitizeErrorMessage(json.error, message);
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// Keep legacy alias for any remaining callers; redirects to generateFreeMusic.
export async function fetchUnlockedMusic(_session: unknown, reading: CosmicReading): Promise<string> {
  if (!reading.chartData) throw new Error('Reading is missing chart data');
  return generateFreeMusic(
    reading.chartData.sunSign,
    reading.chartData.moonSign,
    reading.chartData.ascendant,
    reading.birthData.name || 'Unknown',
    reading.chartData.planets,
  );
}
