import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Flame, Droplets, Wind, Mountain } from 'lucide-react';
import type { QuantumMelodicReading } from '@/types/quantumMelodic';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const ELEMENT_CONFIG: Record<string, { icon: typeof Flame; activeClass: string; bgClass: string }> = {
  Fire: { 
    icon: Flame, 
    activeClass: 'bg-gradient-to-r from-red-500/30 to-orange-500/30 border-orange-500/50 text-orange-300',
    bgClass: 'hover:bg-red-500/10 text-muted-foreground border-border/30'
  },
  Earth: { 
    icon: Mountain, 
    activeClass: 'bg-gradient-to-r from-green-600/30 to-emerald-500/30 border-emerald-500/50 text-emerald-300',
    bgClass: 'hover:bg-green-500/10 text-muted-foreground border-border/30'
  },
  Air: { 
    icon: Wind, 
    activeClass: 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-cyan-500/50 text-cyan-300',
    bgClass: 'hover:bg-cyan-500/10 text-muted-foreground border-border/30'
  },
  Water: { 
    icon: Droplets, 
    activeClass: 'bg-gradient-to-r from-violet-500/30 to-purple-500/30 border-violet-500/50 text-violet-300',
    bgClass: 'hover:bg-violet-500/10 text-muted-foreground border-border/30'
  },
};

interface Props {
  reading: QuantumMelodicReading;
  enabledPlanets: Set<string>;
  onTogglePlanet: (name: string) => void;
  activeElements: Set<string>;
  onToggleElement: (element: string) => void;
}

export const PlanetChoirMixer = ({ reading, enabledPlanets, onTogglePlanet, activeElements, onToggleElement }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePlanets = reading.planets.filter(
    p => p.position.name !== 'Ascendant' && enabledPlanets.has(p.position.name)
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playChoir = async () => {
    if (isLoading || activePlanets.length === 0) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const planetDescriptions = activePlanets.map(p => {
        const freq = p.qmData?.frequency_hz || 220;
        const instrument = p.qmData?.instrument || 'synthesizer';
        const timbre = p.qmData?.timbre || 'warm';
        return `${p.position.name} at ${freq}Hz on ${instrument} (${timbre})`;
      }).join(', ');

      const choirSize = activePlanets.length === 1 ? 'solo' : 
                       activePlanets.length === 2 ? 'duet' : 
                       activePlanets.length === 3 ? 'trio' : 'choir';

      const prompt = `Planetary ${choirSize}: ${planetDescriptions}, layered harmony in ${reading.overallKey}, ${reading.overallTempo} BPM, ambient space music, 5 seconds`;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-aspect-sound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          aspectName: `${choirSize}-mix`,
          planet1: activePlanets[0]?.position.name || 'Sun',
          planet2: activePlanets[1]?.position.name || 'Moon',
          prompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate choir');

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
      console.error('Error playing choir:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const nonAscPlanets = reading.planets.filter(p => p.position.name !== 'Ascendant');

  return (
    <motion.div
      className="glass rounded-xl p-5 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-xs uppercase tracking-widest text-primary flex items-center gap-2">
        <span className="text-lg">🎵</span> Planet Choir Mixer
      </h3>

      {/* Element Filter Buttons */}
      <div className="flex gap-2">
        {Object.entries(ELEMENT_CONFIG).map(([element, config]) => {
          const Icon = config.icon;
          const isActive = activeElements.has(element);
          return (
            <button
              key={element}
              onClick={() => onToggleElement(element)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                isActive ? config.activeClass : config.bgClass
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{element}</span>
            </button>
          );
        })}
      </div>

      {/* Planet Toggle Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {nonAscPlanets.map(p => {
          const isEnabled = enabledPlanets.has(p.position.name);
          const element = p.signData?.element || '';
          return (
            <button
              key={p.position.name}
              onClick={() => onTogglePlanet(p.position.name)}
              className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                isEnabled
                  ? 'glass border-primary/50 text-foreground'
                  : 'bg-muted/10 border-border/20 text-muted-foreground/40'
              }`}
            >
              <span className={`text-lg ${isEnabled ? 'opacity-100' : 'opacity-30'}`}>
                {p.position.symbol}
              </span>
              <div className="text-left">
                <p className="font-medium text-xs">{p.position.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {element} · {p.qmData?.note || '—'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active count + Play */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {activePlanets.length} planet{activePlanets.length !== 1 ? 's' : ''} selected
          {activePlanets.length === 2 && ' · Duet'}
          {activePlanets.length === 3 && ' · Trio'}
          {activePlanets.length >= 4 && ' · Choir'}
        </p>
      </div>

      <Button
        variant="cosmic"
        size="lg"
        className="w-full"
        onClick={playChoir}
        disabled={isLoading || activePlanets.length === 0}
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
            Play {activePlanets.length === 1 ? 'Solo' : activePlanets.length === 2 ? 'Duet' : activePlanets.length === 3 ? 'Trio' : 'Choir'}
          </>
        )}
      </Button>
    </motion.div>
  );
};
