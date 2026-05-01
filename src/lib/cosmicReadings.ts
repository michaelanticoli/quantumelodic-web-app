import type { CosmicReading } from '@/types/astrology';

export async function ensureCosmicReadingRecord(_session: unknown, reading: CosmicReading) {
  // Full reading (chart, analytics, report, song) is free — always return unlocked.
  return { id: reading.id ?? null, unlockStatus: 'unlocked' } as const;
}

export async function refreshCosmicReadingAccess(_readingId: string) {
  return null;
}

/**
 * Generate deterministic local preview music for a reading.
 * No network call: legacy ElevenLabs/backend music generation is intentionally bypassed.
 */
export async function generateFreeMusic(
  sunSign: string,
  moonSign: string,
  ascendant: string,
  name: string,
  planets: Array<{ name: string; symbol: string; degree: number; sign: string; signNumber: number; isRetrograde: boolean }>,
): Promise<string> {
  const [{ chartToScore }, { renderPreviewScoreToAudioUrl }] = await Promise.all([
    import('@/utils/chartToScore'),
    import('@/utils/tonePlayer'),
  ]);

  return renderPreviewScoreToAudioUrl(chartToScore({
    planets,
    sunSign,
    moonSign,
    ascendant,
    source: `local-tone:${name || 'unknown'}`,
  }), 12);
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
