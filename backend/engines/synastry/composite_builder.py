"""
Composite chart builder for synastry.

A composite chart calculates the midpoint of each matching planet pair
(Person A's Sun + Person B's Sun → composite Sun, etc.) to produce a
synthetic chart representing the relationship itself.

This composite chart can then be fed into the existing harmonic engine
as if it were a regular natal chart.
"""
from __future__ import annotations

from typing import Any, Dict, List


SIGN_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]


def _midpoint(lon_a: float, lon_b: float) -> float:
    """
    Calculate the shorter-arc midpoint between two ecliptic longitudes.

    Always returns the midpoint on the shorter arc between the two points.
    """
    a = lon_a % 360.0
    b = lon_b % 360.0

    diff = (b - a) % 360.0
    if diff > 180.0:
        # shorter arc goes the other way
        mid = (a - (360.0 - diff) / 2.0) % 360.0
    else:
        mid = (a + diff / 2.0) % 360.0

    return round(mid, 4)


def _degree_to_sign(degree: float) -> tuple:
    """Return (sign_name, sign_index, degree_within_sign)."""
    norm = degree % 360
    sign_idx = int(norm // 30)
    sign_degree = norm - sign_idx * 30
    return SIGN_NAMES[sign_idx], sign_idx, round(sign_degree, 2)


def build_composite_chart(
    chart_a_planets: List[Dict[str, Any]],
    chart_b_planets: List[Dict[str, Any]],
    ascendant_a: Dict[str, Any] | None = None,
    ascendant_b: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Build a composite chart from two natal charts.

    For each planet that appears in both charts, compute the midpoint.
    If a planet appears in only one chart, it is carried through unchanged.

    Args:
        chart_a_planets: List of planet dicts from chart A.
        chart_b_planets: List of planet dicts from chart B.
        ascendant_a: Optional ascendant dict from chart A.
        ascendant_b: Optional ascendant dict from chart B.

    Returns:
        Dict with keys: planets, ascendant, sunSign, moonSign
    """
    # Index chart B planets by name for lookup
    b_by_name: Dict[str, Dict[str, Any]] = {p["name"]: p for p in chart_b_planets}
    a_by_name: Dict[str, Dict[str, Any]] = {p["name"]: p for p in chart_a_planets}

    composite_planets: List[Dict[str, Any]] = []
    all_names = list(dict.fromkeys(
        [p["name"] for p in chart_a_planets] + [p["name"] for p in chart_b_planets]
    ))

    for name in all_names:
        pa = a_by_name.get(name)
        pb = b_by_name.get(name)

        if pa and pb:
            mid_lon = _midpoint(pa["degree"], pb["degree"])
        elif pa:
            mid_lon = pa["degree"]
        else:
            mid_lon = pb["degree"]

        sign, sign_num, sign_degree = _degree_to_sign(mid_lon)
        # Retrograde in composite: if either planet is retrograde
        is_retro = (pa or {}).get("isRetrograde", False) or (pb or {}).get("isRetrograde", False)

        composite_planets.append({
            "name": name,
            "symbol": (pa or pb or {}).get("symbol", ""),
            "degree": mid_lon,
            "signDegree": sign_degree,
            "sign": sign,
            "signNumber": sign_num,
            "isRetrograde": is_retro,
        })

    # Composite ascendant
    composite_asc: Dict[str, Any] = {}
    if ascendant_a and ascendant_b:
        asc_a_deg = ascendant_a.get("degree", 0.0)
        asc_b_deg = ascendant_b.get("degree", 0.0)
        mid_asc = _midpoint(asc_a_deg, asc_b_deg)
        sign, sign_num, sign_degree = _degree_to_sign(mid_asc)
        composite_asc = {
            "name": "Ascendant",
            "symbol": "Asc",
            "degree": mid_asc,
            "signDegree": sign_degree,
            "sign": sign,
            "signNumber": sign_num,
            "isRetrograde": False,
        }
    elif ascendant_a:
        composite_asc = ascendant_a
    elif ascendant_b:
        composite_asc = ascendant_b

    # Derive sun/moon signs from composite planets
    sun_planet = next((p for p in composite_planets if p["name"] == "Sun"), None)
    moon_planet = next((p for p in composite_planets if p["name"] == "Moon"), None)

    return {
        "planets": composite_planets,
        "ascendant": composite_asc,
        "sunSign": sun_planet["sign"] if sun_planet else "Aries",
        "moonSign": moon_planet["sign"] if moon_planet else "Cancer",
        "ascendantSign": composite_asc.get("sign", ""),
        "isComposite": True,
    }
