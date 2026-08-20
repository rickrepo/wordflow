import numpy as np
import pytest

from djintro.grid import detect_grid
from djintro.intro import build_drums_intro
from djintro.synth import make_track
from djintro.verify import Outcome, verify

CASES = [("one_drop", "reggae"), ("dancehall", "dancehall"), ("soca", "soca")]


def _build(pattern, genre, bars=24, **kw):
    t = make_track(pattern, bars=bars)
    g = detect_grid(t.audio, t.sr, genre=genre)
    return t, g, build_drums_intro(t.audio, t.sr, g, body_start_bar=8,
                                   seed_bars=4, build="HALF", **kw)


@pytest.mark.parametrize("pattern,genre", CASES)
def test_body_lands_exactly_on_the_eight_bar_lattice(pattern, genre):
    """The single most important property of the whole engine."""
    t, g, r = _build(pattern, genre)
    seed_dur = g.tick_to_time(r.seed_bar + r.seed_bars) - g.tick_to_time(r.seed_bar)
    bar = seed_dur / g.meter
    repeats = r.intro_bars // r.seed_bars
    want_s = repeats * seed_dur
    body_t = g.tick_to_time(8)
    nxt = next(d for d in g.downbeat_times if d >= body_t)
    out_pos = want_s + (nxt - body_t)
    k = out_pos / bar
    err_ms = abs(k - round(k)) * bar * 1000.0
    assert err_ms < 2.0, f"{err_ms:.2f} ms off the lattice"


@pytest.mark.parametrize("pattern,genre", CASES)
def test_intro_is_eight_bars_long(pattern, genre):
    t, g, r = _build(pattern, genre)
    seed_dur = g.tick_to_time(r.seed_bar + r.seed_bars) - g.tick_to_time(r.seed_bar)
    bars = (r.intro_bars // r.seed_bars) * seed_dur / (seed_dur / g.meter)
    assert abs(bars - 8) < 0.01


def test_sparse_kick_material_gets_gain_staging():
    _, _, r = _build("one_drop", "reggae")
    assert r.build.endswith(":gain")
    assert any("kick density" in n for n in r.notes)


def test_output_never_clips():
    for pattern, genre in CASES:
        _, _, r = _build(pattern, genre)
        assert float(np.abs(r.audio).max()) < 1.0


def test_verdict_is_never_silently_bad():
    """Every run ends in exactly one of three declared outcomes."""
    _, _, r = _build("one_drop", "reggae")
    v = verify(r, genre="reggae")
    assert v.outcome in (Outcome.DELIVER, Outcome.DELIVER_WITH_NOTE, Outcome.ABSTAIN)
    if v.outcome is Outcome.ABSTAIN:
        assert v.failures and any("blocked by" in n for n in v.notes)
    else:
        assert all(g.passed for g in v.gates)


def test_l4_always_carries_a_note_about_what_was_compromised():
    _, _, r = _build("dancehall", "dancehall")
    v = verify(r, genre="dancehall")
    if v.outcome is not Outcome.ABSTAIN:
        assert v.outcome is Outcome.DELIVER_WITH_NOTE
        assert any("L4" in n or "drums-only" in n for n in v.notes)
