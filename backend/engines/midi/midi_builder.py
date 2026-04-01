"""
MIDI builder – converts Quantumelodic musical parameters into a MIDI sequence
description (note events, program numbers, tempo map).

This module purposely avoids hard dependencies on midiutil/pretty_midi etc. so
it can run in any Python environment.  The raw data it returns can be passed to
a MIDI library by the caller, or returned as JSON to the client.
"""

from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# Note name → MIDI number
# ---------------------------------------------------------------------------

_NOTE_TO_SEMITONE: dict[str, int] = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4,
    "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11,
}

_MODE_INTERVALS: dict[str, list[int]] = {
    "Ionian":     [0, 2, 4, 5, 7, 9, 11],  # Major
    "Dorian":     [0, 2, 3, 5, 7, 9, 10],
    "Phrygian":   [0, 1, 3, 5, 7, 8, 10],
    "Lydian":     [0, 2, 4, 6, 7, 9, 11],
    "Mixolydian": [0, 2, 4, 5, 7, 9, 10],
    "Aeolian":    [0, 2, 3, 5, 7, 8, 10],  # Natural Minor
    "Locrian":    [0, 1, 3, 5, 6, 8, 10],
}

DEFAULT_OCTAVE = 4  # Middle octave


def note_name_to_midi(note: str, octave: int = DEFAULT_OCTAVE) -> int:
    """Convert a note name (e.g. "C#") to a MIDI note number."""
    semitone = _NOTE_TO_SEMITONE.get(note, 0)
    return (octave + 1) * 12 + semitone


def build_scale(root_note: str, mode: str, octave: int = DEFAULT_OCTAVE) -> list[int]:
    """Build a MIDI note list for a scale."""
    root_midi = note_name_to_midi(root_note, octave)
    intervals = _MODE_INTERVALS.get(mode, _MODE_INTERVALS["Ionian"])
    return [root_midi + interval for interval in intervals]


def build_midi_sequence(
    music_params: dict[str, Any],
    bars: int = 8,
    ticks_per_beat: int = 480,
) -> dict[str, Any]:
    """
    Build a MIDI sequence description from Quantumelodic music parameters.

    Args:
        music_params: Output from ``ai_music.music_generator.generate_music_params``.
        bars: Length of sequence in bars.
        ticks_per_beat: MIDI resolution.

    Returns:
        Dict describing the MIDI sequence (tempo, tracks, events).
        Suitable for serialising to JSON or passing to midiutil.
    """
    tempo_bpm = music_params.get("blendedTempo", 100)
    root_key = music_params.get("dominantKey", "C")
    mode = music_params.get("dominantMode", "Ionian")

    scale = build_scale(root_key, mode)
    beats_per_bar = 4
    total_beats = bars * beats_per_bar
    ticks_total = total_beats * ticks_per_beat

    # Build a simple arpeggiated melody on the scale
    melody_events: list[dict[str, Any]] = []
    for beat in range(total_beats):
        scale_degree = beat % len(scale)
        note = scale[scale_degree]
        melody_events.append({
            "tick": beat * ticks_per_beat,
            "pitch": note,
            "velocity": 80,
            "duration_ticks": ticks_per_beat - 10,
            "channel": 0,
        })

    # Build a bass line on root + fifth
    root_midi = note_name_to_midi(root_key, DEFAULT_OCTAVE - 1)
    fifth_midi = root_midi + 7
    bass_events: list[dict[str, Any]] = []
    for bar in range(bars):
        tick = bar * beats_per_bar * ticks_per_beat
        bass_events.append({
            "tick": tick,
            "pitch": root_midi,
            "velocity": 90,
            "duration_ticks": beats_per_bar * ticks_per_beat // 2 - 10,
            "channel": 1,
        })
        bass_events.append({
            "tick": tick + beats_per_bar * ticks_per_beat // 2,
            "pitch": fifth_midi,
            "velocity": 85,
            "duration_ticks": beats_per_bar * ticks_per_beat // 2 - 10,
            "channel": 1,
        })

    return {
        "tempo_bpm": tempo_bpm,
        "ticks_per_beat": ticks_per_beat,
        "total_ticks": ticks_total,
        "key": root_key,
        "mode": mode,
        "scale_midi": scale,
        "tracks": [
            {"name": "Melody", "program": 48, "events": melody_events},  # Cello
            {"name": "Bass",   "program": 32, "events": bass_events},    # Acoustic Bass
        ],
    }
