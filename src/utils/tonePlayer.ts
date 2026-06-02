/**
 * QuantumMelodic Tone.js Player + Offline Renderer
 * Piano-noir voice palette. No flutes, no harps, no orchestral pads.
 */
import * as Tone from 'tone';
import type { Score, ScoreTrack, NoteEvent, PlanetVoice } from './chartToScore';

const MIN_TRIMMED_NOTE_DURATION_SECONDS = 0.25;

// ─── Offline render to WAV blob URL ──────────────────────────────────────

export async function renderScoreToAudioUrl(score: Score): Promise<string> {
  const duration = score.totalDuration;

  const buffer = await Tone.Offline(async ({ transport }) => {
    transport.bpm.value = score.bpm;
    transport.swing = score.swing || 0;
    transport.swingSubdivision = '8n';

    // Master bus: gentle tape compression + saturation for noir warmth.
    const master = new Tone.Compressor({ threshold: -18, ratio: 3, attack: 0.01, release: 0.25 }).toDestination();
    const sat = new Tone.Chebyshev(1.5).connect(master);
    const masterReverb = new Tone.Reverb({ decay: 2.2, wet: 0.18, preDelay: 0.04 });
    await masterReverb.generate();
    masterReverb.connect(sat);

    const built = score.tracks.map((t) => buildVoice(t.synthParams.voice, t.synthParams.weight, masterReverb));

    score.tracks.forEach((track, i) => {
      const { synth } = built[i];
      for (const note of track.notes) {
        const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();
        const vel = note.velocity / 127;
        transport.schedule((time) => {
          try { synth.triggerAttackRelease(freq, note.duration, time, vel); } catch { /* noop */ }
        }, note.time);
      }
    });

    transport.start();
  }, duration);

  const wav = audioBufferToWav(buffer.get()!);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export async function renderPreviewScoreToAudioUrl(score: Score, maxDuration = 30): Promise<string> {
  return renderScoreToAudioUrl(trimScore(score, maxDuration));
}

// ─── Live playback engine ─────────────────────────────────────────────────

interface LivePlayer {
  track: ScoreTrack;
  synth: Tone.PolySynth | Tone.MonoSynth | Tone.FMSynth;
  parts: Tone.Part[];
}

let activePlayers: LivePlayer[] = [];

export function isLivePlaying(): boolean {
  return Tone.getTransport().state === 'started';
}

export async function startLivePlayback(score: Score, onProgress?: (t: number) => void): Promise<void> {
  await stopLivePlayback();
  await Tone.start();

  const transport = Tone.getTransport();
  transport.bpm.value = score.bpm;
  transport.swing = score.swing || 0;
  transport.swingSubdivision = '8n';
  transport.stop();
  transport.cancel();

  const masterReverb = new Tone.Reverb({ decay: 2.2, wet: 0.16, preDelay: 0.04 });
  await masterReverb.generate();
  const sat = new Tone.Chebyshev(1.5);
  const master = new Tone.Compressor({ threshold: -18, ratio: 3, attack: 0.01, release: 0.25 }).toDestination();
  masterReverb.connect(sat); sat.connect(master);

  activePlayers = [];
  for (const track of score.tracks) {
    const { synth } = buildVoice(track.synthParams.voice, track.synthParams.weight, masterReverb);
    const part = new Tone.Part((time, note: NoteEvent) => {
      const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();
      try { (synth as Tone.PolySynth).triggerAttackRelease(freq, note.duration, time, note.velocity / 127); } catch { /* noop */ }
    }, track.notes.map(n => [n.time, n]));
    part.start(0);
    activePlayers.push({ track, synth, parts: [part] });
  }

  if (onProgress) {
    const interval = setInterval(() => {
      const pos = transport.seconds;
      onProgress(pos / score.totalDuration);
      if (pos >= score.totalDuration) clearInterval(interval);
    }, 250);
  }

  transport.start();
}

export async function stopLivePlayback(): Promise<void> {
  const transport = Tone.getTransport();
  transport.stop();
  transport.cancel();

  for (const p of activePlayers) {
    for (const part of p.parts) { part.stop(); part.dispose(); }
    try { (p.synth as Tone.PolySynth).releaseAll(); } catch { /* noop */ }
    p.synth.dispose();
  }
  activePlayers = [];
}

export function pauseLivePlayback(): void { Tone.getTransport().pause(); }
export function resumeLivePlayback(): void { Tone.getTransport().start(); }

// ─── Voice factory ────────────────────────────────────────────────────────

interface BuiltVoice {
  synth: Tone.PolySynth | Tone.MonoSynth | Tone.FMSynth;
}

/**
 * Map a PlanetVoice to a Tone.js synth chain. The aesthetic target is
 * acoustic piano at the center with noir/new-jazz colors around it —
 * felt piano, Rhodes, bowed cello, sub bass, Moog mono. No spa pads.
 */
export function buildVoice(voice: PlanetVoice, weight: number, destination?: Tone.ToneAudioNode): BuiltVoice {
  const dest = destination ?? Tone.getDestination();
  const vol = Tone.gainToDb(Math.max(0.05, weight * 0.55));

  switch (voice) {
    case 'pianoMid':
    case 'pianoLow':
    case 'pianoHigh': {
      // FM-synthesized acoustic piano approximation
      const synth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2.5,
        modulationIndex: 6,
        oscillator: { type: 'triangle' },
        modulation: { type: 'sine' },
        envelope: { attack: 0.005, decay: 1.4, sustain: 0.15, release: 1.6 },
        modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0.0, release: 0.3 },
        volume: vol,
      });
      const eq = new Tone.EQ3({ low: voice === 'pianoLow' ? 2 : -2, mid: 1, high: voice === 'pianoHigh' ? 3 : 0 });
      synth.chain(eq, dest);
      return { synth };
    }
    case 'felt': {
      // Muted felted piano — soft hammer, dark
      const synth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 1.5,
        modulationIndex: 2,
        oscillator: { type: 'sine' },
        modulation: { type: 'triangle' },
        envelope: { attack: 0.04, decay: 1.8, sustain: 0.25, release: 2.4 },
        modulationEnvelope: { attack: 0.05, decay: 0.4, sustain: 0.1, release: 0.5 },
        volume: vol - 2,
      });
      const lpf = new Tone.Filter(1800, 'lowpass');
      synth.chain(lpf, dest);
      return { synth };
    }
    case 'rhodes': {
      const synth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 4,
        oscillator: { type: 'sine' },
        modulation: { type: 'square' },
        envelope: { attack: 0.005, decay: 1.0, sustain: 0.4, release: 1.2 },
        modulationEnvelope: { attack: 0.002, decay: 0.5, sustain: 0.05, release: 0.4 },
        volume: vol - 1,
      });
      const trem = new Tone.Tremolo(4.5, 0.25).start();
      synth.chain(trem, dest);
      return { synth };
    }
    case 'celloBow': {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.4, decay: 0.3, sustain: 0.7, release: 1.4 },
        volume: vol - 3,
      });
      const lpf = new Tone.Filter(1200, 'lowpass');
      const eq = new Tone.EQ3({ low: 2, mid: -2, high: -4 });
      synth.chain(lpf, eq, dest);
      return { synth };
    }
    case 'subBass': {
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        filter: { type: 'lowpass', frequency: 200, Q: 1 },
        envelope: { attack: 0.02, decay: 0.6, sustain: 0.8, release: 0.8 },
        volume: vol - 2,
      });
      synth.connect(dest);
      return { synth };
    }
    case 'moog': {
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        filter: { type: 'lowpass', frequency: 900, Q: 4 },
        filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.6, baseFrequency: 200, octaves: 3 },
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.4, release: 0.6 },
        volume: vol - 4,
      });
      synth.connect(dest);
      return { synth };
    }
    case 'perc':
    default: {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
        volume: vol - 4,
      });
      const hpf = new Tone.Filter(400, 'highpass');
      synth.chain(hpf, dest);
      return { synth };
    }
  }
}

