"""Scale generation utilities.

Parse semitone patterns (e.g. "2-2-3-2-3") and produce MIDI note lists
for use by the composition builder.
"""
from typing import List


def parse_semitone_pattern(pattern: str) -> List[int]:
    """Parse a dash-separated semitone pattern into a list of ints.

    Examples:
        "2-2-3-2-3" -> [2,2,3,2,3]
    """
    if not pattern:
        return []
    parts = [p.strip() for p in pattern.split('-') if p.strip()]
    out = []
    for p in parts:
        try:
            out.append(int(p))
        except ValueError:
            # ignore malformed tokens
            continue
    return out


def generate_scale_notes(root_midi: int, pattern: str, octaves: int = 2) -> List[int]:
    """Generate ascending MIDI notes from a root and semitone pattern.

    The returned list contains notes across `octaves` octaves (pattern repeated).
    The root note is included as the first element.
    """
    intervals = parse_semitone_pattern(pattern)
    if not intervals:
        return [root_midi]

    notes = [root_midi]
    current = root_midi
    for _ in range(octaves):
        for i in intervals:
            current += i
            notes.append(current)
    return notes
