import { useState, useRef, useEffect } from "react";
import { Loader2, Mic, Pause, Play, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  /** Returns the narration script (plain text) when invoked. */
  getText: () => string;
  /** Optional ElevenLabs voice ID. Defaults to Michael Moon's cloned voice. */
  voiceId?: string;
  label?: string;
}

export function ReportNarrationButton({ getText, voiceId, label = "Narration" }: Props) {
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioRef.current?.pause();
  }, [audioUrl]);

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
      // Convert to blob URL so download works cleanly
      const res = await fetch(dataUri);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      audioRef.current = audio;
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      toast({ title: "Narration ready", description: "Playing in Michael's voice." });
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

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
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
    <div className="w-full flex items-center gap-2 py-2 px-3 rounded-xl border border-accent/25">
      <button
        onClick={toggle}
        className="h-8 w-8 rounded-full flex items-center justify-center border border-accent/40 hover:bg-accent/10"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="w-3.5 h-3.5 text-accent" /> : <Play className="w-3.5 h-3.5 text-accent" />}
      </button>
      <span className="flex-1 text-[10px] tracking-widest uppercase text-accent/70 truncate">
        Michael's Voice · {label}
      </span>
      <a
        href={audioUrl}
        download={`${label.replace(/[^a-z0-9-_]/gi, "_")}.mp3`}
        className="h-8 w-8 rounded-full flex items-center justify-center border border-accent/40 hover:bg-accent/10"
        title="Download MP3"
      >
        <Download className="w-3.5 h-3.5 text-accent" />
      </a>
      <button
        onClick={generate}
        disabled={loading}
        className="text-[9px] tracking-widest uppercase text-accent/60 hover:text-accent disabled:opacity-40 px-2"
        title="Regenerate"
      >
        {loading ? "…" : "Redo"}
      </button>
    </div>
  );
}
