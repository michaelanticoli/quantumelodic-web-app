import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ZodiacWheel } from '@/components/ZodiacWheel';
import { BirthDataForm } from '@/components/BirthDataForm';
import { BottomNav } from '@/components/BottomNav';
import { GeneratingState } from '@/components/GeneratingState';

type AppState = 'input' | 'generating' | 'result';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('input');
  const [birthData, setBirthData] = useState<{
    name: string;
    date: string;
    time: string;
    location: string;
  } | null>(null);

  const handleFormSubmit = (data: typeof birthData) => {
    setBirthData(data);
    setAppState('generating');
  };

  const handleGenerationComplete = () => {
    setAppState('result');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* SEO */}
      <title>QuantumMelodies - Your Cosmic Symphony Awaits</title>
      <meta name="description" content="Transform your birth chart into a unique musical composition. Discover your cosmic symphony through advanced astrological and harmonic principles." />

      {/* Cosmic Background */}
      <CosmicBackground />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {appState === 'input' && (
          <motion.main
            key="input"
            className="relative z-10 min-h-screen flex flex-col items-center px-6 pt-12 pb-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Logo / Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                <span className="text-gold-gradient">Quantum</span>
                <span className="text-foreground">Melodic</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Find yourself in the frequency
              </p>
            </motion.div>

            {/* Zodiac Wheel */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            >
              <ZodiacWheel />
            </motion.div>

            {/* Birth Data Form */}
            <BirthDataForm onSubmit={handleFormSubmit} />
          </motion.main>
        )}

        {appState === 'generating' && (
          <GeneratingState
            key="generating"
            onComplete={handleGenerationComplete}
          />
        )}

        {appState === 'result' && (
          <motion.main
            key="result"
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pb-32"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ResultsView name={birthData?.name || 'Cosmic Traveler'} />
          </motion.main>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

// Simple Results View Component
const ResultsView = ({ name }: { name: string }) => {
  return (
    <div className="text-center max-w-md mx-auto">
      {/* Album art placeholder */}
      <motion.div
        className="w-64 h-64 mx-auto mb-8 rounded-2xl overflow-hidden relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-primary/20 to-highlight/30 rounded-2xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-48 h-48 rounded-full border-4 border-primary/40"
            style={{
              background: 'radial-gradient(circle, hsla(291, 64%, 55%, 0.4) 0%, hsla(43, 74%, 52%, 0.2) 50%, transparent 70%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-background/80" />
            </div>
          </motion.div>
        </div>

        {/* Floating music notes */}
        {['♪', '♫', '♩'].map((note, i) => (
          <motion.span
            key={i}
            className="absolute text-3xl text-primary/60"
            style={{
              left: `${20 + i * 30}%`,
              top: '20%',
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            {note}
          </motion.span>
        ))}
      </motion.div>

      {/* Track info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Stardust Sonata
        </h2>
        <p className="text-muted-foreground mb-1">
          Cosmic Symphony for {name}
        </p>
        <p className="text-sm text-primary">
          Leo Sun • Virgo Moon • D Dorian
        </p>
      </motion.div>

      {/* Audio controls */}
      <motion.div
        className="mt-8 flex items-center justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Progress bar */}
        <div className="flex-1 max-w-[200px]">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '35%' }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0:53</span>
            <span>-2:05</span>
          </div>
        </div>
      </motion.div>

      {/* Playback controls */}
      <motion.div
        className="mt-6 flex items-center justify-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <motion.button
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </motion.button>

        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </motion.div>

      {/* Share button */}
      <motion.button
        className="mt-8 px-8 py-3 rounded-full bg-highlight text-highlight-foreground font-medium hover:bg-highlight/90 transition-colors"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Share
      </motion.button>
    </div>
  );
};

export default Index;
