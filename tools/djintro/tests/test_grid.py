import numpy as np
import pytest

from djintro.grid import GENRE_BPM, detect_grid
from djintro.synth import PATTERNS, make_track

GENRE = {"four_on_floor": "house", "soca": "soca", "dancehall": "dancehall",
         "one_drop": "reggae", "steppers": "reggae", "rockers": "reggae"}


def downbeat_error_beats(grid, track):
    """Median downbeat error, in beats."""
    if grid.n_bars == 0:
        return 99.0
    errs = [abs(d - track.downbeat_times[np.argmin(abs(track.downbeat_times - d))])
            for d in grid.downbeat_times]
    return float(np.median(errs)) / (60.0 / track.bpm)


@pytest.mark.parametrize("pattern", sorted(PATTERNS))
def test_downbeat_phase_is_correct(pattern):
    t = make_track(pattern, bars=16)
    g = detect_grid(t.audio, t.sr, genre=GENRE[pattern])
    assert downbeat_error_beats(g, t) < 0.15


def test_one_drop_is_not_two_beats_late():
    """The specific regression this engine exists to avoid.

    Reggae one drop leaves beat 1 empty and puts the kick on beat 3. A detector
    that assumes the kick marks beat 1 lands exactly two beats late. Assert we
    are not near that.
    """
    t = make_track("one_drop", bars=16)
    g = detect_grid(t.audio, t.sr, genre="reggae")
    err = downbeat_error_beats(g, t)
    assert err < 0.15, f"off by {err:.2f} beats"
    # and specifically not the 2-beat rotation
    assert not (1.6 < err < 2.4)


@pytest.mark.parametrize("pattern", ["one_drop", "rockers"])
def test_offbeat_skank_does_not_capture_the_lattice(pattern):
    """The skank is louder than the pulse; the grid must not lock to it."""
    t = make_track(pattern, bars=16)
    g = detect_grid(t.audio, t.sr, genre="reggae")
    err = downbeat_error_beats(g, t)
    assert err < 0.25, f"lattice off by {err:.2f} beats (0.5 = locked to the skank)"


def test_tempo_drift_is_followed_not_averaged():
    t = make_track("four_on_floor", bars=20, drift_bpm=6.0)
    g = detect_grid(t.audio, t.sr, genre="house")
    assert downbeat_error_beats(g, t) < 0.15


def test_tick_to_time_interpolates_between_real_beats():
    t = make_track("dancehall", bars=12)
    g = detect_grid(t.audio, t.sr, genre="dancehall")
    a = g.tick_to_time(2, 0, 0)
    mid = g.tick_to_time(2, 0, 240)
    b = g.tick_to_time(2, 1, 0)
    assert a < mid < b
    assert abs(mid - (a + b) / 2) < 1e-6


def test_genre_ranges_are_disjoint_where_it_matters():
    assert GENRE_BPM["reggae"][1] < GENRE_BPM["soca"][0]
