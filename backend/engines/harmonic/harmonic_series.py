"""
Harmonic series engine – derives overtone frequencies for planets and signs.

Based on the Pythagorean harmonic ratios applied to planetary orbital periods
(as per Kepler's "Harmonices Mundi" tradition).
"""

from __future__ import annotations

import math
from typing import Any

# Sidereal orbital periods in Earth days
ORBITAL_PERIODS: dict[str, float] = {
    "Sun":     365.25,
    "Moon":    27.321,
    "Mercury": 87.969,
    "Venus":   224.701,
    "Mars":    686.971,
    "Jupiter": 4332.589,
    "Saturn":  10759.22,
    "Uranus":  30688.5,
    "Neptune": 60182.0,
    "Pluto":   90560.0,
}

# Reference: Earth year = 1 AU orbital period → C3 (261.63 Hz)
EARTH_REFERENCE_HZ = 261.63


def frequency_for_planet(planet_name: str, octave_shift: int = 0) -> float:
    """
    Compute the Kepler/Cousto cosmic octave frequency for a planet.

    Formula: f = c / T  (scaled into audible range via octave doubling)

    Args:
        planet_name: Name of the planet.
        octave_shift: Additional octave shifts (positive = up, negative = down).

    Returns:
        Frequency in Hz.
    """
    period_days = ORBITAL_PERIODS.get(planet_name, 365.25)
    # Convert orbital period to seconds
    period_seconds = period_days * 86400.0
    # Base frequency (very low – needs octave shifting)
    base_freq = 1.0 / period_seconds
    # Shift into audible range (roughly 60–500 Hz)
    freq = base_freq
    while freq < 60.0:
        freq *= 2.0
    while freq > 500.0:
        freq /= 2.0
    # Apply extra octave shift
    shift = 2.0 ** octave_shift
    return round(freq * shift, 4)


def compute_harmonics(
    root_hz: float,
    num_harmonics: int = 8,
    include_subharmonics: bool = False,
) -> dict[str, Any]:
    """
    Compute the harmonic series for a given root frequency.

    Args:
        root_hz: Fundamental frequency in Hz.
        num_harmonics: Number of harmonics to compute.
        include_subharmonics: Whether to include sub-harmonics (1/n).

    Returns:
        Dict with ``harmonics`` and optionally ``subharmonics`` lists.
    """
    harmonics = [
        {
            "n": n,
            "frequency_hz": round(root_hz * n, 4),
            "ratio": f"1:{n}",
            "cents_above_root": round(1200 * math.log2(n), 2),
        }
        for n in range(1, num_harmonics + 1)
    ]

    result: dict[str, Any] = {"root_hz": root_hz, "harmonics": harmonics}

    if include_subharmonics:
        result["subharmonics"] = [
            {
                "n": n,
                "frequency_hz": round(root_hz / n, 4),
                "ratio": f"{n}:1",
                "cents_below_root": round(1200 * math.log2(n), 2),
            }
            for n in range(1, num_harmonics + 1)
        ]

    return result


def planetary_chord(planets: list[str], octave_shift: int = 0) -> list[dict[str, Any]]:
    """
    Build a chord from the cosmic frequencies of a list of planets.

    Args:
        planets: List of planet names.
        octave_shift: Octave shift applied to all planets.

    Returns:
        List of dicts with planet name and frequency.
    """
    return [
        {"planet": p, "frequency_hz": frequency_for_planet(p, octave_shift)}
        for p in planets
    ]
