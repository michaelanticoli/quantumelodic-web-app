import { motion } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
});

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <title>What is Quantumelodics? — The Cosmic Symphony</title>
      <meta name="description" content="Discover the Quantumelodic System — a fusion of astrology, music, and science that translates your birth chart into a unique musical composition." />

      <CosmicBackground />

      <main className="relative z-10 min-h-screen px-5 pt-10 pb-32">
        {/* Back */}
        <motion.button
          className="fixed top-5 left-5 z-50 text-muted-foreground/60 hover:text-foreground transition-colors text-sm tracking-wide flex items-center gap-1.5"
          onClick={() => navigate('/')}
          whileHover={{ x: -2 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <span className="text-lg leading-none">‹</span> Back
        </motion.button>

        <div className="max-w-3xl mx-auto">
          {/* ── Hero ── */}
          <motion.header className="text-center mb-14 pt-6" {...fadeUp(0.1)}>
            <p className="text-[10px] tracking-[0.4em] text-muted-foreground/50 uppercase mb-5">
              The System
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight mb-4 leading-tight">
              <span className="text-gold-gradient">What is</span>{' '}
              <span className="text-foreground/90">Quantumelodics?</span>
            </h1>
            <div className="divider-gold max-w-xs mx-auto mb-5" />
            <p className="font-serif italic text-muted-foreground text-base md:text-lg tracking-wide max-w-md mx-auto leading-relaxed">
              Hearing the Music of the Stars
            </p>
          </motion.header>

          {/* ── Core Vision ── */}
          <motion.section className="glass-card p-7 mb-5" {...fadeUp(0.15)}>
            <h2 className="font-display text-lg font-semibold text-primary tracking-wide mb-3">
              The Core Vision
            </h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              A fusion of astrology, music, and science. The system translates the hidden symphony of the cosmos into an audible,
              livable reality by mapping celestial mechanics to musical structures.
            </p>
            <blockquote
              className="pl-4 italic text-muted-foreground/70 text-sm leading-relaxed"
              style={{ borderLeft: '2px solid hsl(43 88% 58% / 0.4)' }}
            >
              "You are not separate from the stars. You are their music."
            </blockquote>
          </motion.section>

          {/* ── Harmonic Engine ── */}
          <motion.section className="mb-6" {...fadeUp(0.2)}>
            <h2 className="font-display text-xl font-semibold text-center mb-6">
              <span className="text-aurora-gradient">The Harmonic Engine</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  num: '01',
                  title: 'Planets → Root Tones',
                  body: 'Each celestial body is assigned a base frequency and primary instruments to represent its core archetypal energy.',
                  examples: ['☉ Sun · 218 Hz (C) · Piano, Trumpet', '☽ Moon · Aeolian · Harp, Cello', '♀ Venus · Lydian · Violin, Rhodes'],
                  color: 'primary',
                },
                {
                  num: '02',
                  title: 'Aspects → Intervals',
                  body: 'Angular relationships between planets become harmonic intervals — consonance or productive dissonance.',
                  examples: ['△ Trine 120° → Perfect Fifth', '□ Square 90° → Tritone (Tension)', '☍ Opposition → Minor Second'],
                  color: 'accent',
                },
                {
                  num: '03',
                  title: 'Signs → Modes',
                  body: 'Each of the 12 zodiac signs corresponds to a specific musical mode, defining the tonal mood.',
                  examples: ['♈ Aries → Phrygian (Fiery, Bold)', '♉ Taurus → Ionian (Grounded)', '♊ Gemini → Mixolydian (Playful)'],
                  color: 'highlight',
                },
                {
                  num: '04',
                  title: 'The Natal Soundscape',
                  body: 'Combined, these produce a unique sonic fingerprint — a personal composition tuned to your birth moment.',
                  examples: [],
                  color: 'primary',
                  isSpecial: true,
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="glass-card p-5 hover-lift"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className="font-display text-3xl font-bold leading-none opacity-20"
                      style={{ color: step.color === 'accent' ? 'hsl(var(--accent))' : step.color === 'highlight' ? 'hsl(var(--highlight))' : 'hsl(var(--primary))' }}
                    >
                      {step.num}
                    </span>
                    <h3 className="font-display font-semibold text-foreground/90 text-base leading-tight pt-1">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3">{step.body}</p>
                  {step.examples.length > 0 && (
                    <div className="space-y-1">
                      {step.examples.map((ex) => (
                        <p
                          key={ex}
                          className="text-[11px] tracking-wide"
                          style={{ color: step.color === 'accent' ? 'hsl(var(--accent) / 0.7)' : step.color === 'highlight' ? 'hsl(var(--highlight) / 0.7)' : 'hsl(var(--primary) / 0.7)' }}
                        >
                          {ex}
                        </p>
                      ))}
                    </div>
                  )}
                  {step.isSpecial && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-primary/40">
                      <span className="text-lg">♪</span>
                      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)' }} />
                      <span className="text-lg">♫</span>
                      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)' }} />
                      <span className="text-lg">♪</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── Applied Practice ── */}
          <motion.section className="glass-card p-7 mb-5" {...fadeUp(0.25)}>
            <h2 className="font-display text-lg font-semibold text-primary tracking-wide mb-5">
              Applied Practice
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { label: 'Transmutation Rituals', body: 'Use the dissonant sound of a "square" or "opposition" to alchemize blockages into power.' },
                { label: 'Invocation Rituals', body: 'Use the harmonious sound of a "trine" or "conjunction" to attune to archetypal energies.' },
              ].map(({ label, body }) => (
                <div key={label}>
                  <h3 className="text-foreground/90 mb-2 flex items-center gap-2 text-sm font-medium">
                    <span style={{ color: 'hsl(var(--accent))' }}>◇</span> {label}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── Grounded in Theory ── */}
          <motion.section className="glass-card p-7 mb-5" {...fadeUp(0.3)}>
            <h2 className="font-display text-lg font-semibold text-primary tracking-wide mb-3">
              Grounded in Multi-Disciplinary Theory
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              The metasystem integrates quantum physics, systems theory, cybernetics, and network dynamics into a unified cosmological framework.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Quantum Physics', 'Systems Theory', 'Cybernetics', 'Network Dynamics', 'Harmonic Science', 'Astro-Musicology'].map((tag) => (
                <span key={tag} className="tag-cosmic">{tag}</span>
              ))}
            </div>
          </motion.section>

          {/* ── Resources ── */}
          <motion.section className="mb-5" {...fadeUp(0.35)}>
            <h2 className="font-display text-lg font-semibold mb-4">
              <span className="text-gold-gradient">Explore Further</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              <a
                href="https://agent-69760f0deef6ca7076f--quantumelodic-volumes.netlify.app/#stats"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-5 hover-lift group cursor-pointer block"
                style={{ border: '1px solid hsl(var(--border) / 0.5)' }}
              >
                <h3 className="text-foreground/90 font-medium mb-1 text-sm flex items-center gap-2">
                  <span>📊</span> Quantumelodic Volumes
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-2">Research archive — stats, harmonic data, and volume explorations.</p>
                <span className="text-[10px] text-primary/60 tracking-widest uppercase group-hover:text-primary transition-colors">Open Archive →</span>
              </a>
              <div
                className="glass-card p-5 hover-lift cursor-pointer"
                style={{ border: '1px solid hsl(var(--primary) / 0.2)', background: 'hsl(var(--primary) / 0.04)' }}
                onClick={() => navigate('/learn')}
              >
                <h3 className="text-foreground/90 font-medium mb-1 text-sm flex items-center gap-2">
                  <span>🎓</span> Quantum Vibrations Course
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-2">Interactive mini-course harmonizing astrology, music, and the resonant mind.</p>
                <span className="text-[10px] text-primary/60 tracking-widest uppercase">Start Learning →</span>
              </div>
            </div>
          </motion.section>

          {/* ── Academy CTA ── */}
          <motion.section
            className="glass-card p-7 mb-8 relative overflow-hidden"
            style={{ border: '1px solid hsl(var(--primary) / 0.25)', background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--accent) / 0.04))' }}
            {...fadeUp(0.4)}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: 'hsl(var(--primary) / 0.3)' }} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base"
                  style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                  👑
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-primary">Academy of Astro-Musicology</h2>
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Premium · $19.99/mo</p>
                </div>
              </div>
              <p className="text-foreground/75 text-sm leading-relaxed mb-4">
                Immersive courses on planetary harmonics, zodiacal modes, and cosmic composition. 
                Deepen your practice with the full Astro-Musicology curriculum.
              </p>
              <motion.button
                className="btn-primary text-xs uppercase tracking-widest"
                onClick={() => navigate('/academy')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore Academy →
              </motion.button>
            </div>
          </motion.section>

          {/* ── Final CTA ── */}
          <motion.div className="text-center" {...fadeUp(0.45)}>
            <motion.button
              className="btn-primary text-sm uppercase tracking-widest"
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
