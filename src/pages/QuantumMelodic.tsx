import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, ShieldCheck, Music2, FileText, Sparkles, Star } from 'lucide-react';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useNavigate } from 'react-router-dom';

// Update this number manually as Founding Readings are claimed
const FOUNDING_CLAIMED = 3;
const FOUNDING_TOTAL = 50;

// Replace with your live Stripe payment link
const CHECKOUT_URL = 'https://buy.stripe.com/YOUR_LINK_HERE';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
});

const RefundGuarantee = () => (
  <motion.div
    className="flex items-start gap-3 mt-4 px-4 py-3 rounded-xl border border-accent/15 bg-accent/5"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
  >
    <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
    <p className="text-[11px] text-muted-foreground leading-relaxed">
      If the composition doesn't feel like yours, email me within 7 days. I'll refund you in full — and you keep the report.
      This work is meant to resonate. If it doesn't, you owe me nothing.
    </p>
  </motion.div>
);

const CtaButton = ({ delay = 0 }: { delay?: number }) => (
  <div>
    <motion.a
      href={CHECKOUT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-center py-4 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base tracking-wide hover:opacity-90 transition-opacity"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      Order your Astro-Harmonic Report — $47
    </motion.a>
    <RefundGuarantee />
  </div>
);

const AudioSample = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el || audioError) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {
        setAudioError(true);
        setIsPlaying(false);
      }
    }
  };

  return (
    <motion.div
      className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-5"
      {...fadeUp(0.15)}
    >
      <div className="flex items-center gap-2 mb-3">
        <Music2 className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Sample composition
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Every chart sounds different. Below is an excerpt from a real Astro-Harmonic reading — same system,
        different birth data, different music.
      </p>

      {/* Replace /sample-composition.mp3 with your actual audio file in /public */}
      <audio
        ref={audioRef}
        src="/sample-composition.mp3"
        onEnded={() => setIsPlaying(false)}
        onError={() => { setAudioError(true); setIsPlaying(false); }}
        preload="none"
      />

      {audioError ? (
        <p className="text-xs text-muted-foreground/50 italic px-1">
          Audio sample not yet available.
        </p>
      ) : (
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border/50 hover:border-accent/40 transition-all group"
        >
          <span className="w-8 h-8 rounded-full border border-accent/40 flex items-center justify-center group-hover:border-accent transition-colors">
            {isPlaying
              ? <Pause className="w-3.5 h-3.5 text-accent" />
              : <Play className="w-3.5 h-3.5 text-accent ml-0.5" />}
          </span>
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {isPlaying ? 'Pause sample' : 'Play sample (2 min excerpt)'}
          </span>
        </button>
      )}
    </motion.div>
  );
};

