# The Verified Intro Engine

**Technical design — automatic 8-bar DJ intro generation**

A system that prepends a beat-accurate, vocal-free 8-bar intro to any track, and is
structurally incapable of shipping a bad one, because it re-analyzes its own output
and abstains when it cannot prove the result is correct.

**Terminology.** Two words that sound alike mean different things throughout this
document, and the engine deals in both:

- **Grid phase** — which beat of the bar is beat 1. A detection problem.
- **Phrase** — an 8/16/32-bar musical section, the thing you mix on. Derived from
  the grid, and what the hot-cue layout is built around.

**Target material.** This design is aimed at soca, dancehall and reggae, including
heavy riddim reuse. That is not a cosmetic note: it invalidates two assumptions
that general-purpose beat trackers rest on, and it opens a source of intro
material (§05a) that no general-purpose tool can use.

---

## 00 — Premise: where "100% of the time" actually lives

The honest constraint first, because the whole architecture is built around it:
**no fully automatic system can produce a great intro for 100% of arbitrary audio.**
Some tracks have no stable meter. Some have no drums. Some have vocals in every bar.
A tool that claims otherwise is a tool that lies to you on the tracks it cannot handle,
and finding that out mid-set is the worst possible time.

But there are two different numbers hiding inside "works every time," and only one
of them has to be perfect:

| Number | Target | Meaning |
| --- | --- | --- |
| **Correctness rate** | **100%** | Of intros delivered, the fraction that are beat-accurate, click-free, vocal-free. Enforced structurally, not hoped for. |
| **Delivery rate** | **>99%** | Of tracks fed in, the fraction that get an intro at all. High because the fallback floor needs almost nothing from the source. |
| **Silent failures** | **0** | Every run ends in deliver, deliver-with-note, or abstain-with-reason. There is no fourth outcome. |

Getting correctness to 100% is not a matter of better detectors. It is a matter of
*closing the loop*. Every DJ-intro tool that exists is open-loop: detect the beat, cut
on a downbeat, export, hope. Errors from the beat tracker propagate straight into the
file and nothing ever checks. Reliability is capped by the weakest model in the chain.

> **The one idea everything else follows from**
>
> The engine renders its candidate intro to audio, then **runs the full analysis stack
> again on that rendered audio** and requires it to measure as exactly 8 bars at a
> continuous tempo with zero voiced frames. A wrong beatgrid cannot survive this: if
> the grid was off, the render does not measure as 8 bars, and the candidate dies
> before anyone hears it.

That single move converts an unbounded class of silent failures into a bounded,
detectable one. What remains is a smaller question — what do you do when nothing
passes? — answered by a ladder of five strategies whose bottom rung works on
essentially any track with a pulse.

---

## 01 — Four departures from the standard pipeline

### A. The grid comes from the music's repetition, not from a downbeat model

Beat trackers are good at *beats* and mediocre at *which beat is one*. An
off-by-one-beat intro is unusable, and it is the single largest source of catastrophic
failure in this problem. So don't ask a model. Ask the song.

Music repeats at the bar and at the 4- and 8-bar scale. Build a beat-synchronous
self-similarity matrix, then test each candidate phase phi in {0,1,2,3}: the correct
phase is the one where similarity at lag 4 and lag 8 bars is sharpest. This recovers
the downbeat from *structure*, entirely independently of any downbeat classifier —
which means the two can be cross-checked, and their disagreement becomes a measured
confidence number instead of an invisible coin flip.

### B. Audition hundreds of candidates; don't make one greedy decision

A conventional pipeline picks a source region, picks a splice point, renders. This one
enumerates every downbeat-aligned option across all five strategies (typically 200–800
candidates) as cheap declarative plans, prunes to a dozen on a features-only prior,
renders those, and scores the *rendered audio*. Any upstream error becomes a
downstream score. The best candidate wins on measurement, not on pipeline order.

### C. Verify-or-abstain, with a fallback ladder

Eight hard gates, all computed on the output file. A candidate that fails any gate is
rejected outright — no partial credit, no "close enough." Ship the highest-tier
candidate that clears everything. If none clears, abstain and name the blocking gate.

### D. Grid-relative rendering with transient-aware splicing

Nothing is addressed in seconds. Every position is `(bar, beat, tick)` resolved against
a piecewise-linear map built from real detected beat times, so a live band drifting
from 118 to 121 BPM is followed exactly rather than approximated by a constant grid.
Splices land in onset-envelope *valleys*, get micro-aligned by cross-correlation, and
cross-fade at matched zero crossings.

---

## 02 — Architecture

Stages 1–3 run once per track and cache by content hash. Stages 4–6 are the loop:
plan cheaply, render a shortlist, verify, and either deliver or drop a rung down the
ladder and try again.

| Stage | Does |
| --- | --- |
| 1 · Decode | ffmpeg to float32 at native rate. Gapless handling, no re-encode anywhere in the pipeline. |
| 2 · Consensus grid | Tracker ensemble + self-similarity phase + structural octave check -> BarGrid with confidence. |
| 3 · Stems & features | Demucs separation, then one per-bar feature table every later stage reads from. |
| 4 · Enumerate | All strategies x all aligned windows x all build patterns, as plans. Prune to 12 on a cheap prior. |
| 5 · Render | Grid-relative timeline -> audio. Transient-aware splices, spectral seam matching, LUFS match. |
| 6 · Verify | Re-analyze the render. Eight hard gates + soft score -> deliver, note, or abstain. |

