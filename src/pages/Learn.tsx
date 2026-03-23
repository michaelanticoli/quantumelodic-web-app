import { motion } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, ExternalLink } from 'lucide-react';

const Learn = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <title>Learning Center — Quantumelodic</title>
      <meta name="description" content="Explore the Quantum Vibrations mini-course — harmonizing astrology, music, and the resonant mind." />

      <CosmicBackground />

      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          className="px-5 pt-6 pb-3 flex items-center justify-between"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            className="text-muted-foreground/60 hover:text-foreground transition-colors text-sm tracking-wide flex items-center gap-1.5"
            onClick={() => navigate('/')}
            whileHover={{ x: -2 }}
          >
            <span className="text-lg leading-none">‹</span> Back
          </motion.button>
          <h1 className="font-display font-semibold text-base text-gold-gradient tracking-wide">
            Learning Center
          </h1>
          <div className="w-14" />
        </motion.header>

        {/* Resource pills */}
        <motion.div
          className="px-4 mb-3 grid grid-cols-2 gap-2.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="glass-card p-4 cursor-default"
            style={{ border: '1px solid hsl(var(--primary) / 0.2)', background: 'hsl(var(--primary) / 0.04)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="tag-cosmic text-[9px]">Active</span>
            </div>
            <h3 className="text-sm font-display font-medium text-foreground/90">Mini Course</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Interactive lessons</p>
          </div>

          <a
            href="https://agent-69760f0deef6ca7076f--quantumelodic-volumes.netlify.app/#stats"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card p-4 hover-lift group cursor-pointer block transition-all duration-300"
            style={{ border: '1px solid hsl(var(--border) / 0.5)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <BarChart3 className="w-4 h-4 text-accent" strokeWidth={1.5} />
              <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-opacity" />
            </div>
            <h3 className="text-sm font-display font-medium text-foreground/90">Volumes Archive</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Research & stats</p>
          </a>
        </motion.div>

        {/* Iframe */}
        <motion.div
          className="flex-1 px-4 pb-28"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div
            className="h-full overflow-hidden rounded-2xl"
            style={{
              border: '1px solid hsl(var(--border) / 0.4)',
              background: 'hsl(228 30% 7% / 0.6)',
              backdropFilter: 'blur(16px)',
            }}
          >
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
