import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, Flame, Droplets, Wind, Mountain,
  Calendar, Sparkles, BookOpen, Music, Printer, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { BirthDataForm } from '@/components/BirthDataForm';
import { GeneratingState } from '@/components/GeneratingState';
import { generateReport, type LunarReport } from '@/lib/reportEngine';
import { toast } from 'sonner';

// ── Payment gate ─────────────────────────────────────────────────────────────
// FOUNDING_CLAIMED must be updated manually as purchases arrive (or fetched from an API)
const FOUNDING_CLAIMED = 7;
const FOUNDING_TOTAL = 50;
// Replace with your live Stripe payment link for the Lunar Report product.
// After creating the link in Stripe, update this constant and redeploy.
const LUNAR_CHECKOUT_URL = 'https://buy.stripe.com/YOUR_LUNAR_LINK_HERE';
const LUNAR_CHECKOUT_CONFIGURED = !LUNAR_CHECKOUT_URL.includes('YOUR_LUNAR_LINK');
const PAID_SESSION_KEY = 'lunar_report_paid';
const REPORT_CACHE_KEY = 'moontuner_lunar_report';

// ── Generation timing ─────────────────────────────────────────────────────────
const GEOCODING_DELAY_MS = 400;
const CHART_CALC_DELAY_MS = 300;
const RESULT_DISPLAY_DELAY_MS = 500;

// ── Helpers ──────────────────────────────────────────────────────────────────
const ELEMENT_ICONS: Record<string, typeof Flame> = {
  Fire: Flame, Earth: Mountain, Water: Droplets, Air: Wind,
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'text-primary', Earth: 'text-highlight', Water: 'text-highlight', Air: 'text-foreground',
};

// ── Paywall ──────────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
});

