import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlanetSoundRequest {
  planetName: string;
  prompt: string;
}

const VALID_PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant'
];

function validateRequest(data: unknown): { valid: true; data: PlanetSoundRequest } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.planetName !== 'string' || !VALID_PLANETS.includes(obj.planetName)) {
    return { valid: false, error: 'Invalid planet name' };
  }

  if (typeof obj.prompt !== 'string' || obj.prompt.length === 0 || obj.prompt.length > 500) {
    return { valid: false, error: 'Prompt must be 1-500 characters' };
  }

  const sanitizedPrompt = obj.prompt.replace(/[<>"'&;]/g, '').trim().substring(0, 500);

  return {
    valid: true,
    data: {
      planetName: obj.planetName,
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
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const { planetName, prompt } = validation.data;

    console.log(`Generating planet sound: ${planetName}`);
    console.log(`Prompt length: ${prompt.length}`);

    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: 5,
        prompt_influence: 0.5,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.error('ElevenLabs SFX error:', response.status);

      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({
            error: 'Sound generation temporarily unavailable',
            unavailable: true
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Unable to generate sound. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    console.log(`Planet sound generated: ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-Planet': planetName,
      },
    });

  } catch (error) {
    console.error('Error generating planet sound:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof DOMException && error.name === 'TimeoutError'
          ? 'Sound generation timed out. Please try again.'
          : 'Unable to generate sound. Please try again later.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
