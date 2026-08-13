import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'X-Sun-Sign, X-Moon-Sign, X-Key, X-Mode, X-Tempo, X-QM-Enhanced',
};

// ── Types ────────────────────────────────────────────────────────────

interface PlanetPosition {
  name: string;
  symbol: string;
  degree: number;
  sign: string;
  signNumber: number;
  isRetrograde: boolean;
}

interface RequestBody {
  sunSign: string;
  moonSign: string;
  ascendant?: string;
  name: string;
  planets?: PlanetPosition[];
}

interface ReadingRequestBody extends RequestBody {
  readingId?: string;
}

interface QMSign {
  name: string;
  element: string;
  modality: string;
  musical_mode: string;
  key_signature: string;
  tempo_bpm: number;
  texture: string;
  emotional_quality: string;
  sonic_palette: string;
}

interface QMPlanet {
  name: string;
  note: string;
  instrument: string;
  timbre: string;
  harmonic_quality: string;
  archetypal_energy: string;
  sonic_character: string;
  frequency_hz: number;
}

interface QMAspect {
  name: string;
  angle: number;
  orb: number;
  harmonic_interval: string;
  consonance: string;
  tension_level: number;
  sonic_expression: string;
  musical_effect: string;
}

interface ComputedAspect {
  planet1: string;
  planet2: string;
  aspectType: QMAspect;
  orb: number;
}

// ── Valid signs whitelist ─────────────────────────────────────────────────────

const VALID_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// ── Input validation ─────────────────────────────────────────────────────────

function validateRequest(data: unknown): { valid: true; data: RequestBody } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.sunSign !== 'string' || !VALID_SIGNS.includes(obj.sunSign)) {
    return { valid: false, error: 'Invalid sun sign' };
  }
  if (typeof obj.moonSign !== 'string' || !VALID_SIGNS.includes(obj.moonSign)) {
    return { valid: false, error: 'Invalid moon sign' };
  }
  if (obj.ascendant !== undefined && obj.ascendant !== null) {
    if (typeof obj.ascendant !== 'string' || !VALID_SIGNS.includes(obj.ascendant as string)) {
      return { valid: false, error: 'Invalid ascendant sign' };
    }
  }
  if (typeof obj.name !== 'string' || obj.name.length === 0 || obj.name.length > 100) {
    return { valid: false, error: 'Name must be 1-100 characters' };
  }

  const sanitizedName = obj.name.replace(/[<>"'&;]/g, '').trim();

  return {
    valid: true,
    data: {
      sunSign: obj.sunSign as string,
      moonSign: obj.moonSign as string,
      ascendant: obj.ascendant as string | undefined,
      name: sanitizedName,
      planets: Array.isArray(obj.planets) ? obj.planets as PlanetPosition[] : undefined,
    },
  };
}

function getReadingId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const { readingId } = data as ReadingRequestBody;
  return typeof readingId === 'string' && readingId.length > 0 ? readingId : null;
}

// ── Translation table name fallback lists ─────────────────────────────────────
// Tried in order; the first table that returns rows is used.
const SIGN_TABLE_NAMES   = ['qm_signs',   'zodiac_signs', 'zodiac signs'] as const;
const PLANET_TABLE_NAMES = ['qm_planets', 'planets']                      as const;
const ASPECT_TABLE_NAMES = ['qm_aspects', 'aspects']                      as const;

// ── Supabase REST helper ──────────────────────────────────────────────────────

/** Fetch all rows from a single table name (URL-encodes the name). */
async function fetchTableByName<T>(supabaseUrl: string, supabaseKey: string, table: string): Promise<T[]> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(table)}?select=*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
  });
  if (!res.ok) {
    console.warn(`Failed to fetch '${table}':`, res.status);
    return [];
  }
  return res.json() as Promise<T[]>;
}

/**
 * Try each table name in order and return the first non-empty result.
 * Returns { data, tableUsed } so callers can log which name worked.
 */
