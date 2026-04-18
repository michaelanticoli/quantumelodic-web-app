import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { CosmicReading } from '@/types/astrology';

export async function ensureCosmicReadingRecord(session: Session, reading: CosmicReading) {
  if (reading.id) {
    return { id: reading.id, unlockStatus: reading.unlockStatus ?? 'preview' } as const;
  }

  const { data, error } = await supabase
    .from('cosmic_readings')
    .insert({
      user_id: session.user.id,
      birth_data: reading.birthData,
      chart_data: reading.chartData,
      musical_mode: reading.musicalMode,
    })
    .select('id, unlock_status')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    unlockStatus: data.unlock_status,
  } as const;
}

export async function refreshCosmicReadingAccess(readingId: string) {
  const { data, error } = await supabase
    .from('cosmic_readings')
    .select('id, unlock_status, unlocked_at')
    .eq('id', readingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
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
    let message = 'Unable to generate full song';
    try {
      const json = await response.json() as { error?: string };
      if (json.error) {
        message = json.error;
      }
    } catch (error) {
      console.warn('Unable to parse generate-music error response:', error);
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
