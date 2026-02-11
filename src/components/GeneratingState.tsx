import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
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
  ],
};

const stageLabels: Record<string, string> = {
  geocoding: 'Locating',
  calculating: 'Calculating',
  generating: 'Generating',
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
  const label = stageLabels[stage] || 'Loading';

  useEffect(() => {
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
      {/* Letter-by-letter animated loader */}
      <div className="loader-wrapper">
        {label.split('').map((char, i) => (
          <span key={i} className="loader-letter">
            {char}
          </span>
        ))}
        <div className="loader" />
      </div>

      {/* Stage message */}
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
