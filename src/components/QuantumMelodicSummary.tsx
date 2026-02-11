import { motion } from 'framer-motion';
import type { QuantumMelodicReading } from '@/types/quantumMelodic';
import { calculateHarmonicAnalysis, getResolutionGuidance, elementInfo } from '@/utils/harmonicWisdom';
import { Music } from 'lucide-react';

interface Props {
  reading: QuantumMelodicReading;
  onAspectPatternClick?: (aspectName: string) => void;
}

export const QuantumMelodicSummary = ({ reading, onAspectPatternClick }: Props) => {
  const { dominantElement, dominantModality, overallKey, overallTempo, aspects, planets } = reading;

  // Calculate harmonic analysis
  const harmonicAnalysis = calculateHarmonicAnalysis(aspects, planets);
  const resolutionGuidance = getResolutionGuidance(harmonicAnalysis);

  // Count aspect types
  const aspectCounts = aspects.reduce((acc, a) => {
    acc[a.aspectType.name] = (acc[a.aspectType.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get element symbol
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
      {/* Harmonic Analysis Panel - NEW */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-xs uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
          <span className="text-lg">♪</span> Harmonic Analysis
        </h3>
        
        {/* Scores */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-2xl font-light text-green-400">{harmonicAnalysis.consonance.toFixed(0)}%</p>
            <p className="text-xs text-green-400/70 mt-1">Consonance</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Harmony Level</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-2xl font-light text-amber-400">{harmonicAnalysis.tension.toFixed(0)}%</p>
            <p className="text-xs text-amber-400/70 mt-1">Tension</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Growth Pressure</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-2xl font-light text-accent">{harmonicAnalysis.complexity.toFixed(0)}%</p>
            <p className="text-xs text-accent/70 mt-1">Complexity</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Richness</p>
          </div>
        </div>

        {/* Element Breakdown */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Dominant Frequencies</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(harmonicAnalysis.elements)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([element, count]) => {
                const info = elementInfo[element];
                const colors: Record<string, string> = {
                  Fire: 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-300 border-orange-500/30',
                  Earth: 'bg-gradient-to-r from-green-600/20 to-emerald-500/20 text-emerald-300 border-emerald-500/30',
                  Air: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30',
                  Water: 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30',
                };
                return (
                  <span
                    key={element}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border ${colors[element]}`}
                  >
                    {info?.symbol || elementSymbols[element]} {element}: {count}
                  </span>
                );
              })}
          </div>
        </div>

        {/* Resolution Guidance */}
        {resolutionGuidance.length > 0 && (
          <div className="p-4 rounded-lg bg-muted/20 border-l-2 border-primary/50">
            <p className="text-xs uppercase tracking-wide text-primary/80 mb-2">Resolution Pathways</p>
            <div className="space-y-2">
              {resolutionGuidance.map((guidance, i) => (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed">
                  {guidance}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

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
              <button
                key={name}
                onClick={() => onAspectPatternClick?.(name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all hover:scale-105 hover:shadow-lg cursor-pointer border"
                style={{
                  backgroundColor: `${aspectData?.color}20`,
                  color: aspectData?.color,
                  borderColor: `${aspectData?.color}40`,
                }}
              >
                <span>{aspectData?.symbol}</span>
                <span>{count}</span>
                <Music className="w-3 h-3 opacity-60" />
              </button>
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
