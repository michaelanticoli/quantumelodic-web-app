import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { CosmicReading } from '@/types/astrology';

// ── Download chart wheel as PNG ───────────────────────────────────
export async function downloadChartImage(elementId: string, filename = 'quantumelodic-chart.png') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    backgroundColor: '#0a0a12',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ── Download the music audio ──────────────────────────────────────
export function downloadAudio(audioUrl: string, filename = 'quantumelodic-composition.mp3') {
  const link = document.createElement('a');
  link.href = audioUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── Generate & download QuantumMelodic PDF report ─────────────────
export async function downloadPdfReport(
  reading: CosmicReading,
  chartElementId: string,
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const W = 210;
  const M = 15;
  const CW = W - M * 2;
  let y = M;

  // ── Page 1: Cover + chart image ──
  pdf.setFontSize(28);
  pdf.setTextColor(212, 175, 55); // gold
  pdf.text('QuantumMelodic', W / 2, y + 10, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setTextColor(160, 160, 180);
  pdf.text('Find yourself in the frequency', W / 2, y + 18, { align: 'center' });

  y += 30;

  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`${reading.birthData.name}'s Cosmic Chart`, W / 2, y, { align: 'center' });
  y += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(140, 140, 160);
  pdf.text(
    `Born ${reading.birthData.date} at ${reading.birthData.time} · ${reading.birthData.location}`,
    W / 2, y, { align: 'center' },
  );
  y += 12;

  // Capture chart as image
  const chartEl = document.getElementById(chartElementId);
  if (chartEl) {
    try {
      const canvas = await html2canvas(chartEl, {
        backgroundColor: '#0a0a12',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const ratio = canvas.height / canvas.width;
      const imgW = Math.min(CW, 140);
      const imgH = imgW * ratio;
      pdf.addImage(imgData, 'PNG', (W - imgW) / 2, y, imgW, imgH);
      y += imgH + 8;
    } catch {
      // If capture fails, skip chart image
    }
  }

  // Sun / Moon / Ascendant summary
  const chart = reading.chartData;
  pdf.setFontSize(12);
  pdf.setTextColor(212, 175, 55);
  pdf.text(`☉ ${chart.sunSign}   ☽ ${chart.moonSign}   Asc ${chart.ascendant}`, W / 2, y, { align: 'center' });
  y += 6;
  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 200);
  pdf.text(`Musical Mode: ${reading.musicalMode}`, W / 2, y, { align: 'center' });

  // ── Page 2: Planetary Positions ──
  pdf.addPage();
  pdf.setFillColor(10, 10, 18);
  pdf.rect(0, 0, W, 297, 'F');
  y = M;

  pdf.setFontSize(16);
  pdf.setTextColor(212, 175, 55);
  pdf.text('Planetary Positions', M, y);
  y += 10;

  pdf.setFontSize(9);
  for (const p of chart.planets) {
    const deg = Math.floor(p.degree);
    const min = Math.round((p.degree - deg) * 60);
    const retro = p.isRetrograde ? ' ℞' : '';
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${p.symbol} ${p.name}`, M, y);
    pdf.setTextColor(160, 160, 180);
    pdf.text(`${p.sign} ${deg}°${min.toString().padStart(2, '0')}'${retro}`, M + 50, y);
    y += 6;
  }

  y += 8;
  pdf.setFontSize(16);
  pdf.setTextColor(212, 175, 55);
  pdf.text('What Your Chart Means', M, y);
  y += 10;

  // Sun sign meaning
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  y = addWrapped(pdf, `☉ Sun in ${chart.sunSign}`, M, y, CW);
  pdf.setTextColor(180, 180, 200);
  y = addWrapped(pdf, getSunDescription(chart.sunSign), M, y, CW);
  y += 4;

  pdf.setTextColor(255, 255, 255);
  y = addWrapped(pdf, `☽ Moon in ${chart.moonSign}`, M, y, CW);
  pdf.setTextColor(180, 180, 200);
  y = addWrapped(pdf, getMoonDescription(chart.moonSign), M, y, CW);
  y += 4;

  pdf.setTextColor(255, 255, 255);
  y = addWrapped(pdf, `Ascendant in ${chart.ascendant}`, M, y, CW);
  pdf.setTextColor(180, 180, 200);
  y = addWrapped(pdf, getAscDescription(chart.ascendant), M, y, CW);

  // ── Page 3: Musical Translation ──
  pdf.addPage();
  pdf.setFillColor(10, 10, 18);
  pdf.rect(0, 0, W, 297, 'F');
  y = M;

  pdf.setFontSize(16);
  pdf.setTextColor(212, 175, 55);
  pdf.text('Musical Translation', M, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 200);
  y = addWrapped(pdf, `Your chart resonates in ${reading.musicalMode}. Each planetary placement contributes a unique voice to your cosmic symphony:`, M, y, CW);
  y += 6;

  for (const p of chart.planets) {
    if (p.name === 'Ascendant') continue;
    pdf.setTextColor(255, 255, 255);
    y = addWrapped(pdf, `${p.symbol} ${p.name} in ${p.sign}`, M, y, CW);
    pdf.setTextColor(160, 160, 180);
    y = addWrapped(pdf, getMusicalTranslation(p.name, p.sign), M, y, CW);
    y += 2;

    if (y > 270) {
      pdf.addPage();
      pdf.setFillColor(10, 10, 18);
      pdf.rect(0, 0, W, 297, 'F');
      y = M;
    }
  }

  // Footer on last page
  y = Math.max(y + 10, 270);
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 120);
  pdf.text('Generated by QuantumMelodic · quantumelodic.lovable.app', W / 2, y, { align: 'center' });

  // Apply dark background to all pages
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    // background fill is behind content because we added it first
  }

  pdf.save(`${reading.birthData.name.replace(/\s+/g, '-').toLowerCase()}-quantumelodic-report.pdf`);
}

