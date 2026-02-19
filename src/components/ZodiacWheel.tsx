import { motion } from 'framer-motion';
import type { PlanetPosition } from '@/types/astrology';

// Unicode astrological symbols with elegant gold/amber color palette
const zodiacSigns = [
  { symbol: '♈', name: 'Aries', color: 'hsl(35, 80%, 65%)' },
  { symbol: '♉', name: 'Taurus', color: 'hsl(40, 75%, 60%)' },
  { symbol: '♊', name: 'Gemini', color: 'hsl(45, 85%, 70%)' },
  { symbol: '♋', name: 'Cancer', color: 'hsl(38, 70%, 75%)' },
  { symbol: '♌', name: 'Leo', color: 'hsl(42, 90%, 65%)' },
  { symbol: '♍', name: 'Virgo', color: 'hsl(48, 65%, 60%)' },
  { symbol: '♎', name: 'Libra', color: 'hsl(36, 75%, 68%)' },
  { symbol: '♏', name: 'Scorpio', color: 'hsl(30, 80%, 55%)' },
  { symbol: '♐', name: 'Sagittarius', color: 'hsl(44, 85%, 62%)' },
  { symbol: '♑', name: 'Capricorn', color: 'hsl(32, 70%, 58%)' },
  { symbol: '♒', name: 'Aquarius', color: 'hsl(50, 75%, 70%)' },
  { symbol: '♓', name: 'Pisces', color: 'hsl(38, 80%, 65%)' },
];

// Default decorative planets when no real data
const defaultPlanets = [
  { symbol: '☉', name: 'Sun', angle: 15, radius: 0.35 },
  { symbol: '☽', name: 'Moon', angle: 95, radius: 0.28 },
  { symbol: '☿', name: 'Mercury', angle: 45, radius: 0.42 },
  { symbol: '♀', name: 'Venus', angle: 145, radius: 0.32 },
  { symbol: '♂', name: 'Mars', angle: 205, radius: 0.38 },
  { symbol: '♃', name: 'Jupiter', angle: 275, radius: 0.25 },
  { symbol: '♄', name: 'Saturn', angle: 320, radius: 0.45 },
];

// Aspect definitions with orbs and colors
export const aspects = [
  { name: 'Conjunction', symbol: '☌', angle: 0, orb: 8, color: 'hsla(43, 74%, 52%, 0.8)', dash: '' },
  { name: 'Sextile', symbol: '⚹', angle: 60, orb: 6, color: 'hsla(186, 95%, 48%, 0.6)', dash: '4 2' },
  { name: 'Square', symbol: '□', angle: 90, orb: 8, color: 'hsla(0, 70%, 55%, 0.7)', dash: '' },
  { name: 'Trine', symbol: '△', angle: 120, orb: 8, color: 'hsla(120, 60%, 50%, 0.7)', dash: '' },
  { name: 'Opposition', symbol: '☍', angle: 180, orb: 8, color: 'hsla(0, 70%, 55%, 0.6)', dash: '6 3' },
];

