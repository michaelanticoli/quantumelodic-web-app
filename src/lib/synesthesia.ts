/**
 * Synesthesia mappings — Chromatone-style 12-fold pitch/colour wheel
 * aligned with the 12 zodiac signs, plus Hans Cousto's "Cosmic Octave"
 * (planetary orbital frequencies transposed into sound and light).
 */
export const PITCH_CLASSES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

export const SIGN_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

/** Chromatone wheel: 30° of hue per semitone, C = red (0°). */
export const pitchClassHue = (pc: number) => (((pc % 12) + 12) % 12) * 30;

/** Each sign occupies 30° of the ecliptic — same as one semitone on the colour wheel. */
export const signPitchClass = (sign?: string) => {
  const i = SIGN_ORDER.indexOf(sign as typeof SIGN_ORDER[number]);
  return i < 0 ? 0 : i;
};

/** Hue for an absolute ecliptic longitude (continuous). */
export const longitudeHue = (deg: number) => ((deg % 360) + 360) % 360;

/** Cousto orbital base frequencies in Hz (already octave-transposed into hearing range). */
export const COUSTO_HZ: Record<string, number> = {
  Sun: 126.22, Moon: 210.42, Mercury: 141.27, Venus: 221.23, Mars: 144.72,
  Jupiter: 183.58, Saturn: 147.85, Uranus: 207.36, Neptune: 211.44, Pluto: 140.25,
  Earth: 136.1,
};

export const hzToPitchClass = (hz: number) => {
  const midi = 69 + 12 * Math.log2(hz / 440);
  return ((Math.round(midi) % 12) + 12) % 12;
};

/** Transpose a frequency up by octaves into visible light (≈400–790 THz); returns nm. */
export const hzToWavelengthNm = (hz: number) => {
  let f = hz;
  while (f < 400e12) f *= 2;
  return Math.round(299792458 / f * 1e9);
};

/** Visible wavelength (380–780nm) → CSS rgb string. */
export const wavelengthToRgb = (nm: number) => {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 780) { r = 1; }
  const to = (c: number) => Math.round(255 * Math.pow(c, 0.8));
  return `rgb(${to(r)}, ${to(g)}, ${to(b)})`;
};

export interface SynestheticSignature {
  hz: number;
  note: string;
  pitchClass: number;
  wavelengthNm: number;
  lightColor: string;
  signHue: number;
  signNote: string;
}

export const planetSynesthesia = (planet: string, sign?: string): SynestheticSignature | null => {
  const hz = COUSTO_HZ[planet];
  if (!hz) return null;
  const pc = hzToPitchClass(hz);
  const nm = hzToWavelengthNm(hz);
  const spc = signPitchClass(sign);
  return {
    hz, note: PITCH_CLASSES[pc], pitchClass: pc,
    wavelengthNm: nm, lightColor: wavelengthToRgb(nm),
    signHue: pitchClassHue(spc), signNote: PITCH_CLASSES[spc],
  };
};

/** Fold an FFT magnitude array into a 12-bin chroma vector (normalised 0–1). */
export const fftToChroma = (data: Uint8Array, sampleRate: number, fftSize: number) => {
  const chroma = new Array(12).fill(0);
  const binHz = sampleRate / fftSize;
  for (let i = 1; i < data.length; i++) {
    const hz = i * binHz;
    if (hz < 55 || hz > 2000) continue;
    const v = data[i] / 255;
    chroma[hzToPitchClass(hz)] += v * v;
  }
  const max = Math.max(...chroma, 1e-6);
  return chroma.map(c => c / max);
};
