import os
import tempfile
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

from djintro import library
from djintro.grid import detect_grid
from djintro.profile import profile_track, tempo_band
from djintro.structure import analyse
from djintro.synth import make_track

VOCAL_BARS = tuple(range(8, 24))


@pytest.fixture(scope="module")
def wav(tmp_path_factory):
    d = tmp_path_factory.mktemp("lib")
    t = make_track("dancehall", bars=40, vocal_bars=VOCAL_BARS)
    p = d / "Test Track.wav"
    sf.write(str(p), t.audio, t.sr)
    return p


def test_tempo_band_covers_the_two_target_genres():
    assert tempo_band(98.0) == "dancehall"
    assert tempo_band(155.0) == "soca"
    assert tempo_band(70.0) == "other"


def test_structure_finds_the_vocal_section(wav):
    t = make_track("dancehall", bars=40, vocal_bars=VOCAL_BARS)
    g = detect_grid(t.audio, t.sr, genre="dancehall")
    st = analyse(t.audio, t.sr, g)
    # bars are 0-indexed internally; vocals were placed on bars 9-24 (1-indexed)
    v = st.vocal_by_bar
    assert v[10] > 0.5, "vocal section not detected"
    assert v[2] < 0.35, "intro wrongly reads as vocal"
    assert st.has_clear_instrumental


def test_mix_windows_avoid_the_vocal(wav):
    t = make_track("dancehall", bars=40, vocal_bars=VOCAL_BARS)
    g = detect_grid(t.audio, t.sr, genre="dancehall")
    st = analyse(t.audio, t.sr, g)
    assert st.mix_in, "no mix-in window found on a track with a clean intro"
    for w in st.mix_in + st.mix_out:
        assert w.vocal <= 0.35
        assert w.bars % 8 == 0, "windows must be phrase-aligned"


def test_fully_vocal_track_yields_no_mix_windows():
    """Refusing to name a window is the correct answer, not a failure."""
    t = make_track("dancehall", bars=32, vocal_bars=tuple(range(1, 31)))
    g = detect_grid(t.audio, t.sr, genre="dancehall")
    st = analyse(t.audio, t.sr, g)
    assert not st.mix_in and not st.mix_out


def test_profile_text_is_complete_and_parseable(wav):
    prof = profile_track(wav, genre="dancehall")
    txt = prof.to_text()
    for token in ("TRACK", "tempo", "Camelot", "PHRASE MAP", "SECTIONS", "MIX IN", "MIX OUT"):
        assert token in txt
    assert prof.n_bars > 0
    assert prof.tempo_band == "dancehall"
    import json
    assert json.loads(prof.to_json())["camelot"] == prof.camelot


def test_riddim_family_detected_for_identical_backing(tmp_path):
    """Two cuts over the same riddim must cluster; a different track must not."""
    a = make_track("dancehall", bars=32, seed=5, vocal_bars=tuple(range(8, 20)))
    b = make_track("dancehall", bars=32, seed=5, vocal_bars=tuple(range(14, 26)))
    c = make_track("soca", bars=32, seed=91, bpm=150.0)
    for name, t in (("A.wav", a), ("B.wav", b), ("C.wav", c)):
        sf.write(str(tmp_path / name), t.audio, t.sr)
    lib = library.build(library.scan(tmp_path), genre="auto")
    fams = {frozenset(f.members) for f in lib.families}
    assert frozenset({"A", "B"}) in fams
    assert not any("C" in f.members for f in lib.families)


def test_three_two_tempo_relation_is_recognised():
    """100 -> 150 is how a dancehall set gets into soca."""
    pct, note, penalty = library._tempo_relation(100.0, 150.0)
    assert "3:2" in note
    assert penalty < 0.5
    _, _, bad = library._tempo_relation(100.0, 123.0)
    assert bad >= 1.0


def test_transition_rejects_clashing_keys():
    from djintro.profile import TrackProfile
    def mk(name, camelot, bpm):
        return TrackProfile(path=name, name=name, duration_s=180, n_bars=64, meter=4,
                            bpm=bpm, tempo_drift_pct=0.0, tempo_band="dancehall",
                            key_name="x", camelot=camelot, key_confidence=0.5,
                            drum_pattern="dancehall", first_downbeat_s=0.0,
                            phase_confidence=0.9, vocal_contrast=0.4)
    assert library.score_transition(mk("a", "8A", 100), mk("b", "2A", 101)) is None
    assert library.score_transition(mk("a", "8A", 100), mk("b", "9A", 101)) is not None