Stage 6 feeds back into stage 4: a failed shortlist drops the strategy tier and
re-enumerates rather than lowering a threshold.

```
djintro/
  analysis/
    decode.py      # ffmpeg -> float32, sample-exact, gapless
    grid.py        # ensemble beats + SSM phase -> BarGrid
    structure.py   # allin1 sections (also cross-checks the grid)
    stems.py       # demucs htdemucs_ft, content-hash cached
    features.py    # the per-bar feature table
  plan/
    candidates.py  # declarative enumeration + cheap prior
    strategies/    # lift / loop / stem / drums / synth
  render/
    timeline.py    # (bar,beat,tick) -> samples; Clip graph
    splice.py      # valley search, micro-align, zero-cross xfade
    seam.py        # spectral seam match + reverb pre-roll
  verify/
    gates.py       # G1-G8, hard, on rendered audio
    score.py       # soft ranking among survivors
  export/
    audio.py  cues.py   # WAV/AIFF + Rekordbox / Serato / Traktor
  cli.py
```

---

## 03 — Stage 2: the consensus grid

Everything downstream is worthless if this is wrong, so it gets four independent
sources of evidence and a confidence number that honestly reflects their disagreement.

**Step 1 — Ensemble beat candidates.** Run three trackers with genuinely different
inductive biases: `madmom` RNN+DBN, `BeatThis`, and `allin1`'s joint
beat/downbeat/structure model. Cluster their beat times with a +/-35 ms tolerance. A
beat all three agree on carries `agreement = 1.0`; one only a single tracker found
carries 0.33. Keep the fused sequence *and* the per-beat agreement.

**Step 2 — Tempo octave resolution, settled by structure.** Half/double-time errors are
the second-worst failure: at 87 vs. 174 BPM, "8 bars" means two different things. Tempo
priors are a weak tiebreaker. Structure is a strong one — section boundaries almost
always fall on downbeats and section lengths are almost always multiples of 4 bars. For
each octave hypothesis, measure how cleanly the allin1 segment boundaries land on
implied bar starts and how close segment lengths sit to multiples of 4 bars. The octave
that makes the song's own structure tidy is the right one.

**Step 2b — Is the lattice on the beat, or on the off-beat?**

Before asking which beat is 1, confirm the beats are beats. Reggae and dancehall
put a loud, rigidly regular chop — the **skank** — on the off-beats. It is often
the strongest periodic event in the track, so a broadband beat tracker locks onto
it and every "beat" lands on an "and", half a beat late, for the whole track.
Measured on synthetic one-drop material, a broadband onset envelope prefers the
off-beat lattice by 1.8:1.

The pulse is carried by the low end: kicks land on beats, skanks do not. But plain
low-band flux is not enough either — a skank has a hard enough attack to put click
energy below 100 Hz, and there are twice as many skank hits as kicks. Measured
discrimination for plain low-band flux is 1.17:1, barely better than chance.

What works is weighting low-band flux by how much the low band **dominates** the
spectrum at that instant. A kick is almost all low end; a skank is not. Measured
discrimination: **18:1 on one drop, 55:1 on steppers, 7:1 on rockers**. Shift the
lattice by half a period only when this evidence is clearly better (1.4x), because
dancehall legitimately puts a kick on the "and of 2" and must be left alone.

Note what this is *not*: it asks where the beat lattice is, not which beat is
number 1. One drop still has its kick on beat 3 — that is on a beat, which is all
this step needs.

**Step 3 — Phase from self-similarity.**

```python
def phase_score(beats, feats, meter=4):
    # feats: per-beat [chroma(12) | mfcc(13) | subband onset(4)]
    best = {}
    for phi in range(meter):
        bars = group_into_bars(feats, offset=phi, meter=meter)
        # (a) music repeats at 4- and 8-bar scale - only sharp when aligned
        rep = (mean(cos_sim(bars[i], bars[i + 4]) for i in range(len(bars) - 4))
             + mean(cos_sim(bars[i], bars[i + 8]) for i in range(len(bars) - 8)))
        # (b) match against a library of real bar patterns -- NOT an assumption
        #     that the kick marks beat 1, which is false for one drop
        pat = best_bar_template_match(beats, offset=phi, meter=meter)
        # (c) section boundaries land on bar starts
        # (c) chord changes land on downbeats -- very strong on riddim material,
        #     where the chord cycle is short and rigidly repeated
        harmonic = chroma_novelty_at_bar_starts(beats, phi, meter)
        best[phi] = 0.34 * rep + 0.34 * harmonic + 0.32 * pat
    top, second = sorted(best.values(), reverse=True)[:2]
    return argmax(best), (top - second) / top   # phase, confidence
```

> **The kick-on-beat-1 heuristic is deleted, not softened.**
>
> An earlier draft of this design scored grid phase partly on "low-band energy
> concentrates on beat 1". That is false for a large share of the target library.
> Reggae **one drop** leaves beat 1 deliberately empty and puts kick and snare
> together on beat 3, so the heuristic lands exactly two beats late, every time,
> on every one-drop track. **Rockers** and **steppers** accent beat 3 the same way.
>
> Measured on synthetic material with ground-truth downbeats, picking the phase
> with the most low-band energy on beat 1 scored **0 out of 6** patterns — it fails
> on four-on-the-floor too, because a snare on 2 and 4 leaks into the low band.
>
> The replacement uses three sources that do not assume where the kick goes:
> boundary novelty, harmonic rhythm, and correlation against a library of real bar
> patterns that includes the one-drop family. Measured phase accuracy after the
> change: **216/216** across six patterns x 3 seeds x 4 lead-in offsets x 3 tempo
> drift settings.

