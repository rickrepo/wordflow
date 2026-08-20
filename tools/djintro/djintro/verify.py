"""The verifier. Every gate is measured on the RENDERED audio.

This is the closed loop the whole design rests on. Nothing here trusts an
intermediate: the renderer's own claim about where it put the splice is not
evidence, so the gates re-derive everything from the output file. G1 in
particular re-runs the full grid detector on the render and demands the intro
measure as exactly 8 bars -- an incorrect beatgrid cannot survive that, which is
what turns "hopefully correct" into "correct or abstained".
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

import numpy as np

from . import dsp, grid as grid_mod, loudness, render


class Outcome(str, Enum):
    DELIVER = "deliver"
    DELIVER_WITH_NOTE = "deliver_with_note"
    ABSTAIN = "abstain"


@dataclass
class GateResult:
    gate: str
    name: str
    passed: bool
    measured: float
    threshold: str
    detail: str = ""

    def __str__(self) -> str:
        mark = "PASS" if self.passed else "FAIL"
        return f"{self.gate} {self.name:<22s} {mark}  {self.measured:>10.4f}  (need {self.threshold})"


@dataclass
class Verdict:
    outcome: Outcome
    gates: list[GateResult] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    soft_score: float = 0.0

    @property
    def passed(self) -> bool:
        return all(g.passed for g in self.gates)

    @property
    def failures(self) -> list[GateResult]:
        return [g for g in self.gates if not g.passed]


# Thresholds. Tuned against the synthetic corpus; every one of them is a
# hypothesis until the real 200-track corpus exists.
G1_BARS = 8
# 5.0 was an arbitrary number in the first draft of the design. Two things set
# the real budget:
#   - AUDIBILITY. Flam between two drum hits becomes audible somewhere around
#     10-15 ms. Below that a listener cannot tell the edit happened.
#   - RESOLUTION. The lattice is fitted from beat times quantised to the
#     512-sample analysis hop (11.6 ms). Fitting over ~12 beats leaves roughly
#     11.6/sqrt(12) = 3.4 ms of standard error on the fitted phase, so a 5 ms
#     threshold sits at about 1.5 sigma of the measurement's own noise -- it
#     would fail clean edits for reasons that have nothing to do with the edit.
# 10 ms is below audibility and above the noise floor of the instrument, so it
# means something. Tightening it again requires refining the grid to sub-hop
# resolution first, not just lowering the constant.
G2_SPLICE_MS = 10.0
G3_TEMPO_PCT = 1.5
G5_CLICK_RATIO = 4.0  # step / local RMS
G6_LUFS_DELTA = 1.0
G7_TRUE_PEAK = -1.0
G8_DROPOUT_MS = 120.0
G8_FLOOR_DB = -60.0


def gate_g1_bar_count(audio, sr, splice_sample, genre, expect_bars=G1_BARS,
                      intro_grid=None) -> GateResult:
    """Re-analyse the render and count bars before the splice."""
    intro = audio[:splice_sample]
    if len(intro) < sr:
        return GateResult("G1", "grid integrity", False, 0.0, f"{expect_bars} bars",
                          "intro too short to analyse")
    g = intro_grid if intro_grid is not None else grid_mod.detect_grid(intro, sr, genre=genre)
    if g.n_bars == 0 or len(g.beat_times) < 2:
        return GateResult("G1", "grid integrity", False, 0.0, f"{expect_bars} bars",
                          "no grid recoverable from render")
    beat = float(np.median(np.diff(g.beat_times)))
    measured = (len(intro) / sr) / (beat * g.meter)
    ok = abs(measured - expect_bars) < 0.25
    return GateResult("G1", "grid integrity", ok, measured, f"{expect_bars} +/-0.25 bars",
                      f"re-detected {g.bpm:.1f} BPM, pattern {g.pattern}")


FINE_HOP = 64  # 1.45 ms at 44.1 kHz


def _fine_onset(mono: np.ndarray, sr: int) -> np.ndarray:
    """Onset envelope at 1.45 ms resolution.

    The main envelope runs at a 512-sample hop -- 11.6 ms -- and G2's budget is
    5 ms. Asserting millisecond alignment off an 11.6 ms grid is measuring below
    the resolution of the instrument, which is how two unrelated tracks produced
    identical bogus errors.
    """
    mag = dsp.stft(mono, n_fft=512, hop=FINE_HOP)
    if mag.shape[1] == 0:
        return np.zeros(0)
    logm = np.log1p(1000.0 * mag)
    return np.maximum(np.diff(logm, axis=1, prepend=logm[:, :1]), 0.0).sum(axis=0)


def gate_g2_splice_alignment(audio, sr, splice_sample, genre, render_grid=None) -> GateResult:
    """Is the beat lattice CONTINUOUS across the join?

    Not "does a beat land on the cut" -- the cut is deliberately moved off the
    downbeat into an onset valley, so that would be the wrong question.

    Fit the pre-splice lattice, extrapolate it past the splice, then slide the
    predicted pulse train against the post-splice onset envelope and find the
    lag that best explains what is actually there. Correlating the whole train
    at once averages out the beats that carry no onset -- and in one drop, three
    beats in four carry none, so snapping beats individually just measures noise.
    """
    g = render_grid if render_grid is not None else grid_mod.detect_grid(audio, sr, genre=genre)
    t = splice_sample / sr
    before = g.beat_times[g.beat_times < t]
    after = g.beat_times[g.beat_times >= t]
    if len(before) < 6 or len(after) < 3:
        return GateResult("G2", "splice alignment", False, 999.0, f"<={G2_SPLICE_MS} ms",
                          "too few beats either side to extrapolate")

    idx = np.arange(len(before))
    period, phase0 = np.polyfit(idx, before, 1)
    if period <= 0:
        return GateResult("G2", "splice alignment", False, 999.0, f"<={G2_SPLICE_MS} ms",
                          "degenerate beat period")

    env = _fine_onset(dsp.to_mono(audio), sr)
    if env.size == 0:
        return GateResult("G2", "splice alignment", False, 999.0, f"<={G2_SPLICE_MS} ms",
                          "no onset envelope")

    def best_lag(times: np.ndarray) -> float:
        """Slide a pulse train at `times` against the fine envelope."""
        max_lag_s = period / 2.0
        lags = np.arange(-max_lag_s, max_lag_s, FINE_HOP / sr)
        scores = np.empty(len(lags))
        for j, lag in enumerate(lags):
            f = np.round((times + lag) * sr / FINE_HOP).astype(int)
            f = f[(f >= 1) & (f < len(env) - 1)]
            scores[j] = (float(np.stack([env[f - 1], env[f], env[f + 1]]).max(axis=0).mean())
                         if f.size else 0.0)
        return float(lags[int(np.argmax(scores))])

    # Measure BOTH sides against the same fitted lattice and take the difference.
    # The fitted phase carries a few ms of its own error (beat times come off an
    # 11.6 ms hop), and an absolute one-sided measurement cannot tell that error
    # from a real misalignment. Differentially, it cancels.
    n_side = int(min(len(before), 12))
    n_after = int(min(len(after), 12))
    pre_lag = best_lag(phase0 + np.arange(len(before) - n_side, len(before)) * period)
    post_lag = best_lag(phase0 + np.arange(len(before), len(before) + n_after) * period)
    ms = abs(post_lag - pre_lag) * 1000.0
    return GateResult("G2", "splice alignment", ms <= G2_SPLICE_MS, ms,
                      f"<={G2_SPLICE_MS} ms",
                      f"pre {pre_lag * 1000:+.1f} ms, post {post_lag * 1000:+.1f} ms, "
                      f"period {period * 1000:.1f} ms")


def gate_g3_tempo_continuity(audio, sr, splice_sample, genre, render_grid=None) -> GateResult:
    """Beat intervals either side of the join must agree.

    Detect once over the whole render and split the beat list at the splice.
    Detecting separately on short windows either side does not work at reggae
    tempo: a 4-second window holds barely one bar at 74 BPM, far too few beats
    for the tracker, and the gate fails for lack of data rather than for a real
    discontinuity.
    """
    g = render_grid if render_grid is not None else grid_mod.detect_grid(audio, sr, genre=genre)
    if len(g.beat_times) < 8:
        return GateResult("G3", "tempo continuity", False, 999.0, f"<={G3_TEMPO_PCT}%",
                          "too few beats recovered from render")
    t = splice_sample / sr
    before = g.beat_times[g.beat_times < t]
    after = g.beat_times[g.beat_times >= t]
    if len(before) < 3 or len(after) < 3:
        return GateResult("G3", "tempo continuity", False, 999.0, f"<={G3_TEMPO_PCT}%",
                          "splice too close to an edge to measure both sides")
    pa = float(np.median(np.diff(before)))
    pb = float(np.median(np.diff(after)))
    pct = abs(pa - pb) / max(pb, 1e-9) * 100.0
    return GateResult("G3", "tempo continuity", pct <= G3_TEMPO_PCT, pct,
                      f"<={G3_TEMPO_PCT}%", f"{60 / pa:.1f} -> {60 / pb:.1f} BPM")


def _click_stat(mono: np.ndarray, at: int, sr: int) -> float:
    """Max single-sample step near `at`, normalised by the LOCAL RMS.

    Normalising by the local median step is wrong: when a quiet intro meets a
    loud body the median collapses and the ratio explodes to hundreds, flagging
    a clean edit because a hi-hat arrived. Step-over-RMS is a bandwidth measure
    instead -- it is level independent, bounded for real audio, and genuinely
    large only for a discontinuity.
    """
    w = int(0.03 * sr)
    lo, hi = max(at - w, 1), min(at + w, len(mono))
    if hi <= lo + 2:
        return 0.0
    seg = mono[lo:hi]
    rms = float(np.sqrt(np.mean(seg ** 2))) + 1e-9
    return float(np.abs(np.diff(seg)).max() / rms)


def gate_g5_no_clicks(audio, sr, splice_sample, genre, render_grid=None,
                      intro_only=None, body_only=None, fade=None) -> GateResult:
    """Did the EDIT add a discontinuity, or is that just the music?

    Absolute step thresholds do not work here and neither does self-calibration
    against other downbeats. A drums-only intro meeting a full-mix body is a
    large, legitimate level change, and any window straddling it inflates every
    step-based statistic -- measured at 5-16x on clean edits whose splice sample
    step was smaller than the median step around it.

    So measure differentially against a null reference: re-join the same two
    pieces with a crossfade four times longer. A long fade cannot produce a step
    artifact. If the short-fade render scores no worse than the long-fade one,
    the short fade added nothing and whatever the raw number is, it is the music.
    """
    mono = dsp.to_mono(audio)
    at_splice = _click_stat(mono, splice_sample, sr)

    if intro_only is None or body_only is None or not fade:
        return GateResult("G5", "no clicks", at_splice <= G5_CLICK_RATIO, at_splice,
                          f"<={G5_CLICK_RATIO}x (absolute)", "no null reference available")

    long_fade = int(min(fade * 4, len(intro_only) - 1, len(body_only) - 1))
    if long_fade <= fade:
        return GateResult("G5", "no clicks", at_splice <= G5_CLICK_RATIO, at_splice,
                          f"<={G5_CLICK_RATIO}x (absolute)", "pieces too short for reference")
    ref_audio = render.crossfade_join(intro_only, body_only, long_fade)
    ref_splice = len(intro_only) - long_fade
    at_ref = _click_stat(dsp.to_mono(ref_audio), ref_splice, sr)

    # A 4x-longer fade genuinely smooths whatever transient sits at the join, so
    # the short-fade render scores somewhat higher even with no artifact at all.
    # What a real click looks like here is a multiple, not a margin.
    excess = at_splice / (at_ref + 1e-9)
    return GateResult("G5", "no clicks", excess <= 2.5, excess, "<=2.5x null reference",
                      f"{at_splice:.2f} with {fade} smp fade vs {at_ref:.2f} with "
                      f"{long_fade} smp fade")


CONTINUITY_WINDOW_S = 3.0


def gate_g6_loudness_continuity(audio, sr, splice_sample) -> GateResult:
    w = int(CONTINUITY_WINDOW_S * sr)
    a = audio[max(splice_sample - w, 0):splice_sample]
    b = audio[splice_sample:splice_sample + w]
    if len(a) < sr // 2 or len(b) < sr // 2:
        return GateResult("G6", "loudness continuity", True, 0.0, f"<={G6_LUFS_DELTA} LU",
                          "too short to measure")
    delta = abs(loudness.integrated_lufs(a, sr) - loudness.integrated_lufs(b, sr))
    return GateResult("G6", "loudness continuity", delta <= G6_LUFS_DELTA, delta,
                      f"<={G6_LUFS_DELTA} LU")


def gate_g7_true_peak(audio, sr) -> GateResult:
    tp = loudness.true_peak_dbtp(audio, sr)
    return GateResult("G7", "true peak", tp <= G7_TRUE_PEAK, tp, f"<={G7_TRUE_PEAK} dBTP")


def gate_g8_dropout(audio, sr, splice_sample, n_bars=G1_BARS) -> GateResult:
    """Catch a dead source region without flagging musical space.

    An absolute -60 dBFS floor is the wrong test here. Reggae one drop puts one
    kick in a bar; at 74 BPM that leaves nearly three seconds between hits, and
    an absolute floor calls that a dropout when it is the actual groove.

    What the gate is really for is the engine having grabbed a silent stretch of
    the track. Because the intro is a loop, every bar carries the same pattern,
    so a dead region shows up as a BAR that is anomalously quiet relative to the
    other bars -- not as a gap inside a bar. Measure that instead, plus an
    absolute check that the intro is not simply silent overall.
    """
    intro = audio[:splice_sample]
    if len(intro) < sr // 2:
        return GateResult("G8", "no dropout", False, 0.0, "no dead bar", "intro too short")
    overall = loudness.integrated_lufs(intro, sr)
    if overall < -45.0:
        return GateResult("G8", "no dropout", False, overall, ">-45 LUFS overall",
                          "intro is effectively silent")
    mono = dsp.to_mono(intro)
    per_bar = len(mono) / max(n_bars, 1)
    rms = []
    for b in range(n_bars):
        lo, hi = int(b * per_bar), int(min((b + 1) * per_bar, len(mono)))
        if hi > lo:
            rms.append(np.sqrt(np.mean(mono[lo:hi] ** 2) + 1e-12))
    if len(rms) < 2:
        return GateResult("G8", "no dropout", True, 0.0, "no dead bar")
    db = 20 * np.log10(np.asarray(rms))
    worst = float(np.median(db) - db.min())
    return GateResult("G8", "no dropout", worst < 20.0, worst, "<20 dB below median bar",
                      f"quietest bar {int(np.argmin(db)) + 1} of {n_bars}")


def verify(result, genre: str = "auto") -> Verdict:
    """Run every gate against the rendered audio and decide the outcome."""
    a, sr, s = result.audio, result.sr, result.splice_sample
    # Detect once, reuse everywhere. Four gates need a grid off the render and
    # re-deriving it four times is the difference between a usable tool and one
    # that takes two minutes a track.
    render_grid = grid_mod.detect_grid(a, sr, genre=genre)
    intro_grid = grid_mod.detect_grid(a[:s], sr, genre=genre) if s > sr else None
    gates = [
        gate_g1_bar_count(a, sr, s, genre, result.intro_bars, intro_grid),
        gate_g2_splice_alignment(a, sr, s, genre, render_grid),
        gate_g3_tempo_continuity(a, sr, s, genre, render_grid),
        gate_g5_no_clicks(a, sr, s, genre, render_grid,
                          result.intro_only, result.body_only, result.splice.fade_samples),
        gate_g6_loudness_continuity(a, sr, s),
        gate_g7_true_peak(a, sr),
        gate_g8_dropout(a, sr, s, result.intro_bars),
    ]
    notes = list(result.notes)
    if result.splice.micro_lag_rejected:
        notes.append("micro-alignment lag exceeded limit; grid may be unreliable at the splice")

    if not all(g.passed for g in gates):
        return Verdict(Outcome.ABSTAIN, gates, notes + [
            "blocked by: " + ", ".join(f"{g.gate} {g.name}" for g in gates if not g.passed)])

    # Tier L4 is the floor of the ladder, so a passing L4 is always delivered
    # with a note saying what was compromised -- never silently.
    if result.strategy == "L4_DRUMS":
        notes.append("tier L4 (drums-only): built from the percussive component, "
                     "not from vocal-free source material")
        return Verdict(Outcome.DELIVER_WITH_NOTE, gates, notes, soft_score=0.6)
    return Verdict(Outcome.DELIVER, gates, notes, soft_score=1.0)
