"""
Synastry harmonic engine.

Extends the natal harmonic engine to handle two charts simultaneously.
Computes harmonic compatibility, synastric tension index, element
friction, and shared/clashing modal qualities.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple


ELEMENT_BY_SIGN: Dict[str, str] = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water",
}

# Element compatibility for musical blending
# Compatible pairs produce consonant blends; clashing pairs produce friction
ELEMENT_COMPATIBILITY: Dict[Tuple[str, str], str] = {
    ("Fire", "Fire"): "amplified",
    ("Fire", "Air"): "harmonious",
    ("Fire", "Earth"): "grounding_friction",
    ("Fire", "Water"): "steam_tension",
    ("Earth", "Earth"): "amplified",
    ("Earth", "Water"): "harmonious",
    ("Earth", "Air"): "conceptual_friction",
    ("Air", "Air"): "amplified",
    ("Air", "Water"): "mist_tension",
    ("Water", "Water"): "amplified",
}

# Aspect weights for synastric tension calculation
SYNASTRY_ASPECT_WEIGHTS: Dict[str, float] = {
    "Conjunction": 1.5,   # powerful but ambiguous
    "Opposition": 3.0,    # maximum polarity tension
    "Square": 2.5,        # friction / growth
    "Trine": -1.0,        # eases tension
    "Sextile": -0.5,      # mild ease
    "Quincunx": 2.0,      # awkward adjustment
    "Semi-Sextile": 0.5,  # mild irritation
}


@dataclass
class SynastryHarmonicResult:
    """Result of synastry harmonic analysis."""
    synastric_tension_index: int           # 0-100 (0 = perfectly flowing, 100 = intense)
    harmonic_compatibility: int            # 0-100 (shared musical ground)
    dominant_element_a: str
    dominant_element_b: str
    shared_element: str                    # most common shared element
    element_blend: str                     # compatibility descriptor
    harmony_count: int                     # number of flowing aspects
    tension_count: int                     # number of challenging aspects
    fusion_count: int                      # number of conjunctions


def _get_element_compatibility(elem_a: str, elem_b: str) -> str:
    """Get the compatibility descriptor for two elements."""
    key = (elem_a, elem_b)
    result = ELEMENT_COMPATIBILITY.get(key)
    if result:
        return result
    # Try reversed
    return ELEMENT_COMPATIBILITY.get((elem_b, elem_a), "neutral")


def _dominant_element(planets: List[Dict[str, Any]]) -> str:
    """Determine dominant element from a list of planet dicts."""
    element_counts: Counter = Counter()
    for p in planets:
        sign = p.get("sign", "")
        element = ELEMENT_BY_SIGN.get(sign, "Unknown")
        # Weight luminaries more heavily
        weight = 1.0
        name = p.get("name", "")
        if name == "Sun":
            weight = 3.0
        elif name == "Moon":
            weight = 2.5
        element_counts[element] += weight

    if not element_counts:
        return "Unknown"
    return element_counts.most_common(1)[0][0]


def compute_synastry_harmony(
    synastry_aspects: List[Dict[str, Any]],
    chart_a_planets: List[Dict[str, Any]],
    chart_b_planets: List[Dict[str, Any]],
) -> SynastryHarmonicResult:
    """
    Compute the harmonic relationship between two charts.

    Args:
        synastry_aspects: List of inter-chart aspects from find_synastry_aspects().
        chart_a_planets: Planet list from chart A.
        chart_b_planets: Planet list from chart B.

    Returns:
        SynastryHarmonicResult with tension/compatibility indices.
    """
    # Count aspect qualities
    harmony_count = 0
    tension_count = 0
    fusion_count = 0
    tension_score = 0.0

    for aspect in synastry_aspects:
        quality = aspect.get("quality", "neutral")
        aspect_type = aspect.get("aspect", "")
        orb = aspect.get("orb", 5.0)

        # Closeness factor: tighter aspects are more impactful
        closeness = max(0.0, 1.0 - (orb / 10.0))
        weight = SYNASTRY_ASPECT_WEIGHTS.get(aspect_type, 0.0)
        tension_score += weight * (1.0 + closeness)

        if quality == "harmony":
            harmony_count += 1
        elif quality in ("tension", "dissonance"):
            tension_count += 1
        elif quality == "fusion":
            fusion_count += 1

    # Normalize tension to 0-100
    max_expected_tension = 50.0
    synastric_tension = min(100, max(0, int((tension_score / max_expected_tension) * 100 + 50)))

    # Harmonic compatibility (inverse-ish of tension, but also counts harmony)
    total_aspects = max(1, len(synastry_aspects))
    flowing_ratio = (harmony_count + fusion_count * 0.7) / total_aspects
    harmonic_compatibility = min(100, int(flowing_ratio * 100))

    # Element analysis
    elem_a = _dominant_element(chart_a_planets)
    elem_b = _dominant_element(chart_b_planets)
    element_blend = _get_element_compatibility(elem_a, elem_b)

    # Shared element: most common element across both charts combined
    combined_elements: Counter = Counter()
    for p in chart_a_planets + chart_b_planets:
        sign = p.get("sign", "")
        elem = ELEMENT_BY_SIGN.get(sign, "Unknown")
        combined_elements[elem] += 1
    shared_element = combined_elements.most_common(1)[0][0] if combined_elements else "Unknown"

    return SynastryHarmonicResult(
        synastric_tension_index=synastric_tension,
        harmonic_compatibility=harmonic_compatibility,
        dominant_element_a=elem_a,
        dominant_element_b=elem_b,
        shared_element=shared_element,
        element_blend=element_blend,
        harmony_count=harmony_count,
        tension_count=tension_count,
        fusion_count=fusion_count,
    )
