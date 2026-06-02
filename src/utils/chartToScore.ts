/**
 * QuantumMelodic Chart → Score Mapping Engine
 * Deterministic: same chart always produces the same score.
 * Aesthetic: modern piano-noir / new-jazz. Avoids spa / orchestral patterns.
 */
import type { ChartData } from '@/types/astrology';
import { getTonicNote } from '@/data/baseTonicsLookup';

// ─── Musical constants ─────────────────────────────────────────────────────

export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function normalizeNote(note: string): NoteName {
  const FLATS: Record<string, NoteName> = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  };
  return (FLATS[note] ?? note) as NoteName;
}

export const MODES: Record<string, number[]> = {
  Ionian:        [0, 2, 4, 5, 7, 9, 11],
  Dorian:        [0, 2, 3, 5, 7, 9, 10],
  Phrygian:      [0, 1, 3, 5, 7, 8, 10],
  Lydian:        [0, 2, 4, 6, 7, 9, 11],
  Mixolydian:    [0, 2, 4, 5, 7, 9, 10],
  Aeolian:       [0, 2, 3, 5, 7, 8, 10],
  Locrian:       [0, 1, 3, 5, 6, 8, 10],
  // jazz/new-music extensions for variety
  MelodicMinor:  [0, 2, 3, 5, 7, 9, 11],
  HarmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  PhrygianDom:   [0, 1, 4, 5, 7, 8, 10],
  Altered:       [0, 1, 3, 4, 6, 8, 10],
};

interface SignMusic {
  root: NoteName;
  mode: string;
  tempo: number;
  element: string;
  texture: 'sparse' | 'moderate' | 'dense';
  rhythmicDensity: number;
  swing: number; // 0-0.3
}

// Tempo + mode spread so no two sun-sign blends sound the same.
export const SIGN_MUSIC: Record<string, SignMusic> = {
  Aries:       { root: 'A',  mode: 'PhrygianDom',   tempo: 138, element: 'Fire',  texture: 'dense',    rhythmicDensity: 0.80, swing: 0.05 },
  Taurus:      { root: 'F',  mode: 'Ionian',        tempo: 68,  element: 'Earth', texture: 'sparse',   rhythmicDensity: 0.32, swing: 0.20 },
  Gemini:      { root: 'G',  mode: 'Mixolydian',    tempo: 124, element: 'Air',   texture: 'moderate', rhythmicDensity: 0.68, swing: 0.15 },
  Cancer:      { root: 'A',  mode: 'Aeolian',       tempo: 62,  element: 'Water', texture: 'sparse',   rhythmicDensity: 0.28, swing: 0.18 },
  Leo:         { root: 'D',  mode: 'Lydian',        tempo: 104, element: 'Fire',  texture: 'dense',    rhythmicDensity: 0.70, swing: 0.10 },
  Virgo:       { root: 'D',  mode: 'Dorian',        tempo: 92,  element: 'Earth', texture: 'moderate', rhythmicDensity: 0.55, swing: 0.22 },
  Libra:       { root: 'A#', mode: 'MelodicMinor',  tempo: 86,  element: 'Air',   texture: 'moderate', rhythmicDensity: 0.48, swing: 0.18 },
  Scorpio:     { root: 'B',  mode: 'HarmonicMinor', tempo: 74,  element: 'Water', texture: 'sparse',   rhythmicDensity: 0.42, swing: 0.12 },
  Sagittarius: { root: 'E',  mode: 'Mixolydian',    tempo: 132, element: 'Fire',  texture: 'dense',    rhythmicDensity: 0.76, swing: 0.08 },
  Capricorn:   { root: 'C',  mode: 'Dorian',        tempo: 80,  element: 'Earth', texture: 'sparse',   rhythmicDensity: 0.40, swing: 0.20 },
  Aquarius:    { root: 'F#', mode: 'Lydian',        tempo: 118, element: 'Air',   texture: 'moderate', rhythmicDensity: 0.62, swing: 0.10 },
  Pisces:      { root: 'E',  mode: 'Altered',       tempo: 58,  element: 'Water', texture: 'sparse',   rhythmicDensity: 0.26, swing: 0.25 },
};

// ─── Planet voices (piano-noir centric) ───────────────────────────────────
// `voice` controls which Tone synth tonePlayer instantiates.

