import { motion } from 'framer-motion';
import type { SynastryResult } from '@/types/synastry';
import { getAllSynastryAspectSentences, ELEMENT_BLEND_MUSIC } from '@/utils/synastryPlacementSentences';

interface SynastricHarmonicReportProps {
  result: SynastryResult;
  personAName: string;
  personBName: string;
}

const QualityBadge = ({ quality }: { quality: string }) => {
  const colors: Record<string, string> = {
    fusion: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    harmony: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    tension: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    dissonance: 'bg-red-500/20 text-red-300 border-red-500/30',
    neutral: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border ${colors[quality] || colors.neutral}`}>
      {quality}
    </span>
  );
};

export const SynastricHarmonicReport = ({ result, personAName, personBName }: SynastricHarmonicReportProps) => {
  const { harmony, score_params, synastry_aspects } = result;
  const sentences = getAllSynastryAspectSentences(synastry_aspects, 8);
  const elementBlendDesc = ELEMENT_BLEND_MUSIC[harmony.element_blend] || ELEMENT_BLEND_MUSIC['neutral'];

  return (
    <motion.div
      className="space-y-8 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* ─── Compatibility Overview ─── */}
      <section className="space-y-4">
        <h3 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Harmonic Compatibility</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
            <div className="text-3xl font-light text-accent">{harmony.harmonic_compatibility}%</div>
            <div className="text-xs text-foreground/50 mt-1">Harmonic Flow</div>
          </div>
          <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
            <div className="text-3xl font-light text-orange-400">{harmony.synastric_tension_index}%</div>
            <div className="text-xs text-foreground/50 mt-1">Synastric Tension</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded bg-foreground/5">
            <div className="text-lg font-light text-purple-400">{harmony.fusion_count}</div>
            <div className="text-[10px] uppercase tracking-wider text-foreground/40">Fusions</div>
          </div>
          <div className="p-3 rounded bg-foreground/5">
            <div className="text-lg font-light text-emerald-400">{harmony.harmony_count}</div>
            <div className="text-[10px] uppercase tracking-wider text-foreground/40">Harmonies</div>
          </div>
          <div className="p-3 rounded bg-foreground/5">
            <div className="text-lg font-light text-orange-400">{harmony.tension_count}</div>
            <div className="text-[10px] uppercase tracking-wider text-foreground/40">Tensions</div>
          </div>
        </div>
      </section>

      {/* ─── Element Blend ─── */}
      <section className="space-y-3">
        <h3 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Element Blend</h3>
        <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground/70">{personAName}</span>
            <span className="text-accent">{harmony.dominant_element_a}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/70">{personBName}</span>
            <span className="text-accent">{harmony.dominant_element_b}</span>
          </div>
          <div className="pt-2 border-t border-foreground/10 text-xs text-foreground/50 italic">
            {elementBlendDesc}
          </div>
        </div>
      </section>

      {/* ─── Musical Parameters ─── */}
      <section className="space-y-3">
        <h3 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Musical Signature</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded bg-foreground/5 space-y-1">
            <div className="text-xs text-foreground/40">Key Relationship</div>
            <div className="text-sm text-foreground/80">{score_params.key_relationship.replace(/_/g, ' ')}</div>
          </div>
          <div className="p-3 rounded bg-foreground/5 space-y-1">
            <div className="text-xs text-foreground/40">Tempo</div>
            <div className="text-sm text-foreground/80">{score_params.blended_tempo} BPM</div>
          </div>
          <div className="p-3 rounded bg-foreground/5 space-y-1">
            <div className="text-xs text-foreground/40">Counterpoint</div>
            <div className="text-sm text-foreground/80">{score_params.counterpoint_style}</div>
          </div>
          <div className="p-3 rounded bg-foreground/5 space-y-1">
            <div className="text-xs text-foreground/40">Rhythm</div>
            <div className="text-sm text-foreground/80">{score_params.rhythmic_interaction.replace(/_/g, ' ')}</div>
          </div>
        </div>
        <div className="p-3 rounded bg-foreground/5 space-y-1">
          <div className="text-xs text-foreground/40">Voices</div>
          <div className="text-sm text-foreground/80">
            {personAName}: {score_params.root_a} {score_params.mode_a} · {personBName}: {score_params.root_b} {score_params.mode_b}
          </div>
        </div>
      </section>

      {/* ─── Aspect Interpretations ─── */}
      <section className="space-y-3">
        <h3 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Inter-chart Aspects</h3>
        <div className="space-y-4">
          {sentences.map((s, i) => (
            <motion.div
              key={`${s.planet_a}-${s.planet_b}-${s.aspect}`}
              className="p-4 rounded-lg bg-foreground/5 border border-foreground/10 space-y-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground/80">
                  {s.planet_a} ↔ {s.planet_b}
                </span>
                <QualityBadge quality={s.quality} />
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed">{s.sentence}</p>
              <p className="text-xs text-accent/70 italic">{s.musicalNote}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};