async function fetchTableWithFallback<T>(
  supabaseUrl: string,
  supabaseKey: string,
  tableNames: string[],
): Promise<{ data: T[]; tableUsed: string | null }> {
  for (const table of tableNames) {
    try {
      const data = await fetchTableByName<T>(supabaseUrl, supabaseKey, table);
      if (data.length > 0) {
        console.log(`Fetched ${data.length} rows from table '${table}'`);
        return { data, tableUsed: table };
      }
      console.log(`Table '${table}' returned 0 rows, trying next fallback...`);
    } catch (e) {
      console.warn(`Error fetching table '${table}':`, e);
    }
  }
  return { data: [], tableUsed: null };
}

// ── Aspect calculator ─────────────────────────────────────────────────────────

function calculateTopAspects(planets: PlanetPosition[], qmAspects: QMAspect[], limit = 4): ComputedAspect[] {
  const results: ComputedAspect[] = [];
  const relevant = planets.filter(p => p.name !== 'Ascendant');

  for (let i = 0; i < relevant.length; i++) {
    for (let j = i + 1; j < relevant.length; j++) {
      const p1 = relevant[i];
      const p2 = relevant[j];
      let angle = Math.abs(p1.degree - p2.degree);
      if (angle > 180) angle = 360 - angle;

      for (const aspect of qmAspects) {
        const orb = Math.abs(angle - aspect.angle);
        if (orb <= aspect.orb) {
          results.push({ planet1: p1.name, planet2: p2.name, aspectType: aspect, orb });
          break;
        }
      }
    }
  }

  // Most exact aspects first
  return results.sort((a, b) => a.orb - b.orb).slice(0, limit);
}

// ── QuantumMelodic prompt builder ─────────────────────────────────────────────

interface MusicSpec {
  prompt: string;
  key: string;
  mode: string;
  tempo: number;
}

