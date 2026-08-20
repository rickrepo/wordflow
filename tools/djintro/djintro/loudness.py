"""ITU-R BS.1770 loudness and true-peak measurement."""
from __future__ import annotations

import numpy as np
from scipy.signal import bilinear_zpk, resample_poly, sosfilt, zpk2sos


def _k_weighting(sr: int):
    """Two-stage K-weighting: a high-shelf 'head' filter then an RLB high-pass."""
    f0, G, Q = 1681.974450955533, 3.999843853973347, 0.7071752369554196
    K = np.tan(np.pi * f0 / sr)
    Vh = 10 ** (G / 20.0)
    Vb = Vh ** 0.4996667741545416
    a0 = 1.0 + K / Q + K * K
    b = np.array([(Vh + Vb * K / Q + K * K), 2.0 * (K * K - Vh), (Vh - Vb * K / Q + K * K)]) / a0
    a = np.array([1.0, 2.0 * (K * K - 1.0) / a0, (1.0 - K / Q + K * K) / a0])
    sos1 = np.concatenate([b, a])[None, :]

    f0, Q = 38.13547087602444, 0.5003270373238773
    K = np.tan(np.pi * f0 / sr)
    a0 = 1.0 + K / Q + K * K
    b2 = np.array([1.0, -2.0, 1.0])
    a2 = np.array([1.0, 2.0 * (K * K - 1.0) / a0, (1.0 - K / Q + K * K) / a0])
    sos2 = np.concatenate([b2, a2])[None, :]
    return np.vstack([sos1, sos2])


def _as_2d(x: np.ndarray) -> np.ndarray:
    return x[:, None] if x.ndim == 1 else x


def integrated_lufs(x: np.ndarray, sr: int) -> float:
    """Gated integrated loudness in LUFS."""
    a = _as_2d(np.asarray(x, dtype=np.float64))
    if len(a) < sr // 10:
        return -70.0
    sos = _k_weighting(sr)
    y = sosfilt(sos, a, axis=0)
    block, step = int(0.4 * sr), int(0.1 * sr)
    if len(y) < block:
        block, step = len(y), max(len(y) // 4, 1)
    starts = range(0, max(len(y) - block + 1, 1), step)
    powers = np.array([np.mean(y[s:s + block] ** 2, axis=0).sum() for s in starts])
    ls = -0.691 + 10 * np.log10(np.maximum(powers, 1e-12))
    keep = ls > -70.0
    if not keep.any():
        return -70.0
    rel = -0.691 + 10 * np.log10(powers[keep].mean()) - 10.0
    keep2 = keep & (ls > rel)
    if not keep2.any():
        keep2 = keep
    return float(-0.691 + 10 * np.log10(max(powers[keep2].mean(), 1e-12)))


def short_term_lufs(x: np.ndarray, sr: int, window_s: float = 3.0) -> float:
    return integrated_lufs(x[:int(window_s * sr)], sr)


def true_peak_dbtp(x: np.ndarray, sr: int, oversample: int = 4) -> float:
    """True peak via oversampling. A sample-peak meter misses inter-sample
    overs, which are exactly what clips a club system's DAC."""
    a = _as_2d(np.asarray(x, dtype=np.float64))
    if len(a) == 0:
        return -np.inf
    up = resample_poly(a, oversample, 1, axis=0)
    peak = float(np.abs(up).max())
    return 20 * np.log10(max(peak, 1e-12))


def match_gain_db(source: np.ndarray, target: np.ndarray, sr: int) -> float:
    """Static gain that brings `source` to `target`'s loudness.

    Deliberately a gain, never a compressor: compressing would change the
    material's dynamics, which is the opposite of what an intro edit should do.
    """
    return float(integrated_lufs(target, sr) - integrated_lufs(source, sr))
