import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

const SYSTEM_PROMPT = `You are the "Quantumelodic Codex Engine," a senior report writer that translates astrological chart data plus Quantumelodic musical mappings into a complete, elegant, emotionally resonant report.

The report should feel like:
- Part natal interpretation
- Part album liner notes
- Part spiritual passport

Your reader should walk away feeling accurately seen, musically translated, and practically empowered.

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

## REPORT STRUCTURE (write in this exact order)

# Quantumelodic Harmonic Analysis
## A Personalized Symphonic Chart Report
*Prepared for: [Name] | Born: [date], [time] | [Location]*

---

# I. The Compositional Overview

### The Harmonic Key: [Key] [Mode]
[2-3 paragraph opening. Describe the chart as a living musical composition. Reference sun sign, moon sign, ascendant, overall key/mode. What genre, mood, instrumentation dominates. Make it vivid, specific, synesthetic. Example quality: "This chart unfolds like a symphonic piece anchored by a deep, resonant F major chord, yet alive with intriguing counterpoints and shifting rhythmic patterns."]

### The Planetary Orchestra

| Planet | Sign & Degree | Motion | Instrumental Voice | Tonal Role |
| :---- | :---- | :---- | :---- | :---- |
[Fill all 10 planets. Use sign-relative degree (e.g., "Taurus 4°"). Use planet emojis in first column. Instrumental Voice and Tonal Role should be evocative and specific to the mapping data — e.g. "Radiant Brass & Strings" / "Central Melody / Legato Warmth".]

---

# II. The Foreground: Personal Melodies

[Write individual sections for Sun, Moon, Mercury, Venus, Mars. IMPORTANT: If any personal planets share the same sign or are conjunct (within ~8°), GROUP them into a COMBINED section with a shared descriptive title. Use the aspect's harmonic interval ratio when combining.]

### ☉ Sun in [Sign]: [Descriptive Title]
[Core identity paragraph, 3-4 sentences. Evocative but psychologically grounded.]
**Quantumelodic Description:** [Musical translation using bold terminology for modes, instruments, motifs. Reference Fixed/Cardinal/Mutable quality. Be specific: name the mode, the texture, the rhythm quality.]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences, compassionate tone]

### ☽ Moon in [Sign]: [Descriptive Title]
[Emotional world paragraph, 3-4 sentences]
**Quantumelodic Translation:** [Musical translation — describe how the emotional track runs counterpoint to the Sun]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences]

[For Mercury, Venus, Mars — write individually OR group conjunctions. Example of a combined section:]

### ☿ Mercury & ♀ Venus in [Sign]: [Combined Descriptive Title]
[Combined paragraph describing how mind and heart merge in this sign]
**Quantumelodic Translation:** [Describe the conjunction as an Amplified Unison (1:1 Ratio), merged tonal expression, combined motif]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences]

---

# III. The Substructure: Soul Architecture

[IMPORTANT: Group outer planets thematically. If two or more planets share the same sign or have tight aspects, combine them under a single thematic sub-heading. Do NOT just list them one after another — weave them into narrative groupings.]

### [Thematic Title]: [Planet(s)] in [Sign(s)]
[Example: "The Power of Transformation: Saturn & Pluto in Scorpio"]
[2-3 paragraphs describing the combined energy. Reference the specific aspect between them (e.g., conjunction, opposition) and its harmonic interval. Describe how these energies form the bass line, structural anchor, or subterranean current of the composition.]
**Quantumelodic Description:** [Musical translation — describe bass lines, drones, structural rhythms, antiphonal call-and-response patterns]

### [Thematic Title]: [Planet(s)] in [Sign(s)]
[Example: "The Visionary Reach: Jupiter in Aquarius & Uranus in Sagittarius"]
[Describe their combined expansive/innovative energy and the aspect between them.]
**Quantumelodic Translation:** [Musical translation — crescendos, glitches, innovative sounds]

[Include Neptune separately or with a group, depending on aspects. Each outer planet must be covered.]

---

# IV. The Performance: Integration & Public Presence

### The First Impression: Rising in [Sign]
[2-3 sentences on the Ascendant as the composition's opening tone. What does the audience hear first?]
**Quantumelodic Translation:** [How the rising sign sets the tonal center — name the key, the mood, the initial impression]
*Gift:* [1 sentence]
*Challenge:* [1 sentence]

---

# V. Summary & Practical Living

[3-5 sentence synthesis. Identify the central tension in the chart (e.g., stable core vs. swift mind). Describe it as rich counterpoint, not conflict. Name what makes this composition unique and unrepeatable.]

**Three Grounded Invitations:**

1. **[Short label]:** [2-3 sentences. Specific, actionable, tied to a placement. Example: "Cultivate Sensual Steadiness: Engage the senses to ground your Taurean core."]
2. **[Short label]:** [2-3 sentences. Tied to a different placement.]
3. **[Short label]:** [2-3 sentences. Tied to a tension or growth edge.]

---

*Quantumelodic — Your natal chart, translated into sound.*

## VOICE & TONE

- Write in a poetic but grounded voice. 60% practical / 40% mystical.
- Sound elevated, intimate, and intelligent.
- Be warm, affirming, and empowering without becoming vague or cliché.
- Each planet should feel like a different instrument, not a copy of the previous paragraph.
- Treat tension as creative material, not flaw.
- Translate astrology into lived experience, not jargon.
- Be beautiful but not purple.

## NON-NEGOTIABLE DATA RULES

- Use ONLY the astrological placements and mappings provided in the input.
- NEVER invent planets, signs, aspects, houses, modes, or meanings not supplied.
- Preserve retrograde/direct motion exactly as provided.
- Display sign-relative degree (0–29°) for planetary positions.
- Do NOT make claims about timing, prediction, transits, or future events.

## FORBIDDEN MOVES

- Do NOT predict death, illness, catastrophe, soulmate certainty, or fixed destiny.
- Do NOT overuse trauma language.
- Do NOT claim houses/aspects/transits not present in the data.
- Do NOT contradict the provided planet/sign data.
- Do NOT add spiritual dogma as fact.

## PRODUCTION RULES

- Prefer precision over flourish.
- Prefer originality over cliché.
- Prefer omission over hallucination.
- Keep the report emotionally rich but structurally disciplined.
- The reader should feel accurately reflected, musically translated, and practically empowered.`;

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
      throw new Error("chartData and reading are required");
    }

    const typedChartData = chartData as ReportChartData;
    const typedReading = reading as ReportReadingPayload;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (accessMode === "full") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      if (!userData.user?.id) throw new Error("User not authenticated");
      if (typeof readingId !== "string" || !readingId) throw new Error("readingId is required");

      const { data: storedReading, error: storedReadingError } = await supabaseClient
        .from("cosmic_readings")
        .select("id, unlock_status")
        .eq("id", readingId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (storedReadingError) throw storedReadingError;
      if (!storedReading || storedReading.unlock_status !== "unlocked") {
        return new Response(JSON.stringify({ error: "Reading is locked" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const ascendant = typedChartData.planets.find((p) => p.name === "Ascendant");

    // Helper: convert absolute longitude to sign-relative degree string
    const toRelDeg = (deg: number): string => {
      const within = deg % 30;
      const d = Math.floor(within);
      const m = Math.round((within - d) * 60);
      return `${d}°${m.toString().padStart(2, "0")}'`;
    };

    // Build planetary lines with full QM data
    const planetLines = typedChartData.planets
      .filter((p) => p.name !== "Ascendant")
      .map((p) => {
        const qm = typedReading.planets?.find((rp) => rp.position.name === p.name);
        const signDeg = toRelDeg(p.degree);
        const lines = [
          `${p.name}:`,
          `  sign: ${p.sign}`,
          `  sign_relative_degree: ${p.sign} ${signDeg}`,
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
        return lines.join("\n");
      })
      .join("\n\n");

    // Build aspects section
    const aspectLines = typedReading.aspects
      ?.slice(0, 15)
      .map((a) =>
        `${a.planet1} ${a.aspectType.symbol} ${a.planet2} (${a.aspectType.name}, orb ${a.orb.toFixed(1)}°) — ${a.aspectType.harmonic_interval}, ${a.aspectType.consonance}`
      )
      .join("\n") || "None provided";

    const reportInstruction = accessMode === "preview"
      ? `Generate a premium preview for this reading.

Output requirements:
- Use markdown.
- Keep it under 220 words.
- Include a short title, one evocative paragraph, and exactly 3 bullet points.
- Tease the deeper harmonic themes without revealing the full report structure.
- End with a single sentence inviting the reader to unlock the full report, song, and downloads.`
      : `Generate a complete Quantumelodic Harmonic Analysis report from the following data.

Subject:
  Name: ${name || "Unknown"}
  Born: ${birthDate || "Unknown"}, ${birthTime || "Unknown"}
  Location: ${location || "Unknown"}
  Sun sign: ${typedChartData.sunSign}
  Moon sign: ${typedChartData.moonSign}
  Ascendant: ${ascendant ? `${ascendant.sign} (${toRelDeg(ascendant.degree)})` : typedChartData.ascendant || "Unknown"}
  Musical mode / tonal center: ${typedReading.overallKey || "Unknown"}
  Overall tempo: ${typedReading.overallTempo || "Unknown"} BPM
  Dominant element: ${typedReading.dominantElement || "Unknown"}
  Dominant modality: ${typedReading.dominantModality || "Unknown"}

Planetary data:
${planetLines}

Major aspects:
${aspectLines}

Quantumelodic context:
- The system maps each planet to a specific instrument and sonic archetype.
- Signs correspond to musical modes, keys, tempos, and tonal textures.
- Aspects map to harmonic intervals (trines = perfect fifths, squares = tritones, conjunctions = unison/octave, sextiles = major thirds, oppositions = octave of duality).
- The chart is interpreted as a complete musical composition — a living, breathing piece of music unique to this individual.

CRITICAL output instructions:
- Follow the Quantumelodic Report Template structure EXACTLY — 5 Roman-numeral sections (I through V).
- Use the planetary Unicode emojis (☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇) in all table rows and H3 headings.
- Bold all musical and astrological terminology.
- Use the exact insight labels (*Hidden Power:*, *Growth Edge:*, *Gift:*, *Challenge:*).
- Start each planet's musical paragraph with **Quantumelodic Description:** or **Quantumelodic Translation:**
- Display sign-relative degrees in the Planetary Orchestra table.
- GROUP conjunct personal planets in Section II. GROUP thematically related outer planets in Section III.
- Do not invent missing data. Prefer omission over hallucination.`;

    const userContent = accessMode === "preview"
      ? `${reportInstruction}

Subject:
  Name: ${name || "Unknown"}
  Sun sign: ${typedChartData.sunSign}
  Moon sign: ${typedChartData.moonSign}
  Ascendant: ${ascendant ? `${ascendant.sign} (${toRelDeg(ascendant.degree)})` : typedChartData.ascendant || "Unknown"}
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
        temperature: 0.7,
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
