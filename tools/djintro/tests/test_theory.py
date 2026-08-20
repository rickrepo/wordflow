import numpy as np
import pytest

from djintro import dsp, theory
from djintro.grid import detect_grid
from djintro.profile import _bar_template
from djintro.synth import make_track


def _pcs(*pitch_classes, strength=1.0):
    v = np.full(12, 0.05)
    for p in pitch_classes:
        v[p % 12] = strength
    return v


# ---------------------------------------------------------------- consonance

def test_huron_consonance_ordering():
    c = theory.INTERVAL_CLASS_CONSONANCE
    assert c[5] > c[3] > c[4] > 0 > c[6] > c[2] > c[1], "consonance ordering is wrong"


def test_bass_semitone_and_tritone_are_penalised_hardest():
    q = theory.BASS_INTERVAL
    assert q[0][0] > q[7][0] > q[5][0]                  # unison > fifth > fourth
    assert q[1][0] < 0.2 and q[6][0] < 0.2              # semitone, tritone unusable
    assert q[10][0] > q[6][0]                            # b7 beats a tritone


def test_consonant_pitch_sets_beat_dissonant_ones():
    c_major = _pcs(0, 4, 7)
    g_major = _pcs(7, 11, 2)          # a fifth away, shares tones
    db_major = _pcs(1, 5, 8)          # a semitone away
    assert theory.pcs_dissonance(c_major, g_major) > theory.pcs_dissonance(c_major, db_major)


def test_common_tones_counts_shared_pitch_classes():
    assert theory.common_tones(_pcs(0, 4, 7), _pcs(0, 4, 7), top_n=3) == 3
    assert theory.common_tones(_pcs(0, 4, 7), _pcs(1, 5, 8), top_n=3) == 0


# ---------------------------------------------------------------- direction

def test_camelot_direction_distinguishes_lift_from_relax():
    """Camelot calls +1 and -1 both 'distance 1'. They do opposite things."""
    assert theory.camelot_direction("8A", "9A")[0] == "lift"
    assert theory.camelot_direction("8A", "7A")[0] == "relax"
    assert theory.camelot_direction("8A", "8B")[0] == "brighten"
    assert theory.camelot_direction("8B", "8A")[0] == "darken"


def test_direction_wraps_the_wheel():
    assert theory.camelot_direction("12A", "1A")[0] == "lift"
    assert theory.camelot_direction("1A", "12A")[0] == "relax"


# ---------------------------------------------------------------- modes

def test_modes_are_distinguished_not_flattened_to_minor():
    """Aeolian, Dorian and Phrygian are all 'minor' to Camelot. They differ."""
    d_aeolian = theory.detect_mode(_pcs(2, 4, 5, 7, 9, 10, 0), tonic=2)
    d_dorian = theory.detect_mode(_pcs(2, 4, 5, 7, 9, 11, 0), tonic=2)
    assert d_aeolian.mode != d_dorian.mode
    assert d_aeolian.is_minorish and d_dorian.is_minorish


def test_brightness_orders_the_modes():
    b = theory.MODE_BRIGHTNESS
    assert b["lydian"] > b["ionian"] > b["mixolydian"] > b["dorian"] > b["aeolian"] > b["phrygian"]


# ---------------------------------------------------------------- rhythm

@pytest.mark.parametrize("pattern,genre,bpm,want", [
    ("dancehall", "dancehall", 100.0, "3 (half-time)"),
    ("soca", "soca", 150.0, "2+4"),
    ("four_on_floor", "house", 126.0, "2+4"),
])
def test_backbeat_detected_from_audio(pattern, genre, bpm, want):
    t = make_track(pattern, bars=20, bpm=bpm)
    g = detect_grid(t.audio, t.sr, genre=genre)
    rp = theory.rhythm_profile(_bar_template(dsp.to_mono(t.audio), t.sr, g))
    assert rp.backbeat == want


def test_backbeat_classifier():
    assert theory.describe_backbeat([4, 12]) == "2+4"
    assert theory.describe_backbeat([8]) == "3 (half-time)"
    assert theory.describe_backbeat([]) == "none/other"


def test_dancehall_into_soca_flags_the_backbeat_conflict():
    """The specific thing Camelot cannot see.

    Dancehall puts its snare on beat 3; soca puts it on 2 and 4. Beatmatched,
    those backbeats land in different places and a long blend fights itself --
    however compatible the keys are.
    """
    dh = theory.RhythmProfile(kick_steps=[0, 6], snare_steps=[8],
                              backbeat="3 (half-time)", syncopation=0.5)
    soca = theory.RhythmProfile(kick_steps=[0, 4, 8, 12], snare_steps=[4, 12],
                                backbeat="2+4", syncopation=0.5)
    score, notes = theory.rhythmic_compatibility(dh, soca)
    assert score < 0.7
    assert any("BACKBEAT CONFLICT" in n for n in notes)
    assert any("phrase" in n for n in notes), "must say what to do about it"


def test_matching_backbeats_score_well():
    a = theory.RhythmProfile(kick_steps=[0, 4, 8, 12], snare_steps=[4, 12],
                             backbeat="2+4", syncopation=0.35)
    b = theory.RhythmProfile(kick_steps=[0, 4, 8, 12], snare_steps=[4, 12],
                             backbeat="2+4", syncopation=0.38)
    score, notes = theory.rhythmic_compatibility(a, b)
    assert score > 0.9
    assert any("agree" in n for n in notes)


# ---------------------------------------------------------------- combined

def test_harmony_weights_the_bass_interval_hardest():
    """Same pitch-class content, different bass interval -> different verdict."""
    pcs = _pcs(0, 2, 4, 5, 7, 9, 11)
    good, _ = theory.harmonic_compatibility(pcs, pcs, bass_a=0, bass_b=7)   # fifth
    bad, _ = theory.harmonic_compatibility(pcs, pcs, bass_a=0, bass_b=6)    # tritone
    assert good > bad + 0.3


def test_phrygian_is_called_out():
    pcs = _pcs(0, 1, 3, 5, 7, 8, 10)
    ph = theory.Mode(0, "phrygian", 0.5)
    io = theory.Mode(0, "ionian", 0.5)
    _, notes = theory.harmonic_compatibility(pcs, pcs, 0, 0, ph, io)
    assert any("Phrygian" in n or "phrygian" in n for n in notes)


def test_bass_pitch_class_tracks_a_known_note():
    sr = 44100
    t = np.arange(sr * 3) / sr
    f = 440 * 2 ** ((41 - 69) / 12)          # F2, pitch class 5
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    pc, conf = theory.bass_pitch_class(x, sr)
    assert pc == 5, f"got {theory.PITCH_NAMES[pc]}, want F"
    assert conf > 0.5
