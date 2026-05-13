import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { PlanetPosition } from '@/types/astrology';
import type { ComputedAspect } from '@/types/quantumMelodic';

const ZODIAC = [
  { symbol: '♈', name: 'Aries',       color: 'hsl(0 70% 58%)',   element: 'Fire'  },
  { symbol: '♉', name: 'Taurus',      color: 'hsl(120 38% 46%)', element: 'Earth' },
  { symbol: '♊', name: 'Gemini',      color: 'hsl(48 68% 54%)',  element: 'Air'   },
  { symbol: '♋', name: 'Cancer',      color: 'hsl(210 48% 60%)', element: 'Water' },
  { symbol: '♌', name: 'Leo',         color: 'hsl(38 80% 56%)',  element: 'Fire'  },
  { symbol: '♍', name: 'Virgo',       color: 'hsl(90 34% 46%)',  element: 'Earth' },
  { symbol: '♎', name: 'Libra',       color: 'hsl(330 48% 60%)', element: 'Air'   },
  { symbol: '♏', name: 'Scorpio',     color: 'hsl(0 48% 40%)',   element: 'Water' },
  { symbol: '♐', name: 'Sagittarius', color: 'hsl(270 48% 56%)', element: 'Fire'  },
  { symbol: '♑', name: 'Capricorn',   color: 'hsl(30 24% 40%)',  element: 'Earth' },
  { symbol: '♒', name: 'Aquarius',    color: 'hsl(195 68% 50%)', element: 'Air'   },
  { symbol: '♓', name: 'Pisces',      color: 'hsl(240 48% 60%)', element: 'Water' },
];

// Element hue for sign segment background
const ELEMENT_HUE: Record<string, number> = {
  Fire: 15, Earth: 100, Air: 195, Water: 215,
};

const HOUSE_NAMES = [
  'Self', 'Worth', 'Mind', 'Home', 'Joy', 'Health',
  'Union', 'Depth', 'Quest', 'Career', 'Friends', 'Spirit',
];

interface Props {
  planets: PlanetPosition[];
  aspects: ComputedAspect[];
  onPlanetClick: (planet: PlanetPosition) => void;
  onAspectClick: (aspect: ComputedAspect) => void;
  onPlanetHover: (name: string | null) => void;
  onSignClick?: (signName: string) => void;
  selectedPlanet: PlanetPosition | null;
  selectedAspect: ComputedAspect | null;
  enabledPlanets?: Set<string>;
}

