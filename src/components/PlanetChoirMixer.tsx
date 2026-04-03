import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Flame, Droplets, Wind, Mountain, Music2 } from 'lucide-react';
import * as Tone from 'tone';
import type { QuantumMelodicReading } from '@/types/quantumMelodic';
import { PLANET_SYNTH, SIGN_MUSIC, MODES, NOTE_NAMES, type NoteName } from '@/utils/chartToScore';

// Element colours aligned to design tokens (HSL only)
const ELEMENT_CONFIG: Record<string, { icon: typeof Flame; hue: number; label: string }> = {
  Fire:  { icon: Flame,    hue: 15,  label: 'Fire'  },
  Earth: { icon: Mountain, hue: 100, label: 'Earth' },
  Air:   { icon: Wind,     hue: 195, label: 'Air'   },
  Water: { icon: Droplets, hue: 220, label: 'Water' },
};

const CHOIR_LABELS: Record<number, string> = { 1: 'Solo', 2: 'Duet', 3: 'Trio' };

interface Props {
  reading: QuantumMelodicReading;
  enabledPlanets: Set<string>;
  onTogglePlanet: (name: string) => void;
  activeElements: Set<string>;
  onToggleElement: (element: string) => void;
  onAudioChange: Dispatch<SetStateAction<HTMLAudioElement | null>>;
}

// ── Tone.js helpers ───────────────────────────────────────────────────────

interface ActiveSynths {
  synths: Tone.PolySynth[];
  reverbs: Tone.Reverb[];
  choruses: Tone.Chorus[];
  transport: typeof Tone.getTransport extends () => infer T ? T : never;
  parts: Tone.Part[];
}

let activeSynthsRef: ActiveSynths | null = null;

async function stopAllSynths() {
  if (!activeSynthsRef) return;
  try {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    for (const part of activeSynthsRef.parts) { part.stop(); part.dispose(); }
    for (const synth of activeSynthsRef.synths) { synth.releaseAll(); synth.dispose(); }
    for (const chorus of activeSynthsRef.choruses) { chorus.dispose(); }
    for (const reverb of activeSynthsRef.reverbs) { reverb.dispose(); }
  } catch {
    Tone.getTransport().cancel();
  } finally {
    activeSynthsRef = null;
  }
}

function noteNameToMidi(name: NoteName, octave: number): number {
  return NOTE_NAMES.indexOf(name) + (octave + 1) * 12;
}

async function playPlanetChoir(
  reading: QuantumMelodicReading,
  activePlanetNames: string[],
): Promise<void> {
  await stopAllSynths();
  await Tone.start();

  const transport = Tone.getTransport();
  const sunSign = reading.planets.find(p => p.position.name === 'Sun')?.position.sign ?? 'Leo';
  const signMusic = SIGN_MUSIC[sunSign] ?? SIGN_MUSIC['Leo'];
  const root = signMusic.root as NoteName;
  const modeIntervals = MODES[signMusic.mode] ?? MODES['Dorian'];
  const bpm = signMusic.tempo;
  transport.bpm.value = bpm;
  transport.stop();
  transport.cancel();

  const synths: Tone.PolySynth[] = [];
  const reverbs: Tone.Reverb[] = [];
  const choruses: Tone.Chorus[] = [];
  const parts: Tone.Part[] = [];
  const reverbGenerationTasks: Promise<void>[] = [];

  for (const planetName of activePlanetNames) {
    const planetData = reading.planets.find(p => p.position.name === planetName);
    if (!planetData) continue;

    const synthParams = PLANET_SYNTH[planetName];
    if (!synthParams) continue;

    const qmFreq = planetData.qmData?.frequency_hz ?? 440;
    const signOfPlanet = planetData.position.sign;
    const elementOfSign = planetData.signData?.element ?? 'Fire';
    const elementOctaveOffset: Record<string, number> = { Fire: 1, Air: 1, Earth: 0, Water: -1 };
    const octave = Math.max(2, Math.min(5, synthParams.octave + (elementOctaveOffset[elementOfSign] ?? 0)));

    // Build note sequence from scale + planet's degree
    const startDegree = Math.floor((planetData.position.degree % 30) / 30 * modeIntervals.length);
    const rootMidi = noteNameToMidi(root, octave);
    const scaleNotes = modeIntervals.map(iv => rootMidi + iv);

    // Reverb
    const reverb = new Tone.Reverb({ decay: 3 + synthParams.reverbWet * 5, wet: synthParams.reverbWet }).toDestination();
    reverbGenerationTasks.push(reverb.generate());

    // Chorus
    const chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.5, wet: synthParams.chorusWet }).connect(reverb);
    chorus.start();

    // Synth
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: synthParams.oscillatorType as OscillatorType },
      envelope: {
        attack: synthParams.attackTime,
        decay: synthParams.decayTime,
        sustain: synthParams.sustainLevel,
        release: synthParams.releaseTime,
      },
      volume: Tone.gainToDb(synthParams.weight * 0.5),
    }).connect(chorus);

    // Build a simple 8-beat looping phrase for this planet
    const secondsPerBeat = 60 / bpm;
    const isRetro = planetData.position.isRetrograde;
    const noteEvents: Array<[number, { pitch: number; duration: number; velocity: number }]> = [];

    const beatsToPlay = 8;
    const roleDurations: Record<string, number> = {
      bass: secondsPerBeat * 2, drone: secondsPerBeat * 4,
      pad: secondsPerBeat * 1.5, lead: secondsPerBeat * 0.75, arp: secondsPerBeat * 0.4,
    };
    const noteDur = roleDurations[synthParams.role] ?? secondsPerBeat;

    for (let beat = 0; beat < beatsToPlay; beat++) {
      // Skip some beats based on role and retrograde
      if (synthParams.role === 'bass' && beat % 2 !== 0) continue;
      if (synthParams.role === 'drone' && beat % 4 !== 0) continue;
      if (isRetro && beat % 3 === 2) continue;

      const direction = isRetro ? -1 : 1;
      const scaleIdx = Math.abs(startDegree + beat * direction) % scaleNotes.length;
      noteEvents.push([beat * secondsPerBeat, {
        pitch: scaleNotes[scaleIdx],
        duration: noteDur,
        velocity: synthParams.velocityRange[0] + Math.random() * (synthParams.velocityRange[1] - synthParams.velocityRange[0]),
      }]);
    }

    const part = new Tone.Part((time, ev: { pitch: number; duration: number; velocity: number }) => {
      const freq = Tone.Frequency(ev.pitch, 'midi').toFrequency();
      synth.triggerAttackRelease(freq, ev.duration, time, ev.velocity / 127);
    }, noteEvents);

    part.loop = true;
    part.loopEnd = beatsToPlay * secondsPerBeat;
    part.start(0);

    synths.push(synth);
    reverbs.push(reverb);
    choruses.push(chorus);
    parts.push(part);
  }

  await Promise.all(reverbGenerationTasks);
  activeSynthsRef = { synths, reverbs, choruses, transport, parts };
  transport.start();
}

