"""Grid-relative rendering: splices, loop seams, and the L4 drums-only floor.

Everything here is addressed in bars and beats against a BarGrid, never in
seconds, so a drifting tempo is followed rather than approximated.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from . import dsp
from .grid import BarGrid


def _as_2d(x: np.ndarray) -> np.ndarray:
    return x[:, None] if x.ndim == 1 else x


def equal_power_fade(n: int) -> tuple[np.ndarray, np.ndarray]:
    """cos/sin fade pair. Constant power through the crossfade, unlike a linear
    fade, which dips ~3 dB in the middle."""
    t = np.linspace(0.0, np.pi / 2.0, max(n, 1))
    return np.cos(t), np.sin(t)


def zero_crossing_near(x: np.ndarray, idx: int, search: int) -> int:
    """Nearest rising zero crossing to idx, within +/-search samples.

    Cutting at a non-zero sample leaves a DC step, which is the click most
    automatic editors leave behind. Uses the mid signal so stereo stays coherent.
    """
    mid = _as_2d(x).mean(axis=1)
    lo, hi = max(idx - search, 1), min(idx + search, len(mid) - 1)
    if hi <= lo:
        return int(np.clip(idx, 0, max(len(mid) - 1, 0)))
    seg = mid[lo:hi]
    crossings = np.flatnonzero((seg[:-1] <= 0) & (seg[1:] > 0))
    if crossings.size == 0:
        return idx
    return int(lo + crossings[np.argmin(np.abs(crossings + lo - idx))])


def onset_valley(env: np.ndarray, target_frame: int, search_frames: int) -> int:
    """Local minimum of the onset envelope near target_frame.

    The target is a downbeat, but cutting exactly on a downbeat means cutting
    through a kick transient and smearing it. Landing the splice in a rhythmic
    gap instead hides the crossfade. Highest-value trick in the render stage.
    """
    lo = max(target_frame - search_frames, 0)
    hi = min(target_frame + search_frames + 1, len(env))
    if hi <= lo:
        return target_frame
    return int(lo + np.argmin(env[lo:hi]))


def micro_align(env: np.ndarray, tail_frame: int, head_env: np.ndarray,
                head_frame: int, max_lag_frames: int = 3) -> int:
    """Cross-correlate onset envelopes across a join; return the lag in frames.

    Corrects residual grid error to near-sample level. A lag at or beyond the
    limit is NOT applied: that means the grid is wrong here, and the right
    response is to fail the candidate, not to nudge it into place.
    """
    w = max(max_lag_frames * 4, 8)
    a = env[max(tail_frame - w, 0):tail_frame + w]
    b = head_env[max(head_frame - w, 0):head_frame + w]
    n = min(len(a), len(b))
    if n < 4:
        return 0
    a, b = a[:n] - a[:n].mean(), b[:n] - b[:n].mean()
    corr = np.correlate(a, b, mode="full")
    lags = np.arange(-n + 1, n)
    keep = np.abs(lags) <= max_lag_frames
    if not keep.any():
        return 0
    return int(lags[keep][np.argmax(corr[keep])])


def crossfade_join(a: np.ndarray, b: np.ndarray, fade: int) -> np.ndarray:
    """Join a then b with an equal-power crossfade of `fade` samples."""
    a, b = _as_2d(a), _as_2d(b)
    fade = int(max(1, min(fade, len(a), len(b))))
    fo, fi = equal_power_fade(fade)
    head = a[:-fade] if len(a) > fade else a[:0]
    mixed = a[len(a) - fade:] * fo[:, None] + b[:fade] * fi[:, None]
    return np.vstack([head, mixed, b[fade:]])


FINE_HOP = 64  # 1.45 ms at 44.1 kHz


def fine_onset(x: np.ndarray, sr: int) -> np.ndarray:
    """Onset envelope at 1.45 ms resolution, for sample-scale alignment work."""
    mag = dsp.stft(dsp.to_mono(x), n_fft=512, hop=FINE_HOP)
    if mag.shape[1] == 0:
        return np.zeros(0)
    logm = np.log1p(1000.0 * mag)
    return np.maximum(np.diff(logm, axis=1, prepend=logm[:, :1]), 0.0).sum(axis=0)


def align_by_correlation(tail: np.ndarray, head: np.ndarray, sr: int,
                         max_lag_ms: float = 30.0) -> tuple[int, float]:
    """Cross-correlate two pieces at fine resolution. Returns (lag_samples, confidence).

    This is what corrects residual GRID error at the join, and it is not
    optional. The intro is placed using detected beat times, which are quantised
    to the 512-sample analysis hop -- 11.6 ms. The body carries its own true
    timing. Seed and body therefore inherit independent quantisation error of up
    to +/-5.8 ms each, so the join can sit over 11 ms out even when every bar
    boundary is "correct" to the grid. Measured: 10-43 ms before this step.

    A positive lag means the head should move later.
    """
    a, b = fine_onset(tail, sr), fine_onset(head, sr)
    n = min(len(a), len(b))
    if n < 8:
        return 0, 0.0
    a, b = a[-n:], b[:n]
    a = a - a.mean()
    b = b - b.mean()
    denom = np.sqrt((a @ a) * (b @ b)) + 1e-12
    corr = np.correlate(a, b, mode="full") / denom
    lags = np.arange(-n + 1, n)
    limit = int(max_lag_ms / 1000.0 * sr / FINE_HOP)
    keep = np.abs(lags) <= limit
    if not keep.any():
        return 0, 0.0
    sub_lags, sub_corr = lags[keep], corr[keep]
    k = int(np.argmax(sub_corr))
    peak = float(sub_corr[k])
    runner = float(np.max(np.delete(sub_corr, k))) if len(sub_corr) > 1 else 0.0
    return int(sub_lags[k]) * FINE_HOP, peak - runner


@dataclass(frozen=True)
class SpliceReport:
    """What the renderer actually did, so the verifier can check it."""
    sample: int
    valley_shift_frames: int
    micro_lag_frames: int
    fade_samples: int
    micro_lag_rejected: bool


def extract_bars(audio: np.ndarray, sr: int, grid: BarGrid, start_bar: int,
                 n_bars: int, pre_roll_ms: float = 0.0) -> tuple[np.ndarray, int]:
    """Pull n_bars of audio starting at start_bar, plus optional pre-roll.

    Pre-roll is the reverb/room tail leading INTO the downbeat. Carrying it
    across a loop seam is what stops a repeated loop sounding chopped -- it is
    exactly what a human does when they grab a little extra before the downbeat.
    Returns (audio, pre_roll_samples).
    """
    a = _as_2d(audio)
    start = grid.tick_to_sample(sr, start_bar)
    end = grid.tick_to_sample(sr, start_bar + n_bars)
    pre = int(pre_roll_ms * sr / 1000.0)
    pre = max(0, min(pre, start))
    lo, hi = max(start - pre, 0), min(end, len(a))
    return a[lo:hi], start - lo


def loop_bars(seed: np.ndarray, pre_roll: int, repeats: int,
              fade_samples: int) -> np.ndarray:
    """Repeat a seed, overlap-ADDING the pre-roll at each seam.

    The pre-roll is the reverb/room tail leading into the downbeat. It gets
    summed onto the tail of the preceding repetition so the tail continues
    across the join instead of restarting -- which is what stops a looped bar
    sounding chopped.

    It must be overlap-ADDED, not crossfaded. Crossfading inserts the pre-roll
    into the timeline, so every repeat starts pre_roll-minus-fade late and the
    loop comes out longer than the bars it is supposed to contain (measured 108
    ms long on a 120 ms pre-roll). Overlap-add leaves the length exactly
    repeats * seed, which is what keeps the body on the grid.
    """
    body = seed[pre_roll:]
    if repeats <= 1:
        return body
    out = body.copy()
    ramp = None
    if pre_roll > 0:
        # Fade the pre-roll in so summing it onto the tail cannot step.
        n_ramp = min(pre_roll, max(fade_samples, 1))
        ramp = np.ones(pre_roll)
        ramp[:n_ramp] = np.linspace(0.0, 1.0, n_ramp)
    for _ in range(repeats - 1):
        if pre_roll > 0:
            tail = seed[:pre_roll] * ramp[:, None]
            k = min(pre_roll, len(out))
            out[-k:] = out[-k:] + tail[pre_roll - k:]
        out = np.vstack([out, body])
    return out


BUILD_PATTERNS = ("FLAT", "HALF", "QUARTER")


def kicks_per_bar(kick_env: np.ndarray, sr: int, grid: BarGrid,
                  start_bar: int, n_bars: int) -> float:
    """Mean number of kick events per bar over a span."""
    f0 = int(grid.tick_to_time(start_bar) * sr / dsp.HOP)
    f1 = int(grid.tick_to_time(start_bar + n_bars) * sr / dsp.HOP)
    f0, f1 = max(f0, 0), min(f1, len(kick_env))
    if f1 <= f0 + 2:
        return 0.0
    seg = kick_env[f0:f1]
    thresh = seg.max() * 0.35
    if thresh <= 0:
        return 0.0
    peaks = (seg[1:-1] > thresh) & (seg[1:-1] >= seg[:-2]) & (seg[1:-1] > seg[2:])
    return float(peaks.sum()) / max(n_bars, 1)


def apply_build(intro: np.ndarray, sr: int, grid: BarGrid, pattern: str,
                n_bars: int = 8, style: str = "auto",
                kick_density: float = 4.0) -> tuple[np.ndarray, str]:
    """Stage the intro's energy across its bars. Returns (audio, style_used).

    Two staging styles, because one size does not fit this material:

      "band" -- open with the kick alone, add the top end, then the full kit.
                Reads as a real build, but only works when the kick pattern is
                busy enough to carry four bars on its own.
      "gain" -- keep the whole kit and stage the LEVEL instead.

    Reggae one drop has a single kick per bar. A band-staged build on that
    material leaves roughly three seconds of near-silence per bar -- musically
    dead, and it trips the dropout gate. So when kick density is low, stage by
    gain instead. "auto" picks by measured density, not by genre label.
    """
    if pattern == "FLAT":
        return _as_2d(intro), "flat"
    if style == "auto":
        style = "band" if kick_density >= 2.5 else "gain"

    x = _as_2d(intro).copy()
    n = len(x)
    per_bar = n / max(n_bars, 1)

    if style == "gain":
        if pattern == "HALF":
            stage_db = [-7.0] * 4 + [0.0] * 4
        else:
            stage_db = [-10.0] * 2 + [-6.5] * 2 + [-3.0] * 2 + [0.0] * 2
        gains = np.ones(n)
        for bar in range(n_bars):
            a, b = int(bar * per_bar), int(min((bar + 1) * per_bar, n))
            if b > a:
                gains[a:b] = 10 ** (stage_db[min(bar, len(stage_db) - 1)] / 20.0)
        # Smooth the steps so the staging does not click.
        from scipy.ndimage import uniform_filter1d
        gains = uniform_filter1d(gains, size=max(int(0.02 * sr), 3))
        return x * gains[:, None], "gain"

    from scipy.signal import butter, sosfilt
    sos_lo = butter(4, 200.0 / (sr / 2), btype="low", output="sos")
    low = sosfilt(sos_lo, x, axis=0)
    high = x - low
    if pattern == "HALF":
        stages = [(1.0, 0.0)] * 4 + [(1.0, 1.0)] * 4
    else:
        stages = [(1.0, 0.0)] * 2 + [(1.0, 0.45)] * 2 + [(1.0, 0.75)] * 2 + [(1.0, 1.0)] * 2
    gl_env = np.ones(n)
    gh_env = np.ones(n)
    for bar in range(n_bars):
        a, b = int(bar * per_bar), int(min((bar + 1) * per_bar, n))
        if b > a:
            gl, gh = stages[min(bar, len(stages) - 1)]
            gl_env[a:b], gh_env[a:b] = gl, gh
    from scipy.ndimage import uniform_filter1d
    k = max(int(0.02 * sr), 3)
    gl_env = uniform_filter1d(gl_env, size=k)
    gh_env = uniform_filter1d(gh_env, size=k)
    return low * gl_env[:, None] + high * gh_env[:, None], "band"


def percussive_stereo(audio: np.ndarray, sr: int) -> np.ndarray:
    """Percussive component, per channel. Phase 1 stand-in for a drum stem."""
    a = _as_2d(audio)
    return np.stack([dsp.percussive_signal(a[:, c], sr) for c in range(a.shape[1])], axis=1)


def score_seed_windows(kick_env: np.ndarray, onset: np.ndarray, sr: int,
                       grid: BarGrid, seed_bars: int) -> list[tuple[float, int]]:
    """Rank candidate seed positions by drum strength and bar-to-bar stability.

    A good loop seed is not just loud -- it is CONSISTENT, because an
    inconsistent seed makes an audibly repeating artifact when looped.
    """
    out = []
    for bar in range(max(grid.n_bars - seed_bars, 0)):
        f0 = int(grid.tick_to_time(bar) * sr / dsp.HOP)
        f1 = int(grid.tick_to_time(bar + seed_bars) * sr / dsp.HOP)
        if f1 <= f0 or f1 > len(onset):
            continue
        seg_k, seg_o = kick_env[f0:f1], onset[f0:f1]
        if seg_o.size < 8:
            continue
        per_bar = []
        for k in range(seed_bars):
            a = int(grid.tick_to_time(bar + k) * sr / dsp.HOP)
            b = int(grid.tick_to_time(bar + k + 1) * sr / dsp.HOP)
            if b > a and b <= len(onset):
                per_bar.append(onset[a:b].mean())
        if len(per_bar) < seed_bars:
            continue
        strength = float(seg_k.mean() * 2.0 + seg_o.mean())
        stability = 1.0 / (1.0 + float(np.std(per_bar) / (np.mean(per_bar) + 1e-9)))
        out.append((strength * stability, bar))
    out.sort(reverse=True)
    return out