**Step 4 — Cross-check, then be honest about it.** If the SSM phase disagrees with the
ensemble's own downbeat labels, clamp `phase_confidence` low regardless of how sharp
the SSM peak looked. Disagreement between independent methods is information, and
burying it is exactly how open-loop systems ship broken edits. Low confidence routes to
the audition step in section 07 — it does not get quietly resolved by picking a favourite.

**Step 4b — Tempo octave, and when to just ask.**

A generic tempo prior centred near 120 BPM is actively harmful here: it pulls
reggae (60–95) up an octave and soca (135–175) down one. Structural tidiness
(§Step 2) resolves many cases, but not all — at 74 BPM a one drop has genuine
periodicity at 148 too, and both readings make the song's structure tidy.

So the engine accepts a **genre BPM range** as a first-class input:

| Genre | Range |
| --- | --- |
| reggae | 60–95 |
| dancehall | 82–115 |
| soca | 135–175 |
| afrobeats | 95–120 |
| hip-hop | 75–105 |
| house | 118–132 |

Naming the genre is reliable, takes one flag, and is far more honest than
pretending the ambiguity is always auto-resolvable. When no genre is given and the
octave stays ambiguous, that is an audition case (§07), not a coin flip.

**Step 5 — The grid is a list of times, never a formula.** `BarGrid` stores the fused
beat times themselves. `tick_to_sample(bar, beat, tick)` interpolates piecewise-linearly
between real adjacent beats. A constant `start + n*(60/bpm)` grid accumulates tens of
milliseconds of error by bar 8 on anything human-played; this construction has no
accumulated error by definition.

Meter is estimated by running the same machinery over meter in {3,4,6,8}. Anything that
is not a stable 4 is flagged — an 8-bar intro in 7/8 is legitimate but wants a human in
the loop.

---

## 04 — Stage 3: stems and the per-bar feature table

Separate once with `htdemucs_ft` (drums / bass / other / vocals), cache by content hash,
then collapse everything into one table indexed by bar. Every candidate in every
strategy reads from this table, so the expensive work happens exactly once.

| Field | Meaning | Used by |
| --- | --- | --- |
| `vocal_margin_db` | full-mix RMS minus vocal-stem RMS, per bar | clean-bar test, gate G4 |
| `voiced_frames` | pitch-salience VAD run on the vocal stem | clean-bar test, gate G4 |
| `drums_rms_db` / `bass_rms_db` | per-stem level | strategy availability, build patterns |
| `chroma[12]` | beat-synced chroma, bar-averaged | harmonic compatibility score |
| `onset_profile[4]` | subband onset energy across the bar | phase scoring, loop seed selection |
| `lufs_short` | short-term loudness | gain matching, gate G6 |
| `warble_est` | HF instability estimate on the instrumental | separation-artifact soft score |

> **Don't trust the separator's silence.** Vocal stems leak. A bar can look silent in
> the vocal stem and still have audible vocal in the mix, or look noisy and be perfectly
> clean. So `is_clean[bar]` requires **two independent tests to agree**:
> `vocal_margin_db > 35` **and** `voiced_frames == 0`. Separator bleed is mostly
> broadband noise; real vocals are harmonic and pitched. The VAD catches what the level
> test misses, and vice versa.

---

## 05 — Stage 4: the fallback ladder

Five strategies, ordered by how good they sound when they work and how often they are
available. The engine always tries the top rung first and drops only when a rung's
candidates fail verification.

| Tier | Strategy | What it is | Availability* |
| --- | --- | --- | --- |
| **L1** | Native instrumental lift | A real 8-bar vocal-free window from the track itself, using the **original mix** — no separation in the signal path, therefore zero separation artifacts. Existing intros, breakdowns, instrumental bridges. Indistinguishable from a hand-made edit because it essentially is one. | ~35% |
| **L2** | Loop construction from clean bars | No clean 8-bar run, but a clean 1/2/4-bar seed exists. Repeat to 8 bars with a build pattern. Still original-mix audio, so still artifact-free; the only risk is seam quality. | ~40% |
| **L3** | Separated instrumental | Vocals removed by separation (drums + bass + other). Opens up any 8 bars, at the cost of separation artifacts. Gated hard on measured leakage, ranked down by warble estimate, so it only wins when genuinely clean. | ~20% |
| **L4** | **Drums-only loop — the floor** | Drum stem alone, looped from the most stable 1/2/4-bar seed. No harmonic risk, no vocal risk, no key clash, and a completely idiomatic DJ intro. Available for essentially any track with a pulse, which is what makes the delivery rate high. **Build this rung first.** | ~97% |
| **L5** | Grid-locked resynthesis | Slice kick/snare one-shots out of the drum stem by transient detection, re-trigger on the grid. For sparse, buried or heavily-processed percussion where looping fails. Optionally layered with a tonal pad built from the detected key. | ~99% |

