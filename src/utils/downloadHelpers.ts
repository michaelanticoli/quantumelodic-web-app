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

  const bg = () => { pdf.setFillColor(10, 10, 18); pdf.rect(0, 0, W, 297, 'F'); };
  bg();

  // ── Page 1: Cover + chart image ──
  pdf.setFontSize(28);
  pdf.setTextColor(212, 175, 55);
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
      // skip
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

  // ── Page 2: All Planetary Positions + Meanings ──
  pdf.addPage(); bg(); y = M;

  pdf.setFontSize(16);
  pdf.setTextColor(212, 175, 55);
  pdf.text('Planetary Positions & Meanings', M, y);
  y += 10;

  // Table header
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 150);
  pdf.text('PLANET', M, y);
  pdf.text('SIGN', M + 40, y);
  pdf.text('DEGREE', M + 80, y);
  pdf.text('STATUS', M + 110, y);
  y += 2;
  pdf.setDrawColor(60, 60, 80);
  pdf.line(M, y, W - M, y);
  y += 5;

  pdf.setFontSize(9);
  for (const p of chart.planets) {
    const deg = Math.floor(p.degree);
    const min = Math.round((p.degree - deg) * 60);
    const retro = p.isRetrograde ? 'Retrograde ℞' : 'Direct';
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${p.symbol} ${p.name}`, M, y);
    pdf.setTextColor(180, 180, 200);
    pdf.text(p.sign, M + 40, y);
    pdf.text(`${deg}°${min.toString().padStart(2, '0')}'`, M + 80, y);
    pdf.setTextColor(p.isRetrograde ? 200 : 140, p.isRetrograde ? 100 : 160, p.isRetrograde ? 100 : 180);
    pdf.text(retro, M + 110, y);
    y += 6;
  }

  y += 6;

  // Detailed interpretation for EVERY planet
  for (const p of chart.planets) {
    y = ensureSpace(pdf, y, 35, bg);
    
    pdf.setFontSize(11);
    pdf.setTextColor(212, 175, 55);
    y = addWrapped(pdf, `${p.symbol} ${p.name} in ${p.sign}`, M, y, CW, bg);
    
    pdf.setFontSize(9);
    pdf.setTextColor(200, 200, 220);
    y = addWrapped(pdf, getPlanetDescription(p.name, p.sign), M, y, CW, bg);
    
    if (p.isRetrograde) {
      pdf.setTextColor(200, 130, 130);
      y = addWrapped(pdf, getRetrogradeNote(p.name), M, y, CW, bg);
    }
    y += 3;
  }

  // ── Musical Translation Page ──
  pdf.addPage(); bg(); y = M;

  pdf.setFontSize(16);
  pdf.setTextColor(212, 175, 55);
  pdf.text('Musical Translation', M, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 200);
  y = addWrapped(pdf, `Your chart resonates in ${reading.musicalMode}. Each planetary placement contributes a unique voice to your cosmic symphony:`, M, y, CW, bg);
  y += 6;

  for (const p of chart.planets) {
    if (p.name === 'Ascendant') continue;
    y = ensureSpace(pdf, y, 25, bg);
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    y = addWrapped(pdf, `${p.symbol} ${p.name} in ${p.sign}`, M, y, CW, bg);
    pdf.setFontSize(9);
    pdf.setTextColor(160, 160, 180);
    y = addWrapped(pdf, getMusicalTranslation(p.name, p.sign), M, y, CW, bg);
    y += 3;
  }

  // ── Holistic Composition Section ──
  y = ensureSpace(pdf, y, 60, bg);
  pdf.setFontSize(16);
  pdf.setTextColor(212, 175, 55);
  y = addWrapped(pdf, 'The Whole Composition', M, y, CW, bg);
  y += 4;
  
  pdf.setFontSize(10);
  pdf.setTextColor(200, 200, 220);
  y = addWrapped(pdf, getHolisticComposition(reading), M, y, CW, bg);
  y += 4;
  pdf.setTextColor(160, 160, 180);
  y = addWrapped(pdf, getMusicalSummary(reading), M, y, CW, bg);

  // Footer on last page
  y = ensureSpace(pdf, y, 20, bg);
  y = Math.max(y + 10, 280);
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 120);
  pdf.text('Generated by QuantumMelodic · quantumelodic.lovable.app', W / 2, y, { align: 'center' });

  pdf.save(`${reading.birthData.name.replace(/\s+/g, '-').toLowerCase()}-quantumelodic-report.pdf`);
}

