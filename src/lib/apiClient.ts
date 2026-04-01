/**
 * Quantumelodic API client
 *
 * Provides typed wrappers around the Flask backend endpoints.
 * Reads the base URL from the VITE_API_BASE_URL environment variable
 * (defaults to http://localhost:5001 for local development).
 *
 * Usage:
 *   import { apiClient } from "@/lib/apiClient";
 *
 *   const health = await apiClient.health();
 *   const chart  = await apiClient.calculateChart({ year: 1990, ... });
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5001";

// ---------------------------------------------------------------------------
// Generic fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `API error ${response.status}`;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        const errorBody = (await response.json()) as { error?: string };
        if (errorBody.error) message = errorBody.error;
      } catch {
        // ignore JSON parse failures
      }
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: "ok";
  service: string;
}

export interface BirthDataRequest {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  utc_offset?: number;
}

export interface PlanetPosition {
  name: string;
  symbol: string;
  degree: number;
  signDegree: number;
  sign: string;
  signNumber: number;
  isRetrograde: boolean;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  exactAngle: number;
  actualAngle: number;
}

export interface ChartResponse {
  planets: PlanetPosition[];
  ascendant: PlanetPosition | Record<string, never>;
  aspects: Aspect[];
  julianDay: number;
  swissEphAvailable: boolean;
}

export interface GenerateMusicRequest {
  sunSign: string;
  moonSign: string;
  ascendant?: string;
  planets?: PlanetPosition[];
  aspects?: Aspect[];
}

export interface PlanetSoundResponse {
  planet: string;
  frequency_hz: number;
  root_hz: number;
  harmonics: Array<{
    n: number;
    frequency_hz: number;
    ratio: string;
    cents_above_root: number;
  }>;
}

export interface AspectSoundResponse {
  planet1: { name: string; frequency_hz: number };
  planet2: { name: string; frequency_hz: number };
  ratio: number;
  cents: number;
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

export const apiClient = {
  /** Check that the backend is alive */
  health(): Promise<HealthResponse> {
    return apiFetch<HealthResponse>("/api/health");
  },

  /** Calculate a natal chart from birth data */
  calculateChart(data: BirthDataRequest): Promise<ChartResponse> {
    return apiFetch<ChartResponse>("/api/calculate-chart", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Generate Quantumelodic music parameters for a chart */
  generateMusic(data: GenerateMusicRequest): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>("/api/generate-music", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Generate MIDI sequence data */
  generateMidi(musicParams: Record<string, unknown>, bars?: number): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>("/api/generate-midi", {
      method: "POST",
      body: JSON.stringify({ musicParams, bars }),
    });
  },

  /** Get sound parameters for a single planet */
  generatePlanetSound(planet: string, octaveShift?: number): Promise<PlanetSoundResponse> {
    return apiFetch<PlanetSoundResponse>("/api/generate-planet-sound", {
      method: "POST",
      body: JSON.stringify({ planet, octaveShift }),
    });
  },

  /** Get harmonic relationship between two planets */
  generateAspectSound(planet1: string, planet2: string): Promise<AspectSoundResponse> {
    return apiFetch<AspectSoundResponse>("/api/generate-aspect-sound", {
      method: "POST",
      body: JSON.stringify({ planet1, planet2 }),
    });
  },

  /** Create a Stripe checkout session */
  createCheckout(email: string): Promise<{ url: string }> {
    return apiFetch<{ url: string }>("/api/create-checkout", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
} as const;
