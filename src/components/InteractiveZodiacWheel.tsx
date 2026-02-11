import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PlanetPosition } from '@/types/astrology';
import type { ComputedAspect } from '@/types/quantumMelodic';

const zodiacSigns = [
  { symbol: '♈', name: 'Aries', color: 'hsl(0, 70%, 55%)' },
  { symbol: '♉', name: 'Taurus', color: 'hsl(120, 40%, 45%)' },
  { symbol: '♊', name: 'Gemini', color: 'hsl(45, 70%, 55%)' },
  { symbol: '♋', name: 'Cancer', color: 'hsl(210, 50%, 60%)' },
  { symbol: '♌', name: 'Leo', color: 'hsl(35, 80%, 55%)' },
  { symbol: '♍', name: 'Virgo', color: 'hsl(90, 35%, 45%)' },
  { symbol: '♎', name: 'Libra', color: 'hsl(330, 50%, 60%)' },
  { symbol: '♏', name: 'Scorpio', color: 'hsl(0, 50%, 40%)' },
  { symbol: '♐', name: 'Sagittarius', color: 'hsl(270, 50%, 55%)' },
  { symbol: '♑', name: 'Capricorn', color: 'hsl(30, 25%, 40%)' },
  { symbol: '♒', name: 'Aquarius', color: 'hsl(195, 70%, 50%)' },
  { symbol: '♓', name: 'Pisces', color: 'hsl(240, 50%, 60%)' },
];

