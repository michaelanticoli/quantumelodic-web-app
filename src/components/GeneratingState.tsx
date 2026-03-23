import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const ZODIAC_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

const PLANETS: { glyph: string; radius: number; duration: number; size: number; delay: number }[] = [
  { glyph: '☉', radius: 72,  duration: 8,  size: 14, delay: 0 },
  { glyph: '☽', radius: 100, duration: 13, size: 12, delay: -3 },
  { glyph: '♂', radius: 128, duration: 20, size: 11, delay: -7 },
  { glyph: '♀', radius: 156, duration: 28, size: 11, delay: -12 },
];

const stageMessages: Record<string, string[]> = {
  geocoding: [
    "Locating your birthplace in the cosmos...",
    "Mapping celestial coordinates...",
    "Anchoring your position on Earth...",
  ],
  calculating: [
    "Calculating planetary positions...",
    "Analyzing your aspect patterns...",
    "Mapping harmonics to musical modes...",
    "Decoding your celestial blueprint...",
    "Identifying dominant energies...",
  ],
  generating: [
    "Extracting your soul frequency...",
    "Composing your cosmic symphony...",
    "Tuning celestial instruments...",
    "Weaving stellar harmonies...",
    "Layering planetary overtones...",
    "Rendering your unique sound signature...",
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

  const GLYPH_FONT = "'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',serif";

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen gap-0 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      {/* ── Orbital Orrery ── */}
      <div className="relative flex items-center justify-center" style={{ width: 340, height: 340 }}>

        {/* Orbital rings */}
        {PLANETS.map((p, i) => (
          <svg key={`ring-${i}`} className="absolute inset-0" width={340} height={340} style={{ pointerEvents: 'none' }}>
            <circle
              cx={170} cy={170} r={p.radius}
              fill="none"
              stroke="hsl(43 88% 58% / 0.1)"
              strokeWidth={0.75}
              strokeDasharray="2 8"
            />
          </svg>
        ))}

        {/* Outer zodiac glyph ring */}
        <svg className="absolute inset-0 animate-[spin_80s_linear_infinite]" width={340} height={340}>
          {ZODIAC_GLYPHS.map((g, i) => {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const r = 158;
            const x = 170 + r * Math.cos(angle);
            const y = 170 + r * Math.sin(angle);
            return (
              <text key={g} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                fontSize="10" fill="hsl(43 88% 58% / 0.32)" fontFamily={GLYPH_FONT}>
                {g}
              </text>
            );
          })}
        </svg>

        {/* Orbiting planets */}
        {PLANETS.map((p, i) => (
          <motion.div
            key={`planet-${i}`}
            className="absolute"
            style={{ width: 340, height: 340, top: 0, left: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: p.duration, ease: 'linear', repeat: Infinity, delay: p.delay }}
          >
            <div
              className="absolute flex items-center justify-center"
              style={{ top: 170 - p.radius - p.size / 2, left: 170 - p.size / 2, width: p.size, height: p.size }}
            >
              <div
                className="rounded-full"
                style={{
                  width: 6, height: 6,
                  background: 'hsl(43 88% 62%)',
                  boxShadow: '0 0 10px 3px hsl(43 88% 58% / 0.6)',
                }}
              />
              <motion.span
                className="absolute text-[9px] select-none"
                style={{ color: 'hsl(43 88% 65% / 0.75)', top: 8, left: '50%', translateX: '-50%', fontFamily: GLYPH_FONT }}
                animate={{ rotate: -360 }}
                transition={{ duration: p.duration, ease: 'linear', repeat: Infinity, delay: p.delay }}
              >
                {p.glyph}
              </motion.span>
            </div>
          </motion.div>
        ))}

        {/* Inner pulsing rings */}
        {[36, 52].map((r, i) => (
          <motion.div
            key={`inner-${r}`}
            className="absolute rounded-full border"
            style={{ width: r * 2, height: r * 2, borderColor: `hsl(43 88% 58% / ${0.22 - i * 0.08})` }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3 + i, ease: 'easeInOut', repeat: Infinity, delay: i * 0.8 }}
          />
        ))}

        {/* Accent ring — violet */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 90, height: 90, border: '1px solid hsl(292 70% 62% / 0.1)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity, delay: 1.5 }}
        />

        {/* Central node */}
        <motion.div
          className="relative flex items-center justify-center rounded-full z-10"
          style={{
            width: 58, height: 58,
            background: 'radial-gradient(circle, hsl(228 35% 10% / 0.92) 60%, transparent 100%)',
            border: '1px solid hsl(43 88% 58% / 0.5)',
            boxShadow: '0 0 28px 6px hsl(43 88% 58% / 0.18), inset 0 0 14px hsl(43 88% 58% / 0.08)',
          }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
        >
          <span className="text-2xl select-none" style={{ color: 'hsl(43 88% 65%)', fontFamily: 'serif', lineHeight: 1 }}>✦</span>
        </motion.div>

        {/* Stardust particles */}
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * 360;
          const dist = 55 + (i % 4) * 18;
          const x = 170 + dist * Math.cos((angle * Math.PI) / 180);
          const y = 170 + dist * Math.sin((angle * Math.PI) / 180);
          return (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
                left: x, top: y,
                background: i % 4 === 0 ? 'hsl(292 70% 72%)' : i % 4 === 1 ? 'hsl(180 90% 70%)' : 'hsl(43 88% 75%)',
              }}
              animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.4, 0.5] }}
              transition={{ duration: 2.2 + i * 0.28, ease: 'easeInOut', repeat: Infinity, delay: i * 0.22 }}
            />
          );
        })}
      </div>

      {/* ── Stage message ── */}
      <div className="h-10 flex items-center justify-center mt-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={`${stage}-${messageIndex}`}
            className="text-center text-xs tracking-[0.15em] uppercase font-display font-medium"
            style={{ color: 'hsl(43 88% 58% / 0.65)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5 }}
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── Progress bar ── */}
      <div className="mt-8 w-52 flex flex-col gap-2">
        <div className="h-px rounded-full overflow-hidden" style={{ background: 'hsl(43 88% 58% / 0.1)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(43 88% 58%), hsl(292 70% 62%))' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progress)}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="tabular-nums font-display font-medium" style={{ color: 'hsl(43 88% 58% / 0.5)', fontSize: '10px' }}>
            {Math.round(progress)}%
          </span>
          <span className="uppercase tracking-widest" style={{ color: 'hsl(43 88% 58% / 0.3)', fontSize: '9px' }}>
            {stage}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
