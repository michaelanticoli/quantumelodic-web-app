import type { CosmicReading, ChartData } from '@/types/astrology';
import { chartToScore } from '@/utils/chartToScore';
import { renderPreviewScoreToAudioUrl } from '@/utils/tonePlayer';

export async function ensureCosmicReadingRecord(_session: unknown, reading: CosmicReading) {
  return { id: reading.id ?? null, unlockStatus: 'unlocked' } as const;
}

export async function refreshCosmicReadingAccess(_readingId: string) {
  return null;
}

export interface MusicGenerationResult {
  url: string;
  source: 'tone';
}

/**
 * Generate the chart's composition locally via the deterministic Tone.js engine.
 * ElevenLabs has been deprecated — it produced spa-music output that ignored the
 * piano-noir aesthetic. All audio now comes from chartToScore -> tonePlayer.
 */
export async function generateChartMusic(
  _sunSign: string,
  _moonSign: string,
  _ascendant: string,
  _name: string,
  planets: Array<{ name: string; symbol: string; degree: number; sign: string; signNumber: number; isRetrograde: boolean }>,
  _options: { signal?: AbortSignal } = {},
): Promise<MusicGenerationResult> {
  const chart: ChartData = {
    planets,
    sunSign: _sunSign,
    moonSign: _moonSign,
    ascendant: _ascendant,
    source: 'live',
  };
  const score = chartToScore(chart);
  const url = await renderPreviewScoreToAudioUrl(score, 90);
  return { url, source: 'tone' };
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