// ── Helpers ───────────────────────────────────────────────────────
function ensureSpace(pdf: jsPDF, y: number, needed: number, bg: () => void): number {
  if (y + needed > 282) {
    pdf.addPage(); bg();
    return 15;
  }
  return y;
}

function addWrapped(pdf: jsPDF, text: string, x: number, y: number, maxW: number, bg?: () => void): number {
  const lines = pdf.splitTextToSize(text, maxW) as string[];
  for (const line of lines) {
    if (y > 282) {
      pdf.addPage();
      if (bg) bg(); else { pdf.setFillColor(10, 10, 18); pdf.rect(0, 0, 210, 297, 'F'); }
      y = 15;
    }
    pdf.text(line, x, y);
    y += 5;
  }
  return y;
}

// ── Complete planet descriptions for ALL planets ──────────────────
function getPlanetDescription(planet: string, sign: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    Sun: {
      Aries: 'Your Sun in Aries brings bold, pioneering energy — a fierce drumbeat that drives the tempo of your life. You lead with courage, ignite action, and your creative fire burns brightest when charting new territory.',
      Taurus: 'Your Sun in Taurus grounds your identity in sensual beauty and patient persistence. Like a rich bass drone, you provide warmth and stability, finding power in sustained, luxurious tones.',
      Gemini: 'Your Sun in Gemini sparks curiosity and quick-witted dialogue. Your essence is a lively duet of ideas, a call-and-response between wonder and knowledge.',
      Cancer: 'Your Sun in Cancer nurtures through deep emotional currents. Like gentle tidal rhythms, your identity flows between protective shores, creating a safe harbour of compassion.',
      Leo: 'Your Sun in Leo radiates theatrical grandeur and creative warmth. You are the orchestral climax — generous, dramatic, and commanding the stage with radiant self-expression.',
      Virgo: 'Your Sun in Virgo refines and analyses with elegant precision. Like a carefully articulated passage, your identity finds meaning in detail, service, and ordered patterns.',
      Libra: 'Your Sun in Libra seeks harmony, balance, and aesthetic beauty. Your essence is a perfectly resolved chord — diplomatic, graceful, and striving for symmetrical elegance.',
      Scorpio: 'Your Sun in Scorpio plunges into depths of transformation and intensity. Like a building crescendo from silence to overwhelming power, you embody passion, mystery, and rebirth.',
      Sagittarius: 'Your Sun in Sagittarius yearns for expansive horizons and philosophical truth. Your spirit is an adventurous world-music melody — optimistic, free, and ever-seeking wisdom.',
      Capricorn: 'Your Sun in Capricorn builds with disciplined ambition. Like a methodical ascending scale, you climb steadily toward mastery, finding strength in structure and timeless achievement.',
      Aquarius: 'Your Sun in Aquarius innovates and disrupts with visionary brilliance. Your essence is an unexpected synth shift — humanitarian, eccentric, and ahead of its time.',
      Pisces: 'Your Sun in Pisces dissolves boundaries in a sea of compassion and dreams. Like an ambient ocean of reverb, you feel everything deeply, bridging the material and the mystical.',
    },
    Moon: {
      Aries: 'Your Moon in Aries pulses with impulsive emotional fire. You process feelings through action — fast, direct, and instinctive, like a sudden drum strike.',
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
    },
    Mercury: {
      Aries: 'Mercury in Aries gives you a rapid-fire mind. You think in bold strokes, speak with directness, and your ideas arrive like sudden percussion hits — sharp and decisive.',
      Taurus: 'Mercury in Taurus lends deliberate, methodical thinking. Your mind moves slowly but surely, building ideas like sustained bass notes with rich overtones.',
      Gemini: 'Mercury in Gemini is at home — your mind dances between subjects with quicksilver agility. Communication flows as naturally as a virtuoso improvisation.',
      Cancer: 'Mercury in Cancer filters thought through emotion. Your mind is reflective and intuitive, remembering feelings as vividly as facts.',
      Leo: 'Mercury in Leo thinks dramatically and speaks with authority. Your words carry the weight of a theatrical monologue — warm, creative, and commanding.',
      Virgo: 'Mercury in Virgo is razor-sharp and detail-oriented. Your analytical mind dissects information with the precision of a perfectly executed technical passage.',
      Libra: 'Mercury in Libra weighs every perspective before speaking. Your mind seeks diplomatic balance, crafting words like carefully harmonised chords.',
      Scorpio: 'Mercury in Scorpio penetrates to hidden truths. Your mind is an investigator — probing, intense, and uncovering what lies beneath the surface.',
      Sagittarius: 'Mercury in Sagittarius thinks in grand philosophical arcs. Your mind is a wanderer, connecting distant ideas like a world-music fusion.',
      Capricorn: 'Mercury in Capricorn thinks strategically and practically. Your mind builds structured arguments like ascending scale passages — logical, measured, and effective.',
      Aquarius: 'Mercury in Aquarius produces original, unconventional thoughts. Your mind leaps to innovative conclusions like unexpected key changes.',
      Pisces: 'Mercury in Pisces thinks in images, metaphors, and feelings. Your mind is poetic and intuitive, sometimes struggling to translate its visions into linear words.',
    },
    Venus: {
      Aries: 'Venus in Aries loves passionately and impulsively. In relationships, you are the exciting opening riff — bold, thrilling, and unapologetically direct.',
      Taurus: 'Venus in Taurus revels in sensual pleasure and lasting devotion. Your love language is a warm, sustained chord — loyal, beautiful, and deeply physical.',
      Gemini: 'Venus in Gemini loves through conversation and variety. Your romantic style is a playful duet — witty, flirtatious, and intellectually stimulating.',
      Cancer: 'Venus in Cancer loves with protective, nurturing depth. Your affection is a gentle lullaby — tender, devoted, and emotionally rich.',
      Leo: 'Venus in Leo loves grandly and generously. Your romantic expression is a standing ovation — dramatic, warm, and fiercely loyal.',
      Virgo: 'Venus in Virgo expresses love through thoughtful acts of service. Your affection is a carefully composed piece — modest, precise, and deeply caring.',
      Libra: 'Venus in Libra is the quintessential romantic. Your love style is a perfectly balanced duet — graceful, fair, and aesthetically refined.',
      Scorpio: 'Venus in Scorpio loves with consuming intensity. Your passion is a dark, powerful crescendo — all-or-nothing, deeply bonding, and transformative.',
      Sagittarius: 'Venus in Sagittarius loves freely and adventurously. Your romantic energy is an upbeat world-music jam — optimistic, generous, and expansive.',
      Capricorn: 'Venus in Capricorn loves with patient commitment. Your devotion builds like a slow, dignified movement — reserved at first but profoundly enduring.',
      Aquarius: 'Venus in Aquarius loves unconventionally. Your romantic style is an avant-garde composition — intellectual, independent, and refreshingly unique.',
      Pisces: 'Venus in Pisces loves without boundaries. Your affection is an oceanic ambient wash — selfless, dreamy, and spiritually transcendent.',
    },
    Mars: {
      Aries: 'Mars in Aries is a powerhouse of raw energy. Your drive is a thundering drum solo — fearless, competitive, and explosively assertive.',
      Taurus: 'Mars in Taurus channels energy with stubborn determination. Your willpower is a relentless bass ostinato — slow to start but unstoppable once moving.',
      Gemini: 'Mars in Gemini directs energy through words and ideas. Your assertiveness is a rapid-fire dialogue — versatile, mentally combative, and restless.',
      Cancer: 'Mars in Cancer channels energy through emotional protection. Your drive is a surging tidal rhythm — defensive, tenacious, and fiercely loyal.',
      Leo: 'Mars in Leo asserts with dramatic confidence. Your energy is a roaring brass fanfare — proud, creative, and magnetically commanding.',
      Virgo: 'Mars in Virgo directs energy into precise, useful action. Your drive is a disciplined technical exercise — efficient, methodical, and service-oriented.',
      Libra: 'Mars in Libra channels energy through diplomacy. Your assertiveness is a carefully negotiated harmony — strategic, fair, but sometimes indecisive.',
      Scorpio: 'Mars in Scorpio wields intense, focused power. Your drive is a deep, resonant power chord — strategic, magnetic, and transformatively forceful.',
      Sagittarius: 'Mars in Sagittarius channels energy into exploration. Your drive is an adventurous, galloping rhythm — enthusiastic, restless, and idealistic.',
      Capricorn: 'Mars in Capricorn is disciplined, strategic power. Your energy is a commanding march — ambitious, patient, and relentlessly climbing upward.',
      Aquarius: 'Mars in Aquarius channels energy into revolutionary action. Your drive is an erratic, electrifying synth riff — unconventional and collectively focused.',
      Pisces: 'Mars in Pisces directs energy through imagination and compassion. Your drive is a gentle, flowing current — subtle, inspired, and sometimes diffuse.',
    },
    Jupiter: {
      Aries: 'Jupiter in Aries expands through bold initiative. Your growth comes from courageous leaps — like a soaring brass melody that opens new musical frontiers.',
      Taurus: 'Jupiter in Taurus expands through material abundance. Your blessings manifest as rich, sustaining harmony — slow growth that yields lasting wealth.',
      Gemini: 'Jupiter in Gemini expands through knowledge and communication. Your wisdom multiplies through dialogue, like an ever-branching musical fugue.',
      Cancer: 'Jupiter in Cancer expands through emotional generosity. Your growth flows from nurturing — like a warm orchestral swell that comforts all who hear it.',
      Leo: 'Jupiter in Leo expands through creative expression and generosity. Your abundance is a grand symphonic theme — magnanimous, joyful, and inspiring.',
      Virgo: 'Jupiter in Virgo expands through service and practical wisdom. Your growth comes from meticulous improvement — like a composer perfecting every note.',
      Libra: 'Jupiter in Libra expands through partnership and justice. Your abundance flows from balanced relationships — like a perfectly tuned ensemble.',
      Scorpio: 'Jupiter in Scorpio expands through depth and transformation. Your growth comes from fearless exploration of the hidden — like discovering a new harmonic series in darkness.',
      Sagittarius: 'Jupiter in Sagittarius is at home — expanding through philosophy, travel, and truth-seeking. Your wisdom is an epic, far-reaching orchestral journey.',
      Capricorn: 'Jupiter in Capricorn expands through disciplined achievement. Your growth is structured and earned — like mastering a complex classical composition through years of practice.',
      Aquarius: 'Jupiter in Aquarius expands through innovation and humanitarian vision. Your abundance flows from collective progress — like a revolutionary new genre of music.',
      Pisces: 'Jupiter in Pisces expands through compassion and spiritual connection. Your growth is boundless and mystical — like an infinite, oceanic ambient composition.',
    },
    Saturn: {
      Aries: 'Saturn in Aries tests your independence and courage. This placement demands you learn to lead with discipline — turning raw impulse into structured, sustainable action.',
      Taurus: 'Saturn in Taurus tests your relationship with material security. You are learning that true stability comes from inner resources, not external possessions.',
      Gemini: 'Saturn in Gemini demands mental discipline. You are learning to focus your scattered thoughts into clear, structured communication — depth over breadth.',
      Cancer: 'Saturn in Cancer tests emotional boundaries. You are learning to balance nurturing others with protecting your own emotional wellbeing.',
      Leo: 'Saturn in Leo tests your creative confidence. You are learning that authentic self-expression requires vulnerability and the courage to be seen.',
      Virgo: 'Saturn in Virgo demands perfection through practice. You are learning that true service comes from accepting imperfection while still striving for excellence.',
      Libra: 'Saturn in Libra tests your relationships and sense of fairness. You are learning that real harmony requires difficult conversations and firm boundaries.',
      Scorpio: 'Saturn in Scorpio tests your willingness to transform. You are learning to face your deepest fears and emerge with hard-won wisdom and unshakeable power.',
      Sagittarius: 'Saturn in Sagittarius tests your beliefs and philosophical foundations. You are learning to ground your optimism in realistic wisdom.',
      Capricorn: 'Saturn in Capricorn is at home — demanding mastery through patient, sustained effort. Your lessons are about true authority, earned through integrity and perseverance.',
      Aquarius: 'Saturn in Aquarius tests your ideals against reality. You are learning to build lasting structures for collective progress, not just dream about them.',
      Pisces: 'Saturn in Pisces tests your spiritual boundaries. You are learning to ground your compassion in practical reality without losing your mystical connection.',
    },
    Uranus: {
      Aries: 'Uranus in Aries brings sudden, revolutionary change to identity. Your generation pioneers radical new forms of individual expression.',
      Taurus: 'Uranus in Taurus revolutionises values and material systems. Your generation is disrupting finance, agriculture, and our relationship with the physical world.',
      Gemini: 'Uranus in Gemini transforms communication and thought. New ideas about language, media, and information exchange emerge rapidly.',
      Cancer: 'Uranus in Cancer revolutionises home, family, and emotional structures. Traditional domestic frameworks are reimagined.',
      Leo: 'Uranus in Leo brings creative revolution. Radical new forms of self-expression, art, and entertainment redefine what it means to create.',
      Virgo: 'Uranus in Virgo transforms health, work, and daily systems. New approaches to wellness and service emerge with startling innovation.',
      Libra: 'Uranus in Libra revolutionises relationships and social justice. Traditional partnership structures are challenged and reimagined.',
      Scorpio: 'Uranus in Scorpio transforms the hidden and taboo. Power structures, psychology, and sexuality are radically reimagined by your generation.',
      Sagittarius: 'Uranus in Sagittarius brings revolution to belief systems and global perspectives. Your generation expands horizons through technology and cultural cross-pollination.',
      Capricorn: 'Uranus in Capricorn transforms institutions and authority structures. Traditional hierarchies are disrupted and rebuilt from the ground up.',
      Aquarius: 'Uranus in Aquarius is at home — amplifying innovation, technology, and collective consciousness. Your generation leads the digital and social revolution.',
      Pisces: 'Uranus in Pisces transforms spirituality and collective imagination. New forms of mysticism, art, and compassionate awareness emerge.',
    },
    Neptune: {
      Aries: 'Neptune in Aries dissolves boundaries around individual identity. Spiritual warriors emerge, blending action with transcendence.',
      Taurus: 'Neptune in Taurus dissolves material illusions. Your generation redefines value, beauty, and our relationship with nature and resources.',
      Gemini: 'Neptune in Gemini dissolves boundaries in communication. Language, media, and information become more fluid and imaginative.',
      Cancer: 'Neptune in Cancer idealises home and emotional connection. Your generation yearns for a sense of belonging that transcends the ordinary.',
      Leo: 'Neptune in Leo dissolves boundaries in creative expression. Art, entertainment, and romance are infused with glamour and illusion.',
      Virgo: 'Neptune in Virgo idealises service and health. Your generation seeks spiritual meaning through practical work and holistic wellness.',
      Libra: 'Neptune in Libra dissolves boundaries in relationships. Your generation idealises love, beauty, and partnership to an almost mythic degree.',
      Scorpio: 'Neptune in Scorpio dissolves boundaries around hidden power. Your generation explores psychology, sexuality, and the occult with imaginative depth.',
      Sagittarius: 'Neptune in Sagittarius dissolves boundaries in belief. Your generation experiences a spiritual expansion, blending diverse traditions into new spiritual forms.',
      Capricorn: 'Neptune in Capricorn dissolves boundaries in institutions. Idealism meets pragmatism as your generation reimagines how society is structured.',
      Aquarius: 'Neptune in Aquarius dissolves boundaries in collective consciousness. Technology and spirituality merge, creating new forms of shared experience.',
      Pisces: 'Neptune in Pisces is at home — dissolving all boundaries in a vast ocean of compassion, imagination, and spiritual awakening.',
    },
    Pluto: {
      Aries: 'Pluto in Aries transforms the very nature of identity and self-assertion. Deep, primal power is channeled through individual will.',
      Taurus: 'Pluto in Taurus transforms material values and resources at the deepest level. Economic and environmental structures face profound, irreversible change.',
      Gemini: 'Pluto in Gemini transforms communication and thought at a fundamental level. Information becomes both a source of power and transformation.',
      Cancer: 'Pluto in Cancer transforms family structures and emotional foundations. Deep ancestral patterns are brought to the surface for healing.',
      Leo: 'Pluto in Leo transforms creative power and self-expression. The Will itself becomes the instrument of profound, generational change.',
      Virgo: 'Pluto in Virgo transforms work, health, and daily life. Your generation has profoundly restructured how we think about wellness and service.',
      Libra: 'Pluto in Libra transforms relationships and social contracts. Marriage, partnership, and justice undergo deep, generational metamorphosis.',
      Scorpio: 'Pluto in Scorpio is at home — transforming power, death, sexuality, and the hidden with volcanic intensity. Your generation confronts the shadow.',
      Sagittarius: 'Pluto in Sagittarius transforms belief systems, religion, and global culture. Dogma crumbles as your generation demands authentic truth.',
      Capricorn: 'Pluto in Capricorn transforms institutions, governments, and authority structures. The old order is being dismantled and rebuilt from its foundations.',
      Aquarius: 'Pluto in Aquarius transforms collective consciousness and technology. Your generation wields unprecedented power through networks, AI, and social movements.',
      Pisces: 'Pluto in Pisces will dissolve and regenerate spiritual and artistic paradigms. The deepest collective healing awaits.',
    },
    Ascendant: {
      Aries: 'An Aries Ascendant presents you as bold and direct — the opening fanfare that announces your arrival with unmistakable energy.',
      Taurus: 'A Taurus Ascendant gives you an earthy, grounded presence — calm, beautiful, and reassuringly steady, like a deep sustained note.',
      Gemini: 'A Gemini Ascendant makes you appear quick, sociable, and endlessly curious — a sparkling introduction that promises conversation.',
      Cancer: 'A Cancer Ascendant wraps your outward self in a soft, nurturing glow — approachable, protective, and deeply caring.',
      Leo: 'A Leo Ascendant radiates warmth and confidence — you walk in like the main theme of a grand symphony.',
      Virgo: 'A Virgo Ascendant presents you as composed, helpful, and intelligently understated — precision in every gesture.',
      Libra: 'A Libra Ascendant gives you effortless charm and aesthetic grace — a harmonious first impression that disarms.',
      Scorpio: 'A Scorpio Ascendant lends you magnetic intensity — others sense your depth before you speak a word.',
      Sagittarius: 'A Sagittarius Ascendant makes you appear adventurous, jovial, and open — an invitation to explore.',
      Capricorn: 'A Capricorn Ascendant projects authority and quiet ambition — a dignified, purposeful first impression.',
      Aquarius: 'An Aquarius Ascendant makes you seem unique, progressive, and slightly enigmatic — an unexpected opening note.',
      Pisces: 'A Pisces Ascendant softens your outer self with dreamy mystique — ethereal, gentle, and impossible to pin down.',
    },
  };

  return descriptions[planet]?.[sign] || `${planet} in ${sign} adds a distinctive voice to your chart, contributing its unique frequency to the overall harmonic picture.`;
}

