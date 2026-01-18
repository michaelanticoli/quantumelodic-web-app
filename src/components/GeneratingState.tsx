import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

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
  ],
};

interface GeneratingStateProps {
  onComplete?: () => void;
  stage?: 'geocoding' | 'calculating' | 'generating';
  progress?: number;
}

export const GeneratingState = ({ onComplete, stage = 'calculating', progress: externalProgress }: GeneratingStateProps) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const progress = externalProgress ?? internalProgress;
  const messages = stageMessages[stage] || stageMessages.calculating;

  useEffect(() => {
    // Only use internal progress if no external progress is provided
    if (externalProgress === undefined) {
      const progressInterval = setInterval(() => {
        setInternalProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            onComplete?.();
            return 100;
          }
          return prev + 1;
        });
      }, 80);

      return () => clearInterval(progressInterval);
    }
  }, [onComplete, externalProgress]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, [messages.length]);

  // Trigger onComplete when external progress reaches 100
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
      {/* Animated cosmic visualization */}
      <div className="relative w-64 h-64 mb-8">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-4 rounded-full border border-accent/40"
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner ring */}
        <motion.div
          className="absolute inset-8 rounded-full border border-highlight/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Central glow */}
        <motion.div
          className="absolute inset-16 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsla(291, 64%, 55%, 0.6) 0%, hsla(43, 74%, 52%, 0.3) 50%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Music notes floating */}
        {['♪', '♫', '♩', '♬'].map((note, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl text-primary/60"
            style={{
              left: `${50 + 35 * Math.cos((i * Math.PI) / 2)}%`,
              top: `${50 + 35 * Math.sin((i * Math.PI) / 2)}%`,
            }}
            animate={{
              y: [-5, 5, -5],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          >
            {note}
          </motion.span>
        ))}

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
            style={{ boxShadow: '0 0 40px hsla(43, 74%, 52%, 0.4)' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-2xl text-primary-foreground font-light">♫</span>
          </motion.div>
        </div>
      </div>

      {/* Loading text */}
      <motion.h2
        className="font-display text-2xl font-semibold text-foreground mb-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {stage === 'geocoding' && 'Locating'}
        {stage === 'calculating' && 'Calculating'}
        {stage === 'generating' && 'Generating'}
      </motion.h2>

      <motion.p
        key={`${stage}-${messageIndex}`}
        className="text-muted-foreground text-center mb-6 h-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {messages[messageIndex]}
      </motion.p>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(186, 95%, 48%), hsl(291, 64%, 55%), hsl(43, 74%, 52%))',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">{Math.round(progress)}%</p>
      </div>
    </motion.div>
  );
};
