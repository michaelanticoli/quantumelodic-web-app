"""
Musical relationship mapping for synastry.

Translates synastric findings into concrete musical parameters:
key relationships, tempo blending, counterpoint rules, rhythmic
interaction, and timbre pairing.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple

from .synastry_harmonic import SynastryHarmonicResult, ELEMENT_BY_SIGN


# ─── Musical constants ──────────────────────────────────────────────────────

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

SIGN_ROOT_NOTE: Dict[str, str] = {
    "Aries": "A", "Taurus": "F", "Gemini": "G", "Cancer": "A",
    "Leo": "D", "Virgo": "D", "Libra": "A#", "Scorpio": "B",
    "Sagittarius": "E", "Capricorn": "C", "Aquarius": "F#", "Pisces": "E",
}

SIGN_MODE: Dict[str, str] = {
    "Aries": "PhrygianDom", "Taurus": "Ionian", "Gemini": "Mixolydian",
    "Cancer": "Aeolian", "Leo": "Lydian", "Virgo": "Dorian",
    "Libra": "MelodicMinor", "Scorpio": "HarmonicMinor", "Sagittarius": "Mixolydian",
    "Capricorn": "Dorian", "Aquarius": "Lydian", "Pisces": "Altered",
}

SIGN_TEMPO: Dict[str, int] = {
    "Aries": 138, "Taurus": 68, "Gemini": 124, "Cancer": 62,
    "Leo": 104, "Virgo": 92, "Libra": 86, "Scorpio": 74,
    "Sagittarius": 132, "Capricorn": 80, "Aquarius": 118, "Pisces": 58,
}

# Element → waveform/timbre family
ELEMENT_TIMBRES: Dict[str, List[str]] = {
    "Fire": ["sawtooth", "moog", "distortedPiano"],
    "Earth": ["square", "celloBow", "uprightBass"],
    "Air": ["triangle", "pianoHigh", "bells"],
    "Water": ["sine", "felt", "pad"],
}

# Key distance classification (semitones between roots)
# 0 = unison, 5/7 = fourth/fifth (very compatible), 6 = tritone (maximum tension)
KEY_DISTANCE_QUALITY: Dict[int, str] = {
    0: "unison",
    1: "chromatic_tension",
    2: "whole_step_drift",
    3: "minor_third_relative",
    4: "major_third_relative",
    5: "fourth_consonance",
    6: "tritone_maximum_tension",
    7: "fifth_consonance",
    8: "minor_sixth",
    9: "major_sixth_relative",
    10: "minor_seventh",
    11: "major_seventh_tension",
}

# Relationship type musical templates
RELATIONSHIP_ARCHETYPES: Dict[str, Dict[str, Any]] = {
    "romantic": {
        "emphasis_planets": ["Venus", "Mars", "Moon"],
        "resolution_tendency": "harmonic",  # tends toward resolution
        "texture_preference": "intimate",
        "dynamic_arc": "crescendo_to_resolution",
    },
    "friendship": {
        "emphasis_planets": ["Mercury", "Jupiter", "Sun"],
        "resolution_tendency": "playful",
        "texture_preference": "light",
        "dynamic_arc": "conversational",
    },
    "professional": {
        "emphasis_planets": ["Saturn", "Jupiter", "Mercury"],
        "resolution_tendency": "structured",
        "texture_preference": "formal",
        "dynamic_arc": "steady_build",
    },
    "parent_child": {
        "emphasis_planets": ["Moon", "Saturn", "Sun"],
        "resolution_tendency": "supportive",
        "texture_preference": "layered",
        "dynamic_arc": "call_and_response",
    },
    "transit": {
        "emphasis_planets": ["Sun", "Moon", "Saturn", "Jupiter"],
        "resolution_tendency": "temporal",
        "texture_preference": "atmospheric",
        "dynamic_arc": "wave",
    },
}


@dataclass
class SynastryScoreParams:
    """Musical parameters derived from synastry analysis."""
    # Key/mode for each person
    root_a: str
    root_b: str
    mode_a: str
    mode_b: str
    # Blended parameters
    blended_tempo: int
    key_distance: int                    # semitones between roots
    key_relationship: str                # descriptor from KEY_DISTANCE_QUALITY
    # Counterpoint
    counterpoint_style: str              # 'consonant', 'oblique', 'contrary', 'free'
    voice_independence: float            # 0-1 how independent the voices are
    # Rhythm
    rhythmic_interaction: str            # 'interlocking', 'unison', 'polyrhythmic', 'call_response'
    swing_blend: float                   # 0-0.3
    # Timbre
    timbre_a: List[str] = field(default_factory=list)
    timbre_b: List[str] = field(default_factory=list)
    timbre_blend: str = "layered"        # how timbres combine
    # Structure
    relationship_type: str = "romantic"
    dynamic_arc: str = "crescendo_to_resolution"
    # Tension/compatibility for the score builder
    tension_index: int = 50
    compatibility_index: int = 50


def _note_distance(note_a: str, note_b: str) -> int:
    """Compute semitone distance between two note names (0-11)."""
    idx_a = NOTE_NAMES.index(note_a) if note_a in NOTE_NAMES else 0
    idx_b = NOTE_NAMES.index(note_b) if note_b in NOTE_NAMES else 0
    return (idx_b - idx_a) % 12


def _determine_counterpoint(tension: int, compatibility: int) -> Tuple[str, float]:
    """Determine counterpoint style and voice independence from tension/compatibility."""
    if compatibility > 70:
        return "consonant", 0.3      # voices move in similar directions
    elif tension > 70:
        return "contrary", 0.9       # voices move in opposite directions
    elif tension > 50:
        return "oblique", 0.6        # one voice holds while other moves
    else:
        return "free", 0.5           # moderate independence


def _determine_rhythm(tension: int, element_blend: str) -> Tuple[str, float]:
    """Determine rhythmic interaction and swing from harmonic context."""
    if element_blend == "amplified":
        return "unison", 0.15
    elif element_blend == "harmonious":
        return "interlocking", 0.18
    elif element_blend in ("steam_tension", "mist_tension"):
        return "polyrhythmic", 0.08
    elif element_blend in ("grounding_friction", "conceptual_friction"):
        return "call_response", 0.12
    else:
        return "interlocking", 0.15


def compute_synastry_score_params(
    harmony_result: SynastryHarmonicResult,
    chart_a_planets: List[Dict[str, Any]],
    chart_b_planets: List[Dict[str, Any]],
    relationship_type: str = "romantic",
) -> SynastryScoreParams:
    """
    Compute musical score parameters from synastry harmonic analysis.

    Args:
        harmony_result: Output from compute_synastry_harmony().
        chart_a_planets: Planet list from chart A.
        chart_b_planets: Planet list from chart B.
        relationship_type: One of 'romantic', 'friendship', 'professional', 'parent_child', 'transit'.

    Returns:
        SynastryScoreParams with all musical mapping parameters.
    """
    # Determine root notes from sun signs
    sun_a = next((p for p in chart_a_planets if p.get("name") == "Sun"), None)
    sun_b = next((p for p in chart_b_planets if p.get("name") == "Sun"), None)
    sign_a = sun_a["sign"] if sun_a else "Aries"
    sign_b = sun_b["sign"] if sun_b else "Aries"

    root_a = SIGN_ROOT_NOTE.get(sign_a, "C")
    root_b = SIGN_ROOT_NOTE.get(sign_b, "C")
    mode_a = SIGN_MODE.get(sign_a, "Dorian")
    mode_b = SIGN_MODE.get(sign_b, "Dorian")

    # Key distance
    key_dist = _note_distance(root_a, root_b)
    key_rel = KEY_DISTANCE_QUALITY.get(key_dist, "neutral")

    # Tempo blending: weighted average influenced by compatibility
    tempo_a = SIGN_TEMPO.get(sign_a, 90)
    tempo_b = SIGN_TEMPO.get(sign_b, 90)
    # Higher compatibility → tempos converge toward average; lower → stay distinct
    compat_factor = harmony_result.harmonic_compatibility / 100.0
    blended_tempo = int((tempo_a + tempo_b) / 2 + (tempo_a - tempo_b) * compat_factor * 0.1)
    blended_tempo = max(54, min(150, blended_tempo))

    # Counterpoint
    counterpoint_style, voice_independence = _determine_counterpoint(
        harmony_result.synastric_tension_index,
        harmony_result.harmonic_compatibility,
    )

    # Rhythm
    rhythmic_interaction, swing_blend = _determine_rhythm(
        harmony_result.synastric_tension_index,
        harmony_result.element_blend,
    )

    # Timbres from elements
    timbre_a = ELEMENT_TIMBRES.get(harmony_result.dominant_element_a, ["piano"])
    timbre_b = ELEMENT_TIMBRES.get(harmony_result.dominant_element_b, ["piano"])

    # Timbre blend style
    if harmony_result.element_blend == "amplified":
        timbre_blend = "doubled"
    elif harmony_result.element_blend == "harmonious":
        timbre_blend = "layered"
    elif "tension" in harmony_result.element_blend:
        timbre_blend = "contrasting"
    else:
        timbre_blend = "interleaved"

    # Archetype
    archetype = RELATIONSHIP_ARCHETYPES.get(relationship_type, RELATIONSHIP_ARCHETYPES["romantic"])
    dynamic_arc = archetype["dynamic_arc"]

    return SynastryScoreParams(
        root_a=root_a,
        root_b=root_b,
        mode_a=mode_a,
        mode_b=mode_b,
        blended_tempo=blended_tempo,
        key_distance=key_dist,
        key_relationship=key_rel,
        counterpoint_style=counterpoint_style,
        voice_independence=voice_independence,
        rhythmic_interaction=rhythmic_interaction,
        swing_blend=swing_blend,
        timbre_a=timbre_a,
        timbre_b=timbre_b,
        timbre_blend=timbre_blend,
        relationship_type=relationship_type,
        dynamic_arc=dynamic_arc,
        tension_index=harmony_result.synastric_tension_index,
        compatibility_index=harmony_result.harmonic_compatibility,
    )