function buildQMPrompt(
  req: RequestBody,
  qmSigns: QMSign[],
  qmPlanets: QMPlanet[],
  qmAspects: QMAspect[],
): MusicSpec {
  const { sunSign, moonSign, ascendant, planets } = req;

  const sunSignData = qmSigns.find(s => s.name === sunSign);
  const moonSignData = qmSigns.find(s => s.name === moonSign);
  const ascSignData = ascendant ? qmSigns.find(s => s.name === ascendant) : null;

  // ── Dominant element from full planet list ──
  const elementCounts: Record<string, number> = {};
  if (planets?.length) {
    planets.forEach(p => {
      const sd = qmSigns.find(s => s.name === p.sign);
      if (sd?.element) elementCounts[sd.element] = (elementCounts[sd.element] || 0) + 1;
    });
  }
  const dominantElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    || sunSignData?.element || 'Fire';

  // ── Average tempo from inner planets ──
  const innerNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
  const tempoSource = planets?.filter(p => innerNames.includes(p.name)) || [];
  const tempos = tempoSource.map(p => qmSigns.find(s => s.name === p.sign)?.tempo_bpm || 90);
  const avgTempo = tempos.length
    ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
    : sunSignData?.tempo_bpm || 90;

  // ── Key and mode from Sun sign (with Ascendant colour if available) ──
  const mode = sunSignData?.musical_mode || 'Dorian';
  const key = sunSignData?.key_signature || 'D minor';
  const texture = sunSignData?.texture || 'intimate, dry, close-mic recorded';
  const emotionalQuality = sunSignData?.emotional_quality || 'mysterious';
  const moonEmotion = moonSignData?.emotional_quality || '';
  const ascPalette = ascSignData?.sonic_palette || '';

  // ── Planetary voices → translated to piano technique/register ──
  // Each QM archetype maps to a specific way of playing the piano — register,
  // touch, articulation — rather than a separate instrument.
  const PIANO_VOICE_MAP: Record<string, string> = {
    Sun:     'singing middle-register piano line (warm, legato, unashamed)',
    Moon:    'expressive inner-voice piano — left-hand cantabile melody, emotional undertow',
    Mercury: 'nimble right-hand piano figures — staccato, quick intervallic leaps, articulate',
    Venus:   'lush, sustained piano chord voicings — pedal-heavy, rings past its welcome',
    Mars:    'percussive left-hand piano stabs — sharp attack, rhythmic, emphatic',
  };
  const primaryVoices: string[] = [];
  const vocalPlanets = ['Sun', 'Moon', 'Venus', 'Mars', 'Mercury'];
  for (const pName of vocalPlanets) {
    const pos = planets?.find(p => p.name === pName);
    const qmP = qmPlanets.find(p => p.name === pName);
    if (qmP) {
      const signLabel = pos ? ` in ${pos.sign}` : '';
      const retroLabel = pos?.isRetrograde ? ' ℞' : '';
      const pianoVoice = PIANO_VOICE_MAP[pName] || `piano (${qmP.sonic_character} quality)`;
      primaryVoices.push(`${pianoVoice} [${pName}${signLabel}${retroLabel}]`);
    }
  }

  // ── Outer planet colours ──
  const outerColors: string[] = [];
  for (const pName of ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']) {
    const qmP = qmPlanets.find(p => p.name === pName);
    if (qmP) outerColors.push(qmP.sonic_character);
  }

  // ── Top aspects → harmonic narrative ──
  const topAspects = planets?.length ? calculateTopAspects(planets, qmAspects, 4) : [];
  const aspectNarrative = topAspects.length
    ? topAspects.map(a =>
        `${a.planet1}–${a.planet2} ${a.aspectType.name} (${a.aspectType.harmonic_interval}): ${a.aspectType.sonic_expression}`
      ).join('; ')
    : 'fluid harmonic movement throughout';

  // ── Element sonic descriptions — all piano technique ──
  const elementSound: Record<string, string> = {
    Fire: 'restless, driving piano — sharp left-hand stabs, percussive attack, quick right-hand runs, bright upper-register flurries',
    Earth: 'deliberate, weighted piano — low-register gravitas, slow harmonic movement, long sustain-pedal resonance, chords that arrive a beat late on purpose',
    Air: 'light mercurial piano — quick intervallic leaps, open-voiced quartal chords, staccato brightness, voices darting between registers',
    Water: 'introspective piano with inner-voice movement — harmonic ambiguity, suspended chords refusing to resolve, pedaled overtone clouds, melody submerged beneath the accompaniment',
  };

  // ── Retrograde colouring ──
  const retrogrades = planets?.filter(p => p.isRetrograde && p.name !== 'Ascendant') || [];
  const retroNote = retrogrades.length
    ? `Retrograde planets (${retrogrades.map(p => p.name).join(', ')}) add introspective, inverted harmonic tension.`
    : '';

  // ── Assemble prompt ──
  // Style header comes FIRST so it survives any truncation — chart data follows
  const styleHeader = `Instrumental piano composition — NO vocals, NO lyrics, NO sung melody, NO voice of any kind whatsoever. The piano is the ONLY lead voice and primary instrument throughout. Style: avant-garde solo/chamber piano — acoustic, felt-muted, prepared-piano techniques (plucked strings, muted clusters, objects on strings), and open-pedal resonance all in play. HARD NO to: flutes, harps, choir, orchestral pads, wind chimes, cinematic swells, spa ambience, reiki, fantasy soundtrack, or any non-piano lead. Sparse texture only: dry or reverbed acoustic piano leads; minimal accompaniment — subtle experimental percussion (bowed metal, finger-drummed body), distant cello drone or bass pluck only as shadowy undertone. Aesthetic references: Chilly Gonzales solo piano, Philip Glass études, Haushka prepared piano, Tori Amos deconstructed piano, Johann Johannsson chamber restraint. Tell the natal chart's story through the piano: let the harmonic data below shape the actual notes, dissonances, textures, and emotional arc. Through-composed, rhythmically alive, emotionally specific, strange and beautiful.`;
  const parts = [
    styleHeader,
    `STRICT TONAL SPEC — obey exactly: tonic/key centre is ${key}; scale/mode is ${mode}; tempo is ${avgTempo} BPM steady. Open on the tonic of ${key}, cadence back to it, and keep ${mode} as the governing scale. Do not transpose to another key and do not drift from ${avgTempo} BPM.`,
    primaryVoices.length ? `Voices: ${primaryVoices.join(', ')}.` : '',
    `Dominant element (${dominantElement}): ${elementSound[dominantElement] || 'expressive tones'}.`,
    `Texture: ${texture}. Emotional quality: ${emotionalQuality}${moonEmotion && moonEmotion !== emotionalQuality ? ', ' + moonEmotion : ''}.`,
    ascPalette ? `Ascendant palette: ${ascPalette}.` : '',
    `Aspects: ${aspectNarrative}.`,
    retroNote,
    outerColors.length ? `Outer planet colors: ${outerColors.slice(0, 2).join(', ')}.` : '',
    `Piano techniques in play: prepared piano clusters, muted-string plucks, pedal shimmer, chromatic voice-leading, quartal voicings, unresolved suspensions, modal interchange. Let the chart data determine where the piece breathes, tenses, and releases. Keep it avant-garde, specific, strange, and emotionally alive.`,
  ].filter(Boolean);

  const prompt = parts.join(' ');

  // ElevenLabs music API — 1500 char ceiling; style header is front-loaded so prohibitions survive any trim
  const MAX_PROMPT_LENGTH = 1500;
  const trimmed = prompt.length > MAX_PROMPT_LENGTH ? prompt.substring(0, MAX_PROMPT_LENGTH - 3) + '...' : prompt;
  return { prompt: trimmed, key, mode, tempo: avgTempo };
}

