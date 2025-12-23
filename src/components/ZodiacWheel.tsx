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

interface ZodiacWheelProps {
  planets?: PlanetPosition[];
  animate?: boolean;
}

export const ZodiacWheel = ({ planets, animate = true }: ZodiacWheelProps) => {
  const size = 300;
  const center = size / 2;

  // Convert real planet data to display format, or use defaults
  const displayPlanets = planets 
    ? planets.map((p, i) => ({
        symbol: p.symbol,
        name: p.name,
        angle: p.degree, // Use actual degree from chart
        radius: 0.25 + (i * 0.03), // Stagger radii for visibility
        isRetrograde: p.isRetrograde,
      }))
    : defaultPlanets.map(p => ({ ...p, isRetrograde: false }));

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

        {/* Outer zodiac ring - only animate in decorative mode */}
        <motion.g
          initial={animate && !planets ? { rotate: 0 } : undefined}
          animate={animate && !planets ? { rotate: 360 } : undefined}
          transition={animate && !planets ? { duration: 120, repeat: Infinity, ease: "linear" } : undefined}
          style={{ transformOrigin: 'center' }}
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

          {/* Zodiac signs */}
          {zodiacSigns.map((sign, index) => {
            const angle = (index * 30 - 90) * (Math.PI / 180);
            const radius = center - 35;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;

            return (
              <g key={sign.name}>
                {/* Outer glow effect for the symbol */}
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

        {/* Planet positions - static when real data, animated when decorative */}
        <motion.g
          initial={animate && !planets ? { rotate: 0 } : undefined}
          animate={animate && !planets ? { rotate: -360 } : undefined}
          transition={animate && !planets ? { duration: 180, repeat: Infinity, ease: "linear" } : undefined}
          style={{ transformOrigin: 'center' }}
        >
          {displayPlanets.map((planet, idx) => {
            // Convert degree to position (0° = right, going counter-clockwise)
            const angle = (planet.angle - 90) * (Math.PI / 180);
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

        {/* Aspect lines - only show when we have real data */}
        {planets && planets.length > 1 && (
          <g opacity="0.3">
            {/* Draw aspect lines between Sun and Moon if both exist */}
            {(() => {
              const sun = displayPlanets.find(p => p.name === 'Sun');
              const moon = displayPlanets.find(p => p.name === 'Moon');
              if (sun && moon) {
                const sunAngle = (sun.angle - 90) * (Math.PI / 180);
                const moonAngle = (moon.angle - 90) * (Math.PI / 180);
                const sunX = center + Math.cos(sunAngle) * (center * sun.radius);
                const sunY = center + Math.sin(sunAngle) * (center * sun.radius);
                const moonX = center + Math.cos(moonAngle) * (center * moon.radius);
                const moonY = center + Math.sin(moonAngle) * (center * moon.radius);
                return (
                  <line
                    x1={sunX}
                    y1={sunY}
                    x2={moonX}
                    y2={moonY}
                    stroke="hsla(43, 74%, 52%, 0.5)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                );
              }
              return null;
            })()}
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
