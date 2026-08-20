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

## Two tools

### 1. Library analysis -- describe tracks for an AI

```bash
python -m djintro.cli analyze "Track.wav" --genre dancehall
python -m djintro.cli library ~/Music/soca --genre auto --top 20 --json pool.json
```

`analyze` prints a compact text digest of one track -- tempo, key in Camelot,
bar count, section table, a per-phrase energy/vocal map, and the phrase-aligned
windows where you can mix in and out. It is written to be pasted straight into
an AI: every position is in bars, every scalar is on a stated scale.

`library` profiles a folder and adds the pool view: tempo bands, Camelot
distribution, **riddim families** (tracks sharing an instrumental, detected by
fingerprint), and ranked transition candidates pairing one track's mix-out
window with another's mix-in window. It knows the 3:2 relation that takes a
dancehall set into soca (100 -> 150 BPM) and scores it as easy rather than as a
50% stretch.

`--json` writes the same data as strict JSON for programmatic use.

### 2. Intro generation

```bash
python -m djintro.cli intro track.wav --genre dancehall -o track.intro.wav --json verdict.json
```

`--genre` sets the BPM range and is the reliable way to settle tempo octave.
The two that matter here are `dancehall` (82–115) and `soca` (135–175); `reggae`
(60–95), `afrobeats`, `hiphop`, `house` and `auto` are also available.

Useful flags: `--build FLAT|HALF|QUARTER`, `--seed-bars 1|2|4|8`, `--cue-phrase
8|16|32`, `--body-start-bar N`, `--dry-run`, `--serato`.

Exit codes: `0` delivered, `1` abstained (nothing written), `2` unusable input.

## What the analysis measures, and how far to trust it

| Field | Method | Trust |
| --- | --- | --- |
| BPM, bar grid | ensemble beat tracking + self-similarity phase | high — 216/216 on the synthetic corpus |
| Key / Camelot | Shaath profiles over a semitone filterbank on the harmonic component | good; `key_confidence` below ~0.10 means treat it as a guess |
| Sections | bar-level self-similarity + checkerboard novelty, snapped to 4-bar lines | good for boundaries; labels are functional, not song-form guesses |
| Energy | K-weighted level per bar | high |
| **Vocal presence** | **estimate**, not separation — 300–3500 Hz harmonic energy plus 3–8 Hz syllable-rate modulation | **relative within a track only** |
| Riddim families | instrumental fingerprint (chroma + sub-beat onset profile) | high when the backing really is the same recording |
| Mode | seven diatonic modes fitted to the pitch-class profile | good; separates Aeolian / Dorian / Phrygian, which Camelot flattens to "minor" |
| Bass centre | autocorrelation pitch tracking on a low-passed signal | high for basslines, which are effectively monophonic |
| Backbeat | strongest mid-band accent among the four beat positions | high — correct on all test patterns |

## Why the compatibility model is not just Camelot

Camelot is printed because it is what you think in, but it is not the model.
It cannot express three things that decide whether a mix works:

- **Direction.** 8A→9A and 8A→7A are both "distance 1", but +1 is the dominant
  direction and lifts while −1 is subdominant and relaxes.
- **Mode.** Every mode collapses into major or minor. Dancehall riddims are often
  modal vamps where Aeolian vs Dorian vs Phrygian is exactly the information that
  decides a clash.
- **The bass.** Two tracks can be neighbours on the wheel with basslines a tritone
  apart. Dissonance is least forgiving in the bass, so the bass interval carries
  the most weight (0.45) in the harmonic score.

Harmony is scored from actual pitch content — bass interval, Huron's empirical
dyadic consonance over the combined pitch-class set, and common tones.

And rhythm is scored separately, because Camelot has no opinion about it at all.
**The key fact for your two genres:** dancehall puts its snare on beat 3
(half-time feel), soca puts it on 2 and 4. Beatmatched, those backbeats never
coincide — so the tool flags the conflict and tells you to cut on the phrase line
or blend only where one track's snare drops out, rather than pretending a
same-key pair will blend.

The vocal figure is the one to be careful with. Without source separation it is a
proxy, and it is contrast-stretched within each track — so it reliably tells you
which parts of a track are *least* vocal, which is what mix windows need, but it
cannot assert a bar is vocal-free. `vocal_contrast` reports how much dynamic range
there was; below 0.12 the digest says outright that no clearly instrumental
section was found.

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
