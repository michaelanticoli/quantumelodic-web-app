import { motion } from 'framer-motion';

const zodiacSigns = [
  { symbol: '♈', name: 'Aries', color: 'hsl(0, 70%, 55%)' },
  { symbol: '♉', name: 'Taurus', color: 'hsl(140, 50%, 45%)' },
  { symbol: '♊', name: 'Gemini', color: 'hsl(50, 70%, 50%)' },
  { symbol: '♋', name: 'Cancer', color: 'hsl(210, 30%, 80%)' },
  { symbol: '♌', name: 'Leo', color: 'hsl(35, 90%, 55%)' },
  { symbol: '♍', name: 'Virgo', color: 'hsl(140, 40%, 40%)' },
  { symbol: '♎', name: 'Libra', color: 'hsl(300, 30%, 60%)' },
  { symbol: '♏', name: 'Scorpio', color: 'hsl(0, 60%, 40%)' },
  { symbol: '♐', name: 'Sagittarius', color: 'hsl(280, 60%, 55%)' },
  { symbol: '♑', name: 'Capricorn', color: 'hsl(220, 30%, 40%)' },
  { symbol: '♒', name: 'Aquarius', color: 'hsl(186, 70%, 50%)' },
  { symbol: '♓', name: 'Pisces', color: 'hsl(240, 50%, 60%)' },
];

const planetSymbols = [
  { symbol: '☉', name: 'Sun', angle: 15, radius: 0.35 },
  { symbol: '☽', name: 'Moon', angle: 95, radius: 0.28 },
  { symbol: '☿', name: 'Mercury', angle: 45, radius: 0.42 },
  { symbol: '♀', name: 'Venus', angle: 145, radius: 0.32 },
  { symbol: '♂', name: 'Mars', angle: 205, radius: 0.38 },
  { symbol: '♃', name: 'Jupiter', angle: 275, radius: 0.25 },
  { symbol: '♄', name: 'Saturn', angle: 320, radius: 0.45 },
];

export const ZodiacWheel = () => {
  const size = 300;
  const center = size / 2;

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
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
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
              <text
                key={sign.name}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={sign.color}
                fontSize="16"
                filter="url(#glow)"
                style={{ fontFamily: 'serif' }}
              >
                {sign.symbol}
              </text>
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

        {/* Planet positions with animation */}
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: 'center' }}
        >
          {planetSymbols.map((planet) => {
            const angle = (planet.angle - 90) * (Math.PI / 180);
            const radius = center * planet.radius;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;

            return (
              <motion.text
                key={planet.name}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsla(43, 74%, 70%, 1)"
                fontSize="14"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + Math.random() * 0.5 }}
              >
                {planet.symbol}
              </motion.text>
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

        {/* Aspect lines (decorative) */}
        <g opacity="0.3">
          <line x1={center + 30} y1={center - 40} x2={center - 50} y2={center + 30} stroke="hsla(186, 95%, 48%, 0.5)" strokeWidth="1" />
          <line x1={center - 20} y1={center - 50} x2={center + 40} y2={center + 40} stroke="hsla(291, 64%, 55%, 0.5)" strokeWidth="1" />
          <line x1={center - 40} y1={center + 20} x2={center + 30} y2={center - 30} stroke="hsla(43, 74%, 52%, 0.5)" strokeWidth="1" />
        </g>
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
