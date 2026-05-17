import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Input validation ──────────────────────────────────────────────────────────

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

function buildQMPrompt(
  req: RequestBody,
  qmSigns: QMSign[],
  qmPlanets: QMPlanet[],
  qmAspects: QMAspect[],
): string {
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
  const texture = sunSignData?.texture || 'ethereal';
  const emotionalQuality = sunSignData?.emotional_quality || 'mysterious';
  const moonEmotion = moonSignData?.emotional_quality || '';
  const ascPalette = ascSignData?.sonic_palette || '';

  // ── Planetary instrumentation (key voices) ──
  const primaryVoices: string[] = [];
  const vocalPlanets = ['Sun', 'Moon', 'Venus', 'Mars', 'Mercury'];
  for (const pName of vocalPlanets) {
    const pos = planets?.find(p => p.name === pName);
    const qmP = qmPlanets.find(p => p.name === pName);
    if (qmP) {
      const signLabel = pos ? ` in ${pos.sign}` : '';
      const retroLabel = pos?.isRetrograde ? ' ℞' : '';
      primaryVoices.push(`${qmP.instrument} (${pName}${signLabel}${retroLabel})`);
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

  // ── Element sonic descriptions ──
  const elementSound: Record<string, string> = {
    Fire: 'fast, initiating, passionate percussion',
    Earth: 'slow, grounded, sustaining bass tones',
    Air: 'light, airy, melodic and connecting',
    Water: 'flowing, emotional, reverb-drenched pads',
  };

  // ── Retrograde colouring ──
  const retrogrades = planets?.filter(p => p.isRetrograde && p.name !== 'Ascendant') || [];
  const retroNote = retrogrades.length
    ? `Retrograde planets (${retrogrades.map(p => p.name).join(', ')}) add introspective, inverted harmonic tension.`
    : '';

  // ── Assemble prompt ──
  const parts = [
    `Compose a ${avgTempo}BPM ${mode} cosmic ambient instrumental in ${key}.`,
    primaryVoices.length ? `Instrumentation: ${primaryVoices.join(', ')}.` : '',
    outerColors.length ? `Outer planet colours: ${outerColors.slice(0, 3).join(', ')}.` : '',
    `Dominant ${dominantElement} element energy: ${elementSound[dominantElement] || 'expressive tones'}.`,
    `Texture: ${texture}. Emotional quality: ${emotionalQuality}${moonEmotion && moonEmotion !== emotionalQuality ? ', ' + moonEmotion : ''}.`,
    ascPalette ? `Ascendant palette: ${ascPalette}.` : '',
    `Harmonic aspects: ${aspectNarrative}.`,
    retroNote,
    `Style: intimate, chamber-scale avant-garde piano music. Solo piano at the center — nuanced, conversational, narrative. Prize inventive melodic lines and unexpected chord progressions (modal interchange, quartal voicings, chromatic mediants, suspended resolutions). Prepared piano textures (felt hammers, muted strings, inside-piano resonances), spare organic percussion (brushed drums, mallets, hand percussion used sparingly as color, NOT as drive), warm cello or string lines, and subtle analog pad shimmer. Reference Chilly Gonzales, Tori Amos, Hauschka, Nils Frahm, Chopin nocturnes, Philip Glass études, Erik Satie. STRICT AVOIDS: no cinematic trailer drops, no cymbal crashes or swells, no heroic film-score climaxes, no four-on-the-floor builds, no orchestral tutti, no epic video-game scoring, no synth supersaws. Dynamics should breathe — many passages stay soft, some meander without resolution, only occasionally swelling and just as often dissolving quietly. Through-composed and exploratory; let melodic ideas develop and digress rather than march toward a payoff.`,
  ].filter(Boolean);

  const prompt = parts.join(' ');

  // ElevenLabs music API — keep under 1000 chars for safety
  return prompt.length > 950 ? prompt.substring(0, 947) + '...' : prompt;
}

// ── Fallback prompt (when QM data unavailable) ────────────────────────────────

const fallbackModes: Record<string, { mode: string; mood: string; tempo: string }> = {
  'Aries': { mode: 'Phrygian', mood: 'fierce, energetic, bold', tempo: 'fast' },
  'Taurus': { mode: 'Ionian', mood: 'grounded, sensual, luxurious', tempo: 'slow' },
  'Gemini': { mode: 'Mixolydian', mood: 'playful, curious, mercurial', tempo: 'upbeat' },
  'Cancer': { mode: 'Aeolian', mood: 'nurturing, emotional, nostalgic', tempo: 'gentle' },
  'Leo': { mode: 'Lydian', mood: 'majestic, radiant, theatrical', tempo: 'moderate' },
  'Virgo': { mode: 'Dorian', mood: 'precise, analytical, ethereal', tempo: 'moderate' },
  'Libra': { mode: 'Ionian', mood: 'harmonious, balanced, elegant', tempo: 'flowing' },
  'Scorpio': { mode: 'Locrian', mood: 'intense, mysterious, transformative', tempo: 'slow' },
  'Sagittarius': { mode: 'Mixolydian', mood: 'adventurous, expansive, optimistic', tempo: 'fast' },
  'Capricorn': { mode: 'Dorian', mood: 'structured, ambitious, timeless', tempo: 'steady' },
  'Aquarius': { mode: 'Lydian', mood: 'innovative, eccentric, futuristic', tempo: 'varied' },
  'Pisces': { mode: 'Phrygian', mood: 'dreamy, spiritual, otherworldly', tempo: 'flowing' },
};

function buildFallbackPrompt(sunSign: string, moonSign: string): string {
  const sun = fallbackModes[sunSign] || fallbackModes['Leo'];
  const moon = fallbackModes[moonSign] || fallbackModes['Cancer'];
  return `Compose an avant-garde, piano-led instrumental in a ${sun.mode} mode at a ${sun.tempo} pace, blending ${sun.mood} energy with ${moon.mood} undertones. Solo piano at the heart — modern, contemporary, expressive, emotive, bold, occasionally dissonant. Include prepared piano textures (felt hammers, muted strings, inside-piano resonances), organic percussion (brushed drums, hand percussion, mallets), warm strings or cello, and subtle analog synth pads or electronic shimmer for a cinematic, noir-modern atmosphere. Reference points: Chilly Gonzales, Tori Amos, Hauschka, Chopin, Philip Glass. Chamber-cinematic, neo-classical, through-composed, orchestral enough to feel "big" while always anchored by the piano voice.`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

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

    let prompt: string;
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
          prompt = buildQMPrompt(validation.data, qmSigns, qmPlanets, qmAspects);
          // Determine if we used the primary qm_* tables or the fallback names
          const usedPrimary =
            signsResult.tableUsed === 'qm_signs' && planetsResult.tableUsed === 'qm_planets';
          promptSource = usedPrimary ? 'qm-tables' : 'fallback-tables';
          console.log(`Built QuantumMelodic prompt via ${promptSource}. Length:`, prompt.length);
        } else {
          console.warn('All sign/planet table attempts returned 0 rows — using fallback prompt');
          prompt = buildFallbackPrompt(sunSign, moonSign);
        }
      } catch (dbErr) {
        console.warn('QM DB fetch failed, using fallback prompt:', dbErr);
        prompt = buildFallbackPrompt(sunSign, moonSign);
      }
    } else {
      console.warn('Supabase env vars missing — using fallback prompt');
      prompt = buildFallbackPrompt(sunSign, moonSign);
    }

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

    // Determine musical mode for header
    const modeForHeader = fallbackModes[sunSign]?.mode || 'Dorian';

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-Sun-Sign': sunSign,
        'X-Moon-Sign': moonSign,
        'X-Mode': modeForHeader,
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