\* Design targets to be measured against the corpus in section 09, not claims. Tiers
overlap — most tracks qualify for several, and the verifier picks among them.

### Candidates are plans, not audio

```python
@dataclass(frozen=True)
class Candidate:
    strategy:       Strategy         # LIFT | LOOP | STEM | DRUMS | SYNTH
    source_bars:    tuple[int, int]  # half-open span in source bar indices
    seed_bars:      int              # 1 | 2 | 4  (LOOP/DRUMS only)
    build:          BuildPattern     # FLAT | HALF | QUARTER  (+riser flag)
    stems:          frozenset[str]
    body_start_bar: int              # where the original track re-enters
```

Enumeration is exhaustive and free — nothing is decoded or rendered. A typical track
yields 200–800 candidates, pruned to the top 12 by a prior computed entirely from the
feature table: tier weight, vocal margin, drum energy, chroma compatibility, structural
tidiness.

**Build patterns** mirror what a DJ actually does by hand rather than being invented:

- `FLAT` — all 8 bars identical. Utility mix-in; safest.
- `HALF` — bars 1–4 drums only, bars 5–8 add bass or full. The default.
- `QUARTER` — 1–2 kick, 3–4 add hats, 5–6 add bass, 7–8 full. Reads as a real build.
- `+riser` — optional filter sweep or reverse cymbal across bar 8, so the body landing
  on bar 9 hits as a drop.

---

## 05a — Riddims: the highest-quality tier, and it only exists for this library

A **riddim** is one instrumental used across many different vocal tracks. Soca,
dancehall and reggae are built on them — dozens of vocalists cut over the same
backing track, and a working DJ's crate holds whole families of them.

This is a structural property of the library that no general-purpose intro tool
can exploit, and it makes possible a tier *above* everything in §05.

### L0a — Cross-track sourcing

If track A on a riddim has no vocal-free 8 bars, but track B on the **same
riddim** does, build A's intro from B's clean bars. It is the same backing track,
so the result is musically identical to lifting from A itself — and it is
original-mix audio, so there is no separation in the signal path at all.

One clean instrumental section anywhere in a riddim family unlocks a tier-L1
intro for *every* track in that family.

### L0b — Median stacking across the family

Better than borrowing: with N tracks on the same riddim, align them and take the
per-bin **median** of their magnitude spectra.

The instrumental is identical across all N, so it survives the median untouched.
The vocals are different on every track, so at any given time-frequency bin they
are outliers, and the median rejects them.

This is not source separation and it is categorically better than source
separation. A separator *estimates* what the instrumental probably sounds like
from a single mixture, and its errors are what you hear as warble and vocal
ghosting. Median stacking has N independent observations of the identical
instrumental with different interference on each, and simply throws the
interference away. It is the same reasoning that removes satellite trails from
stacked astrophotography frames.

Requirements, in rough order of difficulty:

1. **Family detection.** Fingerprint each track's percussive-onset pattern and
   beat-synchronous chroma, then cluster with tempo. Same-riddim tracks match
   near-exactly; this is a much easier matching problem than general cover-song
   detection because the backing track is literally the same recording.
2. **Alignment.** Cross-correlate to find the offset. Versions re-cut at a
   slightly different tempo need a resample first; reject a candidate whose
   correlation peak is weak rather than forcing it.
3. **Combination.** Median the magnitudes; take phase from whichever source has
   the lowest vocal energy at that bin, or reconstruct with Griffin-Lim if the
   phase sources disagree badly.
4. **Verification.** The same gates as everything else, plus a check that the
   stacked result is actually cleaner than the best single source — if stacking
   made it worse, fall back.

Three sources is enough to see the effect; five or more is comfortable. A DJ with
a serious riddim collection has that for many families.

### L0c — Cue layout consistency across a family

Because the cue layout (§08a) is anchored to the drop rather than to the top of
the file, every track on a riddim gets its cues on the same musical positions.
The muscle memory carries from one track to the next across the whole family,
which is precisely what makes riddim sets fast to mix.

### Where L0 sits in the ladder

| Tier | Source | Separation in path? | Availability |
| --- | --- | --- | --- |
| **L0b** | Median-stacked riddim family | no | needs 3+ family members |
| **L0a** | Clean bars from a sibling track | no | needs 1 clean sibling |
| L1 | Clean bars from this track | no | ~35% |
| L2 | Loop from clean bars of this track | no | ~40% |
| L3 | Separated instrumental | yes | ~20% |
| L4 | Drums-only loop | drum stem only | ~97% |
| L5 | Grid-locked resynthesis | drum stem only | ~99% |

L0 does not replace the ladder; it sits on top of it and falls through when a
family is not available.


---

## 06 — Stage 5: rendering, where edits stop sounding like edits

A timeline is an ordered list of clips addressed in grid coordinates. Rendering resolves
them to samples through the `BarGrid`'s piecewise-linear map.

```python
@dataclass
class Clip:
    src:         AudioRef   # mix | stem | synth buffer
    src_pos:     GridPos    # (bar, beat, tick) in the source
    dst_pos:     GridPos    # (bar, beat, tick) in the output
    length:      GridDur
    gain_db:     float
    fade_in_ms:  float
    fade_out_ms: float
    pre_roll_ms: float      # reverb tail captured *before* src_pos
```