export type PlanetVoice =
  | 'pianoMid'   // central acoustic-piano voice
  | 'pianoLow'   // left-hand piano
  | 'pianoHigh'  // right-hand sparkle piano
  | 'rhodes'    // electric piano texture
  | 'celloBow'  // bowed cello/bass counterpoint
  | 'subBass'   // analog sub
  | 'moog'      // mono analog lead
  | 'felt'      // muted/felt piano pad
  | 'perc';     // brushed percussion / mallet color

export interface PlanetSynth {
  voice: PlanetVoice;
  octave: number;
  role: 'bass' | 'comp' | 'lead' | 'arp' | 'color' | 'pad';
  velocityRange: [number, number];
  weight: number;     // mix prominence 0-1
}

export const PLANET_SYNTH: Record<string, PlanetSynth> = {
  Sun:     { voice: 'pianoMid',  octave: 4, role: 'lead',  velocityRange: [78, 108], weight: 1.00 },
  Moon:    { voice: 'felt',      octave: 4, role: 'comp',  velocityRange: [52, 82],  weight: 0.80 },
  Mercury: { voice: 'pianoHigh', octave: 5, role: 'arp',   velocityRange: [58, 90],  weight: 0.62 },
  Venus:   { voice: 'rhodes',    octave: 4, role: 'comp',  velocityRange: [55, 84],  weight: 0.70 },
  Mars:    { voice: 'moog',      octave: 3, role: 'lead',  velocityRange: [70, 100], weight: 0.65 },
  Jupiter: { voice: 'pianoLow',  octave: 3, role: 'comp',  velocityRange: [55, 80],  weight: 0.58 },
  Saturn:  { voice: 'celloBow',  octave: 2, role: 'bass',  velocityRange: [55, 82],  weight: 0.62 },
  Uranus:  { voice: 'moog',      octave: 5, role: 'color', velocityRange: [42, 70],  weight: 0.42 },
  Neptune: { voice: 'felt',      octave: 3, role: 'pad',   velocityRange: [32, 58],  weight: 0.38 },
  Pluto:   { voice: 'subBass',   octave: 1, role: 'bass',  velocityRange: [40, 70],  weight: 0.55 },
};

// ─── Score types ──────────────────────────────────────────────────────────

export interface NoteEvent {
  time: number;
  pitch: number;
  duration: number;
  velocity: number;
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
  scaleNotes: number[];
  sections: ScoreSection[];
  tracks: ScoreTrack[];
  totalDuration: number;
  chartSignature: string;
  swing: number;
}

// ─── Utility ──────────────────────────────────────────────────────────────

function noteNameToMidi(name: NoteName, octave: number): number {
  return NOTE_NAMES.indexOf(name) + (octave + 1) * 12;
}

function buildScaleNotes(root: NoteName, modeIntervals: number[], octave: number): number[] {
  const rootMidi = noteNameToMidi(root, octave);
  return modeIntervals.map(i => rootMidi + i);
}

function degreeToScaleIndex(degree: number, scaleLength: number): number {
  return Math.floor((degree / 30) * scaleLength) % scaleLength;
}

function seededRand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ─── Main mapping function ────────────────────────────────────────────────

