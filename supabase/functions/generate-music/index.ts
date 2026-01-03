import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartData {
  sunSign: string;
  moonSign: string;
  ascendant?: string;
  name: string;
}

// Musical modes associated with each zodiac sign
const signModes: Record<string, { mode: string; mood: string; tempo: string }> = {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { sunSign, moonSign, ascendant, name } = await req.json() as ChartData;

    console.log("Generating music for:", { sunSign, moonSign, ascendant, name });

    // Get musical attributes from signs
    const sunMode = signModes[sunSign] || signModes['Leo'];
    const moonMode = signModes[moonSign] || signModes['Cancer'];

    // Create a cosmic music prompt
    const prompt = `Create a ${sunMode.tempo} instrumental ambient electronic track that blends ${sunMode.mood} energy with ${moonMode.mood} undertones. The composition should feel cosmic and celestial, like floating through space among the stars. Use synthesizers, ethereal pads, and subtle rhythmic elements. The overall mood should be mystical and introspective, evoking a sense of personal destiny and cosmic connection. Style: ambient electronic, new age, space music.`;

    console.log("Music prompt:", prompt);

    // Call ElevenLabs Music API
    const response = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration_seconds: 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      let apiMessage: string | null = null;
      try {
        const parsed = JSON.parse(errorText);
        apiMessage = parsed?.detail?.message ?? parsed?.error ?? parsed?.message ?? null;
      } catch {
        // ignore non-JSON error bodies
      }

      // Treat known "expected" conditions as non-fatal for the app UI.
      if (response.status === 429 || response.status === 402) {
        const fallback =
          response.status === 429
            ? "Rate limited. Please try again in a moment."
            : "Music generation is unavailable on the current plan.";

        console.warn("ElevenLabs music unavailable:", response.status, errorText);

        return new Response(
          JSON.stringify({
            unavailable: true,
            error: apiMessage ?? fallback,
            status: response.status,
            retryAfter: response.status === 429 ? 30 : undefined,
          }),
          {
            // Return 200 to avoid surfacing this as a hard runtime error in the preview.
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.error("ElevenLabs error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer();

    console.log("Music generated successfully, size:", audioBuffer.byteLength);

    // Return the audio directly as binary
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-Sun-Sign': sunSign,
        'X-Moon-Sign': moonSign,
        'X-Mode': sunMode.mode,
      },
    });

  } catch (error) {
    console.error('Error generating music:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
