import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AspectSoundRequest {
  aspectName: string;
  planet1: string;
  planet2: string;
  prompt: string;
}

// Valid aspect names whitelist
const VALID_ASPECTS = [
  'Conjunction', 'Sextile', 'Square', 'Trine', 'Opposition',
  'Semi-sextile', 'Quincunx', 'Semi-square', 'Sesquiquadrate', 'Quintile',
  // Choir mixer custom aspect names
  'solo-mix', 'duet-mix', 'trio-mix', 'choir-mix',
  // Pattern names (Grand Trine, T-Square, etc.)
  'Grand Trine', 'T-Square', 'Grand Cross', 'Stellium', 'Yod',
  'Kite', 'Mystic Rectangle', 'Cradle', 'Star of David',
];

// Valid planet names whitelist
const VALID_PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant'
];

// Input validation
function validateAspectSoundRequest(data: unknown): { valid: true; data: AspectSoundRequest } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Validate aspectName
  if (typeof obj.aspectName !== 'string' || !VALID_ASPECTS.includes(obj.aspectName)) {
    return { valid: false, error: 'Invalid aspect name' };
  }
  
  // Validate planet1
  if (typeof obj.planet1 !== 'string' || !VALID_PLANETS.includes(obj.planet1)) {
    return { valid: false, error: 'Invalid planet1' };
  }
  
  // Validate planet2
  if (typeof obj.planet2 !== 'string' || !VALID_PLANETS.includes(obj.planet2)) {
    return { valid: false, error: 'Invalid planet2' };
  }
  
  // Validate prompt (max 500 chars to prevent abuse)
  if (typeof obj.prompt !== 'string' || obj.prompt.length === 0 || obj.prompt.length > 500) {
    return { valid: false, error: 'Prompt must be 1-500 characters' };
  }
  
  // Sanitize prompt - remove potentially dangerous characters
  const sanitizedPrompt = obj.prompt.replace(/[<>\"'&;]/g, '').trim().substring(0, 500);
  
  return {
    valid: true,
    data: {
      aspectName: obj.aspectName,
      planet1: obj.planet1,
      planet2: obj.planet2,
      prompt: sanitizedPrompt,
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
      console.error('ELEVENLABS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Sound generation is currently unavailable', unavailable: true }),
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
    
    const validation = validateAspectSoundRequest(rawData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { aspectName, planet1, planet2, prompt } = validation.data;

    console.log(`Generating aspect sound: ${planet1} ${aspectName} ${planet2}`);
    console.log(`Prompt length: ${prompt.length}`);

    // Use ElevenLabs Sound Effects API for short aspect sounds
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: 4,
        prompt_influence: 0.5,
      }),
    });

    if (!response.ok) {
      console.error('ElevenLabs SFX error:', response.status);

      // Handle auth errors, rate limiting, and billing gracefully
      if (response.status === 401 || response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Sound generation temporarily unavailable',
            unavailable: true 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generic error for other failures
      return new Response(
        JSON.stringify({ error: 'Unable to generate sound. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    console.log(`Aspect sound generated: ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-Aspect': aspectName,
        'X-Planets': `${planet1}-${planet2}`,
      },
    });

  } catch (error) {
    // Log detailed error server-side only
    console.error('Error generating aspect sound:', error);
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Unable to generate sound. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
