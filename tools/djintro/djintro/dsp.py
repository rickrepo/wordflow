"""Core DSP primitives.

Deliberately numpy/scipy-only. Phase 1 needs to run and be testable without
demucs, madmom or a GPU; the percussive component from HPSS stands in for the
drum stem well enough to build and verify the whole grid/render/verify loop.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.ndimage import median_filter, uniform_filter1d

N_FFT = 2048
HOP = 512

# Subband edges in Hz. Chosen for the drum kit, not for perceptual evenness:
# kick, bass/low-mid, snare/mid, hats/high.
BAND_EDGES = (0.0, 100.0, 500.0, 2000.0, 8000.0)

# A centered STFT sees an onset's energy before the onset's nominal time: the
# window centered at frame k already contains samples up to k*hop + n_fft/2.
# Spectral flux therefore peaks ~1 frame early. Measured, not assumed -- see
# tests/test_dsp.py::test_onset_latency_is_compensated, which fails if this
# constant drifts away from the true alignment.
ONSET_LATENCY_FRAMES = 1


def to_mono(x: np.ndarray) -> np.ndarray:
    return x if x.ndim == 1 else x.mean(axis=1)


def stft(x: np.ndarray, n_fft: int = N_FFT, hop: int = HOP) -> np.ndarray:
    """Magnitude STFT, shape (n_bins, n_frames). Centered, reflect-padded."""
    x = np.asarray(x, dtype=np.float64)
    pad = n_fft // 2
    x = np.pad(x, pad, mode="reflect")
    win = np.hanning(n_fft + 1)[:-1]
    n_frames = 1 + (len(x) - n_fft) // hop
    if n_frames < 1:
        return np.zeros((n_fft // 2 + 1, 0))
    idx = np.arange(n_fft)[None, :] + hop * np.arange(n_frames)[:, None]
    frames = x[idx] * win
    return np.abs(np.fft.rfft(frames, n=n_fft, axis=1)).T


def frame_times(n_frames: int, sr: int, hop: int = HOP) -> np.ndarray:
    return np.arange(n_frames) * hop / sr


def band_slices(sr: int, n_fft: int = N_FFT) -> list[slice]:
    freqs = np.fft.rfftfreq(n_fft, 1.0 / sr)
    out = []
    for lo, hi in zip(BAND_EDGES[:-1], BAND_EDGES[1:]):
        i0 = int(np.searchsorted(freqs, lo))
        i1 = int(np.searchsorted(freqs, min(hi, sr / 2)))
        out.append(slice(i0, max(i1, i0 + 1)))
    return out


def onset_envelope(mag: np.ndarray, sr: int) -> tuple[np.ndarray, np.ndarray]:
    """Spectral flux onset strength.

    Returns (broadband, per_band) where per_band has shape (n_bands, n_frames).
    Log compression before differencing keeps loud sections from dominating,
    which matters when an intro region is much quieter than the drop.
    """
    if mag.shape[1] == 0:
        return np.zeros(0), np.zeros((len(BAND_EDGES) - 1, 0))
    logmag = np.log1p(1000.0 * mag)
    flux = np.diff(logmag, axis=1, prepend=logmag[:, :1])
    flux = np.maximum(flux, 0.0)
    per_band = np.stack([flux[sl].sum(axis=0) for sl in band_slices(sr)])
    # Subtract a local mean so slow level changes don't read as onsets.
    per_band = np.maximum(per_band - uniform_filter1d(per_band, size=31, axis=1), 0.0)
    if ONSET_LATENCY_FRAMES:
        per_band = np.roll(per_band, ONSET_LATENCY_FRAMES, axis=1)
        per_band[:, :ONSET_LATENCY_FRAMES] = 0.0
    broad = per_band.sum(axis=0)
    return broad, per_band


def kick_envelope(mag: np.ndarray, sr: int, cutoff: float = 110.0,
                  n_fft: int = N_FFT) -> np.ndarray:
    """Onset envelope that responds to kicks and ignores broadband clicks.

    Low-band spectral flux alone is not enough: a guitar or organ skank has a
    hard enough attack to put click energy below 100 Hz, and in reggae there are
    twice as many skank hits as kicks. Weighting the low-band flux by how much
    the low band DOMINATES the spectrum at that instant fixes it -- a kick is
    almost all low end, a skank is not. Measured discrimination on one-drop
    material is roughly 18:1 on-beat vs off-beat, against 1.17:1 for plain
    low-band flux.
    """
    if mag.shape[1] == 0:
        return np.zeros(0)
    freqs = np.fft.rfftfreq(n_fft, 1.0 / sr)
    low = freqs <= cutoff
    logmag = np.log1p(1000.0 * mag)
    flux = np.maximum(np.diff(logmag, axis=1, prepend=logmag[:, :1]), 0.0)
    f_low = flux[low].sum(axis=0)
    dominance = mag[low].sum(axis=0) / (mag.sum(axis=0) + 1e-9)
    env = f_low * dominance ** 2
    env = np.maximum(env - uniform_filter1d(env, size=31), 0.0)
    if ONSET_LATENCY_FRAMES:
        env = np.roll(env, ONSET_LATENCY_FRAMES)
        env[:ONSET_LATENCY_FRAMES] = 0.0
    return env


def hpss(mag: np.ndarray, kernel_time: int = 17, kernel_freq: int = 17,
         power: float = 2.0) -> tuple[np.ndarray, np.ndarray]:
    """Median-filter harmonic/percussive separation with soft masks.

    Horizontal (time) median emphasises sustained partials; vertical (frequency)
    median emphasises broadband transients. This is the Phase 1 stand-in for a
    drum stem: it is not source separation, but for a drums-only intro it gives
    a percussive component with essentially no vocal pitch content.
    """
    harm = median_filter(mag, size=(1, kernel_time), mode="nearest")
    perc = median_filter(mag, size=(kernel_freq, 1), mode="nearest")
    hp, pp = harm ** power, perc ** power
    denom = hp + pp + 1e-12
    return mag * (hp / denom), mag * (pp / denom)


def istft(mag: np.ndarray, phase: np.ndarray, length: int,
          n_fft: int = N_FFT, hop: int = HOP) -> np.ndarray:
    """Inverse STFT with Hann overlap-add and window-sum normalisation."""
    spec = mag * np.exp(1j * phase)
    frames = np.fft.irfft(spec, n=n_fft, axis=0).T
    win = np.hanning(n_fft + 1)[:-1]
    frames = frames * win
    n_frames = frames.shape[0]
    out = np.zeros((n_frames - 1) * hop + n_fft)
    wsum = np.zeros_like(out)
    for i in range(n_frames):
        out[i * hop:i * hop + n_fft] += frames[i]
        wsum[i * hop:i * hop + n_fft] += win ** 2
    out /= np.maximum(wsum, 1e-8)
    pad = n_fft // 2
    return out[pad:pad + length]


def percussive_signal(x: np.ndarray, sr: int) -> np.ndarray:
    """Percussive component of a mono signal, same length as input."""
    x = np.asarray(x, dtype=np.float64)
    pad = N_FFT // 2
    xp = np.pad(x, pad, mode="reflect")
    win = np.hanning(N_FFT + 1)[:-1]
    n_frames = 1 + (len(xp) - N_FFT) // HOP
    idx = np.arange(N_FFT)[None, :] + HOP * np.arange(n_frames)[:, None]
    spec = np.fft.rfft(xp[idx] * win, n=N_FFT, axis=1).T
    _, perc = hpss(np.abs(spec))
    return istft(perc, np.angle(spec), len(x))


CHROMA_N_FFT = 8192
CHROMA_HOP = 2048
CHROMA_MIDI_LO = 48   # C3
CHROMA_MIDI_HI = 96   # C7


def _semitone_filterbank(sr: int, n_fft: int) -> np.ndarray:
    """Triangular filter per semitone -> (n_semitones, n_bins).

    Nearest-bin folding is not good enough for key detection. At n_fft=2048 the
    bins sit 21.5 Hz apart while a semitone at 130 Hz spans about 8 Hz, so every
    low note lands in whichever bin is nearest and smears across neighbouring
    pitch classes. Measured on a synthetic Am-F-C-G progression, that put 0.45
    normalised energy on A# -- a note never played -- and flipped the key.

    A wider transform plus proper triangular weighting fixes it. Below C3 the
    resolution still is not there, so the bank simply starts at C3; key is
    carried by the mid range anyway, and excluding the bass also stops a loud
    sub from dominating the profile.
    """
    freqs = np.fft.rfftfreq(n_fft, 1.0 / sr)
    n_semi = CHROMA_MIDI_HI - CHROMA_MIDI_LO
    bank = np.zeros((n_semi, len(freqs)))
    for i in range(n_semi):
        midi = CHROMA_MIDI_LO + i
        centre = 440.0 * 2 ** ((midi - 69) / 12.0)
        lo = centre * 2 ** (-1.0 / 24.0)
        hi = centre * 2 ** (1.0 / 24.0)
        left = (freqs - lo) / max(centre - lo, 1e-9)
        right = (hi - freqs) / max(hi - centre, 1e-9)
        w = np.clip(np.minimum(left, right), 0.0, None)
        total = w.sum()
        if total > 0:
            bank[i] = w / total
    return bank


def chroma_precise(x: np.ndarray, sr: int) -> np.ndarray:
    """(12, n_frames) pitch-class energy via a semitone filterbank.

    Use this for key detection. `chromagram` below is the cheap bin-folding
    version, fine for beat-level novelty where a smeared pitch class does not
    change the answer.
    """
    mono = to_mono(np.asarray(x, dtype=np.float64))
    mag = stft(mono, n_fft=CHROMA_N_FFT, hop=CHROMA_HOP)
    if mag.shape[1] == 0:
        return np.zeros((12, 0))
    bank = _semitone_filterbank(sr, CHROMA_N_FFT)
    semi = bank @ mag
    # No log compression here. It was flattening the profile so far that the
    # tonic emphasis which separates a key from its relative major/minor
    # disappeared, and every minor key read as its relative major. Per-frame
    # normalisation below already handles dynamics.
    out = np.zeros((12, semi.shape[1]))
    for i in range(semi.shape[0]):
        out[(CHROMA_MIDI_LO + i) % 12] += semi[i]
    return out / (np.linalg.norm(out, axis=0, keepdims=True) + 1e-9)


def chromagram(mag: np.ndarray, sr: int, n_fft: int = N_FFT) -> np.ndarray:
    """(12, n_frames) pitch-class energy. Cheap bin-folding, not CQT."""
    freqs = np.fft.rfftfreq(n_fft, 1.0 / sr)
    keep = (freqs > 55.0) & (freqs < 2200.0)
    midi = 69 + 12 * np.log2(np.maximum(freqs[keep], 1e-9) / 440.0)
    pc = np.mod(np.round(midi).astype(int), 12)
    sub = mag[keep]
    out = np.zeros((12, mag.shape[1]))
    for k in range(12):
        m = pc == k
        if m.any():
            out[k] = sub[m].sum(axis=0)
    return out / (np.linalg.norm(out, axis=0, keepdims=True) + 1e-9)


# --------------------------------------------------------------------------
# tempo + beats
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class TempoHypothesis:
    bpm: float
    strength: float


def tempo_candidates(onset: np.ndarray, sr: int, hop: int = HOP,
                     bpm_range: tuple[float, float] = (55.0, 200.0),
                     n: int = 4) -> list[TempoHypothesis]:
    """Autocorrelation tempo peaks, returned as ranked hypotheses.

    No log-normal prior around 120 BPM. That prior is actively wrong for this
    target library: reggae sits at 60-90 and soca at 145-170, and a centre-
    weighted prior pulls both toward a wrong octave. Octave choice is settled
    later, by structure, in grid.py.
    """
    if onset.size < 16:
        return [TempoHypothesis(120.0, 0.0)]
    o = onset - onset.mean()
    ac = np.correlate(o, o, mode="full")[len(o) - 1:]
    ac /= (ac[0] + 1e-12)
    lag_min = max(1, int(round(60.0 / bpm_range[1] * sr / hop)))
    lag_max = min(len(ac) - 1, int(round(60.0 / bpm_range[0] * sr / hop)))
    if lag_max <= lag_min:
        return [TempoHypothesis(120.0, 0.0)]
    seg = ac[lag_min:lag_max + 1]
    # local maxima only
    peaks = [i for i in range(1, len(seg) - 1) if seg[i] >= seg[i - 1] and seg[i] > seg[i + 1]]
    peaks.sort(key=lambda i: -seg[i])
    out = []
    for i in peaks[:n]:
        lag = i + lag_min
        out.append(TempoHypothesis(60.0 * sr / hop / lag, float(seg[i])))
    return out or [TempoHypothesis(120.0, 0.0)]


def track_beats(onset: np.ndarray, sr: int, bpm: float, hop: int = HOP,
                tightness: float = 300.0) -> np.ndarray:
    """Dynamic-programming beat tracking (Ellis 2007) at a fixed target tempo.

    Returns beat times in seconds. The transition penalty is quadratic in
    log(interval / period), so the tracker follows a drifting tempo instead of
    snapping to a rigid grid -- which is the whole point for anything played by
    a human rather than sequenced.
    """
    if onset.size < 4:
        return np.zeros(0)
    period = 60.0 / max(bpm, 1e-6) * sr / hop
    if period < 2:
        return np.zeros(0)
    o = onset / (onset.std() + 1e-9)
    n = len(o)
    backlink = np.full(n, -1, dtype=int)
    cumscore = o.astype(float).copy()

    win_lo = int(np.floor(-2 * period))
    win_hi = int(np.ceil(-period / 2))
    offsets = np.arange(win_lo, win_hi + 1)
    if offsets.size == 0:
        return np.zeros(0)
    penalty = -tightness * (np.log(np.maximum(-offsets / period, 1e-9)) ** 2)

    for i in range(n):
        idx = i + offsets
        valid = idx >= 0
        if not valid.any():
            continue
        scores = cumscore[idx[valid]] + penalty[valid]
        j = int(np.argmax(scores))
        best = scores[j]
        if best > 0:
            cumscore[i] = o[i] + best
            backlink[i] = idx[valid][j]

    # Start the backtrace from a late, strong beat rather than the global max,
    # so a loud drop near the end doesn't truncate the track.
    tail = cumscore[int(n * 0.5):]
    if tail.size == 0:
        return np.zeros(0)
    thresh = 0.5 * np.median(cumscore[cumscore > 0]) if (cumscore > 0).any() else 0.0
    cands = np.flatnonzero(cumscore >= thresh)
    pos = int(cands[-1]) if cands.size else int(np.argmax(cumscore))

    beats = []
    while pos >= 0:
        beats.append(pos)
        pos = backlink[pos]
    beats.reverse()
    return np.asarray(beats, dtype=float) * hop / sr


def beat_sync(feature: np.ndarray, beat_frames: np.ndarray, n_frames: int) -> np.ndarray:
    """Average a (d, n_frames) feature within each beat -> (n_beats, d)."""
    if feature.ndim == 1:
        feature = feature[None, :]
    out = []
    for i in range(len(beat_frames)):
        a = int(beat_frames[i])
        b = int(beat_frames[i + 1]) if i + 1 < len(beat_frames) else min(n_frames, a + 1)
        b = max(b, a + 1)
        out.append(feature[:, a:b].mean(axis=1))
    return np.asarray(out) if out else np.zeros((0, feature.shape[0]))


def subbeat_profile(per_band: np.ndarray, beat_frames: np.ndarray,
                    n_sub: int = 4) -> np.ndarray:
    """Per-beat onset energy at sub-beat resolution -> (n_beats, n_bands, n_sub).

    This is what the bar-pattern templates in grid.py match against. Sub-beat
    resolution matters here: the reggae skank lands between beats, and at
    one-value-per-beat it is invisible.
    """
    n_bands = per_band.shape[0]
    out = np.zeros((len(beat_frames), n_bands, n_sub))
    for i in range(len(beat_frames)):
        a = int(beat_frames[i])
        b = int(beat_frames[i + 1]) if i + 1 < len(beat_frames) else a + 1
        b = max(b, a + n_sub)
        edges = np.linspace(a, b, n_sub + 1).astype(int)
        for s in range(n_sub):
            lo = max(edges[s] - 1, 0)
            hi = max(edges[s + 1], lo + 1)
            if lo < per_band.shape[1]:
                out[i, :, s] = per_band[:, lo:min(hi, per_band.shape[1])].max(axis=1)
    return out