function getRetrogradeNote(planet: string): string {
  const notes: Record<string, string> = {
    Mercury: '℞ Mercury retrograde invites you to slow your mental tempo — revisit, reflect, and refine your communication before pressing forward.',
    Venus: '℞ Venus retrograde turns your attention inward on matters of love and value. Old relationships or aesthetic choices resurface for re-evaluation.',
    Mars: '℞ Mars retrograde redirects your energy inward. Physical drive may feel muted, but inner resolve and strategic planning are strengthened.',
    Jupiter: '℞ Jupiter retrograde invites inner expansion. External growth slows while spiritual and philosophical deepening accelerates.',
    Saturn: '℞ Saturn retrograde turns karmic lessons inward. You may revisit old responsibilities and restructure your relationship with discipline.',
    Uranus: '℞ Uranus retrograde directs revolutionary energy inward. Internal breakthroughs and personal liberation take precedence over external rebellion.',
    Neptune: '℞ Neptune retrograde clarifies spiritual illusions. Dreams become more vivid and intuition sharpens as the fog of escapism lifts.',
    Pluto: '℞ Pluto retrograde deepens internal transformation. Subconscious power dynamics and buried truths rise to the surface for integration.',
  };
  return notes[planet] || `℞ ${planet} retrograde slows and internalises the planet's expression, inviting deeper reflection.`;
}