// ── Fallback prompt (when QM data unavailable) ────────────────────────────────

const fallbackModes: Record<string, { mode: string; mood: string; key: string; bpm: number }> = {
  'Aries': { mode: 'Phrygian', mood: 'fierce, energetic, bold', key: 'A minor', bpm: 140 },
  'Taurus': { mode: 'Ionian', mood: 'grounded, sensual, luxurious', key: 'F major', bpm: 72 },
  'Gemini': { mode: 'Mixolydian', mood: 'playful, curious, mercurial', key: 'G major', bpm: 120 },
  'Cancer': { mode: 'Aeolian', mood: 'nurturing, emotional, nostalgic', key: 'A minor', bpm: 66 },
  'Leo': { mode: 'Lydian', mood: 'majestic, radiant, theatrical', key: 'D major', bpm: 108 },
  'Virgo': { mode: 'Dorian', mood: 'precise, analytical, ethereal', key: 'D minor', bpm: 96 },
  'Libra': { mode: 'Ionian', mood: 'harmonious, balanced, elegant', key: 'Bb major', bpm: 88 },
  'Scorpio': { mode: 'Locrian', mood: 'intense, mysterious, transformative', key: 'B locrian', bpm: 76 },
  'Sagittarius': { mode: 'Mixolydian', mood: 'adventurous, expansive, optimistic', key: 'E major', bpm: 132 },
  'Capricorn': { mode: 'Dorian', mood: 'structured, ambitious, timeless', key: 'C minor', bpm: 84 },
  'Aquarius': { mode: 'Lydian', mood: 'innovative, eccentric, futuristic', key: 'F# major', bpm: 116 },
  'Pisces': { mode: 'Phrygian', mood: 'dreamy, spiritual, otherworldly', key: 'E phrygian', bpm: 60 },
};

function buildFallbackPrompt(sunSign: string, moonSign: string): MusicSpec {
  const sun = fallbackModes[sunSign] || fallbackModes['Leo'];
  const moon = fallbackModes[moonSign] || fallbackModes['Cancer'];
  const bpm = Math.round((sun.bpm + moon.bpm) / 2);
  const prompt = `Instrumental piano composition — NO vocals, NO lyrics, NO voice of any kind. Piano is the ONLY lead instrument. Style: avant-garde solo/chamber piano — acoustic, felt-muted, prepared-piano techniques, and open-pedal resonance. HARD NO to: flutes, harps, choir, orchestral pads, wind chimes, cinematic swells, spa, fantasy soundtrack. Sparse texture: dry or reverbed acoustic piano leads; minimal experimental percussion and distant cello drone as shadow only. References: Chilly Gonzales solo piano, Philip Glass études, Haushka prepared piano, Tori Amos deconstructed piano. STRICT TONAL SPEC — obey exactly: tonic/key centre is ${sun.key}; governing scale/mode is ${sun.mode} coloured by ${moon.mode}; tempo is ${bpm} BPM steady. Open on the tonic of ${sun.key} and cadence back to it; do not transpose and do not drift from ${bpm} BPM. Emotionally ${sun.mood} + ${moon.mood}. Through-composed, rhythmically alive, emotionally specific, strange and beautiful. Tell the natal chart's story through the piano alone.`;
  return { prompt, key: sun.key, mode: sun.mode, tempo: bpm };
}