// ── Helpers ───────────────────────────────────────────────────────
function addWrapped(pdf: jsPDF, text: string, x: number, y: number, maxW: number): number {
  const lines = pdf.splitTextToSize(text, maxW) as string[];
  for (const line of lines) {
    if (y > 282) {
      pdf.addPage();
      pdf.setFillColor(10, 10, 18);
      pdf.rect(0, 0, 210, 297, 'F');
      y = 15;
    }
    pdf.text(line, x, y);
    y += 5;
  }
  return y;
}

function getSunDescription(sign: string): string {
  const desc: Record<string, string> = {
    Aries: 'Your Sun in Aries brings bold, pioneering energy — a fierce drumbeat that drives the tempo of your life. You lead with courage, ignite action, and your creative fire burns brightest when charting new territory.',
    Taurus: 'Your Sun in Taurus grounds your identity in sensual beauty and patient persistence. Like a rich bass drone, you provide warmth and stability, finding power in sustained, luxurious tones.',
    Gemini: 'Your Sun in Gemini sparks curiosity and quick-witted dialogue. Your essence is a lively duet of ideas, a call-and-response between wonder and knowledge, always seeking the next fascinating conversation.',
    Cancer: 'Your Sun in Cancer nurtures through deep emotional currents. Like gentle tidal rhythms, your identity flows between protective shores, creating a safe harbour of compassion and memory.',
    Leo: 'Your Sun in Leo radiates theatrical grandeur and creative warmth. You are the orchestral climax — generous, dramatic, and magnificent, commanding the stage with radiant self-expression.',
    Virgo: 'Your Sun in Virgo refines and analyses with elegant precision. Like a carefully articulated passage, your identity finds meaning in detail, service, and the beauty of ordered patterns.',
    Libra: 'Your Sun in Libra seeks harmony, balance, and aesthetic beauty. Your essence is a perfectly resolved chord — diplomatic, graceful, and always striving for symmetrical elegance.',
    Scorpio: 'Your Sun in Scorpio plunges into depths of transformation and intensity. Like a building crescendo from silence to overwhelming power, you embody passion, mystery, and rebirth.',
    Sagittarius: 'Your Sun in Sagittarius yearns for expansive horizons and philosophical truth. Your spirit is an adventurous world-music melody — optimistic, free, and ever-seeking wisdom.',
    Capricorn: 'Your Sun in Capricorn builds with disciplined ambition. Like a methodical ascending scale, you climb steadily toward mastery, finding strength in structure and timeless achievement.',
    Aquarius: 'Your Sun in Aquarius innovates and disrupts with visionary brilliance. Your essence is an unexpected synth shift — humanitarian, eccentric, and ahead of its time.',
    Pisces: 'Your Sun in Pisces dissolves boundaries in a sea of compassion and dreams. Like an ambient ocean of reverb, you feel everything deeply, bridging the material and the mystical.',
  };
  return desc[sign] || `Your Sun in ${sign} shapes the core melody of your identity.`;
}

