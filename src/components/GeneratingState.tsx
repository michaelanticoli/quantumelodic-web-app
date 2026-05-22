import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const stageMessages: Record<string, string[]> = {
  geocoding: [
    'Locating your birthplace',
    'Mapping celestial coordinates',
    'Anchoring your position',
  ],
  calculating: [
    'Calculating planetary positions',
    'Analyzing aspect patterns',
    'Mapping harmonics to modes',
    'Decoding your blueprint',
  ],
  generating: [
    'Extracting your frequency',
    'Composing your symphony',
    'Tuning celestial instruments',
    'Rendering your sound signature',
  ],
};

const stageTargets: Record<string, number> = {
  geocoding: 20,
  calculating: 55,
  generating: 95,
};

interface GeneratingStateProps {
  onComplete?: () => void;
  stage?: 'geocoding' | 'calculating' | 'generating';
  progress?: number;
}

/**
 * Swedish-minimalist loading state.
 * One quiet pulsing dot, one progress line, one rotating message.
 * No orbits, no glyphs, no spectacle.
 */
export const GeneratingState = ({
  onComplete,
  stage = 'calculating',
  progress: externalProgress,
}: GeneratingStateProps) => {
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const progress = externalProgress ?? smoothProgress;
  const messages = stageMessages[stage] ?? stageMessages.calculating;

  useEffect(() => {
    if (externalProgress !== undefined) {
      const interval = setInterval(() => {
        setSmoothProgress(prev => {
          const diff = externalProgress - prev;
          if (Math.abs(diff) < 0.5) return externalProgress;
          return prev + diff * 0.08;
        });
      }, 50);
      return () => clearInterval(interval);
    } else {
      const target = stageTargets[stage] ?? 95;
      const interval = setInterval(() => {
        setSmoothProgress(prev => {
          if (prev >= 100) { onComplete?.(); return 100; }
          const remaining = target - prev;
          return Math.min(prev + Math.max(0.1, remaining * 0.02), 100);
        });
      }, 60);
      return () => clearInterval(interval);
    }
  }, [stage, externalProgress, onComplete]);

  useEffect(() => {
    setMessageIndex(0);
    const id = setInterval(() => setMessageIndex(p => (p + 1) % messages.length), 2800);
    return () => clearInterval(id);
  }, [stage, messages.length]);

  useEffect(() => {
    if (externalProgress !== undefined && externalProgress >= 100) onComplete?.();
  }, [externalProgress, onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen gap-12 relative z-10 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5 }}
    >
      {/* Single breathing dot */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: 16, height: 16 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
      >
        <div
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            background: 'hsl(var(--accent))',
            boxShadow: '0 0 24px hsl(var(--accent) / 0.6)',
          }}
        />
      </motion.div>

      {/* Rotating message */}
      <div className="h-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={`${stage}-${messageIndex}`}
            className="text-center text-[11px] tracking-[0.25em] uppercase text-foreground/60"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4 }}
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress line */}
      <div className="w-64 flex flex-col gap-3">
        <div className="h-px overflow-hidden bg-foreground/10">
          <motion.div
            className="h-full"
            style={{ background: 'hsl(var(--accent))' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progress)}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between items-center font-mono text-[10px] text-foreground/40">
          <span className="tabular-nums">{Math.round(progress).toString().padStart(2, '0')}</span>
          <span className="uppercase tracking-[0.2em]">{stage}</span>
        </div>
      </div>
    </motion.div>
  );
};
