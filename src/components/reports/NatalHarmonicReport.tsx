/**
 * NatalHarmonicReport
 * React replica of templates/natal-harmonic-analysis.html, populated with
 * real chart data + QuantumMelodic canonical interpretations from Supabase.
 *
 * Renders as a series of `.mt-page` blocks. Each page is sized for 580px width
 * and prints as its own A4 sheet via the shared print stylesheet.
 *
 * Use `downloadNatalHarmonicPdf()` from utils/downloadHelpers.ts to export.
 */
import { useMemo } from 'react';
import type { ChartData, BirthData } from '@/types/astrology';
import type { QuantumMelodicReading } from '@/types/quantumMelodic';
import { placementSentence, compositionStatement } from '@/utils/placementSentences';
import elevenLabsBadgeUrl from '@/assets/elevenlabs-grants-badge.svg';

interface Props {
  birthData: BirthData;
  chartData: ChartData;
  reading: QuantumMelodicReading;
  reportId?: string;
}

const ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

const MODALITIES: Record<string, string> = {
  Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
  Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed',
  Gemini: 'Mutable', Virgo: 'Mutable', Sagittarius: 'Mutable', Pisces: 'Mutable',
};

function fmtDeg(deg: number): string {
  const within = deg % 30;
  const d = Math.floor(within);
  const m = Math.round((within - d) * 60);
  return `${d}°${m.toString().padStart(2, '0')}'`;
}

