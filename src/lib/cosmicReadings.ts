import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { CosmicReading } from '@/types/astrology';

function sanitizeErrorMessage(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  return message.replace(/\s+/g, ' ').trim().slice(0, 160) || fallback;
}

export async function ensureCosmicReadingRecord(_session: Session, reading: CosmicReading) {
  // cosmic_readings table not yet provisioned — return preview-only stub
  return { id: reading.id ?? null, unlockStatus: reading.unlockStatus ?? 'preview' } as const;
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

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
