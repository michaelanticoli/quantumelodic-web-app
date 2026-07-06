/**
 * placementSentences
 * Deterministic, dry/poetic one-liners for every planet + sign + house combination.
 *
 * Style brief: MoonTuner dialect — grounded, philosophical, slightly metaphoric,
 * occasionally wry. Never new-age soup. The sentence completes the planet/sign/house
 * triplet with a "distillation" — what this placement actually sounds like in a life.
 *
 * Output is deterministic per (planet, sign, house) so the same chart always reads
 * the same way across PDF, web, and narration.
 */

const PLANET_VERBS: Record<string, string> = {
  Sun:        'the self learns to',
  Moon:       'the inner weather wants to',
  Mercury:    'the mind threads itself through',
  Venus:      'desire is tuned toward',
  Mars:       'the body argues for',
  Jupiter:    'meaning expands into',
  Saturn:     'discipline gets built around',
  Uranus:     'the wiring lights up around',
  Neptune:    'the dream-tissue dissolves into',
  Pluto:      'something underneath insists on',
  Ascendant:  'the door swings open onto',
  MC:         'the public face leans into',
};

const SIGN_FLAVOR: Record<string, string> = {
  Aries:       'a first strike, unrehearsed',
  Taurus:      'slow, fragrant, immovable pleasure',
  Gemini:      'parallel sentences spoken at once',
  Cancer:      'a kitchen-lit instinct to feed and shelter',
  Leo:         'a single warm spotlight that refuses to flicker',
  Virgo:       'a precise hand sorting the harvest',
  Libra:       'the negotiation that wants to remain beautiful',
  Scorpio:     'a candle held over what was buried',
  Sagittarius: 'the next horizon, already disappearing',
  Capricorn:   'a long staircase, taken one stone at a time',
  Aquarius:    'a circuit board wired for the unfamiliar',
  Pisces:      'a tide pool with no clear edges',
};

const HOUSE_DOMAIN: Record<number, string> = {
  1:  'the body and the first impression it makes',
  2:  'money, voice, and the appetite to own a life',
  3:  'the daily commute of thought — language, siblings, the street',
  4:  'home as soil, lineage, and the room you grew up in',
  5:  'play, romance, and whatever you make for its own sake',
  6:  'the small daily craft — work, the body’s upkeep, the rituals',
  7:  'the mirror partner — contracts, marriages, opposites',
  8:  'shared money, sex, and what you inherit in the dark',
  9:  'the longer view — travel, belief, the foreign tongue',
  10: 'the public record — career, reputation, the named role',
  11: 'the chosen tribe — friends, scenes, futures held in common',
  12: 'the quiet undertow — solitude, sleep, what stays unsaid',
};

const MUSIC_GESTURE: Record<string, string> = {
  Sun:        'sounds like the central melody refusing apology',
  Moon:       'sounds like the room tone of an honest feeling',
  Mercury:    'sounds like a quick figure passed between hands',
  Venus:      'sounds like a chord left ringing past its welcome',
  Mars:       'sounds like a downbeat with teeth in it',
  Jupiter:    'sounds like the song widening into a full chorus',
  Saturn:     'sounds like a bass line that won’t be hurried',
  Uranus:     'sounds like a key change you didn’t see coming',
  Neptune:    'sounds like reverb you can’t locate the source of',
  Pluto:      'sounds like a sub-frequency you feel before you hear it',
  Ascendant:  'sounds like the opening bar before anyone speaks',
  MC:         'sounds like the take you’d put out as a single',
};

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Return the distilling sentence for one placement. Deterministic.
 *
 * Shape: `${planetVerb} ${signFlavor} in ${houseDomain}; it ${musicGesture}.`
 *
 * The hash is used only to pick between two alternate connectors so adjacent
 * placements in the same report don't sound identical.
 */
export function placementSentence(planet: string, sign: string, house: number): string {
  const verb = PLANET_VERBS[planet] ?? `${planet.toLowerCase()} expresses as`;
  const flavor = SIGN_FLAVOR[sign] ?? sign.toLowerCase();
  const domain = HOUSE_DOMAIN[house] ?? `the ${house}th house`;
  const gesture = MUSIC_GESTURE[planet] ?? 'finds its own voice in the score';

  const seed = djb2(`${planet}|${sign}|${house}`);
  const connector = seed % 3 === 0 ? '—' : seed % 3 === 1 ? '.' : ';';
  const opener =
    seed % 4 === 0 ? 'Here,'
    : seed % 4 === 1 ? 'In this room,'
    : seed % 4 === 2 ? 'Translated to music,'
    : 'On the page,';

  return `${capitalize(verb)} ${flavor}, set in ${domain}${connector} ${opener.toLowerCase()} it ${gesture}.`;
}