export function NatalHarmonicReport({ birthData, chartData, reading }: Props) {
  const today = useMemo(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), []);

  const sun = reading.planets.find((p) => p.position.name === 'Sun');
  const moon = reading.planets.find((p) => p.position.name === 'Moon');
  const ascRaw = reading.planets.find((p) => p.position.name === 'Ascendant');

  const sunSign = chartData.sunSign;
  const moonSign = chartData.moonSign;
  const ascSign = ascRaw?.position.sign || chartData.ascendant.split(' ')[0];

  const overallKey = reading.overallKey;
  const overallMode = sun?.signData?.musical_mode || 'Dorian';
  const overallTempo = reading.overallTempo;

  const personalPlanets = reading.planets.filter((p) =>
    ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(p.position.name)
  );
  const outerPlanets = reading.planets.filter((p) =>
    ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(p.position.name)
  );

  // Top 8 most exact aspects for the report
  const topAspects = [...reading.aspects].sort((a, b) => a.orb - b.orb).slice(0, 8);

  return (
    <div id="natal-harmonic-report-root" className="natal-harmonic-report">
      {/* Scoped print + screen styles */}
      <style>{REPORT_CSS}</style>

      {/* ───── COVER ───── */}
      <section className="mt-page cover">
        <header className="cover-header">
          <div className="brand">MOONtuner</div>
          <div className="report-tier">Astro-Harmonic<br />Natal Analysis</div>
        </header>

        <div className="cover-body">
          <div className="cover-report-name">
            <div className="report-label">Cosmic Chart — Generated for</div>
            <div className="report-title">
              {birthData.name || 'Cosmic Traveler'}<br />
              <em>Cosmic Chart</em>
            </div>
          </div>

          <div className="chart-diagram">
            <CoverSigil sunSign={sunSign} ascSign={ascSign} mode={overallMode} keySig={overallKey} />
          </div>

          <div className="cover-identity">
            <IdentityCell label="Sun" value={sunSign} sub={`${ELEMENTS[sunSign]} · ${MODALITIES[sunSign]}`} />
            <IdentityCell label="Moon" value={moonSign} sub={`${ELEMENTS[moonSign]} · ${MODALITIES[moonSign]}`} />
            <IdentityCell label="Ascendant" value={ascSign} sub={`${ELEMENTS[ascSign] || ''} · ${MODALITIES[ascSign] || ''}`} />
          </div>
        </div>

        <footer className="cover-footer">
          <div className="cover-meta">
            Born {birthData.date} &nbsp;·&nbsp; {birthData.time}<br />
            {birthData.location}
          </div>
          <div className="cover-url">moontuner.xyz</div>
        </footer>
      </section>

      {/* ───── 01 PLANETARY POSITIONS ───── */}
      <section className="mt-page section-page">
        <div className="section-eyebrow">Section 01</div>
        <h2 className="section-title">Planetary Positions<br /><em>&amp; Meanings</em></h2>
        <div className="full-rule" />

        <div className="planet-list">
          {reading.planets
            .filter((p) => p.position.name !== 'Ascendant')
            .map((p) => {
              const sign = p.position.sign;
              const interpretation = p.qmData?.archetypal_energy
                ? `${p.qmData.archetypal_energy}. ${p.signData?.emotional_quality || ''}.`
                : `Your ${p.position.name} in ${sign} brings ${ELEMENTS[sign]?.toLowerCase() || ''} energy to your chart.`;
              const distill = placementSentence(p.position.name, sign, p.houseNumber);
              return (
                <div key={p.position.name} className="planet-row">
                  <div className="planet-glyph">{p.position.symbol}</div>
                  <div>
                    <div className="planet-name">{p.position.name}</div>
                    <div className="planet-position">{fmtDeg(p.position.degree)} · {p.position.isRetrograde ? 'Retrograde ℞' : 'Direct'}</div>
                    <div className="planet-position" style={{ marginTop: 4 }}>House {p.houseNumber}</div>
                  </div>
                  <div>
                    <div className="planet-sign">{sign}</div>
                    <div className="planet-element">{ELEMENTS[sign]} · {MODALITIES[sign]}</div>
                  </div>
                  <div className="planet-interpretation">
                    {interpretation}
                    <div style={{ marginTop: 8, fontStyle: 'italic', color: 'var(--gold)' }}>{distill}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ───── 02 MUSICAL TRANSLATION ───── */}
      <section className="mt-page section-page">
        <div className="section-eyebrow">Section 02</div>
        <h2 className="section-title">Musical<br /><em>Translation</em></h2>
        <div className="full-rule" />

        <div className="music-intro">
          Your chart unfolds like a living composition. Each planet plays a specific instrumental voice, the signs determine the modal scale, and the aspects between them form the harmonic intervals — consonances and tensions — that give your symphony its character.
        </div>

        <div className="key-signature">
          <div>
            <div className="ks-label">Key Signature</div>
            <div className="ks-value">{overallKey}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--gold-lt)', paddingLeft: 20 }}>
            <div className="ks-desc">
              {overallMode} mode · {overallTempo} BPM · dominant {reading.dominantElement.toLowerCase()} character.
            </div>
          </div>
        </div>

        <div className="music-list">
          {reading.planets
            .filter((p) => p.position.name !== 'Ascendant')
            .map((p) => (
              <div key={p.position.name} className="music-row">
                <div style={{ fontSize: 16, paddingTop: 2 }}>{p.position.symbol}</div>
                <div>
                  <div className="music-planet-name">{p.position.name}</div>
                  <div className="music-sign">{p.position.sign}</div>
                </div>
                <div>
                  <div className="music-voice">
                    {p.qmData?.instrument || 'Synthesizer'} — {p.qmData?.harmonic_quality || 'harmonic voice'}
                  </div>
                  <div className="music-interpretation">
                    {p.qmData?.sonic_character || 'A distinctive timbre in your composition.'}{' '}
                    {p.signData ? `Sung in ${p.signData.musical_mode} mode (${p.signData.key_signature}), with a ${p.signData.texture} texture.` : ''}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* ───── 03 ASPECTS AS INTERVALS ───── */}
      <section className="mt-page section-page">
        <div className="section-eyebrow">Section 03</div>
        <h2 className="section-title">Aspects as<br /><em>Musical Intervals</em></h2>
        <div className="full-rule" />

        <div className="music-intro">
          The angles between your planets form harmonic intervals. These eight most-exact aspects shape the consonance, tension, and resolution patterns of your inner music.
        </div>

        <div className="aspect-list">
          {topAspects.map((a, i) => (
            <div key={i} className="aspect-row">
              <div>
                <div className="aspect-name">{a.aspectType.name}</div>
                <div className="aspect-orb">{a.aspectType.angle}° · orb {a.orb.toFixed(1)}°</div>
              </div>
              <div className="aspect-interval">{a.aspectType.harmonic_interval}</div>
              <div
                className="aspect-consonance"
                style={{ color: a.aspectType.consonance.toLowerCase().includes('consonan') ? '#7A9E7A' : '#B07070' }}
              >
                {a.aspectType.consonance}
              </div>
              <div className="aspect-desc">
                <strong>{a.planet1} {a.aspectType.symbol} {a.planet2}</strong> — {a.aspectType.sonic_expression}.{' '}
                {a.aspectType.musical_effect}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 04 THE WHOLE COMPOSITION ───── */}
      <section className="mt-page section-page">
        <div className="section-eyebrow">Section 04</div>
        <h2 className="section-title">The Whole<br /><em>Composition</em></h2>
        <div className="full-rule" />

        <div className="composition-intro">
          Imagine a living composition for ten instruments, each representing a planet in your chart. This is not metaphor — this is the actual structure of your energetic signature.
        </div>

        <div className="layer-grid">
          <div className="layer-cell">
            <div className="layer-label">The Foreground</div>
            <div className="layer-planets">
              {personalPlanets.map((p) => p.position.name).join(' · ')}
            </div>
            <div className="layer-desc">
              The inner planets form your daily melodies, rhythms, and harmonies — the voices you hear most clearly. Sounds of immediate experience, personality, and relationship.
            </div>
          </div>
          <div className="layer-cell">
            <div className="layer-label">The Architecture</div>
            <div className="layer-planets">
              {outerPlanets.map((p) => p.position.name).join(' · ')}
            </div>
            <div className="layer-desc">
              The outer planets provide deep structure — key changes, structural movements, generational themes. These unfold over years and decades, not months.
            </div>
          </div>
        </div>

        <div className="composition-statement">
          <div className="comp-label">The Central Voice</div>
          <div className="comp-text">
            Your central melody — the <strong>Sun in {sunSign}</strong> — establishes the key and character of the entire composition.
            The <strong>Moon in {moonSign}</strong> provides the emotional undercurrent that colours every phrase.
            The <strong>Ascendant in {ascSign}</strong> sets the opening tone — the first impression a listener receives.
            <br /><br />
            With a dominant <strong>{reading.dominantElement.toLowerCase()}</strong> element and a <strong>{reading.dominantModality.toLowerCase()}</strong> rhythmic signature, your symphony resolves around <strong>{overallKey}</strong> at roughly {overallTempo} beats per minute. Every aspect woven through this fabric is a moment of dialogue between voices — sometimes consonant, sometimes deliberately tense, always unmistakably yours.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0 8px' }}>
          <FinalSigil />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant',serif", fontStyle: 'italic', fontSize: 17, lineHeight: 1.65, color: 'var(--mid)', maxWidth: 380, margin: '0 auto' }}>
            Together, they create a composition that is entirely yours: unrepeatable, constantly evolving, and profoundly beautiful. This is the music of your cosmos.
          </div>
        </div>
      </section>

      {/* ───── CLOSING + ATTRIBUTION ───── */}
      <section className="mt-page closing-page">
        <div>
          <div className="brand" style={{ marginBottom: 16 }}>MOONtuner</div>
          <div style={{ fontFamily: "'Cormorant',serif", fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', lineHeight: 1.5 }}>
            Find yourself<br /><em style={{ color: 'var(--gold)' }}>in the frequency.</em>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 28, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
          <img
            src={elevenLabsBadgeUrl}
            alt="Powered by ElevenLabs Grants"
            loading="lazy"
            style={{ width: 220, height: 'auto', opacity: 0.8 }}
          />
          <div style={{ fontFamily: "'Jost',sans-serif", fontWeight: 200, fontSize: 9, letterSpacing: '0.3em', color: 'var(--light)', textTransform: 'uppercase' }}>
            Music composition powered by ElevenLabs
          </div>
        </div>

        <div style={{ fontFamily: "'Jost',sans-serif", fontWeight: 200, fontSize: 9, letterSpacing: '0.25em', color: 'var(--light)' }}>
          Generated {today} · moontuner.xyz
        </div>
      </section>
    </div>
  );
}

// ───── Sub-components ─────

function IdentityCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="identity-cell">
      <div className="id-label">{label}</div>
      <div className="id-value">{value}</div>
      <div className="id-mode">{sub}</div>
    </div>
  );
}

function CoverSigil({ sunSign, ascSign, mode, keySig }: { sunSign: string; ascSign: string; mode: string; keySig: string }) {
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="100" stroke="#D9D3C9" strokeWidth="0.75" />
      <circle cx="110" cy="110" r="78" stroke="#D9D3C9" strokeWidth="0.5" />
      <circle cx="110" cy="110" r="56" stroke="#D9D3C9" strokeWidth="0.5" />
      <circle cx="110" cy="110" r="30" stroke="#D9D3C9" strokeWidth="0.5" />
      <line x1="110" y1="10" x2="110" y2="210" stroke="#D9D3C9" strokeWidth="0.4" />
      <line x1="10" y1="110" x2="210" y2="110" stroke="#D9D3C9" strokeWidth="0.4" />
      <line x1="60" y1="23.4" x2="160" y2="196.6" stroke="#D9D3C9" strokeWidth="0.3" />
      <line x1="160" y1="23.4" x2="60" y2="196.6" stroke="#D9D3C9" strokeWidth="0.3" />
      <line x1="23.4" y1="60" x2="196.6" y2="160" stroke="#D9D3C9" strokeWidth="0.3" />
      <line x1="23.4" y1="160" x2="196.6" y2="60" stroke="#D9D3C9" strokeWidth="0.3" />
      <circle cx="10" cy="110" r="3" fill="#B89D6A" />
      <text x="5" y="107" fontFamily="Jost" fontWeight="200" fontSize="7" fill="#B89D6A">ASC</text>
      <text x="105" y="8" fontFamily="Jost" fontWeight="200" fontSize="7" fill="#A09890">MC</text>
      <text x="107" y="216" fontFamily="Jost" fontWeight="200" fontSize="7" fill="#A09890">IC</text>
      <text x="110" y="113" textAnchor="middle" fontFamily="Cormorant" fontStyle="italic" fontSize="14" fill="#B89D6A">{keySig.split(' ')[0]}</text>
      <text x="110" y="128" textAnchor="middle" fontFamily="Jost" fontWeight="200" fontSize="7" letterSpacing="1" fill="#A09890">{mode.toUpperCase()}</text>
      <text x="110" y="195" textAnchor="middle" fontFamily="Jost" fontWeight="200" fontSize="6" letterSpacing="2" fill="#A09890">☉ {sunSign.toUpperCase()}</text>
    </svg>
  );
}

function FinalSigil() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="54" stroke="#D9D3C9" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="36" stroke="#D9D3C9" strokeWidth="0.5" />
      <circle cx="60" cy="60" r="18" stroke="#D9D3C9" strokeWidth="0.5" />
      <line x1="6" y1="60" x2="114" y2="60" stroke="#D9D3C9" strokeWidth="0.4" />
      <line x1="60" y1="6" x2="60" y2="114" stroke="#D9D3C9" strokeWidth="0.4" />
      <polygon points="60,18 96,76 24,76" fill="none" stroke="#B89D6A" strokeWidth="0.75" />
      <polygon points="60,102 24,44 96,44" fill="none" stroke="#D4BF96" strokeWidth="0.5" />
      <circle cx="60" cy="60" r="4" fill="#B89D6A" />
    </svg>
  );
}

// ───── Styles ─────

const REPORT_CSS = `
.natal-harmonic-report {
  --ink: #1A1918;
  --mid: #6A6560;
  --light: #A09890;
  --rule: #D9D3C9;
  --paper: #F9F7F4;
  --gold: #B89D6A;
  --gold-lt: #D4BF96;
  --page-w: 580px;
  background: #EDE8E1;
  color: var(--ink);
  font-family: 'Jost', 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  padding: 24px 0;
}
.natal-harmonic-report * { box-sizing: border-box; }
.natal-harmonic-report .mt-page {
  width: var(--page-w);
  background: var(--paper);
  margin: 0 auto 12px;
  position: relative;
  overflow: hidden;
}
.natal-harmonic-report .cover { min-height: 760px; display: grid; grid-template-rows: auto 1fr auto; padding: 60px 60px 52px; }
.natal-harmonic-report .cover-header { display: flex; justify-content: space-between; align-items: flex-start; }
.natal-harmonic-report .brand { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 10px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--gold); }
.natal-harmonic-report .report-tier { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--light); text-align: right; }
.natal-harmonic-report .cover-body { display: flex; flex-direction: column; justify-content: center; gap: 36px; padding: 24px 0; }
.natal-harmonic-report .cover-report-name { display: flex; flex-direction: column; gap: 6px; }
.natal-harmonic-report .report-label { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.45em; text-transform: uppercase; color: var(--gold); }
.natal-harmonic-report .report-title { font-family: 'Cormorant Garamond', 'Cormorant', serif; font-weight: 300; font-size: 48px; line-height: 1.0; color: var(--ink); }
.natal-harmonic-report .report-title em { font-style: italic; color: var(--gold); }
.natal-harmonic-report .chart-diagram { display: flex; justify-content: center; }
.natal-harmonic-report .cover-identity { display: grid; grid-template-columns: 1fr 1fr 1fr; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
.natal-harmonic-report .identity-cell { padding: 16px 0; text-align: center; }
.natal-harmonic-report .identity-cell + .identity-cell { border-left: 1px solid var(--rule); }
.natal-harmonic-report .id-label { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase; color: var(--light); margin-bottom: 5px; }
.natal-harmonic-report .id-value { font-family: 'Cormorant Garamond', 'Cormorant', serif; font-weight: 400; font-size: 20px; color: var(--ink); }
.natal-harmonic-report .id-mode { font-family: 'Cormorant Garamond', 'Cormorant', serif; font-style: italic; font-size: 13px; color: var(--gold); margin-top: 2px; }
.natal-harmonic-report .cover-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid var(--rule); }
.natal-harmonic-report .cover-meta { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.25em; color: var(--light); line-height: 1.8; }
.natal-harmonic-report .cover-url { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase; color: var(--gold); }

.natal-harmonic-report .section-page { min-height: 700px; display: flex; flex-direction: column; padding: 56px 60px 48px; }
.natal-harmonic-report .section-eyebrow { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.45em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
.natal-harmonic-report .section-title { font-family: 'Cormorant Garamond', 'Cormorant', serif; font-weight: 300; font-size: 38px; line-height: 1.05; color: var(--ink); margin: 0 0 28px; }
.natal-harmonic-report .section-title em { font-style: italic; color: var(--gold); }
.natal-harmonic-report .full-rule { width: 100%; height: 1px; background: var(--rule); margin: 0 0 28px; position: relative; }
.natal-harmonic-report .full-rule::before { content: ''; position: absolute; left: 0; top: -1px; width: 56px; height: 3px; background: var(--gold); }

.natal-harmonic-report .planet-list { display: flex; flex-direction: column; }
.natal-harmonic-report .planet-row { display: grid; grid-template-columns: 28px 110px 90px 1fr; align-items: start; padding: 14px 0; border-bottom: 1px solid var(--rule); gap: 16px; }
.natal-harmonic-report .planet-glyph { font-size: 18px; line-height: 1; padding-top: 3px; font-family: 'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',sans-serif; }
.natal-harmonic-report .planet-name { font-family: 'Cormorant SC', 'Cormorant Garamond', serif; font-weight: 400; font-size: 12px; letter-spacing: 0.2em; color: var(--ink); }
.natal-harmonic-report .planet-position { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 10px; color: var(--light); margin-top: 2px; letter-spacing: 0.1em; }
.natal-harmonic-report .planet-sign { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 16px; color: var(--ink); }
.natal-harmonic-report .planet-element { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--light); margin-top: 2px; }
.natal-harmonic-report .planet-interpretation { font-family: 'Jost', sans-serif; font-weight: 300; font-size: 12px; line-height: 1.65; color: var(--mid); }

.natal-harmonic-report .music-intro { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 19px; line-height: 1.65; color: var(--mid); margin-bottom: 28px; }
.natal-harmonic-report .key-signature { display: flex; align-items: center; gap: 20px; padding: 20px 24px; border: 1px solid var(--gold-lt); margin-bottom: 24px; }
.natal-harmonic-report .ks-label { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--light); }
.natal-harmonic-report .ks-value { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 28px; color: var(--ink); }
.natal-harmonic-report .ks-desc { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 16px; color: var(--mid); }
.natal-harmonic-report .music-list { display: flex; flex-direction: column; }
.natal-harmonic-report .music-row { display: grid; grid-template-columns: 28px 100px 1fr; align-items: start; padding: 14px 0; border-bottom: 1px solid var(--rule); gap: 16px; }
.natal-harmonic-report .music-planet-name { font-family: 'Cormorant SC', 'Cormorant Garamond', serif; font-weight: 400; font-size: 11px; letter-spacing: 0.15em; color: var(--ink); }
.natal-harmonic-report .music-sign { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--light); margin-top: 2px; }
.natal-harmonic-report .music-voice { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400; font-size: 14px; color: var(--gold); margin-bottom: 4px; }
.natal-harmonic-report .music-interpretation { font-family: 'Jost', sans-serif; font-weight: 300; font-size: 12px; line-height: 1.65; color: var(--mid); }

.natal-harmonic-report .aspect-list { display: flex; flex-direction: column; }
.natal-harmonic-report .aspect-row { display: grid; grid-template-columns: 130px 100px 80px 1fr; align-items: start; padding: 14px 0; border-bottom: 1px solid var(--rule); gap: 14px; }
.natal-harmonic-report .aspect-name { font-family: 'Cormorant SC', serif; font-size: 12px; letter-spacing: 0.15em; color: var(--ink); }
.natal-harmonic-report .aspect-orb { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; color: var(--light); letter-spacing: 0.15em; margin-top: 3px; }
.natal-harmonic-report .aspect-interval { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px; color: var(--gold); }
.natal-harmonic-report .aspect-consonance { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; }
.natal-harmonic-report .aspect-desc { font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px; line-height: 1.6; color: var(--mid); }

.natal-harmonic-report .composition-intro { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 20px; line-height: 1.65; color: var(--mid); margin-bottom: 28px; border-left: 2px solid var(--gold); padding-left: 20px; }
.natal-harmonic-report .layer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--rule); margin-bottom: 28px; }
.natal-harmonic-report .layer-cell { background: var(--paper); padding: 20px 18px; }
.natal-harmonic-report .layer-label { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
.natal-harmonic-report .layer-planets { font-family: 'Cormorant SC', serif; font-weight: 400; font-size: 13px; letter-spacing: 0.15em; color: var(--ink); margin-bottom: 8px; }
.natal-harmonic-report .layer-desc { font-family: 'Jost', sans-serif; font-weight: 300; font-size: 12px; line-height: 1.65; color: var(--mid); }
.natal-harmonic-report .composition-statement { padding: 24px; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
.natal-harmonic-report .comp-label { font-family: 'Jost', sans-serif; font-weight: 200; font-size: 9px; letter-spacing: 0.45em; text-transform: uppercase; color: var(--light); margin-bottom: 10px; }
.natal-harmonic-report .comp-text { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 17px; line-height: 1.7; color: var(--ink); }

.natal-harmonic-report .closing-page { min-height: 460px; display: flex; flex-direction: column; justify-content: space-between; padding: 60px; text-align: center; align-items: center; gap: 28px; }

@media print {
  body { background: #fff !important; }
  .natal-harmonic-report { background: #fff !important; padding: 0 !important; }
  .natal-harmonic-report .mt-page {
    width: 100% !important;
    margin: 0 !important;
    page-break-after: always;
    break-after: page;
    box-shadow: none !important;
  }
  .natal-harmonic-report .mt-page:last-child { page-break-after: auto; break-after: auto; }
}
`;