function trimScore(score: Score, maxDuration: number): Score {
  if (score.totalDuration <= maxDuration) return score;
  return {
    ...score,
    sections: score.sections
      .filter(s => s.startTime < maxDuration)
      .map(s => ({ ...s, duration: Math.min(s.duration, maxDuration - s.startTime) })),
    tracks: score.tracks.map(t => ({
      ...t,
      notes: t.notes
        .filter(n => n.time < maxDuration)
        .map(n => ({ ...n, duration: Math.min(n.duration, Math.max(MIN_TRIMMED_NOTE_DURATION_SECONDS, maxDuration - n.time)) })),
    })),
    totalDuration: maxDuration,
  };
}

// ─── WAV encoder ─────────────────────────────────────────────────────────

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const dataLength = length * numChannels * bytesPerSample;
  const ab = new ArrayBuffer(44 + dataLength);
  const view = new DataView(ab);
  const ws = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, 36 + dataLength, true);
  ws(8, 'WAVE'); ws(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true); view.setUint16(34, 16, true);
  ws(36, 'data'); view.setUint32(40, dataLength, true);
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return ab;
}

// ─── Visualizer analyser ─────────────────────────────────────────────────

let analyser: Tone.Analyser | null = null;
export function getOrCreateAnalyser(): Tone.Analyser {
  if (!analyser) {
    analyser = new Tone.Analyser('waveform', 256);
    Tone.getDestination().connect(analyser);
  }
  return analyser;
}
export function getWaveformData(): Float32Array {
  if (!analyser) return new Float32Array(256).fill(0);
  return analyser.getValue() as Float32Array;
}
