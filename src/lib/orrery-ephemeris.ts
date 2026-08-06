/**
 * Lightweight ephemeris — JPL approximate planetary elements (1800–2050)
 * + Schlyter lunar theory. Accurate to well under a degree for sign placement.
 *
 * Adapted from the Astralecture Resonant module so we can compute natal
 * positions in-browser without external services.
 */

const DEG = Math.PI / 180;
export const norm360 = (x: number) => ((x % 360) + 360) % 360;

export const toJD = (date: Date) =>
  date.getTime() / 86400000 + 2440587.5;

type KeplerEntry = number[][];
const KEPLER: Record<string, KeplerEntry> = {
  Mercury: [
    [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593],
    [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  ],
  Venus: [
    [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255],
    [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418],
  ],
  Earth: [
    [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
    [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
  ],
  Mars: [
    [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
    [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
  ],
  Jupiter: [
    [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
    [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
  ],
  Saturn: [
    [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
    [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
  ],
  Uranus: [
    [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503],
    [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
  ],
  Neptune: [
    [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
    [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664],
  ],
  Pluto: [
    [39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684],
    [-0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482],
  ],
};

function solveKepler(M: number, e: number) {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 8; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

interface Vec3 { x: number; y: number; z: number }

function helioEcliptic(name: string, jd: number): Vec3 {
  const [el, rate] = KEPLER[name];
  const T = (jd - 2451545.0) / 36525;
  const a = el[0] + rate[0] * T;
  const e = el[1] + rate[1] * T;
  const I = (el[2] + rate[2] * T) * DEG;
  const L = el[3] + rate[3] * T;
  const lp = el[4] + rate[4] * T;
  const O = el[5] + rate[5] * T;
  const w = (lp - O) * DEG;
  const M = norm360(L - lp) * DEG;
  const E = solveKepler(M, e);
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w),
    sw = Math.sin(w),
    cO = Math.cos(O * DEG),
    sO = Math.sin(O * DEG),
    ci = Math.cos(I),
    si = Math.sin(I);
  return {
    x: (cw * cO - sw * sO * ci) * xp + (-sw * cO - cw * sO * ci) * yp,
    y: (cw * sO + sw * cO * ci) * xp + (-sw * sO + cw * cO * ci) * yp,
    z: sw * si * xp + cw * si * yp,
  };
}

function moonGeoLongitude(jd: number) {
  const d = jd - 2451543.5;
  const N = norm360(125.1228 - 0.0529538083 * d);
  const i = 5.1454 * DEG;
  const w = norm360(318.0634 + 0.1643573223 * d);
  const e = 0.0549;
  const M = norm360(115.3654 + 13.0649929509 * d);
  const E = solveKepler(M * DEG, e);
  const xv = 60.2666 * (Math.cos(E) - e);
  const yv = 60.2666 * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const vw = v + w * DEG;
  const Nr = N * DEG;
  const xe = r * (Math.cos(Nr) * Math.cos(vw) - Math.sin(Nr) * Math.sin(vw) * Math.cos(i));
  const ye = r * (Math.sin(Nr) * Math.cos(vw) + Math.cos(Nr) * Math.sin(vw) * Math.cos(i));
  let lon = norm360(Math.atan2(ye, xe) / DEG);
  const ws = norm360(282.9404 + 4.70935e-5 * d);
  const Ms = norm360(356.047 + 0.9856002585 * d);
  const Ls = norm360(ws + Ms);
  const Lm = norm360(N + w + M);
  const D = norm360(Lm - Ls);
  const F = norm360(Lm - N);
  const s = (x: number) => Math.sin(x * DEG);
  lon +=
    -1.274 * s(M - 2 * D) +
    0.658 * s(2 * D) -
    0.186 * s(Ms) -
    0.059 * s(2 * M - 2 * D) -
    0.057 * s(M - 2 * D + Ms) +
    0.053 * s(M + 2 * D) +
    0.046 * s(2 * D - Ms) +
    0.041 * s(M - Ms) -
    0.035 * s(D) -
    0.031 * s(M + Ms) -
    0.015 * s(2 * F - 2 * D) +
    0.011 * s(M - 4 * D);
  return norm360(lon);
}

export interface SkyPositions {
  jd: number;
  geo: Record<string, number>;
}

export function computeSky(date: Date): SkyPositions {
  const jd = toJD(date);
  const earth = helioEcliptic('Earth', jd);
  const sky: SkyPositions = { jd, geo: {} };
  sky.geo.Sun = norm360(Math.atan2(-earth.y, -earth.x) / DEG);
  for (const name of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']) {
    const p = helioEcliptic(name, jd);
    sky.geo[name] = norm360(Math.atan2(p.y - earth.y, p.x - earth.x) / DEG);
  }
  sky.geo.Moon = moonGeoLongitude(jd);
  return sky;
}

export const signOf = (lon: number) => Math.floor(norm360(lon) / 30);

export const sep360 = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

export interface AspectHit {
  a: string;
  b: string;
  asp: { name: string; deg: number; orb: number; color: string; sigil: string };
  orb: number;
}

export function detectAspects(sky: SkyPositions, defs: Array<{ name: string; deg: number; orb: number; color: string; sigil: string }>): AspectHit[] {
  const names = Object.keys(sky.geo);
  const out: AspectHit[] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i],
        b = names[j];
      const s = sep360(sky.geo[a], sky.geo[b]);
      let best: { asp: typeof defs[number]; off: number } | null = null;
      for (const asp of defs) {
        const off = Math.abs(s - asp.deg);
        if (off <= asp.orb && (!best || off < best.off)) best = { asp, off };
      }
      if (best) out.push({ a, b, asp: best.asp, orb: best.off });
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}
