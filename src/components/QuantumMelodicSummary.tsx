import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { PlanetPosition } from '@/types/astrology';
import type { QuantumMelodicReading } from '@/types/quantumMelodic';
import { calculateHarmonicAnalysis, getResolutionGuidance, elementInfo } from '@/utils/harmonicWisdom';
import { Sparkles, Loader2, AlertCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchWithTimeout, RequestTimeoutError } from '@/lib/fetchWithTimeout';
import { AspectSigil, PlanetSigil, toPlanetName } from '@/components/sigils';
import type { AspectName } from '@/components/sigils';

interface Props {
  reading: QuantumMelodicReading;
  chartData?: { planets: PlanetPosition[]; sunSign: string; moonSign: string; ascendant: string };
  subjectName?: string;
  readingId?: string | null;
  isUnlocked: boolean;
  onAspectPatternClick?: (aspectName: string) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const REPORT_REQUEST_TIMEOUT_MS = 45_000;

export const QuantumMelodicSummary = ({ reading, chartData, subjectName, readingId, isUnlocked, onAspectPatternClick }: Props) => {
  const { dominantElement, dominantModality, overallKey, overallTempo, aspects, planets } = reading;
  const [activeTab, setActiveTab] = useState<'analytics' | 'report'>('analytics');
  const [reportText, setReportText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadPdf = useCallback(async () => {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const node = reportRef.current;
      const canvas = await html2canvas(node, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        windowWidth: node.scrollWidth,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const safeName = (subjectName || 'MoonTuner').replace(/[^a-z0-9]+/gi, '_');
      pdf.save(`${safeName}_Quantumelodic_Report.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, subjectName]);

  const harmonicAnalysis = calculateHarmonicAnalysis(aspects, planets);
  const resolutionGuidance = getResolutionGuidance(harmonicAnalysis);

  const aspectCounts = aspects.reduce((acc, a) => {
    acc[a.aspectType.name] = (acc[a.aspectType.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const elementSymbols: Record<string, string> = { Fire: '△', Earth: '▽', Air: '◇', Water: '○' };
  const retrogradePlanets = planets.filter(p => p.position.isRetrograde);

  const generateReport = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setReportError(null);
    setReportText('');

    abortRef.current = new AbortController();

    try {
      // The full report is free for all users — no auth header required.
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const resp = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/generate-qm-report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          // 'full' generates the complete 5-section report for all users (report is free).
          // The backend no longer gates on auth for this mode.
          accessMode: 'full',
          readingId,
          name: subjectName || 'Unknown',
          chartData: chartData || { planets: planets.map(p => p.position), sunSign: '', moonSign: '', ascendant: '' },
          reading: {
            planets,
            aspects,
            dominantElement,
            dominantModality,
            overallKey,
            overallTempo,
          },
        }),
        signal: abortRef.current.signal,
      }, REPORT_REQUEST_TIMEOUT_MS);

      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        throw new Error(json.error || `Request failed: ${resp.status}`);
      }
      if (!resp.body) throw new Error('No stream body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) setReportText(prev => prev + content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      setReportGenerated(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setReportError(
        err instanceof RequestTimeoutError
          ? 'Report generation timed out. Please retry in a moment.'
          : err instanceof Error ? err.message : 'Failed to generate report'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, readingId, subjectName, chartData, planets, aspects, dominantElement, dominantModality, overallKey, overallTempo]);

  const handleTabChange = (tab: 'analytics' | 'report') => {
    setActiveTab(tab);
    if (tab === 'report' && !reportGenerated && !isGenerating) {
      generateReport();
    }
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Tab Header — underline minimalist */}
      <div className="flex gap-8 border-b border-foreground/10">
        {([
          { id: 'analytics', label: 'Analytics' },
          { id: 'report', label: 'Report' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`relative pb-3 text-[11px] uppercase tracking-[0.25em] transition-colors ${
              activeTab === t.id ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/70'
            }`}
          >
            {t.label}
            {activeTab === t.id && (
              <motion.span
                layoutId="qm-tab-underline"
                className="absolute left-0 right-0 -bottom-px h-px bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Harmonic Analysis */}
            <div className="glass rounded-xl p-5">
              <h3 className="label-micro mb-4">Harmonic Analysis</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-2xl font-light text-green-400">{harmonicAnalysis.consonance.toFixed(0)}%</p>
                  <p className="text-xs text-green-400/70 mt-1">Consonance</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Harmony Level</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-2xl font-light text-amber-400">{harmonicAnalysis.tension.toFixed(0)}%</p>
                  <p className="text-xs text-amber-400/70 mt-1">Tension</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Growth Pressure</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-2xl font-light text-accent">{harmonicAnalysis.complexity.toFixed(0)}%</p>
                  <p className="text-xs text-accent/70 mt-1">Complexity</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Richness</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Dominant Frequencies</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(harmonicAnalysis.elements)
                    .filter(([_, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([element, count]) => {
                      const info = elementInfo[element];
                      const colors: Record<string, string> = {
                        Fire: 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-300 border-orange-500/30',
                        Earth: 'bg-gradient-to-r from-green-600/20 to-emerald-500/20 text-emerald-300 border-emerald-500/30',
                        Air: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30',
                        Water: 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30',
                      };
                      return (
                        <span key={element} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${colors[element]}`}>
                          {info?.symbol || elementSymbols[element]} {element}: {count}
                        </span>
                      );
                    })}
                </div>
              </div>

              {resolutionGuidance.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/20 border-l-2 border-primary/50">
                  <p className="text-xs uppercase tracking-wide text-primary/80 mb-2">Resolution Pathways</p>
                  <div className="space-y-2">
                    {resolutionGuidance.map((guidance, i) => (
                      <p key={i} className="text-sm text-foreground/80 leading-relaxed">{guidance}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-3xl font-light text-foreground">{elementSymbols[dominantElement] || '◈'}</p>
                <p className="text-sm text-foreground mt-1">{dominantElement}</p>
                <p className="text-xs text-muted-foreground">Element</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-xl font-light text-foreground">{dominantModality}</p>
                <p className="text-xs text-muted-foreground mt-2">Modality</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-xl font-light text-foreground">{overallKey}</p>
                <p className="text-xs text-muted-foreground mt-2">Key</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-2xl font-light text-foreground">{overallTempo}</p>
                <p className="text-xs text-muted-foreground mt-1">BPM</p>
              </div>
            </div>

            {/* Aspect Summary */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-foreground/40 mb-4">Aspect Patterns</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(aspectCounts).map(([name, count]) => {
                  const aspectData = aspects.find(a => a.aspectType.name === name)?.aspectType;
                  const aspectKey = name.toLowerCase() as AspectName;
                  return (
                    <button
                      key={name}
                      onClick={() => onAspectPatternClick?.(name)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all hover:scale-[1.03] border"
                      style={{
                        color: aspectData?.color,
                        borderColor: `${aspectData?.color}40`,
                      }}
                    >
                      <AspectSigil aspect={aspectKey} size={14} strokeWidth={1.5} />
                      <span className="font-mono tracking-wide">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Retrograde */}
            {retrogradePlanets.length > 0 && (
              <div className="glass rounded-xl p-5 border-l-2 border-destructive/50">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-destructive/80 mb-3">Retrograde</h3>
                <div className="flex flex-wrap gap-2">
                  {retrogradePlanets.map(p => {
                    const pk = toPlanetName(p.position.name);
                    return (
                      <span key={p.position.name} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs">
                        {pk && <PlanetSigil planet={pk} size={14} strokeWidth={1.5} />}
                        <span className="tracking-wide">{p.position.name}</span>
                        <span className="font-mono opacity-70">℞</span>
                      </span>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 italic leading-relaxed">
                  Retrograde energy inverts the typical harmonic expression — introspective, reviewing themes.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'report' && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Error state */}
            {reportError && (
              <div className="glass rounded-xl p-5 border border-destructive/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-destructive font-medium">Report Generation Failed</p>
                    <p className="text-xs text-muted-foreground mt-1">{reportError}</p>
                    <button
                      onClick={generateReport}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* The full report is free for all users — no preview lock needed */}

            {/* Generating / empty */}
            {!reportError && !reportText && isGenerating && (
              <div className="glass rounded-xl p-10 flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-8 h-8 text-primary" />
                </motion.div>
                <p className="text-sm text-muted-foreground tracking-wide">Composing your cosmic report…</p>
                <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
                  The Quantumelodic system is translating your natal chart into an orchestral narrative.
                </p>
              </div>
            )}

            {/* Streaming / completed report */}
            {reportText && (
              <div ref={reportRef} className="glass rounded-xl p-6 sm:p-8 lg:p-10 relative overflow-hidden">
                {/* Decorative accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

                {isGenerating && (
                  <div className="flex items-center gap-2 mb-6 text-accent/80">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    <span className="text-xs tracking-[0.2em] uppercase">Composing your report…</span>
                  </div>
                )}

                <div className="prose prose-invert max-w-none
                  prose-headings:font-display prose-headings:tracking-wide
                  prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:font-light prose-h1:text-foreground prose-h1:mb-1 prose-h1:leading-tight
                  prose-h2:text-lg sm:prose-h2:text-xl prose-h2:font-medium prose-h2:text-accent prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-accent/20 prose-h2:pb-3 prose-h2:tracking-[0.1em]
                  prose-h3:text-base sm:prose-h3:text-lg prose-h3:font-medium prose-h3:text-foreground/90 prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-foreground/80 prose-p:leading-[1.8] prose-p:mb-4 prose-p:text-sm sm:prose-p:text-base
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-em:text-accent/70 prose-em:italic
                  prose-hr:border-accent/15 prose-hr:my-8
                  prose-table:text-sm prose-table:w-full
                  prose-th:text-accent/80 prose-th:font-medium prose-th:py-3 prose-th:px-4 prose-th:text-left prose-th:border-b prose-th:border-accent/20 prose-th:tracking-wider prose-th:text-xs prose-th:uppercase
                  prose-td:py-2.5 prose-td:px-4 prose-td:text-foreground/70 prose-td:border-t prose-td:border-accent/10
                  prose-li:text-foreground/80 prose-li:mb-2 prose-li:leading-relaxed
                  prose-ol:space-y-3
                  prose-blockquote:border-accent/40 prose-blockquote:text-muted-foreground prose-blockquote:italic prose-blockquote:pl-6
                ">
                  <ReactMarkdown>{reportText}</ReactMarkdown>
                </div>

                {!isGenerating && reportGenerated && (
                  <div className="mt-6 pt-4 border-t border-primary/10 flex justify-end gap-4">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isExporting}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                      {isExporting ? 'Preparing PDF…' : 'Download PDF'}
                    </button>
                     <button
                       onClick={() => { setReportText(''); setReportGenerated(false); generateReport(); }}
                       className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                     >
                       <Sparkles className="w-3 h-3" /> Regenerate
                     </button>
                   </div>
                 )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
