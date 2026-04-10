/**
 * Merged Astrology Houses lookup — 1,541 planet-sign-house → musical expression mappings
 * from the official Quantumelodic dataset.
 */
import data from './mergedHouses.json';

interface HouseEntry {
  d: string; // definition
  m: string; // musical expression
}

const houses = data as Record<string, HouseEntry>;

/**
 * Look up the canonical musical expression for a planet-sign-house placement.
 * @param planet e.g. "Sun"
 * @param sign e.g. "Aries"
 * @param house e.g. "1st house"
 */
export function getPlacementMusic(planet: string, sign: string, house: string): { definition: string; musicalExpression: string } | null {
  const key = `${planet}|${sign}|${house}`;
  const entry = houses[key];
  if (!entry) return null;
  return { definition: entry.d, musicalExpression: entry.m };
}

/**
 * Get all musical expressions for a given planet across all its sign/house combos.
 */
export function getPlanetExpressions(planet: string): Array<{ sign: string; house: string; definition: string; musicalExpression: string }> {
  const results: Array<{ sign: string; house: string; definition: string; musicalExpression: string }> = [];
  for (const [key, entry] of Object.entries(houses)) {
    const [p, sign, house] = key.split('|');
    if (p === planet) {
      results.push({ sign, house, definition: entry.d, musicalExpression: entry.m });
    }
  }
  return results;
}
