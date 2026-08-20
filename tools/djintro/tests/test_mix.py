import numpy as np
import pytest

from djintro import dsp, mix
from djintro.grid import detect_grid
from djintro.key import detect_key
from djintro.synth import CHORD_CYCLES, make_mix

SPECS = [
    dict(pattern="dancehall", bars=32, blend_bars=16, chord_cycle="cgfd",
         vocal_bars=tuple(range(8, 24))),
    dict(pattern="dancehall", bars=40, blend_bars=8, chord_cycle="am_vamp",
         transpose=5, vocal_bars=tuple(range(12, 30))),
    dict(pattern="soca", bars=32, blend_bars=0, chord_cycle="soca6", transpose=2),
    dict(pattern="soca", bars=28, blend_bars=0, chord_cycle="minor3", transpose=7),
]


@pytest.fixture(scope="module")
def mix_fixture():
    return make_mix(SPECS, bpm=100.0)


# ------------------------------------------------------- the generator itself

def test_ground_truth_matches_the_audio_length(mix_fixture):
    """Regression: segment bookkeeping used to double-count every overlap.

    Advancing the cursor by play_bars ignores the bars each blend consumes, so
    the ground truth walked off the end of the audio -- the last segment claimed
    to end at 240 s of a 182 s mix, which makes every accuracy figure measured
    against it meaningless.
    """
    m = mix_fixture
    bar_s = 60.0 / m.bpm * 4
    assert abs(m.segments[-1].end_bar * bar_s - m.duration) < 0.5


def test_overlaps_are_consistent_with_declared_blends(mix_fixture):
    m = mix_fixture
    for i, t in enumerate(m.transitions):
        a, b = m.segments[t.from_index], m.segments[t.to_index]
        overlap = a.end_bar - b.start_bar
        assert overlap == t.bars, f"transition {i}: overlap {overlap} != blend {t.bars}"


def test_distinct_chord_cycles_are_actually_distinct():
    """A transposed copy of one progression is not a second track.

    Averaged over its cycle it is a rotation of the same pitch-class set, and
    rotations of a broad set are nearly indistinguishable -- so a mix built that
    way tests nothing. Cycles must differ in shape and length, not just key.
    """
    lengths = {name: len(c) for name, c in CHORD_CYCLES.items()}
    assert len(set(lengths.values())) >= 3, "cycles must vary in length"


# ------------------------------------------------------- what does work

def test_grid_recovers_the_mix_tempo(mix_fixture):
    m = mix_fixture
    g = detect_grid(m.audio, m.sr, genre="auto")
    assert abs(g.bpm - m.bpm) / m.bpm < 0.02


def test_key_detection_tracks_transposition_within_a_mix(mix_fixture):
    """Keying a segment's interior recovers that track's transposition."""
    m = mix_fixture
    g = detect_grid(m.audio, m.sr, genre="auto")
    mono = dsp.to_mono(m.audio)
    # interior of segment 0 (no transposition) and segment 1 (+5 semitones)
    a = mono[int(g.tick_to_time(2) * m.sr):int(g.tick_to_time(14) * m.sr)]
    b = mono[int(g.tick_to_time(34) * m.sr):int(g.tick_to_time(46) * m.sr)]
    ka, kb = detect_key(a, m.sr), detect_key(b, m.sr)
    assert ka.camelot != kb.camelot, "two differently-transposed tracks keyed the same"


def test_bar_features_have_the_expected_shape(mix_fixture):
    m = mix_fixture
    g = detect_grid(m.audio, m.sr, genre="auto")
    f = mix._bar_features(dsp.to_mono(m.audio), m.sr, g)
    assert f["chroma"].shape == (g.n_bars, 12)
    assert f["low"].shape == (g.n_bars, 12)
    assert f["rms"].shape == (g.n_bars,)


# ------------------------------------------------------- honesty about limits

def test_analysis_reports_its_own_segmentation_confidence(mix_fixture):
    m = mix_fixture
    a = mix.analyse_mix(m.audio, m.sr, genre="auto")
    assert 0.0 <= a.segmentation_confidence <= 1.0
    assert isinstance(a.reliable, bool)


def test_low_contrast_material_is_flagged_not_silently_reported():
    """The whole point: never emit authoritative-looking boundaries we cannot back.

    A mix of near-identical tracks has no block structure to find. The analyser
    must say so rather than print bar numbers and blend lengths that read as
    measurements.
    """
    same = [dict(pattern="dancehall", bars=24, blend_bars=8, chord_cycle="cgfd")
            for _ in range(4)]
    m = make_mix(same, bpm=100.0)
    a = mix.analyse_mix(m.audio, m.sr, genre="auto")
    assert not a.reliable
    assert any("not cleanly separated" in w for w in a.warnings)


def test_implausible_blend_lengths_are_reported_as_unknown(mix_fixture):
    m = mix_fixture
    a = mix.analyse_mix(m.audio, m.sr, genre="auto")
    for t in a.transitions:
        assert t.bars <= mix.MAX_PLAUSIBLE_BLEND_BARS or t.bars == -1
        if t.bars == -1:
            assert t.kind == "unknown"


def test_phrase_alignment_is_computed_against_real_phrase_lines():
    assert mix._phrase_alignment(32) == (True, 32)
    assert mix._phrase_alignment(16) == (True, 16)
    assert mix._phrase_alignment(8) == (True, 8)
    assert mix._phrase_alignment(13)[0] is False


def test_transition_kind_labels_match_blend_length():
    assert mix._kind(0) == "cut"
    assert mix._kind(2) == "quick blend"
    assert mix._kind(8) == "blend"
    assert mix._kind(16) == "long blend"
    assert mix._kind(30) == "extended blend"
