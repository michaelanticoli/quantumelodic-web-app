"""Export Composition objects to .mid files using mido.

This module performs a minimal conversion of `composition_builder.Composition`
to a `mido.MidiFile` and writes it to disk.
"""
from typing import List
import mido

TICKS_PER_BEAT = 480


def _note_to_messages(note_midi: int, velocity: int, ticks: int):
    return [
        mido.Message('note_on', note=note_midi, velocity=velocity, time=0),
        mido.Message('note_off', note=note_midi, velocity=0, time=ticks),
    ]


def export_composition(composition, path: str):
    mid = mido.MidiFile(ticks_per_beat=TICKS_PER_BEAT)
    tempo = mido.bpm2tempo(composition.tempo_bpm)
    for track in composition.tracks:
        mtrack = mido.MidiTrack()
        # set tempo on first track
        mtrack.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))

        # maintain a running delta time in ticks
        for note in track.notes:
            ticks = int(note.length_beats * TICKS_PER_BEAT)
            # note_on with time=0, note_off with time=ticks
            mtrack.append(mido.Message('note_on', note=note.midi, velocity=note.velocity, time=0))
            mtrack.append(mido.Message('note_off', note=note.midi, velocity=0, time=ticks))

        mid.tracks.append(mtrack)

    mid.save(path)
