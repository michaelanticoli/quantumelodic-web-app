// Narrates arbitrary text in Michael Moon's cloned ElevenLabs voice.
// Returns base64-encoded MP3 in JSON (no storage bucket needed).
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VOICE_ID = "bQjXuTZHN8ofphZ0QfAv"; // Michael Moon cloned voice

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ELEVEN = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVEN) throw new Error("ELEVENLABS_API_KEY missing");

    const body = await req.json();
    let text = String(body.text ?? "").trim();
    // Voice is server-controlled — never trust client-supplied voiceId (prevents abuse of cloned/third-party voices).
    const voiceId = VOICE_ID;
    if (!text) return json({ error: "text required" }, 400);
    // ElevenLabs hard limit ~5000 chars; trim if needed.
    if (text.length > 4800) text = text.slice(0, 4800) + "…";

    const ttsResp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!ttsResp.ok) {
      const errText = await ttsResp.text();
      console.error("ElevenLabs TTS failed:", ttsResp.status, errText);
      return json({ error: `TTS failed: ${errText.slice(0, 300)}` }, 502);
    }

    const audioBuf = await ttsResp.arrayBuffer();
    const audioContent = base64Encode(new Uint8Array(audioBuf));
    return json({ audioContent, mime: "audio/mpeg" });
  } catch (err) {
    console.error("narrate-report error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