function getMusicalTranslation(planet: string, sign: string): string {
  const instruments: Record<string, string> = {
    Sun: 'radiant brass and strings, carrying the central melody',
    Moon: 'silver flute and harp, weaving the emotional undertow',
    Mercury: 'quick woodwinds and bells, articulating the rhythmic dialogue',
    Venus: 'lush strings and voice, singing the harmonic sweetness',
    Mars: 'driving percussion and distorted brass, pounding the rhythmic pulse',
    Jupiter: 'majestic organ and full orchestra, expanding the harmonic range',
    Saturn: 'deep cello, bass clarinet, and low strings, anchoring the structure',
    Uranus: 'erratic synthesizers and electronic glitches, disrupting the pattern',
    Neptune: 'ethereal choir, reverb-drenched pads, and ambient washes',
    Pluto: 'subterranean sub-bass and industrial drones, rumbling beneath everything',
  };
  const elements: Record<string, string> = {
    Aries: 'fierce staccato attack and driving tempo',
    Taurus: 'sustained legato warmth and rich lower harmonics',
    Gemini: 'playful call-and-response dialogue and rapid ornamentation',
    Cancer: 'flowing lullaby phrasing and gentle dynamic swells',
    Leo: 'grand theatrical dynamics with dramatic crescendos',
    Virgo: 'precise, clean articulation and intricate counterpoint',
    Libra: 'balanced harmonic voicings and elegant resolution',
    Scorpio: 'intense crescendo from whisper to overwhelming power',
    Sagittarius: 'adventurous world-music motifs and wide intervallic leaps',
    Capricorn: 'structured ascending passages with formal discipline',
    Aquarius: 'unexpected electronic shifts and asymmetric time signatures',
    Pisces: 'ambient dissolution into infinite reverb and soft dissonance',
  };
  const inst = instruments[planet] || 'resonant tones';
  const style = elements[sign] || 'celestial expression';
  return `${planet} channels through ${inst}, coloured by ${style}. This voice contributes a distinctive layer to the harmonic fabric of your personal composition.`;
}

