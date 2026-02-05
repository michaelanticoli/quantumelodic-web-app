import { motion } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';

const Learn = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <title>Learn Quantumelodics - Mini Course</title>
      <meta name="description" content="Explore the Quantum Vibrations mini-course - harmonizing astrology, music, and the resonant mind." />

      <CosmicBackground />

      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          className="px-6 pt-6 pb-4 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            className="text-muted-foreground hover:text-foreground transition-colors text-sm tracking-wide"
            onClick={() => navigate('/')}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            ‹ Back
          </motion.button>
          <h1 className="font-display text-lg text-gold-gradient tracking-wide">
            Quantum Vibrations
          </h1>
          <div className="w-12" /> {/* Spacer for centering */}
        </motion.header>

        {/* Full-screen iframe container */}
        <motion.div
          className="flex-1 px-4 pb-28"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass rounded-2xl border border-border/20 h-full overflow-hidden">
            <iframe
              id="mcg"
              name="mcg_frame"
              title="Quantum Vibrations Mini-Course"
              src="https://share.minicoursegenerator.com/quantum-vibrations-harmonizing-astrology-music-and-the-resonant-mind-b04888"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="w-full h-full min-h-[70vh] border-0"
            />
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Learn;
