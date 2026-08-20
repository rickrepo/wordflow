"""Synthetic test audio with known ground truth.

The point of this module is to make grid detection falsifiable without a music
library. Each generated track carries its true beat times, true downbeat times
and true tempo, so phase accuracy is a measurement rather than a listen.

The pattern library covers the cases this engine is actually aimed at. Reggae
ONE DROP is the important one: beat 1 is deliberately empty and the kick lands
on beat 3, so any downbeat detector that assumes "kick on beat 1" locks on two
beats late, every time.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

SR = 44100
STEPS = 16  # sixteenth notes per 4/4 bar


@dataclass(frozen=True)
class DrumPattern:
    """Onsets as sixteenth-note indices within a bar, with velocities."""
    name: str
    kick: dict[int, float]
    snare: dict[int, float]
    hat: dict[int, float]
    skank: dict[int, float] = field(default_factory=dict)
    bpm: float = 120.0


# Velocity maps are step -> velocity. Steps 0,4,8,12 are beats 1,2,3,4.
PATTERNS: dict[str, DrumPattern] = {
    "four_on_floor": DrumPattern(
        name="four_on_floor",
        kick={0: 1.0, 4: 0.95, 8: 1.0, 12: 0.95},
        snare={4: 0.8, 12: 0.85},
        hat={i: (0.5 if i % 4 == 0 else 0.3) for i in range(0, 16, 2)},
        bpm=126.0,
    ),
    "soca": DrumPattern(
        name="soca",
        kick={0: 1.0, 4: 0.9, 8: 1.0, 12: 0.9},
        snare={4: 0.7, 12: 0.8, 14: 0.4},
        hat={i: (0.45 if i % 4 == 0 else 0.28) for i in range(16)},
        skank={2: 0.3, 6: 0.3, 10: 0.3, 14: 0.3},
        bpm=158.0,
    ),
    # Beat 1 empty. Kick + snare together on beat 3. Skank on the off-beats.
    "one_drop": DrumPattern(
        name="one_drop",
        kick={8: 1.0},
        snare={8: 0.9},
        hat={2: 0.3, 6: 0.35, 10: 0.3, 14: 0.35},
        skank={2: 0.8, 6: 0.8, 10: 0.8, 14: 0.8},
        bpm=74.0,
    ),
    # Kick on every beat, snare still on 3.
    "steppers": DrumPattern(
        name="steppers",
        kick={0: 0.9, 4: 0.85, 8: 1.0, 12: 0.85},
        snare={8: 0.9},
        hat={2: 0.3, 6: 0.35, 10: 0.3, 14: 0.35},
        skank={2: 0.75, 6: 0.75, 10: 0.75, 14: 0.75},
        bpm=78.0,
    ),
    # Light kick on 1, heavy on 3.
    "rockers": DrumPattern(
        name="rockers",
        kick={0: 0.55, 8: 1.0, 14: 0.45},
        snare={8: 0.9},
        hat={2: 0.3, 6: 0.35, 10: 0.3, 14: 0.35},
        skank={2: 0.8, 6: 0.8, 10: 0.8, 14: 0.8},
        bpm=72.0,
    ),
    "dancehall": DrumPattern(
        name="dancehall",
        kick={0: 1.0, 6: 0.8, 8: 0.5},
        snare={8: 0.95, 11: 0.35},
        hat={0: 0.35, 3: 0.3, 4: 0.35, 7: 0.3, 8: 0.35, 11: 0.3, 12: 0.35, 15: 0.3},
        skank={4: 0.5, 12: 0.5},
        bpm=98.0,
    ),
}


def _kick(sr: int, dur: float = 0.22, vel: float = 1.0) -> np.ndarray:
    n = int(sr * dur)
    t = np.arange(n) / sr
    f = 110.0 * np.exp(-t * 42.0) + 42.0
    env = np.exp(-t * 22.0)
    return vel * env * np.sin(2 * np.pi * np.cumsum(f) / sr)


def _snare(sr: int, dur: float = 0.17, vel: float = 1.0, rng=None) -> np.ndarray:
    rng = rng or np.random.default_rng(0)
    n = int(sr * dur)
    t = np.arange(n) / sr
    env = np.exp(-t * 30.0)
    noise = rng.standard_normal(n)
    # crude band emphasis around 200 Hz body + noise
    body = 0.5 * np.sin(2 * np.pi * 190.0 * t) * np.exp(-t * 45.0)
    return vel * env * (0.7 * noise + body) * 0.5


def _hat(sr: int, dur: float = 0.05, vel: float = 1.0, rng=None) -> np.ndarray:
    rng = rng or np.random.default_rng(1)
    n = int(sr * dur)
    t = np.arange(n) / sr
    env = np.exp(-t * 120.0)
    noise = rng.standard_normal(n)
    hp = np.diff(noise, prepend=0.0)  # cheap high-pass
    hp = np.diff(hp, prepend=0.0)
    return vel * env * hp * 0.12


def _skank(sr: int, root_hz: float, dur: float = 0.13, vel: float = 1.0) -> np.ndarray:
    """Short off-beat chord chop -- the reggae/dancehall guitar-or-organ stab."""
    n = int(sr * dur)
    t = np.arange(n) / sr
    env = np.exp(-t * 26.0) * (1 - np.exp(-t * 900.0))
    sig = np.zeros(n)
    for ratio in (1.0, 1.26, 1.5, 2.0):  # rough major triad + octave
        sig += np.sin(2 * np.pi * root_hz * ratio * t + ratio)
    return vel * env * sig / 4.0


def _bass(sr: int, root_hz: float, dur: float, vel: float = 1.0) -> np.ndarray:
    n = int(sr * dur)
    t = np.arange(n) / sr
    env = np.minimum(1.0, t * 60.0) * np.exp(-t * 3.0)
    return vel * env * (np.sin(2 * np.pi * root_hz * t)
                        + 0.3 * np.sin(4 * np.pi * root_hz * t)) * 0.5


def _vocal(sr: int, root_hz: float, dur: float, vel: float = 1.0) -> np.ndarray:
    """Harmonic, vibrato'd tone in a vocal range -- stands in for a lead vocal."""
    n = int(sr * dur)
    t = np.arange(n) / sr
    vib = 1.0 + 0.02 * np.sin(2 * np.pi * 5.5 * t)
    env = np.minimum(1.0, t * 12.0) * np.minimum(1.0, (dur - t) * 12.0)
    sig = np.zeros(n)
    for k, amp in enumerate((1.0, 0.6, 0.35, 0.2), start=1):
        sig += amp * np.sin(2 * np.pi * root_hz * k * np.cumsum(vib) / sr)
    return vel * env * sig / 2.2


