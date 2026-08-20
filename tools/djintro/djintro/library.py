"""Library pool: riddim families and ranked transition candidates.

Produces the second thing an AI needs after per-track profiles -- which tracks
can follow which, and at what point in each. Everything is stated explicitly so
a model with no audio access can reason about it.
"""
from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path

import numpy as np

from .key import camelot_distance
from .profile import TrackProfile, profile_track

AUDIO_SUFFIXES = {".wav", ".aiff", ".aif", ".flac", ".mp3", ".ogg", ".m4a"}

# Tempo change a DJ will actually accept. Beyond ~6% the pitch shift is audible
# on vocals; beyond ~8% it sounds wrong even with key-lock.
TEMPO_EASY_PCT = 3.0
TEMPO_OK_PCT = 6.0
TEMPO_STRETCH_PCT = 8.0

# Two tempi in a 3:2 or 2:1 relationship mix without any stretch at all -- the
# faster track's bar lines up with the slower one's half-bar. This is how a
# dancehall set gets into soca: 100 -> 150 is exactly 3:2.
TEMPO_RATIOS = ((1.5, "3:2 -- dancehall half-time into soca"),
                (2.0, "2:1 double time"),
                (2.0 / 3.0, "2:3 -- soca into dancehall"),
                (0.5, "1:2 half time"))

RIDDIM_SIMILARITY = 0.90


@dataclass
class Transition:
    from_track: str
    to_track: str
    score: float
    key_from: str
    key_to: str
    key_distance: int
    key_note: str
    bpm_from: float
    bpm_to: float
    tempo_pct: float
    tempo_note: str
    out_window: dict | None = None
    in_window: dict | None = None
    energy_change: float = 0.0


@dataclass
class RiddimFamily:
    members: list[str]
    similarity: float


@dataclass
class Library:
    profiles: list[TrackProfile] = field(default_factory=list)
    families: list[RiddimFamily] = field(default_factory=list)
    transitions: list[Transition] = field(default_factory=list)


def _tempo_relation(a: float, b: float) -> tuple[float, str, float]:
    """Returns (percent change, description, penalty 0-1). Lower penalty better."""
    pct = (b - a) / a * 100.0
    if abs(pct) <= TEMPO_EASY_PCT:
        return pct, "easy", 0.0
    if abs(pct) <= TEMPO_OK_PCT:
        return pct, "needs a nudge", 0.25
    if abs(pct) <= TEMPO_STRETCH_PCT:
        return pct, "big stretch", 0.55
    for ratio, note in TEMPO_RATIOS:
        target = a * ratio
        r_pct = (b - target) / target * 100.0
        if abs(r_pct) <= TEMPO_OK_PCT:
            return pct, f"{note} ({r_pct:+.1f}% from exact)", 0.2
    return pct, "incompatible", 1.0


def score_transition(a: TrackProfile, b: TrackProfile) -> Transition | None:
    """Score A -> B. Returns None when the pair is not worth listing."""
    k_dist, k_note = camelot_distance(a.camelot, b.camelot)
    pct, t_note, t_penalty = _tempo_relation(a.bpm, b.bpm)
    if t_penalty >= 1.0 or k_dist >= 3:
        return None

    out_w = a.mix_out[0] if a.mix_out else None
    in_w = b.mix_in[0] if b.mix_in else None

    key_score = {0: 1.0, 1: 0.85, 2: 0.55}.get(k_dist, 0.0)
    tempo_score = 1.0 - t_penalty
    struct_score = 0.0
    if out_w and in_w:
        struct_score = 1.0 - (out_w["vocal"] + in_w["vocal"]) / 2.0
        struct_score *= min(min(out_w["bars"], in_w["bars"]) / 8.0, 1.0)
    elif out_w or in_w:
        struct_score = 0.3

    # A set should generally climb. Reward equal-or-rising energy, penalise a
    # big drop, but do not forbid it -- taking the energy down is a real move.
    e_from = out_w["energy"] if out_w else float(np.mean(a.energy_by_bar or [0.5]))
    e_to = in_w["energy"] if in_w else float(np.mean(b.energy_by_bar or [0.5]))
    e_change = e_to - e_from
    energy_score = 1.0 if e_change >= -0.1 else max(0.0, 1.0 + (e_change + 0.1) * 2)

    # Key confidence gates how much the key term is trusted.
    trust = min(a.key_confidence, b.key_confidence)
    if trust < 0.08:
        key_score = 0.5 + key_score * 0.5

    score = (0.34 * key_score + 0.30 * tempo_score
             + 0.26 * struct_score + 0.10 * energy_score)
    return Transition(
        from_track=a.name, to_track=b.name, score=round(float(score), 3),
        key_from=a.camelot, key_to=b.camelot, key_distance=k_dist, key_note=k_note,
        bpm_from=a.bpm, bpm_to=b.bpm, tempo_pct=round(pct, 2), tempo_note=t_note,
        out_window=out_w, in_window=in_w, energy_change=round(float(e_change), 3))


