"""CSV-based data loader for harmonic engine mappings.

This loader prefers a project-root `mappings/` directory (canonical CSVs).
If that folder does not exist it falls back to `data/mappings/`.

It provides helpers to load the canonical CSVs used by the engine:
- pentatonic_modes.csv (detailed rows)
- quadratonic_modes.csv (detailed rows)
- modal_families_index.csv (sign -> canonical family mapping)
- element_timbres.csv (element -> timbres)
"""
import csv
from pathlib import Path
from typing import Dict, List, Any


HERE = Path(__file__).resolve()
PROJECT_ROOT = HERE.parents[2]
MAPPINGS_ROOT = PROJECT_ROOT / 'mappings'
FALLBACK_ROOT = PROJECT_ROOT / 'data' / 'mappings'


def _choose_mappings_dir() -> Path:
    if MAPPINGS_ROOT.exists():
        return MAPPINGS_ROOT
    return FALLBACK_ROOT


def load_pentatonic_modes() -> Dict[str, Dict[str, Any]]:
    """Return a dict of pentatonic mode_id -> row dict (parsed via csv.DictReader)."""
    path = _choose_mappings_dir() / 'pentatonic_modes.csv'
    modes: Dict[str, Dict[str, Any]] = {}
    with open(path, newline='', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if not row:
                continue
            mode_id = row.get('mode_id') or row.get('id') or row.get('mode')
            if not mode_id:
                continue
            modes[mode_id] = {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}
    return modes


def load_quadratonic_modes() -> Dict[str, Dict[str, Any]]:
    path = _choose_mappings_dir() / 'quadratonic_modes.csv'
    modes: Dict[str, Dict[str, Any]] = {}
    with open(path, newline='', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if not row:
                continue
            mode_id = row.get('mode_id') or row.get('id')
            if not mode_id:
                continue
            modes[mode_id] = {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}
    return modes


def load_modal_families_index() -> Dict[str, Dict[str, Any]]:
    """Load `modal_families_index.csv` and return mapping by sign (e.g., 'Leo' -> row dict)."""
    path = _choose_mappings_dir() / 'modal_families_index.csv'
    mapping: Dict[str, Dict[str, Any]] = {}
    with open(path, newline='', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if not row:
                continue
            sign = row.get('sign')
            if not sign:
                continue
            mapping[sign] = {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}
    return mapping


def load_element_timbres() -> Dict[str, List[str]]:
    path = _choose_mappings_dir() / 'element_timbres.csv'
    timbre_map: Dict[str, List[str]] = {}
    if not path.exists():
        return timbre_map
    with open(path, newline='', encoding='utf-8') as fh:
        reader = csv.reader(fh)
        for row in reader:
            if not row:
                continue
            key = row[0].strip()
            values = [c.strip() for c in row[1:] if c.strip()]
            timbre_map[key] = values
    return timbre_map


def load_simple_map(filename: str) -> Dict[str, str]:
    """Backward-compatible simple two-column loader (key,value)."""
    path = _choose_mappings_dir() / filename
    out: Dict[str, str] = {}
    with open(path, newline='', encoding='utf-8') as fh:
        reader = csv.reader(fh)
        for row in reader:
            if not row or row[0].startswith('#'):
                continue
            key = row[0].strip()
            val = row[1].strip() if len(row) > 1 else ''
            out[key] = val
    return out


def load_map(filename: str):
    """Backward-compatible loader used by tests and older code.

    - If the filename matches a canonical CSV, return the richer parsed dict.
    - Otherwise fall back to the simple two-column map loader.
    """
    name = filename.strip()
    if name == 'pentatonic_modes.csv':
        return load_pentatonic_modes()
    if name == 'quadratonic_modes.csv':
        return load_quadratonic_modes()
    if name == 'modal_families_index.csv':
        return load_modal_families_index()
    if name == 'element_timbres.csv':
        return load_element_timbres()
    return load_simple_map(name)

