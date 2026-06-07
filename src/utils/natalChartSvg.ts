/**
 * Standalone natal-chart SVG generator.
 *
 * All colours are hardcoded (no CSS variables) so the exported file renders
 * correctly in every SVG viewer / image editor without the page stylesheet.
 */
import type { ChartData, BirthData } from '@/types/astrology';

// ─── Brand palette ────────────────────────────────────────────────────────────
const BG       = '#09090E';
const BG_INNER = '#0D0D17';
const BORDER   = '#1C1C2E';
const TEXT_HI  = '#F0EFE8';
const TEXT_MU  = '#6C6C84';
const TEXT_DI  = '#2E2E46';
const ACCENT   = 'hsl(168,95%,55%)';
const EMBER    = 'hsl(14,95%,58%)';

const ELEM_FILL: Record<string, string> = {
  fire:  'hsla(14,95%,58%,0.10)',
  earth: 'hsla(140,70%,55%,0.09)',
  air:   'hsla(168,95%,55%,0.10)',
  water: 'hsla(220,80%,62%,0.10)',
};
const ELEM_STROKE: Record<string, string> = {
  fire:  'hsla(14,95%,58%,0.55)',
  earth: 'hsla(140,70%,55%,0.55)',
  air:   'hsla(168,95%,55%,0.55)',
  water: 'hsla(220,80%,62%,0.55)',
};

// ─── Static data ──────────────────────────────────────────────────────────────
const ZODIAC_DATA = [
  { name: 'Aries',       abbr: 'ARI', element: 'fire'  },
  { name: 'Taurus',      abbr: 'TAU', element: 'earth' },
  { name: 'Gemini',      abbr: 'GEM', element: 'air'   },
  { name: 'Cancer',      abbr: 'CAN', element: 'water' },
  { name: 'Leo',         abbr: 'LEO', element: 'fire'  },
  { name: 'Virgo',       abbr: 'VIR', element: 'earth' },
  { name: 'Libra',       abbr: 'LIB', element: 'air'   },
  { name: 'Scorpio',     abbr: 'SCO', element: 'water' },
  { name: 'Sagittarius', abbr: 'SAG', element: 'fire'  },
  { name: 'Capricorn',   abbr: 'CAP', element: 'earth' },
  { name: 'Aquarius',    abbr: 'AQU', element: 'air'   },
  { name: 'Pisces',      abbr: 'PIS', element: 'water' },
];

const ASPECT_TYPES = [
  { name: 'Conjunction', angle: 0,   orb: 8, color: 'hsla(168,95%,55%,0.85)', dash: '',    width: 1.2 },
  { name: 'Sextile',     angle: 60,  orb: 6, color: 'hsla(168,95%,55%,0.50)', dash: '4,2', width: 0.8 },
  { name: 'Square',      angle: 90,  orb: 8, color: 'hsla(14,95%,58%,0.75)',  dash: '',    width: 1.2 },
  { name: 'Trine',       angle: 120, orb: 8, color: 'hsla(140,70%,55%,0.70)', dash: '',    width: 1.0 },
  { name: 'Opposition',  angle: 180, orb: 8, color: 'hsla(14,95%,58%,0.50)',  dash: '6,3', width: 0.8 },
  { name: 'Quincunx',    angle: 150, orb: 3, color: 'hsla(268,90%,62%,0.50)', dash: '2,4', width: 0.7 },
];

// ─── Sigil paths (24×24 view-box, same data as SigilFragments.tsx) ────────────
const ZODIAC_PATHS: Record<string, string> = {
  aries:       '<path d="M4 18C4 10 8 6 12 10C16 6 20 10 20 18"/>',
  taurus:      '<circle cx="12" cy="15" r="5"/><path d="M5 7C7 11 17 11 19 7"/>',
  gemini:      '<path d="M5 5H19M5 19H19M8 5V19M16 5V19"/>',
  cancer:      '<path d="M4 9A5 3 0 0 1 14 9"/><circle cx="6" cy="11" r="1.5"/><path d="M20 15A5 3 0 0 1 10 15"/><circle cx="18" cy="13" r="1.5"/>',
  leo:         '<circle cx="9" cy="11" r="4"/><path d="M13 11C16 11 18 13 18 16C18 19 16 21 14 19"/>',
  virgo:       '<path d="M4 6V18M4 6L8 14L12 6V18M12 6L16 14V18M16 18C19 18 19 14 16 14M14 16L19 21"/>',
  libra:       '<path d="M4 19H20M4 15H20M8 15C8 11 16 11 16 15"/>',
  scorpio:     '<path d="M4 6V18M4 6L8 14L12 6V18M12 6L16 14V20M16 20L21 15M21 15L18 15M21 15L21 18"/>',
  sagittarius: '<path d="M5 19L19 5M19 5L13 5M19 5L19 11M9 11L13 15"/>',
  capricorn:   '<path d="M4 6L9 16L14 6V14"/><path d="M14 14A3 3 0 1 1 18 16A2 2 0 1 0 14 16"/>',
  aquarius:    '<path d="M4 9L7 7L10 9L13 7L16 9L19 7M4 15L7 13L10 15L13 13L16 15L19 13"/>',
  pisces:      '<path d="M5 5C9 9 9 15 5 19M19 5C15 9 15 15 19 19M5 12H19"/>',
};

