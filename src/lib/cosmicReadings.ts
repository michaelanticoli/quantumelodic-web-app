import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { CosmicReading } from '@/types/astrology';

function sanitizeErrorMessage(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  return message.replace(/\s+/g, ' ').trim().slice(0, 160) || fallback;
}

export async function ensureCosmicReadingRecord(_session: Session, reading: CosmicReading) {
  // Full reading (chart, analytics, report) is free — always return unlocked.
  // The only premium add-on is the AI-generated song.
  return { id: reading.id ?? null, unlockStatus: 'unlocked' } as const;
}

export async function refreshCosmicReadingAccess(_readingId: string) {
  return null;
}

export async function startReadingCheckout(session: Session, readingId: string) {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: { kind: 'reading_unlock', readingId },
  });

  if (error) {
    throw error;
  }

  return data as { url?: string };
}

export async function fetchUnlockedMusic(session: Session, reading: CosmicReading) {
  if (!reading.id) {
    throw new Error('Reading record is missing');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      readingId: reading.id,
      sunSign: reading.chartData.sunSign,
      moonSign: reading.chartData.moonSign,
      ascendant: reading.chartData.ascendant,
      name: reading.birthData.name,
      planets: reading.chartData.planets,
    }),
  });

  if (!response.ok) {
    let message = `Unable to generate full song (status ${response.status})`;
    try {
      const json = await response.json() as { error?: string };
      if (json.error) {
        message = sanitizeErrorMessage(json.error, message);
      }
    } catch (error) {
      console.warn('Unable to parse generate-music error response:', error);
    }
    throw new Error(message);
  }

  // A 200 response that contains JSON (not audio) indicates a server-side
  // configuration issue (e.g. missing ElevenLabs API key). Detect and surface
  // this as a clear error rather than trying to play garbage audio.
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('audio/')) {
    let message = 'Music generation is currently unavailable. Please try again later.';
    try {
      const json = await response.json() as { error?: string; unavailable?: boolean };
      if (json.error) {
        message = sanitizeErrorMessage(json.error, message);
      }
    } catch (error) {
      console.warn('Unable to parse generate-music unavailable response body:', error);
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
