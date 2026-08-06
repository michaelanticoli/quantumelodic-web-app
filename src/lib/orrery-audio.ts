/**
 * The Quantumelodic Audio Engine.
 * Web Audio API-based synthesis — planet voices, layered chords,
 * breathing ambience, and a shared analyser for visualisations.
 */

export type VoiceHandle = {
  osc: OscillatorNode;
  gain: GainNode;
  lfo: OscillatorNode;
  lfoG: GainNode;
  filter: BiquadFilterNode;
};

export class CosmicAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  analyser: AnalyserNode | null = null;
  timeData: Uint8Array | null = null;
  voices = new Map<string, VoiceHandle>();
  ambient: VoiceHandle | null = null;
  muted = false;

  init() {
    if (this.ctx) return;
    const Ctx = (window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext) as typeof AudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.18;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.master.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private makeVoice(freq: number, type: OscillatorType): VoiceHandle {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(freq * 4, 9000);
    filter.Q.value = 0.7;
    gain.gain.value = 0;
    lfo.frequency.value = 0.3 + Math.random() * 0.4;
    lfoG.gain.value = freq * 0.003;

    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);
    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start();
    lfo.start();
    return { osc, gain, lfo, lfoG, filter };
  }

  private ramp(g: GainNode, target: number, t = 0.4) {
    const now = this.ctx!.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(target, now + t);
  }

  private kill(v: VoiceHandle, t = 0.45) {
    this.ramp(v.gain, 0, t);
    setTimeout(() => {
      try {
        v.osc.stop();
      } catch {/* ignore */}
      try {
        v.lfo.stop();
      } catch {/* ignore */}
    }, t * 1000 + 200);
  }

  /**
   * Set the active chord — body names → freq/type pairs.
   * Voices not in the new set fade out; new ones fade in.
   */
  setChord(spec: { name: string; frequency: number; waveform: OscillatorType }[]) {
    if (!this.ctx) this.init();
    this.resume();
    const names = new Set(spec.map((s) => s.name));
    for (const [name, v] of this.voices) {
      if (!names.has(name)) {
        this.kill(v);
        this.voices.delete(name);
      }
    }
    const base = 0.5 / Math.sqrt(Math.max(spec.length, 1));
    for (const s of spec) {
      let v = this.voices.get(s.name);
      if (!v) {
        v = this.makeVoice(s.frequency, s.waveform);
        this.voices.set(s.name, v);
      }
      v.osc.frequency.setTargetAtTime(s.frequency, this.ctx!.currentTime, 0.05);
      v.osc.type = s.waveform;
      this.ramp(v.gain, base);
    }
  }

  stopAll() {
    for (const v of this.voices.values()) this.kill(v);
    this.voices.clear();
    this.stopAmbient();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.18;
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /** Soft 432 Hz ambient sine for the breathing layer. */
  startAmbient(freq = 432, target = 0.08) {
    if (!this.ctx) this.init();
    this.resume();
    if (this.ambient) this.kill(this.ambient);
    this.ambient = this.makeVoice(freq, 'sine');
    this.ramp(this.ambient.gain, target, 2);
  }

  stopAmbient() {
    if (this.ambient) {
      this.kill(this.ambient, 1.5);
      this.ambient = null;
    }
  }

  blip(freq: number, dur = 0.35) {
    if (!this.ctx) this.init();
    this.resume();
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.25, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g).connect(this.master!);
    o.start(now);
    o.stop(now + dur + 0.1);
  }
}

export const orreryAudio = new CosmicAudio();
