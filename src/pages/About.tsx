import { motion } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <title>What is Quantumelodics? - The Cosmic Symphony</title>
      <meta name="description" content="Discover the Quantumelodic System - a fusion of astrology, music, and science that translates your birth chart into a unique musical composition." />

      <CosmicBackground />

      <main className="relative z-10 min-h-screen px-6 pt-12 pb-32">
        {/* Back button */}
        <motion.button
          className="fixed top-6 left-6 text-muted-foreground hover:text-foreground transition-colors text-sm tracking-wide z-20"
          onClick={() => navigate('/')}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ‹ Back
        </motion.button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.header
            className="text-center mb-16"
            {...fadeInUp}
            transition={{ delay: 0.1 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-light tracking-wide mb-4">
              <span className="text-gold-gradient">What is</span>{' '}
              <span className="text-foreground/90">Quantumelodics?</span>
            </h1>
            <p className="text-muted-foreground text-sm tracking-widest uppercase">
              Hearing the Music of the Stars
            </p>
          </motion.header>

          {/* Core Vision Section */}
          <motion.section
            className="glass rounded-2xl p-8 mb-8 border border-border/20"
            {...fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display text-xl text-primary mb-4 tracking-wide">
              The Core Vision
            </h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              A fusion of astrology, music, and science. The system translates the hidden symphony of the cosmos into an audible, 
              livable reality by mapping celestial mechanics to musical structures.
            </p>
            <blockquote className="border-l-2 border-primary/40 pl-4 italic text-muted-foreground text-sm">
              "You are not separate from the stars. You are their music."
            </blockquote>
          </motion.section>

          {/* The Cosmic Blueprint */}
          <motion.section
            className="glass rounded-2xl p-8 mb-8 border border-border/20"
            {...fadeInUp}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-display text-xl text-primary mb-6 tracking-wide">
              The Cosmic Blueprint
            </h2>
            <div className="flex items-center justify-center mb-6">
              <div className="w-32 h-32 rounded-full border border-primary/30 flex items-center justify-center relative">
                <div className="absolute inset-2 rounded-full border border-accent/20" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Your Birth Chart</p>
                  <p className="text-primary text-lg">☉ ☽ ♃</p>
                </div>
              </div>
            </div>
            <p className="text-foreground/80 leading-relaxed text-center">
              Your natal chart is a unique vibrational matrix—a "harmonic code" that can be translated 
              into a unique <span className="text-primary">Quantumelodic Scale</span> or soul song.
            </p>
          </motion.section>

          {/* The Harmonic Engine */}
          <motion.section
            className="mb-8"
            {...fadeInUp}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-display text-xl text-primary mb-6 tracking-wide text-center">
              The Harmonic Engine: Translating Cosmos into Sound
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="glass rounded-xl p-6 border border-border/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">1</span>
                  <h3 className="text-foreground font-medium">Planets → Root Tones</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Each celestial body is assigned a base frequency and primary musical instruments to represent its core archetypal energy.
                </p>
                <div className="mt-4 text-xs text-primary/70 space-y-1">
                  <p>☉ Sun = 218 Hz (C) — Grand Piano, Trumpet</p>
                  <p>☽ Moon = Aeolian — Harp, Cello, Synth Pads</p>
                  <p>♀ Venus = Lydian — Violin, Harp, Rhodes</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="glass rounded-xl p-6 border border-border/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">2</span>
                  <h3 className="text-foreground font-medium">Aspects → Intervals</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The angular relationships between planets are translated into harmonic intervals, creating consonance or dissonance.
                </p>
                <div className="mt-4 text-xs text-primary/70 space-y-1">
                  <p>△ Trine (120°) → Perfect Fifth (Harmony)</p>
                  <p>□ Square (90°) → Tritone (Tension)</p>
                  <p>☍ Opposition (180°) → Minor Second</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="glass rounded-xl p-6 border border-border/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">3</span>
                  <h3 className="text-foreground font-medium">Signs → Modes</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Each of the 12 zodiac signs corresponds to a specific musical mode or scale, defining the overall "mood" or theme.
                </p>
                <div className="mt-4 text-xs text-primary/70 space-y-1">
                  <p>♈ Aries → Phrygian (Fiery, Bold)</p>
                  <p>♉ Taurus → Ionian (Grounded, Stable)</p>
                  <p>♊ Gemini → Mixolydian (Playful, Dual)</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="glass rounded-xl p-6 border border-border/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">4</span>
                  <h3 className="text-foreground font-medium">The Natal Soundscape</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Combining these elements produces a unique sonic fingerprint—a personal musical composition suited to your birth moment.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-primary/70">
                  <span className="text-lg">♪</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <span className="text-lg">♫</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <span className="text-lg">♪</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Applied Practice */}
          <motion.section
            className="glass rounded-2xl p-8 mb-8 border border-border/20"
            {...fadeInUp}
            transition={{ delay: 0.5 }}
          >
            <h2 className="font-display text-xl text-primary mb-6 tracking-wide">
              Applied Practice: Rituals & Transformation
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-foreground mb-2 flex items-center gap-2">
                  <span className="text-accent">◇</span> Transmutation Rituals
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Use the dissonant sound of a "square" or "opposition" aspect to alchemize fear, blockages, or pain into power.
                </p>
              </div>
              <div>
                <h3 className="text-foreground mb-2 flex items-center gap-2">
                  <span className="text-accent">◇</span> Invocation Rituals
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Use the harmonious sound of a "trine" or "conjunction" to attune to archetypal energies like creativity or love.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Grounded in Theory */}
          <motion.section
            className="glass rounded-2xl p-8 mb-8 border border-border/20"
            {...fadeInUp}
            transition={{ delay: 0.6 }}
          >
            <h2 className="font-display text-xl text-primary mb-4 tracking-wide">
              Grounded in Multi-Disciplinary Theory
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              The metasystem integrates concepts from quantum physics, systems theory, cybernetics, and network dynamics to create its foundational framework.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Quantum Physics', 'Systems Theory', 'Cybernetics', 'Network Dynamics', 'Harmonic Science'].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full border border-primary/20 text-xs text-primary/80">
                  {tag}
                </span>
              ))}
            </div>
          </motion.section>

          {/* Satellite Resources */}
          <motion.section
            className="glass rounded-2xl p-8 mb-8 border border-border/20"
            {...fadeInUp}
            transition={{ delay: 0.7 }}
          >
            <h2 className="font-display text-xl text-primary mb-4 tracking-wide">
              Explore Further
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <a
                href="https://agent-69760f0deef6ca7076f--quantumelodic-volumes.netlify.app/#stats"
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-xl p-5 border border-border/20 hover:border-accent/40 transition-all duration-300 group"
              >
                <h3 className="text-foreground font-medium mb-2 flex items-center gap-2">
                  <span className="text-accent">📊</span> Quantumelodic Volumes
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Dive into the research archive — stats, harmonic data, and volume explorations.
                </p>
                <span className="text-xs text-primary/70 mt-3 block group-hover:text-primary transition-colors">
                  Open Archive →
                </span>
              </a>
              <div
                className="glass rounded-xl p-5 border border-primary/20 bg-primary/5 cursor-pointer"
                onClick={() => navigate('/learn')}
              >
                <h3 className="text-foreground font-medium mb-2 flex items-center gap-2">
                  <span className="text-primary">🎓</span> Quantum Vibrations Course
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Interactive mini-course harmonizing astrology, music, and the resonant mind.
                </p>
                <span className="text-xs text-primary/70 mt-3 block">
                  Start Learning →
                </span>
              </div>
            </div>
          </motion.section>

          {/* Academy Promo */}
          <motion.section
            className="glass rounded-2xl p-8 mb-8 border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 relative overflow-hidden"
            {...fadeInUp}
            transition={{ delay: 0.75 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <span className="text-lg">👑</span>
                </div>
                <div>
                  <h2 className="font-display text-xl text-primary tracking-wide">
                    Academy of Astro-Musicology
                  </h2>
                  <p className="text-xs text-muted-foreground">Premium · $19.99/mo</p>
                </div>
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed mb-4">
                Immersive courses on planetary harmonics, zodiacal modes, and cosmic composition. 
                Deepen your practice with the full Astro-Musicology curriculum.
              </p>
              <motion.button
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground text-xs tracking-widest uppercase font-medium shadow-lg shadow-primary/20"
                onClick={() => navigate('/academy')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore Academy →
              </motion.button>
            </div>
          </motion.section>

          {/* Mini Course Section */}
          <motion.section
            className="glass rounded-2xl p-8 mb-8 border border-border/20"
            {...fadeInUp}
            transition={{ delay: 0.8 }}
          >
            <h2 className="font-display text-xl text-primary mb-4 tracking-wide">
              Dive Deeper: Mini Course
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Explore the foundations of Quantum Vibrations—harmonizing astrology, music, and the resonant mind.
            </p>
            <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingTop: '100%' }}>
              <iframe
                id="mcg-about"
                name="mcg_frame_about"
                title="Quantum Vibrations Mini-Course"
                src="https://share.minicoursegenerator.com/quantum-vibrations-harmonizing-astrology-music-and-the-resonant-mind-b04888"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
            <div className="mt-4 text-center">
              <motion.button
                className="text-primary/80 hover:text-primary text-sm tracking-wide underline underline-offset-4"
                onClick={() => navigate('/learn')}
                whileHover={{ scale: 1.02 }}
              >
                Open Full Screen →
              </motion.button>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            className="text-center"
            {...fadeInUp}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className="px-10 py-4 rounded-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground text-sm tracking-widest uppercase shadow-lg shadow-primary/30"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Experience Your Cosmic Symphony
            </motion.button>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default About;
