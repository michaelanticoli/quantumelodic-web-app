import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AudioReactiveGradient } from './AudioReactiveGradient';
import './LoadingAnimation.css';

const stageMessages: Record<string, string[]> = {
  geocoding: [
    "Locating your birthplace coordinates...",
    "Mapping celestial alignments...",
  ],
  calculating: [
    "Calculating planetary positions...",
    "Analyzing aspect patterns...",
    "Mapping harmonics to musical modes...",
  ],
  generating: [
    "Extracting soul frequency...",
    "Composing your cosmic symphony...",
    "Tuning celestial instruments...",
    "Weaving stellar harmonies...",
    "Layering planetary overtones...",
  ],
};

const stageLabels: Record<string, string> = {
  geocoding: 'Locating',
  calculating: 'Calculating',
  generating: 'Generating',
};

// Smooth simulated progress that slows down near stage boundaries
const stageTargets: Record<string, number> = {
  geocoding: 20,
  calculating: 50,
  generating: 95,
};

interface GeneratingStateProps {
  onComplete?: () => void;
  stage?: 'geocoding' | 'calculating' | 'generating';
  progress?: number;
}

export const GeneratingState = ({ onComplete, stage = 'calculating', progress: externalProgress }: GeneratingStateProps) => {
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const progress = externalProgress ?? smoothProgress;
  const messages = stageMessages[stage] || stageMessages.calculating;
  const label = stageLabels[stage] || 'Loading';

  // Smooth simulated progress that eases toward stage target
  useEffect(() => {
    if (externalProgress !== undefined) {
      // When external progress is provided, smoothly interpolate toward it
      const interval = setInterval(() => {
        setSmoothProgress(prev => {
          const diff = externalProgress - prev;
          if (Math.abs(diff) < 0.5) return externalProgress;
          // Ease toward target — fast at first, slow near target
          return prev + diff * 0.08;
        });
      }, 50);
      return () => clearInterval(interval);
    } else {
      // Fallback: auto-increment
      const target = stageTargets[stage] || 95;
      const interval = setInterval(() => {
        setSmoothProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            onComplete?.();
            return 100;
          }
          // Slow down as we approach target
          const remaining = target - prev;
          const increment = Math.max(0.1, remaining * 0.02);
          return Math.min(prev + increment, 100);
        });
      }, 60);
      return () => clearInterval(interval);
    }
  }, [stage, externalProgress, onComplete]);

  // Rotate stage messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(messageInterval);
  }, [messages.length]);

  // Completion check
  useEffect(() => {
    if (externalProgress !== undefined && externalProgress >= 100) {
      onComplete?.();
    }
  }, [externalProgress, onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient gradient visualizer */}
      <div className="w-full max-w-sm h-32 rounded-2xl overflow-hidden mb-8 shadow-lg shadow-primary/10">
        <AudioReactiveGradient
          idleIntensity={0.4 + (progress / 100) * 0.5}
          borderRadius={0}
        />
      </div>

      {/* Letter-by-letter animated loader */}
      <div className="loader-wrapper">
        {label.split('').map((char, i) => (
          <span key={`${label}-${i}`} className="loader-letter">
            {char}
          </span>
        ))}
        <div className="loader" />
      </div>

      {/* Stage message */}
      <motion.p
        key={`${stage}-${messageIndex}`}
        className="text-muted-foreground text-center mb-6 h-6 text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {messages[messageIndex]}
      </motion.p>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #ff0, #f00, #0ff, #0f0, #00f)',
              backgroundSize: '200% 100%',
            }}
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.round(progress)}%`,
              backgroundPosition: ['0% 0%', '100% 0%'],
            }}
            transition={{ 
              width: { duration: 0.6, ease: 'easeOut' },
              backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
            }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground/60 mt-2 tabular-nums">
          {Math.round(progress)}%
        </p>
      </div>
    </motion.div>
  );
};