@dataclass
class Track:
    audio: np.ndarray
    sr: int
    bpm: float
    beat_times: np.ndarray
    downbeat_times: np.ndarray
    pattern: str
    vocal_bars: tuple[int, ...]

    @property
    def duration(self) -> float:
        return len(self.audio) / self.sr


# A 4-bar chord cycle. Harmonic change lands on downbeats -- this is the
# evidence the grid uses instead of assuming a kick on beat 1.
CHORD_CYCLE_HZ = (65.41, 98.00, 87.31, 73.42)  # C2 G2 F2 D2


def make_track(pattern: str = "one_drop", bars: int = 32, sr: int = SR,
               bpm: float | None = None, lead_in_beats: float = 2.6,
               drift_bpm: float = 0.0, vocal_bars: tuple[int, ...] = (),
               seed: int = 7) -> Track:
    """Render a synthetic track and return it with ground-truth beat positions.

    lead_in_beats is deliberately fractional: it stops bar 1 from landing at
    t=0, which would make downbeat detection trivially correct.
    drift_bpm ramps the tempo linearly across the track to exercise the
    piecewise grid.
    """
    if pattern not in PATTERNS:
        raise ValueError(f"unknown pattern {pattern!r}; have {sorted(PATTERNS)}")
    pat = PATTERNS[pattern]
    bpm0 = float(bpm if bpm is not None else pat.bpm)
    rng = np.random.default_rng(seed)

    total_beats = bars * 4
    # Beat times with optional linear drift.
    beat_times = [lead_in_beats * 60.0 / bpm0]
    for i in range(total_beats):
        cur_bpm = bpm0 + drift_bpm * (i / max(total_beats - 1, 1))
        beat_times.append(beat_times[-1] + 60.0 / cur_bpm)
    beat_times = np.asarray(beat_times[:total_beats])
    downbeat_times = beat_times[::4].copy()

    length = int((beat_times[-1] + 4 * 60.0 / bpm0) * sr) + sr
    out = np.zeros(length)

    def place(sig: np.ndarray, t: float) -> None:
        i = int(round(t * sr))
        j = min(i + len(sig), length)
        if i < length:
            out[i:j] += sig[:j - i]

    for bar in range(bars):
        b0 = bar * 4
        if b0 >= len(beat_times):
            break
        bar_start = beat_times[b0]
        beat_dur = (beat_times[min(b0 + 4, len(beat_times) - 1)] - bar_start) / 4.0
        step_dur = beat_dur / 4.0
        root = CHORD_CYCLE_HZ[bar % len(CHORD_CYCLE_HZ)]

        for step, vel in pat.kick.items():
            place(_kick(sr, vel=vel), bar_start + step * step_dur)
        for step, vel in pat.snare.items():
            place(_snare(sr, vel=vel, rng=rng), bar_start + step * step_dur)
        for step, vel in pat.hat.items():
            place(_hat(sr, vel=vel, rng=rng), bar_start + step * step_dur)
        for step, vel in pat.skank.items():
            place(_skank(sr, root * 4.0, vel=vel), bar_start + step * step_dur)

        # Bass follows the chord; note lands on the downbeat.
        place(_bass(sr, root, beat_dur * 3.6, vel=0.9), bar_start)
        if bar in vocal_bars:
            place(_vocal(sr, root * 4.5, beat_dur * 3.8, vel=0.7), bar_start)

    out += 0.0012 * rng.standard_normal(length)
    peak = np.abs(out).max()
    if peak > 0:
        out = out / peak * 0.72
    return Track(audio=out.astype(np.float64), sr=sr, bpm=bpm0,
                 beat_times=beat_times, downbeat_times=downbeat_times,
                 pattern=pattern, vocal_bars=tuple(vocal_bars))