export function chartToScore(chart: ChartData): Score {
  const sunSM = SIGN_MUSIC[chart.sunSign] || SIGN_MUSIC['Leo'];
  const moonSM = SIGN_MUSIC[chart.moonSign] || SIGN_MUSIC['Cancer'];

  // Chart signature & deterministic RNG up front so we can vary tempo/mode per chart.
  const chartSignature = `${chart.sunSign}-${chart.moonSign}-${chart.ascendant}-${chart.planets.map(p => `${p.name}${Math.floor(p.degree)}${p.isRetrograde ? 'R' : ''}`).join('')}`;
  const sigHash = chartSignature.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  const rand = seededRand(Math.abs(sigHash));

  // Blend sun/moon tempo + nudge by chart hash so two same-sun charts diverge.
  const tempoJitter = Math.round((rand() - 0.5) * 16); // ±8 BPM
  const bpm = Math.max(54, Math.min(150, Math.round(sunSM.tempo * 0.6 + moonSM.tempo * 0.4 + tempoJitter)));

  // Root from canonical tonic table, fall back to sign root.
  const canonicalTonic = getTonicNote(chart.sunSign);
  let root: NoteName = canonicalTonic ? normalizeNote(canonicalTonic) : sunSM.root;

  // Pick mode: 70% sun's mode, otherwise moon's mode (chart-specific variety).
  const mode = rand() < 0.7 ? sunSM.mode : moonSM.mode;
  const modeIntervals = MODES[mode] || MODES['Dorian'];

  // Optional transpose by ±2 semitones based on Mars degree -> harmonic shift.
  const mars = chart.planets.find(p => p.name === 'Mars');
  if (mars) {
    const shift = (Math.floor(mars.degree) % 5) - 2; // -2..+2
    const rootIdx = (NOTE_NAMES.indexOf(root) + shift + 12) % 12;
    root = NOTE_NAMES[rootIdx];
  }

  const allScaleNotes = [
    ...buildScaleNotes(root, modeIntervals, 3),
    ...buildScaleNotes(root, modeIntervals, 4),
    ...buildScaleNotes(root, modeIntervals, 5),
  ];

  const swing = (sunSM.swing + moonSM.swing) / 2;

  const beatsPerBar = 4;
  const secondsPerBeat = 60 / bpm;
  const secondsPerBar = secondsPerBeat * beatsPerBar;

  const introBars = 4, aBars = 8, bBars = 8, bridgeBars = 4, codaBars = 4;
  const totalBars = introBars + aBars + bBars + bridgeBars + codaBars;
  const totalDuration = totalBars * secondsPerBar;

  const sections: ScoreSection[] = [
    { name: 'intro',  startTime: 0,                                                          duration: introBars * secondsPerBar },
    { name: 'A',      startTime: introBars * secondsPerBar,                                  duration: aBars * secondsPerBar },
    { name: 'B',      startTime: (introBars + aBars) * secondsPerBar,                        duration: bBars * secondsPerBar },
    { name: 'bridge', startTime: (introBars + aBars + bBars) * secondsPerBar,                duration: bridgeBars * secondsPerBar },
    { name: 'coda',   startTime: (introBars + aBars + bBars + bridgeBars) * secondsPerBar,   duration: codaBars * secondsPerBar },
  ];

  // Helper: swing a beat offset
  const swung = (t: number): number => {
    const beatPos = (t / secondsPerBeat) % 1;
    if (beatPos > 0.45 && beatPos < 0.55) return t + secondsPerBeat * swing;
    return t;
  };

  const tracks: ScoreTrack[] = [];

  for (const planet of chart.planets) {
    const synthParams = PLANET_SYNTH[planet.name];
    if (!synthParams) continue;

    const notes: NoteEvent[] = [];
    const planetSM = SIGN_MUSIC[planet.sign] || sunSM;

    const elementOctaveOffset: Record<string, number> = { Fire: 1, Air: 1, Earth: 0, Water: -1 };
    const targetOctave = Math.max(1, Math.min(6, synthParams.octave + (elementOctaveOffset[planetSM.element] || 0)));
    const octaveScale = buildScaleNotes(root, modeIntervals, targetOctave);
    const octaveScaleUp = buildScaleNotes(root, modeIntervals, targetOctave + 1);
    const fullVoice = [...octaveScale, ...octaveScaleUp];

    const startDegree = degreeToScaleIndex(planet.degree % 30, modeIntervals.length);
    const isRetro = planet.isRetrograde;
    const densityMult = isRetro ? 0.55 : 1.0;
    const density = planetSM.rhythmicDensity * densityMult * (0.5 + synthParams.weight * 0.6);

    const velRand = () => Math.round(synthParams.velocityRange[0] + rand() * (synthParams.velocityRange[1] - synthParams.velocityRange[0]));

    for (const section of sections) {
      const sectionBars = Math.round(section.duration / secondsPerBar);
      const intensity =
        section.name === 'intro'  ? 0.55 :
        section.name === 'A'       ? 0.85 :
        section.name === 'B'       ? 1.00 :
        section.name === 'bridge'  ? 0.70 : 0.45;

      // Some voices drop in/out by section for breathing room
      if (synthParams.role === 'arp' && (section.name === 'intro' || section.name === 'coda')) continue;
      if (synthParams.role === 'color' && section.name === 'intro') continue;
      if (synthParams.role === 'lead' && section.name === 'intro' && rand() < 0.5) continue;

      for (let bar = 0; bar < sectionBars; bar++) {
        const barStart = section.startTime + bar * secondsPerBar;
        const sectionDensity = density * intensity;

        if (synthParams.role === 'bass') {
          // Walking bass: root on 1, fifth/third around 3, occasional approach tone.
          const pattern = [0, 4, 2, 6];
          const subdivisions = synthParams.voice === 'subBass' ? 1 : 2;
          for (let b = 0; b < subdivisions * 2; b++) {
            if (subdivisions === 1 && b % 2 !== 0) continue;
            if (rand() > sectionDensity + 0.15) continue;
            const beatOffset = b * secondsPerBeat;
            const scaleIdx = (startDegree + pattern[b % pattern.length] + (bar % 3 === 2 ? 1 : 0)) % octaveScale.length;
            notes.push({
              time: swung(barStart + beatOffset),
              pitch: octaveScale[scaleIdx],
              duration: secondsPerBeat * (subdivisions === 1 ? 3.5 : 0.9),
              velocity: velRand(),
              planet: planet.name,
            });
          }
        }

        else if (synthParams.role === 'comp') {
          // Jazz piano comping: 2-3 chord stabs per bar on offbeats with rootless voicings.
          const stabs = sectionDensity > 0.5 ? 3 : 2;
          const beatChoices = [0.5, 1.75, 2.5, 3.25];
          for (let s = 0; s < stabs; s++) {
            if (rand() > sectionDensity) continue;
            const beat = beatChoices[(s + bar) % beatChoices.length];
            // Stack 3-4 chord tones (3rd, 5th, 7th, 9th) -> rootless voicing
            const tones = [2, 4, 6, 8];
            for (const t of tones) {
              if (rand() > 0.75) continue;
              const idx = (startDegree + t + bar) % fullVoice.length;
              notes.push({
                time: swung(barStart + beat * secondsPerBeat),
                pitch: fullVoice[idx],
                duration: secondsPerBeat * (0.6 + rand() * 0.8),
                velocity: Math.max(35, velRand() - 15),
                planet: planet.name,
              });
            }
          }
        }

        else if (synthParams.role === 'pad') {
          // Long sustained felt tones — one per 2 bars.
          if (bar % 2 !== 0) continue;
          const idx = (startDegree + bar) % fullVoice.length;
          notes.push({
            time: barStart,
            pitch: fullVoice[idx],
            duration: secondsPerBar * 2 * 0.95,
            velocity: Math.max(28, velRand() - 20),
            planet: planet.name,
          });
        }

        else if (synthParams.role === 'lead') {
          // Through-composed melodic line: irregular phrase lengths, occasional silence.
          const beats = 4;
          const phraseShape = [0, 2, -1, 1, 3, -2, 4, 1]; // contour
          for (let b = 0; b < beats * 2; b++) { // 8th notes
            if (rand() > sectionDensity * 0.85) continue;
            const beatOffset = b * (secondsPerBeat / 2);
            const contour = phraseShape[(b + bar * 3) % phraseShape.length];
            const direction = isRetro ? -1 : 1;
            const scaleIdx = Math.abs((startDegree + bar + b + contour * direction)) % fullVoice.length;
            notes.push({
              time: swung(barStart + beatOffset),
              pitch: fullVoice[scaleIdx],
              duration: (secondsPerBeat / 2) * (0.6 + rand() * 1.2),
              velocity: velRand(),
              planet: planet.name,
            });
          }
        }

        else if (synthParams.role === 'arp') {
          // 16ths with gaps — broken arpeggio in jazz voicing intervals.
          const steps = 16;
          const intervals = [0, 2, 4, 6, 4, 2, 7, 4];
          for (let st = 0; st < steps; st++) {
            if (rand() > sectionDensity * 0.6) continue;
            const stepOffset = st * (secondsPerBar / steps);
            const idx = (startDegree + intervals[st % intervals.length]) % fullVoice.length;
            notes.push({
              time: swung(barStart + stepOffset),
              pitch: fullVoice[idx],
              duration: (secondsPerBeat / 4) * 0.9,
              velocity: Math.max(40, velRand() - 8),
              planet: planet.name,
            });
          }
        }

        else if (synthParams.role === 'color') {
          // Sparse mallet/electronic color — 1-2 hits per 4 bars.
          if (bar % 4 !== (Math.floor(rand() * 4))) continue;
          const beatOffset = Math.floor(rand() * 4) * secondsPerBeat;
          const idx = (startDegree + Math.floor(rand() * 6) * 2) % fullVoice.length;
          notes.push({
            time: barStart + beatOffset,
            pitch: fullVoice[idx],
            duration: secondsPerBeat * 0.7,
            velocity: velRand(),
            planet: planet.name,
          });
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
    swing,
  };
}
