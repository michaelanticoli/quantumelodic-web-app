import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const loadingMessages = [
  "Calculating planetary positions...",
  "Analyzing aspect patterns...",
  "Mapping harmonics to musical modes...",
  "Extracting soul frequency...",
  "Composing your cosmic symphony...",
  "Tuning celestial instruments...",
];

interface GeneratingStateProps {
  onComplete?: () => void;
}

export const GeneratingState = ({ onComplete }: GeneratingStateProps) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          onComplete?.();
          return 100;
        }
        return prev + 1;
      });
    }, 80);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [onComplete]);

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
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-2xl">🎵</span>
          </motion.div>
        </div>
      </div>

      {/* Loading text */}
      <motion.h2
        className="font-display text-2xl font-semibold text-foreground mb-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Generating
      </motion.h2>

      <motion.p
        key={messageIndex}
        className="text-muted-foreground text-center mb-6 h-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {loadingMessages[messageIndex]}
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
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">{progress}%</p>
      </div>
    </motion.div>
  );
};
