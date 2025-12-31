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
const aspects = [
  { name: 'Conjunction', angle: 0, orb: 8, color: 'hsla(43, 74%, 52%, 0.8)', dash: '' },
  { name: 'Sextile', angle: 60, orb: 6, color: 'hsla(186, 95%, 48%, 0.6)', dash: '4 2' },
  { name: 'Square', angle: 90, orb: 8, color: 'hsla(0, 70%, 55%, 0.7)', dash: '' },
  { name: 'Trine', angle: 120, orb: 8, color: 'hsla(120, 60%, 50%, 0.7)', dash: '' },
  { name: 'Opposition', angle: 180, orb: 8, color: 'hsla(0, 70%, 55%, 0.6)', dash: '6 3' },
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

interface ZodiacWheelProps {
  planets?: PlanetPosition[];
  animate?: boolean;
}

export const ZodiacWheel = ({ planets, animate = true }: ZodiacWheelProps) => {
  const size = 300;
  const center = size / 2;
  
  // Get ascendant degree for wheel rotation (Ascendant should be at 9 o'clock / left)
  const ascendantDegree = planets?.find(p => p.name === 'Ascendant')?.degree || 0;
  // Rotation offset: In Western charts, Ascendant is at 9 o'clock (180° on SVG coordinate system)
  // If Ascendant is at X degrees zodiacal, we rotate the wheel so X° appears at 180° on screen
  const wheelRotation = planets ? -(ascendantDegree) : 0;

  // Convert real planet data to display format, or use defaults
  const displayPlanets = planets 
    ? planets.map((p, i) => ({
        symbol: p.symbol,
        name: p.name,
        angle: p.degree, // Use actual degree from chart
        radius: 0.55 + (i % 3) * 0.08, // Stagger radii for visibility
        isRetrograde: p.isRetrograde,
      }))
    : defaultPlanets.map(p => ({ ...p, isRetrograde: false }));
  
  // Calculate aspects between planets
  const planetAspects = planets ? calculateAspects(displayPlanets) : [];

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

        {/* Outer zodiac ring - rotated based on Ascendant when we have real data */}
        <motion.g
          initial={animate && !planets ? { rotate: 0 } : undefined}
          animate={animate && !planets ? { rotate: 360 } : undefined}
          transition={animate && !planets ? { duration: 120, repeat: Infinity, ease: "linear" } : undefined}
          style={{ 
            transformOrigin: 'center',
            transform: planets ? `rotate(${wheelRotation}deg)` : undefined,
          }}
        >
          <circle
            cx={center}
            cy={center}
            r={center - 20}
            fill="none"
            stroke="hsla(43, 74%, 52%, 0.3)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Zodiac signs - 0° Aries starts at right (3 o'clock), goes counter-clockwise */}
          {zodiacSigns.map((sign, index) => {
            // Each sign occupies 30°, starting from 0° Aries
            // In SVG, 0° is right (3 o'clock), and we go counter-clockwise for zodiac
            const signMidpoint = index * 30 + 15; // Middle of each sign
            const angle = (-signMidpoint + 180) * (Math.PI / 180); // Counter-clockwise, offset to put Aries at 9 o'clock when ASC=0
            const radius = center - 35;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;

            return (
              <g key={sign.name}>
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
                  opacity={0.9}
                >
                  {sign.symbol}
                </text>
              </g>
            );
          })}
        </motion.g>

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

        {/* House lines */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * (Math.PI / 180);
          const x1 = center + Math.cos(angle) * (center * 0.3);
          const y1 = center + Math.sin(angle) * (center * 0.3);
          const x2 = center + Math.cos(angle) * (center - 50);
          const y2 = center + Math.sin(angle) * (center - 50);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="hsla(255, 30%, 40%, 0.3)"
              strokeWidth="1"
            />
          );
        })}

        {/* Planet positions - rotated with the wheel when we have real data */}
        <motion.g
          initial={animate && !planets ? { rotate: 0 } : undefined}
          animate={animate && !planets ? { rotate: -360 } : undefined}
          transition={animate && !planets ? { duration: 180, repeat: Infinity, ease: "linear" } : undefined}
          style={{ 
            transformOrigin: 'center',
            transform: planets ? `rotate(${wheelRotation}deg)` : undefined,
          }}
        >
          {displayPlanets.map((planet, idx) => {
            // Skip drawing Ascendant as a planet (it's a point, shown by wheel orientation)
            if (planet.name === 'Ascendant') return null;
            
            // Convert degree to position
            // Zodiac goes counter-clockwise: 0° at 9 o'clock when wheel is at 0 rotation
            const angle = (-planet.angle + 180) * (Math.PI / 180);
            const radius = center * planet.radius;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;

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
                  // Counter-rotate text so it's readable
                  style={{ transform: planets ? `rotate(${-wheelRotation}deg)` : undefined, transformOrigin: `${x}px ${y}px` }}
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
        </motion.g>

        {/* Aspect lines between planets */}
        {planets && (
          <g style={{ transform: `rotate(${wheelRotation}deg)`, transformOrigin: 'center' }}>
            {planetAspects.map(({ p1, p2, aspect }, idx) => {
              const planet1 = displayPlanets[p1];
              const planet2 = displayPlanets[p2];
              
              const angle1 = (-planet1.angle + 180) * (Math.PI / 180);
              const angle2 = (-planet2.angle + 180) * (Math.PI / 180);
              
              const r1 = center * planet1.radius;
              const r2 = center * planet2.radius;
              
              const x1 = center + Math.cos(angle1) * r1;
              const y1 = center + Math.sin(angle1) * r1;
              const x2 = center + Math.cos(angle2) * r2;
              const y2 = center + Math.sin(angle2) * r2;

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

        {/* Ascendant marker (left side of chart) */}
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
