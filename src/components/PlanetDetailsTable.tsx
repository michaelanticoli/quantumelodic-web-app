import { motion } from 'framer-motion';
import type { PlanetPosition } from '@/types/astrology';
import { ZodiacSigil, PlanetSigil, toZodiacSign, toPlanetName } from '@/components/sigils';

interface PlanetDetailsTableProps {
  planets: PlanetPosition[];
}

const formatDegree = (degree: number): string => {
  const degreeInSign = degree % 30;
  const deg = Math.floor(degreeInSign);
  const min = Math.floor((degreeInSign - deg) * 60);
  return `${deg}°${min.toString().padStart(2, '0')}'`;
};

const getHouse = (planetDegree: number, ascendantDegree: number): number => {
  const diff = ((planetDegree - ascendantDegree) % 360 + 360) % 360;
  return Math.floor(diff / 30) + 1;
};

export const PlanetDetailsTable = ({ planets }: PlanetDetailsTableProps) => {
  const ascendant = planets.find(p => p.name === 'Ascendant');
  const ascDegree = ascendant?.degree || 0;
  const displayPlanets = planets.filter(p => p.name !== 'Ascendant');

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-baseline justify-between mb-4 px-1">
        <h3 className="font-display text-lg text-foreground">Planetary Positions</h3>
        <span className="label-micro">{displayPlanets.length} bodies</span>
      </div>

      <div className="divide-y divide-border/40">
        {displayPlanets.map((planet, idx) => {
          const planetKey = toPlanetName(planet.name);
          const signKey = toZodiacSign(planet.sign);
          return (
            <motion.div
              key={planet.name}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 * idx, duration: 0.25 }}
            >
              <span className={planet.isRetrograde ? 'text-jewel-ember' : 'text-accent'}>
                {planetKey ? <PlanetSigil planet={planetKey} size={22} /> : <span className="text-lg">{planet.symbol}</span>}
              </span>
              <div className="min-w-0">
                <div className="text-sm text-foreground truncate">
                  {planet.name}
                  {planet.isRetrograde && <span className="text-jewel-ember text-[10px] ml-1.5 align-top">℞</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-foreground/55">
                  {signKey && <ZodiacSigil sign={signKey} size={12} strokeWidth={1.5} />}
                  <span className="text-[11px] tracking-wide">{planet.sign}</span>
                </div>
              </div>
              <span className="font-mono text-xs text-foreground/75 tabular-nums">{formatDegree(planet.degree)}</span>
              <span className="font-mono text-[10px] label-micro w-8 text-right">H{getHouse(planet.degree, ascDegree)}</span>
            </motion.div>
          );
        })}
      </div>

      {ascendant && (() => {
        const ascSign = toZodiacSign(ascendant.sign);
        return (
          <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
            <span className="label-micro">Ascendant</span>
            <div className="flex items-center gap-2">
              {ascSign && <ZodiacSigil sign={ascSign} size={18} className="text-accent" />}
              <span className="text-sm text-foreground">{ascendant.sign}</span>
              <span className="font-mono text-xs text-foreground/55">{formatDegree(ascendant.degree)}</span>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
};
