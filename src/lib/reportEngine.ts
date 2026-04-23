/**
 * MoonTuner Lunar Report Engine
 * Calls the existing calculate-chart edge function, then derives:
 * - powerDays: monthly power day cards
 * - natal: archetype header data
 * - peakSummary: three peak windows
 * - arcPractice: section three ritual/practice
 */

import type { ChartData, PlanetPosition } from '@/types/astrology';
import { getPlacementMusic } from '@/data/mergedHousesLookup';
import { RequestTimeoutError } from '@/lib/fetchWithTimeout';
import { calculateChartData } from '@/lib/chartService';

const CHART_REQUEST_TIMEOUT_MS = 25_000;

// ── Types ──────────────────────────────────────────────────────────────────

export interface PowerDay {
  month: string;
  day: number;
  year: number;
  power: number;       // 1-10
  keyword: string;
  description: string;
}

export interface NatalArchetype {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  element: string;
  modality: string;
  archetype: string;
  mantra: string;
  musicalMode: string;
}

export interface PeakLine {
  label: string;
  date: string;
  insight: string;
}

export interface PeakSummary {
  peakLines: PeakLine[];
}

export interface ArcPractice {
  title: string;
  intention: string;
  steps: string[];
  closingNote: string;
}

export interface PlacementInsight {
  planet: string;
  sign: string;
  house: string;
  definition: string;
  musicalExpression: string;
}