Because source and destination can sit at different points on a drifting grid, a clip
occasionally needs a rate correction. If `src_duration / dst_duration` deviates from 1
by more than 0.3%, resample with soxr VHQ; below that it is inaudible and correcting it
would cost more than it buys.

### Splice mechanics — three refinements, in order

1. **Transient-aware placement.** The target is a downbeat, but cutting exactly on a
   downbeat means cutting through a kick transient, and a crossfade there smears it.
   Instead, search +/-1/16 note around the target for the local *minimum* of the
   broadband onset envelope and cut there. The crossfade then hides in a rhythmic gap.
   Highest-value trick in the whole render stage, about six lines of code.
2. **Micro-alignment by cross-correlation.** Take 60 ms of onset envelope either side of
   the proposed join and cross-correlate. If the peak sits at lag tau != 0 and
   |tau| < 25 ms, shift the incoming clip by tau — this scrubs residual grid error down
   to sample level. If |tau| >= 25 ms, **do not force it**: the grid is wrong at this
   point, and the correct response is to flag the candidate, not nudge it into place.
3. **Equal-power crossfade at matched zero crossings.** 8–20 ms, cos/sin law. Search
   +/-1 ms on both sides for a pair of same-direction zero crossings (computed on the
   mid signal so stereo stays coherent) and start the fade there. Removes the DC step
   that causes the click most auto-editors leave behind.

### Loop seams

Repeating a 4-bar seed joins the seed's tail to its own head, and that join is where
machine-made loops give themselves away. Two cheap treatments:

- **Spectral seam search.** ~40 in-point candidates within +/-20 ms of the grid position
  and ~40 out-point candidates likewise; score each pair by STFT magnitude distance plus
  phase coherence at the join; take the minimum. 1,600 evaluations of a small FFT.
- **Reverb pre-roll capture.** Grab `pre_roll_ms` (default 120 ms, capped at the previous
  1/16) from *before* the source in-point and overlap-add onto the tail of the preceding
  repetition. Carries the room tail across the seam. Exactly what a human does when they
  grab a little extra before the downbeat; without it, loops audibly "breathe."

### Loudness

Match the intro region to the body's first 8 bars within +/-0.3 LU using integrated
LUFS, applied as a **static gain — never a compressor**, which would change the
material's dynamics and defeat the point. Then check true peak with an oversampled
meter; if the render exceeds -1.0 dBTP, reduce gain rather than limiting.

---

## 07 — Stage 6: the verifier

Every metric below is computed on the **rendered output file**, not on any intermediate.
Failing any single gate rejects the candidate outright.

| Gate | Measures | Threshold | Catches |
| --- | --- | --- | --- |
| **G1** Grid integrity | Re-run the full beat-tracking stack on the rendered file; count bars in the intro region | exactly 8 | Wrong phase, wrong tempo octave, accumulated drift |
| **G2** Splice alignment | Onset-envelope cross-correlation lag at each join | \|tau\| <= 5 ms | Late or early entry of the body |
| **G3** Tempo continuity | Max deviation of inter-onset interval from median across the splice | <= 1.5% | Grid discontinuity at the join |
| **G4** Vocal silence | VAD voiced-frame count on the rendered intro + vocal-stem margin | 0 frames, >= 35 dB | Leaked vocal, stray ad-libs, breaths |
| **G5** Discontinuity | Max sample-to-sample delta within +/-30 ms of a splice vs. local median | <= 6x | Clicks and pops |
| **G6** Loudness continuity | Short-term LUFS delta across the splice | <= 1.0 LU | Volume jump into the body |
| **G7** True peak | 4x oversampled true-peak meter | <= -1.0 dBTP | Inter-sample clipping on club systems |
| **G8** Dropout | Any window > 120 ms below -60 dBFS inside the intro | none | Dead air from a bad source region |

> **Why G1 is the one that matters.** G1 is the closed loop. The system re-analyzes its
> own output with the same detector stack that produced the grid, and demands the answer
> be exactly 8 bars at a continuous tempo. If the grid was off by a beat, or an octave
> out, or drifted, the render will not measure as 8 bars, and the candidate is dead
> before anyone hears it. Errors cannot hide behind a plausible-looking waveform.

**Soft score, for ranking survivors.** Among candidates that clear every gate, rank by a
weighted sum: harmonic compatibility at the splice (chroma cosine; neutral for
drums-only), energy-arc monotonicity, timbral similarity of the intro to the track's own
palette, strategy tier bonus, loop seam quality, and — for L3 — the separation-artifact
warble estimate. The winner is delivered with its full verdict attached.

**Three outcomes, never a fourth:**

1. **Deliver.** A candidate passed everything. Ship it with the verdict.
2. **Deliver with note.** Passed, but at tier L4/L5 or with a weak soft score. Ship it
   *and say what was compromised* — "no vocal-free material found; built a drums-only
   intro from bars 49–52."
3. **Abstain.** Nothing passed. Emit a diagnostic naming the blocking gate and what a
   human could do about it.

**The one case that goes to a human.** When `phase_confidence` is low, guessing is the
wrong move — and so is abstaining, because the information needed is trivially
available. Render the *same* winning candidate at all four phases (or both tempo
octaves) and present them as an A/B/C/D audition. That is a fifteen-second listen, and
it converts the single largest source of catastrophic failure into a choice anyone can
make instantly. In unattended batch mode, fall through to abstain rather than picking.