function getMoonDescription(sign: string): string {
  const desc: Record<string, string> = {
    Aries: 'Your Moon in Aries pulses with impulsive emotional fire. You process feelings through action — fast, direct, and instinctive.',
    Taurus: 'Your Moon in Taurus craves emotional security through sensory comfort. You feel safest in the warmth of familiar textures and steady rhythms.',
    Gemini: 'Your Moon in Gemini processes emotions through communication. Your inner world is a busy conversation — adaptable, curious, and sometimes scattered.',
    Cancer: 'Your Moon in Cancer is at home in the tidal depths of feeling. Intuitive and protective, your emotional nature is profoundly nurturing.',
    Leo: 'Your Moon in Leo needs emotional warmth, recognition, and creative outlet. Your inner world is a stage that craves applause and affection.',
    Virgo: 'Your Moon in Virgo finds emotional comfort in order and usefulness. You process feelings by analysing, fixing, and quietly serving.',
    Libra: 'Your Moon in Libra seeks emotional equilibrium through relationships. Harmony in your environment is essential to your inner peace.',
    Scorpio: 'Your Moon in Scorpio experiences emotions with volcanic intensity. Deep, private, and transformative — you feel to the very core.',
    Sagittarius: 'Your Moon in Sagittarius finds emotional freedom in exploration. Optimistic and restless, you need room to roam and believe.',
    Capricorn: 'Your Moon in Capricorn processes emotions with quiet discipline. You feel deeply but contain it within structures of responsibility.',
    Aquarius: 'Your Moon in Aquarius approaches feelings with detached clarity. Your emotional life is unconventional, idealistic, and fiercely independent.',
    Pisces: 'Your Moon in Pisces absorbs emotions like a sponge in an ocean. Dreamy, compassionate, and boundlessly empathetic.',
  };
  return desc[sign] || `Your Moon in ${sign} colours the emotional undercurrent of your being.`;
}

function getAscDescription(sign: string): string {
  const desc: Record<string, string> = {
    Aries: 'An Aries Ascendant presents you to the world as bold and direct — the opening fanfare that announces your arrival.',
    Taurus: 'A Taurus Ascendant gives you an earthy, grounded presence — calm, beautiful, and reassuringly steady.',
    Gemini: 'A Gemini Ascendant makes you appear quick, sociable, and endlessly curious — a sparkling introduction that promises conversation.',
    Cancer: 'A Cancer Ascendant wraps your outward self in a soft, nurturing glow — approachable, protective, and deeply caring.',
    Leo: 'A Leo Ascendant radiates warmth and confidence — you walk in like the main theme of a grand symphony.',
    Virgo: 'A Virgo Ascendant presents you as composed, helpful, and intelligently understated — precision in every gesture.',
    Libra: 'A Libra Ascendant gives you effortless charm and aesthetic grace — a harmonious first impression.',
    Scorpio: 'A Scorpio Ascendant lends you magnetic intensity — others sense your depth before you speak a word.',
    Sagittarius: 'A Sagittarius Ascendant makes you appear adventurous, jovial, and open — an invitation to explore.',
    Capricorn: 'A Capricorn Ascendant projects authority and quiet ambition — a dignified, purposeful first impression.',
    Aquarius: 'An Aquarius Ascendant makes you seem unique, progressive, and slightly enigmatic — an unexpected opening note.',
    Pisces: 'A Pisces Ascendant softens your outer self with dreamy mystique — ethereal, gentle, and impossible to pin down.',
  };
  return desc[sign] || `Your ${sign} Ascendant shapes the opening note the world first hears.`;
}

function getMusicalTranslation(planet: string, sign: string): string {
  const instruments: Record<string, string> = {
    Sun: 'radiant brass and strings', Moon: 'silver flute and harp', Mercury: 'quick woodwinds and bells',
    Venus: 'lush strings and voice', Mars: 'driving percussion and brass', Jupiter: 'majestic orchestra and organ',
    Saturn: 'deep low strings and bass', Uranus: 'erratic synthesizers', Neptune: 'ethereal choir and pads',
    Pluto: 'subterranean sub-bass',
  };
  const elements: Record<string, string> = {
    Aries: 'fierce staccato', Taurus: 'sustained legato', Gemini: 'playful dialogue', Cancer: 'flowing lullaby',
    Leo: 'grand theatrical', Virgo: 'precise articulation', Libra: 'balanced harmony', Scorpio: 'intense crescendo',
    Sagittarius: 'adventurous world-music', Capricorn: 'structured ascent', Aquarius: 'unexpected electronic shifts',
    Pisces: 'ambient dissolution',
  };
  const inst = instruments[planet] || 'resonant tones';
  const style = elements[sign] || 'celestial expression';
  return `${planet} channels through ${inst}, coloured by the ${style} energy of ${sign}. This voice contributes a distinctive layer to the harmonic fabric of your personal composition.`;
}
