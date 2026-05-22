import { motion } from 'framer-motion';
import type { PlanetPosition } from '@/types/astrology';
import { ZodiacSigilFragment, PlanetSigilFragment } from '@/components/sigils/SigilFragments';
import { toZodiacSign, toPlanetName, type ZodiacSign, type PlanetName } from '@/components/sigils';

const ZODIAC_NAMES: ZodiacSign[] = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces',
];

const DEFAULT_PLANETS: { name: PlanetName; angle: number; radius: number }[] = [
  { name: 'sun',     angle: 15,  radius: 0.35 },
  { name: 'moon',    angle: 95,  radius: 0.28 },
  { name: 'mercury', angle: 45,  radius: 0.42 },
  { name: 'venus',   angle: 145, radius: 0.32 },
  { name: 'mars',    angle: 205, radius: 0.38 },
  { name: 'jupiter', angle: 275, radius: 0.25 },
  { name: 'saturn',  angle: 320, radius: 0.45 },
];

// Aspect set used by the chart logic
export const aspects = [
  { name: 'Conjunction', symbol: '☌', angle: 0,   orb: 8, color: 'hsl(168 95% 55% / 0.85)', dash: '' },
  { name: 'Sextile',     symbol: '⚹', angle: 60,  orb: 6, color: 'hsl(168 95% 55% / 0.55)', dash: '4 2' },
  { name: 'Square',      symbol: '□', angle: 90,  orb: 8, color: 'hsl(14 95% 58% / 0.7)',   dash: '' },
  { name: 'Trine',       symbol: '△', angle: 120, orb: 8, color: 'hsl(140 70% 55% / 0.7)',  dash: '' },
  { name: 'Opposition',  symbol: '☍', angle: 180, orb: 8, color: 'hsl(14 95% 58% / 0.55)',  dash: '6 3' },
];

function calculateAspects(planets: { name: string; angle: number }[]) {
  const result: { p1: number; p2: number; aspect: typeof aspects[0] }[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (planets[i].name === 'Ascendant' || planets[j].name === 'Ascendant') continue;
      let diff = Math.abs(planets[i].angle - planets[j].angle);
      if (diff > 180) diff = 360 - diff;
      for (const aspect of aspects) {
        if (Math.abs(diff - aspect.angle) <= aspect.orb) {
          result.push({ p1: i, p2: j, aspect });
          break;
        }
      }
    }
  }
  return result;
}

function degreeToScreenAngle(zodiacDegree: number, ascendantDegree: number): number {
  return 180 - (zodiacDegree - ascendantDegree);
}

interface ZodiacWheelProps {
  planets?: PlanetPosition[];
  animate?: boolean;
}

