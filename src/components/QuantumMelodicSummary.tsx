import { motion } from 'framer-motion';
import type { QuantumMelodicReading } from '@/types/quantumMelodic';

interface Props {
  reading: QuantumMelodicReading;
}

export const QuantumMelodicSummary = ({ reading }: Props) => {
  const { dominantElement, dominantModality, overallKey, overallTempo, aspects, planets } = reading;

  // Count aspect types
  const aspectCounts = aspects.reduce((acc, a) => {
    acc[a.aspectType.name] = (acc[a.aspectType.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get element emoji/symbol
  const elementSymbols: Record<string, string> = {
    Fire: '△',
    Earth: '▽',
    Air: '◇',
    Water: '○',
  };

  // Get retrograde planets
  const retrogradePlanets = planets.filter(p => p.position.isRetrograde);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Primary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-light text-foreground">
            {elementSymbols[dominantElement] || '◈'}
          </p>
          <p className="text-sm text-foreground mt-1">{dominantElement}</p>
          <p className="text-xs text-muted-foreground">Element</p>
        </div>
        
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xl font-light text-foreground">{dominantModality}</p>
          <p className="text-xs text-muted-foreground mt-2">Modality</p>
        </div>
        
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xl font-light text-foreground">{overallKey}</p>
          <p className="text-xs text-muted-foreground mt-2">Key</p>
        </div>
        
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-light text-foreground">{overallTempo}</p>
          <p className="text-xs text-muted-foreground mt-1">BPM</p>
        </div>
      </div>

      {/* Aspect Summary */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Aspect Patterns
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(aspectCounts).map(([name, count]) => {
            const aspectData = aspects.find(a => a.aspectType.name === name)?.aspectType;
            return (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: `${aspectData?.color}20`,
                  color: aspectData?.color,
                }}
              >
                <span>{aspectData?.symbol}</span>
                <span>{count}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Retrograde Alert */}
      {retrogradePlanets.length > 0 && (
        <div className="glass rounded-xl p-4 border-l-2 border-destructive/50">
          <h3 className="text-xs uppercase tracking-widest text-destructive/80 mb-2">
            Retrograde Planets
          </h3>
          <div className="flex flex-wrap gap-2">
            {retrogradePlanets.map(p => (
              <span
                key={p.position.name}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm"
              >
                {p.position.symbol} {p.position.name} ℞
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Retrograde energy inverts the typical harmonic expression, creating introspective and reviewing themes
          </p>
        </div>
      )}
    </motion.div>
  );
};
