-- QuantumMelodic Mapping Tables
-- Comprehensive astrological-to-musical translation system

-- Planet mappings: frequency, instruments, harmonic qualities
CREATE TABLE public.qm_planets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  symbol TEXT NOT NULL,
  frequency_hz NUMERIC NOT NULL,
  octave INTEGER NOT NULL DEFAULT 4,
  note TEXT NOT NULL,
  instrument TEXT NOT NULL,
  timbre TEXT NOT NULL,
  harmonic_quality TEXT NOT NULL,
  archetypal_energy TEXT NOT NULL,
  sonic_character TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Zodiac sign mappings: modes, keys, textures
CREATE TABLE public.qm_signs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  symbol TEXT NOT NULL,
  element TEXT NOT NULL,
  modality TEXT NOT NULL,
  musical_mode TEXT NOT NULL,
  key_signature TEXT NOT NULL,
  tempo_bpm INTEGER NOT NULL,
  texture TEXT NOT NULL,
  emotional_quality TEXT NOT NULL,
  sonic_palette TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Aspect mappings: harmonic intervals, tension/resolution
CREATE TABLE public.qm_aspects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  symbol TEXT NOT NULL,
  angle INTEGER NOT NULL,
  orb INTEGER NOT NULL DEFAULT 8,
  harmonic_interval TEXT NOT NULL,
  consonance TEXT NOT NULL,
  tension_level INTEGER NOT NULL,
  sonic_expression TEXT NOT NULL,
  musical_effect TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- House mappings: life domains, tonal areas
CREATE TABLE public.qm_houses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  tonal_area TEXT NOT NULL,
  dynamic TEXT NOT NULL,
  frequency_range TEXT NOT NULL,
  expression TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read access (reference data)
ALTER TABLE public.qm_planets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qm_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qm_aspects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qm_houses ENABLE ROW LEVEL SECURITY;

-- Public read policies for all reference tables
CREATE POLICY "Public read access for planets" ON public.qm_planets FOR SELECT USING (true);
CREATE POLICY "Public read access for signs" ON public.qm_signs FOR SELECT USING (true);
CREATE POLICY "Public read access for aspects" ON public.qm_aspects FOR SELECT USING (true);
CREATE POLICY "Public read access for houses" ON public.qm_houses FOR SELECT USING (true);

-- Seed planet data with QuantumMelodic mappings
INSERT INTO public.qm_planets (name, symbol, frequency_hz, octave, note, instrument, timbre, harmonic_quality, archetypal_energy, sonic_character) VALUES
  ('Sun', '☉', 126.22, 4, 'B', 'Brass/Strings', 'Warm, radiant', 'Major triads', 'Vitality, identity, creative force', 'Golden sustained tones with harmonic overtones'),
  ('Moon', '☽', 210.42, 4, 'G#', 'Silver flute/Harp', 'Ethereal, reflective', 'Minor seconds, fluid arpeggios', 'Emotion, intuition, the subconscious', 'Gentle wavering tones, tidal rhythms'),
  ('Mercury', '☿', 141.27, 5, 'C#', 'Woodwinds/Bells', 'Quick, mercurial', 'Chromatic runs, staccato', 'Communication, thought, connection', 'Rapid articulations, glittering passages'),
  ('Venus', '♀', 221.23, 4, 'A', 'Strings/Voice', 'Lush, sensual', 'Major sixths, sweet intervals', 'Love, beauty, harmony, values', 'Smooth legato, rich harmonics'),
  ('Mars', '♂', 144.72, 3, 'D', 'Percussion/Brass', 'Sharp, driving', 'Tritones, power chords', 'Action, desire, assertion', 'Aggressive rhythms, metallic strikes'),
  ('Jupiter', '♃', 183.58, 3, 'F#', 'Orchestra/Organ', 'Expansive, majestic', 'Perfect fifths, major sevenths', 'Growth, wisdom, abundance', 'Grand swelling crescendos'),
  ('Saturn', '♄', 147.85, 2, 'D', 'Low strings/Bass', 'Heavy, structured', 'Minor intervals, drones', 'Discipline, time, limitations', 'Deep sustained bass, slow tempos'),
  ('Uranus', '♅', 207.36, 5, 'G#', 'Synthesizer/Electric', 'Erratic, electric', 'Dissonant clusters, glitches', 'Innovation, disruption, awakening', 'Sudden bursts, electronic artifacts'),
  ('Neptune', '♆', 211.44, 4, 'G#', 'Choir/Pads', 'Dissolving, transcendent', 'Suspended chords, washes', 'Dreams, spirituality, illusion', 'Ambient textures, reverb trails'),
  ('Pluto', '♇', 140.25, 1, 'C#', 'Sub-bass/Noise', 'Dark, transformative', 'Diminished, atonal', 'Power, death/rebirth, the shadow', 'Subterranean rumbles, intensity builds');