const PLANET_PATHS: Record<string, string> = {
  sun:       '<circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  moon:      '<path d="M16 4A8 8 0 1 0 16 20A6 6 0 1 1 16 4Z"/>',
  mercury:   '<path d="M7 4A5 5 0 0 0 17 4"/><circle cx="12" cy="10" r="3.5"/><path d="M12 13.5V19M9 17H15"/>',
  venus:     '<circle cx="12" cy="9" r="4.5"/><path d="M12 13.5V21M9 18H15"/>',
  mars:      '<circle cx="10" cy="14" r="4.5"/><path d="M13.2 10.8L20 4M14 4H20V10"/>',
  jupiter:   '<path d="M4 8H14M9 4V16C9 19 13 19 13 16M14 4V20"/>',
  saturn:    '<path d="M6 4H13M9 4V16C9 18 11 18 12 16M14 12A3 3 0 1 0 18 16"/>',
  uranus:    '<path d="M6 4V12M18 4V12M6 8H18M12 8V16"/><circle cx="12" cy="19" r="2"/>',
  neptune:   '<path d="M6 6C6 12 10 14 12 14C14 14 18 12 18 6M12 6V20M8 18H16"/>',
  pluto:     '<path d="M7 14V20M4 17H10"/><circle cx="13" cy="10" r="3"/><path d="M13 4C17 4 19 7 19 10C19 13 17 16 13 16"/>',
  chiron:    '<circle cx="12" cy="16" r="4"/><path d="M12 12V4M12 4C16 4 17 8 14 9"/>',
  northnode: '<path d="M6 18C6 8 12 4 14 11C16 18 22 14 22 6"/>',
  southnode: '<path d="M6 6C6 16 12 20 14 13C16 6 22 10 22 18"/>',
  ascendant: '<path d="M4 20L12 4L20 20M7 14H17"/>',
  midheaven: '<path d="M4 20V4L12 14L20 4V20"/>',
};

