"""Assemble an 8-bar intro and splice it onto the original track.

Phase 1 implements tier L4 of the fallback ladder -- the drums-only floor. It
is the least ambitious strategy and the most robust one: no harmonic risk, no
vocal risk, no key clash, and available for essentially any track with a pulse.
Building it first means there is always a working end-to-end system to verify
against; the better-sounding tiers (L0 riddim, L1 lift, L2 loop, L3 stem) sit
above it and fall back here.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from . import dsp, loudness, render
from .grid import BarGrid

INTRO_BARS = 8


@dataclass
class IntroResult:
    audio: np.ndarray
    sr: int
    grid: BarGrid
    intro_bars: int
    splice_sample: int
    body_start_bar: int
    seed_bar: int
    seed_bars: int
    strategy: str
    build: str
    gain_applied_db: float
    splice: render.SpliceReport
    notes: list[str] = field(default_factory=list)
    # Kept so the verifier can render a null reference for the click gate: the
    # same join with a much longer crossfade. If the statistic does not change,
    # the short fade is not producing an artifact and whatever G5 measured is
    # the music, not the edit.
    intro_only: np.ndarray | None = None
    body_only: np.ndarray | None = None

    @property
    def intro_duration(self) -> float:
        return self.splice_sample / self.sr


def _valley_offset(onset: np.ndarray, sr: int, target_time: float,
                   grid: BarGrid, body_start_bar: int) -> tuple[int, int]:
    """Find a splice offset, in samples, that lands in an onset-envelope valley.

    The offset is applied to BOTH sides of the join -- the intro is extended by
    the same amount the body start is delayed -- so the musical alignment and
    the 8-bar count are preserved exactly. Moving only one side would shift the
    body off the grid, which is the failure gate G1 exists to catch.
    """
    beat_s = grid.bar_duration(body_start_bar) / max(grid.meter, 1)
    search_frames = max(int((beat_s / 4.0) * sr / dsp.HOP), 1)  # +/- a sixteenth
    target_frame = int(round(target_time * sr / dsp.HOP))
    valley = render.onset_valley(onset, target_frame, search_frames)
    return (valley - target_frame) * dsp.HOP, valley


def build_drums_intro(audio: np.ndarray, sr: int, grid: BarGrid,
                      body_start_bar: int = 0, seed_bars: int = 4,
                      build: str = "HALF", pre_roll_ms: float = 120.0,
                      fade_ms: float = 12.0, target_bars: int = INTRO_BARS,
                      seed_bar: int | None = None,
                      verify_window_s: float = 3.0) -> IntroResult:
    """Tier L4: loop the percussive component into `target_bars` and splice."""
    a = render._as_2d(np.asarray(audio, dtype=np.float64))
    notes: list[str] = []

    mono = dsp.to_mono(a)
    mag = dsp.stft(mono)
    onset, _ = dsp.onset_envelope(mag, sr)
    kick_env = dsp.kick_envelope(mag, sr)

    perc = render.percussive_stereo(a, sr)

    if seed_bar is None:
        ranked = render.score_seed_windows(kick_env, onset, sr, grid, seed_bars)
        if not ranked:
            raise ValueError("no usable seed window found")
        seed_bar = ranked[0][1]
    repeats = max(int(np.ceil(target_bars / seed_bars)), 1)

    fade = int(fade_ms * sr / 1000.0)
    seed, pre = render.extract_bars(perc, sr, grid, seed_bar, seed_bars, pre_roll_ms)
    looped = render.loop_bars(seed, pre, repeats, fade)

    # The intro's true length is `repeats` copies of the SEED, not the duration
    # of `target_bars` consecutive bars starting at the seed. Those are not the
    # same number when the tempo drifts at all -- measured 11.6 ms apart on a
    # 74 BPM one drop -- and using the wrong one truncates the loop mid-pattern
    # and puts the body a fraction of a beat out.
    body_start_time = grid.tick_to_time(body_start_bar)
    seed_dur = grid.tick_to_time(seed_bar + seed_bars) - grid.tick_to_time(seed_bar)
    want = int(round(repeats * seed_dur * sr))
    margin = int(0.2 * sr)
    if len(looped) < want:
        pad = want - len(looped)
        looped = np.vstack([looped, np.zeros((pad, looped.shape[1]))])
        notes.append(f"seed loop {pad / sr * 1000:.0f} ms short of target; tail padded")

    density = render.kicks_per_bar(kick_env, sr, grid, seed_bar, seed_bars)
    intro, build_style = render.apply_build(looped[:want + margin], sr, grid, build,
                                            target_bars, kick_density=density)
    if build_style == "gain" and build != "FLAT":
        notes.append(f"kick density {density:.1f}/bar: staged the build by level, "
                     "not by band, to avoid dead air")

    # Splice offset, applied to BOTH sides by the same amount.
    #
    # The cut is moved off the downbeat into an onset valley so the crossfade
    # hides in a rhythmic gap. Moving only one side would shift the body off the
    # grid; moving both by the same delta keeps every downbeat where the intro's
    # own 8-bar lattice puts it. The crossfade then consumes `fade` samples of
    # overlap, so the intro must carry that too -- otherwise the body arrives
    # one fade-length early, which at 12 ms is twice the G2 budget on its own.
    off_samples, _ = _valley_offset(onset, sr, body_start_time, grid, body_start_bar)
    body_start = int(np.clip(int(round(body_start_time * sr)) + off_samples - fade,
                             0, len(a) - 1))
    body = a[body_start:]

    intro_len = int(np.clip(want + off_samples, fade + 1, len(intro)))
    intro = intro[:intro_len]

    # Micro-alignment: correct residual grid error by correlating the actual
    # audio, not by trusting the beat list. See render.align_by_correlation for
    # why this is load-bearing rather than a refinement.
    max_lag_ms = 30.0
    corr_bars = min(2, target_bars)
    corr_len = int(round((grid.tick_to_time(body_start_bar + corr_bars)
                          - body_start_time) * sr))
    corr_len = max(corr_len, sr)
    lag, conf = render.align_by_correlation(intro[-corr_len:], body[:corr_len], sr,
                                            max_lag_ms)
    # Do not shift on a correlation that found nothing. A peak that barely beats
    # its runner-up is noise, and applying a 20 ms shift on the strength of it is
    # worse than leaving the grid's own answer alone.
    min_conf = 0.05
    rejected = abs(lag) >= int(max_lag_ms / 1000.0 * sr) or conf < min_conf
    if conf < min_conf and lag:
        notes.append(f"micro-alignment inconclusive (confidence {conf:.3f}); "
                     "left the grid's alignment in place")
    if not rejected and lag:
        ns = int(np.clip(body_start + lag, 0, len(a) - 1))
        body = a[ns:]
        body_start = ns
        notes.append(f"micro-aligned body by {lag / sr * 1000:+.1f} ms "
                     f"(grid quantisation), confidence {conf:.3f}")

    # Match over the same window the continuity gate measures, on both sides.
    # Matching over a different span than the gate checks is how you get an edit
    # that measures fine on average and still jumps audibly at the splice.
    win = int(verify_window_s * sr)
    intro_tail = intro[-min(win, len(intro)):]
    ref_head = body[:min(win, len(body))]
    gain_db = loudness.match_gain_db(intro_tail, ref_head, sr)
    gain_db = float(np.clip(gain_db, -24.0, 24.0))
    intro = intro * (10 ** (gain_db / 20.0))

    # Zero-crossing-aligned equal-power join. Shortening the intro here moves
    # the cut, so the body start moves by the same amount to stay on the grid.
    zc = render.zero_crossing_near(intro, len(intro) - fade, int(0.001 * sr))
    zc = max(zc, fade + 1)
    shift = len(intro) - fade - zc
    if shift:
        ns = int(np.clip(body_start - shift, 0, len(a) - 1))
        body = a[ns:]
        body_start = ns
    intro = intro[:zc]
    out = render.crossfade_join(intro, body, fade)

    # Trim to -1.1, not -1.0: landing exactly on the gate threshold leaves the
    # result at the mercy of float rounding in the meter.
    peak = loudness.true_peak_dbtp(out, sr)
    if peak > -1.1:
        trim = -1.1 - peak
        out = out * (10 ** (trim / 20.0))
        notes.append(f"true peak {peak:.2f} dBTP -> gain trimmed {trim:.2f} dB")

    splice_sample = len(intro) - fade
    return IntroResult(
        audio=out, sr=sr, grid=grid, intro_bars=target_bars,
        splice_sample=splice_sample, body_start_bar=body_start_bar,
        seed_bar=seed_bar, seed_bars=seed_bars, strategy="L4_DRUMS",
        build=f"{build}:{build_style}", gain_applied_db=gain_db,
        intro_only=intro, body_only=body,
        splice=render.SpliceReport(sample=splice_sample, valley_shift_frames=off_samples // dsp.HOP,
                                   micro_lag_frames=0 if rejected else int(lag),
                                   fade_samples=fade, micro_lag_rejected=rejected),
        notes=notes)
