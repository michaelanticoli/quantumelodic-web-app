"""
AI Music Generator – maps natal chart data to Quantumelodic musical parameters.

Usage:
    from engines.ai_music.music_generator import generate_music_params

    params = generate_music_params(sun_sign="Leo", moon_sign="Scorpio",
                                   ascendant="Gemini", planets=[...])
"""

from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# Sign → musical mappings
# ---------------------------------------------------------------------------

SIGN_MUSICAL_MAP: dict[str, dict[str, Any]] = {
    "Aries":       {"element": "Fire",  "modality": "Cardinal", "musical_mode": "Phrygian",   "key": "E",  "tempo_bpm": 140, "texture": "Percussive",   "emotional_quality": "Bold",         "sonic_palette": "Brass, Drums"},
    "Taurus":      {"element": "Earth", "modality": "Fixed",    "musical_mode": "Lydian",     "key": "F",  "tempo_bpm": 72,  "texture": "Rich",         "emotional_quality": "Grounded",     "sonic_palette": "Strings, Piano"},
    "Gemini":      {"element": "Air",   "modality": "Mutable",  "musical_mode": "Dorian",     "key": "D",  "tempo_bpm": 120, "texture": "Mercurial",    "emotional_quality": "Curious",      "sonic_palette": "Woodwinds, Synth"},
    "Cancer":      {"element": "Water", "modality": "Cardinal", "musical_mode": "Aeolian",    "key": "A",  "tempo_bpm": 80,  "texture": "Fluid",        "emotional_quality": "Nurturing",    "sonic_palette": "Cello, Harp"},
    "Leo":         {"element": "Fire",  "modality": "Fixed",    "musical_mode": "Mixolydian", "key": "G",  "tempo_bpm": 120, "texture": "Majestic",     "emotional_quality": "Radiant",      "sonic_palette": "Brass, Choir"},
    "Virgo":       {"element": "Earth", "modality": "Mutable",  "musical_mode": "Dorian",     "key": "D",  "tempo_bpm": 96,  "texture": "Precise",      "emotional_quality": "Analytical",   "sonic_palette": "Piano, Flute"},
    "Libra":       {"element": "Air",   "modality": "Cardinal", "musical_mode": "Lydian",     "key": "F#", "tempo_bpm": 88,  "texture": "Harmonious",   "emotional_quality": "Balanced",     "sonic_palette": "Strings, Synth Pad"},
    "Scorpio":     {"element": "Water", "modality": "Fixed",    "musical_mode": "Phrygian",   "key": "E",  "tempo_bpm": 76,  "texture": "Intense",      "emotional_quality": "Transformative","sonic_palette": "Low Brass, Organ"},
    "Sagittarius": {"element": "Fire",  "modality": "Mutable",  "musical_mode": "Lydian",     "key": "F",  "tempo_bpm": 132, "texture": "Expansive",    "emotional_quality": "Adventurous",  "sonic_palette": "Horns, Strings"},
    "Capricorn":   {"element": "Earth", "modality": "Cardinal", "musical_mode": "Dorian",     "key": "D",  "tempo_bpm": 84,  "texture": "Structured",   "emotional_quality": "Disciplined",  "sonic_palette": "Bassoon, Piano"},
    "Aquarius":    {"element": "Air",   "modality": "Fixed",    "musical_mode": "Mixolydian", "key": "G",  "tempo_bpm": 110, "texture": "Electric",     "emotional_quality": "Visionary",    "sonic_palette": "Synth, Percussion"},
    "Pisces":      {"element": "Water", "modality": "Mutable",  "musical_mode": "Aeolian",    "key": "A",  "tempo_bpm": 68,  "texture": "Ethereal",     "emotional_quality": "Transcendent", "sonic_palette": "Choir, Harp"},
}

# Planet → sonic mappings
PLANET_SONIC_MAP: dict[str, dict[str, Any]] = {
    "Sun":     {"note": "B",  "frequency_hz": 126.22, "instrument": "Cello",       "timbre": "Warm",       "harmonic_quality": "Fundamental",   "archetypal_energy": "Identity",      "sonic_character": "Sustaining"},
    "Moon":    {"note": "G#", "frequency_hz": 210.42, "instrument": "Harp",        "timbre": "Silvery",    "harmonic_quality": "Reflective",    "archetypal_energy": "Emotion",       "sonic_character": "Pulsing"},
    "Mercury": {"note": "C#", "frequency_hz": 141.27, "instrument": "Flute",       "timbre": "Airy",       "harmonic_quality": "Quicksilver",   "archetypal_energy": "Communication", "sonic_character": "Nimble"},
    "Venus":   {"note": "A",  "frequency_hz": 221.23, "instrument": "Violin",      "timbre": "Sweet",      "harmonic_quality": "Harmonic",      "archetypal_energy": "Love",          "sonic_character": "Lyrical"},
    "Mars":    {"note": "D",  "frequency_hz": 144.72, "instrument": "Trumpet",     "timbre": "Bright",     "harmonic_quality": "Driving",       "archetypal_energy": "Action",        "sonic_character": "Percussive"},
    "Jupiter": {"note": "F#", "frequency_hz": 183.58, "instrument": "French Horn", "timbre": "Rich",       "harmonic_quality": "Expansive",     "archetypal_energy": "Growth",        "sonic_character": "Resonant"},
    "Saturn":  {"note": "D",  "frequency_hz": 147.85, "instrument": "Bassoon",     "timbre": "Dark",       "harmonic_quality": "Foundational",  "archetypal_energy": "Structure",     "sonic_character": "Deep"},
    "Uranus":  {"note": "G#", "frequency_hz": 207.36, "instrument": "Synth Lead",  "timbre": "Electric",   "harmonic_quality": "Dissonant",     "archetypal_energy": "Liberation",    "sonic_character": "Unpredictable"},
    "Neptune": {"note": "G#", "frequency_hz": 211.44, "instrument": "Choir Pad",   "timbre": "Misty",      "harmonic_quality": "Oceanic",       "archetypal_energy": "Dreams",        "sonic_character": "Dissolving"},
    "Pluto":   {"note": "C#", "frequency_hz": 140.25, "instrument": "Bass Synth",  "timbre": "Subterranean","harmonic_quality": "Transformative","archetypal_energy": "Power",         "sonic_character": "Seismic"},
}

