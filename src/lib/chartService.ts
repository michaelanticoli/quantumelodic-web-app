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

class ChartServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChartServiceUnavailableError';
  }
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

function getAscendantSign(ascendant: BackendChartResponse['ascendant'], fallbackSign: string) {
  if (!ascendant || typeof ascendant !== 'object') {
    return fallbackSign;
  }

  if ('sign' in ascendant && typeof ascendant.sign === 'string' && ascendant.sign.trim()) {
    return ascendant.sign;
  }

  return fallbackSign;
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
  const ascendant = getAscendantSign(backendChart?.ascendant, sunSign);

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

/**
 * Read the JSON body of a response with a hard timeout.
 * If the server sends headers but hangs on the body (e.g., partial response
 * from a Supabase edge function that crashed mid-stream), this prevents the
 * app from hanging indefinitely.
 */
async function readJsonWithTimeout(response: Response, timeoutMs: number): Promise<unknown> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new RequestTimeoutError(timeoutMs)), timeoutMs);
  });
  try {
    return await Promise.race([response.json(), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchSupabaseChart(birthData: Pick<BirthData, 'date' | 'time' | 'location'>, timeoutMs: number) {
  const baseUrl = normalizeBaseUrl(SUPABASE_URL);
  if (!baseUrl) {
    throw new ChartServiceUnavailableError('Supabase chart service is not configured');
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(`${baseUrl}/functions/v1/calculate-chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: birthData.date,
        time: birthData.time,
        location: birthData.location,
      }),
    }, timeoutMs);
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new ChartServiceUnavailableError('Supabase chart service is unavailable');
    }
    throw error;
  }

  if (!response.ok) {
    if ([404, 502, 503, 504].includes(response.status)) {
      throw new ChartServiceUnavailableError(`Supabase chart service responded with ${response.status}`);
    }
    const errorData = await readJsonResponse(response) as { error?: string } | null;
    throw new Error(errorData?.error || 'Failed to calculate birth chart');
  }

  return normalizeChartData(await readJsonWithTimeout(response, timeoutMs), 'supabase-edge');
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
  let response: Response;
  try {
    response = await fetchWithTimeout(`${baseUrl}/api/calculate-chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toBackendPayload(birthData)),
    }, timeoutMs);
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new ChartServiceUnavailableError('Backend chart service is unavailable');
    }
    throw error;
  }

  if (!response.ok) {
    if ([404, 502, 503, 504].includes(response.status)) {
      throw new ChartServiceUnavailableError(`Backend chart service responded with ${response.status}`);
    }
    const errorData = await readJsonResponse(response) as { error?: string } | null;
    throw new Error(errorData?.error || 'Backend chart calculation failed');
  }

  return normalizeChartData(await readJsonWithTimeout(response, timeoutMs), 'backend-api');
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

  if (primaryError instanceof ChartServiceUnavailableError || backendError instanceof ChartServiceUnavailableError) {
    throw new Error('Chart service is unavailable right now. Please try again in a moment.');
  }

  throw (backendError ?? primaryError ?? new Error('Failed to calculate birth chart'));
}
