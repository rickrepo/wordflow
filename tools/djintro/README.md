# djintro — Phase 1

Generates a beat-accurate 8-bar DJ intro and splices it onto the original track,
then **verifies its own output** and abstains rather than shipping something broken.

Full design: [`docs/dj-intro-engine/DESIGN.md`](../../docs/dj-intro-engine/DESIGN.md)

Phase 1 implements the **floor** of the fallback ladder — tier L4, drums-only —
plus the grid detection, render layer, verifier and Serato cue writing that every
higher tier will reuse. The floor is built first on purpose: it is the least
ambitious strategy and the most robust, so there is always a working end-to-end
system to verify the better tiers against.

## Install

```bash
pip install numpy scipy soundfile mutagen pytest
```

No demucs, madmom or GPU required for Phase 1. The percussive component comes from
median-filter HPSS, which stands in for a drum stem well enough to build and test
the whole loop.

## Use

```bash
python -m djintro.cli track.wav --genre reggae -o track.intro.wav --json verdict.json
```

`--genre` sets the BPM range and is the reliable way to settle tempo octave:
`reggae` 60–95, `dancehall` 82–115, `soca` 135–175, plus `afrobeats`, `hiphop`,
`house`, `auto`.

Useful flags: `--build FLAT|HALF|QUARTER`, `--seed-bars 1|2|4|8`, `--cue-phrase
8|16|32`, `--body-start-bar N`, `--dry-run`, `--serato`.

Exit codes: `0` delivered, `1` abstained (nothing written), `2` unusable input.

## What is genre-specific here

Two assumptions that general beat trackers ship with are false for reggae and
dancehall, and both are handled explicitly:

- **The kick does not mark beat 1.** Reggae one drop leaves beat 1 empty and puts
  kick and snare on beat 3. Scoring grid phase on "low-band energy on beat 1"
  scored 0/6 patterns on the test corpus. Phase is instead decided by boundary
  novelty, harmonic rhythm, and correlation against a library of real bar
  patterns including the one-drop family.
- **The skank can capture the beat lattice.** The off-beat chop is often the
  loudest regular event in the track, and a broadband tracker locks to it — every
  beat half a beat late. Resolved with a kick-dominance envelope (low-band flux
  weighted by low-band spectral dominance), measured at 18:1 discrimination on one
  drop versus 1.17:1 for plain low-band flux.

Build staging also adapts: a band-staged build (kick alone for four bars) leaves
seconds of dead air on one-drop material, so when kick density is low the build is
staged by level instead.

## Serato

`--serato` writes `Serato Markers2` and `Serato BeatGrid` GEOB frames (MP3 only).
Cue layout: slot 1 at the top, slot 2 on the drop, slots 3–8 on phrase boundaries
walking forward from the drop, coloured by phrase depth. Anchored to the drop so
the layout is identical across tracks on the same riddim.

**Verify before trusting it.** Serato's tag format is not documented by Serato;
this follows the community reverse-engineering. It round-trips through its own
parser — that proves internal consistency, not that Serato reads it. Test on a
copy of one file first. Cue positions are always written to the JSON sidecar,
which is the authoritative record until you have confirmed the tags load.

## Tests

```bash
python -m pytest tests -q
```

Tests run against synthetic audio with ground-truth downbeats, so grid accuracy is
a measurement rather than a listen. **This validates the logic, not real-world
accuracy** — synthetic drums are cleaner and more regular than records. The real
corpus described in the design doc is what would establish accuracy.
