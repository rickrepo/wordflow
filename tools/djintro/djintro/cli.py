"""Command line entry point."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

from . import library, phrase, profile, serato
from .grid import GENRE_BPM, detect_grid
from .intro import build_drums_intro
from .verify import Outcome, verify


def _parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(
        prog="djintro",
        description="Verified 8-bar DJ intros, and library analysis for planning mixes.")
    sub = root.add_subparsers(dest="command", required=True)

    an = sub.add_parser("analyze", help="describe one track as text/JSON for an AI")
    an.add_argument("input", type=Path)
    an.add_argument("--genre", default="auto", choices=sorted(GENRE_BPM))
    an.add_argument("--phrase", type=int, default=8, choices=(4, 8, 16))
    an.add_argument("--json", type=Path)
    an.set_defaults(func=cmd_analyze)

    lb = sub.add_parser("library", help="profile a folder and rank transitions")
    lb.add_argument("folder", type=Path)
    lb.add_argument("--genre", default="auto", choices=sorted(GENRE_BPM))
    lb.add_argument("--top", type=int, default=20, help="transitions to print")
    lb.add_argument("--json", type=Path)
    lb.add_argument("--text", type=Path, help="write the digest here as well as stdout")
    lb.set_defaults(func=cmd_library)

    p = sub.add_parser("intro", help="generate a verified 8-bar intro")
    p.set_defaults(func=cmd_intro)
    p.add_argument("input", type=Path)
    p.add_argument("-o", "--output", type=Path, help="output audio (default: <input>.intro.wav)")
    p.add_argument("--genre", default="auto", choices=sorted(GENRE_BPM),
                   help="sets the BPM range; settles tempo octave reliably (default: auto)")
    p.add_argument("--bpm", type=float, help="override tempo detection entirely")
    p.add_argument("--intro-bars", type=int, default=8)
    p.add_argument("--seed-bars", type=int, default=4, choices=(1, 2, 4, 8))
    p.add_argument("--seed-bar", type=int, help="force the source bar for the loop seed")
    p.add_argument("--body-start-bar", type=int, default=0,
                   help="bar of the original where the body should enter")
    p.add_argument("--build", default="HALF", choices=("FLAT", "HALF", "QUARTER"))
    p.add_argument("--serato", action="store_true",
                   help="write Serato hot cues and beatgrid into the output (MP3 only)")
    p.add_argument("--cue-phrase", type=int, default=16, choices=(8, 16, 32),
                   help="bars between phrase cues after the drop (default: 16)")
    p.add_argument("--dry-run", action="store_true",
                   help="analyse, render and verify, but write nothing")
    p.add_argument("--json", type=Path, help="write the verdict sidecar here")
    p.add_argument("-q", "--quiet", action="store_true")
    return root


def cmd_analyze(args) -> int:
    prof = profile.profile_track(args.input, genre=args.genre, phrase_bars=args.phrase)
    print(prof.to_text(phrase=args.phrase))
    if args.json:
        args.json.write_text(prof.to_json())
        print(f"\nwrote {args.json}")
    return 0


def cmd_library(args) -> int:
    paths = library.scan(args.folder)
    if not paths:
        print(f"no audio files under {args.folder}", file=sys.stderr)
        return 2
    print(f"profiling {len(paths)} tracks...", file=sys.stderr)
    lib = library.build(paths, genre=args.genre,
                        on_track=lambda p: print(f"  {p.name}", file=sys.stderr))
    text = library.to_text(lib, top=args.top)
    print(text)
    if args.text:
        args.text.write_text(text)
    if args.json:
        args.json.write_text(library.to_json(lib))
    return 0


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    return args.func(args)


def cmd_intro(args) -> int:
    say = (lambda *a: None) if args.quiet else (lambda *a: print(*a))

    audio, sr = sf.read(str(args.input), dtype="float64", always_2d=True)
    say(f"{args.input.name}: {len(audio) / sr:.1f}s @ {sr} Hz, {audio.shape[1]}ch")

    grid = detect_grid(audio, sr, genre=args.genre, bpm_hint=args.bpm)
    if grid.n_bars < args.intro_bars:
        print(f"abstain: only {grid.n_bars} bars detected", file=sys.stderr)
        return 2
    say(f"grid: {grid.bpm:.1f} BPM, {grid.meter}/4, phase {grid.phase}, "
        f"pattern {grid.pattern}, confidence {grid.phase_confidence:.2f}, {grid.n_bars} bars")
    if grid.phase_confidence < 0.15:
        say("  ! low phase confidence -- the downbeat is ambiguous. Check the result, "
            "or re-run with --genre set.")

    result = build_drums_intro(audio, sr, grid, body_start_bar=args.body_start_bar,
                               seed_bars=args.seed_bars, build=args.build,
                               target_bars=args.intro_bars, seed_bar=args.seed_bar)
    say(f"intro: {result.intro_duration:.2f}s from bar {result.seed_bar}, "
        f"build {result.build}, gain {result.gain_applied_db:+.2f} dB")

    verdict = verify(result, genre=args.genre)
    say("")
    for g in verdict.gates:
        say(" ", g)
    say("")
    say(f"verdict: {verdict.outcome.value}")
    for n in verdict.notes:
        say(f"  - {n}")

    sidecar = {
        "input": str(args.input),
        "grid": {"bpm": grid.bpm, "meter": grid.meter, "phase": grid.phase,
                 "phase_confidence": grid.phase_confidence, "pattern": grid.pattern,
                 "n_bars": grid.n_bars},
        "intro": {"bars": result.intro_bars, "seconds": result.intro_duration,
                  "seed_bar": result.seed_bar, "seed_bars": result.seed_bars,
                  "strategy": result.strategy, "build": result.build,
                  "gain_db": result.gain_applied_db},
        "verdict": {"outcome": verdict.outcome.value, "notes": verdict.notes,
                    "gates": [{"gate": g.gate, "name": g.name, "passed": g.passed,
                               "measured": g.measured, "threshold": g.threshold,
                               "detail": g.detail} for g in verdict.gates]},
    }

    if verdict.outcome is Outcome.ABSTAIN:
        print("abstained -- nothing written. Blocking gates: "
              + ", ".join(f"{g.gate} {g.name}" for g in verdict.failures), file=sys.stderr)
        if args.json:
            args.json.write_text(json.dumps(sidecar, indent=2))
        return 1

    out_path = args.output or args.input.with_suffix(".intro.wav")
    cues = phrase.phrase_cue_layout(grid, intro_bars=result.intro_bars,
                                    phrase_bars=args.cue_phrase,
                                    body_start_bar=args.body_start_bar,
                                    total_bars=grid.n_bars)
    sidecar["cues"] = [{"slot": c.index + 1, "ms": c.position_ms, "name": c.name,
                        "bar": c.bar, "color": "#%02X%02X%02X" % c.color} for c in cues]

    say("")
    say(f"hot cues ({args.cue_phrase}-bar phrases):")
    for c in cues:
        say(f"   {c.index + 1}  bar {c.bar:<4d} {c.position_ms / 1000:8.3f}s  {c.name}")

    if args.dry_run:
        say("\ndry run -- nothing written")
        if args.json:
            args.json.write_text(json.dumps(sidecar, indent=2))
        return 0

    peak = float(np.abs(result.audio).max())
    sf.write(str(out_path), result.audio.astype(np.float32), sr, subtype="FLOAT")
    say(f"\nwrote {out_path} ({len(result.audio) / sr:.1f}s, peak {20 * np.log10(peak + 1e-12):.2f} dBFS)")

    if args.serato:
        if out_path.suffix.lower() != ".mp3":
            say("  ! Serato tags are ID3 frames; skipping for a non-MP3 output. "
                "The cue positions are in the JSON sidecar.")
        else:
            info = serato.write_tags(str(out_path), cues,
                                     beat_times=list(grid.beat_times), bpm=grid.bpm,
                                     meter=grid.meter, phase=grid.phase)
            say(f"  wrote Serato tags: {info}")

    if args.json:
        args.json.write_text(json.dumps(sidecar, indent=2))
        say(f"wrote {args.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
