import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { QMPlanet, QMSign, QMHouse } from '@/types/quantumMelodic';
import type { PlanetPosition } from '@/types/astrology';

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

  const formatDegree = (deg: number): string => {
    const signDegree = deg % 30;
    const degrees = Math.floor(signDegree);
    const minutes = Math.floor((signDegree - degrees) * 60);
    return `${degrees}°${minutes}'`;
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
                  <p className="text-xs text-muted-foreground mt-1">Frequency</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-2xl font-light text-foreground">{qmData.note}</p>
                  <p className="text-xs text-muted-foreground mt-1">Note · Octave {qmData.octave}</p>
                </div>
              </div>
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

          {/* Sign Expression */}
          {signData && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-highlight mb-3">
                Sign Expression · {signData.name}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="glass rounded-lg p-3 text-center">
                  <p className="text-lg text-foreground">{signData.element}</p>
                  <p className="text-xs text-muted-foreground">Element</p>
                </div>
                <div className="glass rounded-lg p-3 text-center">
                  <p className="text-lg text-foreground">{signData.modality}</p>
                  <p className="text-xs text-muted-foreground">Modality</p>
                </div>
                <div className="glass rounded-lg p-3 text-center">
                  <p className="text-lg text-foreground">{signData.tempo_bpm}</p>
                  <p className="text-xs text-muted-foreground">BPM</p>
                </div>
              </div>
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

          {/* House Placement */}
          {houseData && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-secondary-foreground mb-3">
                House {houseNumber} · {houseData.name}
              </h3>
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
            </section>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
