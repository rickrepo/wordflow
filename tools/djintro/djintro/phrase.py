"""Phrase boundaries and hot-cue layout for phrase mixing.

A PHRASE is an 8/16/32-bar musical section -- the thing you mix on. It is not
the same as grid PHASE (which beat is beat 1); grid.py handles that. Keeping the
two words apart matters because this engine deals in both.

Cue layout is anchored to THE DROP, not to the top of the file. That is what
makes the layout transfer across a riddim: two tracks cut over the same riddim
get their cues on the same musical positions, so the muscle memory carries over
from one to the next.
"""
from __future__ import annotations

from dataclasses import dataclass

from .grid import BarGrid

# Serato DJ Pro exposes 8 hot cue slots.
MAX_HOT_CUES = 8

# Colours carry meaning rather than decoration: the drop is the one you must
# never miss, 32-bar boundaries are major section changes, 16 and 8 are
# progressively finer mix points.
CUE_COLORS = {
    "start": (0x99, 0x99, 0x99),
    "drop": (0xCC, 0x00, 0x00),
    "phrase32": (0x00, 0xAA, 0x44),
    "phrase16": (0x00, 0x77, 0xCC),
    "phrase8": (0x77, 0x44, 0xAA),
}


@dataclass(frozen=True)
class Cue:
    index: int           # 0-based Serato slot
    position_ms: int
    name: str
    color: tuple[int, int, int]
    bar: int             # bar number in the output, 1-based


def phrase_cue_layout(grid: BarGrid, intro_bars: int = 8, phrase_bars: int = 16,
                      intro_offset_s: float = 0.0, body_start_bar: int = 0,
                      max_cues: int = MAX_HOT_CUES,
                      total_bars: int | None = None) -> list[Cue]:
    """Lay out hot cues for phrase mixing on the finished, intro'd track.

    Slot 1 is the very top. Slot 2 is the drop -- where the original track
    enters, i.e. the downbeat of bar intro_bars+1. The rest walk forward in
    phrase_bars steps from the drop, so every cue after slot 2 sits on a phrase
    boundary of the ORIGINAL track rather than of the edit.
    """
    cues: list[Cue] = []
    bar_s = grid.bar_duration(body_start_bar)
    if bar_s <= 0:
        bar_s = 60.0 / max(grid.bpm, 1e-6) * grid.meter

    cues.append(Cue(0, 0, "Intro", CUE_COLORS["start"], 1))
    drop_s = intro_bars * bar_s
    cues.append(Cue(1, int(round(drop_s * 1000)), "Drop", CUE_COLORS["drop"],
                    intro_bars + 1))

    if total_bars is None:
        total_bars = grid.n_bars
    remaining = max_cues - len(cues)
    for k in range(1, remaining + 1):
        bar_offset = k * phrase_bars
        if body_start_bar + bar_offset >= total_bars:
            break
        t = drop_s + (grid.tick_to_time(body_start_bar + bar_offset)
                      - grid.tick_to_time(body_start_bar))
        if bar_offset % 32 == 0:
            color, tag = CUE_COLORS["phrase32"], "32"
        elif bar_offset % 16 == 0:
            color, tag = CUE_COLORS["phrase16"], "16"
        else:
            color, tag = CUE_COLORS["phrase8"], "8"
        cues.append(Cue(len(cues), int(round(t * 1000)),
                        f"+{bar_offset} ({tag})", color,
                        intro_bars + 1 + bar_offset))
    return cues