// Calculate aspects between planets
function calculateAspects(planets: { name: string; angle: number }[]) {
  const result: { p1: number; p2: number; aspect: typeof aspects[0] }[] = [];
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      // Skip Ascendant for aspect calculations
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

// Convert zodiacal degree to screen position
// In Western astrology: Ascendant at 9 o'clock (left), zodiac goes counter-clockwise
// House 1 starts at ASC and goes clockwise (so H1 is below ASC at 8 o'clock position)
function degreeToScreenAngle(zodiacDegree: number, ascendantDegree: number): number {
  // The ascendant should appear at 180° (9 o'clock / left side)
  // Zodiac degrees increase counter-clockwise
  // So screen_angle = 180 - (zodiacDegree - ascendantDegree)
  // This puts ASC at 180°, and zodiac increases counter-clockwise
  return 180 - (zodiacDegree - ascendantDegree);
}

interface ZodiacWheelProps {
  planets?: PlanetPosition[];
  animate?: boolean;
}

export const ZodiacWheel = ({ planets, animate = true }: ZodiacWheelProps) => {
  const size = 300;
  const center = size / 2;
  
  // Get ascendant degree for wheel rotation
  const ascendantDegree = planets?.find(p => p.name === 'Ascendant')?.degree || 0;

  // Convert real planet data to display format, or use defaults
  // Place all real planets on the 0.6 ring (matches the inner circle drawn at center * 0.6)
  const displayPlanets = planets 
    ? planets.map((p) => ({
        symbol: p.symbol,
        name: p.name,
        zodiacDegree: p.degree,
        screenAngle: degreeToScreenAngle(p.degree, ascendantDegree),
        radius: 0.6,
        isRetrograde: p.isRetrograde,
      }))
    : defaultPlanets.map(p => ({ 
        ...p, 
        zodiacDegree: p.angle,
        screenAngle: p.angle, 
        isRetrograde: false 
      }));
  
  // Calculate aspects between planets (using zodiacal degrees)
  const planetAspects = planets 
    ? calculateAspects(displayPlanets.map(p => ({ name: p.name, angle: p.zodiacDegree })))
    : [];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(291, 64%, 55%, 0.3) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10"
      >
        {/* Definitions for gradients and filters */}
        <defs>
          <radialGradient id="wheelGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsla(255, 50%, 30%, 0.8)" />
            <stop offset="70%" stopColor="hsla(222, 47%, 15%, 0.9)" />
            <stop offset="100%" stopColor="hsla(222, 47%, 10%, 1)" />
          </radialGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsla(43, 74%, 52%, 0.6)" />
            <stop offset="50%" stopColor="hsla(291, 64%, 55%, 0.4)" />
            <stop offset="100%" stopColor="hsla(186, 95%, 48%, 0.6)" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={center - 5}
          fill="url(#wheelGradient)"
          stroke="url(#ringGradient)"
          strokeWidth="2"
        />

        {/* Outer zodiac ring */}
        <circle
          cx={center}
          cy={center}
          r={center - 20}
          fill="none"
          stroke="hsla(43, 74%, 52%, 0.3)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Zodiac signs - positioned based on ascendant */}
        {zodiacSigns.map((sign, index) => {
          // Each sign occupies 30°, sign 0 (Aries) starts at 0°
          const signStartDegree = index * 30;
          const signMidDegree = signStartDegree + 15;
          
          // Convert to screen angle
          const screenAngle = degreeToScreenAngle(signMidDegree, planets ? ascendantDegree : 0);
          const angleRad = screenAngle * (Math.PI / 180);
          
          const radius = center - 35;
          const x = center + Math.cos(angleRad) * radius;
          const y = center + Math.sin(angleRad) * radius;

          return (
            <motion.g 
              key={sign.name}
              initial={animate && !planets ? { opacity: 0 } : undefined}
              animate={animate && !planets ? { opacity: 0.9 } : { opacity: 0.9 }}
            >
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={sign.color}
                fontSize="18"
                filter="url(#glow)"
                style={{ 
                  fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", sans-serif',
                  fontWeight: 400,
                }}
              >
                {sign.symbol}
              </text>
            </motion.g>
          );
        })}

        {/* Inner rings */}
        <circle
          cx={center}
          cy={center}
          r={center * 0.6}
          fill="none"
          stroke="hsla(255, 30%, 40%, 0.4)"
          strokeWidth="1"
        />
        <circle
          cx={center}
          cy={center}
          r={center * 0.4}
          fill="none"
          stroke="hsla(255, 30%, 40%, 0.3)"
          strokeWidth="1"
        />

        {/* House cusp lines - 12 houses, starting from Ascendant */}
        {/* In equal house system, each house is 30° starting from ASC */}
        {[...Array(12)].map((_, i) => {
          // House cusp i starts at ASC + (i * 30) in the clockwise direction
          // But houses go clockwise from ASC (which is at 180° screen angle)
          // House 1 cusp is at ASC (180°), House 2 at 180° + 30° = 210°, etc.
          const houseStartAngle = 180 + (i * 30);
          const angleRad = houseStartAngle * (Math.PI / 180);
          
          const x1 = center + Math.cos(angleRad) * (center * 0.3);
          const y1 = center + Math.sin(angleRad) * (center * 0.3);
          const x2 = center + Math.cos(angleRad) * (center - 50);
          const y2 = center + Math.sin(angleRad) * (center - 50);

          // House number position (middle of the house)
          const houseMidAngle = 180 + (i * 30) + 15;
          const houseMidRad = houseMidAngle * (Math.PI / 180);
          const houseNumX = center + Math.cos(houseMidRad) * (center * 0.2);
          const houseNumY = center + Math.sin(houseMidRad) * (center * 0.2);

          const isAngular = i === 0 || i === 3 || i === 6 || i === 9;

          return (
            <g key={`house-${i}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isAngular ? 'hsla(186, 95%, 60%, 0.6)' : 'hsla(255, 30%, 40%, 0.3)'}
                strokeWidth={isAngular ? 1.5 : 1}
              />
              {/* House number */}
              {planets && (
                <text
                  x={houseNumX}
                  y={houseNumY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="hsla(255, 30%, 60%, 0.5)"
                  fontSize="9"
                >
                  {i + 1}
                </text>
              )}
            </g>
          );
        })}

        {/* Planet positions */}
        {displayPlanets.map((planet, idx) => {
          // Skip drawing Ascendant as a planet (it's shown as the left axis)
          if (planet.name === 'Ascendant') return null;
          
          const angleRad = planet.screenAngle * (Math.PI / 180);
          const radius = center * planet.radius;
          const x = center + Math.cos(angleRad) * radius;
          const y = center + Math.sin(angleRad) * radius;

          return (
            <g key={planet.name}>
              <motion.text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={planet.isRetrograde ? 'hsla(0, 70%, 60%, 1)' : 'hsla(43, 74%, 70%, 1)'}
                fontSize="14"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * idx }}
              >
                {planet.symbol}
              </motion.text>
              {/* Retrograde indicator */}
              {planet.isRetrograde && (
                <text
                  x={x + 8}
                  y={y - 5}
                  fontSize="8"
                  fill="hsla(0, 70%, 60%, 0.8)"
                >
                  ℞
                </text>
              )}
            </g>
          );
        })}

        {/* Aspect lines between planets */}
        {planets && (
          <g>
            {planetAspects.map(({ p1, p2, aspect }, idx) => {
              const planet1 = displayPlanets[p1];
              const planet2 = displayPlanets[p2];
              
              const angle1Rad = planet1.screenAngle * (Math.PI / 180);
              const angle2Rad = planet2.screenAngle * (Math.PI / 180);
              
              const r1 = center * planet1.radius;
              const r2 = center * planet2.radius;
              
              const x1 = center + Math.cos(angle1Rad) * r1;
              const y1 = center + Math.sin(angle1Rad) * r1;
              const x2 = center + Math.cos(angle2Rad) * r2;
              const y2 = center + Math.sin(angle2Rad) * r2;

              return (
                <motion.line
                  key={`aspect-${idx}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={aspect.color}
                  strokeWidth={aspect.name === 'Conjunction' || aspect.name === 'Opposition' ? 1.5 : 1}
                  strokeDasharray={aspect.dash}
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1, duration: 0.3 }}
                />
              );
            })}
          </g>
        )}

        {/* Center music note */}
        <motion.g
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle
            cx={center}
            cy={center}
            r="25"
            fill="hsla(222, 47%, 15%, 0.9)"
            stroke="hsla(43, 74%, 52%, 0.6)"
            strokeWidth="2"
          />
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsla(43, 74%, 70%, 1)"
            fontSize="20"
            filter="url(#glow)"
          >
            ♪
          </text>
        </motion.g>

        {/* Ascendant marker (left side of chart - 9 o'clock) */}
        {planets && (
          <g>
            <text
              x={15}
              y={center}
              textAnchor="start"
              dominantBaseline="middle"
              fill="hsla(186, 95%, 60%, 1)"
              fontSize="12"
              fontWeight="bold"
            >
              ASC
            </text>
            <line
              x1={5}
              y1={center}
              x2={40}
              y2={center}
              stroke="hsla(186, 95%, 60%, 0.8)"
              strokeWidth="2"
            />
            {/* Descendant marker (right side - 3 o'clock) */}
            <text
              x={size - 15}
              y={center}
              textAnchor="end"
              dominantBaseline="middle"
              fill="hsla(186, 95%, 60%, 0.6)"
              fontSize="10"
            >
              DSC
            </text>
            {/* MC marker (top - 12 o'clock) */}
            <text
              x={center}
              y={15}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsla(186, 95%, 60%, 0.6)"
              fontSize="10"
            >
              MC
            </text>
            {/* IC marker (bottom - 6 o'clock) */}
            <text
              x={center}
              y={size - 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsla(186, 95%, 60%, 0.6)"
              fontSize="10"
            >
              IC
            </text>
          </g>
        )}
      </svg>

      {/* Sound wave effect */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: '1px solid hsla(43, 74%, 52%, 0.3)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
    </div>
  );
};
