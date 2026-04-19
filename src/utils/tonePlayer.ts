/**
 * QuantumMelodic Tone.js Player + Offline Renderer
 * Takes a Score and plays it via Tone.js, or renders it to a WAV blob URL.
 */
import * as Tone from 'tone';
import type { Score, ScoreTrack, NoteEvent } from './chartToScore';

const MIN_TRIMMED_NOTE_DURATION_SECONDS = 0.25;

// ─── Offline render to WAV blob URL ──────────────────────────────────────

export async function renderScoreToAudioUrl(score: Score): Promise<string> {
  const duration = score.totalDuration;

  const buffer = await Tone.Offline(async ({ transport }) => {
    transport.bpm.value = score.bpm;

    const players = buildTonePlayers(score.tracks, true);

    // Schedule all note events
    for (const { track, synth, reverb, chorus } of players) {
      for (const note of track.notes) {
        const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();
        const vel = note.velocity / 127;
        transport.schedule((time) => {
          try {
            (synth as Tone.PolySynth).triggerAttackRelease(freq, note.duration, time, vel);
          } catch {
            return;
          }
        }, note.time);
      }
    }

    transport.start();
  }, duration);

  // Convert to WAV
  const wav = audioBufferToWav(buffer.get()!);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export async function renderPreviewScoreToAudioUrl(score: Score, maxDuration = 24): Promise<string> {
  return renderScoreToAudioUrl(trimScore(score, maxDuration));
}

// ─── Live playback engine ─────────────────────────────────────────────────

interface LivePlayer {
  track: ScoreTrack;
  synth: Tone.PolySynth;
  reverb: Tone.Reverb;
  chorus: Tone.Chorus;
  parts: Tone.Part[];
}

let activePlayers: LivePlayer[] = [];
let isScheduled = false;

export function isLivePlaying(): boolean {
  return Tone.getTransport().state === 'started';
}

export async function startLivePlayback(score: Score, onProgress?: (t: number) => void): Promise<void> {
  await stopLivePlayback();
  await Tone.start();

  const transport = Tone.getTransport();
  transport.bpm.value = score.bpm;
  transport.stop();
  transport.cancel();

  const players = buildTonePlayers(score.tracks, false);
  activePlayers = players;

  for (const { track, synth } of players) {
    const part = new Tone.Part((time, note: NoteEvent) => {
      const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();
      const vel = note.velocity / 127;
      try {
        synth.triggerAttackRelease(freq, note.duration, time, vel);
      } catch {
        return;
      }
    }, track.notes.map(n => [n.time, n]));

    part.start(0);
    players.find(p => p.track === track)!.parts.push(part);
  }

  if (onProgress) {
    const interval = setInterval(() => {
      const pos = transport.seconds;
      onProgress(pos / score.totalDuration);
      if (pos >= score.totalDuration) clearInterval(interval);
    }, 250);
  }

  transport.start();
  isScheduled = true;
}

export async function stopLivePlayback(): Promise<void> {
  const transport = Tone.getTransport();
  transport.stop();
  transport.cancel();

  for (const player of activePlayers) {
    for (const part of player.parts) {
      part.stop();
      part.dispose();
    }
    player.synth.releaseAll();
    player.synth.dispose();
    player.reverb.dispose();
    player.chorus.dispose();
  }
  activePlayers = [];
  isScheduled = false;
}

export function pauseLivePlayback(): void {
  Tone.getTransport().pause();
}

export function resumeLivePlayback(): void {
  Tone.getTransport().start();
}

// ─── Synth builder ────────────────────────────────────────────────────────

function buildTonePlayers(tracks: ScoreTrack[], offline: boolean): LivePlayer[] {
  const players: LivePlayer[] = [];

  for (const track of tracks) {
    const p = track.synthParams;

    // Reverb
    const reverb = new Tone.Reverb({
      decay: 3 + p.reverbWet * 4,
      wet: p.reverbWet,
    }).toDestination();

    // Chorus
    const chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.5,
      wet: p.chorusWet,
    }).connect(reverb);
    chorus.start();

    // PolySynth with envelope shaped to planet
    const oscType = mapOscType(p.oscillatorType);
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscType },
      envelope: {
        attack: p.attackTime,
        decay: p.decayTime,
        sustain: p.sustainLevel,
        release: p.releaseTime,
      },
      volume: Tone.gainToDb(p.weight * 0.5),
    }).connect(chorus);

    players.push({ track, synth, reverb, chorus, parts: [] });
  }

  return players;
}

function mapOscType(type: string): OscillatorType {
  switch (type) {
    case 'fmsine':     return 'fmsine' as OscillatorType;
    case 'amsine':     return 'amsine' as OscillatorType;
    case 'fmsawtooth': return 'fmsawtooth' as OscillatorType;
    default:           return type as OscillatorType;
  }
}

function trimScore(score: Score, maxDuration: number): Score {
  if (score.totalDuration <= maxDuration) {
    return score;
  }

  return {
    ...score,
    sections: score.sections
      .filter((section) => section.startTime < maxDuration)
      .map((section) => ({
        ...section,
        duration: Math.min(section.duration, maxDuration - section.startTime),
      })),
    tracks: score.tracks.map((track) => ({
      ...track,
      notes: track.notes
        .filter((note) => note.time < maxDuration)
        .map((note) => ({
          ...note,
          duration: Math.min(note.duration, Math.max(MIN_TRIMMED_NOTE_DURATION_SECONDS, maxDuration - note.time)),
        })),
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

  const ws = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

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

// ─── Get current playback waveform data (for visualizer) ─────────────────

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
