"""
Basic Swiss Ephemeris calculator helpers.

This module wraps common pyswisseph (swisseph) calls to compute planet
positions, zodiac signs and to set the ephemeris path.
"""
from dataclasses import dataclass
from typing import Dict, Tuple
import math

try:
    import swisseph as swe
except Exception as e:
    raise ImportError(
        "swisseph (pyswisseph) is required. Install with: pip install pyswisseph"
    ) from e


# set ephemeris path to local ephe folder
swe.set_ephe_path('./ephe')


PLANETS = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mercury': swe.MERCURY,
    'Venus': swe.VENUS,
    'Mars': swe.MARS,
    'Jupiter': swe.JUPITER,
    'Saturn': swe.SATURN,
    'Uranus': swe.URANUS,
    'Neptune': swe.NEPTUNE,
    'Pluto': swe.PLUTO,
}

SIGN_NAMES = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]


def normalize_angle(angle: float) -> float:
    """Normalize angle to [0,360)."""
    return angle % 360.0


def zodiac_sign_from_longitude(lon: float) -> str:
    lon = normalize_angle(lon)
    idx = int(lon // 30) % 12
    return SIGN_NAMES[idx]


def get_planet_positions(jd_ut: float, planets: Dict[str, int] = None) -> Dict[str, Dict]:
    """
    Return planet longitudes (ecliptic) and speeds for the given Julian day (UT).

    Returns a dict mapping planet name to dict with keys `lon`, `lat`, `distance`.
    """
    if planets is None:
        planets = PLANETS

    results = {}
    for name, pid in planets.items():
        try:
            # calc_ut returns (longitude, latitude, distance, ...)
            pos = swe.calc_ut(jd_ut, pid)
        except Exception:
            # fallback to zeros if calculation fails
            results[name] = {'lon': 0.0, 'lat': 0.0, 'distance': 0.0}
            continue
        lon = float(pos[0][0]) if isinstance(pos[0], (list, tuple)) else float(pos[0])
        # Some swisseph bindings return a tuple; handle both shapes.
        if isinstance(pos[0], (list, tuple)):
            lon = float(pos[0][0])
            lat = float(pos[0][1])
            dist = float(pos[0][2])
        else:
            lon = float(pos[0])
            lat = float(pos[1])
            dist = float(pos[2])

        results[name] = {'lon': normalize_angle(lon), 'lat': lat, 'distance': dist}

    return results


@dataclass
class PlanetPosition:
    name: str
    lon: float
    lat: float
    distance: float


def to_planetposition_dict(positions: Dict[str, Dict]) -> Dict[str, PlanetPosition]:
    return {n: PlanetPosition(n, v['lon'], v['lat'], v['distance']) for n, v in positions.items()}