-- Seed zodiac sign data
INSERT INTO public.qm_signs (name, symbol, element, modality, musical_mode, key_signature, tempo_bpm, texture, emotional_quality, sonic_palette) VALUES
  ('Aries', '♈', 'Fire', 'Cardinal', 'Phrygian', 'A minor', 140, 'Staccato, percussive', 'Bold, impulsive, pioneering', 'Brass fanfares, driving drums'),
  ('Taurus', '♉', 'Earth', 'Fixed', 'Ionian', 'F major', 72, 'Legato, sustained', 'Sensual, grounded, patient', 'Rich strings, pastoral woodwinds'),
  ('Gemini', '♊', 'Air', 'Mutable', 'Mixolydian', 'G major', 120, 'Alternating, dialogic', 'Curious, versatile, witty', 'Duets, call-response patterns'),
  ('Cancer', '♋', 'Water', 'Cardinal', 'Aeolian', 'A minor', 66, 'Flowing, circular', 'Nurturing, protective, emotional', 'Gentle waves, lullaby motifs'),
  ('Leo', '♌', 'Fire', 'Fixed', 'Lydian', 'D major', 108, 'Grand, theatrical', 'Creative, dramatic, generous', 'Orchestral flourishes, fanfares'),
  ('Virgo', '♍', 'Earth', 'Mutable', 'Dorian', 'D minor', 96, 'Precise, detailed', 'Analytical, modest, helpful', 'Clean articulation, ordered patterns'),
  ('Libra', '♎', 'Air', 'Cardinal', 'Ionian', 'Bb major', 88, 'Balanced, harmonic', 'Diplomatic, aesthetic, just', 'Symmetrical phrases, sweet harmonies'),
  ('Scorpio', '♏', 'Water', 'Fixed', 'Locrian', 'B locrian', 76, 'Intense, layered', 'Passionate, secretive, transformative', 'Deep drones, building intensity'),
  ('Sagittarius', '♐', 'Fire', 'Mutable', 'Mixolydian', 'E major', 132, 'Expansive, adventurous', 'Optimistic, philosophical, free', 'World music influences, open fifths'),
  ('Capricorn', '♑', 'Earth', 'Cardinal', 'Dorian', 'C minor', 84, 'Structured, ascending', 'Ambitious, disciplined, practical', 'Methodical builds, bass foundations'),
  ('Aquarius', '♒', 'Air', 'Fixed', 'Lydian', 'F# major', 116, 'Unconventional, electronic', 'Innovative, humanitarian, detached', 'Synth textures, unexpected shifts'),
  ('Pisces', '♓', 'Water', 'Mutable', 'Phrygian', 'E phrygian', 60, 'Dissolving, ambient', 'Dreamy, compassionate, mystical', 'Reverb oceans, ethereal pads');

