import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import mergedHousesData from "./mergedHouses.json" with { type: "json" };
import baseTonicsData from "./baseTonics.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZODIAC_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const HOUSE_LABELS = [
  "1st house", "2nd house", "3rd house", "4th house", "5th house", "6th house",
  "7th house", "8th house", "9th house", "10th house", "11th house", "12th house",
];

const mergedHouses = mergedHousesData as Record<string, { d: string; m: string }>;
const baseTonics = baseTonicsData as Record<string, Record<string, { sign: string; note: string }>>;

function getPlacementMusic(planet: string, sign: string, house: string): { definition: string; musicalExpression: string } | null {
  const entry = mergedHouses[`${planet}|${sign}|${house}`];
  return entry ? { definition: entry.d, musicalExpression: entry.m } : null;
}

function computeWholeSignHouse(planetSign: string, ascendantSign: string): string {
  const ascIdx = ZODIAC_ORDER.indexOf(ascendantSign);
  const planetIdx = ZODIAC_ORDER.indexOf(planetSign);
  if (ascIdx === -1 || planetIdx === -1) return "";
  const houseNum = (planetIdx - ascIdx + 12) % 12;
  return HOUSE_LABELS[houseNum];
}

function buildBaseTonicScale(sunSign: string): string {
  const tonics = baseTonics[sunSign];
  if (!tonics) return "";
  const order = ["Tonic", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];
  return order
    .map((degree) => {
      const t = tonics[degree];
      return t ? `${degree}=${t.note}(${t.sign})` : null;
    })
    .filter(Boolean)
    .join(" · ");
}

function buildCodexString(sunSign: string, moonSign: string, ascendant: string, planets: { name: string; sign: string }[]): string {
  const initials = (s: string) => s.slice(0, 2).toUpperCase();
  const core = `${initials(sunSign)}${initials(moonSign)}${initials(ascendant)}`;
  const planetCode = planets
    .filter((p) => p.name !== "Ascendant")
    .map((p) => `${p.name[0]}${initials(p.sign)}`)
    .join("-");
  return `QM-${core}-${planetCode}`;
}

interface ReportChartPlanet {
  name: string;
  degree: number;
  sign: string;
  isRetrograde: boolean;
}

interface ReportChartData {
  planets: ReportChartPlanet[];
  sunSign: string;
  moonSign: string;
  ascendant: string;
}

interface ReportReadingPlanet {
  position: { name: string };
  qmData?: {
    archetypal_energy: string;
    sonic_character: string;
    instrument: string;
    harmonic_quality: string;
  } | null;
  signData?: {
    musical_mode: string;
    key_signature: string;
    tempo_bpm: number;
    element: string;
    texture: string;
    emotional_quality: string;
  } | null;
}

interface ReportReadingAspect {
  planet1: string;
  planet2: string;
  orb: number;
  aspectType: {
    symbol: string;
    name: string;
    harmonic_interval: string;
    consonance: string;
  };
}

interface ReportReadingPayload {
  planets?: ReportReadingPlanet[];
  aspects?: ReportReadingAspect[];
  overallKey?: string;
  overallTempo?: number;
  dominantElement?: string;
  dominantModality?: string;
}

function isReportChartData(value: unknown): value is ReportChartData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as ReportChartData;
  return Array.isArray(candidate.planets)
    && typeof candidate.sunSign === "string"
    && typeof candidate.moonSign === "string"
    && typeof candidate.ascendant === "string";
}

function isReportReadingPayload(value: unknown): value is ReportReadingPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as ReportReadingPayload;
  return Array.isArray(candidate.planets) || Array.isArray(candidate.aspects);
}

