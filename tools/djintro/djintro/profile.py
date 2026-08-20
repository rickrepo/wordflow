"""Track profile: analysis in a form you can paste into an AI.

The text digest is the point of this module. It is written to be unambiguous to
a language model with no audio access: every position is in bars, every scalar
is on a stated scale, and nothing is implied by formatting alone.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

import numpy as np

from . import dsp, structure
from .grid import BarGrid, detect_grid
from .key import Key, detect_key

TEMPO_BANDS = {"dancehall": (82.0, 118.0), "soca": (135.0, 178.0)}


def tempo_band(bpm: float) -> str:
    for name, (lo, hi) in TEMPO_BANDS.items():
        if lo <= bpm <= hi:
            return name
    return "other"


def _digits(values: np.ndarray, step: int) -> tuple[list[int], list[int]]:
    """Downsample a per-bar curve to one 0-9 digit per `step` bars."""
    bars, out = [], []
    for i in range(0, len(values), step):
        seg = values[i:i + step]
        if seg.size:
            bars.append(i + 1)
            out.append(int(round(float(seg.mean()) * 9)))
    return bars, out


@dataclass
class TrackProfile:
    path: str
    name: str
    duration_s: float
    n_bars: int
    meter: int
    bpm: float
    tempo_drift_pct: float
    tempo_band: str
    key_name: str
    camelot: str
    key_confidence: float
    drum_pattern: str
    first_downbeat_s: float
    phase_confidence: float
    vocal_contrast: float
    sections: list[dict] = field(default_factory=list)
    mix_in: list[dict] = field(default_factory=list)
    mix_out: list[dict] = field(default_factory=list)
    energy_by_bar: list[float] = field(default_factory=list)
    vocal_by_bar: list[float] = field(default_factory=list)
    fingerprint: list[float] = field(default_factory=list)

    # ---------------------------------------------------------------- exports

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)

    def to_text(self, phrase: int = 8) -> str:
        e = np.asarray(self.energy_by_bar)
        v = np.asarray(self.vocal_by_bar)
        bars, e_d = _digits(e, phrase)
        _, v_d = _digits(v, phrase)

        L = []
        L.append(f"TRACK  {self.name}")
        L.append(f"  file            {self.path}")
        mins, secs = divmod(int(self.duration_s), 60)
        L.append(f"  duration        {mins}:{secs:02d}  ({self.n_bars} bars, {self.meter}/4)")
        drift = ("stable" if abs(self.tempo_drift_pct) < 0.5
                 else f"drifts {self.tempo_drift_pct:+.1f}%")
        L.append(f"  tempo           {self.bpm:.1f} BPM  ({self.tempo_band}, {drift})")
        L.append(f"  key             {self.key_name}   Camelot {self.camelot}"
                 f"   (confidence {self.key_confidence:.2f})")
        L.append(f"  drum pattern    {self.drum_pattern}")
        L.append(f"  first downbeat  {self.first_downbeat_s:.3f}s"
                 f"   (grid confidence {self.phase_confidence:.2f})")
        clear = "clear instrumental sections present" if self.vocal_contrast >= 0.12 \
            else "NO clearly instrumental section -- vocal readings are relative only"
        L.append(f"  vocal estimate  relative scale, contrast {self.vocal_contrast:.2f} ({clear})")
        L.append("")
        L.append(f"  PHRASE MAP   one column per {phrase} bars, scale 0-9")
        L.append("    bar     " + " ".join(f"{b:>4d}" for b in bars))
        L.append("    energy  " + " ".join(f"{d:>4d}" for d in e_d))
        L.append("    vocal   " + " ".join(f"{d:>4d}" for d in v_d))
        L.append("")
        L.append("  SECTIONS")
        for s in self.sections:
            L.append(f"    bars {s['start_bar']:>4d}-{s['end_bar']:<4d} "
                     f"{s['label']:<22s} energy {s['energy']:.2f}  vocal {s['vocal']:.2f}")
        L.append("")
        L.append("  MIX IN   phrase-aligned, low vocal, steady drums")
        if self.mix_in:
            for i, w in enumerate(self.mix_in):
                mark = "   <- best" if i == 0 else ""
                L.append(f"    bars {w['start_bar']:>4d}-{w['end_bar']:<4d} "
                         f"{w['bars']:>2d} bars   vocal {w['vocal']:.2f}  "
                         f"energy {w['energy']:.2f}{mark}")
        else:
            L.append("    none found -- no phrase-aligned span with low vocal and steady drums")
        L.append("")
        L.append("  MIX OUT")
        if self.mix_out:
            for i, w in enumerate(self.mix_out):
                mark = "   <- best" if i == 0 else ""
                L.append(f"    bars {w['start_bar']:>4d}-{w['end_bar']:<4d} "
                         f"{w['bars']:>2d} bars   vocal {w['vocal']:.2f}  "
                         f"energy {w['energy']:.2f}{mark}")
        else:
            L.append("    none found")
        return "\n".join(L)


def _fingerprint(mono: np.ndarray, sr: int, grid: BarGrid) -> list[float]:
    """A compact signature of the backing track, for riddim-family matching.

    Median chroma plus the averaged sub-beat onset profile. Two cuts over the
    same riddim share the identical instrumental, so both halves match closely;
    two different songs at the same tempo and key do not match the onset half.
    """
    chroma = dsp.chroma_precise(mono, sr)
    ch = np.median(chroma, axis=1) if chroma.shape[1] else np.zeros(12)
    mag = dsp.stft(mono)
    _, per_band = dsp.onset_envelope(mag, sr)
    bf = np.clip(np.round(grid.beat_times * sr / dsp.HOP).astype(int),
                 0, max(mag.shape[1] - 1, 0))
    prof = dsp.subbeat_profile(per_band, bf)
    n = (len(prof) - grid.phase) // grid.meter
    if n >= 1:
        bars = prof[grid.phase:grid.phase + n * grid.meter]
        bars = bars.reshape(n, grid.meter, prof.shape[1], prof.shape[2]).mean(axis=0)
        onset = bars.reshape(-1)
    else:
        onset = np.zeros(grid.meter * prof.shape[1] * prof.shape[2])
    ch = ch / (np.linalg.norm(ch) + 1e-9)
    onset = onset / (np.linalg.norm(onset) + 1e-9)
    return np.concatenate([ch, onset]).tolist()


def profile_track(path: str | Path, genre: str = "auto",
                  bpm_hint: float | None = None,
                  phrase_bars: int = 8) -> TrackProfile:
    """Analyse one file end to end."""
    import soundfile as sf

    path = Path(path)
    audio, sr = sf.read(str(path), dtype="float64", always_2d=True)
    mono = dsp.to_mono(audio)

    grid = detect_grid(audio, sr, genre=genre, bpm_hint=bpm_hint)
    key = detect_key(audio, sr)
    st = structure.analyse(audio, sr, grid, phrase_bars=phrase_bars)

    if len(grid.beat_times) > 8:
        iois = np.diff(grid.beat_times)
        half = len(iois) // 2
        drift = (float(np.median(iois[:half])) / float(np.median(iois[half:])) - 1.0) * 100.0
    else:
        drift = 0.0

    return TrackProfile(
        path=str(path), name=path.stem,
        duration_s=len(audio) / sr, n_bars=grid.n_bars, meter=grid.meter,
        bpm=round(grid.bpm, 2), tempo_drift_pct=round(drift, 2),
        tempo_band=tempo_band(grid.bpm),
        key_name=key.name, camelot=key.camelot,
        key_confidence=round(key.confidence, 3),
        drum_pattern=grid.pattern,
        first_downbeat_s=round(float(grid.downbeat_times[0]), 3) if grid.n_bars else 0.0,
        phase_confidence=round(grid.phase_confidence, 3),
        vocal_contrast=round(st.vocal_contrast, 3),
        sections=[{"start_bar": s.start_bar + 1, "end_bar": s.end_bar,
                   "bars": s.bars, "label": s.label,
                   "energy": round(s.energy, 3), "vocal": round(s.vocal, 3)}
                  for s in st.sections],
        mix_in=[{"start_bar": w.start_bar + 1, "end_bar": w.end_bar, "bars": w.bars,
                 "vocal": round(w.vocal, 3), "energy": round(w.energy, 3),
                 "score": round(w.score, 3)} for w in st.mix_in],
        mix_out=[{"start_bar": w.start_bar + 1, "end_bar": w.end_bar, "bars": w.bars,
                  "vocal": round(w.vocal, 3), "energy": round(w.energy, 3),
                  "score": round(w.score, 3)} for w in st.mix_out],
        energy_by_bar=[round(float(x), 3) for x in st.energy_by_bar],
        vocal_by_bar=[round(float(x), 3) for x in st.vocal_by_bar],
        fingerprint=[round(float(x), 5) for x in _fingerprint(mono, sr, grid)],
    )