// ─────────────────────────────────────────────────────────────────────────────

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

  const activePlanets = reading.planets.filter(
    p => p.position.name !== 'Ascendant' && enabledPlanets.has(p.position.name)
  );
  const nonAscPlanets = reading.planets.filter(p => p.position.name !== 'Ascendant');
  const choirLabel = CHOIR_LABELS[activePlanets.length] ?? 'Choir';

  // Stop on unmount
  useEffect(() => {
    return () => { stopAllSynths(); onAudioChange(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop when selection changes
  useEffect(() => {
    if (isPlaying) {
      stopAllSynths();
      setIsPlaying(false);
      onAudioChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledPlanets]);

  const stopChoir = async () => {
    await stopAllSynths();
    setIsPlaying(false);
    onAudioChange(null);
  };

  const playChoir = async () => {
    if (isLoading) return;
    if (isPlaying) { await stopChoir(); return; }
    if (activePlanets.length === 0) { setError('Select at least one planet'); return; }

    setError(null);
    setIsLoading(true);

    try {
      const planetNames = activePlanets.map(p => p.position.name);
      await playPlanetChoir(reading, planetNames);
      setIsPlaying(true);
      // Tone.js doesn't use HTMLAudioElement — pass null to clear waveform binding
      onAudioChange(null);
    } catch (err) {
      console.error('PlanetChoirMixer error:', err);
      setError(err instanceof Error ? err.message : 'Failed to synthesize choir');
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
          const sp = PLANET_SYNTH[p.position.name];
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
                style={{ color: isEnabled ? `hsl(${hue} 70% 65%)` : 'hsl(0 0% 35%)', transition: 'color 0.2s' }}
              >
                {p.position.symbol}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-xs truncate" style={{ color: isEnabled ? 'hsl(0 0% 92%)' : 'hsl(0 0% 40%)' }}>
                  {p.position.name}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'hsl(0 0% 50%)' }}>
                  {element} · {sp?.role ?? '—'}
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
            ♪ Live synthesis
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
          background: isPlaying ? 'hsl(0 0% 12%)' : 'hsl(43 74% 52% / 0.15)',
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
          <><VolumeX className="w-4 h-4" /> Stop</>
        ) : (
          <><Volume2 className="w-4 h-4" /> Play {activePlanets.length === 1 ? 'Solo' : activePlanets.length === 2 ? 'Duet' : activePlanets.length === 3 ? 'Trio' : 'Choir'}</>
        )}
      </button>
    </motion.div>
  );
};
