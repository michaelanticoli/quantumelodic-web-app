import { useState } from 'react';
import { motion } from 'framer-motion';
import { BirthDataForm } from '@/components/BirthDataForm';
import { SynastricHarmonicReport } from '@/components/reports/SynastricHarmonicReport';
import { BottomNav } from '@/components/BottomNav';
import type { SynastryResult, RelationshipType } from '@/types/synastry';

const API_BASE = import.meta.env.VITE_API_URL || '';

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; icon: string }[] = [
  { value: 'romantic', label: 'Romantic / Marriage', icon: '♡' },
  { value: 'friendship', label: 'Friendship', icon: '☆' },
  { value: 'professional', label: 'Professional', icon: '◈' },
  { value: 'parent_child', label: 'Parent–Child', icon: '◐' },
];

export default function SynastricSymphony() {
  const [personAData, setPersonAData] = useState<{ name: string; date: string; time: string; location: string } | null>(null);
  const [personBData, setPersonBData] = useState<{ name: string; date: string; time: string; location: string } | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('romantic');
  const [result, setResult] = useState<SynastryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'person_a' | 'person_b' | 'results'>('person_a');

  const handlePersonASubmit = (data: { name: string; date: string; time: string; location: string }) => {
    setPersonAData(data);
    setStep('person_b');
  };

  const handlePersonBSubmit = async (data: { name: string; date: string; time: string; location: string }) => {
    setPersonBData(data);
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/synastry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_a: { ...personAData },
          person_b: { ...data },
          relationship_type: relationshipType,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const synastryResult: SynastryResult = await response.json();
      setResult(synastryResult);
      setStep('results');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate synastry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPersonAData(null);
    setPersonBData(null);
    setResult(null);
    setError('');
    setStep('person_a');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-24 max-w-lg mx-auto w-full">
        {/* ─── Header ─── */}
        <motion.div
          className="text-center mb-10 space-y-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-light tracking-wide">Synastric Symphony</h1>
          <p className="text-sm text-foreground/50 max-w-xs mx-auto">
            Two charts blended into a unified musical portrait of the relationship
          </p>
        </motion.div>

        {/* ─── Step Indicator ─── */}
        {step !== 'results' && (
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${step === 'person_a' ? 'border-accent text-accent' : 'border-foreground/20 text-foreground/40'}`}>
              A
            </div>
            <div className="w-6 h-px bg-foreground/20" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${step === 'person_b' ? 'border-accent text-accent' : 'border-foreground/20 text-foreground/40'}`}>
              B
            </div>
          </div>
        )}

        {/* ─── Person A Form ─── */}
        {step === 'person_a' && (
          <motion.div
            className="w-full space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-4">
              <div className="text-xs uppercase tracking-[0.2em] text-foreground/40 mb-1">Person A</div>
              <p className="text-sm text-foreground/60">Enter the first person's birth data</p>
            </div>
            <BirthDataForm onSubmit={handlePersonASubmit} />
          </motion.div>
        )}

        {/* ─── Person B Form ─── */}
        {step === 'person_b' && (
          <motion.div
            className="w-full space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-4">
              <div className="text-xs uppercase tracking-[0.2em] text-foreground/40 mb-1">Person B</div>
              <p className="text-sm text-foreground/60">
                Now enter {personAData?.name ? `${personAData.name}'s` : 'the'} counterpart
              </p>
            </div>

            {/* Relationship type selector */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.15em] text-foreground/40">Relationship Type</label>
              <div className="grid grid-cols-2 gap-2">
                {RELATIONSHIP_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRelationshipType(opt.value)}
                    className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                      relationshipType === opt.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-foreground/10 text-foreground/60 hover:border-foreground/30'
                    }`}
                  >
                    <span className="text-base mr-2">{opt.icon}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <BirthDataForm onSubmit={handlePersonBSubmit} isLoading={isLoading} />

            <button
              onClick={() => setStep('person_a')}
              className="w-full text-center text-xs text-foreground/40 hover:text-foreground/60 transition-colors py-2"
            >
              ← Back to Person A
            </button>
          </motion.div>
        )}

        {/* ─── Error ─── */}
        {error && (
          <motion.div
            className="w-full p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {/* ─── Results ─── */}
        {step === 'results' && result && (
          <motion.div
            className="w-full space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Title card */}
            <div className="text-center p-6 rounded-xl bg-foreground/5 border border-foreground/10">
              <div className="text-xs uppercase tracking-[0.2em] text-foreground/40 mb-2">
                {RELATIONSHIP_OPTIONS.find(o => o.value === relationshipType)?.icon}{' '}
                {RELATIONSHIP_OPTIONS.find(o => o.value === relationshipType)?.label}
              </div>
              <h2 className="text-xl font-light">
                {personAData?.name || 'Person A'} & {personBData?.name || 'Person B'}
              </h2>
              <p className="text-xs text-foreground/40 mt-2">
                Key: {result.score_params.root_a} {result.score_params.mode_a} ↔ {result.score_params.root_b} {result.score_params.mode_b} · {result.score_params.blended_tempo} BPM
              </p>
            </div>

            {/* Report */}
            <SynastricHarmonicReport
              result={result}
              personAName={personAData?.name || 'Person A'}
              personBName={personBData?.name || 'Person B'}
            />

            {/* Reset button */}
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-full border border-foreground/20 text-sm text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-200"
            >
              Generate Another Symphony
            </button>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
