/**
 * CosmicWaveform — lightweight replacement for AudioReactiveGradient.
 * Renders a minimal starfield + thin frequency bars that react to audio.
 * When idle it breathes gently. Zero heavy canvas wave-layers.
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import { fftToChroma, pitchClassHue, PITCH_CLASSES } from '@/lib/synesthesia';

export type WaveformPalette = 'gold' | 'fire' | 'earth' | 'air' | 'water';

interface CosmicWaveformProps {
  audioElement?: HTMLAudioElement | null;
  palette?: WaveformPalette;
  idleIntensity?: number;
  className?: string;
  /** Show the live Chromatone pitch-colour ring + dominant note readout */
  showChroma?: boolean;
}

// Primary hues per palette (HSL h values)
const PALETTE_HUE: Record<WaveformPalette, [number, number]> = {
  gold:  [43, 35],
  fire:  [15, 0],
  earth: [90, 45],
  air:   [195, 220],
  water: [200, 255],
};

const SIGN_PALETTES: Record<string, WaveformPalette> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
};

export function paletteFromSign(sign?: string): WaveformPalette {
  return (sign && SIGN_PALETTES[sign]) || 'gold';
}

export const CosmicWaveform = ({
  audioElement,
  palette = 'gold',
  idleIntensity = 0.4,
  className = '',
  showChroma = true,
}: CosmicWaveformProps) => {
  const chromaRef = useRef<number[]>(new Array(12).fill(0));
  const [dominant, setDominant] = useState<number | null>(null);
  const lastDomRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const freqDataRef = useRef(new Uint8Array(128));
  const tRef = useRef(0);
  const starsRef = useRef<{ x: number; y: number; r: number; phase: number }[]>([]);
  const paletteRef = useRef(palette);

  useEffect(() => { paletteRef.current = palette; }, [palette]);

  // Connect audio analyser
  useEffect(() => {
    if (!audioElement) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 8192;
        analyserRef.current.smoothingTimeConstant = 0.8;
        analyserRef.current.connect(ctx.destination);
      }
      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
      }
      freqDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    } catch (e) {
      console.warn('CosmicWaveform: analyser connect failed', e);
    }
  }, [audioElement]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      // Seed stars
      starsRef.current = Array.from({ length: 55 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.2,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    tRef.current += 0.018;
    const t = tRef.current;

    // Frequency data
    let bands: number[] = [];
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(freqDataRef.current);
      const binCount = freqDataRef.current.length;
      // Log-spaced bands over the musical range (~40Hz–4kHz)
      const sr = audioCtxRef.current?.sampleRate || 44100;
      const binHz = sr / (binCount * 2);
      const target = fftToChroma(freqDataRef.current, sr, binCount * 2);
      chromaRef.current = chromaRef.current.map((c, i) => c * 0.85 + target[i] * 0.15);
      const edges = Array.from({ length: 33 }, (_, k) => Math.max(1, Math.floor((40 * Math.pow(100, k / 32)) / binHz)));
      for (let b = 0; b < 32; b++) {
        let sum = 0; let n = 0;
        for (let i = edges[b]; i <= Math.max(edges[b], edges[b + 1] - 1); i++) { sum += freqDataRef.current[i]; n++; }
        bands.push((sum / Math.max(n, 1)) / 255);
      }
    }
    const hasAudio = bands.length > 0 && bands.some(v => v > 0.02);
    if (!hasAudio) {
      bands = Array.from({ length: 32 }, (_, i) =>
        idleIntensity * (0.3 + 0.2 * Math.sin(t * 0.8 + i * 0.4))
      );
    }

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, w, h);

    let [h1, h2] = PALETTE_HUE[paletteRef.current];
    // ── Synesthetic tint: dominant pitch class drives hue (Chromatone wheel) ──
    const chroma = chromaRef.current;
    let dom = -1; let domV = 0;
    chroma.forEach((v, i) => { if (v > domV) { domV = v; dom = i; } });
    if (hasAudio && dom >= 0 && domV > 0.3) {
      h1 = pitchClassHue(dom);
      h2 = pitchClassHue(dom + 7); // the fifth
      if (lastDomRef.current !== dom) { lastDomRef.current = dom; setDominant(dom); }
      // ambient glow of the sounding note
      const glow = ctx.createRadialGradient(w / 2, h * 0.7, 0, w / 2, h * 0.7, w * 0.6);
      glow.addColorStop(0, `hsla(${h1}, 90%, 55%, 0.18)`);
      glow.addColorStop(1, `hsla(${h1}, 90%, 55%, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Stars ──────────────────────────────────────────────
    starsRef.current.forEach(star => {
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.5 + star.phase));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r * twinkle, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${h1}, 60%, 80%, ${twinkle * 0.55})`;
      ctx.fill();
    });

    // ── Frequency bars (centre-mirrored) ──────────────────
    const barCount = 32;
    const barW = (w / barCount) * 0.55;
    const baseY = h * 0.72;
    const maxBarH = h * 0.45;

    for (let i = 0; i < barCount; i++) {
      const v = bands[i] || 0;
      const barH = v * maxBarH;
      const x = (i / barCount) * w + w / barCount / 2;
      const hue = hasAudio && domV > 0.3 ? pitchClassHue(Math.round((i / barCount) * 12 * 2)) : h1 + ((h2 - h1) * i) / barCount;
      const alpha = 0.4 + v * 0.6;

      // Bar
      const grad = ctx.createLinearGradient(x, baseY, x, baseY - barH);
      grad.addColorStop(0, `hsla(${hue}, 70%, 45%, ${alpha * 0.3})`);
      grad.addColorStop(0.6, `hsla(${hue}, 80%, 65%, ${alpha})`);
      grad.addColorStop(1, `hsla(${hue}, 90%, 85%, ${Math.min(1, alpha + 0.2)})`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x - barW / 2, baseY - barH, barW, barH, 2);
      ctx.fill();

      // Mirror below (faint)
      const gradM = ctx.createLinearGradient(x, baseY, x, baseY + barH * 0.35);
      gradM.addColorStop(0, `hsla(${hue}, 70%, 50%, ${alpha * 0.18})`);
      gradM.addColorStop(1, `hsla(${hue}, 70%, 50%, 0)`);
      ctx.fillStyle = gradM;
      ctx.beginPath();
      ctx.roundRect(x - barW / 2, baseY, barW, barH * 0.35, 2);
      ctx.fill();
    }

    // ── Thin horizon line ─────────────────────────────────
    const lineGrad = ctx.createLinearGradient(0, baseY, w, baseY);
    lineGrad.addColorStop(0, `hsla(${h1}, 60%, 55%, 0)`);
    lineGrad.addColorStop(0.5, `hsla(${h1}, 70%, 65%, 0.35)`);
    lineGrad.addColorStop(1, `hsla(${h1}, 60%, 55%, 0)`);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(w, baseY);
    ctx.stroke();

    // ── Chroma ring (12 pitch classes on the colour wheel) ──
    if (showChroma) {
      const rx = w - 34, ry = 34, rr = 20;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const v = hasAudio ? chroma[i] : 0.15;
        ctx.beginPath();
        ctx.arc(rx + Math.cos(a) * rr, ry + Math.sin(a) * rr, 1.5 + v * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${pitchClassHue(i)}, 90%, 60%, ${0.25 + v * 0.75})`;
        ctx.fill();
      }
    }
    if (!hasAudio && lastDomRef.current !== null) { lastDomRef.current = null; setDominant(null); }

    rafRef.current = requestAnimationFrame(draw);
  }, [idleIntensity, showChroma]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={className}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {showChroma && dominant !== null && (
        <span
          className="absolute top-[26px] right-[34px] translate-x-1/2 -translate-y-1/2 font-mono text-[10px] text-foreground pointer-events-none"
          aria-live="polite"
        >
          {PITCH_CLASSES[dominant]}
        </span>
      )}
    </div>
  );
};
