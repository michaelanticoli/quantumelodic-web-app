from dataclasses import dataclass
from typing import List


@dataclass
class SonicPayload:
    waveform: str
    recommended_tempo_bpm: int
    timbres: List[str]


@dataclass
class HarmonicResult:
    primary_pentatonic_mode: str
    primary_quadratonic_mode: str
    harmonic_tension_index: int
    dominant_element: str
    sonic_payload: SonicPayload


@dataclass
class ModeScore:
    mode: str
    score: float


@dataclass
class ModeMetadata:
    mode_id: str
    mode_name: str = ''
    element: str = ''
    signs: str = ''
    semitone_pattern: str = ''
    notes: str = ''