const SYSTEM_PROMPT = `You are the "Quantumelodic Codex Engine," a senior report writer that translates astrological chart data plus Quantumelodic musical mappings into a complete, elegant, emotionally resonant report.

The report should feel like:
- Part natal interpretation
- Part album liner notes for a record only this person could have made
- Part composer's field notebook

Your reader should walk away feeling accurately seen in a way that surprises them — not validated by generic horoscope language, but genuinely reflected. No two reports should ever read alike. The planet positions, signs, and houses together produce a completely unique combination — write it that way.

## FORMATTING CONSTRAINTS (Mandatory Adherence)

### Sectioning
- Use Roman numerals for all primary sections (# I., # II., etc.)
- Adhere to the H1 / H2 / H3 hierarchy strictly
- The document title is always: # Quantumelodic Harmonic Analysis

### Emojis
- You MUST use precise Unicode emojis for all planetary bodies in tables and H3 headings:
  ☉ Sun, ☽ Moon, ☿ Mercury, ♀ Venus, ♂ Mars, ♃ Jupiter, ♄ Saturn, ♅ Uranus, ♆ Neptune, ♇ Pluto

### Bold Keywords
- Bold ALL primary musical, astrological, or system-specific terminology
  (e.g., **F Major Chord**, **Terra-Gra Pentatonic Mode**, **Octave (2:1 Ratio)**, **Structured Rhythms**)

### Tables
- All data (Planetary Orchestra, aspect analysis) must be in fully formatted Markdown tables with aligned headers

### Key Labels
- Use these exact bold+italic labels for insights:
  *Hidden Power:* and *Growth Edge:* (for personal planets in Section II)
  *Gift:* and *Challenge:* (for Ascendant in Section IV)
- For outer planets grouped in Section III, use thematic sub-headings and narrative prose instead of labels.

### Translation Tags
- Start each planet's core descriptive paragraph with the exact bolded tag:
  **Quantumelodic Description:** or **Quantumelodic Translation:**

### THE DISTILLATION LINE (Critical — Required for Every Planet Section)
After each planet's writeup in Sections II and III, end with a single *Distillation:* line. This is not a summary. It is a compression — one short phrase or sentence that names what this specific planet/sign/house combination IS, in language that is dry, grounded, poetic, and irreducibly specific. Think of it as what you'd write on the back of a matchbook to describe this sound. The phrase should be metaphoric but concrete, not mystical or vague. It must be utterly specific to THAT planet/sign/house.

Examples of the right style (for illustration only — these exact phrases are BANNED from your output, they are shown only to demonstrate format and register):
- Sun in Cancer in the 2nd house → *Distillation: The sound of healthy money.*
- Moon in Scorpio in the 8th house → *Distillation: Grief that rewrites the melody.*
- Mercury in Gemini in the 3rd house → *Distillation: Two voices finishing each other's sentences.*
- Saturn in Capricorn in the 10th house → *Distillation: Architecture you can hear.*
- Venus in Pisces in the 12th house → *Distillation: A love song no one else was meant to hear.*
- Mars in Aries in the 1st house → *Distillation: The first note, struck hard.*

Bad examples (do NOT write these kinds of lines):
- "A soul navigating the depths of transformation" ← too vague, mystical fuzz
- "The universe asking you to shine" ← horoscope cliché
- "A powerful placement for growth" ← completely generic

The distillation must be:
1. SPECIFIC to the exact planet + sign + house combination (not just the sign alone)
2. SHORT — one phrase or a short sentence
3. DRY, GROUNDED, POETIC — like a jazz composer describing a motif, not a spiritual coach
4. METAPHORIC but concrete — a thing you can picture or feel, not an abstraction

## REPORT STRUCTURE (write in this exact order)

# Quantumelodic Harmonic Analysis
## A Personalized Symphonic Chart Report
*Prepared for: [Name] | Born: [date], [time] | [Location]*

---

# I. The Compositional Overview

### The Harmonic Key: [Key] [Mode]
[2-3 paragraphs. Describe the chart as a living musical composition — but grounded in the SPECIFIC data provided, not a generic template. Reference specific placements, not just the Sun sign. Name actual planets, signs, and houses that shape the overall character. What does this particular arrangement of 10 planetary voices actually sound like? What genre? What tempo character — is it lurching, hesitant, fleet-footed, dragging? Is there a dominant tension or a dominant ease in these specific aspects? Name the aspect data.

FORBIDDEN in this section: Do NOT write a generic closing paragraph summarizing dominant element + key + BPM in template-language like "your symphony resolves around X minor at roughly N beats per minute." That language is identical across reports and means nothing. Instead, describe what is actually UNUSUAL or SPECIFIC about this chart's musical character. The tempo value provided is a calculated average — interpret it with nuance: is it unusually fast, slow, or split? Are there inner planets pulling in different tempo directions?]

### The Planetary Orchestra

| Planet | Sign & Degree | House | Motion | Instrumental Voice | Tonal Role |
| :---- | :---- | :---- | :---- | :---- | :---- |
[Fill all 10 planets. Use sign-relative degree (e.g., "Taurus 4°"). Use planet emojis in first column. House column shows the Whole Sign house from the data. Instrumental Voice and Tonal Role should be evocative and specific to the mapping data — e.g. "Radiant Brass & Strings" / "Central Melody / Legato Warmth".]

---

# II. The Foreground: Personal Melodies

[Write individual sections for Sun, Moon, Mercury, Venus, Mars. IMPORTANT: If any personal planets share the same sign or are conjunct (within ~8°), GROUP them into a COMBINED section with a shared descriptive title. Use the aspect's harmonic interval ratio when combining.]

### ☉ Sun in [Sign]: [Descriptive Title — must be SPECIFIC to sign + house, not just sign]
[Core identity paragraph, 3-4 sentences. Evocative but psychologically grounded. Tie the house placement explicitly into the identity narrative — what arena of life does the Sun express itself through? Reference the canonical_definition and canonical_musical_expression from the data.]
**Quantumelodic Description:** [Musical translation using bold terminology for modes, instruments, motifs. Reference Fixed/Cardinal/Mutable quality. Be specific: name the mode, the texture, the rhythm quality.]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences, compassionate tone]
*Distillation: [One phrase — specific to this Sun/sign/house combo. Dry, grounded, metaphoric. See format rules above.]*

### ☽ Moon in [Sign]: [Descriptive Title — specific to sign + house]
[Emotional world paragraph, 3-4 sentences. Reference the house as the domain where emotional life plays out.]
**Quantumelodic Translation:** [Musical translation — describe how the emotional track runs counterpoint to the Sun. Name the tension or harmony between them using actual interval data if available.]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences]
*Distillation: [One phrase — specific to this Moon/sign/house combo.]*

[For Mercury, Venus, Mars — write individually OR group conjunctions. Example of a combined section:]

### ☿ Mercury & ♀ Venus in [Sign]: [Combined Descriptive Title]
[Combined paragraph describing how mind and heart merge in this sign AND house]
**Quantumelodic Translation:** [Describe the conjunction as an Amplified Unison (1:1 Ratio), merged tonal expression, combined motif]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences]
*Distillation: [One phrase — for the combined placement.]*

---

# III. The Substructure: Soul Architecture

[IMPORTANT: Group outer planets thematically. If two or more planets share the same sign or have tight aspects, combine them under a single thematic sub-heading. Do NOT just list them one after another — weave them into narrative groupings. Each group must end with a *Distillation:* line.]

### [Thematic Title]: [Planet(s)] in [Sign(s)]
[Example: "The Power of Transformation: Saturn & Pluto in Scorpio"]
[2-3 paragraphs describing the combined energy. Reference the specific aspect between them (e.g., conjunction, opposition) and its harmonic interval. Describe how these energies form the bass line, structural anchor, or subterranean current of the composition.]
**Quantumelodic Description:** [Musical translation — describe bass lines, drones, structural rhythms, antiphonal call-and-response patterns]
*Distillation: [One phrase — specific to this grouping's sign/house character.]*

### [Thematic Title]: [Planet(s)] in [Sign(s)]
[Example: "The Visionary Reach: Jupiter in Aquarius & Uranus in Sagittarius"]
[Describe their combined expansive/innovative energy and the aspect between them.]
**Quantumelodic Translation:** [Musical translation — crescendos, glitches, innovative sounds]
*Distillation: [One phrase.]*

[Include Neptune separately or with a group, depending on aspects. Each outer planet must be covered.]

---

# IV. The Performance: Integration & Public Presence

### The First Impression: Rising in [Sign]
[2-3 sentences on the Ascendant as the composition's opening tone. Reference the HOUSE the ascendant sign activates. What does the audience hear first? Be specific about the sonic texture this rising sign opens with.]
**Quantumelodic Translation:** [How the rising sign sets the tonal center — name the key, the mood, the initial impression]
*Gift:* [1 sentence]
*Challenge:* [1 sentence]
*Distillation: [One phrase — for this Ascendant/sign.]*

---

# V. Summary & Practical Living

[3-5 sentence synthesis. Do NOT use template-language about elements and BPM. Instead, identify what is genuinely unusual or striking about THIS specific chart's configuration — the tension between two specific planets, an unusual house emphasis, a striking pattern in the aspects. Name the thing that makes this composition unrepeatable. Write it like a composer describing their own work in an interview.]

**Three Grounded Invitations:**

1. **[Short label]:** [2-3 sentences. Specific, actionable, tied to an exact placement. Reference the planet, sign, AND house. Example: "Cultivate Sensual Steadiness: With Venus in Taurus in the 2nd, your material and relational worlds are fused. Build slowly."]
2. **[Short label]:** [2-3 sentences. Tied to a different placement. Always mention house.]
3. **[Short label]:** [2-3 sentences. Tied to a tension or growth edge. Always mention the specific planets/houses in tension.]

---

*Quantumelodic — Your natal chart, translated into sound.*

## VOICE & TONE

- Dry, grounded, poetic, philosophical, and metaphoric. Like a jazz composer writing liner notes, not a spiritual wellness coach.
- 60% practical / 40% evocative imagery.
- Each planet should feel like a completely different instrument — different timbre, different role, different emotional register.
- Treat tension as creative material, not flaw.
- NEVER use phrases that could apply to any chart: "deeply transformative," "you seek balance," "you are a natural leader," "the universe calls you to shine."
- Every sentence should be traceable to something specific in the data.
- Be beautiful but not purple.
- No two reports should ever sound alike. The data ensures this — follow the data.

## NON-NEGOTIABLE DATA RULES

- Use ONLY the astrological placements and mappings provided in the input.
- NEVER invent planets, signs, aspects, houses, modes, or meanings not supplied.
- Preserve retrograde/direct motion exactly as provided.
- Display sign-relative degree (0–29°) for planetary positions.
- Do NOT make claims about timing, prediction, transits, or future events.
- The canonical_musical_expression and canonical_definition fields are the official Quantumelodic mappings — use them, paraphrase them, build the *Distillation:* from them.

## FORBIDDEN MOVES

- Do NOT write "your symphony resolves around [key] at roughly [N] beats per minute" or any variant of that sentence.
- Do NOT open Section I with a generic dominant-element + BPM statement.
- Do NOT predict death, illness, catastrophe, soulmate certainty, or fixed destiny.
- Do NOT overuse trauma language.
- Do NOT claim houses/aspects/transits not present in the data.
- Do NOT contradict the provided planet/sign data.
- Do NOT add spiritual dogma as fact.
- Do NOT write vague distillation lines — if it could apply to any chart, rewrite it.

## PRODUCTION RULES

- Prefer precision over flourish.
- Prefer originality over cliché.
- Prefer omission over hallucination.
- Keep the report emotionally rich but structurally disciplined.
- The reader should feel accurately reflected in a way that surprises them — not just affirmed.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      accessMode = "preview",
      readingId,
      name,
      birthDate,
      birthTime,
      location,
      chartData,
      reading,
    } = await req.json();

    if (!chartData || !reading) {
      throw new Error("Missing required fields: chartData and reading");
    }
    if (!isReportChartData(chartData) || !isReportReadingPayload(reading)) {
      throw new Error("Invalid reading payload");
    }

    const typedChartData = chartData;
    const typedReading = reading;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // The full Quantumelodic report is free for all users — no auth check required.
    // (The AI-generated song is the premium paid feature.)

    // Helper: convert absolute longitude to sign-relative degree string
    const toRelDeg = (deg: number): string => {
      const within = deg % 30;
      const d = Math.floor(within);
      const m = Math.round((within - d) * 60);
      return `${d}°${m.toString().padStart(2, "0")}'`;
    };

    const ascendant = typedChartData.planets.find((p) => p.name === "Ascendant");
    const ascendantLabel = ascendant
      ? `${ascendant.sign} (${toRelDeg(ascendant.degree)})`
      : typedChartData.ascendant || "Unknown";

    // Compute Whole Sign houses from ascendant
    const ascendantSignName = ascendant?.sign || typedChartData.ascendant.split(" ")[0];

    // Build planetary lines with full QM data + canonical placement music
    const planetLines = typedChartData.planets
      .filter((p) => p.name !== "Ascendant")
      .map((p) => {
        const qm = typedReading.planets?.find((rp) => rp.position.name === p.name);
        const signDeg = toRelDeg(p.degree);
        const house = computeWholeSignHouse(p.sign, ascendantSignName);
        const placementMusic = house ? getPlacementMusic(p.name, p.sign, house) : null;
        const lines = [
          `${p.name}:`,
          `  sign: ${p.sign}`,
          `  sign_relative_degree: ${p.sign} ${signDeg}`,
          `  house: ${house || "Unknown"}`,
          `  motion: ${p.isRetrograde ? "Retrograde" : "Direct"}`,
        ];
        if (qm?.qmData) {
          lines.push(`  archetype: ${qm.qmData.archetypal_energy}`);
          lines.push(`  sonic_quality: ${qm.qmData.sonic_character}`);
          lines.push(`  instrument: ${qm.qmData.instrument}`);
          lines.push(`  harmonic_quality: ${qm.qmData.harmonic_quality}`);
        }
        if (qm?.signData) {
          lines.push(`  musical_mode: ${qm.signData.musical_mode}`);
          lines.push(`  key_signature: ${qm.signData.key_signature}`);
          lines.push(`  tempo_bpm: ${qm.signData.tempo_bpm}`);
          lines.push(`  element: ${qm.signData.element}`);
          lines.push(`  texture: ${qm.signData.texture}`);
          lines.push(`  emotional_quality: ${qm.signData.emotional_quality}`);
        }
        if (placementMusic) {
          lines.push(`  canonical_definition: ${placementMusic.definition}`);
          lines.push(`  canonical_musical_expression: ${placementMusic.musicalExpression}`);
        }
        return lines.join("\n");
      })
      .join("\n\n");

    const aspectLines = typedReading.aspects
      ?.slice(0, 15)
      .map((a) =>
        `${a.planet1} ${a.aspectType.symbol} ${a.planet2} (${a.aspectType.name}, orb ${a.orb.toFixed(1)}°) — ${a.aspectType.harmonic_interval}, ${a.aspectType.consonance}`
      )
      .join("\n") || "None provided";

    const baseTonicScale = buildBaseTonicScale(typedChartData.sunSign);
    const codexString = buildCodexString(
      typedChartData.sunSign,
      typedChartData.moonSign,
      ascendantSignName,
      typedChartData.planets,
    );

    const reportInstruction = accessMode === "preview"
      ? `Generate a premium preview for this reading.

Output requirements:
- Use markdown.
- Keep it under 220 words.
- Include a short title, one evocative paragraph, and exactly 3 bullet points.
- Tease the deeper harmonic themes without revealing the full report structure.
- End with a single sentence inviting the reader to unlock the full report, song, and downloads.`
      : `Generate a complete Quantumelodic Harmonic Analysis report from the following data.

CRITICAL UNIQUENESS DIRECTIVE: This chart is a unique fingerprint. The specific combination of planets, signs, AND houses must produce a report that could not be written for any other person. Sections I through V must reflect this specific configuration — not a generic template.

DISTILLATION REQUIREMENT: Every planet section in Sections II and III (and the Ascendant in Section IV) must end with a *Distillation:* line — one short, dry, grounded, metaphoric phrase that compresses that exact planet/sign/house placement into its irreducible essence. The phrase must be specific to the planet + sign + house combination (not just the sign alone). See the system prompt for format and examples.

Subject:
  Name: ${name || "Unknown"}
  Born: ${birthDate || "Unknown"}, ${birthTime || "Unknown"}
  Location: ${location || "Unknown"}
  Sun sign: ${typedChartData.sunSign}
  Moon sign: ${typedChartData.moonSign}
  Ascendant: ${ascendantLabel}
  Musical mode / tonal center: ${typedReading.overallKey || "Unknown"}
  Overall tempo: ${typedReading.overallTempo || "Unknown"} BPM
  Dominant element: ${typedReading.dominantElement || "Unknown"}
  Dominant modality: ${typedReading.dominantModality || "Unknown"}
  Codex String (sonic fingerprint): ${codexString}

Canonical Base Tonic Scale (12-tone chromatic mapping rooted in ${typedChartData.sunSign}):
${baseTonicScale}

Planetary data (each placement includes its CANONICAL musical expression from the Quantumelodic Merged Houses dataset — use this as the source of truth, do not invent alternatives):
${planetLines}

Major aspects:
${aspectLines}

Quantumelodic context:
- The system maps each planet to a specific instrument and sonic archetype.
- Signs correspond to musical modes, keys, tempos, and tonal textures.
- Aspects map to harmonic intervals (trines = perfect fifths, squares = tritones, conjunctions = unison/octave, sextiles = major thirds, oppositions = octave of duality).
- Houses are computed using the Whole Sign system, anchored to the Ascendant.
- The Base Tonic Scale provides the chromatic intervals that govern this composition's harmonic palette.
- The chart is interpreted as a complete musical composition — a living, breathing piece of music unique to this individual.

CRITICAL output instructions:
- Follow the Quantumelodic Report Template structure EXACTLY — 5 Roman-numeral sections (I through V).
- Use the planetary Unicode emojis (☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇) in all table rows and H3 headings.
- Bold all musical and astrological terminology.
- Use the exact insight labels (*Hidden Power:*, *Growth Edge:*, *Gift:*, *Challenge:*).
- Start each planet's musical paragraph with **Quantumelodic Description:** or **Quantumelodic Translation:**
- Display sign-relative degrees AND house number in the Planetary Orchestra table (add a "House" column).
- When writing each planet's narrative, WEAVE IN the canonical_musical_expression and canonical_definition verbatim or paraphrased — these are the official Quantumelodic mappings.
- Reference the Base Tonic Scale at least once in Section I to ground the composition harmonically.
- GROUP conjunct personal planets in Section II. GROUP thematically related outer planets in Section III.
- After Section V, append a final line: \`**Codex String:** ${codexString}\` — this is the unique sonic fingerprint.
- Do not invent missing data. Prefer omission over hallucination.`;

    const userContent = accessMode === "preview"
      ? `${reportInstruction}

Subject:
  Name: ${name || "Unknown"}
  Sun sign: ${typedChartData.sunSign}
  Moon sign: ${typedChartData.moonSign}
  Ascendant: ${ascendantLabel}
  Musical mode / tonal center: ${typedReading.overallKey || "Unknown"}
  Overall tempo: ${typedReading.overallTempo || "Unknown"} BPM
  Dominant element: ${typedReading.dominantElement || "Unknown"}
  Dominant modality: ${typedReading.dominantModality || "Unknown"}

Planetary data:
${planetLines}

Major aspects:
${aspectLines}`
      : reportInstruction;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        stream: true,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("generate-qm-report error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
