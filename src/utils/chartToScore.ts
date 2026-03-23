/**
 * QuantumMelodic Chart → Score Mapping Engine
 * Deterministic: same chart input always produces the same score seed.
 */
import type { ChartData, PlanetPosition } from '@/types/astrology';

// ─── Musical constants ─────────────────────────────────────────────────────

export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Modal interval patterns (semitones from root)
export const MODES: Record<string, number[]> = {
  Ionian:     [0, 2, 4, 5, 7, 9, 11],  // major
  Dorian:     [0, 2, 3, 5, 7, 9, 10],
  Phrygian:   [0, 1, 3, 5, 7, 8, 10],
  Lydian:     [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Aeolian:    [0, 2, 3, 5, 7, 8, 10],  // natural minor
  Locrian:    [0, 1, 3, 5, 6, 8, 10],
};

// ─── Sign → Musical parameters ────────────────────────────────────────────

interface SignMusic {
  root: NoteName;
  mode: string;
  tempo: number;
  element: string;
  texture: 'sparse' | 'moderate' | 'dense';
  rhythmicDensity: number; // 0-1
}

export const SIGN_MUSIC: Record<string, SignMusic> = {
  Aries:       { root: 'A',  mode: 'Phrygian',   tempo: 132, element: 'Fire',  texture: 'dense',    rhythmicDensity: 0.85 },
  Taurus:      { root: 'F',  mode: 'Ionian',      tempo: 72,  element: 'Earth', texture: 'sparse',   rhythmicDensity: 0.35 },
  Gemini:      { root: 'G',  mode: 'Mixolydian',  tempo: 120, element: 'Air',   texture: 'moderate', rhythmicDensity: 0.65 },
  Cancer:      { root: 'A',  mode: 'Aeolian',     tempo: 76,  element: 'Water', texture: 'sparse',   rhythmicDensity: 0.30 },
  Leo:         { root: 'D',  mode: 'Lydian',      tempo: 104, element: 'Fire',  texture: 'dense',    rhythmicDensity: 0.72 },
  Virgo:       { root: 'D',  mode: 'Dorian',      tempo: 92,  element: 'Earth', texture: 'moderate', rhythmicDensity: 0.55 },
  Libra:       { root: 'A#', mode: 'Ionian',      tempo: 96,  element: 'Air',   texture: 'moderate', rhythmicDensity: 0.50 },
  Scorpio:     { root: 'B',  mode: 'Locrian',     tempo: 80,  element: 'Water', texture: 'sparse',   rhythmicDensity: 0.40 },
  Sagittarius: { root: 'E',  mode: 'Mixolydian',  tempo: 126, element: 'Fire',  texture: 'dense',    rhythmicDensity: 0.78 },
  Capricorn:   { root: 'C',  mode: 'Dorian',      tempo: 84,  element: 'Earth', texture: 'sparse',   rhythmicDensity: 0.42 },
  Aquarius:    { root: 'F#', mode: 'Lydian',      tempo: 110, element: 'Air',   texture: 'moderate', rhythmicDensity: 0.60 },
  Pisces:      { root: 'E',  mode: 'Phrygian',    tempo: 78,  element: 'Water', texture: 'sparse',   rhythmicDensity: 0.28 },
};

// ─── Planet → Synth parameters ────────────────────────────────────────────

export interface PlanetSynth {
  oscillatorType: OscillatorType | 'fmsine' | 'amsine' | 'fmsawtooth';
  octave: number;        // base octave (3-6)
  role: 'bass' | 'pad' | 'lead' | 'arp' | 'drone';
  velocityRange: [number, number]; // [min, max] 0-127
  attackTime: number;    // seconds
  decayTime: number;
  sustainLevel: number;  // 0-1
  releaseTime: number;
  reverbWet: number;     // 0-1
  chorusWet: number;     // 0-1
  weight: number;        // mix prominence 0-1
}

export const PLANET_SYNTH: Record<string, PlanetSynth> = {
  Sun:     { oscillatorType: 'sawtooth', octave: 4, role: 'lead',  velocityRange: [80, 110], attackTime: 0.1,  decayTime: 0.3, sustainLevel: 0.7, releaseTime: 1.2, reverbWet: 0.3, chorusWet: 0.1, weight: 1.0 },
  Moon:    { oscillatorType: 'sine',     octave: 4, role: 'pad',   velocityRange: [50, 80],  attackTime: 1.5,  decayTime: 0.5, sustainLevel: 0.6, releaseTime: 2.5, reverbWet: 0.7, chorusWet: 0.3, weight: 0.85 },
  Mercury: { oscillatorType: 'square',   octave: 5, role: 'arp',   velocityRange: [60, 90],  attackTime: 0.02, decayTime: 0.1, sustainLevel: 0.4, releaseTime: 0.3, reverbWet: 0.2, chorusWet: 0.4, weight: 0.65 },
  Venus:   { oscillatorType: 'sine',     octave: 4, role: 'pad',   velocityRange: [55, 85],  attackTime: 0.8,  decayTime: 0.4, sustainLevel: 0.65, releaseTime: 2.0, reverbWet: 0.6, chorusWet: 0.5, weight: 0.75 },
  Mars:    { oscillatorType: 'sawtooth', octave: 3, role: 'lead',  velocityRange: [70, 100], attackTime: 0.05, decayTime: 0.2, sustainLevel: 0.5, releaseTime: 0.5, reverbWet: 0.15, chorusWet: 0.0, weight: 0.70 },
  Jupiter: { oscillatorType: 'triangle', octave: 3, role: 'drone', velocityRange: [40, 70],  attackTime: 2.0,  decayTime: 1.0, sustainLevel: 0.8, releaseTime: 3.0, reverbWet: 0.8, chorusWet: 0.2, weight: 0.55 },
  Saturn:  { oscillatorType: 'sawtooth', octave: 2, role: 'bass',  velocityRange: [55, 80],  attackTime: 0.3,  decayTime: 0.8, sustainLevel: 0.6, releaseTime: 1.5, reverbWet: 0.4, chorusWet: 0.0, weight: 0.60 },
  Uranus:  { oscillatorType: 'square',   octave: 5, role: 'arp',   velocityRange: [40, 65],  attackTime: 0.1,  decayTime: 0.3, sustainLevel: 0.3, releaseTime: 0.8, reverbWet: 0.5, chorusWet: 0.6, weight: 0.45 },
  Neptune: { oscillatorType: 'sine',     octave: 3, role: 'drone', velocityRange: [30, 55],  attackTime: 3.0,  decayTime: 2.0, sustainLevel: 0.7, releaseTime: 4.0, reverbWet: 0.9, chorusWet: 0.4, weight: 0.40 },
  Pluto:   { oscillatorType: 'sawtooth', octave: 2, role: 'bass',  velocityRange: [30, 60],  attackTime: 2.5,  decayTime: 1.5, sustainLevel: 0.8, releaseTime: 5.0, reverbWet: 0.7, chorusWet: 0.0, weight: 0.35 },
};

// ─── Score types ──────────────────────────────────────────────────────────

export interface NoteEvent {
  time: number;     // seconds from start
  pitch: number;    // MIDI note number 0-127
  duration: number; // seconds
  velocity: number; // 0-127
  planet: string;
}

export interface ScoreTrack {
  planet: string;
  synthParams: PlanetSynth;
  notes: NoteEvent[];
}

export interface ScoreSection {
  name: 'intro' | 'A' | 'B' | 'bridge' | 'coda';
  startTime: number;
  duration: number;
}

export interface Score {
  bpm: number;
  mode: string;
  rootNote: NoteName;
  scaleNotes: number[];   // MIDI note numbers for one octave
  sections: ScoreSection[];
  tracks: ScoreTrack[];
  totalDuration: number;  // seconds
  chartSignature: string;
}

// ─── Utility ──────────────────────────────────────────────────────────────

function noteNameToMidi(name: NoteName, octave: number): number {
  return NOTE_NAMES.indexOf(name) + (octave + 1) * 12;
}

function buildScaleNotes(root: NoteName, modeIntervals: number[], octave: number): number[] {
  const rootMidi = noteNameToMidi(root, octave);
  return modeIntervals.map(interval => rootMidi + interval);
}

function degreeToScaleIndex(degree: number, scaleLength: number): number {
  // Map 0-29 degree within sign to a scale degree
  return Math.floor((degree / 30) * scaleLength) % scaleLength;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ─── Main mapping function ────────────────────────────────────────────────

export function chartToScore(chart: ChartData): Score {
  const sunSignMusic = SIGN_MUSIC[chart.sunSign] || SIGN_MUSIC['Leo'];
  const moonSignMusic = SIGN_MUSIC[chart.moonSign] || SIGN_MUSIC['Cancer'];

  // Blend sun/moon tempo
  const bpm = Math.round((sunSignMusic.tempo * 0.65 + moonSignMusic.tempo * 0.35));

  const root = sunSignMusic.root;
  const mode = sunSignMusic.mode;
  const modeIntervals = MODES[mode] || MODES['Dorian'];

  // Build scale across multiple octaves for use
  const scaleNotes3 = buildScaleNotes(root, modeIntervals, 3);
  const scaleNotes4 = buildScaleNotes(root, modeIntervals, 4);
  const scaleNotes5 = buildScaleNotes(root, modeIntervals, 5);
  const allScaleNotes = [...scaleNotes3, ...scaleNotes4, ...scaleNotes5];

  const beatsPerBar = 4;
  const secondsPerBeat = 60 / bpm;
  const secondsPerBar = secondsPerBeat * beatsPerBar;

  // Section layout (in bars)
  const introBars = 4;
  const aBars = 8;
  const bBars = 8;
  const bridgeBars = 4;
  const codaBars = 4;
  const totalBars = introBars + aBars + bBars + bridgeBars + codaBars;
  const totalDuration = totalBars * secondsPerBar;

  const sections: ScoreSection[] = [
    { name: 'intro',  startTime: 0,                                 duration: introBars * secondsPerBar },
    { name: 'A',      startTime: introBars * secondsPerBar,          duration: aBars * secondsPerBar },
    { name: 'B',      startTime: (introBars + aBars) * secondsPerBar, duration: bBars * secondsPerBar },
    { name: 'bridge', startTime: (introBars + aBars + bBars) * secondsPerBar, duration: bridgeBars * secondsPerBar },
    { name: 'coda',   startTime: (introBars + aBars + bBars + bridgeBars) * secondsPerBar, duration: codaBars * secondsPerBar },
  ];

  // Chart signature for deterministic seed
  const chartSignature = `${chart.sunSign}-${chart.moonSign}-${chart.ascendant}-${chart.planets.map(p => `${p.name}${Math.floor(p.degree)}`).join('')}`;
  const sigHash = chartSignature.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  const rand = seededRand(Math.abs(sigHash));

  const tracks: ScoreTrack[] = [];

  // Generate a track for each planet present in the chart
  for (const planet of chart.planets) {
    const synthParams = PLANET_SYNTH[planet.name];
    if (!synthParams) continue;

    const notes: NoteEvent[] = [];
    const signMusic = SIGN_MUSIC[planet.sign] || sunSignMusic;

    // Choose octave from planet's base octave, adjusted by sign element
    const elementOctaveOffset: Record<string, number> = { Fire: 1, Air: 1, Earth: 0, Water: -1 };
    const octaveOffset = elementOctaveOffset[signMusic.element] || 0;
    const targetOctave = Math.max(2, Math.min(5, synthParams.octave + octaveOffset));

    // Get scale notes at the right octave
    const octaveScale = buildScaleNotes(root, modeIntervals, targetOctave);

    // Determine starting scale degree from planet's degree within sign
    const startDegree = degreeToScaleIndex(planet.degree % 30, modeIntervals.length);

    // Retrograde planets play in reverse / more sparse patterns
    const isRetro = planet.isRetrograde;
    const densityMultiplier = isRetro ? 0.5 : 1.0;
    const rhythmicDensity = signMusic.rhythmicDensity * densityMultiplier * synthParams.weight;

    // Note duration based on role
    const roleDurations: Record<string, number> = {
      bass:  secondsPerBar * 2,
      drone: secondsPerBar * 4,
      pad:   secondsPerBar * 1,
      lead:  secondsPerBeat,
      arp:   secondsPerBeat * 0.5,
    };
    const noteDuration = roleDurations[synthParams.role] || secondsPerBeat;

    // Generate notes for each section
    for (const section of sections) {
      const sectionBars = Math.round(section.duration / secondsPerBar);

      if (section.name === 'intro' && synthParams.role === 'arp') continue; // arps enter in A
      if (section.name === 'coda' && synthParams.role === 'arp') continue;  // arps drop in coda

      for (let bar = 0; bar < sectionBars; bar++) {
        const barStart = section.startTime + bar * secondsPerBar;

        // Bass/drone: one note per bar or per 2 bars
        if (synthParams.role === 'bass' || synthParams.role === 'drone') {
          const scaleIdx = (startDegree + bar) % octaveScale.length;
          const pitch = octaveScale[scaleIdx];
          notes.push({
            time: barStart,
            pitch,
            duration: noteDuration * (isRetro ? 1.5 : 1),
            velocity: Math.round(synthParams.velocityRange[0] + rand() * (synthParams.velocityRange[1] - synthParams.velocityRange[0])),
            planet: planet.name,
          });
        }

        // Pad: one or two notes per bar
        else if (synthParams.role === 'pad') {
          const notesPerBar = rhythmicDensity > 0.5 ? 2 : 1;
          for (let n = 0; n < notesPerBar; n++) {
            const beatOffset = n * (secondsPerBar / notesPerBar);
            const scaleIdx = (startDegree + bar + n) % octaveScale.length;
            const pitch = octaveScale[scaleIdx];
            notes.push({
              time: barStart + beatOffset,
              pitch,
              duration: noteDuration,
              velocity: Math.round(synthParams.velocityRange[0] + rand() * (synthParams.velocityRange[1] - synthParams.velocityRange[0])),
              planet: planet.name,
            });
          }
        }

        // Lead: melodic phrase over the bar
        else if (synthParams.role === 'lead') {
          const beatsInBar = 4;
          const phraseNotes = Math.round(beatsInBar * rhythmicDensity);
          for (let beat = 0; beat < phraseNotes; beat++) {
            if (rand() > rhythmicDensity) continue;
            const beatOffset = beat * secondsPerBeat;
            // Walk scale with some leaps
            const leap = rand() > 0.7 ? 2 : 1;
            const direction = isRetro ? -1 : 1;
            const scaleIdx = Math.abs((startDegree + bar * 2 + beat * direction * leap)) % octaveScale.length;
            const pitch = octaveScale[scaleIdx];
            notes.push({
              time: barStart + beatOffset,
              pitch,
              duration: noteDuration * (0.5 + rand() * 0.5),
              velocity: Math.round(synthParams.velocityRange[0] + rand() * (synthParams.velocityRange[1] - synthParams.velocityRange[0])),
              planet: planet.name,
            });
          }
        }

        // Arp: rapid pattern
        else if (synthParams.role === 'arp') {
          const stepsPerBar = Math.round(8 * rhythmicDensity);
          for (let step = 0; step < stepsPerBar; step++) {
            if (rand() > rhythmicDensity * 0.8) continue;
            const stepOffset = step * (secondsPerBar / 8);
            // Arp through scale chord tones (root, third, fifth)
            const chordTones = [0, 2, 4, 6];
            const toneIdx = chordTones[step % chordTones.length];
            const scaleIdx = (startDegree + toneIdx) % octaveScale.length;
            const pitch = octaveScale[scaleIdx];
            notes.push({
              time: barStart + stepOffset,
              pitch,
              duration: noteDuration,
              velocity: Math.round(synthParams.velocityRange[0] + rand() * (synthParams.velocityRange[1] - synthParams.velocityRange[0])),
              planet: planet.name,
            });
          }
        }
      }
    }

    if (notes.length > 0) {
      tracks.push({ planet: planet.name, synthParams, notes });
    }
  }

  return {
    bpm,
    mode,
    rootNote: root,
    scaleNotes: allScaleNotes,
    sections,
    tracks,
    totalDuration,
    chartSignature,
  };
}
