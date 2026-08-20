"""Reverse-engineer a recorded DJ mix into readable data.

Track profiles describe what a record IS. This describes what a DJ DID with it:
where each track came in, how long the blend ran, whether it landed on a phrase
line, which way the key moved, and whether the bass was swapped before or after
the rest of the spectrum.

That is the material an AI needs to learn mixing from. A model cannot infer
technique from track metadata alone -- it needs examples of decisions that
worked, which means analysing finished mixes and aggregating across many of them
(see corpus.py).

INPUT: analyse audio you have the right to analyse. Your own recorded sets are
both the obvious source and the most useful, because you know what you did.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field

import numpy as np
from scipy.signal import butter, sosfilt

from . import dsp, theory
from .grid import BarGrid, detect_grid
from .key import Key, detect_key

# A DJ mix is a sequence of long homogeneous blocks, unlike a song, which
# changes section every 8-16 bars. The novelty kernel and the minimum segment
# length are both sized for that.
MIN_SEGMENT_BARS = 16
NOVELTY_KERNEL_BARS = 12

# Features are smoothed over this many bars before anything is compared.
#
# This is load-bearing, not a tidy-up. Per-bar chroma is dominated by where you
# are in the CHORD CYCLE, not by which record is playing: measured on a test
# mix, two bars of the same track scored 0.42 similarity while bars from two
# different tracks scored 0.64. Comparing single bars compares chords. Smoothing
# across the harmonic cycle averages the cycle out and leaves the track's own
# pitch-class content, which is what actually identifies it.
SMOOTH_BARS = 8

# Below this, blind segmentation has not actually separated the tracks and the
# boundaries it reports are not worth reading. Emitting them anyway -- with bar
# numbers and blend lengths that look authoritative -- would be worse than
# saying nothing, so the analysis reports its own unreliability instead.
SEGMENTATION_MIN_CONFIDENCE = 0.35

# A blend longer than this is almost certainly the span detector failing rather
# than a real DJ move; measured spans of 39 bars against 16-bar ground truth.
MAX_PLAUSIBLE_BLEND_BARS = 32


@dataclass
class Segment:
    index: int
    start_bar: int
    end_bar: int
    start_s: float
    end_s: float
    bpm: float
    camelot: str
    key_name: str
    mode: str
    energy: float
    bass_note: str

    @property
    def bars(self) -> int:
        return self.end_bar - self.start_bar


@dataclass
class Transition:
    at_bar: int
    at_s: float
    bars: int
    kind: str
    phrase_aligned: bool
    phrase_multiple: int
    key_from: str
    key_to: str
    key_move: str
    key_move_note: str
    tempo_from: float
    tempo_to: float
    tempo_pct: float
    energy_change: float
    bass_swap: str = "none"
    bass_swap_bars: int = 0
    notes: list[str] = field(default_factory=list)


@dataclass
class MixAnalysis:
    duration_s: float
    bpm: float
    n_bars: int
    segments: list[Segment] = field(default_factory=list)
    transitions: list[Transition] = field(default_factory=list)
    energy_by_bar: list[float] = field(default_factory=list)
    segmentation_confidence: float = 0.0
    warnings: list[str] = field(default_factory=list)

    @property
    def reliable(self) -> bool:
        return self.segmentation_confidence >= SEGMENTATION_MIN_CONFIDENCE

    def to_text(self) -> str:
        def clock(t: float) -> str:
            return f"{int(t) // 60}:{int(t) % 60:02d}"

        L = [f"MIX   {clock(self.duration_s)}   {self.bpm} BPM   {self.n_bars} bars",
             f"  segmentation confidence {self.segmentation_confidence:.2f} "
             f"({'usable' if self.reliable else 'NOT RELIABLE'})"]
        for w in self.warnings:
            L.append(f"  ! {w}")
        L.append("")
        L.append("TIMELINE")
        for s in self.segments:
            L.append(f"  {clock(s.start_s):>6s}-{clock(s.end_s):<6s} bars "
                     f"{s.start_bar:>4d}-{s.end_bar:<4d}  {s.bpm:5.1f} BPM  "
                     f"{s.camelot:<4s} {s.mode:<14s} bass {s.bass_note:<2s} E {s.energy:.2f}")
        L.append("")
        L.append("TRANSITIONS")
        if not self.transitions:
            L.append("  none detected")
        for t in self.transitions:
            span = "unknown" if t.bars < 0 else f"{t.bars} bars"
            L.append(f"  {clock(t.at_s):>6s}  bar {t.at_bar:<4d} {t.kind:<15s} {span:<9s}"
                     f"  {t.key_from}->{t.key_to} ({t.key_move})")
            L.append(f"          phrase-aligned: "
                     + (f"yes, on a {t.phrase_multiple}-bar line" if t.phrase_aligned else "no"))
            L.append(f"          tempo {t.tempo_from:.1f} -> {t.tempo_to:.1f} "
                     f"({t.tempo_pct:+.1f}%)   energy {t.energy_change:+.2f}")
            if t.bass_swap != "none":
                L.append(f"          {t.bass_swap} by {t.bass_swap_bars} bars")
            for n in t.notes:
                L.append(f"          - {n}")
        return "\n".join(L)

    def to_dict(self) -> dict:
        return {"duration_s": self.duration_s, "bpm": self.bpm, "n_bars": self.n_bars,
                "segmentation_confidence": self.segmentation_confidence,
                "reliable": self.reliable, "warnings": self.warnings,
                "segments": [asdict(s) for s in self.segments],
                "transitions": [asdict(t) for t in self.transitions],
                "energy_by_bar": self.energy_by_bar}


def _band(x: np.ndarray, sr: int, lo: float, hi: float) -> np.ndarray:
    ny = sr / 2
    if hi >= ny:
        sos = butter(4, lo / ny, btype="high", output="sos")
    elif lo <= 0:
        sos = butter(4, hi / ny, btype="low", output="sos")
    else:
        sos = butter(4, [lo / ny, hi / ny], btype="band", output="sos")
    return sosfilt(sos, x)


def _harmonic(mono: np.ndarray, sr: int) -> np.ndarray:
    """Harmonic component, via HPSS, resynthesised to a waveform."""
    mag = dsp.stft(mono)
    if mag.shape[1] == 0:
        return mono
    harm, _ = dsp.hpss(mag)
    padded = np.pad(mono, dsp.N_FFT // 2, mode="reflect")
    idx = np.arange(dsp.N_FFT)[None, :] + dsp.HOP * np.arange(mag.shape[1])[:, None]
    win = np.hanning(dsp.N_FFT + 1)[:-1]
    phase = np.angle(np.fft.rfft(padded[idx] * win, n=dsp.N_FFT, axis=1).T)
    return dsp.istft(harm, phase, len(mono))


def _bar_features(mono: np.ndarray, sr: int, grid: BarGrid) -> dict[str, np.ndarray]:
    """Per-bar chroma, band energies and level, in three registers.

    The registers are what make bass-swap detection possible: if the low band's
    allegiance flips to the incoming track several bars before the mid band's
    does, the DJ swapped the bass early.
    """
    n = grid.n_bars

    # Chroma must come off the HARMONIC component, not the full mix.
    #
    # Drums are broadband: they push energy into every pitch class and smear the
    # chroma toward uniform, which buries the differences between records under
    # a kit that is common to all of them. detect_key already separates for this
    # reason; measuring track identity needs it just as much.
    harm = _harmonic(mono, sr)
    chroma = dsp.chroma_precise(harm, sr)
    ch_t = np.arange(chroma.shape[1]) * dsp.CHROMA_HOP / sr

    low = _band(harm, sr, 0, 200.0)
    mid = _band(harm, sr, 500.0, 4000.0)

    ch_bar = np.zeros((n, 12))
    lo_bar = np.zeros((n, 12))
    mid_bar = np.zeros((n, 12))
    rms = np.zeros(n)

    ch_low = dsp.chroma_precise(low, sr)
    ch_mid = dsp.chroma_precise(mid, sr)

    for b in range(n):
        t0, t1 = grid.tick_to_time(b), grid.tick_to_time(b + 1)
        m = (ch_t >= t0) & (ch_t < t1)
        if m.any():
            ch_bar[b] = chroma[:, m].mean(axis=1)
            if ch_low.shape[1] == chroma.shape[1]:
                lo_bar[b] = ch_low[:, m].mean(axis=1)
            if ch_mid.shape[1] == chroma.shape[1]:
                mid_bar[b] = ch_mid[:, m].mean(axis=1)
        s0, s1 = int(t0 * sr), min(int(t1 * sr), len(mono))
        if s1 > s0:
            rms[b] = float(np.sqrt(np.mean(mono[s0:s1] ** 2) + 1e-12))

    mag = dsp.stft(mono)
    _, per_band = dsp.onset_envelope(mag, sr)
    ft = dsp.frame_times(mag.shape[1], sr)
    tim = np.zeros((n, per_band.shape[0]))
    for b in range(n):
        t0, t1 = grid.tick_to_time(b), grid.tick_to_time(b + 1)
        m = (ft >= t0) & (ft < t1)
        if m.any():
            tim[b] = per_band[:, m].mean(axis=1)

    return {"chroma": ch_bar, "low": lo_bar, "mid": mid_bar, "rms": rms, "timbre": tim}


def _normalise(v: np.ndarray) -> np.ndarray:
    return v / (np.linalg.norm(v, axis=-1, keepdims=True) + 1e-9)


def _smooth(v: np.ndarray, bars: int = SMOOTH_BARS) -> np.ndarray:
    """Moving average across bars. See SMOOTH_BARS for why this is required."""
    if bars <= 1 or len(v) < bars:
        return v
    from scipy.ndimage import uniform_filter1d
    return uniform_filter1d(v, size=bars, axis=0, mode="nearest")


def _track_identity(feats: dict, bars: int = SMOOTH_BARS) -> np.ndarray:
    """Per-bar vector describing WHICH RECORD is playing, not which chord."""
    ch = _normalise(_smooth(feats["chroma"], bars))
    tim = _normalise(_smooth(feats["timbre"], bars))
    return _normalise(np.hstack([ch, tim]))


def segmentation_contrast(feats: dict) -> float:
    """How separable the tracks in this mix actually are.

    Compares typical within-block similarity against typical across-block
    similarity at a lag longer than any single track. If bars far apart look as
    alike as bars close together, there is no block structure to find and any
    boundary the novelty curve reports is noise.
    """
    x = _track_identity(feats)
    n = len(x)
    if n < 40:
        return 0.0
    near = [float(x[i] @ x[i + 4]) for i in range(n - 4)]
    far = [float(x[i] @ x[i + 32]) for i in range(n - 32)]
    if not near or not far:
        return 0.0
    gap = float(np.median(near) - np.median(far))
    return float(np.clip(gap / 0.12, 0.0, 1.0))


def _find_boundaries(feats: dict, min_bars: int = MIN_SEGMENT_BARS,
                     kernel: int = NOVELTY_KERNEL_BARS) -> list[int]:
    """Bar indices where one track gives way to another."""
    x = _track_identity(feats)
    n = len(x)
    if n < kernel * 2 + 2:
        return []
    ssm = x @ x.T

    k = np.ones((2 * kernel, 2 * kernel))
    k[:kernel, kernel:] = -1
    k[kernel:, :kernel] = -1
    nov = np.zeros(n)
    for i in range(kernel, n - kernel):
        nov[i] = float((ssm[i - kernel:i + kernel, i - kernel:i + kernel] * k).sum())
    nov = np.maximum(nov, 0.0)
    if nov.max() <= 0:
        return []

    thresh = float(np.percentile(nov[nov > 0], 80))
    peaks = []
    for i in range(1, n - 1):
        if nov[i] >= thresh and nov[i] >= nov[i - 1] and nov[i] > nov[i + 1]:
            if not peaks or i - peaks[-1] >= min_bars:
                peaks.append(i)
            elif nov[i] > nov[peaks[-1]]:
                peaks[-1] = i
    return peaks


def _transition_span(feats: dict, boundary: int, window: int = 20) -> tuple[int, int]:
    """How many bars either side of a boundary contain BOTH tracks.

    During a pure stretch of one track, a bar resembles that track's centroid
    and not the other's. Through a blend it resembles both about equally. So
    score each bar by how balanced those two similarities are, and the run of
    balanced bars around the boundary IS the blend.
    """
    x = _track_identity(feats)
    n = len(x)
    a0, a1 = max(boundary - window, 0), max(boundary - 4, 1)
    b0, b1 = min(boundary + 4, n - 1), min(boundary + window, n)
    if a1 <= a0 or b1 <= b0:
        return boundary, 0
    before = _normalise(x[a0:a1].mean(axis=0))
    after = _normalise(x[b0:b1].mean(axis=0))

    lo, hi = max(boundary - window, 0), min(boundary + window, n)
    sim_b = x[lo:hi] @ before
    sim_a = x[lo:hi] @ after
    balance = 1.0 - np.abs(sim_b - sim_a) / (np.abs(sim_b) + np.abs(sim_a) + 1e-9)

    idx = boundary - lo
    if idx < 0 or idx >= len(balance):
        return boundary, 0
    thresh = 0.55 * float(balance[idx]) if balance[idx] > 0 else 0.0
    if thresh <= 0:
        return boundary, 0
    start = idx
    while start > 0 and balance[start - 1] >= thresh:
        start -= 1
    end = idx
    while end < len(balance) - 1 and balance[end + 1] >= thresh:
        end += 1
    return lo + start, (end - start)


def _bass_swap(feats: dict, start_bar: int, bars: int) -> tuple[str, int]:
    """Did the low band change allegiance before or after the mid band?

    A bass swap -- cutting one track's low end and bringing the other's in --
    shows up as the low register flipping to the incoming track at a different
    bar from the mids. Same bar means the DJ just rode the crossfader.
    """
    if bars < 3:
        return "none", 0
    n = len(feats["rms"])
    a0, a1 = max(start_bar - 8, 0), max(start_bar - 1, 1)
    b0, b1 = min(start_bar + bars + 1, n - 1), min(start_bar + bars + 8, n)
    if a1 <= a0 or b1 <= b0:
        return "none", 0

    def flip_bar(key: str) -> int | None:
        v = _normalise(_smooth(feats[key], 4))
        before = _normalise(v[a0:a1].mean(axis=0))
        after = _normalise(v[b0:b1].mean(axis=0))
        if not np.any(before) or not np.any(after):
            return None
        seg = v[start_bar:start_bar + bars]
        d = seg @ after - seg @ before
        sign = np.sign(d)
        for i in range(1, len(sign)):
            if sign[i] > 0 and sign[i - 1] <= 0:
                return start_bar + i
        return None

    lo_flip, mid_flip = flip_bar("low"), flip_bar("mid")
    if lo_flip is None or mid_flip is None:
        return "none", 0
    delta = lo_flip - mid_flip
    if delta <= -2:
        return "bass swapped in early", int(-delta)
    if delta >= 2:
        return "bass held back", int(delta)
    return "none", 0


def _phrase_alignment(bar: int) -> tuple[bool, int]:
    for m in (32, 16, 8):
        if bar % m == 0:
            return True, m
    return False, 0


def _kind(bars: int) -> str:
    if bars <= 1:
        return "cut"
    if bars <= 4:
        return "quick blend"
    if bars <= 12:
        return "blend"
    if bars <= 24:
        return "long blend"
    return "extended blend"


def analyse_mix(audio: np.ndarray, sr: int, genre: str = "auto",
                min_segment_bars: int = MIN_SEGMENT_BARS) -> MixAnalysis:
    """Segment a mix into tracks and describe every transition."""
    mono = dsp.to_mono(np.asarray(audio, dtype=np.float64))
    grid = detect_grid(audio, sr, genre=genre)
    if grid.n_bars < min_segment_bars * 2:
        return MixAnalysis(len(mono) / sr, grid.bpm, grid.n_bars)

    feats = _bar_features(mono, sr, grid)
    contrast = segmentation_contrast(feats)
    warnings: list[str] = []
    if contrast < SEGMENTATION_MIN_CONFIDENCE:
        warnings.append(
            f"segmentation contrast {contrast:.2f} is below {SEGMENTATION_MIN_CONFIDENCE}: "
            "the tracks in this mix were not cleanly separated, so boundaries and "
            "blend lengths below are unreliable. Prefer library-matched "
            "segmentation (see corpus notes) when the source records are available.")
    bounds = _find_boundaries(feats, min_bars=min_segment_bars)
    edges = [0] + bounds + [grid.n_bars]

    energy = feats["rms"]
    energy = energy / (np.percentile(energy, 95) + 1e-9)
    energy = np.clip(energy, 0, 1)

    segments: list[Segment] = []
    for i in range(len(edges) - 1):
        a, b = edges[i], edges[i + 1]
        if b - a < 4:
            continue
        # Analyse the segment's INTERIOR: its edges contain the neighbouring
        # track, so keying the whole span would key the blend, not the record.
        pad = min(4, (b - a) // 4)
        t0 = grid.tick_to_time(a + pad)
        t1 = grid.tick_to_time(b - pad)
        s0, s1 = int(t0 * sr), min(int(t1 * sr), len(mono))
        core = mono[s0:s1] if s1 > s0 + sr else mono[int(grid.tick_to_time(a) * sr):s1]
        key: Key = detect_key(core, sr) if len(core) > sr else Key(0, "major", "8B", 0.0)
        pcs = np.median(dsp.chroma_precise(core, sr), axis=1) if len(core) > sr else np.zeros(12)
        mode = theory.detect_mode(pcs, tonic=key.tonic) if pcs.any() else None
        bass_pc, _ = theory.bass_pitch_class(core, sr) if len(core) > sr else (-1, 0.0)
        seg_beats = grid.beat_times[(grid.beat_times >= t0) & (grid.beat_times < t1)]
        bpm = 60.0 / float(np.median(np.diff(seg_beats))) if len(seg_beats) > 2 else grid.bpm
        segments.append(Segment(
            index=len(segments), start_bar=a, end_bar=b,
            start_s=round(grid.tick_to_time(a), 2), end_s=round(grid.tick_to_time(b), 2),
            bpm=round(bpm, 1), camelot=key.camelot, key_name=key.name,
            mode=mode.name if mode else "", energy=round(float(energy[a:b].mean()), 3),
            bass_note=theory.PITCH_NAMES[bass_pc] if bass_pc >= 0 else ""))

    transitions: list[Transition] = []
    for i, bar in enumerate(bounds):
        if i + 1 >= len(segments) or i >= len(segments):
            continue
        start, span = _transition_span(feats, bar)
        if span > MAX_PLAUSIBLE_BLEND_BARS:
            warnings.append(f"blend at bar {start} measured {span} bars, beyond the "
                            f"{MAX_PLAUSIBLE_BLEND_BARS}-bar plausibility limit; "
                            "reported as unknown")
            span = -1
        a, b = segments[i], segments[i + 1]
        move, note = theory.camelot_direction(a.camelot, b.camelot)
        aligned, mult = _phrase_alignment(start)
        swap, swap_bars = _bass_swap(feats, start, span)
        notes = []
        if not aligned:
            notes.append(f"starts on bar {start}, not a phrase line "
                         f"({start % 8} bars past the nearest 8)")
        if swap != "none":
            notes.append(f"{swap} by {swap_bars} bars -- low band changed hands "
                         "at a different point from the mids")
        e_a = float(np.mean(energy[a.start_bar:a.end_bar]))
        e_b = float(np.mean(energy[b.start_bar:b.end_bar]))
        transitions.append(Transition(
            at_bar=start, at_s=round(grid.tick_to_time(start), 2), bars=span,
            kind=_kind(span) if span >= 0 else "unknown", phrase_aligned=aligned,
            phrase_multiple=mult,
            key_from=a.camelot, key_to=b.camelot, key_move=move, key_move_note=note,
            tempo_from=a.bpm, tempo_to=b.bpm,
            tempo_pct=round((b.bpm - a.bpm) / max(a.bpm, 1e-9) * 100, 2),
            energy_change=round(e_b - e_a, 3),
            bass_swap=swap, bass_swap_bars=swap_bars, notes=notes))

    return MixAnalysis(
        duration_s=round(len(mono) / sr, 2), bpm=round(grid.bpm, 1),
        n_bars=grid.n_bars, segments=segments, transitions=transitions,
        energy_by_bar=[round(float(x), 3) for x in energy],
        segmentation_confidence=round(float(contrast), 3), warnings=warnings)