-- Seed aspect data
INSERT INTO public.qm_aspects (name, symbol, angle, orb, harmonic_interval, consonance, tension_level, sonic_expression, musical_effect, color) VALUES
  ('Conjunction', '☌', 0, 10, 'Unison/Octave', 'Perfect consonance', 1, 'Fusion, amplification', 'Layered unison, power chords', '#FFD700'),
  ('Sextile', '⚹', 60, 6, 'Minor third', 'Soft consonance', 2, 'Gentle support, opportunity', 'Flowing counterpoint', '#00CED1'),
  ('Square', '□', 90, 8, 'Minor second/Tritone', 'Strong dissonance', 4, 'Friction, tension, drive', 'Clash resolution patterns', '#DC143C'),
  ('Trine', '△', 120, 8, 'Major third/Fifth', 'Strong consonance', 1, 'Ease, flow, harmony', 'Parallel harmonies, sweet intervals', '#32CD32'),
  ('Opposition', '☍', 180, 10, 'Tritone/Octave', 'Polarized tension', 5, 'Confrontation, awareness', 'Antiphonal call-response', '#FF4500'),
  ('Quincunx', '⚻', 150, 3, 'Minor sixth', 'Mild dissonance', 3, 'Adjustment, recalibration', 'Unresolved suspensions', '#9370DB'),
  ('Semi-sextile', '⚺', 30, 2, 'Semitone', 'Subtle tension', 2, 'Irritation, fine-tuning', 'Grace notes, ornaments', '#87CEEB'),
  ('Semi-square', '∠', 45, 2, 'Augmented unison', 'Friction', 3, 'Minor agitation', 'Rubbing intervals', '#FFA07A'),
  ('Sesquiquadrate', '⚼', 135, 2, 'Diminished fifth', 'Frustrated tension', 3, 'Blocked energy seeking release', 'Building dissonance', '#CD853F'),
  ('Quintile', 'Q', 72, 2, 'Perfect fourth variant', 'Creative tension', 2, 'Talent, creative gift', 'Unusual melodic leaps', '#DDA0DD');

-- Seed house data
INSERT INTO public.qm_houses (number, name, domain, tonal_area, dynamic, frequency_range, expression) VALUES
  (1, 'House of Self', 'Identity, appearance, beginnings', 'Tonic/Root', 'Initiating', 'Fundamental frequency', 'Opening statement, theme introduction'),
  (2, 'House of Value', 'Resources, possessions, self-worth', 'Supertonic', 'Stabilizing', 'Low-mid resonance', 'Grounding basslines, material textures'),
  (3, 'House of Communication', 'Siblings, local travel, learning', 'Mediant', 'Connecting', 'Mid-range articulation', 'Quick passages, verbal rhythms'),
  (4, 'House of Home', 'Family, roots, emotional foundation', 'Subdominant', 'Nurturing', 'Deep foundation tones', 'Comforting drones, heartbeat rhythms'),
  (5, 'House of Pleasure', 'Creativity, romance, children', 'Dominant', 'Expressing', 'Bright upper harmonics', 'Playful melodies, joyful flourishes'),
  (6, 'House of Service', 'Health, work, daily routine', 'Submediant', 'Refining', 'Clean mid-frequencies', 'Precise patterns, functional rhythms'),
  (7, 'House of Partnership', 'Relationships, contracts, others', 'Leading tone', 'Relating', 'Harmonic balance point', 'Duets, mirrored phrases'),
  (8, 'House of Transformation', 'Death, rebirth, shared resources', 'Chromatic inflection', 'Transforming', 'Sub-bass to overtones', 'Intensity builds, cathartic releases'),
  (9, 'House of Philosophy', 'Higher learning, travel, beliefs', 'Modal expansion', 'Expanding', 'Wide frequency spread', 'Epic themes, world music influences'),
  (10, 'House of Career', 'Public image, ambition, authority', 'Dominant return', 'Achieving', 'Prominent mid-highs', 'Triumphant statements, climax points'),
  (11, 'House of Community', 'Friends, hopes, collective goals', 'Extended harmony', 'Innovating', 'Upper register explorations', 'Ensemble textures, collective voices'),
  (12, 'House of the Unconscious', 'Hidden matters, spirituality, endings', 'Resolution/Dissolution', 'Dissolving', 'Extreme lows and highs', 'Fade outs, ambient dissolution');