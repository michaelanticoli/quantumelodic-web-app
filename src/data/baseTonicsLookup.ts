/**
 * Base Tonic Intervals — 12×12 zodiac-to-chromatic-interval matrix
 * from the official Quantumelodic dataset.
 *
 * Given a base sign (e.g. Sun sign), returns the canonical note for each interval degree.
 */
import data from './baseTonics.json';

interface IntervalEntry {
  sign: string;
  note: string;
}

type IntervalName = 'Tonic' | 'b2' | '2' | 'b3' | '3' | '4' | 'b5' | '5' | 'b6' | '6' | 'b7' | '7';

const tonics = data as Record<string, Record<string, IntervalEntry>>;

const INTERVAL_SEMITONES: Record<IntervalName, number> = {
  Tonic: 0, b2: 1, '2': 2, b3: 3, '3': 4, '4': 5, b5: 6, '5': 7, b6: 8, '6': 9, b7: 10, '7': 11,
};

/**
 * Get the full interval map for a zodiac sign.
 * Returns notes mapped to each chromatic interval.
 */
export function getIntervalMap(sign: string): Record<IntervalName, { sign: string; note: string; semitones: number }> | null {
  const entry = tonics[sign];
  if (!entry) return null;

  const result = {} as Record<IntervalName, { sign: string; note: string; semitones: number }>;
  for (const [interval, data] of Object.entries(entry)) {
    const name = interval as IntervalName;
    result[name] = { ...data, semitones: INTERVAL_SEMITONES[name] ?? 0 };
  }
  return result;
}

/**
 * Get the canonical tonic note for a zodiac sign.
 */
export function getTonicNote(sign: string): string | null {
  const entry = tonics[sign];
  if (!entry) return null;
  return entry['Tonic']?.note ?? null;
}

/**
 * Build a chromatic scale from the base tonic intervals for a sign.
 * Returns array of note names in order: [tonic, b2, 2, b3, 3, 4, b5, 5, b6, 6, b7, 7]
 */
export function buildChromaticScale(sign: string): string[] | null {
  const entry = tonics[sign];
  if (!entry) return null;
  const intervals: IntervalName[] = ['Tonic', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
  return intervals.map(i => entry[i]?.note ?? '');
}
