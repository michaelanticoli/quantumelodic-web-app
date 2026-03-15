import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Flame, Droplets, Wind, Mountain, Music2 } from 'lucide-react';
import type { QuantumMelodicReading } from '@/types/quantumMelodic';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Element colours aligned to design tokens (HSL only)
const ELEMENT_CONFIG: Record<string, {
  icon: typeof Flame;
  hue: number;
  label: string;
}> = {
  Fire:  { icon: Flame,    hue: 15,  label: 'Fire'  },
  Earth: { icon: Mountain, hue: 100, label: 'Earth' },
  Air:   { icon: Wind,     hue: 195, label: 'Air'   },
  Water: { icon: Droplets, hue: 220, label: 'Water' },
};

const CHOIR_LABELS: Record<number, string> = {
  1: 'Solo', 2: 'Duet', 3: 'Trio',
};

interface Props {
  reading: QuantumMelodicReading;
  enabledPlanets: Set<string>;
  onTogglePlanet: (name: string) => void;
  activeElements: Set<string>;
  onToggleElement: (element: string) => void;
  /** Callback so the parent can connect the live audio element to CosmicWaveform */
  onAudioChange: Dispatch<SetStateAction<HTMLAudioElement | null>>;
}

export const PlanetChoirMixer = ({
  reading,
  enabledPlanets,
  onTogglePlanet,
  activeElements,
  onToggleElement,
  onAudioChange,
}: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePlanets = reading.planets.filter(
    p => p.position.name !== 'Ascendant' && enabledPlanets.has(p.position.name)
  );
  const nonAscPlanets = reading.planets.filter(p => p.position.name !== 'Ascendant');
  const choirLabel = CHOIR_LABELS[activePlanets.length] ?? 'Choir';

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      onAudioChange(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop playback when selection changes
  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      onAudioChange(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledPlanets]);

  const stopAudio = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    onAudioChange(null);
  };

  /**
   * Build a descriptive prompt from the active planets and call
   * generate-planet-sound for a solo, or generate-aspect-sound for 2+ planets.
   * The resulting audio element is passed up via onAudioChange so the
   * CosmicWaveform visualiser can react to it.
   */
  const playChoir = async () => {
    if (isLoading) return;
    if (isPlaying) { stopAudio(); return; }
    if (activePlanets.length === 0) { setError('Select at least one planet'); return; }

    setError(null);
    setIsLoading(true);

    try {
      let audioBlob: Blob;

      if (activePlanets.length === 1) {
        // ── Solo: use generate-planet-sound ─────────────────────
        const planet = activePlanets[0];
        const freq    = planet.qmData?.frequency_hz ?? 220;
        const instrument = planet.qmData?.instrument ?? 'synthesizer';
        const timbre  = planet.qmData?.timbre ?? 'warm';
        const note    = planet.qmData?.note ?? '';
        const element = planet.signData?.element ?? 'Cosmic';

        const prompt = `Celestial solo for ${planet.position.name} in ${planet.position.sign}. ${note} at ${freq}Hz. ${instrument}, ${timbre} tone, ${element} element. Ambient cosmic resonance, 5 seconds.`.substring(0, 480);

        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-planet-sound`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            planetName: planet.position.name,
            prompt,
          }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          const json = JSON.parse(text || '{}');
          if (json.unavailable) {
            setError('Audio generation temporarily unavailable — check your ElevenLabs credits');
            return;
          }
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 120)}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (json.unavailable) {
            setError('Audio generation temporarily unavailable — check your ElevenLabs credits');
          } else {
            setError(json.error ?? 'Unknown error from server');
          }
          return;
        }

        audioBlob = await response.blob();

      } else {
        // ── Choir (2+): use generate-aspect-sound ───────────────
        const planetDescriptions = activePlanets.map(p => {
          const freq = p.qmData?.frequency_hz ?? 220;
          const instrument = p.qmData?.instrument ?? 'synthesizer';
          const timbre = p.qmData?.timbre ?? 'warm';
          const note = p.qmData?.note ?? '';
          return `${p.position.name}(${note} ${freq}Hz ${instrument} ${timbre})`;
        }).join(', ');

        const label = choirLabel.toLowerCase();
        const prompt = `Celestial ${label} for ${reading.overallKey} key at ${reading.overallTempo}BPM. Planets: ${planetDescriptions}. Ambient space music, resonant harmonics, 5 seconds`.substring(0, 480);

        const planet2Name = activePlanets[1]?.position.name ?? activePlanets[0]?.position.name ?? 'Moon';
        const aspectMap: Record<string, string> = {
          solo: 'solo-mix', duet: 'duet-mix', trio: 'trio-mix', choir: 'choir-mix',
        };
        const aspectName = aspectMap[label] ?? 'choir-mix';

        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-aspect-sound`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            aspectName,
            planet1: activePlanets[0]?.position.name ?? 'Sun',
            planet2: planet2Name,
            prompt,
          }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 120)}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (json.unavailable) {
            setError('Audio generation temporarily unavailable — check your ElevenLabs credits');
          } else {
            setError(json.error ?? 'Unknown error from server');
          }
          return;
        }

        audioBlob = await response.blob();
      }

      // ── Play the audio blob ──────────────────────────────────
      if (audioBlob.size < 100) {
        setError('Received empty audio — please try again');
        return;
      }

      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;

      // Pass the audio element up so CosmicWaveform can connect to it
      onAudioChange(audio);

      await audio.play();
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        onAudioChange(null);
        URL.revokeObjectURL(url);
      };

    } catch (err) {
      console.error('PlanetChoirMixer error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate choir audio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'hsl(0 0% 4%)', border: '1px solid hsl(43 74% 52% / 0.15)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Title */}
      <div className="flex items-center gap-2">
        <Music2 className="w-4 h-4" style={{ color: 'hsl(43 74% 52%)' }} />
        <h3 className="text-xs uppercase tracking-widest" style={{ color: 'hsl(43 74% 52%)' }}>
          Planet Choir Mixer
        </h3>
        <span className="ml-auto text-xs" style={{ color: 'hsl(43 74% 52% / 0.5)' }}>
          {reading.overallKey} · {reading.overallTempo} BPM
        </span>
      </div>

      {/* Element Filters */}
      <div className="flex gap-2">
        {Object.entries(ELEMENT_CONFIG).map(([element, cfg]) => {
          const Icon = cfg.icon;
          const isActive = activeElements.has(element);
          return (
            <button
              key={element}
              onClick={() => onToggleElement(element)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-medium transition-all duration-200"
              style={{
                background: isActive ? `hsl(${cfg.hue} 55% 30% / 0.35)` : 'transparent',
                borderColor: isActive ? `hsl(${cfg.hue} 65% 50% / 0.6)` : 'hsl(0 0% 100% / 0.08)',
                color: isActive ? `hsl(${cfg.hue} 80% 70%)` : 'hsl(0 0% 60%)',
              }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{element}</span>
            </button>
          );
        })}
      </div>

      {/* Planet Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {nonAscPlanets.map(p => {
          const isEnabled = enabledPlanets.has(p.position.name);
          const element = p.signData?.element ?? '';
          const hue = ELEMENT_CONFIG[element]?.hue ?? 43;
          return (
            <motion.button
              key={p.position.name}
              onClick={() => onTogglePlanet(p.position.name)}
              className="flex items-center gap-2 p-3 rounded-lg border text-sm transition-all duration-200 text-left"
              style={{
                background: isEnabled ? `hsl(${hue} 40% 18% / 0.45)` : 'transparent',
                borderColor: isEnabled ? `hsl(${hue} 60% 45% / 0.5)` : 'hsl(0 0% 100% / 0.07)',
              }}
              whileTap={{ scale: 0.96 }}
            >
              <span
                className="text-lg flex-shrink-0 leading-none"
                style={{
                  color: isEnabled ? `hsl(${hue} 70% 65%)` : 'hsl(0 0% 35%)',
                  transition: 'color 0.2s',
                }}
              >
                {p.position.symbol}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-xs truncate" style={{ color: isEnabled ? 'hsl(0 0% 92%)' : 'hsl(0 0% 40%)' }}>
                  {p.position.name}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'hsl(0 0% 50%)' }}>
                  {element} · {p.qmData?.note ?? '—'}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(0 0% 50%)' }}>
        <span>
          {activePlanets.length} selected
          {activePlanets.length >= 2 && ` · ${choirLabel}`}
        </span>
        {isPlaying && (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ color: 'hsl(43 74% 52%)' }}
          >
            ♪ Playing
          </motion.span>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-xs rounded-lg px-3 py-2"
            style={{ background: 'hsl(0 60% 20% / 0.4)', color: 'hsl(0 70% 70%)' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Play Button */}
      <button
        onClick={playChoir}
        disabled={isLoading || activePlanets.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-40"
        style={{
          background: isPlaying
            ? 'hsl(0 0% 12%)'
            : 'hsl(43 74% 52% / 0.15)',
          border: `1px solid hsl(43 74% 52% / ${isPlaying ? '0.6' : '0.35'})`,
          color: 'hsl(43 74% 62%)',
        }}
      >
        {isLoading ? (
          <motion.div
            className="w-4 h-4 rounded-full border"
            style={{ borderColor: 'hsl(43 74% 52% / 0.8)', borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : isPlaying ? (
          <>
            <VolumeX className="w-4 h-4" />
            Stop
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            Play {activePlanets.length === 1 ? 'Solo' : activePlanets.length === 2 ? 'Duet' : activePlanets.length === 3 ? 'Trio' : 'Choir'}
          </>
        )}
      </button>
    </motion.div>
  );
};