That is the honest shape of "works every time": the system is never wrong, because it
either proves the result or declines to ship it — and the one thing it genuinely cannot
settle alone is the one thing a person settles in fifteen seconds.

### Every failure mode, and what closes it

| Failure mode | Caught by | Response |
| --- | --- | --- |
| Off-by-one-beat phase | G1, G2 | SSM cross-check -> phase audition |
| Half / double tempo | G1 | Octave resolved by structural tidiness |
| Vocal bleed in the intro | G4 | Two-test clean-bar rule; drop to L4 |
| Separation warble | soft score | L1/L2 outrank L3 automatically |
| Click at the splice | G5 | Zero-crossing pair search in the fade |
| Loop "breathes" at the seam | soft score | Spectral seam match + reverb pre-roll |
| Live-band tempo drift | G3 | Piecewise grid + cross-correlation micro-align |
| Volume jump into the body | G6 | Integrated-LUFS static gain match |
| Inter-sample clipping | G7 | Oversampled TP check, gain down not limit |
| Dead air in the source region | G8 | Candidate rejected, next one auditioned |
| Non-4/4 or unstable meter | meter estimate | Flag -> audition or abstain |
| No usable percussion at all | all tiers fail | L5 resynthesis, else abstain with reason |

---

## 08 — Export: landing in the deck, not just on disk

An intro that is not gridded correctly in the DJ software is only half-delivered. Write
the metadata, not just the audio.

- **Audio.** Stay in float32 the whole way; dither to 24- or 16-bit with TPDF noise as
  the very last operation. WAV or AIFF.
- **Never round-trip through MP3 mid-pipeline.** LAME's encoder delay adds roughly 1,100
  samples of padding, which silently shifts everything downstream of it. Decode once at
  the front, encode once at the end if at all.
- **Cue points and beatgrid.** Rekordbox XML `<POSITION_MARK>`, Serato `GEOB` ID3 frames
  (`Serato Markers2`, `Serato BeatGrid`), Traktor NML. Write a memory cue at 0:00, a hot
  cue on the bar-9 downbeat where the body enters, and the beatgrid anchor.
- **Sidecar JSON.** The full verdict, every gate result, the grid, and the winning
  candidate's plan. Makes results reproducible, auditable and debuggable six months
  later, and is what lets the corpus tests below exist at all.

---

## 08a — Serato hot cues for phrase mixing

An intro that is not gridded and cued in the DJ software is only half delivered.

**Cue layout.** Serato DJ Pro exposes 8 hot cue slots. They are allocated by
musical meaning, not mechanically:

| Slot | Position | Colour | Why |
| --- | --- | --- | --- |
| 1 | 0:00 | grey | Top of the intro — where you drop it in |
| 2 | bar 9 downbeat | red | **The drop.** Where the original track enters. The one you must never miss |
| 3–8 | drop + N x phrase | green / blue / purple | Phrase boundaries, walking forward from the drop |

Phrase length is selectable (8 / 16 / 32 bars). Colour encodes phrase depth — 32
bar boundaries are major section changes, 16 and 8 are progressively finer mix
points — so the slot strip reads as structure at a glance rather than as eight
identical markers.

**Anchoring to the drop, not the file.** Cues 3–8 are placed relative to the drop,
which means they land on phrase boundaries of the *original track* rather than of
the edit. Two tracks cut over the same riddim therefore get identical layouts, and
the muscle memory transfers across the family.

**Beatgrid anchor.** The Serato BeatGrid marker is written on a **downbeat**, not
on the first beat. Anchoring on an arbitrary beat makes Serato's bar display fight
the actual phrasing, which defeats the purpose of the cues.

**Format caveat, stated plainly.** Serato's tag format is not documented by Serato.
The implementation follows the community reverse-engineering of the GEOB frames
(`Serato Markers2`, `Serato BeatGrid`). It round-trips through its own parser,
which proves internal consistency — it does **not** prove Serato reads it. Verify
against a real Serato install on a copy before running it over a library, and
treat the JSON sidecar as the authoritative record of cue positions until that
verification is done.


---

## 09 — Measurement: how you know it's actually good

"Top quality" is not a design decision, it is a measurement. Without a corpus and
metrics in CI, every threshold in this document is a guess that slowly rots.

**Corpus.** 200+ tracks, deliberately stratified so the hard cases cannot hide behind
the easy ones: 4/4 electronic (easy), hip-hop with swing, live band and rock (drifting
tempo), dense-vocal pop, half-time and double-time trap, non-4/4, beatless ambient.
Hand-label true downbeats on a 50-track subset — a day of tedious work and the most
valuable day in the project.

**Tracked per commit:**

| Metric | Target | Note |
| --- | --- | --- |
| Grid phase accuracy | >99% electronic, >92% overall | Against hand labels |
| Delivery rate | >99% on percussive material | Abstentions acceptable, silent failures not |
| Correctness of delivered output | **100%** | Any single miss is a P0 — it means a gate is wrong, not that a model is weak |
| Mean splice alignment error | <2 ms | Measured on rendered files |
| Tier distribution | track L1+L2 share over time | The real quality trend line |
| Golden-file hashes | byte-stable | Catches unintended render changes |

And the only real arbiter: a **blind A/B against hand-made intros** on 30 tracks, scored
by a working DJ, gating each release. Every metric above is a proxy; this one is not.

---

## 10 — Build order: floor first, ceiling later