export const InteractiveZodiacWheel = ({
  planets,
  aspects,
  onPlanetClick,
  onAspectClick,
  onPlanetHover,
  onSignClick,
  selectedPlanet,
  selectedAspect,
  enabledPlanets,
}: Props) => {
  const [hoveredSign, setHoveredSign] = useState<number | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
  const [hoveredAspect, setHoveredAspect] = useState<number | null>(null);

  const size = 600;
  const cx = size / 2;
  const cy = size / 2;
  const outerR   = size / 2 - 16;
  const signOuter = outerR;
  const signInner = outerR - 44;
  const planetR   = signInner - 48;
  const innerR    = planetR - 36;
  const houseR    = innerR - 4;

  const ascendant = planets.find(p => p.name === 'Ascendant');
  const ascDeg = ascendant?.degree ?? 0;

  const degToAngle = (deg: number) =>
    (180 - (deg - ascDeg)) * (Math.PI / 180);

  const polarToXY = (angle: number, r: number) => ({
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
  });

  // Describe an arc segment (for zodiac sign backgrounds)
  const arcPath = (startDeg: number, endDeg: number, r1: number, r2: number) => {
    const a1 = degToAngle(startDeg);
    const a2 = degToAngle(endDeg);
    const x1o = cx + Math.cos(a1) * r2, y1o = cy + Math.sin(a1) * r2;
    const x2o = cx + Math.cos(a2) * r2, y2o = cy + Math.sin(a2) * r2;
    // CCW arc (signs go counter-clockwise)
    const sweep = 0;
    return [
      `M ${cx + Math.cos(a1) * r1} ${cy + Math.sin(a1) * r1}`,
      `L ${x1o} ${y1o}`,
      `A ${r2} ${r2} 0 0 ${sweep} ${x2o} ${y2o}`,
      `L ${cx + Math.cos(a2) * r1} ${cy + Math.sin(a2) * r1}`,
      `A ${r1} ${r1} 0 0 ${1 - sweep} ${cx + Math.cos(a1) * r1} ${cy + Math.sin(a1) * r1}`,
      'Z',
    ].join(' ');
  };

  const planetPositions = useMemo(() => {
    return planets.map(planet => {
      const angle = degToAngle(planet.degree);
      return { planet, x: cx + Math.cos(angle) * planetR, y: cy + Math.sin(angle) * planetR, angle };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planets, ascDeg]);

  const getPlanetPos = (name: string) => planetPositions.find(p => p.planet.name === name);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ maxWidth: '100%', maxHeight: '100%' }}>
      <defs>
        {/* Glow filters */}
        <filter id="glow-sm" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-lg" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-pulse" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur result="blur">
            <animate attributeName="stdDeviation" values="3;6;3" dur="2.5s" repeatCount="indefinite" />
          </feGaussianBlur>
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Gold gradient for planet circles */}
        <radialGradient id="rg-planet-sel">
          <stop offset="0%"   stopColor="hsl(43 74% 65%)" />
          <stop offset="100%" stopColor="hsl(43 74% 42%)" />
        </radialGradient>
        <radialGradient id="rg-planet-norm">
          <stop offset="0%"   stopColor="hsl(222 47% 18%)" />
          <stop offset="100%" stopColor="hsl(222 47% 8%)"  />
        </radialGradient>
        {/* Inner circle bg */}
        <radialGradient id="rg-inner" cx="50%" cy="50%">
          <stop offset="0%"   stopColor="hsl(222 47% 10%)" />
          <stop offset="100%" stopColor="hsl(222 47% 5%)"  />
        </radialGradient>
      </defs>

      {/* ── Outer dark ring ────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={outerR + 2} fill="hsl(222 47% 5%)" />

      {/* ── Zodiac sign segments ──────────────────────────── */}
      {ZODIAC.map((sign, i) => {
        const startDeg = i * 30;
        const endDeg   = startDeg + 30;
        const midAngle = degToAngle(startDeg + 15);
        const midX = cx + Math.cos(midAngle) * (signInner + 22);
        const midY = cy + Math.sin(midAngle) * (signInner + 22);
        const isHovered = hoveredSign === i;
        const hue = ELEMENT_HUE[sign.element] ?? 43;

        return (
          <g
            key={sign.name}
            className="cursor-pointer"
            onMouseEnter={() => { setHoveredSign(i); onPlanetHover(`${sign.name} · ${sign.element}`); }}
            onMouseLeave={() => { setHoveredSign(null); onPlanetHover(null); }}
            onClick={() => onSignClick?.(sign.name)}
          >
            {/* Segment fill */}
            <path
              d={arcPath(startDeg, endDeg, signInner, signOuter)}
              fill={isHovered ? `hsl(${hue} 55% 20% / 0.6)` : `hsl(${hue} 40% 12% / 0.35)`}
              stroke={isHovered ? `hsl(${hue} 65% 45% / 0.6)` : 'hsl(43 30% 30% / 0.2)'}
              strokeWidth="0.5"
              style={{ transition: 'fill 0.2s, stroke 0.2s' }}
            />
            {/* Divider line at start */}
            {(() => {
              const a = degToAngle(startDeg);
              const p1 = polarToXY(a, signInner);
              const p2 = polarToXY(a, signOuter);
              return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="hsl(43 30% 35% / 0.3)" strokeWidth="0.5" />;
            })()}
            {/* Glyph */}
            <text
              x={midX}
              y={midY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isHovered ? sign.color : sign.color.replace(')', ' / 0.75)')}
              fontSize={isHovered ? '19' : '17'}
              fontFamily="serif"
              style={{ transition: 'font-size 0.15s' }}
              filter={isHovered ? 'url(#glow-sm)' : undefined}
            >
              {sign.symbol}
            </text>
          </g>
        );
      })}

      {/* ── Inner circle ─────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={signInner} fill="hsl(222 47% 7%)"
        stroke="hsl(43 30% 30% / 0.3)" strokeWidth="0.75" />

      {/* ── House cusps + labels (equal-house from Ascendant) ── */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = degToAngle(ascDeg + i * 30);
        const p1 = polarToXY(angle, innerR);
        const p2 = polarToXY(angle, signInner);
        // Label at midpoint between this and next cusp
        const midAngle = degToAngle(ascDeg + i * 30 + 15);
        const labelR = innerR + (signInner - innerR) * 0.45;
        const lp = polarToXY(midAngle, labelR);
        const isHov = hoveredHouse === i;

        return (
          <g key={`house-${i}`}
            onMouseEnter={() => { setHoveredHouse(i); onPlanetHover(`House ${i + 1} · ${HOUSE_NAMES[i]}`); }}
            onMouseLeave={() => { setHoveredHouse(null); onPlanetHover(null); }}
          >
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="hsl(43 30% 40% / 0.2)" strokeWidth="0.5" strokeDasharray="3,4" />
            {/* House number */}
            <text
              x={lp.x} y={lp.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={isHov ? '10' : '8'}
              fill={isHov ? 'hsl(43 74% 62%)' : 'hsl(43 40% 45% / 0.5)'}
              fontFamily="serif"
              style={{ transition: 'all 0.15s', cursor: 'default' }}
              filter={isHov ? 'url(#glow-sm)' : undefined}
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* ── Inner circle boundary ─────────────────────────── */}
      <circle cx={cx} cy={cy} r={innerR} fill="url(#rg-inner)"
        stroke="hsl(43 30% 35% / 0.4)" strokeWidth="0.75" />

      {/* ── Aspect lines ─────────────────────────────────── */}
      {aspects.map((aspect, i) => {
        const pos1 = getPlanetPos(aspect.planet1);
        const pos2 = getPlanetPos(aspect.planet2);
        if (!pos1 || !pos2) return null;

        const isSel  = selectedAspect?.planet1 === aspect.planet1 && selectedAspect?.planet2 === aspect.planet2;
        const isHov  = hoveredAspect === i;
        const active = isSel || isHov;

        return (
          <motion.line
            key={`asp-${i}`}
            x1={pos1.x} y1={pos1.y}
            x2={pos2.x} y2={pos2.y}
            stroke={aspect.aspectType.color}
            strokeWidth={active ? 2.5 : 1}
            strokeOpacity={active ? 1 : 0.45}
            strokeDasharray={
              aspect.aspectType.name === 'Opposition' ? '8,4' :
              aspect.aspectType.name === 'Square'     ? '4,4' :
              aspect.aspectType.name === 'Quincunx'  ? '2,5' : 'none'
            }
            className="cursor-pointer"
            onClick={() => onAspectClick(aspect)}
            onMouseEnter={() => {
              setHoveredAspect(i);
              onPlanetHover(`${aspect.planet1} ${aspect.aspectType.symbol} ${aspect.planet2} · ${aspect.aspectType.name}`);
            }}
            onMouseLeave={() => { setHoveredAspect(null); onPlanetHover(null); }}
            filter={active ? 'url(#glow-sm)' : undefined}
            style={{ transition: 'stroke-opacity 0.2s, stroke-width 0.2s' }}
          />
        );
      })}

      {/* ── Planet symbols ───────────────────────────────── */}
      {planetPositions.map(({ planet, x, y }) => {
        const isSel = selectedPlanet?.name === planet.name;
        const isAsc = planet.name === 'Ascendant';
        const isEnabled = !enabledPlanets || isAsc || enabledPlanets.has(planet.name);
        const radius = isAsc ? 14 : 19;

        return (
          <g key={planet.name} opacity={isEnabled ? 1 : 0.15}>
            {/* Ripple ring (active planets only) */}
            {!isAsc && isEnabled && (
              <>
                {[0, 1].map(ri => (
                  <circle key={ri} cx={x} cy={y} r={radius} fill="none"
                    stroke="hsl(43 74% 52%)" strokeWidth="1" opacity="0">
                    <animate attributeName="r" from={radius} to={radius + 22}
                      dur="3.2s" begin={`${ri * 1.6}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.45" to="0"
                      dur="3.2s" begin={`${ri * 1.6}s`} repeatCount="indefinite" />
                  </circle>
                ))}
              </>
            )}

            {/* Glow aura */}
            {isSel && (
              <circle cx={x} cy={y} r={radius + 12}
                fill="hsl(43 74% 52% / 0.15)"
                filter="url(#glow-lg)" />
            )}

            {/* Planet circle */}
            <motion.circle
              cx={x} cy={y} r={radius}
              fill={isSel ? 'url(#rg-planet-sel)' : 'url(#rg-planet-norm)'}
              stroke={isSel ? 'hsl(43 74% 62%)' : 'hsl(43 74% 45% / 0.7)'}
              strokeWidth={isSel ? 1.75 : 0.75}
              className="cursor-pointer"
              onClick={() => onPlanetClick(planet)}
              onMouseEnter={() => onPlanetHover(`${planet.name} in ${planet.sign}${planet.isRetrograde ? ' ℞' : ''}`)}
              onMouseLeave={() => onPlanetHover(null)}
              whileHover={{ scale: 1.18 }}
              whileTap={{ scale: 0.93 }}
              filter={isSel ? 'url(#glow-pulse)' : undefined}
            />

            {/* Symbol */}
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fill={isSel ? 'hsl(222 47% 6%)' : 'hsl(43 74% 62%)'}
              fontSize={isAsc ? '9' : '13'}
              fontFamily="serif"
              className="pointer-events-none select-none"
              style={{ fontWeight: isSel ? '600' : '400' }}
            >
              {planet.symbol}
            </text>

            {/* Retrograde marker */}
            {planet.isRetrograde && (
              <text x={x + radius - 2} y={y - radius + 4}
                fill="hsl(0 70% 65%)" fontSize="8"
                className="pointer-events-none select-none">℞</text>
            )}

            {/* Sign below planet */}
            {!isAsc && (
              <text x={x} y={y + radius + 9}
                textAnchor="middle" dominantBaseline="middle"
                fill="hsl(0 0% 60% / 0.5)" fontSize="7"
                className="pointer-events-none select-none">
                {planet.sign.substring(0, 3).toUpperCase()}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Centre pulse ─────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={5} fill="hsl(43 74% 55%)" opacity="0.9"
        filter="url(#glow-sm)">
        <animate attributeName="r" values="3;5.5;3" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.55;1;0.55" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};
