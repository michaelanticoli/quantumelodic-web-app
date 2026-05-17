import { useState, useEffect } from "react";
import { Loader2, Mic, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  /** Returns the narration script (plain text) when invoked. */
  getText: () => string;
  /** Optional ElevenLabs voice ID. Defaults to Michael Moon's cloned voice. */
  voiceId?: string;
  label?: string;
}

// Cache the generated narration across reloads (per label, per text-hash).
const CACHE_PREFIX = "moontuner.narration.v1.";

function hashText(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export function ReportNarrationButton({ getText, voiceId, label = "Narration" }: Props) {
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Restore cached narration on mount (if the text fingerprint matches).
  useEffect(() => {
    try {
      const text = getText().trim();
      if (!text) return;
      const key = CACHE_PREFIX + label + ":" + hashText(text);
      const cached = sessionStorage.getItem(key);
      if (cached) setAudioUrl(cached);
    } catch { /* sessionStorage may be unavailable */ }
    return () => {
      if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    const text = getText().trim();
    if (!text) {
      toast({ title: "Nothing to narrate", description: "Open the full report first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("narrate-report", {
        body: { text, voiceId },
      });
      if (error) throw error;
      if (!data?.audioContent) throw new Error("No audio returned");
      const dataUri = `data:${data.mime ?? "audio/mpeg"};base64,${data.audioContent}`;
      // Persist the data URI in sessionStorage so it survives reloads.
      try {
        const key = CACHE_PREFIX + label + ":" + hashText(text);
        sessionStorage.setItem(key, dataUri);
      } catch { /* quota may be exceeded — non-fatal */ }
      setAudioUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return dataUri;
      });
      toast({ title: "Narration ready", description: "Press play to hear Michael's voice." });
    } catch (e) {
      console.error("narration failed", e);
      toast({
        title: "Narration failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!audioUrl) {
    return (
      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-3 rounded-xl border border-accent/25 text-accent/80 text-xs tracking-widest uppercase hover:bg-accent/8 hover:border-accent/50 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Narrating in Michael's voice…
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            Narrate Report in Michael's Voice
          </>
        )}
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-accent/25 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10px] tracking-widest uppercase text-accent/70">
        <span className="truncate">Michael's Voice · {label}</span>
        <div className="flex items-center gap-3">
          <a
            href={audioUrl}
            download={`${label.replace(/[^a-z0-9-_]/gi, "_")}.mp3`}
            className="flex items-center gap-1 hover:text-accent"
            title="Download MP3"
          >
            <Download className="w-3 h-3" /> MP3
          </a>
          <button
            onClick={generate}
            disabled={loading}
            className="hover:text-accent disabled:opacity-40"
            title="Regenerate narration"
          >
            {loading ? "…" : "Redo"}
          </button>
        </div>
      </div>
      <audio
        src={audioUrl}
        controls
        autoPlay
        preload="auto"
        className="w-full h-9"
        style={{ colorScheme: "dark" }}
      />
    </div>
  );
}
