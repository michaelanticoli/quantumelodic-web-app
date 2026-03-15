import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Music } from 'lucide-react';
import type { QMSign } from '@/types/quantumMelodic';
import { Button } from '@/components/ui/button';
import { CosmicWaveform, paletteFromSign } from '@/components/CosmicWaveform';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'hsl(15 80% 55%)',
  Earth: 'hsl(100 45% 42%)',
  Air: 'hsl(195 70% 50%)',
  Water: 'hsl(215 65% 55%)',
};

const ELEMENT_BG: Record<string, string> = {
  Fire:  'hsl(15 70% 50% / 0.08)',
  Earth: 'hsl(100 40% 40% / 0.08)',
  Air:   'hsl(195 65% 48% / 0.08)',
  Water: 'hsl(215 60% 50% / 0.08)',
};

const ELEMENT_BORDER: Record<string, string> = {
  Fire:  'hsl(15 70% 50% / 0.35)',
  Earth: 'hsl(100 40% 40% / 0.35)',
  Air:   'hsl(195 65% 48% / 0.35)',
  Water: 'hsl(215 60% 50% / 0.35)',
};

const ELEMENT_EMOJI: Record<string, string> = {
  Fire: '🔥', Earth: '🌿', Air: '🌬️', Water: '💧',
};

interface Props {
  signName: string;
  signData: QMSign | null;
  onClose: () => void;
}

export const ZodiacSignDetailPanel = ({ signName, signData, onClose }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const symbol = ZODIAC_SYMBOLS[signName] ?? '✦';
  const element = signData?.element ?? 'Fire';
  const elemColor = ELEMENT_COLORS[element] ?? ELEMENT_COLORS.Fire;
  const elemBg = ELEMENT_BG[element] ?? ELEMENT_BG.Fire;
  const elemBorder = ELEMENT_BORDER[element] ?? ELEMENT_BORDER.Fire;

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSignSound = async () => {
    if (isLoading) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setAudioElement(null);
      return;
    }

    if (!signData) return;
    setIsLoading(true);

    try {
      // Map sign to a planet name for the endpoint (use Sun as proxy for sign-based sound)
      const prompt = `${signData.musical_mode} mode in ${signData.key_signature}, ${signData.tempo_bpm} BPM, ${signData.texture} texture, ${signData.emotional_quality}, ${element} element, ambient cosmic music, 5 seconds`;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-planet-sound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          planetName: 'Sun', // closest valid planet for the endpoint
          prompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate sound');

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('audio/')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        setAudioElement(audio);
        audio.play();
        setIsPlaying(true);

        audio.onended = () => {
          setIsPlaying(false);
          setAudioElement(null);
          URL.revokeObjectURL(url);
        };
      }
    } catch (err) {
      console.error('Error playing sign sound:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        className="relative z-10 w-full max-w-lg max-h-[80vh] overflow-y-auto glass-strong rounded-t-3xl sm:rounded-2xl mx-4 mb-0 sm:mb-4"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Coloured accent stripe */}
        <div
          className="h-1 w-full rounded-t-3xl sm:rounded-t-2xl"
          style={{ background: elemColor }}
        />

        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-xl"
          style={{ borderColor: elemBorder, background: `hsl(222 47% 7% / 0.92)` }}
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl" style={{ color: elemColor }}>{symbol}</span>
            <div>
              <h2 className="font-display text-xl font-light text-foreground">{signName}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <span>{ELEMENT_EMOJI[element]}</span>
                <span>{element} · {signData?.modality ?? '—'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {signData ? (
            <>
              {/* Musical Identity — hero section */}
              <section>
                <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: elemColor }}>
                  Musical Identity
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass rounded-xl p-4 text-center">
                    <Music className="w-4 h-4 mx-auto mb-1" style={{ color: elemColor }} />
                    <p className="text-sm font-medium text-foreground">{signData.musical_mode}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Mode</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-lg font-light text-foreground">{signData.key_signature}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Key</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-light text-foreground">{signData.tempo_bpm}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">BPM</p>
                  </div>
                </div>
              </section>

              {/* Sonic Character */}
              <section>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  Sonic Character
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl p-4"
                    style={{ background: elemBg, borderLeft: `2px solid ${elemBorder}` }}
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Texture</p>
                    <p className="text-foreground">{signData.texture}</p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: elemBg, borderLeft: `2px solid ${elemBorder}` }}
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Emotional Quality</p>
                    <p className="text-foreground">{signData.emotional_quality}</p>
                  </div>
                </div>
              </section>

              {/* Sonic Palette */}
              <section>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Sonic Palette
                </h3>
                <p className="text-foreground/80 text-sm italic leading-relaxed">{signData.sonic_palette}</p>
              </section>

              {/* Waveform — visible when playing */}
              <motion.div
                className="w-full overflow-hidden rounded-xl"
                style={{ height: isPlaying ? 72 : 0, border: isPlaying ? `1px solid ${elemBorder}` : 'none' }}
                animate={{ height: isPlaying ? 72 : 0, opacity: isPlaying ? 1 : 0 }}
                transition={{ duration: 0.35 }}
              >
                <CosmicWaveform
                  audioElement={audioElement}
                  idleIntensity={0.4}
                  palette={paletteFromSign(signName)}
                />
              </motion.div>

              {/* Hear This Sign button */}
              <section className="pt-2">
                <Button
                  variant="cosmic"
                  size="lg"
                  className="w-full"
                  onClick={playSignSound}
                  disabled={isLoading}
                  style={!isLoading ? { borderColor: elemBorder } : undefined}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : isPlaying ? (
                    <><VolumeX className="w-4 h-4 mr-2" />Stop</>
                  ) : (
                    <><Volume2 className="w-4 h-4 mr-2" />Hear This Sign</>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground/60 mt-2">
                  {signData.musical_mode} in {signData.key_signature} at {signData.tempo_bpm} BPM
                </p>
              </section>
            </>
          ) : (
            <div className="py-12 text-center">
              <motion.div
                className="w-8 h-8 border border-primary/60 border-t-transparent rounded-full mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-sm text-muted-foreground mt-3">Loading {signName} data…</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
