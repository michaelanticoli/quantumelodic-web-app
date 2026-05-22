import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { PlanetPosition } from '@/types/astrology';
import type { ComputedAspect } from '@/types/quantumMelodic';
import { ZodiacSigilFragment, PlanetSigilFragment } from '@/components/sigils/SigilFragments';
import { toZodiacSign, toPlanetName } from '@/components/sigils';

const ZODIAC = [
  { name: 'Aries',       element: 'Fire'  },
  { name: 'Taurus',      element: 'Earth' },
  { name: 'Gemini',      element: 'Air'   },
  { name: 'Cancer',      element: 'Water' },
  { name: 'Leo',         element: 'Fire'  },
  { name: 'Virgo',       element: 'Earth' },
  { name: 'Libra',       element: 'Air'   },
  { name: 'Scorpio',     element: 'Water' },
  { name: 'Sagittarius', element: 'Fire'  },
  { name: 'Capricorn',   element: 'Earth' },
  { name: 'Aquarius',    element: 'Air'   },
  { name: 'Pisces',      element: 'Water' },
];

// Jewel tones per element — used as subtle punctuation only
const ELEMENT_COLOR: Record<string, string> = {
  Fire:  'hsl(14 95% 58%)',
  Earth: 'hsl(140 70% 55%)',
  Air:   'hsl(168 95% 55%)',
  Water: 'hsl(220 80% 62%)',
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

  const ascendant = planets.find(p => p.name === 'Ascendant');
  const ascDeg = ascendant?.degree ?? 0;

  const degToAngle = (deg: number) =>
    (180 - (deg - ascDeg)) * (Math.PI / 180);

  const polarToXY = (angle: number, r: number) => ({
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
  });

  const arcPath = (startDeg: number, endDeg: number, r1: number, r2: number) => {
    const a1 = degToAngle(startDeg);
    const a2 = degToAngle(endDeg);
    const x1o = cx + Math.cos(a1) * r2, y1o = cy + Math.sin(a1) * r2;
    const x2o = cx + Math.cos(a2) * r2, y2o = cy + Math.sin(a2) * r2;
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
        <filter id="glow-sm" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-lg" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer plate */}
      <circle cx={cx} cy={cy} r={outerR + 2} fill="hsl(var(--background))" />

      {/* Zodiac segments */}
      {ZODIAC.map((sign, i) => {
        const startDeg = i * 30;
        const endDeg   = startDeg + 30;
        const midAngle = degToAngle(startDeg + 15);
        const midX = cx + Math.cos(midAngle) * (signInner + 22);
        const midY = cy + Math.sin(midAngle) * (signInner + 22);
        const isHovered = hoveredSign === i;
        const color = ELEMENT_COLOR[sign.element];
        const sigilKey = toZodiacSign(sign.name);

        return (
          <g
            key={sign.name}
            className="cursor-pointer"
            onMouseEnter={() => { setHoveredSign(i); onPlanetHover(`${sign.name} · ${sign.element}`); }}
            onMouseLeave={() => { setHoveredSign(null); onPlanetHover(null); }}
            onClick={() => onSignClick?.(sign.name)}
          >
            <path
              d={arcPath(startDeg, endDeg, signInner, signOuter)}
              fill={isHovered ? `${color.replace(')', ' / 0.12)')}` : 'hsl(var(--foreground) / 0.015)'}
              stroke={isHovered ? color.replace(')', ' / 0.6)') : 'hsl(var(--border))'}
              strokeWidth="0.75"
              style={{ transition: 'fill 0.2s, stroke 0.2s' }}
            />
            {(() => {
              const a = degToAngle(startDeg);
              const p1 = polarToXY(a, signInner);
              const p2 = polarToXY(a, signOuter);
              return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="hsl(var(--border))" strokeWidth="0.5" />;
            })()}
            {sigilKey && (
              <ZodiacSigilFragment
                sign={sigilKey}
                cx={midX}
                cy={midY}
                size={isHovered ? 26 : 22}
                stroke={isHovered ? color : color.replace(')', ' / 0.7)')}
                strokeWidth={1.5}
                filter={isHovered ? 'url(#glow-sm)' : undefined}
              />
            )}
          </g>
        );
      })}

      {/* Inner plate */}
      <circle cx={cx} cy={cy} r={signInner} fill="hsl(var(--card))"
        stroke="hsl(var(--border))" strokeWidth="0.75" />

      {/* House cusps + numbers (equal-house from Ascendant) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = degToAngle(ascDeg + i * 30);
        const p1 = polarToXY(angle, innerR);
        const p2 = polarToXY(angle, signInner);
        const midAngle = degToAngle(ascDeg + i * 30 + 15);
        const labelR = innerR + (signInner - innerR) * 0.45;
        const lp = polarToXY(midAngle, labelR);
        const isHov = hoveredHouse === i;
        const isAngular = i === 0 || i === 3 || i === 6 || i === 9;

        return (
          <g key={`house-${i}`}
            onMouseEnter={() => { setHoveredHouse(i); onPlanetHover(`House ${i + 1} · ${HOUSE_NAMES[i]}`); }}
            onMouseLeave={() => { setHoveredHouse(null); onPlanetHover(null); }}
          >
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isAngular ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--border))'}
              strokeWidth={isAngular ? 1 : 0.5}
              strokeDasharray={isAngular ? undefined : '2,4'} />
            <text
              x={lp.x} y={lp.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={isHov ? '11' : '9'}
              fill={isHov ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'}
              fontFamily="JetBrains Mono, monospace"
              letterSpacing="0.1em"
              style={{ transition: 'all 0.15s', cursor: 'default' }}
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={innerR} fill="hsl(var(--background))"
        stroke="hsl(var(--border))" strokeWidth="0.75" />

      {/* Aspect lines */}
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
            strokeWidth={active ? 2 : 0.75}
            strokeOpacity={active ? 1 : 0.4}
            strokeDasharray={
              aspect.aspectType.name === 'Opposition' ? '8,4' :
              aspect.aspectType.name === 'Square'     ? '4,4' :
              aspect.aspectType.name === 'Quincunx'   ? '2,5' : 'none'
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

      {/* Planet sigils */}
      {planetPositions.map(({ planet, x, y }) => {
        const isSel = selectedPlanet?.name === planet.name;
        const isAsc = planet.name === 'Ascendant';
        const isEnabled = !enabledPlanets || isAsc || enabledPlanets.has(planet.name);
        const radius = isAsc ? 14 : 20;
        const planetKey = toPlanetName(planet.name);

        return (
          <g key={planet.name} opacity={isEnabled ? 1 : 0.18}>
            {isSel && (
              <circle cx={x} cy={y} r={radius + 8}
                fill="hsl(var(--accent) / 0.18)"
                filter="url(#glow-lg)" />
            )}

            <motion.circle
              cx={x} cy={y} r={radius}
              fill={isSel ? 'hsl(var(--accent))' : 'hsl(var(--background))'}
              stroke={isSel ? 'hsl(var(--accent))' : 'hsl(var(--foreground) / 0.35)'}
              strokeWidth={isSel ? 1.5 : 0.75}
              className="cursor-pointer"
              onClick={() => onPlanetClick(planet)}
              onMouseEnter={() => onPlanetHover(`${planet.name} in ${planet.sign}${planet.isRetrograde ? ' ℞' : ''}`)}
              onMouseLeave={() => onPlanetHover(null)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
            />

            {planetKey && (
              <PlanetSigilFragment
                planet={planetKey}
                cx={x}
                cy={y}
                size={isAsc ? 18 : 24}
                stroke={isSel ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))'}
                strokeWidth={1.5}
              />
            )}

            {planet.isRetrograde && (
              <text x={x + radius - 2} y={y - radius + 4}
                fill="hsl(var(--jewel-ember))" fontSize="9"
                className="pointer-events-none select-none">℞</text>
            )}

            {!isAsc && (
              <text x={x} y={y + radius + 11}
                textAnchor="middle" dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))" fontSize="8"
                letterSpacing="0.15em"
                fontFamily="Inter Tight, sans-serif"
                className="pointer-events-none select-none uppercase">
                {planet.sign.substring(0, 3)}
              </text>
            )}
          </g>
        );
      })}

      {/* Centre dot */}
      <circle cx={cx} cy={cy} r={3} fill="hsl(var(--accent))" opacity="0.9" filter="url(#glow-sm)" />
    </svg>
  );
};
