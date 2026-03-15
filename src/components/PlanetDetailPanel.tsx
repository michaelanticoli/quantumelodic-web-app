import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import type { QMPlanet, QMSign, QMHouse } from '@/types/quantumMelodic';
import type { PlanetPosition } from '@/types/astrology';
import { elementInfo, qualityInfo, getFrequencyCategory, houseWisdom } from '@/utils/harmonicWisdom';
import { Button } from '@/components/ui/button';
import { CosmicWaveform, paletteFromSign } from '@/components/CosmicWaveform';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface EnrichedPlanet {
  position: PlanetPosition;
  qmData: QMPlanet | null;
  signData: QMSign | null;
  houseNumber: number;
  houseData: QMHouse | null;
}

interface Props {
  planet: EnrichedPlanet;
  onClose: () => void;
}

export const PlanetDetailPanel = ({ planet, onClose }: Props) => {
  const { position, qmData, signData, houseData, houseNumber } = planet;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatDegree = (deg: number): string => {
    const signDegree = deg % 30;
    const degrees = Math.floor(signDegree);
    const minutes = Math.floor((signDegree - degrees) * 60);
    return `${degrees}°${minutes}'`;
  };

  const freqInfo = qmData ? getFrequencyCategory(qmData.frequency_hz) : null;
  const elemInfo = signData?.element ? elementInfo[signData.element] : null;
  const qualInfo = signData?.modality ? qualityInfo[signData.modality] : null;
  const houseWisdomInfo = houseWisdom[houseNumber];

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playPlanetSound = async () => {
    if (isLoading) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setAudioElement(null);
      return;
    }

    setIsLoading(true);

    try {
      const prompt = `${qmData?.frequency_hz || 220}Hz ${qmData?.timbre || 'warm'} tone, ${qmData?.instrument || 'synthesizer'}, ${qmData?.harmonic_quality || 'resonant'}, ${signData?.emotional_quality || 'ethereal'}, ambient space music, 4 seconds`;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-planet-sound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          planetName: position.name,
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate sound');
      }

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
      console.error('Error playing planet sound:', err);
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
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto glass-strong rounded-t-3xl sm:rounded-2xl mx-4 mb-0 sm:mb-4"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border/30 bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <span className="text-4xl text-primary">{position.symbol}</span>
            <div>
              <h2 className="font-display text-xl font-light text-foreground">
                {position.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatDegree(position.degree)} {position.sign}
                {position.isRetrograde && ' ℞'}
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
          {/* Planetary Frequency */}
          {qmData && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-primary mb-3">
                Sonic Signature
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4">
                  <p className="text-2xl font-light text-foreground">{qmData.frequency_hz} Hz</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {freqInfo?.category} Resonance
                  </p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-2xl font-light text-foreground">{qmData.note}</p>
                  <p className="text-xs text-muted-foreground mt-1">Note · Octave {qmData.octave}</p>
                </div>
              </div>
              
              {/* Harmonic Nature - NEW */}
              {freqInfo && (
                <div className="mt-4 p-4 rounded-xl bg-primary/5 border-l-2 border-primary/50">
                  <p className="text-xs uppercase tracking-wide text-primary/80 mb-2">Harmonic Nature</p>
                  <p className="text-sm text-foreground/90 italic">
                    This frequency carries {freqInfo.resonance} energy. Like a note in the cosmic symphony, 
                    it seeks to harmonize with other planetary frequencies.
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Instrument</p>
                  <p className="text-foreground">{qmData.instrument}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Timbre</p>
                  <p className="text-foreground">{qmData.timbre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Harmonic Quality</p>
                  <p className="text-foreground">{qmData.harmonic_quality}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Sonic Character</p>
                  <p className="text-foreground/80 text-sm italic">{qmData.sonic_character}</p>
                </div>
              </div>
            </section>
          )}

          {/* Archetypal Energy */}
          {qmData && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-accent mb-3">
                Archetypal Energy
              </h3>
              <p className="text-foreground/90">{qmData.archetypal_energy}</p>
            </section>
          )}

          {/* Sign Expression - Enhanced */}
          {signData && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-highlight mb-3">
                Sign Expression · {signData.name}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="glass rounded-lg p-3 text-center">
                  <p className="text-lg text-foreground">{elemInfo?.symbol || signData.element}</p>
                  <p className="text-sm text-foreground">{signData.element}</p>
                  <p className="text-xs text-muted-foreground">Element</p>
                </div>
                <div className="glass rounded-lg p-3 text-center">
                  <p className="text-lg text-foreground">{signData.modality}</p>
                  <p className="text-xs text-muted-foreground mt-1">Modality</p>
                </div>
                <div className="glass rounded-lg p-3 text-center">
                  <p className="text-lg text-foreground">{signData.tempo_bpm}</p>
                  <p className="text-xs text-muted-foreground mt-1">BPM</p>
                </div>
              </div>

              {/* Elemental Resonance - NEW */}
              {elemInfo && (
                <div className="p-4 rounded-xl bg-highlight/5 border-l-2 border-highlight/50 mb-4">
                  <p className="text-xs uppercase tracking-wide text-highlight/80 mb-2">
                    {elemInfo.symbol} Elemental Resonance
                  </p>
                  <p className="text-sm text-foreground/90">
                    <span className="text-foreground font-medium">{signData.element}</span> energy creates{' '}
                    <span className="italic">{elemInfo.color}</span>, vibrating with {elemInfo.sound}. 
                    Think of it as the timbre of this planetary instrument—same note, different voice.
                  </p>
                </div>
              )}

              {/* Quality Rhythm - NEW */}
              {qualInfo && (
                <div className="p-4 rounded-xl bg-accent/5 border-l-2 border-accent/50 mb-4">
                  <p className="text-xs uppercase tracking-wide text-accent/80 mb-2">Quality Rhythm</p>
                  <p className="text-sm text-foreground/90">
                    <span className="text-foreground font-medium">{qualInfo.action}</span> — {qualInfo.rhythm}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Musical Mode</p>
                  <p className="text-foreground">{signData.musical_mode} · {signData.key_signature}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Texture</p>
                  <p className="text-foreground">{signData.texture}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Emotional Quality</p>
                  <p className="text-foreground">{signData.emotional_quality}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Sonic Palette</p>
                  <p className="text-foreground/80 text-sm italic">{signData.sonic_palette}</p>
                </div>
              </div>
            </section>
          )}

          {/* House Placement - Enhanced */}
          {houseData && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-secondary-foreground mb-3">
                House {houseNumber} · {houseData.name}
              </h3>
              
              {/* House Harmonic Wisdom - NEW */}
              {houseWisdomInfo && (
                <div className="p-4 rounded-xl bg-secondary/10 border-l-2 border-secondary/50 mb-4">
                  <p className="text-xs uppercase tracking-wide text-secondary-foreground/80 mb-2">
                    {houseWisdomInfo.octave} · Harmonic Wisdom
                  </p>
                  <p className="text-sm text-foreground/90 italic">
                    {houseWisdomInfo.wisdom}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Life Domain</p>
                  <p className="text-foreground">{houseData.domain}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tonal Area</p>
                  <p className="text-foreground">{houseData.tonal_area}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Dynamic</p>
                  <p className="text-foreground">{houseData.dynamic}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Musical Expression</p>
                  <p className="text-foreground/80 text-sm italic">{houseData.expression}</p>
                </div>
              </div>

              {/* Houses as Resonance Chambers - NEW */}
              <div className="mt-4 p-3 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground italic">
                  Houses are resonance chambers in the cosmic instrument. Planets passing through 
                  create different tones depending on which chamber they occupy.
                </p>
              </div>
            </section>
          )}

              {/* Live waveform — appears while playing */}
              <motion.div
                className="w-full overflow-hidden rounded-xl"
                animate={{ height: isPlaying ? 64 : 0, opacity: isPlaying ? 1 : 0 }}
                transition={{ duration: 0.35 }}
                style={{ border: isPlaying ? '1px solid hsl(43 74% 52% / 0.25)' : 'none' }}
              >
                <CosmicWaveform
                  audioElement={audioElement}
                  idleIntensity={0.35}
                  palette={paletteFromSign(position.sign)}
                />
              </motion.div>

              {/* Play Sound Button */}
              <section className="pt-2">
                <Button
                  variant="cosmic"
                  size="lg"
                  className="w-full"
                  onClick={playPlanetSound}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : isPlaying ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Hear This Planet
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground/60 mt-2">
                  Experience the sonic signature of {position.name} at {qmData?.frequency_hz || '—'} Hz
                </p>
              </section>
            </div>
      </motion.div>
    </motion.div>
  );
};