The sequencing matters more than usual. Build the *most robust* strategy first so there
is always a working end-to-end system, then add the better-sounding tiers above it. The
opposite order gives you something impressive on eight tracks and broken on the rest.

| Phase | Scope | Est. |
| --- | --- | --- |
| 1 · Floor | Decode, consensus grid, L4 drums-only, timeline + splice, gates G1–G3 and G5. **Usable end to end.** | 3–4 days |
| 2 · Verify | Stems, per-bar feature table, L1 lift + L3 stem, full gate set, verdict reporting | ~1 week |
| 3 · Craft | L2 loop construction, spectral seam matching, reverb pre-roll, build patterns, candidate search + soft scoring | ~1 week |
| 4 · Ship | Export + cue writing, L5 resynthesis, phase-ambiguity audition UI | 3–4 days |
| 5 · Prove | Corpus, CI metrics, listening tests, threshold tuning | ongoing |

### Stack and cost

Python 3.11+ with `demucs`, `madmom` / `BeatThis` / `allin1`, `librosa`, `soxr`,
`soundfile`, `pyloudnorm`, `numpy`, `ffmpeg`. Typer for the CLI.

Per track on a modern GPU: separation ~8 s, beat trackers ~3 s, feature table ~2 s,
rendering twelve candidates ~4 s, verification ~6 s — roughly **25 seconds**, dominated
by Demucs. CPU-only lands at 2–4 minutes. Cache stems and grid by content hash and
re-runs with different settings cost ~5 seconds, which is what makes threshold tuning
across a 200-track corpus tractable.

For a browser front end: FastAPI worker plus a job queue, with the app uploading and
polling. Client-side `essentia.js` is fast enough for the grid-audition preview so the
phase check feels instant.

---

One non-technical note worth settling early rather than late: these outputs are
derivative edits of copyrighted recordings. That is ordinary practice for a DJ's own
crate and performance use, but hosting it as a service that returns edited masters to
other people is a materially different position. Worth deciding before Phase 4, not after.

---

## 11 — Phase 1: what is built and what it measures

Implemented in [`tools/djintro/`](../../tools/djintro/). Tier L4 (drums-only floor)
end to end, plus the grid, render, verify and Serato layers every higher tier reuses.
numpy/scipy only — no demucs, madmom or GPU; median-filter HPSS stands in for the
drum stem.

### Measured on the synthetic corpus

| Result | Measurement |
| --- | --- |
| **Grid phase accuracy** | **216/216** (6 patterns x 3 seeds x 4 lead-in offsets x 3 tempo drifts) |
| Kick-dominance discrimination | 18:1 one drop, 55:1 steppers, 7:1 rockers (vs 1.17:1 for plain low-band flux) |
| Loop length error | 0.00 ms (exactly `repeats x seed`) |
| Body-on-lattice error | 0.00 ms on all six patterns |
| Full gate pass | 4/6 deliver, **2/6 correctly abstain** |
| Test suite | 44 passing |

The two abstentions are real, not threshold artifacts. `rockers` measures 33 ms of
splice misalignment and `soca` 13 ms; both are genuine residual grid-quantisation
error that the audio-domain micro-alignment could not confidently correct, because
those patterns carry almost no onset on three beats in four. **The system refuses
to ship them, which is the design working.** The fix is known and belongs in Phase
2: refine the grid to sub-hop resolution rather than fitting from 11.6 ms
quantised beat times.

### Bugs the verifier caught that a listening test would have missed

Each of these shipped silently in an earlier draft and was found by measurement:

1. **Onset envelope ran 1 frame early.** A centered STFT sees an onset before its
   nominal time, so every per-beat window sampled the *next* beat's pre-echo. Now
   compensated and pinned by a test.
2. **`loop_bars` crossfaded the pre-roll instead of overlap-adding it**, so every
   repeat started 108 ms late and the loop was longer than the bars it contained.
3. **`want` used 8 consecutive bars from the seed** rather than `repeats x seed`,
   truncating the loop mid-pattern by 11.6 ms.
4. **Band-staged builds left 3 seconds of dead air per bar on one drop**, which has
   one kick per bar. Build staging now adapts to measured kick density.
5. **Loudness matched the intro's average to the body**, leaving the intro's final
   bars several dB hot right at the splice. Now matches the same window the
   continuity gate measures.

### Gate thresholds are hypotheses, and two were wrong

G5 originally used a fixed step-to-median-step ratio of 6. Measured on untouched
reggae, an ordinary downbeat already scores ~7.0 with a p90 of 7.7 — the threshold
was below what normal music produces at a transient, so it failed clean edits. It
is now a differential measurement against a null reference (the same join with a
4x longer crossfade), which asks the only question that matters: did the edit add
anything?

G2's 5 ms was likewise arbitrary. Beat times are quantised to the 11.6 ms analysis
hop, so a lattice fitted over ~12 beats carries ~3.4 ms of standard error — a 5 ms
threshold sat at 1.5 sigma of the measurement's own noise. It is now 10 ms:
below the ~15 ms flam audibility threshold, above the noise floor of the
instrument. Tightening it again requires a better measurement, not a smaller
constant.

**None of this is validated on real records.** Synthetic drums are cleaner and more
regular than anything in a crate. These numbers establish that the logic is
correct, not that the engine is accurate. The corpus in §09 is what would.

---

## 12 — Library analysis: describing tracks for an AI

