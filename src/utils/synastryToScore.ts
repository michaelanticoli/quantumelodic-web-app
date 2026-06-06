/**
 * Synastric Symphony Score Builder
 *
 * Extends the chartToScore pattern to blend TWO natal charts into a unified
 * musical composition. Person A and Person B each get their own voice palette,
 * and inter-chart aspects influence shared harmonic moments.
 *
 * Structure: Intro (A solo) → Section A (B enters) → B (full duet) →
 *            Bridge (composite voice) → Coda (resolution or tension)
 *
 * Deterministic: same two charts + relationship type always produce the same score.
 */
import type { ChartData } from '@/types/astrology';
import {
  NOTE_NAMES, MODES, SIGN_MUSIC, PLANET_SYNTH,
  type NoteName, type PlanetVoice, type PlanetSynth,
  type NoteEvent, type ScoreTrack, type ScoreSection, type Score,
} from './chartToScore';
import { getTonicNote } from '@/data/baseTonicsLookup';

// ─── Person B voice palette (contrasts with Person A's piano-noir) ────────

export const PERSON_B_SYNTH: Record<string, PlanetSynth> = {
  Sun:     { voice: 'rhodes',    octave: 4, role: 'lead',  velocityRange: [72, 102], weight: 1.00 },
  Moon:    { voice: 'felt',      octave: 3, role: 'pad',   velocityRange: [48, 76],  weight: 0.80 },
  Mercury: { voice: 'moog',      octave: 5, role: 'arp',   velocityRange: [54, 86],  weight: 0.60 },
  Venus:   { voice: 'pianoHigh', octave: 4, role: 'comp',  velocityRange: [52, 80],  weight: 0.70 },
  Mars:    { voice: 'celloBow',  octave: 3, role: 'lead',  velocityRange: [66, 96],  weight: 0.65 },
  Jupiter: { voice: 'rhodes',    octave: 3, role: 'comp',  velocityRange: [50, 76],  weight: 0.55 },
  Saturn:  { voice: 'subBass',   octave: 2, role: 'bass',  velocityRange: [50, 78],  weight: 0.60 },
  Uranus:  { voice: 'pianoHigh', octave: 5, role: 'color', velocityRange: [38, 66],  weight: 0.40 },
  Neptune: { voice: 'felt',      octave: 4, role: 'pad',   velocityRange: [30, 54],  weight: 0.36 },
  Pluto:   { voice: 'moog',      octave: 2, role: 'bass',  velocityRange: [36, 66],  weight: 0.52 },
};

// ─── Synastry-specific types ──────────────────────────────────────────────

export interface SynastryAspect {
  planet_a: string;
  planet_b: string;
  aspect: string;
  quality: 'fusion' | 'harmony' | 'tension' | 'dissonance' | 'neutral';
  orb: number;
}

export interface SynastryScoreParams {
  root_a: string;
  root_b: string;
  mode_a: string;
  mode_b: string;
  blended_tempo: number;
  key_distance: number;
  key_relationship: string;
  counterpoint_style: string;
  voice_independence: number;
  rhythmic_interaction: string;
  swing_blend: number;
  tension_index: number;
  compatibility_index: number;
  relationship_type: string;
  dynamic_arc: string;
}

export interface SynastryScore extends Score {
  personASignature: string;
  personBSignature: string;
  synastryAspects: SynastryAspect[];
  compositeRootNote: NoteName;
}

// ─── Utility ──────────────────────────────────────────────────────────────

function normalizeNote(note: string): NoteName {
  const FLATS: Record<string, NoteName> = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  };
  return (FLATS[note] ?? note) as NoteName;
}

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

// Aspect quality → interval offset (for shared moments)
const ASPECT_INTERVAL_MAP: Record<string, number> = {
  fusion: 0,       // unison
  harmony: 4,      // major third (consonant)
  neutral: 7,      // fifth
  tension: 6,      // tritone
  dissonance: 1,   // minor second
};

// ─── Main synastry score builder ──────────────────────────────────────────

