/**
 * Synastry Placement Sentences
 *
 * Deterministic poetic interpretations for inter-chart aspects,
 * translating astrological synastry into musically-grounded language.
 * Each sentence connects the relationship dynamic to its sonic expression.
 */

// ─── Aspect-quality musical descriptions ──────────────────────────────────

const ASPECT_QUALITY_MUSIC: Record<string, string> = {
  fusion: 'a unison tone — two voices breathing as one',
  harmony: 'a consonant interval — a natural third or sixth that resolves effortlessly',
  tension: 'a suspended dissonance — the tritone that demands resolution',
  dissonance: 'a chromatic rub — a semitone apart, uneasy but compelling',
  neutral: 'a passing tone — neither pulling toward nor away',
};

// ─── Planet pair musical metaphors ────────────────────────────────────────

const PLANET_PAIR_FLAVOR: Record<string, string> = {
  'Sun-Sun': 'two melodies written in the same key, each claiming center stage',
  'Sun-Moon': 'a daylight theme answered by its nocturnal variation',
  'Sun-Venus': 'the lead voice finding its most beautiful harmonic partner',
  'Sun-Mars': 'a bold unison that either doubles in power or clashes in the forte',
  'Sun-Jupiter': 'the melody expanding into an orchestral swell',
  'Sun-Saturn': 'the theme encountering its structural counterpoint — discipline meets fire',
  'Moon-Moon': 'two inner rhythms seeking the same pulse',
  'Moon-Venus': 'the emotional undertone meeting beauty — a felt-piano duet',
  'Moon-Mars': 'instinct and drive in counterpoint — a rhythm section conversation',
  'Moon-Jupiter': 'the feeling tone amplified into generous breadth',
  'Moon-Saturn': 'the inner weather meeting a steady ostinato — security through structure',
  'Venus-Venus': 'two aesthetic sensibilities comparing voicings',
  'Venus-Mars': 'desire and pursuit woven into a single phrase — the classic romantic motif',
  'Venus-Jupiter': 'beauty magnified — the lush orchestration of shared pleasure',
  'Venus-Saturn': 'love meeting commitment — a slow waltz with formal grace',
  'Mars-Mars': 'two rhythmic drives in the same bar — either locked groove or polyrhythmic clash',
  'Mars-Jupiter': 'action and meaning combining in a triumphant fanfare',
  'Mars-Saturn': 'drive meeting discipline — the controlled burn of focused power',
  'Jupiter-Saturn': 'expansion and contraction — the breath of a living composition',
  'Mercury-Mercury': 'two melodic lines in rapid conversation — a two-part invention',
  'Mercury-Venus': 'thought and beauty exchanging ornaments',
  'Mercury-Mars': 'quick wit and decisive rhythm in dialogue',
  'Mercury-Jupiter': 'the mind reaching for larger themes — a modulation upward',
  'Mercury-Saturn': 'precise language meeting structural form — a fugue subject',
  'Uranus-Venus': 'beauty interrupted — an unexpected chord change that rewrites the piece',
  'Uranus-Mars': 'electric unpredictability in the rhythm section',
  'Neptune-Venus': 'beauty dissolving into transcendence — the overtones above the fundamental',
  'Neptune-Moon': 'two dreams sharing one reverie — ambient wash',
  'Pluto-Sun': 'the fundamental tone being transformed from below',
  'Pluto-Venus': 'desire deepened into obsession — a drone that colors everything',
  'Pluto-Mars': 'raw power meeting raw power — the lowest bass note shaking the room',
};

// ─── Aspect type musical behavior ────────────────────────────────────────

const ASPECT_MUSICAL_BEHAVIOR: Record<string, string> = {
  Conjunction: 'creates a unison passage — both voices on the same pitch, doubling intensity',
  Trine: 'opens a consonant fifth — the voices flow together in natural overtones',
  Sextile: 'establishes a gentle third — cooperative harmony without effort',
  Square: 'introduces a suspended fourth that refuses to resolve — productive friction',
  Opposition: 'places voices at opposite ends of the register — maximum counterpoint',
  Quincunx: 'bends the pitch between two incompatible modes — an endless adjustment',
  'Semi-Sextile': 'a half-step neighbor tone — close but never quite meeting',
};

// ─── Element blend descriptions ──────────────────────────────────────────

export const ELEMENT_BLEND_MUSIC: Record<string, string> = {
  amplified: 'both charts vibrate in the same elemental frequency — the timbre doubles and deepens',
  harmonious: 'complementary elements create a natural blend — like strings and woodwinds in the same phrase',
  grounding_friction: 'fire meets earth — the crackling energy above a deep, slow drone',
  steam_tension: 'fire meets water — hissing overtones where the two waveforms collide',
  conceptual_friction: 'earth meets air — solid tone meeting airy tremolo, seeking common ground',
  mist_tension: 'air meets water — a blurred boundary between distinct pitches, a shimmer',
  neutral: 'the elements hold their own space — parallel voices in separate registers',
};

// ─── Main sentence generator ─────────────────────────────────────────────

export interface SynastryAspectSentence {
  aspect: string;
  planet_a: string;
  planet_b: string;
  quality: string;
  sentence: string;
  musicalNote: string;
}

/**
 * Generate a poetic/musical interpretation sentence for a synastry aspect.
 */
export function getSynastryAspectSentence(
  planetA: string,
  planetB: string,
  aspectName: string,
  quality: string,
  signA: string,
  signB: string,
): SynastryAspectSentence {
  // Get pair flavor (try both orderings)
  const pairKey1 = `${planetA}-${planetB}`;
  const pairKey2 = `${planetB}-${planetA}`;
  const pairFlavor = PLANET_PAIR_FLAVOR[pairKey1] || PLANET_PAIR_FLAVOR[pairKey2] || 
    `${planetA} and ${planetB} finding their shared register`;

  const qualityMusic = ASPECT_QUALITY_MUSIC[quality] || ASPECT_QUALITY_MUSIC['neutral'];
  const aspectBehavior = ASPECT_MUSICAL_BEHAVIOR[aspectName] || 'adds a subtle coloring to the harmonic field';

  const sentence = `Your ${planetA} in ${signA} ${aspectName.toLowerCase()} their ${planetB} in ${signB} — ${pairFlavor}. This ${aspectBehavior}.`;
  const musicalNote = `Sonically: ${qualityMusic}.`;

  return {
    aspect: aspectName,
    planet_a: planetA,
    planet_b: planetB,
    quality,
    sentence,
    musicalNote,
  };
}

/**
 * Generate sentences for all synastry aspects (top N most significant).
 */
export function getAllSynastryAspectSentences(
  aspects: Array<{ planet_a: string; planet_b: string; aspect: string; quality: string; sign_a?: string; sign_b?: string; orb: number }>,
  maxCount: number = 10,
): SynastryAspectSentence[] {
  // Take the tightest aspects (already sorted by orb from backend)
  return aspects.slice(0, maxCount).map(asp =>
    getSynastryAspectSentence(
      asp.planet_a,
      asp.planet_b,
      asp.aspect,
      asp.quality,
      asp.sign_a || '',
      asp.sign_b || '',
    )
  );
}
