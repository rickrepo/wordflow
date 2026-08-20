import numpy as np

from djintro import dsp, render
from djintro.grid import detect_grid
from djintro.synth import make_track


def test_loop_length_is_exactly_repeats_times_seed():
    """The pre-roll must be overlap-ADDED, not crossfaded.

    Crossfading inserts the pre-roll into the timeline, so every repeat starts
    late and the body lands off the grid. Regression test for that bug.
    """
    t = make_track("one_drop", bars=16)
    g = detect_grid(t.audio, t.sr, genre="reggae")
    perc = render._as_2d(t.audio)
    seed, pre = render.extract_bars(perc, t.sr, g, 4, 4, pre_roll_ms=120.0)
    looped = render.loop_bars(seed, pre, 2, int(0.012 * t.sr))
    assert abs(len(looped) - 2 * (len(seed) - pre)) <= 1


def test_crossfade_join_is_equal_power():
    a = np.ones((1000, 1)); b = np.ones((1000, 1))
    out = render.crossfade_join(a, b, 100)
    assert len(out) == 1900
    # equal-power on identical constant signals stays above the linear-fade dip
    assert out.min() > 0.99


def test_zero_crossing_search_finds_a_rising_crossing():
    sr = 44100
    x = np.sin(2 * np.pi * 100 * np.arange(sr) / sr)[:, None]
    idx = render.zero_crossing_near(x, 5000, 500)
    assert abs(float(x[idx, 0])) < 0.05


def test_onset_valley_avoids_transients():
    t = make_track("four_on_floor", bars=8)
    onset, _ = dsp.onset_envelope(dsp.stft(dsp.to_mono(t.audio)), t.sr)
    peak = int(np.argmax(onset))
    valley = render.onset_valley(onset, peak, 12)
    assert onset[valley] <= onset[peak]


def test_build_switches_to_gain_staging_on_sparse_kicks():
    """A band-staged build on one-drop material leaves seconds of dead air."""
    t = make_track("one_drop", bars=8)
    g = detect_grid(t.audio, t.sr, genre="reggae")
    x = render._as_2d(t.audio)[:int(g.tick_to_time(8) * t.sr)]
    _, style = render.apply_build(x, t.sr, g, "HALF", 8, kick_density=0.9)
    assert style == "gain"
    _, style = render.apply_build(x, t.sr, g, "HALF", 8, kick_density=4.0)
    assert style == "band"
