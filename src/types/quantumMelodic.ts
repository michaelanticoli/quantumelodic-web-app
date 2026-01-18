// QuantumMelodic database types

export interface QMPlanet {
  id: string;
  name: string;
  symbol: string;
  frequency_hz: number;
  octave: number;
  note: string;
  instrument: string;
  timbre: string;
  harmonic_quality: string;
  archetypal_energy: string;
  sonic_character: string;
}

export interface QMSign {
  id: string;
  name: string;
  symbol: string;
  element: string;
  modality: string;
  musical_mode: string;
  key_signature: string;
  tempo_bpm: number;
  texture: string;
  emotional_quality: string;
  sonic_palette: string;
}

export interface QMAspect {
  id: string;
  name: string;
  symbol: string;
  angle: number;
  orb: number;
  harmonic_interval: string;
  consonance: string;
  tension_level: number;
  sonic_expression: string;
  musical_effect: string;
  color: string;
}

export interface QMHouse {
  id: string;
  number: number;
  name: string;
  domain: string;
  tonal_area: string;
  dynamic: string;
  frequency_range: string;
  expression: string;
}

// Computed aspect between two planets
export interface ComputedAspect {
  planet1: string;
  planet2: string;
  aspectType: QMAspect;
  exactAngle: number;
  orb: number;
}

// Full QuantumMelodic reading with all data
export interface QuantumMelodicReading {
  planets: Array<{
    position: import('./astrology').PlanetPosition;
    qmData: QMPlanet | null;
    signData: QMSign | null;
    houseNumber: number;
    houseData: QMHouse | null;
  }>;
  aspects: ComputedAspect[];
  dominantElement: string;
  dominantModality: string;
  overallKey: string;
  overallTempo: number;
}