# Aspect → harmonic tension mapping
ASPECT_HARMONIC_MAP: dict[str, dict[str, Any]] = {
    "Conjunction":   {"tension": "Fusion",      "harmony_ratio": "1:1",   "color": "#FFD700", "musical_quality": "Unison"},
    "Opposition":    {"tension": "Polarity",    "harmony_ratio": "1:2",   "color": "#FF4500", "musical_quality": "Octave tension"},
    "Trine":         {"tension": "Flow",        "harmony_ratio": "2:3",   "color": "#00CED1", "musical_quality": "Perfect fifth"},
    "Square":        {"tension": "Challenge",   "harmony_ratio": "3:4",   "color": "#FF6347", "musical_quality": "Perfect fourth"},
    "Sextile":       {"tension": "Opportunity", "harmony_ratio": "4:5",   "color": "#32CD32", "musical_quality": "Major third"},
    "Quincunx":      {"tension": "Adjustment",  "harmony_ratio": "5:9",   "color": "#9370DB", "musical_quality": "Minor seventh"},
    "Semi-Sextile":  {"tension": "Growth",      "harmony_ratio": "15:16", "color": "#87CEEB", "musical_quality": "Semitone"},
    "Semi-Square":   {"tension": "Friction",    "harmony_ratio": "7:8",   "color": "#FFA07A", "musical_quality": "Minor second"},
    "Sesquiquadrate":{"tension": "Agitation",   "harmony_ratio": "8:11",  "color": "#DC143C", "musical_quality": "Tritone"},
    "Quintile":      {"tension": "Creativity",  "harmony_ratio": "4:5",   "color": "#DA70D6", "musical_quality": "Major third"},
    "Biquintile":    {"tension": "Integration", "harmony_ratio": "2:3",   "color": "#EE82EE", "musical_quality": "Minor third"},
}


def generate_music_params(
    sun_sign: str,
    moon_sign: str,
    ascendant: str | None = None,
    planets: list[dict[str, Any]] | None = None,
    aspects: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Map natal chart data to Quantumelodic musical parameters.

    Args:
        sun_sign: Name of Sun sign (e.g. "Leo").
        moon_sign: Name of Moon sign (e.g. "Scorpio").
        ascendant: Optional Ascendant sign name.
        planets: Optional list of planet position dicts (from chart_builder).
        aspects: Optional list of aspect dicts (from chart_builder).

    Returns:
        Dict with musical mappings for the chart.
    """
    sun_map = SIGN_MUSICAL_MAP.get(sun_sign, SIGN_MUSICAL_MAP["Aries"])
    moon_map = SIGN_MUSICAL_MAP.get(moon_sign, SIGN_MUSICAL_MAP["Cancer"])
    asc_map = SIGN_MUSICAL_MAP.get(ascendant, {}) if ascendant else {}

    # Blend tempo from Sun and Moon (weighted average)
    tempo = int(0.6 * sun_map["tempo_bpm"] + 0.4 * moon_map["tempo_bpm"])

    planet_sonics: list[dict[str, Any]] = []
    if planets:
        for p in planets:
            name = p.get("name", "")
            base = PLANET_SONIC_MAP.get(name, {})
            if base:
                planet_sonics.append({
                    **base,
                    "planet": name,
                    "sign": p.get("sign", ""),
                    "isRetrograde": p.get("isRetrograde", False),
                })

    aspect_harmonics: list[dict[str, Any]] = []
    if aspects:
        for a in aspects:
            mapping = ASPECT_HARMONIC_MAP.get(a.get("type", ""), {})
            if mapping:
                aspect_harmonics.append({
                    **mapping,
                    "planet1": a.get("planet1"),
                    "planet2": a.get("planet2"),
                    "type": a.get("type"),
                    "orb": a.get("orb"),
                })

    return {
        "sunSign": {
            "name": sun_sign,
            **sun_map,
        },
        "moonSign": {
            "name": moon_sign,
            **moon_map,
        },
        "ascendant": {"name": ascendant, **asc_map} if ascendant and asc_map else None,
        "blendedTempo": tempo,
        "dominantKey": sun_map["key"],
        "dominantMode": sun_map["musical_mode"],
        "planets": planet_sonics,
        "aspects": aspect_harmonics,
    }
