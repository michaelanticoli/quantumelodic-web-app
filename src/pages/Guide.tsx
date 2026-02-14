import { motion } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const chapters = [
  { id: 'foreword', label: 'Foreword' },
  { id: 'ch1', label: 'I · Foundations' },
  { id: 'ch2', label: 'II · Five Realms' },
  { id: 'ch3', label: 'III · Journeys' },
  { id: 'ch4', label: 'IV · Tuning' },
  { id: 'ch5', label: 'V · Movement' },
  { id: 'epilogue', label: 'Epilogue' },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' as const },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const Guide = () => {
  const navigate = useNavigate();
  const [activeChapter, setActiveChapter] = useState<string | null>(null);

  const scrollTo = (id: string) => {
    setActiveChapter(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen relative">
      <title>Guide — Quantumelodic System</title>
      <meta name="description" content="The Cosmic User's Guide to the Quantumelodic System. A harmonic interface for navigating the multiverse." />

      <CosmicBackground />

      <main className="relative z-10">
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
            Guide
          </h1>
          <div className="w-12" />
        </motion.header>

        {/* Hero */}
        <motion.section
          className="px-6 pt-16 pb-24 max-w-2xl mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
        >
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 mb-8">
            Cosmic User's Guide
          </p>
          <h2 className="font-sans font-extralight text-3xl sm:text-4xl md:text-5xl leading-[1.15] tracking-tight text-foreground mb-6">
            The Quantumelodic<br />System
          </h2>
          <p className="font-sans font-extralight text-sm text-muted-foreground/70 tracking-wide max-w-sm mx-auto leading-relaxed">
            A harmonic interface for navigating the multiverse
          </p>
        </motion.section>

        {/* Chapter Nav */}
        <motion.div
          className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="max-w-3xl mx-auto px-6 py-3 flex gap-1 overflow-x-auto scrollbar-hide">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => scrollTo(ch.id)}
                className={cn(
                  "text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-300",
                  activeChapter === ch.id
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-6 pb-32">

          {/* FOREWORD */}
          <Section id="foreword">
            <SectionLabel>Foreword</SectionLabel>
            <SectionTitle>You Are a Resonance Point</SectionTitle>
            <P>
              Before you are a body, before you are a name, you are a frequency woven into the fabric of the field. The Quantumelodic System begins here — not with belief, but with vibration.
            </P>
            <P>
              This is not metaphor. It is physics. It is mysticism. And it is music.
            </P>
            <P>
              Every cell in your body oscillates. Every planet in the sky emits electromagnetic signatures. The ancient sages called it the Music of the Spheres. Modern science calls it waveform coherence. We call it the Quantumelodic Field.
            </P>
            <Callout>You live in it. You are it.</Callout>
          </Section>

          {/* CHAPTER I */}
          <Section id="ch1">
            <SectionLabel>Chapter I</SectionLabel>
            <SectionTitle>Foundations of the Harmonic Universe</SectionTitle>
            <Keywords>Vibration · Frequency · Field · Symbol · Scale</Keywords>

            <H3>What Is the Quantumelodic System?</H3>
            <P>
              The Quantumelodic System is an integrative cosmology — a unified theory of vibration that merges:
            </P>
            <BulletList items={[
              'Astrology as harmonic structure (the "cosmic staff")',
              'Music theory as symbolic language (the "score of the soul")',
              'Quantum field dynamics as metaphysical physics (the "source engine")',
              'Sacred geometry and mathematics as architecture (the "temple of ratio")',
              'Electronic tools and frequency maps as interfaces (the "instruments")',
            ]} />
            <P>
              It is both a map and a method, both initiation and application. It does not tell you what to believe. It invites you to listen deeper — to your chart, your sound, your field.
            </P>
            <Callout>The universe is not made of things. It is made of frequencies.</Callout>

            <H3>The Principle of Resonance</H3>
            <P>
              "Resonance" is the golden thread that runs through all disciplines:
            </P>
            <BulletList items={[
              "In physics: amplification of a wave when matched in frequency.",
              "In music: the way strings, chords, and overtones vibrate together.",
              "In consciousness: the mystical pull you feel when something rings true.",
            ]} />
            <P>
              The planets resonate with you because you are part of their wavefield. When Mars squares your Sun, it's vibrational interference. When Venus trines your Moon, it's harmonic reinforcement.
            </P>

            <H3>The Cosmic Octave</H3>
            <P>
              Johannes Kepler once wrote: "The movements of the heavens are nothing but a continuous music… inaudible but eternal."
            </P>
            <DataTable
              headers={['Planet', 'Orbital Period', 'Frequency', 'Note']}
              rows={[
                ['Moon', '27.32 days', '~210.42 Hz', 'G♯'],
                ['Earth', '365.25 days', '~194.18 Hz', 'G'],
                ['Venus', '224.7 days', '~221.23 Hz', 'A'],
                ['Mars', '687 days', '~144.72 Hz', 'D'],
                ['Jupiter', '11.86 years', '~183.58 Hz', 'F♯'],
              ]}
            />
            <P>
              Using octave reduction — halving the frequency until it's within the human audible range — we bring planetary vibrations into music. Every transit is a chord. Every chart is a composition. Every soul is a song.
            </P>

            <H3>The Quantumelodic Premise</H3>
            <NumberedList items={[
              'Vibration is the root of all form.',
              'The universe is structured like music: intervals, rhythms, harmonics.',
              'Astrological aspects are musical intervals in time and space.',
              'Quantum phenomena mirror harmonic relationships.',
              'You can tune yourself through awareness of these relationships.',
            ]} />
          </Section>

          {/* CHAPTER II */}
          <Section id="ch2">
            <SectionLabel>Chapter II</SectionLabel>
            <SectionTitle>The Five Harmonic Realms</SectionTitle>

            <H3>II.1 — Astro-Musicology</H3>
            <Callout>The chart is a score. The soul is the instrument. The planets are the ensemble.</Callout>
            <P>
              Astro-Musicology is the art and science of interpreting astrological phenomena as musical structures — the harmonic bridge between celestial mechanics and tonal mathematics.
            </P>
            <P>In the Quantumelodic System, we translate:</P>
            <BulletList items={[
              'Aspects into intervals',
              'Planets into modes',
              'Signs into tonal centers',
              'Houses into octaves of context',
            ]} />

            <H4>Aspect–Interval Map</H4>
            <DataTable
              headers={['Aspect', 'Degrees', 'Type', 'Interval', 'Tone']}
              rows={[
                ['Conjunction', '0°', 'Amplified unison', 'Unison (1:1)', 'Unity'],
                ['Sextile', '60°', 'Soft harmony', 'Major 6th (5:3)', 'Invitation'],
                ['Square', '90°', 'Tension', 'Tritone (√2:1)', 'Friction'],
                ['Trine', '120°', 'Resonant ease', 'Perfect 5th (3:2)', 'Flow'],
                ['Opposition', '180°', 'Polarity', 'Octave (2:1)', 'Mirror'],
              ]}
            />

            <H4>Planetary Modes</H4>
            <DataTable
              headers={['Planet', 'Energy', 'Mode', 'Emotional Tone']}
              rows={[
                ['Sun', 'Will, Identity', 'Ionian (Major)', 'Radiant, Centered'],
                ['Moon', 'Emotion, Memory', 'Aeolian (Minor)', 'Fluid, Reflective'],
                ['Mercury', 'Thought, Language', 'Dorian', 'Curious, Syncopated'],
                ['Venus', 'Love, Aesthetics', 'Lydian', 'Blissful, Floating'],
                ['Mars', 'Drive, Conflict', 'Phrygian', 'Aggressive, Hot'],
                ['Jupiter', 'Expansion, Belief', 'Mixolydian', 'Joyful, Expansive'],
                ['Saturn', 'Structure', 'Locrian', 'Restrained, Haunting'],
                ['Uranus', 'Liberation', 'Altered Scale', 'Disruptive, Electric'],
                ['Neptune', 'Dream', 'Whole-Tone', 'Ethereal, Boundless'],
                ['Pluto', 'Transformation', 'Chromatic', 'Intense, Subterranean'],
              ]}
            />

            <H3>II.2 — The Quantum Consciousness Engine</H3>
            <Callout>To observe is to tune. To entangle is to harmonize.</Callout>
            <P>
              The Quantum Consciousness Engine is the metaphysical substratum of the system — a living field of intelligence weaving quantum principles, conscious observation, musical analogues, and astro-mystic translation.
            </P>

            <H4>Superposition = Polytonality</H4>
            <P>
              In quantum mechanics, superposition means a particle can exist in multiple states at once. In music, this corresponds to polytonality. In astrology, this is when multiple transits overlap. The Quantumelodic model treats them like a musical cluster chord.
            </P>

            <H4>Entanglement = Harmonic Mirroring</H4>
            <P>
              Two particles, once connected, remain linked beyond space and time. In our system, this is reflected in mutual reception between planets, synastry, and planetary dyads across time.
            </P>

            <H4>Collapse = Harmonic Resolution</H4>
            <P>
              When we observe a superposed state, it "collapses" into a single outcome. Musically, this is resolution — dissonance resolves to consonance. In your chart, this is a transit completing or a karmic cycle ending.
            </P>

            <H3>II.3 — Sonic Symbolism & Xenolinguistics</H3>
            <Callout>Every sound is a sigil. Every vibration, a word. Every chord, a sentence of the soul.</Callout>
            <P>
              Sonic Symbolism is the art of translating frequencies into living glyphs of meaning. Xenolinguistics extends this principle into the cosmic conversation — the study of languages not bound to Earth, but to universal frequencies.
            </P>
            <P>
              When you create quantum music consciously, you are generating linguistic packets of resonance that could be legible to non-human intelligences.
            </P>
          </Section>

          {/* CHAPTER III */}
          <Section id="ch3">
            <SectionLabel>Chapter III</SectionLabel>
            <SectionTitle>Archetypal Journeys</SectionTitle>
            <Callout>The system adapts itself to the soul that enters it.</Callout>

            <P>Not all who enter will walk the same path. Like modes in music, each seeker resonates with a distinct archetypal journey.</P>

            <ArchetypeCard
              title="The Sonic Mystic"
              quote="I don't want to read the chart — I want to feel it sing."
              entry="Sound → Symbol → Cosmos"
              goal="Emotional resonance, direct vibrational initiation"
            />
            <ArchetypeCard
              title="The Hermetic Coder"
              quote="The glyphs are code. The ratios are syntax. The music is the program."
              entry="Symbol → Logic → System"
              goal="Understand the system as a cosmic operating code"
            />
            <ArchetypeCard
              title="The Astro Cartographer"
              quote="Show me the geometry of my soul."
              entry="Chart → Frequency → Harmony"
              goal="Map inner and outer worlds through astro-geometric music"
            />
            <ArchetypeCard
              title="The Bio-Quantum Seeker"
              quote="I want to feel the universe tuning me."
              entry="Body → Field → Pattern"
              goal="Healing, integration, and bio-resonant attunement"
            />

            <div className="mt-16 border-l border-primary/20 pl-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-2">The Fifth Archetype</p>
              <h4 className="font-sans font-extralight text-lg text-foreground mb-3">The Harmonic Weaver</h4>
              <P>
                Beyond the four lies a hidden Fifth Archetype. This soul blends all modes — Mystic, Coder, Cartographer, and Seeker into one. They are the future facilitators of the Quantumelodic Academy — teachers, healers, and composers of collective resonance.
              </P>
            </div>
          </Section>

          {/* CHAPTER IV */}
          <Section id="ch4">
            <SectionLabel>Chapter IV</SectionLabel>
            <SectionTitle>Tuning Your Instrument</SectionTitle>
            <Callout>You are the lyre of the cosmos. Keep your strings in tune.</Callout>

            <H3>The Human as Instrument</H3>
            <P>
              Your breath is the bow. Your voice is the string. Your nervous system is the resonant chamber. Your chakras and subtle centers are the frets, keys, and pedals.
            </P>
            <P>
              To live out of tune is to suffer dissonance. To live in tune is to resonate with the universe itself.
            </P>

            <H3>Creating Your Zodiac Scale</H3>
            <NumberedList items={[
              'Identify the Sun, Moon, and Ascendant — your triadic chord.',
              'Add the tone for your dominant planet (chart ruler).',
              'Overlay tones for your most active current transit.',
              'Arrange as a scale, ascending or descending.',
              'Play or hum this sequence daily.',
            ]} />

            <H3>The Harmonic Breath</H3>
            <NumberedList items={[
              'Inhale for 4 counts (Saturn stability)',
              'Hold for 3 counts (Moon reflection)',
              'Exhale for 5 counts (Venus flow)',
              'Hold empty for 2 counts (Mars ignition)',
              'Repeat for 7 cycles',
            ]} />

            <H3>Planetary Chakra Alignment</H3>
            <DataTable
              headers={['Chakra', 'Planet', 'Frequency']}
              rows={[
                ['Root', 'Saturn', '194 Hz'],
                ['Sacral', 'Venus', '221 Hz'],
                ['Solar', 'Sun', '272 Hz'],
                ['Heart', 'Moon', '210 Hz'],
                ['Throat', 'Mercury', '144 Hz'],
                ['Third Eye', 'Jupiter', '183 Hz'],
                ['Crown', 'Neptune', '432 Hz'],
              ]}
            />

            <H3>Daily Attunement Ritual</H3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
              <RitualBlock title="Morning" items={['Play your Zodiac Scale', 'Harmonic Breath (7 cycles)', 'Chant the transit interval']} />
              <RitualBlock title="Midday" items={['Generate a xenoglyph', 'Carry as your talisman']} />
              <RitualBlock title="Evening" items={['Review: which chords played?', 'Journal harmonies & dissonances', 'Offer gratitude for the music']} />
            </div>
          </Section>

          {/* CHAPTER V */}
          <Section id="ch5">
            <SectionLabel>Chapter V</SectionLabel>
            <SectionTitle>The System as Movement</SectionTitle>
            <Callout>When many instruments tune to the same field, a new symphony is born.</Callout>

            <P>
              The Quantumelodic System is not merely a toolset or philosophy. It is the seed of a movement — a planetary orchestra of seekers, musicians, mystics, and coders who together form a new harmonic culture.
            </P>

            <H3>Structures of the Movement</H3>
            <div className="space-y-8 mt-6">
              <MovementTier
                number="1"
                title="The Self-Tuners"
                description="Individuals practicing daily rituals. Sharing experiences and sound-glyphs in community. Function: anchor resonance in daily life."
              />
              <MovementTier
                number="2"
                title="The Harmonic Guilds"
                description="Local or online groups experimenting with collective sound rituals. Function: create local resonance hubs."
              />
              <MovementTier
                number="3"
                title="The Quantumelodic Academy"
                description="The formal learning portal. Courses, tools, interactive modules. Houses the living archive of sonic charts, xenoglyphs, and harmonic maps."
              />
            </div>

            <H3>Technologies as Sacred Instruments</H3>
            <BulletList items={[
              'HTML/JS prototypes become the first instruments.',
              'Spectrograms & Cymatics apps become the glyph-makers.',
              'VR/AR environments allow seekers to walk inside their chart.',
              'The interface is the altar. The code is the scripture.',
            ]} />
          </Section>

          {/* EPILOGUE */}
          <Section id="epilogue">
            <SectionLabel>Epilogue</SectionLabel>
            <SectionTitle>The Music of the Spheres — Remixed</SectionTitle>
            <Callout>The universe is not waiting to be understood. It is waiting to be played.</Callout>

            <P>
              Close your eyes. Beneath the noise of daily life, there is a deeper rhythm — a pulse that is not yours alone, but the heartbeat of the cosmos flowing through you.
            </P>
            <P>
              Your chart is not a map of fate. It is a score. Your voice, your breath, your choices — the instruments. Your soul — the conductor.
            </P>
            <P>
              The old story told us we are dust in an empty void. The Quantumelodic Mythos tells us we are resonance in a living field. Every aspect is an interval. Every interval is a dialogue. Every dialogue is a song of becoming.
            </P>

            <div className="mt-20 mb-12 text-center">
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/30 to-transparent mx-auto mb-8" />
              <p className="font-sans font-extralight text-xs text-muted-foreground/40 tracking-[0.3em] uppercase">
                The next chapter is not on paper
              </p>
              <p className="font-sans font-extralight text-xs text-muted-foreground/40 tracking-[0.3em] uppercase mt-1">
                It is in the sound you choose to make today
              </p>
            </div>
          </Section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

/* ─── Sub-components ─── */

const Section = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <motion.section id={id} className="pt-24 first:pt-12" {...fadeUp}>
    {children}
  </motion.section>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] uppercase tracking-[0.4em] text-primary/50 mb-4">{children}</p>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-sans font-extralight text-2xl sm:text-3xl tracking-tight text-foreground mb-8 leading-tight">{children}</h2>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-sans font-extralight text-lg text-foreground mt-14 mb-4 tracking-tight">{children}</h3>
);

const H4 = ({ children }: { children: React.ReactNode }) => (
  <h4 className="font-sans font-extralight text-base text-foreground/80 mt-10 mb-3 tracking-tight">{children}</h4>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="font-sans font-extralight text-sm text-muted-foreground/70 leading-[1.8] mb-4 tracking-wide">{children}</p>
);

const Keywords = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 mb-8">{children}</p>
);

const Callout = ({ children }: { children: React.ReactNode }) => (
  <div className="border-l border-primary/20 pl-6 my-8">
    <p className="font-sans font-extralight text-base text-foreground/60 italic leading-relaxed">{children}</p>
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 my-4 ml-4">
    {items.map((item, i) => (
      <li key={i} className="font-sans font-extralight text-sm text-muted-foreground/60 leading-relaxed flex gap-3">
        <span className="text-primary/30 mt-0.5">·</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const NumberedList = ({ items }: { items: string[] }) => (
  <ol className="space-y-2 my-4 ml-4">
    {items.map((item, i) => (
      <li key={i} className="font-sans font-extralight text-sm text-muted-foreground/60 leading-relaxed flex gap-3">
        <span className="text-primary/40 tabular-nums text-xs mt-0.5 min-w-[1rem]">{i + 1}.</span>
        <span>{item}</span>
      </li>
    ))}
  </ol>
);

const DataTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="my-6 overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-border/20">
          {headers.map((h, i) => (
            <th key={i} className="font-sans font-normal text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 pb-3 pr-4">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-b border-border/10">
            {row.map((cell, ci) => (
              <td key={ci} className="font-sans font-extralight text-xs text-muted-foreground/60 py-3 pr-4 whitespace-nowrap">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ArchetypeCard = ({ title, quote, entry, goal }: { title: string; quote: string; entry: string; goal: string }) => (
  <div className="mt-10 p-6 rounded-xl border border-border/10 bg-card/20">
    <h4 className="font-sans font-extralight text-base text-foreground mb-2">{title}</h4>
    <p className="font-sans font-extralight text-xs text-foreground/40 italic mb-4">"{quote}"</p>
    <div className="flex flex-col gap-1">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
        Entry: <span className="text-muted-foreground/60">{entry}</span>
      </p>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
        Goal: <span className="text-muted-foreground/60">{goal}</span>
      </p>
    </div>
  </div>
);

const RitualBlock = ({ title, items }: { title: string; items: string[] }) => (
  <div className="p-4 rounded-xl border border-border/10 bg-card/10">
    <p className="text-[10px] uppercase tracking-[0.3em] text-primary/50 mb-3">{title}</p>
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="font-sans font-extralight text-xs text-muted-foreground/50 leading-relaxed">{item}</li>
      ))}
    </ul>
  </div>
);

const MovementTier = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="flex gap-5">
    <span className="font-sans font-extralight text-3xl text-primary/20 tabular-nums mt-[-4px]">{number}</span>
    <div>
      <h4 className="font-sans font-extralight text-base text-foreground mb-1">{title}</h4>
      <P>{description}</P>
    </div>
  </div>
);

export default Guide;
