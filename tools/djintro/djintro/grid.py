"""Bar grid detection: beats, meter, and -- the hard part -- which beat is 1.

Grid phase (which beat is beat 1) is not the same thing as a phrase (an 8/16/32
bar section you mix on). This module finds grid phase. Phrases are derived from
it in phrase.py.

Phase evidence comes from three independent sources, deliberately NOT including
"the kick lands on beat 1". That assumption is false for a large fraction of the
music this engine targets: in reggae one drop, beat 1 is silent and the kick
lands on beat 3, so a kick-on-1 detector locks on two beats late every time.

  1. Boundary novelty  -- musical change happens AT bar lines, not inside bars.
  2. Harmonic rhythm   -- chord changes land on downbeats. Genre-independent,
                          and very strong on riddim-based music where the chord
                          cycle is short and rigidly repeated.
  3. Bar-pattern match -- correlation against a library of real drum patterns
                          that includes the one-drop family, so a pattern with
                          an empty beat 1 is recognised rather than rotated.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from . import dsp

TICKS_PER_BEAT = 480

# Genre BPM ranges. A generic prior centred near 120 BPM is actively harmful
# here -- it pulls reggae (60-95) up an octave and soca (135-175) down one.
# Naming the genre is a legitimate, reliable way to settle tempo octave, and
# far more honest than pretending the ambiguity is auto-resolvable.
GENRE_BPM: dict[str, tuple[float, float]] = {
    "reggae": (60.0, 95.0),
    "dancehall": (82.0, 115.0),
    "soca": (135.0, 175.0),
    "afrobeats": (95.0, 120.0),
    "house": (118.0, 132.0),
    "hiphop": (75.0, 105.0),
    "auto": (55.0, 200.0),
}


def _t(*steps_and_vels: tuple[int, float]) -> dict[int, float]:
    return {s: v for s, v in steps_and_vels}


def _template(kick: dict[int, float], snare: dict[int, float],
              hat: dict[int, float], steps: int = 16) -> np.ndarray:
    """Build a (3, steps) idealised bar template: [kick, snare/mid, hat/high]."""
    rows = []
    for d in (kick, snare, hat):
        r = np.zeros(steps)
        for s, v in d.items():
            r[s % steps] = v
        rows.append(r)
    return np.asarray(rows)


# Idealised, coarse templates -- intentionally NOT copies of any generator's
# velocity maps. They encode where a pattern family puts its accents, nothing
# more. A track whose pattern is absent from this library still gets scored by
# the novelty and harmonic-rhythm evidence, which carry most of the weight.
BAR_TEMPLATES: dict[str, np.ndarray] = {
    "four_on_floor": _template({0: 1, 4: 1, 8: 1, 12: 1}, {4: 1, 12: 1},
                               {i: 0.5 for i in range(0, 16, 2)}),
    "backbeat": _template({0: 1, 8: 0.6}, {4: 1, 12: 1},
                          {i: 0.5 for i in range(0, 16, 2)}),
    # Beat 1 empty; kick and snare together on beat 3; skank on the off-beats.
    "one_drop": _template({8: 1}, {8: 1, 2: 0.5, 6: 0.5, 10: 0.5, 14: 0.5},
                          {2: 0.6, 6: 0.6, 10: 0.6, 14: 0.6}),
    "steppers": _template({0: 1, 4: 1, 8: 1, 12: 1}, {8: 1, 2: 0.5, 6: 0.5, 10: 0.5, 14: 0.5},
                          {2: 0.6, 6: 0.6, 10: 0.6, 14: 0.6}),
    "rockers": _template({0: 0.5, 8: 1}, {8: 1, 2: 0.5, 6: 0.5, 10: 0.5, 14: 0.5},
                         {2: 0.6, 6: 0.6, 10: 0.6, 14: 0.6}),
    "dancehall": _template({0: 1, 6: 0.7}, {8: 1},
                           {0: 0.5, 3: 0.4, 4: 0.5, 7: 0.4, 8: 0.5, 11: 0.4, 12: 0.5, 15: 0.4}),
}

TEMPLATE_BANDS = (0, 2, 3)  # kick, snare/mid, hat/high


@dataclass(frozen=True)
class BarGrid:
    """Beat times plus a bar phase. The grid is a list of measured times, never
    a formula: tick_to_time interpolates between real beats, so a drifting tempo
    is followed exactly instead of accumulating error across the intro."""
    beat_times: np.ndarray
    meter: int
    bpm: float
    phase: int
    phase_confidence: float
    pattern: str
    evidence: dict = field(default_factory=dict)

    @property
    def downbeat_indices(self) -> np.ndarray:
        return np.arange(self.phase, len(self.beat_times), self.meter)

    @property
    def downbeat_times(self) -> np.ndarray:
        return self.beat_times[self.downbeat_indices]

    @property
    def n_bars(self) -> int:
        return max(len(self.downbeat_indices) - 1, 0)

    def beat_index(self, bar: int, beat: int = 0) -> int:
        return self.phase + bar * self.meter + beat

    def tick_to_time(self, bar: int, beat: int = 0, tick: int = 0) -> float:
        """Resolve a (bar, beat, tick) position to seconds by interpolating
        between measured beat times."""
        i = self.beat_index(bar, beat)
        frac = tick / TICKS_PER_BEAT
        n = len(self.beat_times)
        if n == 0:
            return 0.0
        if i < 0:
            step = self.beat_times[1] - self.beat_times[0] if n > 1 else 0.5
            return float(self.beat_times[0] + (i + frac) * step)
        if i >= n - 1:
            step = self.beat_times[-1] - self.beat_times[-2] if n > 1 else 0.5
            return float(self.beat_times[-1] + (i - (n - 1) + frac) * step)
        a, b = self.beat_times[i], self.beat_times[i + 1]
        return float(a + frac * (b - a))

    def tick_to_sample(self, sr: int, bar: int, beat: int = 0, tick: int = 0) -> int:
        return int(round(self.tick_to_time(bar, beat, tick) * sr))

    def bar_duration(self, bar: int) -> float:
        return self.tick_to_time(bar + 1) - self.tick_to_time(bar)


def _novelty(feats: np.ndarray) -> np.ndarray:
    """Per-beat change: 1 - cosine similarity with the previous beat."""
    if len(feats) < 2:
        return np.zeros(len(feats))
    n = feats / (np.linalg.norm(feats, axis=1, keepdims=True) + 1e-9)
    sim = np.sum(n[1:] * n[:-1], axis=1)
    return np.concatenate([[0.0], 1.0 - sim])


def _ratio_at_phase(values: np.ndarray, phi: int, meter: int) -> float:
    """How concentrated `values` is on bar-start beats, relative to all beats."""
    if len(values) <= meter:
        return 0.0
    idx = np.arange(phi, len(values), meter)
    idx = idx[idx > 0]
    if idx.size == 0:
        return 0.0
    overall = values.mean() + 1e-9
    return float(values[idx].mean() / overall)


def _bar_profile(prof: np.ndarray, phi: int, meter: int) -> np.ndarray:
    """Average sub-beat onset profile over all bars at phase phi -> (3, meter*n_sub)."""
    n_beats, n_bands, n_sub = prof.shape
    n_bars = (n_beats - phi) // meter
    if n_bars < 1:
        return np.zeros((len(TEMPLATE_BANDS), meter * n_sub))
    bars = prof[phi:phi + n_bars * meter].reshape(n_bars, meter, n_bands, n_sub)
    avg = bars.mean(axis=0)                       # (meter, bands, sub)
    avg = avg.transpose(1, 0, 2).reshape(n_bands, meter * n_sub)
    return avg[list(TEMPLATE_BANDS)]


def _match_templates(bar_prof: np.ndarray) -> tuple[float, str]:
    """Best normalised correlation against the template library."""
    obs = bar_prof - bar_prof.mean(axis=1, keepdims=True)
    obs_n = np.linalg.norm(obs, axis=1, keepdims=True) + 1e-9
    obs = obs / obs_n
    best, best_name = -1.0, "unknown"
    for name, tmpl in BAR_TEMPLATES.items():
        if tmpl.shape[1] != bar_prof.shape[1]:
            continue
        t = tmpl - tmpl.mean(axis=1, keepdims=True)
        t = t / (np.linalg.norm(t, axis=1, keepdims=True) + 1e-9)
        score = float(np.mean(np.sum(obs * t, axis=1)))
        if score > best:
            best, best_name = score, name
    return best, best_name


W_NOVELTY, W_HARMONIC, W_TEMPLATE = 0.34, 0.34, 0.32


def score_phases(beat_times: np.ndarray, mag: np.ndarray, per_band: np.ndarray,
                 sr: int, meter: int = 4) -> tuple[np.ndarray, list[str], dict]:
    """Score every candidate grid phase. Returns (scores, pattern_per_phase, detail)."""
    n_frames = mag.shape[1]
    bf = np.clip(np.round(beat_times * sr / dsp.HOP).astype(int), 0, max(n_frames - 1, 0))
    chroma = dsp.chromagram(mag, sr)
    chroma_b = dsp.beat_sync(chroma, bf, n_frames)
    band_b = dsp.beat_sync(per_band, bf, n_frames)
    if len(chroma_b) < meter * 2:
        return np.zeros(meter), ["unknown"] * meter, {}

    band_norm = band_b / (np.linalg.norm(band_b, axis=1, keepdims=True) + 1e-9)
    combined = np.hstack([chroma_b, band_norm])
    nov = _novelty(combined)
    harm = _novelty(chroma_b)
    prof = dsp.subbeat_profile(per_band, bf)

    raw_nov, raw_harm, raw_tmpl, names = [], [], [], []
    for phi in range(meter):
        raw_nov.append(_ratio_at_phase(nov, phi, meter))
        raw_harm.append(_ratio_at_phase(harm, phi, meter))
        t, name = _match_templates(_bar_profile(prof, phi, meter))
        raw_tmpl.append(t)
        names.append(name)

    def norm(v: list[float]) -> np.ndarray:
        a = np.asarray(v, dtype=float)
        rng = a.max() - a.min()
        return (a - a.min()) / rng if rng > 1e-9 else np.zeros_like(a)

    scores = (W_NOVELTY * norm(raw_nov) + W_HARMONIC * norm(raw_harm)
              + W_TEMPLATE * norm(raw_tmpl))
    detail = {"novelty": raw_nov, "harmonic": raw_harm, "template": raw_tmpl}
    return scores, names, detail


def beat_salience(onset: np.ndarray, beat_times: np.ndarray, sr: int) -> float:
    """Mean onset strength at beat positions, relative to the whole envelope.

    A too-fast tempo hypothesis puts half its beats where nothing happens and
    scores badly here. A too-slow one does not, which is why octave choice also
    leans on the genre BPM range rather than this alone.
    """
    if len(beat_times) < 2 or onset.size == 0:
        return 0.0
    bf = np.clip(np.round(beat_times * sr / dsp.HOP).astype(int), 0, len(onset) - 1)
    win = np.clip(np.stack([bf - 1, bf, bf + 1]), 0, len(onset) - 1)
    return float(onset[win].max(axis=0).mean() / (onset.mean() + 1e-9))


def resolve_beat_offset(beats: np.ndarray, kick_env: np.ndarray, sr: int,
                        margin: float = 1.4) -> tuple[np.ndarray, float]:
    """Decide whether the tracked lattice sits on the beat or on the off-beat.

    Reggae and dancehall put a loud, rigidly regular chop (the skank) on the
    off-beats. It is often the strongest periodic event in the track, so a
    broadband beat tracker locks onto it and every "beat" lands on an "and" --
    half a beat late, for the whole track.

    Kicks land on beats; skanks do not. So compare the tracked lattice against
    the same lattice shifted half a period, scoring against the kick-dominance
    envelope, and shift only when the evidence is clearly better (default 1.4x).
    Being conservative matters: dancehall legitimately puts a kick on the "and
    of 2", so its on/off margin is near 1.0 and it must be left alone.

    This is NOT the kick-on-beat-1 assumption this module rejects elsewhere. It
    asks where the beat lattice is, not which beat is number 1. One drop still
    has its kick on beat 3 -- that is on a beat, which is all this needs.
    """
    if len(beats) < 4 or kick_env.size == 0:
        return beats, 1.0
    period = float(np.median(np.diff(beats)))

    def score(bt: np.ndarray) -> float:
        bf = np.clip(np.round(bt * sr / dsp.HOP).astype(int), 0, len(kick_env) - 1)
        win = np.clip(np.stack([bf - 1, bf, bf + 1]), 0, len(kick_env) - 1)
        return float(kick_env[win].max(axis=0).mean())

    on = score(beats)
    off = score(beats + period / 2.0)
    if off > on * margin:
        return beats + period / 2.0, float(off / (on + 1e-9))
    return beats, float(on / (off + 1e-9))


def detect_grid(audio: np.ndarray, sr: int, genre: str = "auto",
                bpm_hint: float | None = None, meter: int = 4) -> BarGrid:
    """Full grid detection: tempo octave, beats, then grid phase."""
    mono = dsp.to_mono(audio)
    mag = dsp.stft(mono)
    onset, per_band = dsp.onset_envelope(mag, sr)
    kick_env = dsp.kick_envelope(mag, sr)
    lo, hi = GENRE_BPM.get(genre, GENRE_BPM["auto"])

    cands: list[float] = []
    if bpm_hint:
        cands.append(float(bpm_hint))
    for h in dsp.tempo_candidates(onset, sr, bpm_range=(lo * 0.5, hi * 2.0)):
        for mult in (0.5, 1.0, 2.0):
            b = h.bpm * mult
            if lo <= b <= hi and not any(abs(b - c) < 1.0 for c in cands):
                cands.append(b)
    if not cands:
        cands = [(lo + hi) / 2.0]

    best = None
    for bpm in cands[:6]:
        beats = dsp.track_beats(onset, sr, bpm)
        if len(beats) < meter * 4:
            continue
        beats, offbeat_margin = resolve_beat_offset(beats, kick_env, sr)
        sal = beat_salience(onset, beats, sr)
        scores, names, detail = score_phases(beats, mag, per_band, sr, meter)
        phi = int(np.argmax(scores))
        order = np.sort(scores)[::-1]
        conf = float((order[0] - order[1]) / (order[0] + 1e-9)) if len(order) > 1 else 0.0
        total = 0.65 * sal + 0.35 * float(scores[phi])
        if best is None or total > best[0]:
            actual = 60.0 / np.median(np.diff(beats)) if len(beats) > 1 else bpm
            best = (total, BarGrid(beat_times=beats, meter=meter, bpm=float(actual),
                                   phase=phi, phase_confidence=conf,
                                   pattern=names[phi],
                                   evidence={"salience": sal,
                                             "offbeat_margin": offbeat_margin,
                                             "phase_scores": scores.tolist(),
                                             **detail}))
    if best is None:
        return BarGrid(np.zeros(0), meter, 0.0, 0, 0.0, "unknown", {})
    return best[1]