/** Compose the closing "Whole Composition" paragraph from real chart facts. */
export function compositionStatement(opts: {
  sunSign: string;
  moonSign: string;
  ascSign: string;
  element: string;
  modality: string;
  key: string;
  tempo: number;
  topAspectName?: string;
  topAspectPair?: [string, string];
  mode?: string;
}): string {
  const { sunSign, moonSign, ascSign, element, modality, key, tempo, topAspectName, topAspectPair, mode } = opts;

  const tempoFeel =
    tempo < 70 ? 'a slow, deliberate pulse — the piano measured like a heartbeat finding its own time'
    : tempo < 90 ? 'a relaxed, hand-played tempo — space between the notes that the piano actually needs'
    : tempo < 110 ? 'a conversational stride — not rushed, the piano thinking aloud'
    : tempo < 130 ? 'a forward-leaning pulse with momentum the left hand drives'
    : 'an urgent, propulsive tempo that pulls the piano form along before it settles';

  const elementColor: Record<string, string> = {
    Fire:  'a dry, percussive heat — the piano plays staccato and decisive, left-hand stabs, short declarative phrases',
    Earth: 'a low, grounded weight — long bass tones and pedal resonance, comping that arrives a beat late on purpose',
    Air:   'a clear, articulate lightness — open-voiced chords, quick hand-crossing, conversations between voices',
    Water: 'a held, reverberant quality — felt-dampened piano and chords that bloom into their own decay',
  };

  const modalityColor: Record<string, string> = {
    Cardinal: 'each section opens with clear intent — the piano initiates rather than waits',
    Fixed:    'motifs hold their ground — repetitions earn their place by deepening, not just continuing',
    Mutable:  'the form drifts and revises itself mid-phrase — modulations arrive as decisions, not accidents',
  };

  // Sun and Moon sign characterizations for the piano voice
  const sunPianoVoice: Record<string, string> = {
    Aries:       'a central line that strikes before the room is ready',
    Taurus:      'a central melody that insists on its own unhurried, tactile beauty',
    Gemini:      'a main theme that keeps branching into parallel thoughts',
    Cancer:      'a central voice shaped by memory — tender, non-linear',
    Leo:         'a main theme that refuses to go unheard',
    Virgo:       'a central line of precise, quietly demanding intelligence',
    Libra:       'a melody that weighs each resolution before committing',
    Scorpio:     'a central voice that earns intensity through sustained restraint',
    Sagittarius: 'a theme that keeps widening, always reaching for the next interval',
    Capricorn:   'a measured, disciplined central line — each phrase load-bearing',
    Aquarius:    'a central voice wired differently, finding beauty in the unexpected',
    Pisces:      'a melody that blurs its own edges, dissolving into its own pedal',
  };
  const moonPianoUndercurrent: Record<string, string> = {
    Aries:       'an impulsive emotional undertow — hot, quick',
    Taurus:      'a grounded emotional bass — sensory, immovable',
    Gemini:      'a restless inner voice — quick, curious, never quite settling',
    Cancer:      'a deep protective undertow — all feeling, little explanation',
    Leo:         'a warm emotional hum that wants to be felt',
    Virgo:       'an analytical undertow — processing, trying to make the feeling precise',
    Libra:       'an emotional register that weighs everything before arriving',
    Scorpio:     'a submerged current — heavy, transformative, relentless',
    Sagittarius: 'a buoyant, outward-leaning emotional floor',
    Capricorn:   'a controlled, structural emotional ground',
    Aquarius:    'a cool, slightly detached inner register',
    Pisces:      'a porous, boundaryless emotional field',
  };

  const sunVoice = sunPianoVoice[sunSign] ?? `${sunSign.toLowerCase()} character`;
  const moonVoice = moonPianoUndercurrent[moonSign] ?? `${moonSign.toLowerCase()} emotional quality`;

  const aspectLine = topAspectName && topAspectPair
    ? ` The most exact dialogue — ${topAspectPair[0]} ${topAspectName.toLowerCase()} ${topAspectPair[1]} — is the harmonic tension the piece keeps returning to.`
    : '';

  const modeLine = mode ? ` written in ${mode.toLowerCase()} mode` : '';

  return (
    `Sun in ${sunSign} is ${sunVoice} — what the piano composition is actually about. ` +
    `Moon in ${moonSign} provides ${moonVoice} beneath every phrase. ` +
    `Ascendant in ${ascSign} is the opening gesture — the first notes the listener hears. ` +
    `The chart pulls toward ${element.toLowerCase()}: ${elementColor[element] ?? 'its own characteristic color'}. ` +
    `Its rhythmic posture is ${modality.toLowerCase()} — ${modalityColor[modality] ?? 'a particular structural breathing'}. ` +
    `The whole piece settles around ${key}${modeLine} at roughly ${tempo} BPM — ${tempoFeel}.` +
    aspectLine
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
