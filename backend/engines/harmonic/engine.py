"""Canonical-aware harmonic engine.

This engine uses the canonical CSVs (project-root `mappings/` by default)
and the modal families index to map chart signs to pentatonic / quadratonic
mode IDs, then aggregates weighted votes to produce a `HarmonicResult`.
"""
from collections import Counter, defaultdict
from typing import Dict, Tuple

from .models import HarmonicResult, SonicPayload
from . import data_loader
from . import chart_mapper


# Load canonical datasets lazily via helper functions
def _load_data():
    pent = data_loader.load_pentatonic_modes()
    quad = data_loader.load_quadratonic_modes()
    modal_index = data_loader.load_modal_families_index()
    timbres = data_loader.load_element_timbres()
    return pent, quad, modal_index, timbres


PLANET_WEIGHTS = {
    'Sun': 3.0,
    'Moon': 2.5,
    'Rising': 2.0,
}

DEFAULT_PLANET_WEIGHT = 1.0

ASPECT_WEIGHTS = {
    'Conjunction': 1.0,
    'Opposition': 3.0,
    'Trine': 1.5,
    'Square': 2.5,
    'Sextile': 1.0,
}

ELEMENT_BY_SIGN = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water',
}


def _get_planet_weight(planet_name: str) -> float:
    return PLANET_WEIGHTS.get(planet_name, DEFAULT_PLANET_WEIGHT)


def _infer_sign_from_lon(lon: float) -> str:
    signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
    return signs[int((lon % 360) // 30)]


def _aggregate_canonical_modes(chart) -> Tuple[str, str]:
    """Aggregate canonical pentatonic/quadratonic mode IDs from the chart.

    Uses `modal_families_index.csv` to look up mode IDs by sign and weights
    contributed by Sun, Moon, Rising and the planets present in `chart.positions`.
    """
    pent, quad, modal_index, _ = _load_data()

    pent_scores: Dict[str, float] = defaultdict(float)
    quad_scores: Dict[str, float] = defaultdict(float)

    # contributors: Sun, Moon, Rising + planets present in chart.positions
    contributors = []
    if hasattr(chart, 'positions'):
        contributors = list(chart.positions.keys())
    contributors = list(dict.fromkeys(['Sun', 'Moon', 'Rising'] + contributors))

    for p in contributors:
        weight = _get_planet_weight(p)
        if p == 'Rising':
            sign = chart.rising_sign
        elif p == 'Sun':
            sign = chart.sun_sign
        elif p == 'Moon':
            sign = chart.moon_sign
        else:
            pos = chart.positions.get(p)
            if pos is None:
                continue
            lon = getattr(pos, 'lon', 0.0)
            sign = _infer_sign_from_lon(lon)

        family = modal_index.get(sign, {})
        pent_id = family.get('pentatonic_mode_id') or family.get('pentatonic_mode')
        quad_id = family.get('quadratonic_mode_id') or family.get('quadratonic_mode')

        if pent_id:
            pent_scores[pent_id] += weight
        if quad_id:
            quad_scores[quad_id] += weight

    primary_pent = max(pent_scores.items(), key=lambda x: x[1])[0] if pent_scores else 'UNKNOWN'
    primary_quad = max(quad_scores.items(), key=lambda x: x[1])[0] if quad_scores else 'UNKNOWN'
    return primary_pent, primary_quad


def _compute_harmonic_tension(chart) -> int:
    aspects = getattr(chart, 'aspects', []) or []
    score = 0.0
    for a in aspects:
        name = a.get('aspect')
        weight = ASPECT_WEIGHTS.get(name, 1.0)
        orb = a.get('orb', 0.0)
        closeness = max(0.0, 1.0 - (orb / 10.0))
        score += weight * (1.0 + closeness)

    max_expected = 40.0
    idx = min(100, int((score / max_expected) * 100))
    return idx


def _determine_dominant_element(chart) -> str:
    sign_counts = Counter()
    sign_counts[chart.sun_sign] += 1
    sign_counts[chart.moon_sign] += 1
    sign_counts[chart.rising_sign] += 1
    for ppos in getattr(chart, 'positions', {}).values():
        lon = getattr(ppos, 'lon', 0.0)
        sign = _infer_sign_from_lon(lon)
        sign_counts[sign] += 1

    element_counts = Counter()
    for sign, cnt in sign_counts.items():
        element = ELEMENT_BY_SIGN.get(sign, 'Unknown')
        element_counts[element] += cnt

    dominant_element = element_counts.most_common(1)[0][0] if element_counts else 'Unknown'
    return dominant_element


def _build_sonic_payload(dominant_element: str, tension: int) -> SonicPayload:
    waveform_map = {
        'Water': 'sine',
        'Fire': 'sawtooth',
        'Air': 'triangle',
        'Earth': 'square',
    }
    waveform = waveform_map.get(dominant_element, 'sine')
    tempo = 60 + int((tension / 100.0) * 80)
    _, _, _, timbre_map = _load_data()
    timbres = timbre_map.get(dominant_element, [])
    if not timbres:
        timbres = ['piano', 'strings'] if dominant_element in ('Water', 'Air') else ['guitar', 'organ']
    return SonicPayload(waveform=waveform, recommended_tempo_bpm=tempo, timbres=timbres)


def run_harmonic_engine(chart) -> HarmonicResult:
    primary_pent, primary_quad = _aggregate_canonical_modes(chart)
    tension = _compute_harmonic_tension(chart)
    dominant_element = _determine_dominant_element(chart)
    payload = _build_sonic_payload(dominant_element, tension)

    return HarmonicResult(
        primary_pentatonic_mode=primary_pent,
        primary_quadratonic_mode=primary_quad,
        harmonic_tension_index=tension,
        dominant_element=dominant_element,
        sonic_payload=payload,
    )

