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
    tempo < 70 ? 'a slow, deliberate pulse — closer to a heartbeat than a metronome'
    : tempo < 90 ? 'a relaxed, hand-played tempo with room between the notes'
    : tempo < 110 ? 'a moderate stride — conversational, never rushed'
    : tempo < 130 ? 'a forward-leaning pulse with momentum to spare'
    : 'an urgent, propulsive tempo that pulls the form along';

  const elementColor: Record<string, string> = {
    Fire:  'a dry, percussive heat — left-hand stabs and short, decisive phrases',
    Earth: 'a low, grounded weight — long bass tones, comping that arrives a beat late on purpose',
    Air:   'a clear, articulate touch — light voicings, conversations between voices',
    Water: 'a held, reverberant quality — felt-piano dampness and chords that bloom into their own decay',
  };

  const modalityColor: Record<string, string> = {
    Cardinal: 'each section opens with intent — the form initiates rather than waits',
    Fixed:    'the motifs hold their ground — repetitions earn their place',
    Mutable:  'the form is willing to drift, modulate, and revise itself mid-phrase',
  };

  const aspectLine = topAspectName && topAspectPair
    ? ` The most exact dialogue in the chart — ${topAspectPair[0]} ${topAspectName.toLowerCase()} ${topAspectPair[1]} — is the hinge the whole piece keeps returning to.`
    : '';

  const modeLine = mode ? ` written in ${mode.toLowerCase()} mode` : '';

  return (
    `Sun in ${sunSign} is the central voice — what the composition is actually about. ` +
    `Moon in ${moonSign} colors the room tone underneath it, and Ascendant in ${ascSign} is the way the piece introduces itself. ` +
    `The chart pulls toward ${element.toLowerCase()}: ${elementColor[element] ?? 'its own characteristic color'}. ` +
    `Its rhythmic posture is ${modality.toLowerCase()} — ${modalityColor[modality] ?? 'a particular kind of structural breathing'}. ` +
    `The whole thing settles around ${key}${modeLine} at roughly ${tempo} BPM — ${tempoFeel}.` +
    aspectLine +
    ` None of these numbers are decorative; they’re the actual instructions the engine follows to render your composition.`
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
