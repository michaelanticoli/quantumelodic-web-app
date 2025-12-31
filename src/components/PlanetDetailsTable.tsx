import { motion } from 'framer-motion';
import type { PlanetPosition } from '@/types/astrology';

interface PlanetDetailsTableProps {
  planets: PlanetPosition[];
}

// Get sign symbol from sign name
const signSymbols: Record<string, string> = {
  'Aries': '♈',
  'Taurus': '♉',
  'Gemini': '♊',
  'Cancer': '♋',
  'Leo': '♌',
  'Virgo': '♍',
  'Libra': '♎',
  'Scorpio': '♏',
  'Sagittarius': '♐',
  'Capricorn': '♑',
  'Aquarius': '♒',
  'Pisces': '♓',
};

// Format degree as degrees within sign (0-29°)
const formatDegree = (degree: number): string => {
  const degreeInSign = degree % 30;
  const deg = Math.floor(degreeInSign);
  const min = Math.floor((degreeInSign - deg) * 60);
  return `${deg}°${min.toString().padStart(2, '0')}'`;
};

// Calculate which house a planet is in (equal house system)
const getHouse = (planetDegree: number, ascendantDegree: number): number => {
  // Houses go clockwise from ASC
  let diff = planetDegree - ascendantDegree;
  if (diff < 0) diff += 360;
  // Invert because houses go clockwise (opposite to zodiac)
  diff = 360 - diff;
  if (diff === 360) diff = 0;
  return Math.floor(diff / 30) + 1;
};

export const PlanetDetailsTable = ({ planets }: PlanetDetailsTableProps) => {
  const ascendant = planets.find(p => p.name === 'Ascendant');
  const ascDegree = ascendant?.degree || 0;

  // Filter out Ascendant from the list (it's displayed separately)
  const displayPlanets = planets.filter(p => p.name !== 'Ascendant');

  return (
    <motion.div
      className="w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
        Planetary Positions
      </h3>
      
      <div className="bg-background/30 backdrop-blur-sm rounded-lg border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="px-3 py-2 text-left text-muted-foreground font-medium">Planet</th>
              <th className="px-3 py-2 text-center text-muted-foreground font-medium">Sign</th>
              <th className="px-3 py-2 text-right text-muted-foreground font-medium">Degree</th>
              <th className="px-3 py-2 text-right text-muted-foreground font-medium">House</th>
            </tr>
          </thead>
          <tbody>
            {displayPlanets.map((planet, idx) => (
              <motion.tr
                key={planet.name}
                className="border-b border-border/20 last:border-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
              >
                <td className="px-3 py-2 flex items-center gap-2">
                  <span 
                    className="text-lg"
                    style={{ color: planet.isRetrograde ? 'hsl(0, 70%, 60%)' : 'hsl(43, 74%, 70%)' }}
                  >
                    {planet.symbol}
                  </span>
                  <span className="text-foreground">
                    {planet.name}
                    {planet.isRetrograde && (
                      <span className="text-destructive text-xs ml-1">℞</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="text-lg mr-1">{signSymbols[planet.sign]}</span>
                  <span className="text-muted-foreground text-xs">{planet.sign}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-foreground">
                  {formatDegree(planet.degree)}
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {getHouse(planet.degree, ascDegree)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ascendant display */}
      {ascendant && (
        <div className="mt-3 text-center text-sm">
          <span className="text-muted-foreground">Ascendant: </span>
          <span className="text-lg mr-1">{signSymbols[ascendant.sign]}</span>
          <span className="text-primary font-medium">{ascendant.sign}</span>
          <span className="text-muted-foreground ml-2">{formatDegree(ascendant.degree)}</span>
        </div>
      )}
    </motion.div>
  );
};
