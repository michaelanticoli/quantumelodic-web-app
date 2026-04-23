import type { BirthData, ChartData } from '@/types/astrology';
import { fetchWithTimeout, RequestTimeoutError } from '@/lib/fetchWithTimeout';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

interface BackendPlanetPosition {
  name: string;
  symbol: string;
  degree: number;
  sign: string;
  signNumber: number;
  isRetrograde: boolean;
}

interface BackendChartResponse {
  planets: BackendPlanetPosition[];
  ascendant?: { sign?: string } | Record<string, never>;
}

function normalizeBaseUrl(url: string | undefined) {
  return url?.trim().replace(/\/+$/, '') || null;
}

function getBackendBaseUrls() {
  const candidates = [
    normalizeBaseUrl(API_BASE_URL),
    typeof window !== 'undefined' ? normalizeBaseUrl(window.location.origin) : null,
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates)];
}

function isChartData(value: unknown): value is ChartData {
  if (!value || typeof value !== 'object') return false;
  const chart = value as Partial<ChartData>;
  return Array.isArray(chart.planets)
    && typeof chart.sunSign === 'string'
    && typeof chart.moonSign === 'string'
    && typeof chart.ascendant === 'string';
}

function normalizeChartData(value: unknown, source: string): ChartData {
  if (isChartData(value)) {
    return {
      ...value,
      source: value.source || source,
    };
  }

  const backendChart = value as BackendChartResponse;
  const planets = Array.isArray(backendChart?.planets) ? backendChart.planets : [];
  const sunSign = planets.find((planet) => planet.name === 'Sun')?.sign || 'Aries';
  const moonSign = planets.find((planet) => planet.name === 'Moon')?.sign || sunSign;
  const ascendant = ('sign' in (backendChart?.ascendant || {}) && typeof backendChart.ascendant?.sign === 'string')
    ? backendChart.ascendant.sign
    : sunSign;

  return {
    planets,
    sunSign,
    moonSign,
    ascendant,
    source,
  };
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchSupabaseChart(birthData: Pick<BirthData, 'date' | 'time' | 'location'>, timeoutMs: number) {
  const baseUrl = normalizeBaseUrl(SUPABASE_URL);
  if (!baseUrl) {
    throw new Error('Supabase chart service is not configured');
  }

  const response = await fetchWithTimeout(`${baseUrl}/functions/v1/calculate-chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: birthData.date,
      time: birthData.time,
      location: birthData.location,
    }),
  }, timeoutMs);

  if (!response.ok) {
    const errorData = await readJsonResponse(response) as { error?: string } | null;
    throw new Error(errorData?.error || 'Failed to calculate birth chart');
  }

  return normalizeChartData(await response.json(), 'supabase-edge');
}

function toBackendPayload(birthData: Pick<BirthData, 'date' | 'time' | 'location'>) {
  const [year, month, day] = birthData.date.split('-').map(Number);
  const [hour, minute] = birthData.time.split(':').map(Number);

  return {
    date: birthData.date,
    time: birthData.time,
    location: birthData.location,
    year,
    month,
    day,
    hour,
    minute,
  };
}

async function fetchBackendChart(baseUrl: string, birthData: Pick<BirthData, 'date' | 'time' | 'location'>, timeoutMs: number) {
  const response = await fetchWithTimeout(`${baseUrl}/api/calculate-chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toBackendPayload(birthData)),
  }, timeoutMs);

  if (!response.ok) {
    const errorData = await readJsonResponse(response) as { error?: string } | null;
    throw new Error(errorData?.error || 'Backend chart calculation failed');
  }

  return normalizeChartData(await response.json(), 'backend-api');
}

function isServiceUnavailableError(error: unknown) {
  if (error instanceof RequestTimeoutError) return false;
  if (!(error instanceof Error)) return false;
  return /Failed to fetch|fetch failed|NetworkError|ENOTFOUND|ECONNREFUSED|service unavailable/i.test(error.message);
}

export async function calculateChartData(
  birthData: Pick<BirthData, 'date' | 'time' | 'location'>,
  timeoutMs: number,
): Promise<ChartData> {
  let primaryError: unknown = null;

  try {
    return await fetchSupabaseChart(birthData, timeoutMs);
  } catch (error) {
    primaryError = error;
  }

  let backendError: unknown = null;
  for (const baseUrl of getBackendBaseUrls()) {
    try {
      return await fetchBackendChart(baseUrl, birthData, timeoutMs);
    } catch (error) {
      backendError = error;
    }
  }

  if (primaryError instanceof RequestTimeoutError || backendError instanceof RequestTimeoutError) {
    throw new RequestTimeoutError(timeoutMs);
  }

  if (isServiceUnavailableError(primaryError) || isServiceUnavailableError(backendError)) {
    throw new Error('Chart service is unavailable right now. Please try again in a moment.');
  }

  throw (backendError ?? primaryError ?? new Error('Failed to calculate birth chart'));
}
