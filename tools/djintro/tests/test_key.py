import numpy as np
import pytest

from djintro.key import (CAMELOT_MAJOR, CAMELOT_MINOR, PITCH_NAMES, camelot_distance,
                         compatible_keys, detect_key)

SR = 44100
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(PITCH_NAMES)}


def _tone(f, d, amp=1.0):
    t = np.arange(int(d * SR)) / SR
    return amp * sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 2, 3)) * np.exp(-t * 0.6)


def _chord(r, third, fifth, d=1.2):
    # bass root included -- that is what establishes tonality
    return _tone(NOTE[r], d) + _tone(NOTE[third], d) + _tone(NOTE[fifth], d) \
        + _tone(NOTE[r] / 2, d, 1.4)


def _progression(chords, reps=4):
    return np.concatenate([_chord(*c) for c in chords] * reps)


def test_camelot_wheel_matches_the_standard():
    assert CAMELOT_MAJOR[0] == "8B"      # C major
    assert CAMELOT_MINOR[9] == "8A"      # A minor, its relative
    assert CAMELOT_MAJOR[7] == "9B"      # G major, a fifth up
    assert CAMELOT_MINOR[2] == "7A"      # D minor
    assert CAMELOT_MAJOR[6] == "2B"      # F# major


def test_camelot_distance_ranks_the_usable_moves():
    assert camelot_distance("8A", "8A")[0] == 0
    assert camelot_distance("8A", "8B")[0] == 1     # relative major
    assert camelot_distance("8A", "9A")[0] == 1     # +1 on the wheel
    assert camelot_distance("8A", "7A")[0] == 1     # -1
    assert camelot_distance("8A", "10A")[0] == 2    # energy change
    assert camelot_distance("8A", "2A")[0] >= 3     # clash


def test_wheel_wraps_at_twelve():
    assert camelot_distance("12A", "1A")[0] == 1
    assert camelot_distance("1A", "12A")[0] == 1


def test_compatible_keys_are_the_four_standard_moves():
    assert set(compatible_keys("4A")) == {"4A", "4B", "5A", "3A"}
    assert set(compatible_keys("1B")) == {"1B", "1A", "2B", "12B"}


@pytest.mark.parametrize("name,chords,want", [
    ("A minor", [("A", "C", "E"), ("F", "A", "C"), ("C", "E", "G"),
                 ("G", "B", "D"), ("A", "C", "E")], "8A"),
    ("C major", [("C", "E", "G"), ("F", "A", "C"), ("G", "B", "D"), ("C", "E", "G")], "8B"),
    ("F minor", [("F", "G#", "C"), ("C#", "F", "G#"), ("G#", "C", "D#"),
                 ("D#", "G", "A#"), ("F", "G#", "C")], "4A"),
    ("G minor", [("G", "A#", "D"), ("D#", "G", "A#"), ("A#", "D", "F"),
                 ("F", "A", "C"), ("G", "A#", "D")], "6A"),
])
def test_key_detection_on_known_progressions(name, chords, want):
    k = detect_key(_progression(chords), SR, use_harmonic=False)
    assert k.camelot == want, f"{name}: got {k}"


def test_low_notes_do_not_smear_into_neighbouring_pitch_classes():
    """Regression: crude bin-folding put 0.45 energy on an unplayed A#.

    At n_fft=2048 the bins are 21.5 Hz apart while a semitone at 130 Hz spans
    about 8 Hz, so nearest-bin folding smeared every low note and flipped the
    detected key. The semitone filterbank fixed it.
    """
    from djintro.dsp import chroma_precise
    x = _progression([("A", "C", "E"), ("F", "A", "C"), ("C", "E", "G"), ("G", "B", "D")])
    ch = chroma_precise(x, SR)
    p = np.median(ch, axis=1)
    p = p / p.max()
    played = {"A", "C", "E", "F", "G", "B", "D"}
    for i, n in enumerate(PITCH_NAMES):
        if n not in played:
            assert p[i] < 0.55, f"{n} not played but reads {p[i]:.2f}"
