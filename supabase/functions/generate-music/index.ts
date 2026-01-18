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

// Valid zodiac signs whitelist
const VALID_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

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

// Input validation
function validateChartData(data: unknown): { valid: true; data: ChartData } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Validate sunSign
  if (typeof obj.sunSign !== 'string' || !VALID_SIGNS.includes(obj.sunSign)) {
    return { valid: false, error: 'Invalid sun sign' };
  }
  
  // Validate moonSign
  if (typeof obj.moonSign !== 'string' || !VALID_SIGNS.includes(obj.moonSign)) {
    return { valid: false, error: 'Invalid moon sign' };
  }
  
  // Validate ascendant if provided
  if (obj.ascendant !== undefined && obj.ascendant !== null) {
    if (typeof obj.ascendant !== 'string' || !VALID_SIGNS.includes(obj.ascendant)) {
      return { valid: false, error: 'Invalid ascendant sign' };
    }
  }
  
  // Validate name (required, max 100 chars, sanitize)
  if (typeof obj.name !== 'string' || obj.name.length === 0 || obj.name.length > 100) {
    return { valid: false, error: 'Name must be 1-100 characters' };
  }
  
  // Sanitize name - remove potentially dangerous characters
  const sanitizedName = obj.name.replace(/[<>\"'&;]/g, '').trim();
  
  return {
    valid: true,
    data: {
      sunSign: obj.sunSign,
      moonSign: obj.moonSign,
      ascendant: obj.ascendant as string | undefined,
      name: sanitizedName,
    }
  };
}

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

    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const validation = validateChartData(rawData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { sunSign, moonSign, ascendant, name } = validation.data;

    console.log("Generating music for:", { sunSign, moonSign, ascendant });

    // Get musical attributes from signs
    const sunMode = signModes[sunSign] || signModes['Leo'];
    const moonMode = signModes[moonSign] || signModes['Cancer'];

    // Create a cosmic music prompt
    const prompt = `Create a ${sunMode.tempo} instrumental ambient electronic track that blends ${sunMode.mood} energy with ${moonMode.mood} undertones. The composition should feel cosmic and celestial, like floating through space among the stars. Use synthesizers, ethereal pads, and subtle rhythmic elements. The overall mood should be mystical and introspective, evoking a sense of personal destiny and cosmic connection. Style: ambient electronic, new age, space music.`;

    console.log("Music prompt length:", prompt.length);

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
      console.error("ElevenLabs API error:", response.status);

      // Treat known "expected" conditions as non-fatal for the app UI.
      if (response.status === 429 || response.status === 402) {
        const fallback =
          response.status === 429
            ? "Rate limited. Please try again in a moment."
            : "Music generation is temporarily unavailable.";

        console.warn("ElevenLabs music unavailable:", response.status);

        return new Response(
          JSON.stringify({
            unavailable: true,
            error: fallback,
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

      // Generic error for other failures
      return new Response(
        JSON.stringify({ error: 'Unable to generate music. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    // Log detailed error server-side only
    console.error('Error generating music:', error);
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Unable to generate music. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
