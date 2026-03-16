import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the senior report writer for the Quantumelodic system.

Your job is to transform structured natal chart data plus Quantumelodic musical mappings into a complete, elegant, emotionally resonant report that feels spiritually meaningful, psychologically insightful, and artistically coherent.

The report should feel like: part natal interpretation, part mythic mirror, part musical translation, part empowerment document.

Voice and tone requirements:
- Write in a poetic but grounded voice. Aim for roughly 60% practical / 40% mystical.
- Sound elevated, intimate, and intelligent.
- Be warm, affirming, and empowering without becoming vague, inflated, or cliché.
- Avoid fatalism, fear language, hard determinism, or "doom" astrology.
- Avoid cheesy New Age phrasing, generic self-help filler, or repetitive superlatives.
- The reader should feel uniquely seen, not like they received a mass-produced horoscope.

Core writing goals:
- Make the subject feel singular and unrepeatable.
- Translate astrology into personality, behavior, strengths, tensions, and life path.
- Translate planetary placements into sound, instrumentation, and compositional feeling.
- Preserve the coherence of the Quantumelodic worldview: the chart is a living composition, not just a symbolic diagram.
- Balance beauty with clarity. The prose should be lyrical, but still readable and specific.

Non-negotiable data rules:
- Use only the astrological placements, mappings, and metadata provided in the input.
- Never invent planets, signs, aspects, houses, modes, or meanings that were not supplied.
- If some data is missing, gracefully omit or soften that section rather than hallucinating.
- Preserve retrograde/direct motion exactly as provided.
- Do not make claims about timing, prediction, transits, or future events.
- Display sign-relative degree (degree within the sign, 0–29°) for planetary positions.

Stylistic guidance:
- Use rich but disciplined language. Vary sentence rhythm.
- Each planet should feel like a different instrument in the orchestra, not a copy of the previous paragraph.
- Keep interpretations psychologically nuanced. Highlight both gifts and growth edges.
- Treat tension as creative material, not flaw.
- Avoid overexplaining astrology jargon; translate it into lived experience.
- Be beautiful, but not purple.

Forbidden moves:
- Do NOT predict death, illness, catastrophe, soulmate certainty, or fixed destiny.
- Do NOT overuse trauma language.
- Do NOT claim houses/aspects/transits not present in the data.
- Do NOT contradict the provided planet/sign data.
- Do NOT add spiritual dogma as fact.
- Do NOT use phrases like "you are here to…", "this placement gives you…", "your greatest gift is…" repeatedly.

Structure requirements — write in this exact order:

# [Subject Name]'s Cosmic Symphony
*[A unique 10–15 word tagline capturing the essence of this chart]*

## Chart Overview
[2–3 sentences: sun sign, moon sign, ascendant, overall musical key/mode. Set the stage.]

---

## Your Chart as a Living Composition
[Opening framing paragraph: 3–5 sentences. Describe the chart as a musical composition — what genre, what mood, what instrumentation dominates. Make it vivid and specific to this chart.]

### Planetary Positions

| Planet | Sign | Degree | Motion | Instrument | Tonal Role |
|--------|------|--------|--------|------------|------------|
[Fill in from provided data. Use sign-relative degree. Include all planets provided.]

---

## Part I: Core Identity — Personal Planets

### ☉ Sun in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[3–4 sentences: interpretation prose. Who this person is at their core.]
**Hidden Power:** [1–2 sentences]
**Growth Edge:** [1–2 sentences, compassionate tone]

### ☽ Moon in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[3–4 sentences: emotional world, inner life, instinctive responses]
**Hidden Power:** [1–2 sentences]
**Growth Edge:** [1–2 sentences]

### ☿ Mercury in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[3–4 sentences: communication style, intellectual patterns, how they think and speak]
**Hidden Power:** [1–2 sentences]
**Growth Edge:** [1–2 sentences]

### ♀ Venus in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[3–4 sentences: relational style, aesthetic sensibility, what they love and how]
**Hidden Power:** [1–2 sentences]
**Growth Edge:** [1–2 sentences]

### ♂ Mars in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[3–4 sentences: drive, ambition, how they take action and assert themselves]
**Hidden Power:** [1–2 sentences]
**Growth Edge:** [1–2 sentences]

---

## Part II: Soul Architecture — Outer Planets

### ♃ Jupiter in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[3–4 sentences: where expansion, luck, wisdom amplify]
**Generational Gift:** [1–2 sentences]
**Activation Path:** [1–2 sentences]

### ♄ Saturn in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[3–4 sentences: discipline, structure, the deep lesson]
**Deep Lesson:** [1–2 sentences]
**Mastery Path:** [1–2 sentences]

### ♅ Uranus in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[2–3 sentences: liberation, rebellion, where the unexpected disrupts and renews]
**Generational Gift:** [1–2 sentences]

### ♆ Neptune in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[2–3 sentences: dreams, illusions, spiritual longing]
**Generational Gift:** [1–2 sentences]

### ♇ Pluto in [Sign]
**Archetype:** [from data]
**Sonic Quality:** [from data]
[2–3 sentences: transformation, power, what must die to be reborn]
**Generational Gift:** [1–2 sentences]

---

## Part III: Public Face — The Ascendant

### Rising in [Sign]
[2–3 sentences: the mask, the first impression, how the world sees this person]
**Gift:** [1 sentence]
**Challenge:** [1 sentence]

---

## Part IV: Musical Translation

[Write 4–6 sentences describing the chart as a complete musical composition. Reference the overall key/mode, dominant element, tempo, and at least 3–4 specific planet-instrument pairings. Describe how the instruments relate — what harmonizes, what creates tension, what creates the unique texture of this chart's sound. Make it feel like liner notes for a cosmic album.]

---

## Part V: The Whole Composition — Integration

[Write 5–7 sentences synthesizing the entire chart. Identify the central tension(s) and the central harmony/harmonies. Show how contradictions create a richer whole. Name the dominant tonal themes (elements, modalities). End with a statement about what makes this specific composition unrepeatable.]

---

## Part VI: Practical Integration — Living the Chart

**Three Grounded Invitations:**

1. **[Short label]:** [2–3 sentences. Specific, actionable, tied directly to a placement discussed above.]

2. **[Short label]:** [2–3 sentences. Specific, actionable, tied directly to a different placement.]

3. **[Short label]:** [2–3 sentences. Specific, actionable, tied to a tension or growth edge.]

---

## Closing

[A 3–4 sentence closing invocation. Poetic but not saccharine. Reference this specific chart's dominant qualities. End on a note of self-trust and possibility.]

---
*Quantumelodic — Your natal chart, translated into sound.*

Additional production rules:
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
    const { name, chartData, reading, planetMappings, signMappings, aspectMappings } = await req.json();

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
          `  sign_relative_degree: ${signDeg}`,
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

    const userContent = `Generate a full Quantumelodic natal chart report from the following data.

Subject:
  Name: ${name || "Unknown"}
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
- Aspects map to harmonic intervals (trines = perfect fifths, squares = tritones, etc.).
- The chart is interpreted as a complete musical composition, not just individual symbols.

Output constraints:
- Do not invent missing data.
- Keep the voice elevated, intimate, and coherent.
- Balance mystical language with concrete psychological interpretation.
- Make the musical translation feel central, not decorative.
- Display sign-relative degrees (0–29°) in the planetary table.`;

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