export interface LunarReport {
  powerDays: PowerDay[];
  natal: NatalArchetype;
  peakSummary: PeakSummary;
  arcPractice: ArcPractice;
  chartData: ChartData;
  placements: PlacementInsight[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
  Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
  Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
};

const MODALITIES: Record<string, string> = {
  Aries: 'Cardinal', Taurus: 'Fixed', Gemini: 'Mutable', Cancer: 'Cardinal',
  Leo: 'Fixed', Virgo: 'Mutable', Libra: 'Cardinal', Scorpio: 'Fixed',
  Sagittarius: 'Mutable', Capricorn: 'Cardinal', Aquarius: 'Fixed', Pisces: 'Mutable',
};

const ARCHETYPES: Record<string, string> = {
  Aries: 'The Warrior', Taurus: 'The Steward', Gemini: 'The Messenger',
  Cancer: 'The Nurturer', Leo: 'The Sovereign', Virgo: 'The Analyst',
  Libra: 'The Diplomat', Scorpio: 'The Alchemist', Sagittarius: 'The Explorer',
  Capricorn: 'The Architect', Aquarius: 'The Visionary', Pisces: 'The Mystic',
};

const MANTRAS: Record<string, string> = {
  Aries: 'I ignite. I lead. I begin.',
  Taurus: 'I cultivate. I sustain. I embody.',
  Gemini: 'I connect. I learn. I express.',
  Cancer: 'I feel. I protect. I nourish.',
  Leo: 'I create. I shine. I inspire.',
  Virgo: 'I refine. I serve. I integrate.',
  Libra: 'I balance. I relate. I harmonize.',
  Scorpio: 'I transform. I penetrate. I regenerate.',
  Sagittarius: 'I seek. I expand. I believe.',
  Capricorn: 'I build. I master. I endure.',
  Aquarius: 'I innovate. I liberate. I envision.',
  Pisces: 'I dissolve. I dream. I transcend.',
};

const MODES: Record<string, string> = {
  Aries: 'A Phrygian', Taurus: 'F Ionian', Gemini: 'G Mixolydian',
  Cancer: 'A Aeolian', Leo: 'D Lydian', Virgo: 'D Dorian',
  Libra: 'B♭ Ionian', Scorpio: 'B Locrian', Sagittarius: 'E Mixolydian',
  Capricorn: 'C Dorian', Aquarius: 'F♯ Lydian', Pisces: 'E Phrygian',
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const POWER_KEYWORDS = [
  'Initiation', 'Grounding', 'Expression', 'Reflection', 'Radiance',
  'Refinement', 'Connection', 'Transformation', 'Expansion', 'Mastery',
  'Liberation', 'Transcendence', 'Revelation', 'Synthesis', 'Awakening',
  'Courage', 'Patience', 'Clarity', 'Intuition', 'Vitality',
  'Devotion', 'Wisdom', 'Flow', 'Resolve', 'Surrender',
  'Alignment', 'Breakthrough', 'Harmony', 'Rebirth', 'Abundance',
];

const POWER_DESCRIPTIONS: Record<string, string[]> = {
  Fire: [
    'A surge of creative fire — act boldly on your deepest desire.',
    'Your inner flame burns brightest; channel it into a passion project.',
    'Raw energy peaks — physical movement and decisive action are favored.',
    'Inspiration strikes like lightning; capture ideas before they fade.',
  ],
  Earth: [
    'Ground your vision into tangible form — practical steps yield lasting results.',
    'Material abundance flows when you align effort with patience.',
    'Build something that endures — your foundations are unusually strong today.',
    'Sensory awareness heightens; trust what your body tells you.',
  ],
  Water: [
    'Emotional currents run deep — honor your feelings as navigation tools.',
    'Intuition peaks; the answers you seek arrive through dreams and stillness.',
    'A wave of compassion opens doors to profound connection.',
    'Release what no longer serves — let the tide carry it away.',
  ],
  Air: [
    'Mental clarity sharpens — communicate your truth with precision.',
    'Unexpected connections and ideas cross-pollinate; stay curious.',
    'Social currents accelerate; networking yields surprising alliances.',
    'Detach from outcome and observe — perspective is your superpower today.',
  ],
};

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}

function derivePowerDays(chart: ChartData, birthDate: Date): PowerDay[] {
  const seed = chart.planets.reduce((acc, p) => acc + Math.floor(p.degree * 100), 0);
  const rand = seededRand(seed);
  const sunElement = ELEMENTS[chart.sunSign] || 'Fire';
  const moonElement = ELEMENTS[chart.moonSign] || 'Water';
  const elements = [sunElement, moonElement];

  const year = birthDate.getFullYear();
  const month = birthDate.getMonth();
  const days: PowerDay[] = [];

  // Generate 12 power days spread across the year starting from birth month
  for (let i = 0; i < 12; i++) {
    const m = (month + i) % 12;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const day = Math.max(1, Math.min(daysInMonth, Math.floor(rand() * daysInMonth) + 1));
    const power = Math.floor(rand() * 5) + 6; // 6-10
    const el = elements[i % elements.length];
    const descs = POWER_DESCRIPTIONS[el] || POWER_DESCRIPTIONS.Fire;
    const keyword = POWER_KEYWORDS[(seed + i * 7) % POWER_KEYWORDS.length];

    days.push({
      month: MONTH_NAMES[m],
      day,
      year,
      power,
      keyword,
      description: descs[i % descs.length],
    });
  }

  return days;
}

function deriveNatal(chart: ChartData): NatalArchetype {
  return {
    sunSign: chart.sunSign,
    moonSign: chart.moonSign,
    ascendant: chart.ascendant,
    element: ELEMENTS[chart.sunSign] || 'Fire',
    modality: MODALITIES[chart.sunSign] || 'Cardinal',
    archetype: ARCHETYPES[chart.sunSign] || 'The Seeker',
    mantra: MANTRAS[chart.sunSign] || 'I am.',
    musicalMode: MODES[chart.sunSign] || 'C Ionian',
  };
}

function derivePeakSummary(chart: ChartData, birthDate: Date): PeakSummary {
  const seed = chart.planets.reduce((acc, p) => acc + Math.floor(p.degree), 0);
  const rand = seededRand(seed + 999);
  const year = birthDate.getFullYear();

  const peaks: PeakLine[] = [
    {
      label: 'Creative Apex',
      date: `${MONTH_NAMES[Math.floor(rand() * 12)]} ${Math.floor(rand() * 28) + 1}`,
      insight: `Your ${chart.sunSign} sun aligns with ${chart.planets[1]?.name || 'Moon'} energy — a window for bold creative expression and self-authorship.`,
    },
    {
      label: 'Emotional Tide',
      date: `${MONTH_NAMES[Math.floor(rand() * 12)]} ${Math.floor(rand() * 28) + 1}`,
      insight: `${chart.moonSign} moon depths surface — ideal for inner work, journaling, and recalibrating your emotional compass.`,
    },
    {
      label: 'Integration Gate',
      date: `${MONTH_NAMES[Math.floor(rand() * 12)]} ${Math.floor(rand() * 28) + 1}`,
      insight: `${chart.ascendant} rising meets the outer planets — a powerful threshold for synthesizing lessons and stepping into your next chapter.`,
    },
  ];

  return { peakLines: peaks };
}

function deriveArcPractice(chart: ChartData): ArcPractice {
  const el = ELEMENTS[chart.sunSign] || 'Fire';
  const practices: Record<string, ArcPractice> = {
    Fire: {
      title: 'The Flame Meditation',
      intention: 'To channel your innate fire into focused, sustainable creative power.',
      steps: [
        'Light a candle and sit in stillness for 3 minutes, watching the flame.',
        'Visualize your core intention as a golden ember in your solar plexus.',
        'With each exhale, imagine the ember growing — not raging, but steady and warm.',
        'Write one bold action you will take this week. Seal it with the candle wax.',
      ],
      closingNote: 'Fire signs create by doing. Your practice is one of directed will.',
    },
    Earth: {
      title: 'The Grounding Ritual',
      intention: 'To root your vision in the physical world and trust the pace of nature.',
      steps: [
        'Place your bare feet on earth, stone, or wood for 5 minutes.',
        'Hold a stone or crystal and breathe deeply — feel its weight as your anchor.',
        'Name three things you are building. Speak them aloud to the ground.',
        'Plant a seed or tend a living thing as an act of devotion to process.',
      ],
      closingNote: 'Earth signs manifest through patience. Your practice is one of embodied trust.',
    },
    Water: {
      title: 'The Tidal Journal',
      intention: 'To honor your emotional intelligence and transform feeling into insight.',
      steps: [
        'Fill a bowl with water and place it before you as a mirror.',
        'Free-write for 7 minutes without stopping — let the current flow uncensored.',
        'Read your words back. Circle the sentence that surprises you most.',
        'Pour the water outside or into a plant — releasing what you have processed.',
      ],
      closingNote: 'Water signs heal through feeling. Your practice is one of sacred release.',
    },
    Air: {
      title: 'The Clarity Breathwork',
      intention: 'To clear mental clutter and access your highest perspective.',
      steps: [
        'Sit tall. Inhale for 4 counts, hold for 4, exhale for 8. Repeat 6 times.',
        'With eyes closed, imagine yourself rising above your life — seeing it from altitude.',
        'Ask one question. Listen for the first word or image that arrives.',
        'Write a single clear sentence capturing your insight. Share it with one person.',
      ],
      closingNote: 'Air signs evolve through perspective. Your practice is one of illuminated thought.',
    },
  };

  return practices[el] || practices.Fire;
}

// ── Main Export ─────────────────────────────────────────────────────────────

export async function generateReport(
  birthDate: string,  // 'YYYY-MM-DD'
  birthTime: string,  // 'HH:MM'
  location: string,   // 'City, Country'
): Promise<LunarReport> {
  try {
    const chartData = await calculateChartData({
      date: birthDate,
      time: birthTime,
      location,
    }, CHART_REQUEST_TIMEOUT_MS);
    const date = new Date(birthDate);

    // 2. Derive all report sections deterministically from chart
    const powerDays = derivePowerDays(chartData, date);
    const natal = deriveNatal(chartData);
    const peakSummary = derivePeakSummary(chartData, date);
    const arcPractice = deriveArcPractice(chartData);

    // 3. Enrich with placement-specific musical expressions from canonical dataset
    const HOUSE_NAMES = ['1st house','2nd house','3rd house','4th house','5th house','6th house',
      '7th house','8th house','9th house','10th house','11th house','12th house'];
    const placements: PlacementInsight[] = [];
    for (const planet of chartData.planets) {
      // Derive approximate house from degree (simplified whole-sign houses)
      const houseIdx = Math.floor(planet.degree / 30) % 12;
      const house = HOUSE_NAMES[houseIdx];
      const match = getPlacementMusic(planet.name, planet.sign, house);
      if (match) {
        placements.push({
          planet: planet.name,
          sign: planet.sign,
          house,
          definition: match.definition,
          musicalExpression: match.musicalExpression,
        });
      }
    }

    return { powerDays, natal, peakSummary, arcPractice, chartData, placements };
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      throw new Error('Chart generation timed out. Please use a more specific location or try again shortly.');
    }

    throw error;
  }
}
