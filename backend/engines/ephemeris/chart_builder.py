"""
Ephemeris chart builder – computes natal chart positions using Swiss Ephemeris (pyswisseph).

Usage:
    from engines.ephemeris.chart_builder import build_chart

    result = build_chart(
        year=1990, month=6, day=15,
        hour=14, minute=30,
        latitude=40.7128, longitude=-74.0060,
        utc_offset=-5.0
    )
"""

from __future__ import annotations

import logging
import math
from typing import Any

logger = logging.getLogger(__name__)

# Try to import pyswisseph; fall back to a lightweight stub so the module can
# still be imported in environments where it hasn't been installed yet.
try:
    import swisseph as swe  # type: ignore

    _SWE_AVAILABLE = True
except ImportError:  # pragma: no cover
    swe = None  # type: ignore
    _SWE_AVAILABLE = False

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SIGN_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

PLANET_NAMES: list[tuple[int, str, str]] = [
    # (swisseph_id, name, symbol)
    (0, "Sun", "☉"),
    (1, "Moon", "☽"),
    (2, "Mercury", "☿"),
    (3, "Venus", "♀"),
    (4, "Mars", "♂"),
    (5, "Jupiter", "♃"),
    (6, "Saturn", "♄"),
    (7, "Uranus", "♅"),
    (8, "Neptune", "♆"),
    (9, "Pluto", "♇"),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _degree_to_sign(degree: float) -> tuple[str, int, float]:
    """Return (sign_name, sign_index_0_based, degree_within_sign)."""
    norm = degree % 360
    sign_idx = int(norm // 30)
    sign_degree = norm - sign_idx * 30
    return SIGN_NAMES[sign_idx], sign_idx, sign_degree


def _julian_day(year: int, month: int, day: int, hour: float) -> float:
    """Compute Julian Day Number (UT)."""
    if _SWE_AVAILABLE:
        return swe.julday(year, month, day, hour)
    # Fallback: simple approximation (accurate to ±1 day for modern dates)
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    jdn = day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045
    return jdn - 0.5 + hour / 24.0


def _calc_planet_stub(jd: float, planet_id: int) -> tuple[float, bool]:
    """
    Very rough orbital period stub – used only when pyswisseph is unavailable.
    Returns (ecliptic_longitude_degrees, is_retrograde).
    """
    # Approximate mean motions in degrees/day
    mean_motions = {0: 0.9856, 1: 13.176, 2: 1.383, 3: 1.202,
                    4: 0.524, 5: 0.083, 6: 0.033, 7: 0.012, 8: 0.006, 9: 0.004}
    base_jd = 2451545.0  # J2000.0
    lon = (mean_motions.get(planet_id, 0.5) * (jd - base_jd)) % 360
    return lon, False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def build_chart(
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int,
    latitude: float,
    longitude: float,
    utc_offset: float = 0.0,
) -> dict[str, Any]:
    """
    Build a natal chart for the given birth data.

    Args:
        year, month, day: Birth date.
        hour, minute: Birth time in *local* time.
        latitude, longitude: Geographic coordinates (decimal degrees).
        utc_offset: Hours east of UTC (e.g. -5 for EST).

    Returns:
        A dict with keys:
          - ``planets``   – list of planet position dicts
          - ``ascendant`` – Ascendant position dict (if calculable)
          - ``aspects``   – list of aspect dicts
    """
    ut_hour = (hour + minute / 60.0) - utc_offset
    jd = _julian_day(year, month, day, ut_hour)

    planets: list[dict[str, Any]] = []

    if _SWE_AVAILABLE:
        swe.set_ephe_path(None)  # use bundled ephemeris
        for planet_id, name, symbol in PLANET_NAMES:
            flags = swe.FLG_SWIEPH | swe.FLG_SPEED
            result, _ = swe.calc_ut(jd, planet_id, flags)
            lon = result[0]
            speed = result[3]
            is_retro = speed < 0
            sign, sign_num, sign_degree = _degree_to_sign(lon)
            planets.append({
                "name": name,
                "symbol": symbol,
                "degree": round(lon, 4),
                "signDegree": round(sign_degree, 2),
                "sign": sign,
                "signNumber": sign_num,
                "isRetrograde": is_retro,
            })

        # Ascendant via house system
        try:
            cusps, ascmc = swe.houses(jd, latitude, longitude, b"P")
            asc_lon = ascmc[0]
            sign, sign_num, sign_degree = _degree_to_sign(asc_lon)
            ascendant: dict[str, Any] = {
                "name": "Ascendant",
                "symbol": "Asc",
                "degree": round(asc_lon, 4),
                "signDegree": round(sign_degree, 2),
                "sign": sign,
                "signNumber": sign_num,
                "isRetrograde": False,
            }
        except Exception as exc:
            logger.warning("Ascendant calculation failed: %s", exc)
            ascendant = {}
    else:
        # Stub mode
        for planet_id, name, symbol in PLANET_NAMES:
            lon, is_retro = _calc_planet_stub(jd, planet_id)
            sign, sign_num, sign_degree = _degree_to_sign(lon)
            planets.append({
                "name": name,
                "symbol": symbol,
                "degree": round(lon, 4),
                "signDegree": round(sign_degree, 2),
                "sign": sign,
                "signNumber": sign_num,
                "isRetrograde": is_retro,
            })
        ascendant = {}

    aspects = _calculate_aspects(planets)

    return {
        "planets": planets,
        "ascendant": ascendant,
        "aspects": aspects,
        "julianDay": round(jd, 4),
        "swissEphAvailable": _SWE_AVAILABLE,
    }


# ---------------------------------------------------------------------------
# Aspect calculation
# ---------------------------------------------------------------------------

ASPECT_TYPES: list[tuple[str, float, float]] = [
    ("Conjunction", 0.0, 8.0),
    ("Opposition", 180.0, 8.0),
    ("Trine", 120.0, 8.0),
    ("Square", 90.0, 7.0),
    ("Sextile", 60.0, 6.0),
    ("Quincunx", 150.0, 3.0),
    ("Semi-Sextile", 30.0, 2.0),
    ("Semi-Square", 45.0, 2.0),
    ("Sesquiquadrate", 135.0, 2.0),
    ("Quintile", 72.0, 1.5),
    ("Biquintile", 144.0, 1.5),
]


def _angular_difference(lon1: float, lon2: float) -> float:
    diff = abs(lon1 - lon2) % 360
    return min(diff, 360 - diff)


def _calculate_aspects(planets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    aspects: list[dict[str, Any]] = []
    for i, p1 in enumerate(planets):
        for p2 in planets[i + 1:]:
            diff = _angular_difference(p1["degree"], p2["degree"])
            for aspect_name, exact_angle, orb in ASPECT_TYPES:
                if abs(diff - exact_angle) <= orb:
                    aspects.append({
                        "planet1": p1["name"],
                        "planet2": p2["name"],
                        "type": aspect_name,
                        "orb": round(abs(diff - exact_angle), 3),
                        "exactAngle": exact_angle,
                        "actualAngle": round(diff, 3),
                    })
                    break
    return aspects
