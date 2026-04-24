"""
Aspect finder for planetary positions.

Defines common major aspects and finds matching planet pairs given
their ecliptic longitudes.
"""
from typing import List, Dict, Tuple
import math


# Major aspects (angle in degrees, default orb in degrees)
ASPECTS = [
    ('Conjunction', 0.0, 8.0),
    ('Opposition', 180.0, 8.0),
    ('Trine', 120.0, 6.0),
    ('Square', 90.0, 6.0),
    ('Sextile', 60.0, 4.0),
]


def angle_difference(a: float, b: float) -> float:
    """Return smallest angle difference between two longitudes (0..180)."""
    diff = abs((a - b) % 360.0)
    if diff > 180.0:
        diff = 360.0 - diff
    return diff


def find_aspects(positions: Dict[str, Dict]) -> List[Dict]:
    """
    Given a dict mapping planet name to dict containing `lon`, find aspects.

    Returns a list of aspects with keys: planet_a, planet_b, aspect, exact_angle, orb
    """
    names = list(positions.keys())
    results = []
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a = names[i]
            b = names[j]
            lon_a = positions[a]['lon']
            lon_b = positions[b]['lon']
            diff = angle_difference(lon_a, lon_b)
            for aspect_name, angle, orb in ASPECTS:
                if abs(diff - angle) <= orb:
                    results.append({
                        'planet_a': a,
                        'planet_b': b,
                        'aspect': aspect_name,
                        'angle': angle,
                        'difference': diff,
                        'orb': abs(diff - angle),
                    })
                    break

    return results