function Paywall() {
  return (
    <div className="max-w-xl mx-auto pt-8 pb-24 space-y-10">
      {/* Hero */}
      <motion.header className="text-center" {...fadeUp(0.05)}>
        <p className="text-[10px] tracking-[0.4em] text-muted-foreground/50 uppercase mb-5">
          Personal · Lunar · Arc
        </p>
        <h1 className="font-display font-light leading-[0.92] tracking-[-0.03em] text-foreground mb-6">
          <span className="block text-[38px] md:text-[54px]">Your birth chart,</span>
          <span className="block text-[38px] md:text-[54px] italic text-accent">mapped to your year.</span>
        </h1>
        <div className="divider-gold max-w-[80px] mx-auto mb-5" />
        <p className="font-sans text-foreground/60 text-base max-w-md mx-auto leading-relaxed">
          Twelve monthly power days. Three peak windows. A planetary orchestra reading.
          An elemental practice — all derived from your exact birth data.
        </p>
      </motion.header>

      {/* Offer */}
      <motion.section className="glass-card p-6 space-y-3" {...fadeUp(0.1)}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="font-display text-base font-semibold tracking-wide">The Lunar Report</h2>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Your full twelve-month lunar arc —{' '}
          <span className="text-foreground font-semibold">$17</span>. One-time, no subscription.
        </p>
      </motion.section>


      {/* CTA */}
      <motion.div {...fadeUp(0.15)}>
        {LUNAR_CHECKOUT_CONFIGURED ? (
          <motion.a
            href={LUNAR_CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-4 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base tracking-wide hover:opacity-90 transition-opacity"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Get your Lunar Report — $17
          </motion.a>
        ) : (
          <div className="block w-full text-center py-4 rounded-2xl bg-muted text-muted-foreground font-display font-semibold text-base tracking-wide opacity-60 cursor-not-allowed select-none">
            Coming Soon — $17
          </div>
        )}
        <motion.div
          className="flex items-start gap-3 mt-4 px-4 py-3 rounded-xl border border-accent/15 bg-accent/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            If the report doesn't resonate, email me within 7 days for a full refund — no questions asked.
          </p>
        </motion.div>
      </motion.div>

      {/* What's included */}
      <motion.section className="space-y-3" {...fadeUp(0.1)}>
        <h2 className="font-display text-base font-semibold tracking-wide">What's in your report</h2>
        {[
          { icon: Calendar, label: '12 Monthly Power Days', desc: 'Your highest-leverage dates across the next twelve months, derived from your natal element and planetary degrees.' },
          { icon: Sparkles, label: 'Three Peak Windows', desc: 'Creative apex, emotional tide, and integration gate — your three most significant thresholds for the year.' },
          { icon: Music, label: 'Planetary Orchestra', desc: 'Each of your planets voiced — sign, house, musical expression — as a full harmonic portrait of your chart.' },
          { icon: BookOpen, label: 'Elemental Practice', desc: 'A ritual practice calibrated to your element and modality. A closing practice to return to.' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="font-display font-medium text-sm">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-5">{desc}</p>
          </div>
        ))}
      </motion.section>

      <motion.p
        className="text-center text-[10px] text-muted-foreground/35 tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        One-time purchase · Instant access · No subscription
      </motion.p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LunarReports() {
  const [searchParams] = useSearchParams();

  // Payment gate: persist access via session storage; unlock on ?paid=true redirect
  const returnedFromCheckout = searchParams.get('paid') === 'true';
  const [hasPaidAccess] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (returnedFromCheckout) {
      try { sessionStorage.setItem(PAID_SESSION_KEY, 'true'); } catch { return true; }
      return true;
    }
    try { return sessionStorage.getItem(PAID_SESSION_KEY) === 'true'; } catch { return false; }
  });

  const [step, setStep] = useState<'input' | 'generating' | 'result'>(() => {
    if (!hasPaidAccess) return 'input';
    try {
      const cached = sessionStorage.getItem(REPORT_CACHE_KEY);
      return cached ? 'result' : 'input';
    } catch { return 'input'; }
  });

  const [report, setReport] = useState<LunarReport | null>(() => {
    if (!hasPaidAccess) return null;
    try {
      const saved = sessionStorage.getItem(REPORT_CACHE_KEY);
      return saved ? JSON.parse(saved) as LunarReport : null;
    } catch { return null; }
  });

  const [generatingStage, setGeneratingStage] = useState<'geocoding' | 'calculating' | 'generating'>('calculating');
  const [generatingProgress, setGeneratingProgress] = useState(0);

  const saveReport = useCallback((r: LunarReport) => {
    setReport(r);
    try { sessionStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(r)); } catch { return; }
  }, []);

  const handleSubmit = async (data: { name: string; date: string; time: string; location: string }) => {
    setStep('generating');
    setGeneratingStage('geocoding');
    setGeneratingProgress(10);

    try {
      await new Promise(r => setTimeout(r, GEOCODING_DELAY_MS));
      setGeneratingStage('calculating');
      setGeneratingProgress(35);

      await new Promise(r => setTimeout(r, CHART_CALC_DELAY_MS));
      setGeneratingProgress(60);
      setGeneratingStage('generating');

      const result = await generateReport(data.date, data.time || '12:00', data.location);

      setGeneratingProgress(90);
      await new Promise(r => setTimeout(r, RESULT_DISPLAY_DELAY_MS));
      setGeneratingProgress(100);

      saveReport(result);
      toast.success('Your Lunar Report is ready');
      setStep('result');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
      setStep('input');
    }
  };

  const handleReset = useCallback(() => {
    setReport(null);
    setGeneratingProgress(0);
    setStep('input');
    try { sessionStorage.removeItem(REPORT_CACHE_KEY); } catch { return; }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/30 no-print">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-5 py-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-lg font-semibold tracking-tight">Lunar Report</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-8">
        {/* Paywall — shown if user hasn't paid */}
        {!hasPaidAccess ? (
          <Paywall />
        ) : (
          <AnimatePresence mode="wait">
            {/* ── Step: Input ── */}
            {step === 'input' && (
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
                    Enter your birth data to generate your power days, peak windows, and elemental practice.
                  </p>
                </div>
                <BirthDataForm onSubmit={handleSubmit} isLoading={false} />
              </motion.div>
            )}

            {/* ── Step: Generating ── */}
            {step === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GeneratingState
                  stage={generatingStage}
                  progress={generatingProgress}
                />
              </motion.div>
            )}

            {/* ── Step: Result ── */}
            {step === 'result' && report && (
              <motion.div
                key="report"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-10"
              >
                {/* Result header + actions */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border/30 no-print">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-accent/70 mb-1">Analysis Complete</p>
                    <h2 className="font-display text-2xl font-semibold tracking-tight">Your Lunar Arc</h2>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print / Save PDF
                    </button>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Recalculate
                    </button>
                  </div>
                </div>

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
                      {(() => {
                        const Icon = ELEMENT_ICONS[report.natal.element] || Star;
                        return <Icon className={`w-3.5 h-3.5 ${ELEMENT_COLORS[report.natal.element]}`} />;
                      })()}
                      {report.natal.element} · {report.natal.modality}
                    </span>
                    <span className="text-border">|</span>
                    <span className="font-mono tracking-wide">{report.natal.musicalMode}</span>
                  </div>

                  <p className="italic text-sm text-muted-foreground max-w-sm mx-auto">
                    "{report.natal.mantra}"
                  </p>
                </section>

                {/* ── Section 2: Three Peak Windows ── */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <h3 className="font-display text-lg font-semibold">Three Peak Windows</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                    Your three most significant thresholds for the coming year.
                  </p>
                  <div className="space-y-3">
                    {report.peakSummary.peakLines.map((peak, i) => (
                      <motion.div
                        key={peak.label}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-display font-bold text-sm shrink-0">
                            <span aria-hidden="true">{i + 1}</span>
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

                {/* ── Section 3: Power Days Grid ── */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h3 className="font-display text-lg font-semibold">12-Month Power Days</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                    Your highest-leverage dates across the next twelve months, derived from your natal element and planetary degrees.
                  </p>
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

                {/* ── Section 4: Planetary Orchestra ── */}
                {report.placements && report.placements.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-primary" />
                      <h3 className="font-display text-lg font-semibold">Planetary Orchestra</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                      Each planet voiced — sign, house, and its musical expression in your chart.
                    </p>
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
                      {report.arcPractice.steps.map((s, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + i * 0.08 }}
                          className="flex gap-3 text-sm text-muted-foreground"
                        >
                          <span className="shrink-0 w-6 h-6 rounded-full bg-highlight/10 text-highlight flex items-center justify-center text-xs font-bold">
                            <span aria-hidden="true">{i + 1}</span>
                          </span>
                          <span className="leading-relaxed pt-0.5">{s}</span>
                        </motion.li>
                      ))}
                    </ol>
                    <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border/20">
                      {report.arcPractice.closingNote}
                    </p>
                  </div>
                </section>

                {/* Closing */}
                <div className="text-center pt-4 pb-8 space-y-3 no-print">
                  <p className="text-[10px] text-muted-foreground/40 tracking-wide uppercase">
                    Generated from your exact birth data · QuantumMelodic
                  </p>
                  <button
                    onClick={handleReset}
                    className="text-xs text-muted-foreground hover:text-highlight transition-colors underline underline-offset-4"
                  >
                    Generate another report
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
