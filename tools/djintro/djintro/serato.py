"""Serato DJ Pro tag writing: hot cues and beatgrid, as ID3 GEOB frames.

IMPORTANT -- read before trusting this in a set.

Serato's tag format is not documented by Serato. This implementation follows the
community reverse-engineering of the format (the same description the
`serato-tags` / Holzhaus work is based on). It round-trips through the parser in
this module, which proves internal consistency -- it does NOT prove Serato reads
it. Verify against a real Serato install on a COPY of a file before running it
over a library. Nothing here writes to a file it was not explicitly given.

Only MP3/ID3 is implemented. Serato also stores these tags in MP4 and FLAC/OGG
containers with different envelopes.
"""
from __future__ import annotations

import base64
import struct
from dataclasses import dataclass

from .phrase import Cue

MARKERS2_DESC = "Serato Markers2"
BEATGRID_DESC = "Serato BeatGrid"


def _entry(name: str, body: bytes) -> bytes:
    """One Markers2 entry: null-terminated name, uint32be length, body."""
    return name.encode("ascii") + b"\x00" + struct.pack(">I", len(body)) + body


def _cue_entry(cue: Cue) -> bytes:
    r, g, b = cue.color
    body = (b"\x00"
            + bytes([cue.index])
            + struct.pack(">I", int(cue.position_ms))
            + b"\x00"
            + bytes([r, g, b])
            + b"\x00\x00"
            + cue.name.encode("utf-8") + b"\x00")
    return _entry("CUE", body)


def build_markers2(cues: list[Cue], track_color: tuple[int, int, int] = (0xFF, 0xFF, 0xFF),
                   bpm_lock: bool = False) -> bytes:
    """Build the Serato Markers2 GEOB payload (base64 wrapped, as Serato writes it)."""
    payload = b"\x01\x01"
    payload += _entry("COLOR", b"\x00" + bytes(track_color))
    for cue in sorted(cues, key=lambda c: c.index):
        payload += _cue_entry(cue)
    payload += _entry("BPMLOCK", b"\x01" if bpm_lock else b"\x00")

    encoded = base64.b64encode(payload).decode("ascii")
    lines = [encoded[i:i + 72] for i in range(0, len(encoded), 72)]
    return b"\x01\x01" + "\n".join(lines).encode("ascii") + b"\x00"


def build_beatgrid(beat_times: list[float], bpm: float, meter: int = 4,
                   phase: int = 0) -> bytes:
    """Build the Serato BeatGrid GEOB payload.

    Two markers: a non-terminal anchor on the first downbeat carrying the number
    of beats until the terminal marker, and a terminal marker carrying the BPM.
    Anchoring on a DOWNBEAT rather than on the first beat is what makes Serato's
    bar display line up with the phrasing -- which is the entire point here.
    """
    downbeats = beat_times[phase::meter]
    if len(downbeats) < 2:
        raise ValueError("need at least two downbeats to write a beatgrid")
    first = float(downbeats[0])
    last = float(downbeats[-1])
    n_beats = (len(downbeats) - 1) * meter

    data = b"\x01\x00" + struct.pack(">I", 2)
    data += struct.pack(">f", first) + struct.pack(">I", n_beats)
    data += struct.pack(">f", last) + struct.pack(">f", float(bpm))
    data += b"\x00"
    return data


@dataclass
class ParsedCue:
    index: int
    position_ms: int
    name: str
    color: tuple[int, int, int]


def parse_markers2(data: bytes) -> list[ParsedCue]:
    """Parse a Markers2 payload back out. Used to round-trip-test the writer."""
    if not data.startswith(b"\x01\x01"):
        raise ValueError("bad Markers2 header")
    b64 = data[2:].rstrip(b"\x00").replace(b"\n", b"")
    payload = base64.b64decode(b64 + b"=" * (-len(b64) % 4))
    if not payload.startswith(b"\x01\x01"):
        raise ValueError("bad Markers2 payload header")
    pos, out = 2, []
    while pos < len(payload):
        end = payload.find(b"\x00", pos)
        if end < 0 or end + 5 > len(payload):
            break
        name = payload[pos:end].decode("ascii", "replace")
        (length,) = struct.unpack(">I", payload[end + 1:end + 5])
        body = payload[end + 5:end + 5 + length]
        pos = end + 5 + length
        if name == "CUE" and len(body) >= 12:
            index = body[1]
            (ms,) = struct.unpack(">I", body[2:6])
            color = (body[7], body[8], body[9])
            cname = body[12:].split(b"\x00")[0].decode("utf-8", "replace")
            out.append(ParsedCue(index, ms, cname, color))
        if not name:
            break
    return out


def parse_beatgrid(data: bytes) -> tuple[float, int, float, float]:
    """Parse a BeatGrid payload -> (first_s, n_beats, last_s, bpm)."""
    if not data.startswith(b"\x01\x00"):
        raise ValueError("bad BeatGrid header")
    (n,) = struct.unpack(">I", data[2:6])
    if n != 2:
        raise ValueError(f"expected 2 markers, got {n}")
    first, beats = struct.unpack(">fI", data[6:14])
    last, bpm = struct.unpack(">ff", data[14:22])
    return first, beats, last, bpm


def write_tags(path: str, cues: list[Cue], beat_times: list[float] | None = None,
               bpm: float | None = None, meter: int = 4, phase: int = 0,
               dry_run: bool = False) -> dict:
    """Write Serato GEOB frames into an MP3's ID3 tag.

    Returns a summary of what was written. With dry_run, builds and validates the
    payloads without touching the file -- use it first.
    """
    from mutagen.id3 import ID3, GEOB, ID3NoHeaderError

    markers = build_markers2(cues)
    grid = (build_beatgrid(list(beat_times), bpm, meter, phase)
            if beat_times is not None and bpm else None)

    # Prove the payloads parse before going anywhere near the file.
    parsed = parse_markers2(markers)
    if len(parsed) != len(cues):
        raise ValueError(f"markers2 round-trip lost cues: {len(parsed)} != {len(cues)}")
    if grid is not None:
        parse_beatgrid(grid)

    summary = {"path": path, "cues": len(cues), "beatgrid": grid is not None,
               "dry_run": dry_run}
    if dry_run:
        return summary

    try:
        tag = ID3(path)
    except ID3NoHeaderError:
        tag = ID3()
    tag.delall("GEOB")
    tag.add(GEOB(encoding=0, mime="application/octet-stream", desc=MARKERS2_DESC,
                 filename="", data=markers))
    if grid is not None:
        tag.add(GEOB(encoding=0, mime="application/octet-stream", desc=BEATGRID_DESC,
                     filename="", data=grid))
    tag.save(path, v2_version=4)
    return summary
