// Chroma-based key detection (Krumhansl–Schmuckler correlation) for finished MP3s.
// Runs in the browser via Web Audio decoding — used to verify that an ElevenLabs
// track actually landed in the key the chart assigned to it.

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export interface DetectedKey {
  /** e.g. "D minor" */
  label: string;
  tonic: string;
  isMinor: boolean;
  /** 0–1 correlation strength of the winning profile */
  confidence: number;
}

/** Normalises "Eb major", "F# Lydian", "B locrian" → { tonic: 'D#'|'F#'…, isMinor } */
export function parseKeyLabel(key: string): { tonic: string; isMinor: boolean } | null {
  const m = key.trim().match(/^([A-Ga-g])\s*(#|b|♯|♭)?\s*(.*)$/);
  if (!m) return null;
  let tonic = m[1].toUpperCase();
  const accidental = m[2];
  if (accidental === '#' || accidental === '♯') {
    tonic = PITCH_CLASSES[(PITCH_CLASSES.indexOf(tonic) + 1) % 12];
  } else if (accidental === 'b' || accidental === '♭') {
    tonic = PITCH_CLASSES[(PITCH_CLASSES.indexOf(tonic) + 11) % 12];
  }
  const rest = (m[3] || '').toLowerCase();
  // Minor-flavoured modes count as minor for tonal comparison purposes.
  const isMinor = /min|aeolian|dorian|phrygian|locrian/.test(rest);
  return { tonic, isMinor };
}

function correlate(chroma: number[], profile: number[], shift: number): number {
  const rotated = profile.map((_, i) => profile[(i - shift + 12) % 12]);
  const meanA = chroma.reduce((a, b) => a + b, 0) / 12;
  const meanB = rotated.reduce((a, b) => a + b, 0) / 12;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < 12; i++) {
    const da = chroma[i] - meanA;
    const db = rotated[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

/** Accumulate a 12-bin chroma vector from decoded PCM using a Goertzel bank. */
function chromaFromPcm(pcm: Float32Array, sampleRate: number): number[] {
  const chroma = new Array(12).fill(0);
  const frameSize = 8192;
  const hop = frameSize * 2;
  // Analyse octaves C2–C6 for each pitch class.
  const freqs: Array<{ pc: number; f: number }> = [];
  for (let pc = 0; pc < 12; pc++) {
    for (let octave = 2; octave <= 6; octave++) {
      // MIDI note for pitch class pc at this octave (C2 = midi 36)
      const midi = 12 * (octave + 1) + pc;
      freqs.push({ pc, f: 440 * Math.pow(2, (midi - 69) / 12) });
    }
  }

  for (let start = 0; start + frameSize < pcm.length; start += hop) {
    for (const { pc, f } of freqs) {
      const w = (2 * Math.PI * f) / sampleRate;
      const coeff = 2 * Math.cos(w);
      let s0 = 0, s1 = 0, s2 = 0;
      for (let i = 0; i < frameSize; i++) {
        s0 = pcm[start + i] + coeff * s1 - s2;
        s2 = s1;
        s1 = s0;
      }
      const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
      chroma[pc] += Math.sqrt(Math.max(power, 0));
    }
  }

  const max = Math.max(...chroma);
  return max > 0 ? chroma.map((v) => v / max) : chroma;
}

/** Detect the key of an audio blob. Returns null if decoding is unavailable. */
export async function detectKeyFromBlob(blob: Blob): Promise<DetectedKey | null> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const raw = buf.getChannelData(0);
    // Downsample to ~11 kHz for speed; bass/mid content is what matters here.
    const factor = Math.max(1, Math.floor(buf.sampleRate / 11025));
    const pcm = new Float32Array(Math.floor(raw.length / factor));
    for (let i = 0; i < pcm.length; i++) pcm[i] = raw[i * factor];
    const chroma = chromaFromPcm(pcm, buf.sampleRate / factor);

    let best: DetectedKey | null = null;
    for (let shift = 0; shift < 12; shift++) {
      for (const [profile, isMinor] of [[MAJOR_PROFILE, false], [MINOR_PROFILE, true]] as const) {
        const score = correlate(chroma, profile as number[], shift);
        if (!best || score > best.confidence) {
          best = {
            tonic: PITCH_CLASSES[shift],
            isMinor: isMinor as boolean,
            confidence: score,
            label: `${PITCH_CLASSES[shift]} ${isMinor ? 'minor' : 'major'}`,
          };
        }
      }
    }
    return best;
  } catch (e) {
    console.warn('key detection failed', e);
    return null;
  } finally {
    void ctx.close();
  }
}

/** True when the measured key matches the assigned key label (tonic + quality). */
export function keyMatches(assigned: string, detected: DetectedKey, minConfidence = 0.7): boolean {
  const target = parseKeyLabel(assigned);
  if (!target) return true; // nothing to compare against
  if (detected.confidence < minConfidence) return true; // ambiguous — don't punish the track
  return detected.tonic === target.tonic && detected.isMinor === target.isMinor;
}
