export interface PlanetPosition {
  name: string;
  symbol: string;
  degree: number;
  sign: string;
  signNumber: number;
  isRetrograde: boolean;
}

export interface ChartData {
  planets: PlanetPosition[];
  sunSign: string;
  moonSign: string;
  ascendant: string;
  source: string;
}

export interface BirthData {
  name: string;
  date: string;
  time: string;
  location: string;
  latitude?: number;
  longitude?: number;
  timezone?: number;
}

export interface CosmicReading {
  id?: string | null;
  birthData: BirthData;
  chartData: ChartData;
  audioUrl?: string;
  musicalMode: string;
  audioSource?: 'tone' | 'elevenlabs' | 'procedural';
  unlockStatus?: 'preview' | 'unlocked';
}
