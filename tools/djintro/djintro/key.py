"""Musical key detection, reported in Camelot notation.

Camelot rather than "F minor" because that is what the mixing decision is
actually made in: same number, +/-1 number, or the relative major/minor across
the same number. The letter names are kept alongside for readability.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from . import dsp

PITCH_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")

# Shaath profiles (as used by KeyFinder), not Krumhansl-Kessler. KK was derived
# from probe-tone experiments on classical listeners and under-weights the flat
# seventh and the minor third, both of which are everywhere in dancehall and
# soca. Shaath is fitted to modern produced music and behaves much better here.
MAJOR_PROFILE = np.array([6.6, 2.0, 3.5, 2.3, 4.6, 4.0, 2.5, 5.2, 2.4, 3.7, 2.3, 3.4])
MINOR_PROFILE = np.array([6.5, 2.7, 3.5, 5.4, 2.6, 3.5, 2.5, 5.2, 4.0, 2.7, 4.3, 3.2])


def _camelot_maps() -> tuple[dict[int, str], dict[int, str]]:
    """Build pitch-class -> Camelot code, walking the circle of fifths.

    C major is 8B and its relative minor A is 8A; each perfect fifth up moves
    one step clockwise.
    """
    major, minor = {}, {}
    pc = 0    # C major = 8B
    for i in range(12):
        major[pc % 12] = f"{(7 + i) % 12 + 1}B"
        pc += 7
    pc = 9    # A minor = 8A
    for i in range(12):
        minor[pc % 12] = f"{(7 + i) % 12 + 1}A"
        pc += 7
    return major, minor


CAMELOT_MAJOR, CAMELOT_MINOR = _camelot_maps()


@dataclass(frozen=True)
class Key:
    tonic: int          # pitch class 0-11
    mode: str           # "major" | "minor"
    camelot: str        # e.g. "4A"
    confidence: float   # margin between best and runner-up, 0-1

    @property
    def name(self) -> str:
        return f"{PITCH_NAMES[self.tonic]} {self.mode}"

    def __str__(self) -> str:
        return f"{self.name} ({self.camelot})"


def camelot_number(code: str) -> int:
    return int(code[:-1])


def camelot_letter(code: str) -> str:
    return code[-1]


def camelot_distance(a: str, b: str) -> tuple[int, str]:
    """Distance between two Camelot codes -> (steps, description).

    Lower is smoother. The relationships DJs actually use:
      0  same key
      1  relative major/minor (same number, other letter) or +/-1 on the wheel
      2  +/-2 on the wheel -- an energy change, usable but noticeable
      3+ a clash unless you are doing something deliberate
    """
    na, nb = camelot_number(a), camelot_number(b)
    la, lb = camelot_letter(a), camelot_letter(b)
    ring = min((na - nb) % 12, (nb - na) % 12)
    if a == b:
        return 0, "same key"
    if na == nb and la != lb:
        return 1, "relative major/minor"
    if ring == 1 and la == lb:
        return 1, f"{'+' if (nb - na) % 12 == 1 else '-'}1 on the wheel"
    if ring == 2 and la == lb:
        return 2, f"{'+' if (nb - na) % 12 == 2 else '-'}2 (energy change)"
    if ring == 1 and la != lb:
        return 2, "diagonal"
    return 3 + ring, "clash"


def compatible_keys(code: str) -> list[str]:
    """Every Camelot code that mixes smoothly with `code`."""
    n, letter = camelot_number(code), camelot_letter(code)
    other = "A" if letter == "B" else "B"
    return [code,
            f"{n}{other}",
            f"{(n % 12) + 1}{letter}",
            f"{((n - 2) % 12) + 1}{letter}"]


def detect_key(audio: np.ndarray, sr: int, use_harmonic: bool = True) -> Key:
    """Estimate key by correlating the average chroma against rotated profiles.

    Runs on the HARMONIC component by default. Percussion smears energy across
    every pitch class, and in dancehall and soca the drums are loud enough that
    including them drags the chroma toward flat and the estimate toward noise.
    """
    mono = dsp.to_mono(np.asarray(audio, dtype=np.float64))
    if use_harmonic:
        mag = dsp.stft(mono)
        harm, _ = dsp.hpss(mag)
        mono = dsp.istft(harm, np.angle(np.fft.rfft(
            np.pad(mono, dsp.N_FFT // 2, mode="reflect")[
                np.arange(dsp.N_FFT)[None, :]
                + dsp.HOP * np.arange(mag.shape[1])[:, None]]
            * np.hanning(dsp.N_FFT + 1)[:-1], n=dsp.N_FFT, axis=1).T), len(mono))
    chroma = dsp.chroma_precise(mono, sr)
    if chroma.shape[1] == 0:
        return Key(0, "major", "8B", 0.0)

    # Median over time, not mean: a single loud chord stab should not decide the
    # key of a four-minute track.
    profile = np.median(chroma, axis=1)
    profile = profile - profile.mean()
    norm = np.linalg.norm(profile) + 1e-9

    scores: list[tuple[float, int, str]] = []
    for tonic in range(12):
        for mode, ref in (("major", MAJOR_PROFILE), ("minor", MINOR_PROFILE)):
            r = np.roll(ref, tonic)
            r = r - r.mean()
            scores.append((float(profile @ r / (norm * np.linalg.norm(r))), tonic, mode))
    scores.sort(reverse=True)
    best, tonic, mode = scores[0]
    runner = scores[1][0]
    conf = float(np.clip((best - runner) / (abs(best) + 1e-9), 0.0, 1.0))
    camelot = (CAMELOT_MAJOR if mode == "major" else CAMELOT_MINOR)[tonic]
    return Key(tonic, mode, camelot, conf)