const ReportPreviewSection = () => {
  const items = [
    { icon: Star, label: 'Planetary Orchestra', desc: 'Every planet voiced to its instrument and frequency — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.' },
    { icon: Music2, label: 'Your Musical Key & Mode', desc: 'Your Sun sign determines the tonic. Your chart shape determines the mode. No two people share the same harmonic signature.' },
    { icon: Sparkles, label: 'Aspect Intervals', desc: 'Every major aspect in your chart is translated into its musical interval — conjunctions, trines, squares, all rendered as frequency relationships.' },
    { icon: FileText, label: 'Narrated PDF Report', desc: 'A full written + narrated breakdown of every placement, read aloud in my cloned voice. Delivered as a downloadable PDF.' },
  ];

  return (
    <motion.section className="space-y-4" {...fadeUp(0.1)}>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-primary/70" />
        <h2 className="font-display text-lg font-semibold">What's in your report</h2>
      </div>

      <div className="space-y-3">
        {items.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="font-display font-medium text-sm">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-5">{desc}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

const QuantumMelodic = () => {
  const navigate = useNavigate();
  const claimedPct = Math.round((FOUNDING_CLAIMED / FOUNDING_TOTAL) * 100);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <title>Astro-Harmonic Report — Your Birth Chart, Composed</title>
      <meta
        name="description"
        content="Your birth chart, composed into a piece of music only you will ever have. The Astro-Harmonic Report — $47 Founding Reading."
      />

      <CosmicBackground />

      <main className="relative z-10 min-h-screen px-5 pt-10 pb-24">
        {/* Back */}
        <motion.button
          className="fixed top-5 left-5 z-50 text-muted-foreground/60 hover:text-foreground transition-colors text-sm tracking-wide flex items-center gap-1.5"
          onClick={() => navigate('/')}
          whileHover={{ x: -2 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-lg leading-none">‹</span> Back
        </motion.button>

        <div className="max-w-2xl mx-auto">

          {/* ── Hero ── */}
          <motion.header className="text-center mb-12 pt-8" {...fadeUp(0.05)}>
            <p className="text-[10px] tracking-[0.4em] text-muted-foreground/50 uppercase mb-5">
              Astro · Harmonic · Natal
            </p>
            <h1 className="font-display font-light leading-[0.92] tracking-[-0.03em] text-foreground mb-6">
              <span className="block text-[44px] md:text-[64px]">Your birth chart,</span>
              <span className="block text-[44px] md:text-[64px] italic text-accent">
                composed into a piece of music
              </span>
              <span className="block text-[44px] md:text-[64px]">only you will ever have.</span>
            </h1>
            <div className="divider-gold max-w-[120px] mx-auto mb-5" />
            <p className="font-sans text-foreground/60 text-base md:text-lg max-w-md mx-auto leading-relaxed">
              Every planet voiced. Every aspect rendered as frequency. A PDF report — narrated in my voice —
              built from your exact placements and nothing else.
            </p>
          </motion.header>

          {/* ── Founding Reading Block ── */}
          <motion.section
            className="glass-card p-6 mb-8 space-y-4"
            {...fadeUp(0.1)}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h2 className="font-display text-base font-semibold tracking-wide">Founding Readings</h2>
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed">
              The first 50 Astro-Harmonic Reports are{' '}
              <span className="text-foreground font-semibold">$47</span>.
              After the fiftieth, the price becomes{' '}
              <span className="text-muted-foreground line-through">$97</span>.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You receive the same full reading either way. Founding pricing exists for the people willing to be early —
              the ones who help prove the work resonates.
            </p>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                <span>{FOUNDING_CLAIMED} of {FOUNDING_TOTAL} claimed</span>
                <span>{FOUNDING_TOTAL - FOUNDING_CLAIMED} remaining</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${claimedPct}%` }}
                  transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.section>

          {/* ── First CTA ── */}
          <motion.div className="mb-12" {...fadeUp(0.15)}>
            <CtaButton delay={0.15} />
          </motion.div>

          {/* ── Audio Sample ── */}
          <div className="mb-12">
            <AudioSample />
          </div>

          {/* ── Credibility Paragraph ── */}
          <motion.section
            className="glass-card p-6 mb-12"
            {...fadeUp(0.1)}
          >
            <h2 className="font-display text-base font-semibold tracking-wide mb-3">About this work</h2>
            <p className="text-sm text-foreground/75 leading-relaxed">
              I'm Michael — composer, astrologer, and the person who built every piece of this system. The
              Astro-Harmonic Report is years of work in music theory and chart interpretation, synthesized:
              every aspect translated to its musical interval, every planet given a voice and an instrument,
              every element rendered as frequency. The narration is read in my voice — cloned, so I can deliver
              thousands of readings without losing the human imprint. The composition is generated from your
              exact placements, never a template. What you receive is made by one person who believes your
              birth carried a sound worth hearing.
            </p>
          </motion.section>

          {/* ── Sample Report Preview ── */}
          <div className="mb-12">
            <ReportPreviewSection />
          </div>

          {/* ── Second CTA ── */}
          <motion.div className="mb-8" {...fadeUp(0.1)}>
            <CtaButton delay={0.1} />
          </motion.div>

          {/* ── Footer note ── */}
          <motion.p
            className="text-center text-[10px] text-muted-foreground/35 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Delivered as a PDF within 24 hours · One-time purchase · No subscription
          </motion.p>

        </div>
      </main>
    </div>
  );
};

export default QuantumMelodic;
