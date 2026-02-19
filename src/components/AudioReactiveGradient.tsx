import { useRef, useEffect, useCallback } from 'react';

interface AudioReactiveGradientProps {
  /** Pass an HTMLAudioElement to react to its frequencies */
  audioElement?: HTMLAudioElement | null;
  /** 0-1 intensity override when no audio is connected (e.g. during loading) */
  idleIntensity?: number;
  /** CSS class for the canvas wrapper */
  className?: string;
  /** Border radius in px */
  borderRadius?: number;
}

// Color palette inspired by the Figma gradient shader card
const PALETTE = [
  { r: 255, g: 182, b: 255 }, // soft pink
  { r: 255, g: 140, b: 50 },  // warm orange
  { r: 255, g: 200, b: 80 },  // golden yellow
  { r: 20, g: 80, b: 255 },   // vivid blue
  { r: 10, g: 10, b: 30 },    // deep black-blue
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function samplePalette(t: number) {
  const ct = Math.max(0, Math.min(1, t));
  const idx = ct * (PALETTE.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, PALETTE.length - 1);
  const frac = idx - lo;
  return {
    r: lerp(PALETTE[lo].r, PALETTE[hi].r, frac),
    g: lerp(PALETTE[lo].g, PALETTE[hi].g, frac),
    b: lerp(PALETTE[lo].b, PALETTE[hi].b, frac),
  };
}

export const AudioReactiveGradient = ({
  audioElement,
  idleIntensity = 0.3,
  className = '',
  borderRadius = 16,
}: AudioReactiveGradientProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const freqDataRef = useRef(new Uint8Array(64));
  const timeRef = useRef(0);

  // Connect audio element to analyser
  useEffect(() => {
    if (!audioElement) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 128;
        analyserRef.current.smoothingTimeConstant = 0.8;
        analyserRef.current.connect(ctx.destination);
      }

      // Only create source once per audio element
      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
      }

      freqDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    } catch (e) {
      console.warn('AudioReactiveGradient: could not connect analyser', e);
    }

    return () => {
      // Don't disconnect — let it persist for the audio element's lifetime
    };
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
    }

    // Get frequency data
    let bands: number[] = [];
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(freqDataRef.current);
      // Group into 5 bands
      const binCount = freqDataRef.current.length;
      const bandSize = Math.floor(binCount / 5);
      for (let b = 0; b < 5; b++) {
        let sum = 0;
        for (let i = b * bandSize; i < (b + 1) * bandSize; i++) {
          sum += freqDataRef.current[i];
        }
        bands.push(sum / bandSize / 255);
      }
    }

    // Fallback idle animation
    if (bands.length === 0 || bands.every(v => v < 0.01)) {
      const t = timeRef.current;
      bands = [
        0.3 + 0.2 * Math.sin(t * 0.7) * idleIntensity,
        0.4 + 0.25 * Math.sin(t * 0.9 + 1) * idleIntensity,
        0.35 + 0.2 * Math.sin(t * 1.1 + 2) * idleIntensity,
        0.5 + 0.3 * Math.sin(t * 0.6 + 3) * idleIntensity,
        0.25 + 0.15 * Math.sin(t * 0.8 + 4) * idleIntensity,
      ];
    }

    timeRef.current += 0.016;
    const t = timeRef.current;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw layered undulating gradient waves
    const layers = 5;
    for (let layer = 0; layer < layers; layer++) {
      const bandVal = bands[layer] || 0.3;
      const baseY = h * (0.15 + layer * 0.18);
      const amplitude = 20 + bandVal * 60;
      const freq = 0.008 + layer * 0.003;
      const speed = 0.4 + layer * 0.15;
      const phase = t * speed + layer * 1.2;

      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let x = 0; x <= w; x += 2) {
        const wave1 = Math.sin(x * freq + phase) * amplitude;
        const wave2 = Math.sin(x * freq * 1.5 + phase * 0.7) * amplitude * 0.4;
        const wave3 = Math.sin(x * freq * 0.5 + phase * 1.3) * amplitude * 0.2;
        const y = baseY + wave1 + wave2 + wave3;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, h);
      ctx.closePath();

      // Gradient fill for this layer
      const paletteT = layer / (layers - 1);
      const color = samplePalette(paletteT);
      const alpha = 0.6 + bandVal * 0.4;
      
      const grad = ctx.createLinearGradient(0, baseY - amplitude, 0, h);
      grad.addColorStop(0, `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`);
      grad.addColorStop(1, `rgba(${Math.round(color.r * 0.3)}, ${Math.round(color.g * 0.3)}, ${Math.round(color.b * 0.3)}, ${alpha * 0.8})`);

      ctx.fillStyle = grad;
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [idleIntensity]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        borderRadius,
        display: 'block',
      }}
    />
  );
};
