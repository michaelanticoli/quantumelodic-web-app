import type { BirthData, ChartData, PlanetPosition } from './astrology';

export type RelationshipType = 'romantic' | 'friendship' | 'professional' | 'parent_child' | 'transit';

export interface SynastryAspect {
  planet_a: string;
  planet_b: string;
  aspect: string;
  quality: 'fusion' | 'harmony' | 'tension' | 'dissonance' | 'neutral';
  exact_angle: number;
  actual_angle: number;
  orb: number;
  sign_a: string;
  sign_b: string;
}

export interface SynastryHarmony {
  synastric_tension_index: number;
  harmonic_compatibility: number;
  dominant_element_a: string;
  dominant_element_b: string;
  shared_element: string;
  element_blend: string;
  harmony_count: number;
  tension_count: number;
  fusion_count: number;
}

export interface SynastryScoreParams {
  root_a: string;
  root_b: string;
  mode_a: string;
  mode_b: string;
  blended_tempo: number;
  key_distance: number;
  key_relationship: string;
  counterpoint_style: string;
  voice_independence: number;
  rhythmic_interaction: string;
  swing_blend: number;
  timbre_a: string[];
  timbre_b: string[];
  timbre_blend: string;
  relationship_type: string;
  dynamic_arc: string;
  tension_index: number;
  compatibility_index: number;
}

export interface CompositeChart {
  planets: PlanetPosition[];
  ascendant: Record<string, unknown>;
  sunSign: string;
  moonSign: string;
  ascendantSign: string;
  isComposite: boolean;
}

export interface SynastryResult {
  chart_a: {
    planets: PlanetPosition[];
    ascendant: Record<string, unknown>;
    aspects: Array<Record<string, unknown>>;
  };
  chart_b: {
    planets: PlanetPosition[];
    ascendant: Record<string, unknown>;
    aspects: Array<Record<string, unknown>>;
  };
  synastry_aspects: SynastryAspect[];
  composite_chart: CompositeChart;
  harmony: SynastryHarmony;
  score_params: SynastryScoreParams;
  relationship_type: RelationshipType;
}

export interface TransitResult {
  natal_chart: {
    planets: PlanetPosition[];
    ascendant: Record<string, unknown>;
    aspects: Array<Record<string, unknown>>;
  };
  transit_chart: {
    planets: PlanetPosition[];
    ascendant: Record<string, unknown>;
    aspects: Array<Record<string, unknown>>;
  };
  transit_date: string;
  transit_aspects: SynastryAspect[];
  harmony: SynastryHarmony;
  score_params: SynastryScoreParams;
}
