import numpy as np

from djintro.grid import detect_grid
from djintro.phrase import MAX_HOT_CUES, phrase_cue_layout
from djintro.synth import make_track


def _grid(pattern="dancehall", genre="dancehall", bars=40):
    t = make_track(pattern, bars=bars)
    return detect_grid(t.audio, t.sr, genre=genre), t


def test_slot_one_is_the_top_and_slot_two_is_the_drop():
    g, _ = _grid()
    cues = phrase_cue_layout(g, intro_bars=8, phrase_bars=16)
    assert cues[0].position_ms == 0
    assert cues[0].bar == 1
    assert cues[1].name == "Drop"
    assert cues[1].bar == 9
    bar_s = g.bar_duration(0)
    assert abs(cues[1].position_ms / 1000.0 - 8 * bar_s) < 0.05


def test_cues_never_exceed_serato_slots():
    g, _ = _grid(bars=64)
    for phrase in (8, 16, 32):
        cues = phrase_cue_layout(g, phrase_bars=phrase)
        assert len(cues) <= MAX_HOT_CUES
        assert len({c.index for c in cues}) == len(cues)


def test_phrase_cues_land_on_phrase_boundaries_after_the_drop():
    g, _ = _grid(bars=64)
    cues = phrase_cue_layout(g, intro_bars=8, phrase_bars=16)
    for c in cues[2:]:
        assert (c.bar - 9) % 16 == 0


def test_cue_colors_encode_phrase_depth():
    g, _ = _grid(bars=80)
    cues = phrase_cue_layout(g, intro_bars=8, phrase_bars=8)
    by_bar = {c.bar: c.color for c in cues[2:]}
    # a +32 boundary must not be coloured the same as a +8 boundary
    if 9 + 32 in by_bar and 9 + 8 in by_bar:
        assert by_bar[9 + 32] != by_bar[9 + 8]


def test_layout_is_riddim_consistent():
    """Two tracks on the same riddim must get the same cue layout.

    That is the point of anchoring to the drop rather than to the top of the
    file: the muscle memory carries from one track to the next.
    """
    g1, _ = _grid("dancehall", "dancehall", bars=48)
    t2 = make_track("dancehall", bars=48, seed=99, lead_in_beats=3.1)
    g2 = detect_grid(t2.audio, t2.sr, genre="dancehall")
    a = phrase_cue_layout(g1, intro_bars=8, phrase_bars=16)
    b = phrase_cue_layout(g2, intro_bars=8, phrase_bars=16)
    assert [c.bar for c in a] == [c.bar for c in b]
