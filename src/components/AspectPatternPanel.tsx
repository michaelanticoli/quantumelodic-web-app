import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Music } from 'lucide-react';
import type { ComputedAspect, QuantumMelodicReading } from '@/types/quantumMelodic';
import { Button } from '@/components/ui/button';
import { aspectMusicalData } from '@/utils/harmonicWisdom';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Props {
  aspectName: string;
  aspects: ComputedAspect[];
  reading: QuantumMelodicReading;
  onClose: () => void;
}

export const AspectPatternPanel = ({ aspectName, aspects, reading, onClose }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredAspects = aspects.filter(a => a.aspectType.name === aspectName);
  const aspectType = filteredAspects[0]?.aspectType;
  const musicalInfo = aspectMusicalData[aspectName];

  // Gather all unique planets involved
  const involvedPlanetNames = [...new Set(filteredAspects.flatMap(a => [a.planet1, a.planet2]))];
  const involvedPlanets = involvedPlanetNames.map(name => 
    reading.planets.find(p => p.position.name === name)
  ).filter(Boolean);

  const formatDegree = (deg: number): string => {
    const signDegree = deg % 30;
    const degrees = Math.floor(signDegree);
    const minutes = Math.floor((signDegree - degrees) * 60);
    return `${degrees}°${minutes}'`;
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playChordalRecipe = async () => {
    if (isLoading) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      // Build a combined chordal prompt from all planets in this aspect pattern
      const planetDescriptions = involvedPlanets.map(p => {
        if (!p) return '';
        const freq = p.qmData?.frequency_hz || 220;
        const instrument = p.qmData?.instrument || 'synthesizer';
        const timbre = p.qmData?.timbre || 'warm';
        return `${p.position.name} at ${freq}Hz on ${instrument} (${timbre})`;
      }).join(', ');

      const prompt = `Chordal arrangement: ${planetDescriptions} playing together in ${aspectType?.harmonic_interval || 'harmonic'} relationship, ${aspectType?.consonance || 'balanced'} tension, ${aspectType?.sonic_expression || 'resonant'}, ambient space music, layered harmony, 5 seconds`;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-aspect-sound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          aspectName,
          planet1: involvedPlanetNames[0] || 'Sun',
          planet2: involvedPlanetNames[1] || 'Moon',
          prompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate chordal recipe');

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('audio/')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioRef.current = new Audio(url);
        audioRef.current.play();
        setIsPlaying(true);
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };
      }
    } catch (err) {
      console.error('Error playing chordal recipe:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!aspectType) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

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
            <span className="text-3xl" style={{ color: aspectType.color }}>
              {aspectType.symbol}
            </span>
            <div>
              <h2 className="font-display text-xl font-light text-foreground">
                {aspectName} Pattern
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredAspects.length} {filteredAspects.length === 1 ? 'aspect' : 'aspects'} · {involvedPlanetNames.length} planets
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Musical Quality */}
          {musicalInfo && (
            <div className="flex items-center justify-center">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                musicalInfo.isConsonant
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : musicalInfo.isDissonant
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-muted/30 text-muted-foreground border border-border/30'
              }`}>
                {musicalInfo.isConsonant ? '◈ Consonant' : musicalInfo.isDissonant ? '◇ Dissonant' : '○ Unique'}
                {' · '}{musicalInfo.type}
              </span>
            </div>
          )}

          {/* Planets in Play */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
              <Music className="w-3 h-3" /> Planets in Play
            </h3>
            <div className="space-y-2">
              {involvedPlanets.map(p => {
                if (!p) return null;
                return (
                  <div key={p.position.name} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl text-primary">{p.position.symbol}</span>
                      <div>
                        <p className="text-foreground font-medium">{p.position.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.qmData?.instrument || 'Synth'} · {p.qmData?.frequency_hz || '—'}Hz
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground">{formatDegree(p.position.degree)} {p.position.sign}</p>
                      <p className="text-xs text-muted-foreground">House {p.houseNumber}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Individual Aspect Connections */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-highlight mb-3">
              Connections
            </h3>
            <div className="space-y-2">
              {filteredAspects.map((a, i) => (
                <div key={i} className="glass rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    {a.planet1} {aspectType.symbol} {a.planet2}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{a.exactAngle.toFixed(1)}°</span>
                    <span className={`${a.orb < 1 ? 'text-green-400' : a.orb < 3 ? 'text-highlight' : 'text-amber-400'}`}>
                      orb {a.orb.toFixed(1)}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Aspect Explanation */}
          {musicalInfo && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-accent mb-3">
                Harmonic Character
              </h3>
              <div className="p-4 rounded-xl bg-accent/5 border-l-2 border-accent/50 space-y-3">
                <p className="text-sm text-foreground/90">
                  Like <span className="italic text-highlight">{musicalInfo.music}</span>, 
                  this pattern creates <span className="font-medium">{musicalInfo.feel.toLowerCase()}</span>.
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {musicalInfo.energy}
                </p>
              </div>
            </section>
          )}

          {/* Resolution / Guidance */}
          {musicalInfo && (
            <section>
              <h3 className={`text-xs uppercase tracking-widest mb-3 ${
                musicalInfo.isDissonant ? 'text-amber-400' : 'text-green-400'
              }`}>
                {musicalInfo.isDissonant ? 'Resolution Pathway' : 'Working With This Energy'}
              </h3>
              <div className={`p-4 rounded-xl border-l-2 ${
                musicalInfo.isDissonant
                  ? 'bg-amber-500/5 border-amber-500/50'
                  : 'bg-green-500/5 border-green-500/50'
              }`}>
                <p className="text-sm text-foreground/90 leading-relaxed">{musicalInfo.resolve}</p>
              </div>
            </section>
          )}

          {/* Play Chordal Recipe */}
          <section className="pt-2">
            <Button
              variant="cosmic"
              size="lg"
              className="w-full"
              onClick={playChordalRecipe}
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
                  Play This Chordal Recipe
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground/60 mt-2">
              Hear all {involvedPlanetNames.length} planets singing in {aspectName.toLowerCase()} harmony
            </p>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};