// ── Main handler ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Music generation is currently unavailable', unavailable: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateRequest(rawData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Music generation is free for all users — no auth or unlock check required.

    const { sunSign, moonSign } = validation.data;

    // ── Attempt to fetch QuantumMelodic translation data ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    let spec: MusicSpec;
    // Track which data source was used for the X-QM-Enhanced response header
    let promptSource: 'qm-tables' | 'fallback-tables' | 'fallback-prompt' = 'fallback-prompt';

    if (supabaseUrl && supabaseKey) {
      try {
        console.log('Fetching QuantumMelodic translation tables (with fallbacks)...');
        // Try qm_* tables first; if empty, try the user's actual table names.
        // "zodiac signs" (with space) is URL-encoded automatically by fetchTableByName.
        const [signsResult, planetsResult, aspectsResult] = await Promise.all([
          fetchTableWithFallback<QMSign>(supabaseUrl, supabaseKey, [...SIGN_TABLE_NAMES]),
          fetchTableWithFallback<QMPlanet>(supabaseUrl, supabaseKey, [...PLANET_TABLE_NAMES]),
          fetchTableWithFallback<QMAspect>(supabaseUrl, supabaseKey, [...ASPECT_TABLE_NAMES]),
        ]);

        const qmSigns = signsResult.data;
        const qmPlanets = planetsResult.data;
        const qmAspects = aspectsResult.data;

        if (qmSigns.length > 0 && qmPlanets.length > 0) {
          spec = buildQMPrompt(validation.data, qmSigns, qmPlanets, qmAspects);
          // Determine if we used the primary qm_* tables or the fallback names
          const usedPrimary =
            signsResult.tableUsed === 'qm_signs' && planetsResult.tableUsed === 'qm_planets';
          promptSource = usedPrimary ? 'qm-tables' : 'fallback-tables';
          console.log(`Built QuantumMelodic prompt via ${promptSource}. Length:`, spec.prompt.length);
        } else {
          console.warn('All sign/planet table attempts returned 0 rows — using fallback prompt');
          spec = buildFallbackPrompt(sunSign, moonSign);
        }
      } catch (dbErr) {
        console.warn('QM DB fetch failed, using fallback prompt:', dbErr);
        spec = buildFallbackPrompt(sunSign, moonSign);
      }
    } else {
      console.warn('Supabase env vars missing — using fallback prompt');
      spec = buildFallbackPrompt(sunSign, moonSign);
    }

    const prompt = spec.prompt;
    console.log('Final music prompt:', prompt);

    // ── Call ElevenLabs Music API ──
    const response = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, music_length_ms: 135000 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);

      if (response.status === 429 || response.status === 402) {
        const fallback =
          response.status === 429
            ? 'Rate limited. Please try again in a moment.'
            : 'Music generation is temporarily unavailable.';
        return new Response(
          JSON.stringify({
            unavailable: true,
            error: fallback,
            status: response.status,
            retryAfter: response.status === 429 ? 30 : undefined,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Unable to generate music. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('Music generated successfully, size:', audioBuffer.byteLength, 'bytes');

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-Sun-Sign': sunSign,
        'X-Moon-Sign': moonSign,
        'X-Key': spec.key,
        'X-Mode': spec.mode,
        'X-Tempo': String(spec.tempo),
        'X-QM-Enhanced': promptSource,
      },
    });

  } catch (error) {
    console.error('Error generating music:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to generate music. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