A second tool sharing the same analysis stack. The intro generator answers "can I
make an intro for this track"; this answers "what is this track, and what mixes
with it" — in a form a language model can reason over without hearing anything.

### Per-track digest

Tempo and band, key in Camelot with a confidence figure, bar count and meter,
drum-pattern family, first downbeat, a per-phrase energy and vocal map on a 0–9
scale, a section table with functional labels, and the phrase-aligned windows
where the track can be mixed in and out.

Labels are deliberately functional — `intro`, `break (instrumental)`, `groove`,
`peak (vocal)` — not `verse` and `chorus`. Calling something a chorus without
training data is a guess; whether a span is loud and whether anyone is singing
over it is measurable, and it is what actually drives the mixing decision.

### Pool view

Tempo bands, Camelot distribution, riddim families, and ranked transitions. A
transition pairs one track's mix-out window with another's mix-in window and
scores harmonic distance (0.34), tempo relation (0.30), window quality (0.26) and
energy direction (0.10).

The tempo term knows about ratio relationships, not just percentages. 100 BPM into
150 BPM is a 50% change and would be rejected as a stretch — but it is exactly
3:2, the faster track's bar landing on the slower one's half-bar, which is how a
dancehall set gets into soca. That is scored as easy.

### The vocal estimate is the weak link, and it is labelled as such

Everything else here is measured. Vocal presence is inferred, from harmonic energy
in 300–3500 Hz plus envelope modulation at the 3–8 Hz syllable rate, then
contrast-stretched within the track. That makes it reliable for ranking which
parts of a track are least vocal — which is all the mix windows need — and
unreliable as an absolute claim that a bar is instrumental. The digest states the
measured contrast, and says outright when a track has no clearly instrumental
section rather than inventing one.

Real separation (tier L3's demucs) would upgrade this from an estimate to a
measurement, and it is the single highest-value addition to the analysis side.

---

## 13 — The theory layer: why Camelot is not the model

Camelot is a good label and a poor model. It collapses three separate questions
into one integer, and for this material it gets all three partly wrong.

### What Camelot cannot express

**Direction.** 8A→9A and 8A→7A are both "distance 1". They do opposite things:
+1 is the dominant direction and raises tension, −1 is subdominant and releases
it. Set planning depends on the difference.

**Modality.** Camelot has two letters, so every mode collapses into major or
minor. A great many dancehall riddims are modal one- or two-chord vamps, and
whether a vamp is Aeolian, Dorian or Phrygian decides what clashes with it —
a Phrygian ♭2 fights anything sitting on the natural 2, and "minor" does not say
so. The engine fits all seven diatonic modes and reports brightness on a
Lydian +3 … Locrian −4 scale, so a transition can be described as brightening or
darkening rather than merely "compatible".

**The bass.** Two tracks can be adjacent on the wheel and still have basslines a
tritone apart, which is unusable. Dissonance is least forgiving in the bass,
where partials are closest together, so the bass interval is weighted hardest
(0.45) in the harmonic score. Bass pitch is tracked by autocorrelation on a
low-passed signal rather than by chroma — basslines are effectively monophonic,
and the FFT has no useful resolution down there anyway.

### What replaces it

Harmonic fit is scored from actual pitch content:

| Term | Weight | Method |
| --- | --- | --- |
| Bass interval | 0.45 | Semitone distance between the two bass centres, ranked by consonance |
| Combined-set consonance | 0.35 | Huron's aggregate dyadic consonance summed over every interval in the union of both tracks' salient pitch classes |
| Shared pitch classes | 0.20 | Common-tone count |

Huron's values are empirical consonance ratings, not numbers picked by ear,
which is what makes a combined-set score mean something. Salient pitch classes
are selected by relative strength rather than a fixed top-N — a three-note vamp
padded out to five classes has its score driven by whatever noise ranked fourth.

Camelot is still printed, because it is what the reader thinks in.

### Rhythm, which Camelot has no opinion about at all

Two beatmatched tracks in the same key will still fight if their backbeats land
in different places. **This is the central fact about mixing dancehall into
soca**: dancehall puts its snare on beat 3, a half-time feel; soca puts it on 2
and 4. Overlay them and the two backbeats never coincide.

The engine detects the backbeat by asking which of the four beat positions
carries the strongest mid-band accent — not by trying to isolate "the snare" by
band and threshold, which returns the hi-hat pattern instead. On synthetic
material that peak-picking approach returned every even sixteenth for soca;
restricting the search to steps 0/4/8/12 removes every off-beat distractor and
is correct on all three test patterns.

A conflict is reported with what to do about it: *cut on the phrase line, or
blend only over a section where one track's snare drops out*. The rhythm score
also flags a busy low end when the two kick patterns share few positions, and
grooves that will feel unrelated when syncopation levels differ sharply.

### Transition scoring

| Term | Weight |
| --- | --- |
| Harmonic fit (bass + set consonance + common tones) | 0.30 |
| Rhythmic fit (backbeat, kick overlap, syncopation) | 0.22 |
| Tempo relation | 0.22 |
| Window quality (both tracks' mix windows) | 0.18 |
| Energy direction | 0.08 |

A pair is rejected on measured harmony, not on the Camelot label: a wheel clash
whose pitch content is genuinely consonant stays in the list, and a wheel match
whose basslines sit a tritone apart is dropped.
