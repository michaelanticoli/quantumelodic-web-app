import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Flame, Droplets, Wind, Mountain, Calendar, Sparkles, BookOpen, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BirthDataForm } from '@/components/BirthDataForm';
import { generateReport, type LunarReport } from '@/lib/reportEngine';
import { toast } from 'sonner';

const SESSION_KEY = 'moontuner_lunar_report';

const ELEMENT_ICONS: Record<string, typeof Flame> = {
  Fire: Flame, Earth: Mountain, Water: Droplets, Air: Wind,
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'text-primary', Earth: 'text-highlight', Water: 'text-highlight', Air: 'text-foreground',
};

export default function LunarReports() {
  const [report, setReport] = useState<LunarReport | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const saveReport = useCallback((r: LunarReport) => {
    setReport(r);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(r)); } catch {}
  }, []);

  const handleSubmit = async (data: { name: string; date: string; time: string; location: string }) => {
    setLoading(true);
    try {
      const result = await generateReport(data.date, data.time || '12:00', data.location);
      saveReport(result);
      toast.success('Your Lunar Report is ready');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/30">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-5 py-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-lg font-semibold tracking-tight">Lunar Reports</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <AnimatePresence mode="wait">
          {!report ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/40 text-xs text-muted-foreground font-medium tracking-wide uppercase">
                  <Star className="w-3 h-3 text-primary" />
                  Personalized Cosmic Blueprint
                </div>
                <h2 className="font-display text-2xl font-bold">Your Lunar Report</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enter your birth data to unlock your power days, peak windows, and elemental practice.
                </p>
              </div>
              <BirthDataForm onSubmit={handleSubmit} isLoading={loading} />
            </motion.div>
          ) : (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-10"
            >
              {/* ── Section 1: Natal Archetype Header ── */}
              <section className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{report.natal.archetype}</span>
                </motion.div>

                <h2 className="font-display text-3xl font-bold tracking-tight">
                  <span className="text-primary">{report.natal.sunSign}</span> Sun ·{' '}
                  <span className="text-accent">{report.natal.moonSign}</span> Moon ·{' '}
                  <span className="text-highlight">{report.natal.ascendant}</span> Rising
                </h2>

                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {(() => { const Icon = ELEMENT_ICONS[report.natal.element] || Star; return <Icon className={`w-3.5 h-3.5 ${ELEMENT_COLORS[report.natal.element]}`} />; })()}
                    {report.natal.element} · {report.natal.modality}
                  </span>
                  <span className="text-border">|</span>
                  <span>♫ {report.natal.musicalMode}</span>
                </div>

                <p className="italic text-sm text-muted-foreground max-w-sm mx-auto">
                  "{report.natal.mantra}"
                </p>
              </section>

              {/* ── Section 2: Power Days Grid ── */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-lg font-semibold">Power Days</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.powerDays.map((day, i) => (
                    <motion.div
                      key={`${day.month}-${day.day}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group relative rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs text-muted-foreground">{day.month} {day.day}, {day.year}</span>
                          <div className="font-display font-semibold text-sm text-primary mt-0.5">{day.keyword}</div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <div
                              key={j}
                              className={`w-1.5 h-1.5 rounded-full ${j < Math.ceil(day.power / 2) ? 'bg-primary' : 'bg-muted'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{day.description}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ── Section 3: Three Peak Windows ── */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h3 className="font-display text-lg font-semibold">Three Peak Windows</h3>
                </div>

                <div className="space-y-3">
                  {report.peakSummary.peakLines.map((peak, i) => (
                    <motion.div
                      key={peak.label}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-display font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-display font-semibold text-sm">{peak.label}</div>
                          <div className="text-xs text-muted-foreground">{peak.date}</div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-11">{peak.insight}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ── Section 4: Musical Placements ── */}
              {report.placements && report.placements.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    <h3 className="font-display text-lg font-semibold">Your Planetary Orchestra</h3>
                  </div>

                  <div className="space-y-3">
                    {report.placements.map((p, i) => (
                      <motion.div
                        key={`${p.planet}-${p.sign}-${p.house}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-sm text-primary">{p.planet}</span>
                          <span className="text-xs text-muted-foreground">in {p.sign} · {p.house}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{p.definition}</p>
                        <div className="flex items-start gap-2 text-xs pt-1 border-t border-border/20">
                          <Music className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span className="text-foreground/70 italic">{p.musicalExpression}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Section 5: Arc Practice ── */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-highlight" />
                  <h3 className="font-display text-lg font-semibold">{report.arcPractice.title}</h3>
                </div>

                <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-5 space-y-4">
                  <p className="text-sm text-foreground/80 italic">"{report.arcPractice.intention}"</p>

                  <ol className="space-y-3">
                    {report.arcPractice.steps.map((step, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        className="flex gap-3 text-sm text-muted-foreground"
                      >
                        <span className="shrink-0 w-6 h-6 rounded-full bg-highlight/10 text-highlight flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{step}</span>
                      </motion.li>
                    ))}
                  </ol>

                  <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border/20">
                    {report.arcPractice.closingNote}
                  </p>
                </div>
              </section>

              {/* Reset */}
              <div className="text-center pt-4 pb-8">
                <button
                  onClick={() => { setReport(null); sessionStorage.removeItem(SESSION_KEY); }}
                  className="text-xs text-muted-foreground hover:text-highlight transition-colors underline underline-offset-4"
                >
                  Generate another report
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
