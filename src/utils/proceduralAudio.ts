/**
 * Procedural audio generator using Web Audio API.
 * Produces ambient tones derived from a birth chart's planetary positions.
 */
import type { ChartData } from '@/types/astrology';

// Map zodiac signs to base frequencies (Hz) — rooted in harmonic ratios
const signFrequencies: Record<string, number> = {
  Aries: 440,       // A4
  Taurus: 349.23,   // F4
  Gemini: 392,       // G4
  Cancer: 220,       // A3
  Leo: 293.66,       // D4
  Virgo: 293.66,     // D4 (Dorian)
  Libra: 466.16,     // Bb4
  Scorpio: 493.88,   // B4
  Sagittarius: 329.63, // E4
  Capricorn: 261.63, // C4
  Aquarius: 369.99,  // F#4
  Pisces: 329.63,    // E4 (Phrygian)
};

// Planet frequency multipliers (octave offsets from the sign's base)
const planetMultipliers: Record<string, number> = {
  Sun: 1,
  Moon: 0.5,
  Mercury: 2,
  Venus: 1.5,
  Mars: 0.75,
  Jupiter: 0.25,
  Saturn: 0.375,
  Uranus: 3,
  Neptune: 0.1875,
  Pluto: 0.125,
};

/**
 * Generate ~15 seconds of ambient procedural audio from a birth chart.
 * Returns a blob URL ready for <audio> playback.
 */
export async function generateProceduralAudio(chart: ChartData): Promise<string> {
  const ctx = new OfflineAudioContext(2, 44100 * 15, 44100);
  const duration = 15;

  // Master gain
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.15, 0);
  master.connect(ctx.destination);

  // Reverb-like effect via delay
  const delay = ctx.createDelay(1);
  delay.delayTime.setValueAtTime(0.4, 0);
  const feedback = ctx.createGain();
  feedback.gain.setValueAtTime(0.3, 0);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);

  // Get base frequency from sun sign
  const baseFreq = signFrequencies[chart.sunSign] || 261.63;

  // Create layered tones from each planet
  chart.planets.forEach((planet) => {
    const mult = planetMultipliers[planet.name] || 1;
    const freq = baseFreq * mult;

    // Skip inaudible frequencies
    if (freq < 20 || freq > 8000) return;

    // Main oscillator — sine for warmth
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, 0);
    // Slight detuning based on zodiac degree for organic feel
    osc.detune.setValueAtTime((planet.degree % 30) - 15, 0);

    // Envelope
    const env = ctx.createGain();
    const attackTime = 2 + (planet.degree % 3);
    env.gain.setValueAtTime(0, 0);
    env.gain.linearRampToValueAtTime(0.08, attackTime);
    env.gain.setValueAtTime(0.08, duration - 3);
    env.gain.linearRampToValueAtTime(0, duration);

    osc.connect(env);
    env.connect(master);
    env.connect(delay);

    osc.start(0);
    osc.stop(duration);

    // Harmonic overtone for richness
    if (planet.name === 'Sun' || planet.name === 'Moon' || planet.name === 'Venus') {
      const harmonic = ctx.createOscillator();
      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(freq * 1.5, 0);

      const hEnv = ctx.createGain();
      hEnv.gain.setValueAtTime(0, 0);
      hEnv.gain.linearRampToValueAtTime(0.03, attackTime + 1);
      hEnv.gain.setValueAtTime(0.03, duration - 4);
      hEnv.gain.linearRampToValueAtTime(0, duration);

      harmonic.connect(hEnv);
      hEnv.connect(master);

      harmonic.start(0);
      harmonic.stop(duration);
    }

    // Retrograde planets get a slow LFO tremolo
    if (planet.isRetrograde) {
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.3, 0);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.02, 0);
      lfo.connect(lfoGain);
      lfoGain.connect(env.gain);
      lfo.start(0);
      lfo.stop(duration);
    }
  });

  // Sub-bass drone from moon sign
  const moonFreq = signFrequencies[chart.moonSign] || 220;
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(moonFreq * 0.25, 0);
  const subEnv = ctx.createGain();
  subEnv.gain.setValueAtTime(0, 0);
  subEnv.gain.linearRampToValueAtTime(0.06, 4);
  subEnv.gain.setValueAtTime(0.06, duration - 4);
  subEnv.gain.linearRampToValueAtTime(0, duration);
  sub.connect(subEnv);
  subEnv.connect(master);
  sub.start(0);
  sub.stop(duration);

  // Render and encode as WAV
  const rendered = await ctx.startRendering();
  const wav = audioBufferToWav(rendered);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/** Convert AudioBuffer to WAV ArrayBuffer */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const dataLength = length * numChannels * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave channels
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
