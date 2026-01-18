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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured', unavailable: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { aspectName, planet1, planet2, prompt } = await req.json() as AspectSoundRequest;

    console.log(`Generating aspect sound: ${planet1} ${aspectName} ${planet2}`);
    console.log(`Prompt: ${prompt}`);

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
      const errorText = await response.text();
      console.error('ElevenLabs SFX error:', response.status, errorText);

      // Handle rate limiting gracefully
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Sound generation temporarily unavailable',
            unavailable: true 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`ElevenLabs API error: ${response.status}`);
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
    console.error('Error generating aspect sound:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
