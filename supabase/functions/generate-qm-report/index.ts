import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the "Quantumelodic Codex Engine," a specialized AI that translates astrological chart data into a premium, structured digital report called the **Quantumelodic Harmonic Analysis**.

Your sole purpose is to format the final analysis according to the strict Quantumelodic Report Template rules below. You must maintain a technical, synesthetic, and mythic tone and use rich Markdown and Unicode emojis extensively.

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
  *Hidden Power:* and *Growth Edge:* (for personal planets)
  *Generational Gift:* and *Activation Path:* (for outer planets)
  *Gift:* and *Challenge:* (for Ascendant)

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
[2-3 paragraph opening. Describe the chart as a living musical composition. Reference sun sign, moon sign, ascendant, overall key/mode. What genre, mood, instrumentation dominates. Make it vivid, specific, synesthetic.]

### The Planetary Orchestra

| Planet | Sign & Degree | Motion | Instrumental Voice | Tonal Role |
| :---- | :---- | :---- | :---- | :---- |
[Fill all 10 planets. Use sign-relative degree (e.g., "Taurus 4°"). Use planet emojis in first column.]

---

# II. The Foreground: Personal Melodies

### ☉ Sun in [Sign]: [Descriptive Title]
[Core identity paragraph, 3-4 sentences]
**Quantumelodic Description:** [Musical translation using bold terminology for modes, instruments, motifs. Reference Fixed/Cardinal/Mutable quality.]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences, compassionate tone]

### ☽ Moon in [Sign]: [Descriptive Title]
[Emotional world paragraph]
**Quantumelodic Translation:** [Musical translation]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences]

### ☿ Mercury in [Sign]: [Descriptive Title]
[Communication/mind paragraph]
**Quantumelodic Translation:** [Musical translation]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences]

### ♀ Venus in [Sign]: [Descriptive Title]
[Love/aesthetics paragraph]
**Quantumelodic Translation:** [Musical translation]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences]

### ♂ Mars in [Sign]: [Descriptive Title]
[Drive/assertion paragraph]
**Quantumelodic Translation:** [Musical translation]
*Hidden Power:* [1-2 sentences]
*Growth Edge:* [1-2 sentences]

[If Mercury-Venus or other personal planets are conjunct, add a combined section with the aspect's harmonic interval ratio.]

---

# III. The Substructure: Soul Architecture

### ♃ Jupiter in [Sign]
[Expansion paragraph]
**Quantumelodic Description:** [Musical translation — crescendos, orchestral themes]
*Generational Gift:* [1-2 sentences]
*Activation Path:* [1-2 sentences]

### ♄ Saturn in [Sign]
[Structure/discipline paragraph]
**Quantumelodic Description:** [Musical translation — bass, structural anchor]
*Deep Lesson:* [1-2 sentences]
*Mastery Path:* [1-2 sentences]

### ♅ Uranus in [Sign]
[Liberation/innovation paragraph]
**Quantumelodic Description:** [Musical translation — synths, glitches]
*Generational Gift:* [1-2 sentences]

### ♆ Neptune in [Sign]
[Dreams/spirituality paragraph]
**Quantumelodic Description:** [Musical translation — ambient, ethereal]
*Generational Gift:* [1-2 sentences]

### ♇ Pluto in [Sign]
[Transformation/power paragraph]
**Quantumelodic Description:** [Musical translation — sub-bass, industrial]
*Generational Gift:* [1-2 sentences]

[Group related outer planets if they share signs or have tight aspects. Describe their combined musical effect using aspect interval ratios.]

---

# IV. The Performance: Integration & Public Presence

### The First Impression: Rising in [Sign]
[2-3 sentences on the Ascendant as the composition's opening tone]
**Quantumelodic Translation:** [How the rising sign sets the tonal center]
*Gift:* [1 sentence]
*Challenge:* [1 sentence]

---

# V. The Whole Composition — Synthesis

[5-7 sentences synthesizing the entire chart as a complete musical work. Identify central tension(s) and harmony/harmonies. Show how contradictions create richness. Name dominant tonal themes (elements, modalities). Describe what genre this composition would belong to. End with what makes this specific composition unrepeatable.]

---

# VI. Summary & Practical Living

**Three Grounded Invitations:**

1. **[Short label]:** [2-3 sentences. Specific, actionable, tied to a placement.]
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
    const { name, birthDate, birthTime, location, chartData, reading, planetMappings, signMappings, aspectMappings } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build the user input payload
    const ascendant = chartData.planets.find((p: any) => p.name === "Ascendant");
    const sunPlanet = chartData.planets.find((p: any) => p.name === "Sun");
    const moonPlanet = chartData.planets.find((p: any) => p.name === "Moon");

    // Helper: convert absolute longitude to sign-relative degree string
    const toRelDeg = (deg: number): string => {
      const within = deg % 30;
      const d = Math.floor(within);
      const m = Math.round((within - d) * 60);
      return `${d}°${m.toString().padStart(2, "0")}'`;
    };

    // Build planetary lines
    const planetLines = chartData.planets
      .filter((p: any) => p.name !== "Ascendant")
      .map((p: any) => {
        const qm = reading?.planets?.find((rp: any) => rp.position.name === p.name);
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
    const aspectLines = reading?.aspects
      ?.slice(0, 12)
      .map((a: any) =>
        `${a.planet1} ${a.aspectType.symbol} ${a.planet2} (${a.aspectType.name}, orb ${a.orb.toFixed(1)}°) — ${a.aspectType.harmonic_interval}, ${a.aspectType.consonance}`
      )
      .join("\n") || "None provided";

    const userContent = `Generate a complete Quantumelodic Harmonic Analysis report from the following data.

Subject:
  Name: ${name || "Unknown"}
  Born: ${birthDate || "Unknown"}, ${birthTime || "Unknown"}
  Location: ${location || "Unknown"}
  Sun sign: ${chartData.sunSign}
  Moon sign: ${chartData.moonSign}
  Ascendant: ${ascendant ? `${ascendant.sign} (${toRelDeg(ascendant.degree)})` : chartData.ascendant || "Unknown"}
  Musical mode / tonal center: ${reading?.overallKey || "Unknown"}
  Overall tempo: ${reading?.overallTempo || "Unknown"} BPM
  Dominant element: ${reading?.dominantElement || "Unknown"}
  Dominant modality: ${reading?.dominantModality || "Unknown"}

Planetary data:
${planetLines}

Major aspects:
${aspectLines}

Quantumelodic context:
- The system maps each planet to a specific instrument and sonic archetype.
- Signs correspond to musical modes, keys, tempos, and tonal textures.
- Aspects map to harmonic intervals (trines = perfect fifths, squares = tritones, conjunctions = unison/octave, sextiles = major thirds, oppositions = octave of duality).
- The chart is interpreted as a complete musical composition — a living, breathing piece of music unique to this individual.

Output constraints:
- Follow the Quantumelodic Report Template structure EXACTLY.
- Use the planetary Unicode emojis in all table rows and H3 headings.
- Bold all musical and astrological terminology.
- Use the exact insight labels (*Hidden Power:*, *Growth Edge:*, etc.).
- Start each planet's musical paragraph with **Quantumelodic Description:** or **Quantumelodic Translation:**
- Display sign-relative degrees in the Planetary Orchestra table.
- Do not invent missing data.`;

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