def find_riddim_families(profiles: list[TrackProfile]) -> list[RiddimFamily]:
    """Group tracks that share an instrumental.

    Cheap single-link clustering on the fingerprint. Same riddim means the same
    recording underneath, so the similarity is very high and the threshold does
    not need to be subtle.
    """
    n = len(profiles)
    fps = [np.asarray(p.fingerprint) for p in profiles]
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    sims: dict[tuple[int, int], float] = {}
    for i in range(n):
        for j in range(i + 1, n):
            if fps[i].size == 0 or fps[j].size != fps[i].size:
                continue
            if abs(profiles[i].bpm - profiles[j].bpm) / max(profiles[i].bpm, 1) > 0.03:
                continue
            s = float(fps[i] @ fps[j] / (np.linalg.norm(fps[i]) * np.linalg.norm(fps[j]) + 1e-9))
            if s >= RIDDIM_SIMILARITY:
                sims[(i, j)] = s
                parent[find(i)] = find(j)

    groups: dict[int, list[int]] = defaultdict(list)
    for i in range(n):
        groups[find(i)].append(i)
    out = []
    for members in groups.values():
        if len(members) < 2:
            continue
        rel = [s for (i, j), s in sims.items() if i in members and j in members]
        out.append(RiddimFamily([profiles[i].name for i in sorted(members)],
                                round(float(np.mean(rel)), 3) if rel else 0.0))
    return out


def build(paths: list[Path], genre: str = "auto", top: int = 40,
          on_track=None) -> Library:
    profiles = []
    for p in paths:
        if on_track:
            on_track(p)
        try:
            profiles.append(profile_track(p, genre=genre))
        except Exception as exc:  # noqa: BLE001 - one bad file must not kill a scan
            print(f"  ! skipped {p.name}: {exc}")
    families = find_riddim_families(profiles)
    trans = []
    for a in profiles:
        for b in profiles:
            if a.name == b.name:
                continue
            t = score_transition(a, b)
            if t:
                trans.append(t)
    trans.sort(key=lambda t: -t.score)
    return Library(profiles, families, trans[:top])


def scan(folder: Path) -> list[Path]:
    return sorted(p for p in folder.rglob("*")
                  if p.suffix.lower() in AUDIO_SUFFIXES and p.is_file())


def to_text(lib: Library, top: int = 20) -> str:
    L = [f"LIBRARY  {len(lib.profiles)} tracks", ""]

    bands = defaultdict(list)
    for p in lib.profiles:
        bands[p.tempo_band].append(p)
    L.append("TEMPO BANDS")
    for band, ps in sorted(bands.items()):
        bpms = sorted(round(p.bpm) for p in ps)
        L.append(f"  {band:<10s} {len(ps):>3d} tracks   "
                 f"{min(bpms)}-{max(bpms)} BPM")
    L.append("")

    by_key = defaultdict(list)
    for p in lib.profiles:
        by_key[p.camelot].append(p.name)
    L.append("CAMELOT DISTRIBUTION")
    for code in sorted(by_key, key=lambda c: (int(c[:-1]), c[-1])):
        L.append(f"  {code:<4s} {len(by_key[code]):>2d}   " + ", ".join(by_key[code][:6])
                 + (" ..." if len(by_key[code]) > 6 else ""))
    L.append("")

    L.append("RIDDIM FAMILIES   tracks sharing an instrumental")
    if lib.families:
        for i, f in enumerate(lib.families, 1):
            L.append(f"  family {i}  similarity {f.similarity:.2f}   " + ", ".join(f.members))
    else:
        L.append("  none detected")
    L.append("")

    L.append(f"TRANSITIONS   top {min(top, len(lib.transitions))} of "
             f"{len(lib.transitions)}, ranked")
    for i, t in enumerate(lib.transitions[:top], 1):
        L.append(f"  {i:>2d}. {t.from_track}  ->  {t.to_track}      score {t.score:.2f}")
        L.append(f"        key    {t.key_from} -> {t.key_to}   ({t.key_note})")
        L.append(f"        tempo  {t.bpm_from:.1f} -> {t.bpm_to:.1f} BPM  "
                 f"({t.tempo_pct:+.1f}%, {t.tempo_note})")
        if t.out_window:
            w = t.out_window
            L.append(f"        out    bars {w['start_bar']}-{w['end_bar']} "
                     f"({w['bars']} bars, vocal {w['vocal']:.2f})")
        else:
            L.append("        out    no clean outro window found")
        if t.in_window:
            w = t.in_window
            L.append(f"        in     bars {w['start_bar']}-{w['end_bar']} "
                     f"({w['bars']} bars, vocal {w['vocal']:.2f})")
        else:
            L.append("        in     no clean intro window found")
        L.append(f"        energy {t.energy_change:+.2f}")
    return "\n".join(L)


def to_json(lib: Library) -> str:
    return json.dumps({
        "tracks": [asdict(p) for p in lib.profiles],
        "riddim_families": [asdict(f) for f in lib.families],
        "transitions": [asdict(t) for t in lib.transitions],
    }, indent=2)