interface Props {
  planets: PlanetPosition[];
  aspects: ComputedAspect[];
  onPlanetClick: (planet: PlanetPosition) => void;
  onAspectClick: (aspect: ComputedAspect) => void;
  onPlanetHover: (name: string | null) => void;
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
  selectedPlanet,
  selectedAspect,
  enabledPlanets,
}: Props) => {
  const size = 600;
  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const signRadius = outerRadius - 35;
  const planetRadius = signRadius - 50;
  const innerRadius = planetRadius - 40;

  // Get ascendant degree for house calculations
  const ascendant = planets.find(p => p.name === 'Ascendant');
  const ascDegree = ascendant?.degree || 0;

  // Convert zodiac degree to screen angle
  // Ascendant at 9 o'clock (180°), signs proceed counter-clockwise
  const degreeToAngle = (degree: number): number => {
    // Offset so ascendant is at 180° (9 o'clock), then counter-clockwise
    return (180 - (degree - ascDegree)) * (Math.PI / 180);
  };

  const planetPositions = useMemo(() => {
    return planets.map(planet => {
      const angle = degreeToAngle(planet.degree);
      const x = center + Math.cos(angle) * planetRadius;
      const y = center + Math.sin(angle) * planetRadius;
      return { planet, x, y, angle };
    });
  }, [planets, ascDegree]);

  // Get position for aspect line endpoints
  const getPlanetPos = (name: string) => {
    return planetPositions.find(p => p.planet.name === name);
  };

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
      style={{ maxWidth: '100%', maxHeight: '100%' }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow-interactive" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Intense glow filter for selected */}
        <filter id="glow-intense" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Planet pulse animation filter */}
        <filter id="glow-pulse" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur">
            <animate 
              attributeName="stdDeviation" 
              values="3;6;3" 
              dur="2s" 
              repeatCount="indefinite" 
            />
          </feGaussianBlur>
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Gradient for outer ring */}
        <linearGradient id="ring-gradient-int" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(255, 50%, 30%)" />
          <stop offset="50%" stopColor="hsl(222, 47%, 15%)" />
          <stop offset="100%" stopColor="hsl(280, 40%, 25%)" />
        </linearGradient>

        {/* Radial gradient for planet glow */}
        <radialGradient id="planet-glow-grad">
          <stop offset="0%" stopColor="hsl(43, 74%, 52%)" stopOpacity="0.6" />
          <stop offset="50%" stopColor="hsl(43, 74%, 52%)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(43, 74%, 52%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background */}
      <circle cx={center} cy={center} r={outerRadius} fill="url(#ring-gradient-int)" opacity="0.4" />

      {/* Outer zodiac ring */}
      <circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill="none"
        stroke="hsl(255, 30%, 35%)"
        strokeWidth="1"
      />
      <circle
        cx={center}
        cy={center}
        r={signRadius}
        fill="none"
        stroke="hsl(255, 30%, 25%)"
        strokeWidth="1"
      />

      {/* Zodiac sign segments */}
      {zodiacSigns.map((sign, i) => {
        const startAngle = degreeToAngle(i * 30);
        const midAngle = degreeToAngle(i * 30 + 15);
        const x = center + Math.cos(midAngle) * (outerRadius - 18);
        const y = center + Math.sin(midAngle) * (outerRadius - 18);
        
        // Divider line
        const lineX1 = center + Math.cos(startAngle) * signRadius;
        const lineY1 = center + Math.sin(startAngle) * signRadius;
        const lineX2 = center + Math.cos(startAngle) * outerRadius;
        const lineY2 = center + Math.sin(startAngle) * outerRadius;

        return (
          <g key={sign.name}>
            <line
              x1={lineX1}
              y1={lineY1}
              x2={lineX2}
              y2={lineY2}
              stroke="hsl(255, 30%, 30%)"
              strokeWidth="0.5"
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={sign.color}
              fontSize="18"
              fontFamily="serif"
              className="cursor-pointer select-none"
            >
              {sign.symbol}
            </text>
          </g>
        );
      })}

      {/* House cusp lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = degreeToAngle(i * 30);
        const x1 = center + Math.cos(angle) * innerRadius;
        const y1 = center + Math.sin(angle) * innerRadius;
        const x2 = center + Math.cos(angle) * signRadius;
        const y2 = center + Math.sin(angle) * signRadius;
        
        return (
          <line
            key={`house-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="hsl(255, 30%, 25%)"
            strokeWidth="0.5"
            strokeDasharray="4,4"
          />
        );
      })}

      {/* Inner circle */}
      <circle
        cx={center}
        cy={center}
        r={innerRadius}
        fill="hsl(222, 47%, 8%)"
        stroke="hsl(255, 30%, 30%)"
        strokeWidth="1"
      />

      {/* Aspect lines */}
      {aspects.map((aspect, i) => {
        const pos1 = getPlanetPos(aspect.planet1);
        const pos2 = getPlanetPos(aspect.planet2);
        if (!pos1 || !pos2) return null;

        const isSelected = selectedAspect?.planet1 === aspect.planet1 && 
                          selectedAspect?.planet2 === aspect.planet2;

        return (
          <motion.line
            key={`aspect-${i}`}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke={aspect.aspectType.color}
            strokeWidth={isSelected ? 3 : 1.5}
            strokeOpacity={isSelected ? 1 : 0.6}
            strokeDasharray={aspect.aspectType.name === 'Opposition' ? '8,4' : 
                            aspect.aspectType.name === 'Square' ? '4,4' : 'none'}
            className="cursor-pointer"
            onClick={() => onAspectClick(aspect)}
            whileHover={{ strokeWidth: 3, strokeOpacity: 1 }}
            filter={isSelected ? 'url(#glow-interactive)' : undefined}
          />
        );
      })}

      {/* Planet symbols with animations */}
      {planetPositions.map(({ planet, x, y }) => {
        const isSelected = selectedPlanet?.name === planet.name;
        const isAscendant = planet.name === 'Ascendant';
        const baseRadius = isAscendant ? 16 : 20;
        const isEnabled = !enabledPlanets || isAscendant || enabledPlanets.has(planet.name);

        return (
          <g key={planet.name} opacity={isEnabled ? 1 : 0.15}>
            {/* Frequency wave ripples - animated circles emanating from planet */}
            {!isAscendant && (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={baseRadius}
                  fill="none"
                  stroke="hsl(43, 74%, 52%)"
                  strokeWidth="1"
                  opacity="0"
                >
                  <animate
                    attributeName="r"
                    from={baseRadius}
                    to={baseRadius + 25}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.5"
                    to="0"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={x}
                  cy={y}
                  r={baseRadius}
                  fill="none"
                  stroke="hsl(43, 74%, 52%)"
                  strokeWidth="1"
                  opacity="0"
                >
                  <animate
                    attributeName="r"
                    from={baseRadius}
                    to={baseRadius + 25}
                    dur="3s"
                    begin="1s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.4"
                    to="0"
                    dur="3s"
                    begin="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}

            {/* Outer glow aura */}
            <circle
              cx={x}
              cy={y}
              r={baseRadius + 8}
              fill="url(#planet-glow-grad)"
              opacity={isSelected ? 0.8 : 0.3}
              filter="url(#glow-pulse)"
            />

            {/* Main planet circle */}
            <motion.circle
              cx={x}
              cy={y}
              r={baseRadius}
              fill={isSelected ? 'hsl(43, 74%, 52%)' : 'hsl(222, 47%, 12%)'}
              stroke={isSelected ? 'hsl(43, 74%, 60%)' : 'hsl(43, 74%, 52%)'}
              strokeWidth={isSelected ? 2 : 1}
              className="cursor-pointer"
              onClick={() => onPlanetClick(planet)}
              onMouseEnter={() => onPlanetHover(`${planet.name} in ${planet.sign}`)}
              onMouseLeave={() => onPlanetHover(null)}
              whileHover={{ scale: 1.2, fill: 'hsl(43, 74%, 25%)' }}
              whileTap={{ scale: 0.95 }}
              filter={isSelected ? 'url(#glow-intense)' : undefined}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isSelected ? 'hsl(222, 47%, 6%)' : 'hsl(43, 74%, 52%)'}
              fontSize={isAscendant ? '10' : '14'}
              fontWeight="400"
              className="pointer-events-none select-none"
            >
              {planet.symbol}
            </text>
            {planet.isRetrograde && (
              <text
                x={x + 12}
                y={y - 12}
                fill="hsl(0, 70%, 60%)"
                fontSize="8"
                className="pointer-events-none"
              >
                ℞
              </text>
            )}
          </g>
        );
      })}

      {/* Center point with pulse */}
      <circle
        cx={center}
        cy={center}
        r={4}
        fill="hsl(43, 74%, 52%)"
        opacity="0.8"
      >
        <animate
          attributeName="r"
          values="3;5;3"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;1;0.6"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};