export const ZodiacWheel = ({ planets, animate = true }: ZodiacWheelProps) => {
  const size = 300;
  const center = size / 2;
  const ascendantDegree = planets?.find(p => p.name === 'Ascendant')?.degree || 0;

  const displayPlanets = planets
    ? planets.map((p) => ({
        name: p.name,
        zodiacDegree: p.degree,
        screenAngle: degreeToScreenAngle(p.degree, ascendantDegree),
        radius: 0.6,
        isRetrograde: p.isRetrograde,
        planetKey: toPlanetName(p.name),
      }))
    : DEFAULT_PLANETS.map(p => ({
        name: p.name,
        zodiacDegree: p.angle,
        screenAngle: p.angle,
        radius: p.radius,
        isRetrograde: false,
        planetKey: p.name,
      }));

  const planetAspects = planets
    ? calculateAspects(displayPlanets.map(p => ({ name: p.name, angle: p.zodiacDegree })))
    : [];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 65%)',
          filter: 'blur(20px)',
        }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative z-10">
        <defs>
          <filter id="zw-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Plate */}
        <circle cx={center} cy={center} r={center - 5}
          fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />

        {/* Outer dashed ring */}
        <circle cx={center} cy={center} r={center - 20}
          fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="0.75" strokeDasharray="2 4" />

        {/* Zodiac sigils on the rim */}
        {ZODIAC_NAMES.map((sign, index) => {
          const signMidDegree = index * 30 + 15;
          const screenAngle = degreeToScreenAngle(signMidDegree, planets ? ascendantDegree : 0);
          const angleRad = screenAngle * (Math.PI / 180);
          const r = center - 35;
          const x = center + Math.cos(angleRad) * r;
          const y = center + Math.sin(angleRad) * r;
          return (
            <motion.g
              key={sign}
              initial={{ opacity: animate ? 0 : 0.9 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 0.02 * index, duration: 0.3 }}
            >
              <ZodiacSigilFragment
                sign={sign} cx={x} cy={y} size={16}
                stroke="hsl(var(--foreground) / 0.7)"
                strokeWidth={1.4}
              />
            </motion.g>
          );
        })}

        {/* Inner rings */}
        <circle cx={center} cy={center} r={center * 0.6}
          fill="none" stroke="hsl(var(--border))" strokeWidth="0.75" />
        <circle cx={center} cy={center} r={center * 0.4}
          fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />

        {/* House cusps */}
        {[...Array(12)].map((_, i) => {
          const houseStartAngle = 180 + (i * 30);
          const angleRad = houseStartAngle * (Math.PI / 180);
          const x1 = center + Math.cos(angleRad) * (center * 0.3);
          const y1 = center + Math.sin(angleRad) * (center * 0.3);
          const x2 = center + Math.cos(angleRad) * (center - 50);
          const y2 = center + Math.sin(angleRad) * (center - 50);
          const isAngular = i === 0 || i === 3 || i === 6 || i === 9;
          return (
            <line key={`house-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isAngular ? 'hsl(var(--accent) / 0.5)' : 'hsl(var(--border))'}
              strokeWidth={isAngular ? 1 : 0.5} />
          );
        })}

        {/* Aspect lines */}
        {planets && planetAspects.map(({ p1, p2, aspect }, idx) => {
          const planet1 = displayPlanets[p1];
          const planet2 = displayPlanets[p2];
          const a1 = planet1.screenAngle * (Math.PI / 180);
          const a2 = planet2.screenAngle * (Math.PI / 180);
          const r1 = center * planet1.radius;
          const r2 = center * planet2.radius;
          return (
            <motion.line key={`aspect-${idx}`}
              x1={center + Math.cos(a1) * r1} y1={center + Math.sin(a1) * r1}
              x2={center + Math.cos(a2) * r2} y2={center + Math.sin(a2) * r2}
              stroke={aspect.color}
              strokeWidth={aspect.name === 'Conjunction' || aspect.name === 'Opposition' ? 1 : 0.75}
              strokeDasharray={aspect.dash}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + idx * 0.05, duration: 0.3 }}
            />
          );
        })}

        {/* Planet sigils */}
        {displayPlanets.map((planet, idx) => {
          if (planet.name === 'Ascendant') return null;
          const angleRad = planet.screenAngle * (Math.PI / 180);
          const r = center * planet.radius;
          const x = center + Math.cos(angleRad) * r;
          const y = center + Math.sin(angleRad) * r;
          if (!planet.planetKey) return null;
          return (
            <motion.g
              key={planet.name}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.05 * idx }}
            >
              <PlanetSigilFragment
                planet={planet.planetKey}
                cx={x} cy={y} size={16}
                stroke={planet.isRetrograde ? 'hsl(var(--jewel-ember))' : 'hsl(var(--accent))'}
                strokeWidth={1.5}
                filter="url(#zw-glow)"
              />
            </motion.g>
          );
        })}

        {/* Centre marker */}
        <circle cx={center} cy={center} r="22"
          fill="hsl(var(--background))" stroke="hsl(var(--accent) / 0.5)" strokeWidth="1" />
        <circle cx={center} cy={center} r="3" fill="hsl(var(--accent))" filter="url(#zw-glow)" />

        {/* Cardinal points */}
        {planets && (
          <g fontFamily="JetBrains Mono, monospace" letterSpacing="0.15em">
            <line x1={5} y1={center} x2={28} y2={center}
              stroke="hsl(var(--accent))" strokeWidth="1.5" />
            <text x={12} y={center - 6} fill="hsl(var(--accent))" fontSize="9">ASC</text>
            <text x={size - 12} y={center - 6} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="8">DSC</text>
            <text x={center} y={14} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">MC</text>
            <text x={center} y={size - 6} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">IC</text>
          </g>
        )}
      </svg>
    </div>
  );
};