// ── Holistic whole-composition description ────────────────────────
function getHolisticComposition(reading: CosmicReading): string {
  const chart = reading.chartData;
  const planetNames = chart.planets.filter(p => p.name !== 'Ascendant').map(p => p.name);
  const retroCount = chart.planets.filter(p => p.isRetrograde).length;
  
  // Count elements
  const elements: Record<string, number> = {};
  const signElements: Record<string, string> = {
    Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
    Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
    Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
  };
  chart.planets.forEach(p => {
    const el = signElements[p.sign];
    if (el) elements[el] = (elements[el] || 0) + 1;
  });
  const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1]);
  const domEl = dominant[0]?.[0] || 'Fire';
  
  const elementSounds: Record<string, string> = {
    Fire: 'The dominant Fire element drives the overall energy with fast tempos, bright timbres, and assertive rhythmic patterns. Expect bold brass flourishes, percussive accents, and an ever-forward momentum.',
    Earth: 'The dominant Earth element grounds the composition in rich, sustained harmonies and deliberate pacing. Deep bass lines, warm string pads, and a steady, unhurried pulse form the foundation.',
    Air: 'The dominant Air element lifts the composition into light, agile textures. Quick melodic exchanges, crystalline bell tones, and an airy, spacious production style define the sonic landscape.',
    Water: 'The dominant Water element saturates the composition with emotional depth and flowing dynamics. Lush reverb, gentle swells, and haunting vocal-like passages create an immersive, oceanic soundscape.',
  };

  let text = `Imagine a living composition for ${planetNames.length} instruments, each representing a planet in your chart. `;
  text += `Your central melody — the Sun in ${chart.sunSign} — establishes the key and character, while the Moon in ${chart.moonSign} provides the emotional undercurrent that colours every phrase. `;
  text += `The Ascendant in ${chart.ascendant} sets the opening tone, the first impression the listener receives. `;
  text += elementSounds[domEl] || '';
  
  if (retroCount > 0) {
    text += ` ${retroCount} retrograde planet${retroCount > 1 ? 's' : ''} add${retroCount === 1 ? 's' : ''} introspective passages — moments where the music turns inward, replaying earlier themes with new meaning.`;
  }

  return text;
}

function getMusicalSummary(reading: CosmicReading): string {
  const chart = reading.chartData;
  let text = `When all voices sound together in ${reading.musicalMode}, the result is a unique sonic signature: `;
  
  const inner = chart.planets.filter(p => ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(p.name));
  const outer = chart.planets.filter(p => ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(p.name));
  
  text += `The inner planets (${inner.map(p => p.name).join(', ')}) form the foreground — the melodies, rhythms, and harmonies you hear most clearly in daily life. `;
  text += `The outer planets (${outer.map(p => p.name).join(', ')}) provide the deep architecture — the key changes, structural movements, and generational themes that unfold over years and decades. `;
  text += `Together, they create a composition that is entirely yours: unrepeatable, constantly evolving, and profoundly beautiful. This is the music of your cosmos.`;
  
  return text;
}