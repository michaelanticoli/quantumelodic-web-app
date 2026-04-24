"""
Map an `ephemeris_engine.Chart` to canonical modal families using
`modal_families_index.csv` and the canonical CSVs loaded by `data_loader`.

This module provides a small mapping layer that returns the pentatonic
and quadratonic mode IDs associated with the Sun, Moon and Rising signs,
and a convenience function to aggregate those mappings for a chart.
"""
from typing import Dict, Any
from . import data_loader


def map_sign_to_modal_family(sign: str) -> Dict[str, Any]:
    """Return the modal family row for a given sign (from modal_families_index)."""
    index = data_loader.load_modal_families_index()
    return index.get(sign, {})


def map_chart_to_modal_families(chart) -> Dict[str, Dict[str, Any]]:
    """Map key chart points (Sun, Moon, Rising) to their canonical modal rows.

    Returns a dict like:
    {
      'Sun': { ... modal_families_index row ... },
      'Moon': { ... },
      'Rising': { ... }
    }
    """
    result: Dict[str, Dict[str, Any]] = {}
    result['Sun'] = map_sign_to_modal_family(getattr(chart, 'sun_sign', ''))
    result['Moon'] = map_sign_to_modal_family(getattr(chart, 'moon_sign', ''))
    result['Rising'] = map_sign_to_modal_family(getattr(chart, 'rising_sign', ''))
    return result
