import { useRef, useEffect, useCallback } from 'react';

type RGB = { r: number; g: number; b: number };

export type GradientPalette = 'cosmic' | 'fire' | 'earth' | 'air' | 'water';

interface AudioReactiveGradientProps {
  /** Pass an HTMLAudioElement to react to its frequencies */
  audioElement?: HTMLAudioElement | null;
  /** 0-1 intensity override when no audio is connected (e.g. during loading) */
  idleIntensity?: number;
  /** CSS class for the canvas wrapper */
  className?: string;
  /** Border radius in px */
  borderRadius?: number;
  /** Color palette — auto-select from chart element or pass directly */
  palette?: GradientPalette;
}

// Element-mapped palettes inspired by Shader Dash spectral presets
const PALETTES: Record<GradientPalette, RGB[]> = {
  cosmic: [
    { r: 255, g: 182, b: 255 }, // soft pink
    { r: 255, g: 140, b: 50 },  // warm orange
    { r: 255, g: 200, b: 80 },  // golden yellow
    { r: 20, g: 80, b: 255 },   // vivid blue
    { r: 10, g: 10, b: 30 },    // deep black-blue
  ],
  fire: [
    { r: 255, g: 240, b: 180 }, // bright gold
    { r: 255, g: 120, b: 20 },  // vivid orange
    { r: 220, g: 40, b: 20 },   // hot red
    { r: 160, g: 20, b: 60 },   // crimson
    { r: 30, g: 5, b: 10 },     // ember dark
  ],
  earth: [
    { r: 200, g: 220, b: 160 }, // sage
    { r: 160, g: 140, b: 80 },  // ochre
    { r: 120, g: 90, b: 50 },   // umber
    { r: 60, g: 80, b: 40 },    // forest
    { r: 15, g: 20, b: 10 },    // deep earth
  ],
  air: [
    { r: 220, g: 240, b: 255 }, // ice white
    { r: 160, g: 210, b: 255 }, // sky blue
    { r: 200, g: 180, b: 255 }, // lavender
    { r: 100, g: 140, b: 220 }, // periwinkle
    { r: 20, g: 20, b: 50 },    // night sky
  ],
  water: [
    { r: 180, g: 255, b: 240 }, // seafoam
    { r: 40, g: 200, b: 200 },  // teal
    { r: 20, g: 100, b: 200 },  // deep ocean
    { r: 60, g: 40, b: 160 },   // indigo
    { r: 5, g: 10, b: 40 },     // abyss
  ],
};

// Map sun sign to dominant element
const SIGN_ELEMENTS: Record<string, GradientPalette> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
};

/** Derive the best palette from a sun sign string */
export function paletteFromSign(sunSign?: string): GradientPalette {
  if (!sunSign) return 'cosmic';
  return SIGN_ELEMENTS[sunSign] || 'cosmic';
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function samplePalette(colors: RGB[], t: number) {
  const ct = Math.max(0, Math.min(1, t));
  const idx = ct * (colors.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, colors.length - 1);
  const frac = idx - lo;
  return {
    r: lerp(colors[lo].r, colors[hi].r, frac),
    g: lerp(colors[lo].g, colors[hi].g, frac),
    b: lerp(colors[lo].b, colors[hi].b, frac),
  };
}

export const AudioReactiveGradient = ({
  audioElement,
  idleIntensity = 0.3,
  className = '',
  borderRadius = 16,
  palette = 'cosmic',
}: AudioReactiveGradientProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const freqDataRef = useRef(new Uint8Array(64));
  const timeRef = useRef(0);
  const paletteRef = useRef(palette);

  // Keep palette ref in sync without restarting animation loop
  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

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

      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
      }

      freqDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    } catch (e) {
      console.warn('AudioReactiveGradient: could not connect analyser', e);
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
    }

    const colors = PALETTES[paletteRef.current] || PALETTES.cosmic;

    // Get frequency data
    let bands: number[] = [];
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(freqDataRef.current);
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

      const paletteT = layer / (layers - 1);
      const color = samplePalette(colors, paletteT);
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