const PLANET_KEY_MAP: Record<string, string> = {
  'Sun':        'sun',
  'Moon':       'moon',
  'Mercury':    'mercury',
  'Venus':      'venus',
  'Mars':       'mars',
  'Jupiter':    'jupiter',
  'Saturn':     'saturn',
  'Uranus':     'uranus',
  'Neptune':    'neptune',
  'Pluto':      'pluto',
  'Chiron':     'chiron',
  'North Node': 'northnode',
  'South Node': 'southnode',
  'Ascendant':  'ascendant',
  'Midheaven':  'midheaven',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round to 1 decimal place and stringify. */
function f(x: number): string {
  return (Math.round(x * 10) / 10).toString();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a sigil at (cx, cy) sized to `sz` px.
 * The path data is in a 24×24 view-box.
 */
function sigil(
  paths: Record<string, string>,
  key: string,
  cx: number, cy: number,
  sz: number,
  stroke: string,
  sw = 1.5,
): string {
  const d = paths[key];
  if (!d) return '';
  const scale = sz / 24;
  const tx = f(cx - sz / 2);
  const ty = f(cy - sz / 2);
  const scaledSw = f(sw / scale);
  return `<g transform="translate(${tx},${ty}) scale(${f(scale)})" stroke="${stroke}" fill="none" stroke-width="${scaledSw}" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
}

/**
 * Build an SVG arc-band path for a zodiac sign sector.
 *
 * The coordinate frame has:
 *   • Ascendant → screen angle 180° (left / West)
 *   • MC        → screen angle 270° (top  / North)
 *   • DSC       → screen angle   0° (right / East)
 *   • IC        → screen angle  90° (bottom / South)
 *
 * As the ecliptic longitude increases (Aries → … → Pisces), the screen
 * angle _decreases_ (counter-clockwise), so:
 *   outer arc: sweep-flag 0 (CCW)
 *   inner arc: sweep-flag 1 (CW, returning)
 */
function bandPath(
  cx: number, cy: number,
  ascDeg: number,
  startZod: number, endZod: number,
  innerR: number, outerR: number,
): string {
  const a1 = (180 - (startZod - ascDeg)) * (Math.PI / 180);
  const a2 = (180 - (endZod   - ascDeg)) * (Math.PI / 180);
  const cos1 = Math.cos(a1), sin1 = Math.sin(a1);
  const cos2 = Math.cos(a2), sin2 = Math.sin(a2);
  const ox1 = f(cx + cos1 * outerR), oy1 = f(cy + sin1 * outerR);
  const ox2 = f(cx + cos2 * outerR), oy2 = f(cy + sin2 * outerR);
  const ix1 = f(cx + cos1 * innerR), iy1 = f(cy + sin1 * innerR);
  const ix2 = f(cx + cos2 * innerR), iy2 = f(cy + sin2 * innerR);
  return (
    `M${ox1},${oy1}` +
    ` A${outerR},${outerR} 0 0,0 ${ox2},${oy2}` +
    ` L${ix2},${iy2}` +
    ` A${innerR},${innerR} 0 0,1 ${ix1},${iy1}Z`
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateNatalChartSVG(
  chartData: ChartData,
  birthData: BirthData,
): string {
  // Canvas
  const W = 800, H = 960;
  const cx = 400, cy = 462;

  // Radii (outer → inner)
  const rOuter  = 332; // hard border ring
  const rSignO  = 328; // outer edge of zodiac band
  const rSignI  = 284; // inner edge of zodiac band / outer edge of house zone
  const rHouseI = 248; // inner edge of house zone
  const rPlanet = 214; // primary planet orbit
  const rAlt    = 184; // alternate planet orbit (for crowded neighbours)
  const rInner  = 164; // inner aspect-zone clip radius
  const rCore   = 28;  // central disc

  // Derived helpers
  const planets = chartData.planets;
  const ascPlanet = planets.find(p => p.name === 'Ascendant');
  const ascDeg = ascPlanet?.degree ?? 0;

  /** Convert ecliptic longitude → SVG screen angle (radians). */
  const toAngle = (deg: number): number =>
    (180 - (deg - ascDeg)) * (Math.PI / 180);

  const px = (a: number, r: number) => cx + Math.cos(a) * r;
  const py = (a: number, r: number) => cy + Math.sin(a) * r;

  // ── Compute aspects ───────────────────────────────────────────────
  const aspectPlanets = planets.filter(
    p => p.name !== 'Ascendant' && p.name !== 'Midheaven' &&
         p.name !== 'North Node' && p.name !== 'South Node',
  );
  const computedAspects: {
    p1: typeof planets[0];
    p2: typeof planets[0];
    type: typeof ASPECT_TYPES[0];
  }[] = [];
  for (let i = 0; i < aspectPlanets.length; i++) {
    for (let j = i + 1; j < aspectPlanets.length; j++) {
      let diff = Math.abs(aspectPlanets[i].degree - aspectPlanets[j].degree);
      if (diff > 180) diff = 360 - diff;
      for (const at of ASPECT_TYPES) {
        if (Math.abs(diff - at.angle) <= at.orb) {
          computedAspects.push({ p1: aspectPlanets[i], p2: aspectPlanets[j], type: at });
          break;
        }
      }
    }
  }

  // ── Collision-aware planet positions ─────────────────────────────
  // Sort by ecliptic degree, then alternate inner/outer orbit when two
  // planets would land within 14° of each other.
  const sortedPlanets = [...planets].sort((a, b) => a.degree - b.degree);

  interface PlacedPlanet {
    planet: typeof planets[0];
    r: number;
    angle: number;
  }
  const placed: PlacedPlanet[] = [];

  for (const p of sortedPlanets) {
    const angle = toAngle(p.degree);
    const tooClose = placed
      .filter(pp => pp.r === rPlanet)
      .some(pp => {
        let diff = Math.abs(p.degree - pp.planet.degree);
        if (diff > 180) diff = 360 - diff;
        return diff < 14;
      });
    placed.push({ planet: p, r: tooClose ? rAlt : rPlanet, angle });
  }

  // ── Format birth date ─────────────────────────────────────────────
  // We append T12:00:00Z only to parse the calendar date (YYYY-MM-DD) in UTC
  // so the displayed date is never shifted by timezone offset. The actual
  // birth time is shown separately from birthData.time below.
  const dateStr = (() => {
    try {
      const d = new Date(birthData.date + 'T12:00:00Z');
      return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
      });
    } catch {
      return birthData.date;
    }
  })();

  // ── Build SVG ─────────────────────────────────────────────────────
  const out: string[] = [];

  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
  );

  // ── Defs ──────────────────────────────────────────────────────────
  out.push(`<defs>
  <radialGradient id="qm-bg" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#111122"/>
    <stop offset="100%" stop-color="${BG}"/>
  </radialGradient>
  <radialGradient id="qm-glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="hsl(168,95%,55%)" stop-opacity="0.14"/>
    <stop offset="100%" stop-color="hsl(168,95%,55%)" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="qm-inner">
    <circle cx="${cx}" cy="${cy}" r="${rInner}"/>
  </clipPath>
  <filter id="qm-glow-sm" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="2.4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`);

  // ── Background ────────────────────────────────────────────────────
  out.push(`<rect width="${W}" height="${H}" fill="url(#qm-bg)"/>`);

  // Ambient glow behind the wheel
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rOuter + 80}" fill="url(#qm-glow)"/>`);

  // ── Header ────────────────────────────────────────────────────────
  const personName = escapeXml((birthData.name || 'Unknown').toUpperCase());
  out.push(`<text x="${cx}" y="46" text-anchor="middle"
    font-family="Georgia,'Times New Roman',serif"
    font-size="25" font-weight="400" fill="${TEXT_HI}" letter-spacing="3"
  >${personName}&apos;S NATAL CHART</text>`);

  out.push(`<text x="${cx}" y="72" text-anchor="middle"
    font-family="Arial,Helvetica,sans-serif"
    font-size="11" fill="${TEXT_MU}" letter-spacing="2"
  >&#9737; ${escapeXml(chartData.sunSign)} &#160;&#183;&#160; &#9789; ${escapeXml(chartData.moonSign)} &#160;&#183;&#160; &#8593; ${escapeXml(chartData.ascendant)}</text>`);

  // Thin divider line under header
  out.push(`<line x1="${cx - 180}" y1="84" x2="${cx + 180}" y2="84"
    stroke="${BORDER}" stroke-width="0.75"/>`);

  // ── Outer plate ───────────────────────────────────────────────────
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rOuter}"
    fill="${BG}" stroke="${BORDER}" stroke-width="1.5"/>`);

  // ── Zodiac band ───────────────────────────────────────────────────
  for (let i = 0; i < 12; i++) {
    const zd = ZODIAC_DATA[i];
    const startDeg = i * 30;
    const endDeg   = startDeg + 30;

    // Segment fill
    out.push(`<path d="${bandPath(cx, cy, ascDeg, startDeg, endDeg, rSignI, rSignO)}"
      fill="${ELEM_FILL[zd.element]}"
      stroke="${ELEM_STROKE[zd.element]}" stroke-width="0.5"/>`);

    // Divider line at start of segment
    const divA = toAngle(startDeg);
    out.push(`<line
      x1="${f(px(divA, rSignI))}" y1="${f(py(divA, rSignI))}"
      x2="${f(px(divA, rSignO))}" y2="${f(py(divA, rSignO))}"
      stroke="${BORDER}" stroke-width="0.75"/>`);

    // Zodiac sigil + abbreviation at segment midpoint
    const midA   = toAngle(startDeg + 15);
    const sigilR = (rSignI + rSignO) / 2 + 4;
    const abbrR  = (rSignI + rSignO) / 2 - 14;
    const sx = px(midA, sigilR), sy = py(midA, sigilR);
    const ax = f(px(midA, abbrR)), ay = f(py(midA, abbrR));

    out.push(sigil(ZODIAC_PATHS, zd.name.toLowerCase(), sx, sy, 18, ELEM_STROKE[zd.element], 1.5));

    out.push(`<text x="${ax}" y="${ay}" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial,Helvetica,sans-serif"
      font-size="7" fill="${ELEM_STROKE[zd.element]}" letter-spacing="0.5"
    >${zd.abbr}</text>`);
  }

  // Inner border of zodiac band
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rSignI}"
    fill="none" stroke="${BORDER}" stroke-width="0.75"/>`);

  // ── House zone ────────────────────────────────────────────────────
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rHouseI}"
    fill="${BG_INNER}" stroke="${BORDER}" stroke-width="0.75"/>`);

  for (let i = 0; i < 12; i++) {
    const houseStartDeg = ascDeg + i * 30;
    const cuspA = toAngle(houseStartDeg);
    const isAngular = i === 0 || i === 3 || i === 6 || i === 9;

    // Cusp line (from inner house boundary to inner zodiac band)
    out.push(`<line
      x1="${f(px(cuspA, rHouseI))}" y1="${f(py(cuspA, rHouseI))}"
      x2="${f(px(cuspA, rSignI))}"  y2="${f(py(cuspA, rSignI))}"
      stroke="${isAngular ? ACCENT : BORDER}"
      stroke-width="${isAngular ? 1 : 0.5}"
      stroke-dasharray="${isAngular ? '' : '2,4'}"
      stroke-opacity="${isAngular ? 0.6 : 1}"/>`);

    // House number at midpoint of sector
    const numA = toAngle(houseStartDeg + 15);
    const numR = (rHouseI + rSignI) / 2;
    out.push(`<text
      x="${f(px(numA, numR))}" y="${f(py(numA, numR))}"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Arial,Helvetica,sans-serif"
      font-size="9" fill="${TEXT_MU}" letter-spacing="0.1em"
    >${i + 1}</text>`);
  }

  // ── Inner disc (aspect background) ───────────────────────────────
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rHouseI - 1}"
    fill="${BG}" stroke="${BORDER}" stroke-width="0.5"/>`);

  // ── Aspect lines ─────────────────────────────────────────────────
  // Draw lines between the two planet positions, clipped to the inner disc.
  out.push('<g clip-path="url(#qm-inner)">');
  for (const asp of computedAspects) {
    const pp1 = placed.find(p => p.planet.name === asp.p1.name);
    const pp2 = placed.find(p => p.planet.name === asp.p2.name);
    if (!pp1 || !pp2) continue;
    // Project to the clip radius along the planet angle so the lines
    // extend all the way through the inner disc without stopping at
    // the (possibly shallower) actual planet orbit.
    const x1 = f(px(pp1.angle, rInner));
    const y1 = f(py(pp1.angle, rInner));
    const x2 = f(px(pp2.angle, rInner));
    const y2 = f(py(pp2.angle, rInner));
    out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      stroke="${asp.type.color}"
      stroke-width="${asp.type.width}"
      stroke-dasharray="${asp.type.dash}"/>`);
  }
  out.push('</g>');

  // ── Planet sigils ─────────────────────────────────────────────────
  for (const { planet, r, angle } of placed) {
    if (planet.name === 'Ascendant') continue; // shown via cardinal label

    const x  = px(angle, r);
    const y  = py(angle, r);
    const key = PLANET_KEY_MAP[planet.name] ?? planet.name.toLowerCase().replace(/\s+/g, '');
    const color = planet.isRetrograde ? EMBER : ACCENT;

    // Backdrop circle
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="13"
      fill="${BG}" stroke="${color}" stroke-width="0.75" stroke-opacity="0.65"/>`);

    // Sigil
    out.push(sigil(PLANET_PATHS, key, x, y, 18, color, 1.5));

    // Retrograde marker
    if (planet.isRetrograde) {
      out.push(`<text x="${f(x + 11)}" y="${f(y - 9)}"
        font-family="Arial,Helvetica,sans-serif" font-size="8" fill="${EMBER}"
      >&#8477;</text>`);
    }

    // Degree within sign label (positioned outward from the planet)
    const degInSign = Math.floor(planet.degree % 30);
    const labelA = angle;
    const labelR = r + 26;
    out.push(`<text
      x="${f(px(labelA, labelR))}" y="${f(py(labelA, labelR))}"
      text-anchor="middle" dominant-baseline="middle"
      font-family="Arial,Helvetica,sans-serif"
      font-size="7" fill="${TEXT_MU}"
    >${degInSign}°</text>`);
  }

  // ── Cardinal axis lines ───────────────────────────────────────────
  const ascA = toAngle(ascDeg);
  const dscA = toAngle(ascDeg + 180);
  const mcA  = toAngle(ascDeg + 270);
  const icA  = toAngle(ascDeg + 90);

  // ASC–DSC axis
  out.push(`<line
    x1="${f(px(ascA, rSignI))}" y1="${f(py(ascA, rSignI))}"
    x2="${f(px(dscA, rSignI))}" y2="${f(py(dscA, rSignI))}"
    stroke="${ACCENT}" stroke-width="0.75" stroke-opacity="0.35"/>`);

  // MC–IC axis
  out.push(`<line
    x1="${f(px(mcA, rSignI))}" y1="${f(py(mcA, rSignI))}"
    x2="${f(px(icA, rSignI))}" y2="${f(py(icA, rSignI))}"
    stroke="${BORDER}" stroke-width="0.75" stroke-opacity="0.7"/>`);

  // Cardinal labels (just outside the zodiac band)
  const lblR = rSignO + 18;
  out.push(`<text x="${f(px(ascA, lblR))}" y="${f(py(ascA, lblR))}"
    text-anchor="end" dominant-baseline="middle"
    font-family="Arial,Helvetica,sans-serif" font-size="9"
    fill="${ACCENT}" letter-spacing="0.12em" filter="url(#qm-glow-sm)"
  >ASC</text>`);
  out.push(`<text x="${f(px(dscA, lblR))}" y="${f(py(dscA, lblR))}"
    text-anchor="start" dominant-baseline="middle"
    font-family="Arial,Helvetica,sans-serif" font-size="9"
    fill="${TEXT_MU}" letter-spacing="0.12em"
  >DSC</text>`);
  out.push(`<text x="${f(px(mcA, lblR))}" y="${f(py(mcA, lblR))}"
    text-anchor="middle" dominant-baseline="auto"
    font-family="Arial,Helvetica,sans-serif" font-size="9"
    fill="${TEXT_MU}" letter-spacing="0.12em"
  >MC</text>`);
  out.push(`<text x="${f(px(icA, lblR))}" y="${f(py(icA, lblR))}"
    text-anchor="middle" dominant-baseline="hanging"
    font-family="Arial,Helvetica,sans-serif" font-size="9"
    fill="${TEXT_MU}" letter-spacing="0.12em"
  >IC</text>`);

  // ── Centre core ───────────────────────────────────────────────────
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rCore + 4}"
    fill="${BG}" stroke="${ACCENT}" stroke-width="0.75" stroke-opacity="0.4"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="3.5"
    fill="${ACCENT}" opacity="0.85" filter="url(#qm-glow-sm)"/>`);

  // ── Footer ────────────────────────────────────────────────────────
  const footerY = cy + rOuter + 38;

  // Thin divider line above footer
  out.push(`<line x1="${cx - 180}" y1="${footerY - 12}" x2="${cx + 180}" y2="${footerY - 12}"
    stroke="${BORDER}" stroke-width="0.75"/>`);

  out.push(`<text x="${cx}" y="${footerY}"
    text-anchor="middle"
    font-family="Arial,Helvetica,sans-serif"
    font-size="11" fill="${TEXT_MU}" letter-spacing="1.5"
  >Born ${escapeXml(dateStr)} &#160;&#183;&#160; ${escapeXml(birthData.time)} &#160;&#183;&#160; ${escapeXml(birthData.location)}</text>`);

  out.push(`<text x="${cx}" y="${footerY + 22}"
    text-anchor="middle"
    font-family="Georgia,'Times New Roman',serif"
    font-size="13" fill="${TEXT_DI}" letter-spacing="3"
  >QUANTUMMELODIC</text>`);

  // ── Aspect legend ─────────────────────────────────────────────────
  const legY   = footerY + 54;
  const legLabelY = legY - 14;
  const legStartX = cx - 228;
  const legStep   = 96;

  out.push(`<text x="${legStartX}" y="${legLabelY}"
    font-family="Arial,Helvetica,sans-serif"
    font-size="8" fill="${TEXT_MU}" letter-spacing="1"
  >ASPECTS</text>`);

  const majorAspects = ASPECT_TYPES.slice(0, 5);
  majorAspects.forEach((at, i) => {
    const lx = legStartX + i * legStep;
    out.push(`<line x1="${lx}" y1="${legY}" x2="${lx + 20}" y2="${legY}"
      stroke="${at.color}" stroke-width="${at.width}" stroke-dasharray="${at.dash}"/>`);
    out.push(`<text x="${lx + 24}" y="${legY}"
      dominant-baseline="middle"
      font-family="Arial,Helvetica,sans-serif"
      font-size="8" fill="${TEXT_MU}"
    >${at.name}</text>`);
  });

  out.push('</svg>');

  return out.join('\n');
}