export function synastryToScore(
  chartA: ChartData,
  chartB: ChartData,
  scoreParams: SynastryScoreParams,
  synastryAspects: SynastryAspect[],
): SynastryScore {
  // ── Deterministic signatures ──
  const sigA = `${chartA.sunSign}-${chartA.moonSign}-${chartA.ascendant}`;
  const sigB = `${chartB.sunSign}-${chartB.moonSign}-${chartB.ascendant}`;
  const combinedSig = `${sigA}|${sigB}|${scoreParams.relationship_type}`;
  const sigHash = combinedSig.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  const rand = seededRand(Math.abs(sigHash));

  // ── Musical parameters ──
  const rootA = normalizeNote(scoreParams.root_a) as NoteName;
  const rootB = normalizeNote(scoreParams.root_b) as NoteName;
  const modeA = MODES[scoreParams.mode_a] || MODES['Dorian'];
  const modeB = MODES[scoreParams.mode_b] || MODES['Dorian'];

  // Composite root: midpoint of the two roots
  const midRootIdx = Math.floor((NOTE_NAMES.indexOf(rootA) + NOTE_NAMES.indexOf(rootB)) / 2) % 12;
  const compositeRoot = NOTE_NAMES[midRootIdx];

  const bpm = scoreParams.blended_tempo;
  const swing = scoreParams.swing_blend;

  const beatsPerBar = 4;
  const secondsPerBeat = 60 / bpm;
  const secondsPerBar = secondsPerBeat * beatsPerBar;

  // Section durations (bars)
  const introBars = 4;
  const aSectionBars = 8;
  const bSectionBars = 8;
  const bridgeBars = 4;
  const codaBars = 4;
  const totalBars = introBars + aSectionBars + bSectionBars + bridgeBars + codaBars;
  const totalDuration = totalBars * secondsPerBar;

  const sections: ScoreSection[] = [
    { name: 'intro',  startTime: 0, duration: introBars * secondsPerBar },
    { name: 'A',      startTime: introBars * secondsPerBar, duration: aSectionBars * secondsPerBar },
    { name: 'B',      startTime: (introBars + aSectionBars) * secondsPerBar, duration: bSectionBars * secondsPerBar },
    { name: 'bridge', startTime: (introBars + aSectionBars + bSectionBars) * secondsPerBar, duration: bridgeBars * secondsPerBar },
    { name: 'coda',   startTime: (introBars + aSectionBars + bSectionBars + bridgeBars) * secondsPerBar, duration: codaBars * secondsPerBar },
  ];

  // Swing helper
  const swung = (t: number): number => {
    const beatPos = (t / secondsPerBeat) % 1;
    if (beatPos > 0.45 && beatPos < 0.55) return t + secondsPerBeat * swing;
    return t;
  };

  // Build scale note pools
  const scaleA = [...buildScaleNotes(rootA, modeA, 3), ...buildScaleNotes(rootA, modeA, 4), ...buildScaleNotes(rootA, modeA, 5)];
  const scaleB = [...buildScaleNotes(rootB, modeB, 3), ...buildScaleNotes(rootB, modeB, 4), ...buildScaleNotes(rootB, modeB, 5)];
  const compositeMode = scoreParams.compatibility_index > 60 ? modeA : MODES['MelodicMinor'];
  const scaleComposite = [...buildScaleNotes(compositeRoot, compositeMode, 3), ...buildScaleNotes(compositeRoot, compositeMode, 4), ...buildScaleNotes(compositeRoot, compositeMode, 5)];

  const tracks: ScoreTrack[] = [];

  // ── Generate Person A tracks ──
  for (const planet of chartA.planets) {
    const synthParams = PLANET_SYNTH[planet.name];
    if (!synthParams) continue;

    const notes: NoteEvent[] = [];
    const planetSM = SIGN_MUSIC[planet.sign] || SIGN_MUSIC['Leo'];
    const octaveScale = buildScaleNotes(rootA, modeA, synthParams.octave);
    const fullVoice = [...octaveScale, ...buildScaleNotes(rootA, modeA, synthParams.octave + 1)];
    const startDegree = degreeToScaleIndex(planet.degree % 30, modeA.length);
    const density = planetSM.rhythmicDensity * (0.5 + synthParams.weight * 0.6);
    const velRand = () => Math.round(synthParams.velocityRange[0] + rand() * (synthParams.velocityRange[1] - synthParams.velocityRange[0]));

    for (const section of sections) {
      // Person A plays in intro (solo), A, B, and coda
      if (section.name === 'bridge') continue; // bridge is composite voice

      const sectionBars = Math.round(section.duration / secondsPerBar);
      const intensity = section.name === 'intro' ? 0.7 : section.name === 'A' ? 0.9 : section.name === 'B' ? 0.85 : 0.5;

      // Voice drop rules
      if (synthParams.role === 'arp' && section.name === 'intro') continue;
      if (synthParams.role === 'color' && section.name === 'coda') continue;

      for (let bar = 0; bar < sectionBars; bar++) {
        const barStart = section.startTime + bar * secondsPerBar;
        const sectionDensity = density * intensity;

        if (synthParams.role === 'bass') {
          const pattern = [0, 4, 2, 6];
          for (let b = 0; b < 4; b++) {
            if (rand() > sectionDensity + 0.15) continue;
            const beatOffset = b * secondsPerBeat;
            const scaleIdx = (startDegree + pattern[b % pattern.length]) % octaveScale.length;
            notes.push({
              time: swung(barStart + beatOffset),
              pitch: octaveScale[scaleIdx],
              duration: secondsPerBeat * 0.9,
              velocity: velRand(),
              planet: planet.name,
            });
          }
        } else if (synthParams.role === 'lead') {
          const phraseShape = [0, 2, -1, 1, 3, -2, 4, 1];
          for (let b = 0; b < 8; b++) {
            if (rand() > sectionDensity * 0.85) continue;
            const beatOffset = b * (secondsPerBeat / 2);
            const contour = phraseShape[(b + bar * 3) % phraseShape.length];
            const scaleIdx = Math.abs((startDegree + bar + b + contour)) % fullVoice.length;
            notes.push({
              time: swung(barStart + beatOffset),
              pitch: fullVoice[scaleIdx],
              duration: (secondsPerBeat / 2) * (0.6 + rand() * 1.2),
              velocity: velRand(),
              planet: planet.name,
            });
          }
        } else if (synthParams.role === 'comp') {
          const stabs = sectionDensity > 0.5 ? 3 : 2;
          const beatChoices = [0.5, 1.75, 2.5, 3.25];
          for (let s = 0; s < stabs; s++) {
            if (rand() > sectionDensity) continue;
            const beat = beatChoices[(s + bar) % beatChoices.length];
            const tones = [2, 4, 6];
            for (const t of tones) {
              if (rand() > 0.7) continue;
              const idx = (startDegree + t + bar) % fullVoice.length;
              notes.push({
                time: swung(barStart + beat * secondsPerBeat),
                pitch: fullVoice[idx],
                duration: secondsPerBeat * (0.5 + rand() * 0.6),
                velocity: Math.max(35, velRand() - 12),
                planet: planet.name,
              });
            }
          }
        } else if (synthParams.role === 'pad') {
          if (bar % 2 !== 0) continue;
          const idx = (startDegree + bar) % fullVoice.length;
          notes.push({
            time: barStart, pitch: fullVoice[idx],
            duration: secondsPerBar * 1.9, velocity: Math.max(28, velRand() - 20), planet: planet.name,
          });
        } else if (synthParams.role === 'arp') {
          const intervals = [0, 2, 4, 6, 4, 2, 7, 4];
          for (let st = 0; st < 16; st++) {
            if (rand() > sectionDensity * 0.6) continue;
            const stepOffset = st * (secondsPerBar / 16);
            const idx = (startDegree + intervals[st % intervals.length]) % fullVoice.length;
            notes.push({
              time: swung(barStart + stepOffset), pitch: fullVoice[idx],
              duration: (secondsPerBeat / 4) * 0.9, velocity: Math.max(40, velRand() - 8), planet: planet.name,
            });
          }
        }
      }
    }

    if (notes.length > 0) {
      tracks.push({ planet: `A:${planet.name}`, synthParams, notes });
    }
  }

  // ── Generate Person B tracks ──
  for (const planet of chartB.planets) {
    const synthParams = PERSON_B_SYNTH[planet.name] || PLANET_SYNTH[planet.name];
    if (!synthParams) continue;

    const notes: NoteEvent[] = [];
    const planetSM = SIGN_MUSIC[planet.sign] || SIGN_MUSIC['Cancer'];
    const octaveScale = buildScaleNotes(rootB, modeB, synthParams.octave);
    const fullVoice = [...octaveScale, ...buildScaleNotes(rootB, modeB, synthParams.octave + 1)];
    const startDegree = degreeToScaleIndex(planet.degree % 30, modeB.length);
    const density = planetSM.rhythmicDensity * (0.5 + synthParams.weight * 0.6);
    const velRand = () => Math.round(synthParams.velocityRange[0] + rand() * (synthParams.velocityRange[1] - synthParams.velocityRange[0]));

    for (const section of sections) {
      // Person B enters in Section A, plays through B, and coda
      if (section.name === 'intro') continue; // A solo
      if (section.name === 'bridge') continue; // composite voice

      const sectionBars = Math.round(section.duration / secondsPerBar);
      const intensity = section.name === 'A' ? 0.6 : section.name === 'B' ? 1.0 : 0.5;

      if (synthParams.role === 'arp' && section.name === 'coda') continue;
      if (synthParams.role === 'color' && section.name === 'A') continue;

      for (let bar = 0; bar < sectionBars; bar++) {
        const barStart = section.startTime + bar * secondsPerBar;
        const sectionDensity = density * intensity;

        if (synthParams.role === 'bass') {
          const pattern = [0, 3, 5, 2];
          for (let b = 0; b < 4; b++) {
            if (rand() > sectionDensity + 0.15) continue;
            const beatOffset = b * secondsPerBeat;
            const scaleIdx = (startDegree + pattern[b % pattern.length]) % octaveScale.length;
            notes.push({
              time: swung(barStart + beatOffset),
              pitch: octaveScale[scaleIdx],
              duration: secondsPerBeat * 0.85,
              velocity: velRand(),
              planet: planet.name,
            });
          }
        } else if (synthParams.role === 'lead') {
          const phraseShape = [1, -1, 2, 0, 3, -1, 2, -2];
          for (let b = 0; b < 8; b++) {
            if (rand() > sectionDensity * 0.8) continue;
            const beatOffset = b * (secondsPerBeat / 2);
            const contour = phraseShape[(b + bar * 2) % phraseShape.length];
            const scaleIdx = Math.abs((startDegree + bar + b + contour)) % fullVoice.length;
            notes.push({
              time: swung(barStart + beatOffset),
              pitch: fullVoice[scaleIdx],
              duration: (secondsPerBeat / 2) * (0.5 + rand() * 1.0),
              velocity: velRand(),
              planet: planet.name,
            });
          }
        } else if (synthParams.role === 'comp') {
          const stabs = sectionDensity > 0.5 ? 2 : 1;
          const beatChoices = [1.0, 2.25, 3.5];
          for (let s = 0; s < stabs; s++) {
            if (rand() > sectionDensity) continue;
            const beat = beatChoices[(s + bar) % beatChoices.length];
            const tones = [3, 5, 7];
            for (const t of tones) {
              if (rand() > 0.7) continue;
              const idx = (startDegree + t + bar) % fullVoice.length;
              notes.push({
                time: swung(barStart + beat * secondsPerBeat),
                pitch: fullVoice[idx],
                duration: secondsPerBeat * (0.4 + rand() * 0.5),
                velocity: Math.max(32, velRand() - 10),
                planet: planet.name,
              });
            }
          }
        } else if (synthParams.role === 'pad') {
          if (bar % 2 !== 0) continue;
          const idx = (startDegree + bar + 3) % fullVoice.length;
          notes.push({
            time: barStart, pitch: fullVoice[idx],
            duration: secondsPerBar * 1.8, velocity: Math.max(26, velRand() - 18), planet: planet.name,
          });
        } else if (synthParams.role === 'arp') {
          const intervals = [1, 3, 5, 7, 5, 3, 6, 3];
          for (let st = 0; st < 16; st++) {
            if (rand() > sectionDensity * 0.55) continue;
            const stepOffset = st * (secondsPerBar / 16);
            const idx = (startDegree + intervals[st % intervals.length]) % fullVoice.length;
            notes.push({
              time: swung(barStart + stepOffset), pitch: fullVoice[idx],
              duration: (secondsPerBeat / 4) * 0.85, velocity: Math.max(38, velRand() - 6), planet: planet.name,
            });
          }
        }
      }
    }

    if (notes.length > 0) {
      tracks.push({ planet: `B:${planet.name}`, synthParams, notes });
    }
  }

  // ── Bridge section: composite voice (relationship entity) ──
  const bridgeSection = sections.find(s => s.name === 'bridge')!;
  const bridgeScale = buildScaleNotes(compositeRoot, compositeMode, 4);
  const bridgeFullVoice = [...bridgeScale, ...buildScaleNotes(compositeRoot, compositeMode, 5)];
  const bridgeNotes: NoteEvent[] = [];
  const bridgeBarsCount = Math.round(bridgeSection.duration / secondsPerBar);

  for (let bar = 0; bar < bridgeBarsCount; bar++) {
    const barStart = bridgeSection.startTime + bar * secondsPerBar;
    // Composite melody: uses both charts' key aspects to shape the line
    for (let b = 0; b < 8; b++) {
      if (rand() > 0.65) continue;
      const beatOffset = b * (secondsPerBeat / 2);
      const aspIdx = (bar * 8 + b) % Math.max(1, synastryAspects.length);
      const asp = synastryAspects[aspIdx];
      const intervalShift = asp ? (ASPECT_INTERVAL_MAP[asp.quality] || 0) : 0;
      const scaleIdx = (b + bar * 2 + intervalShift) % bridgeFullVoice.length;
      bridgeNotes.push({
        time: swung(barStart + beatOffset),
        pitch: bridgeFullVoice[scaleIdx],
        duration: (secondsPerBeat / 2) * (0.7 + rand() * 0.8),
        velocity: Math.round(65 + rand() * 25),
        planet: 'Composite',
      });
    }
  }

  if (bridgeNotes.length > 0) {
    tracks.push({
      planet: 'Composite',
      synthParams: { voice: 'pianoMid', octave: 4, role: 'lead', velocityRange: [65, 95], weight: 0.9 },
      notes: bridgeNotes,
    });
  }

  // ── Shared harmonic moments from synastry aspects ──
  // Inject "meeting points" where both voices align on shared tones
  const sharedNotes: NoteEvent[] = [];
  const bSection = sections.find(s => s.name === 'B')!;
  for (let i = 0; i < Math.min(synastryAspects.length, 8); i++) {
    const asp = synastryAspects[i];
    const interval = ASPECT_INTERVAL_MAP[asp.quality] || 3;
    const time = bSection.startTime + (i / Math.max(1, synastryAspects.length)) * bSection.duration;
    const baseIdx = (i * 3) % scaleComposite.length;
    sharedNotes.push({
      time,
      pitch: scaleComposite[baseIdx],
      duration: secondsPerBeat * 2,
      velocity: Math.round(70 + (1 - asp.orb / 8) * 30),
      planet: `${asp.planet_a}↔${asp.planet_b}`,
    });
    // Add interval tone
    sharedNotes.push({
      time: time + secondsPerBeat * 0.1,
      pitch: scaleComposite[(baseIdx + interval) % scaleComposite.length],
      duration: secondsPerBeat * 1.8,
      velocity: Math.round(60 + (1 - asp.orb / 8) * 25),
      planet: `${asp.planet_a}↔${asp.planet_b}`,
    });
  }

  if (sharedNotes.length > 0) {
    tracks.push({
      planet: 'Synastry',
      synthParams: { voice: 'rhodes', octave: 4, role: 'color', velocityRange: [55, 85], weight: 0.7 },
      notes: sharedNotes,
    });
  }

  return {
    bpm,
    mode: scoreParams.mode_a,
    rootNote: rootA,
    scaleNotes: scaleA,
    sections,
    tracks,
    totalDuration,
    chartSignature: combinedSig,
    swing,
    personASignature: sigA,
    personBSignature: sigB,
    synastryAspects,
    compositeRootNote: compositeRoot,
  };
}
