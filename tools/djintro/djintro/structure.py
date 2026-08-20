"""Section structure, energy and vocal curves, and mixable windows.

Everything here is measured per BAR and reported in bars, because that is the
unit a DJ works in. Section boundaries are snapped to 4-bar multiples: real
productions change sections on phrase boundaries, and a boundary reported at bar
27 is almost always a detection error for bar 25 or 29.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from scipy.ndimage import uniform_filter1d

from . import dsp
from .grid import BarGrid


@dataclass(frozen=True)
class Section:
    start_bar: int
    end_bar: int          # exclusive
    energy: float         # 0-1, relative to the track
    vocal: float          # 0-1, estimated
    density: float        # 0-1, onset density
    label: str

    @property
    def bars(self) -> int:
        return self.end_bar - self.start_bar


@dataclass(frozen=True)
class MixWindow:
    start_bar: int
    end_bar: int
    vocal: float
    energy: float
    kind: str             # "in" | "out"

    @property
    def bars(self) -> int:
        return self.end_bar - self.start_bar

    @property
    def score(self) -> float:
        """Longer and cleaner is better; 16 bars is the sweet spot."""
        length = min(self.bars / 16.0, 1.0)
        return float((1.0 - self.vocal) * 0.7 + length * 0.3)


@dataclass
class Structure:
    sections: list[Section]
    energy_by_bar: np.ndarray
    vocal_by_bar: np.ndarray
    density_by_bar: np.ndarray
    mix_in: list[MixWindow] = field(default_factory=list)
    mix_out: list[MixWindow] = field(default_factory=list)
    # How much vocal dynamic range the track had. Low means the vocal estimate
    # is relative to a narrow range and "low vocal" bars may still be sung over.
    vocal_contrast: float = 0.0
    vocal_raw: np.ndarray = field(default_factory=lambda: np.zeros(0))

    @property
    def has_clear_instrumental(self) -> bool:
        return self.vocal_contrast >= 0.12

    @property
    def n_bars(self) -> int:
        return len(self.energy_by_bar)


def vocal_likelihood(audio: np.ndarray, sr: int) -> tuple[np.ndarray, np.ndarray]:
    """Estimate per-frame vocal presence. Returns (likelihood, frame_times).

    This is an ESTIMATE, not source separation. Phase 1 has no demucs, so it
    leans on two properties that hold for sung vocals and not for most backing:

      1. Energy concentrated in roughly 300-3500 Hz of the HARMONIC component.
      2. Envelope modulation at the syllable rate, 3-8 Hz. A sustained pad or a
         bassline in the same band does not modulate that way; a voice does.

    Good enough to rank sections by how vocal they are, which is what the mix
    windows need. Not good enough to assert a bar is vocal-free -- that is what
    gate G4 is for, and it needs real separation.
    """
    mono = dsp.to_mono(np.asarray(audio, dtype=np.float64))
    mag = dsp.stft(mono)
    if mag.shape[1] == 0:
        return np.zeros(0), np.zeros(0)
    harm, _ = dsp.hpss(mag)
    freqs = np.fft.rfftfreq(dsp.N_FFT, 1.0 / sr)
    band = (freqs >= 300.0) & (freqs <= 3500.0)

    band_e = harm[band].sum(axis=0)
    total_e = harm.sum(axis=0) + 1e-9
    ratio = band_e / total_e

    # Syllable-rate modulation of the band envelope.
    fps = sr / dsp.HOP
    env = band_e / (np.max(band_e) + 1e-9)
    env = env - uniform_filter1d(env, size=max(int(fps * 1.5), 3))
    win = max(int(fps * 1.0), 8)
    mod = np.zeros(len(env))
    freqs_mod = np.fft.rfftfreq(win, 1.0 / fps)
    syl = (freqs_mod >= 3.0) & (freqs_mod <= 8.0)
    for i in range(0, len(env), max(win // 2, 1)):
        seg = env[i:i + win]
        if len(seg) < win:
            break
        spec = np.abs(np.fft.rfft(seg * np.hanning(win)))
        v = spec[syl].sum() / (spec.sum() + 1e-9)
        mod[i:i + win] = np.maximum(mod[i:i + win], v)

    like = np.clip(ratio * 1.2, 0, 1) * 0.5 + np.clip(mod * 3.0, 0, 1) * 0.5
    like = uniform_filter1d(like, size=max(int(fps * 0.5), 3))
    return like, dsp.frame_times(mag.shape[1], sr)


def _per_bar(values: np.ndarray, times: np.ndarray, grid: BarGrid,
             n_bars: int) -> np.ndarray:
    out = np.zeros(n_bars)
    for b in range(n_bars):
        t0, t1 = grid.tick_to_time(b), grid.tick_to_time(b + 1)
        m = (times >= t0) & (times < t1)
        out[b] = float(values[m].mean()) if m.any() else 0.0
    return out


def _checkerboard_novelty(ssm: np.ndarray, size: int = 8) -> np.ndarray:
    """Slide a checkerboard kernel down the SSM diagonal.

    High where the block before differs from the block after -- i.e. at a
    section change.
    """
    n = len(ssm)
    if n < size * 2 + 1:
        return np.zeros(n)
    k = np.ones((2 * size, 2 * size))
    k[:size, size:] = -1
    k[size:, :size] = -1
    nov = np.zeros(n)
    for i in range(size, n - size):
        block = ssm[i - size:i + size, i - size:i + size]
        if block.shape == k.shape:
            nov[i] = float((block * k).sum())
    return np.maximum(nov, 0.0)


def _label(energy: float, vocal: float, density: float, first: bool, last: bool) -> str:
    """Functional labels, not guessed song-form names.

    Calling something a "chorus" without training data is a guess. What actually
    drives a mixing decision is whether a span is loud and whether anyone is
    singing over it, so the labels say that.
    """
    if first and energy < 0.45:
        return "intro"
    if last and energy < 0.5:
        return "outro"
    if vocal < 0.25 and energy < 0.5:
        return "break (instrumental)"
    if vocal < 0.25:
        return "instrumental"
    if energy >= 0.72:
        return "peak (vocal)" if vocal >= 0.45 else "peak"
    if energy < 0.42:
        return "breakdown"
    return "vocal section" if vocal >= 0.45 else "groove"


def analyse(audio: np.ndarray, sr: int, grid: BarGrid,
            phrase_bars: int = 8) -> Structure:
    """Full structural analysis against a detected grid."""
    n_bars = max(grid.n_bars, 1)
    mono = dsp.to_mono(np.asarray(audio, dtype=np.float64))
    mag = dsp.stft(mono)
    onset, per_band = dsp.onset_envelope(mag, sr)
    times = dsp.frame_times(mag.shape[1], sr)

    rms = np.sqrt(uniform_filter1d(mono ** 2, size=max(int(0.05 * sr), 1)) + 1e-12)
    rms_t = np.arange(len(rms)) / sr
    energy = _per_bar(rms, rms_t, grid, n_bars)
    energy = energy / (np.percentile(energy, 95) + 1e-9)
    energy = np.clip(energy, 0, 1)

    like, like_t = vocal_likelihood(audio, sr)
    vocal_raw = _per_bar(like, like_t, grid, n_bars) if like.size else np.zeros(n_bars)
    # Contrast-stretch WITHIN the track rather than scaling to the max.
    #
    # The raw measure has good contrast and a bad floor: instrumental bars read
    # ~0.6 rather than ~0.1, because a skank or a chord stab also puts harmonic
    # energy in the 300-3500 Hz band. Dividing by the 95th percentile keeps that
    # floor and no bar ever looks instrumental.
    #
    # What the mix windows actually need is "which parts of THIS track are least
    # vocal", which is a relative question, so answer it relatively. The cost is
    # that a track sung end to end still reports its quietest bars as low --
    # `vocal_contrast` below records how much dynamic range there was, so a
    # caller can tell the difference.
    if vocal_raw.max() > 0:
        lo, hi = float(np.percentile(vocal_raw, 10)), float(np.percentile(vocal_raw, 95))
        vocal_contrast = hi - lo
        vocal = np.clip((vocal_raw - lo) / (hi - lo + 1e-9), 0, 1)
    else:
        vocal_contrast = 0.0
        vocal = vocal_raw

    density = _per_bar(onset, times, grid, n_bars)
    density = np.clip(density / (np.percentile(density, 95) + 1e-9), 0, 1)

    # Bar-level self-similarity over chroma + spectral shape + level.
    chroma = dsp.chroma_precise(mono, sr)
    ch_t = np.arange(chroma.shape[1]) * dsp.CHROMA_HOP / sr
    ch_bar = np.stack([_per_bar(chroma[k], ch_t, grid, n_bars) for k in range(12)], axis=1)
    band_bar = np.stack([_per_bar(per_band[k], times, grid, n_bars)
                         for k in range(per_band.shape[0])], axis=1)
    feats = np.hstack([ch_bar, band_bar / (band_bar.max() + 1e-9),
                       energy[:, None], vocal[:, None]])
    feats = feats / (np.linalg.norm(feats, axis=1, keepdims=True) + 1e-9)
    ssm = feats @ feats.T

    nov = _checkerboard_novelty(ssm, size=min(8, max(n_bars // 4, 2)))
    bounds = {0, n_bars}
    if nov.max() > 0:
        thresh = float(np.percentile(nov[nov > 0], 70))
        for i in range(1, len(nov) - 1):
            if nov[i] >= thresh and nov[i] >= nov[i - 1] and nov[i] > nov[i + 1]:
                # Snap to the nearest 4-bar boundary: productions change on
                # phrase lines, and an odd-bar boundary is nearly always a
                # detection error for the phrase line next to it.
                bounds.add(int(round(i / 4.0) * 4))
    edges = sorted(b for b in bounds if 0 <= b <= n_bars)
    edges = [e for i, e in enumerate(edges) if i == 0 or e - edges[i - 1] >= 4]
    if edges[-1] != n_bars:
        edges.append(n_bars)

    sections = []
    for i in range(len(edges) - 1):
        a, b = edges[i], edges[i + 1]
        if b <= a:
            continue
        e, v, d = float(energy[a:b].mean()), float(vocal[a:b].mean()), float(density[a:b].mean())
        sections.append(Section(a, b, e, v, d,
                                _label(e, v, d, i == 0, i == len(edges) - 2)))

    ins, outs = _mix_windows(energy, vocal, density, n_bars, phrase_bars)
    return Structure(sections, energy, vocal, density, ins, outs,
                     vocal_contrast=float(vocal_contrast),
                     vocal_raw=vocal_raw)


def _mix_windows(energy, vocal, density, n_bars, phrase_bars) -> tuple[list, list]:
    """Phrase-aligned spans with low vocal and steady drums.

    These are the practical output: where you can bring a track in, and where you
    can take it out, without a vocal collision.
    """
    vocal_max = 0.35
    density_min = 0.18
    usable = (vocal <= vocal_max) & (density >= density_min)

    spans = []
    for start in range(0, n_bars - phrase_bars + 1, phrase_bars):
        length = 0
        while (start + length + phrase_bars <= n_bars
               and usable[start + length:start + length + phrase_bars].all()):
            length += phrase_bars
        if length >= phrase_bars:
            spans.append((start, start + length))
    # Drop spans contained in a longer one.
    spans = [s for s in spans if not any(s != o and o[0] <= s[0] and s[1] <= o[1] for o in spans)]

    mid = n_bars / 2.0
    ins, outs = [], []
    for a, b in spans:
        v, e = float(vocal[a:b].mean()), float(energy[a:b].mean())
        w_in = MixWindow(a, b, v, e, "in")
        w_out = MixWindow(a, b, v, e, "out")
        if a < mid:
            ins.append(w_in)
        if b > mid:
            outs.append(w_out)
    ins.sort(key=lambda w: (-w.score, w.start_bar))
    outs.sort(key=lambda w: (-w.score, -w.start_bar))
    return ins[:5], outs[:5]
