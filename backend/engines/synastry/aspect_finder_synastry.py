"""
Cross-chart aspect finder for synastry.

Computes inter-chart aspects between two sets of planetary positions
(Person A vs Person B). Unlike natal aspects which compare planets within
a single chart, synastry aspects compare every planet in Chart A against
every planet in Chart B.
"""
from __future__ import annotations

from typing import Any, Dict, List


# Major and minor aspects with default orbs (slightly tighter for synastry)
SYNASTRY_ASPECTS = [
    ("Conjunction", 0.0, 8.0),
    ("Opposition", 180.0, 8.0),
    ("Trine", 120.0, 7.0),
    ("Square", 90.0, 7.0),
    ("Sextile", 60.0, 5.0),
    ("Quincunx", 150.0, 3.0),
    ("Semi-Sextile", 30.0, 2.0),
]

# Aspect quality classification for musical mapping
ASPECT_QUALITY: Dict[str, str] = {
    "Conjunction": "fusion",       # unison / octave
    "Trine": "harmony",           # consonant intervals (3rd, 5th, 6th)
    "Sextile": "harmony",         # lighter consonance
    "Semi-Sextile": "neutral",    # mild coloring
    "Square": "tension",          # dissonant intervals (2nd, tritone)
    "Opposition": "tension",      # counterpoint / contrary motion
    "Quincunx": "dissonance",     # chromatic tension
}


def _angle_difference(lon_a: float, lon_b: float) -> float:
    """Return smallest angular separation between two ecliptic longitudes (0..180)."""
    diff = abs((lon_a - lon_b) % 360.0)
    if diff > 180.0:
        diff = 360.0 - diff
    return diff


def find_synastry_aspects(
    chart_a_planets: List[Dict[str, Any]],
    chart_b_planets: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Find all inter-chart aspects between two natal charts.

    Args:
        chart_a_planets: List of planet dicts from chart A (each with 'name', 'degree').
        chart_b_planets: List of planet dicts from chart B (each with 'name', 'degree').

    Returns:
        List of aspect dicts with keys:
          - planet_a: name from chart A
          - planet_b: name from chart B
          - aspect: aspect name (e.g. 'Trine')
          - quality: 'fusion' | 'harmony' | 'tension' | 'dissonance' | 'neutral'
          - exact_angle: the ideal angle for this aspect
          - actual_angle: the measured angle
          - orb: deviation from exact angle
    """
    results: List[Dict[str, Any]] = []

    for pa in chart_a_planets:
        lon_a = pa.get("degree", 0.0)
        name_a = pa.get("name", "Unknown")

        for pb in chart_b_planets:
            lon_b = pb.get("degree", 0.0)
            name_b = pb.get("name", "Unknown")

            diff = _angle_difference(lon_a, lon_b)

            for aspect_name, exact_angle, max_orb in SYNASTRY_ASPECTS:
                orb = abs(diff - exact_angle)
                if orb <= max_orb:
                    results.append({
                        "planet_a": name_a,
                        "planet_b": name_b,
                        "aspect": aspect_name,
                        "quality": ASPECT_QUALITY.get(aspect_name, "neutral"),
                        "exact_angle": exact_angle,
                        "actual_angle": round(diff, 3),
                        "orb": round(orb, 3),
                        "sign_a": pa.get("sign", ""),
                        "sign_b": pb.get("sign", ""),
                    })
                    break  # only the tightest matching aspect per pair

    # Sort by orb (tightest aspects first — most significant)
    results.sort(key=lambda a: a["orb"])
    return results
