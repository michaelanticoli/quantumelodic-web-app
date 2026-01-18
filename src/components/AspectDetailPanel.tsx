import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import type { ComputedAspect } from '@/types/quantumMelodic';
import { Button } from '@/components/ui/button';

interface Props {
  aspect: ComputedAspect;
  onClose: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const AspectDetailPanel = ({ aspect, onClose }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { aspectType, planet1, planet2, exactAngle, orb } = aspect;

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playAspectSound = async () => {
    if (isLoading) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      // Generate a sound effect that represents this aspect
      const prompt = `Short ${aspectType.sonic_expression} musical phrase, ${aspectType.harmonic_interval} interval, ${aspectType.consonance}, ${aspectType.musical_effect}, 3 seconds, ambient electronic`;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-aspect-sound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          aspectName: aspectType.name,
          planet1,
          planet2,
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
        audioRef.current = new Audio(url);
        audioRef.current.play();
        setIsPlaying(true);

        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };
      }
    } catch (err) {
      console.error('Error playing aspect sound:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Tension indicator
  const tensionBars = Array.from({ length: 5 }).map((_, i) => (
    <div
      key={i}
      className={`h-2 w-4 rounded-sm ${
        i < aspectType.tension_level
          ? 'bg-gradient-to-r from-highlight to-destructive'
          : 'bg-muted/30'
      }`}
    />
  ));

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
      />

      {/* Panel */}
      <motion.div
        className="relative z-10 w-full max-w-lg max-h-[80vh] overflow-y-auto glass-strong rounded-t-3xl sm:rounded-2xl mx-4 mb-0 sm:mb-4"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border/30 bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <span
              className="text-3xl"
              style={{ color: aspectType.color }}
            >
              {aspectType.symbol}
            </span>
            <div>
              <h2 className="font-display text-xl font-light text-foreground">
                {aspectType.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {planet1} · {planet2}
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
          {/* Aspect Metrics */}
          <section className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-light text-foreground">{aspectType.angle}°</p>
              <p className="text-xs text-muted-foreground mt-1">Angle</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-light text-foreground">{orb.toFixed(1)}°</p>
              <p className="text-xs text-muted-foreground mt-1">Orb</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-light text-foreground">{exactAngle.toFixed(1)}°</p>
              <p className="text-xs text-muted-foreground mt-1">Exact</p>
            </div>
          </section>

          {/* Tension Level */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Tension Level
            </h3>
            <div className="flex items-center gap-2">
              {tensionBars}
              <span className="ml-2 text-sm text-foreground">{aspectType.consonance}</span>
            </div>
          </section>

          {/* Harmonic Properties */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-primary mb-3">
              Harmonic Properties
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Interval</p>
                <p className="text-foreground">{aspectType.harmonic_interval}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Sonic Expression</p>
                <p className="text-foreground">{aspectType.sonic_expression}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Musical Effect</p>
                <p className="text-foreground/80 italic">{aspectType.musical_effect}</p>
              </div>
            </div>
          </section>

          {/* Play Sound Button */}
          <section className="pt-2">
            <Button
              variant="cosmic"
              size="lg"
              className="w-full"
              onClick={playAspectSound}
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
                  Hear This Aspect
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground/60 mt-2">
              Experience the harmonic expression of {planet1} {aspectType.symbol} {planet2}
            </p>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};
