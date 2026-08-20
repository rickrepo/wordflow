import pytest

from djintro.phrase import CUE_COLORS, Cue, phrase_cue_layout
from djintro.serato import (build_beatgrid, build_markers2, parse_beatgrid,
                            parse_markers2)


def _cues():
    return [Cue(0, 0, "Intro", CUE_COLORS["start"], 1),
            Cue(1, 15600, "Drop", CUE_COLORS["drop"], 9),
            Cue(2, 46800, "+16 (16)", CUE_COLORS["phrase16"], 25)]


def test_markers2_round_trip_preserves_every_field():
    cues = _cues()
    parsed = parse_markers2(build_markers2(cues))
    assert len(parsed) == len(cues)
    for a, b in zip(cues, parsed):
        assert (a.index, a.position_ms, a.name, a.color) == \
               (b.index, b.position_ms, b.name, b.color)


def test_markers2_handles_all_eight_slots():
    cues = [Cue(i, i * 1000, f"c{i}", (i * 8, 0, 0), i + 1) for i in range(8)]
    assert len(parse_markers2(build_markers2(cues))) == 8


def test_beatgrid_anchors_on_a_downbeat():
    """The anchor must be a downbeat or Serato's bar display fights the phrasing."""
    beats = [0.25 + i * 0.5 for i in range(64)]
    first, n_beats, last, bpm = parse_beatgrid(build_beatgrid(beats, 120.0, 4, phase=0))
    assert abs(first - beats[0]) < 1e-4
    assert abs(bpm - 120.0) < 1e-3
    assert n_beats == (64 // 4 - 1) * 4


def test_beatgrid_respects_phase():
    beats = [i * 0.5 for i in range(64)]
    first, *_ = parse_beatgrid(build_beatgrid(beats, 120.0, 4, phase=2))
    assert abs(first - beats[2]) < 1e-4


def test_beatgrid_needs_two_downbeats():
    with pytest.raises(ValueError):
        build_beatgrid([0.0, 0.5, 1.0], 120.0, 4, 0)
