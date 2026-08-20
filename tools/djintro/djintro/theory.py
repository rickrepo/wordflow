"""Music theory for mixing decisions.

Camelot is a useful label and a poor model. It collapses three different
questions into one number:

  1. Do the two tracks' pitch-class sets actually sit well together?
  2. Do their BASS notes form a consonant interval? (This is where a clash is
     heard first -- two basslines a semitone or a tritone apart is unusable
     however "compatible" the wheel says the keys are.)
  3. Does the move lift or relax? Camelot calls +1 and -1 both "distance 1",
     but +1 is the dominant direction and lifts, -1 is subdominant and relaxes.

It also assumes both tracks are functionally major or minor. A great many
dancehall riddims are modal one- or two-chord vamps, where the mode -- Aeolian
vs Dorian vs Phrygian -- carries the information that decides a clash, and
flattening it to "minor" throws that away.

This module models all of that explicitly, and adds the thing Camelot has no
opinion about at all: rhythm.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from . import dsp

PITCH_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")

# Huron's aggregate dyadic consonance, by interval class. Positive is consonant.
# ic1 = minor 2nd / major 7th, ic5 = perfect 4th / 5th, ic6 = tritone.
# Derived from empirical consonance ratings rather than picked by ear, which is
# what makes a combined-pitch-set score mean something.
INTERVAL_CLASS_CONSONANCE = {1: -1.428, 2: -0.582, 3: 0.594, 4: 0.386, 5: 1.240, 6: -0.453}

# Semitone interval -> (quality, note). Applied to the two tracks' bass notes,
# where dissonance is least forgiving because the partials are closest together.
BASS_INTERVAL = {
    0:  (1.00, "unison -- basslines share a root, strongest lock"),
    7:  (0.95, "perfect fifth -- very stable"),
    5:  (0.90, "perfect fourth -- stable"),
    3:  (0.75, "minor third"),
    4:  (0.75, "major third"),
    8:  (0.72, "minor sixth"),
    9:  (0.72, "major sixth"),
    10: (0.60, "minor seventh -- common in this music, mild"),
    2:  (0.45, "major second -- mild rub"),
    6:  (0.10, "TRITONE -- basslines will fight"),
    1:  (0.05, "SEMITONE -- basslines will fight"),
    11: (0.05, "major seventh -- basslines will fight"),
}

MODES: dict[str, tuple[int, ...]] = {
    "ionian":     (0, 2, 4, 5, 7, 9, 11),
    "dorian":     (0, 2, 3, 5, 7, 9, 10),
    "phrygian":   (0, 1, 3, 5, 7, 8, 10),
    "lydian":     (0, 2, 4, 6, 7, 9, 11),
    "mixolydian": (0, 2, 4, 5, 7, 9, 10),
    "aeolian":    (0, 2, 3, 5, 7, 8, 10),
    "locrian":    (0, 1, 3, 5, 6, 8, 10),
}

# Which modes read as major-ish vs minor-ish, and how bright. Used to describe
# what a transition does emotionally, which is a real part of set planning:
# dancehall sits mostly in the dark modes, soca mostly in the bright ones, so a
# dancehall -> soca move is nearly always a brightening.
MODE_BRIGHTNESS = {"lydian": 3, "ionian": 2, "mixolydian": 1,
                   "dorian": -1, "aeolian": -2, "phrygian": -3, "locrian": -4}


@dataclass(frozen=True)
class Mode:
    tonic: int
    mode: str
    confidence: float
    fit: float = 0.0

    @property
    def name(self) -> str:
        return f"{PITCH_NAMES[self.tonic]} {self.mode}"

    @property
    def brightness(self) -> int:
        return MODE_BRIGHTNESS.get(self.mode, 0)

    @property
    def is_minorish(self) -> bool:
        return self.brightness < 0


def detect_mode(chroma_profile: np.ndarray, tonic: int | None = None) -> Mode:
    """Fit the seven diatonic modes to a pitch-class profile.

    Reported alongside the major/minor key rather than instead of it. Knowing a
    riddim is Phrygian rather than merely "minor" tells you its b2 will clash
    with anything sitting on the natural 2 -- information the Camelot wheel
    cannot express.
    """
    p = np.asarray(chroma_profile, dtype=float)
    if p.sum() <= 0:
        return Mode(0, "aeolian", 0.0)
    p = p / (np.linalg.norm(p) + 1e-9)

    scores = []
    tonics = range(12) if tonic is None else [tonic]
    for t in tonics:
        for name, degrees in MODES.items():
            mask = np.zeros(12)
            for d in degrees:
                mask[(t + d) % 12] = 1.0
            # Weight the tonic and fifth: a scale-membership match alone cannot
            # distinguish a mode from its own rotations, which is the whole
            # relative-major problem one level up.
            mask[t] += 1.6
            mask[(t + 7) % 12] += 0.7
            third = (t + degrees[2]) % 12
            mask[third] += 0.5
            mask = mask / np.linalg.norm(mask)
            scores.append((float(p @ mask), t, name))
    scores.sort(reverse=True)
    best, t, name = scores[0]
    runner = scores[1][0] if len(scores) > 1 else 0.0
    conf = float(np.clip((best - runner) / (abs(best) + 1e-9), 0.0, 1.0))
    return Mode(t, name, conf, fit=best)


def bass_pitch_class(audio: np.ndarray, sr: int, fmax: float = 250.0
                     ) -> tuple[int, float]:
    """Dominant bass pitch class, by autocorrelation on a low-passed signal.

    Basslines are effectively monophonic, so autocorrelation pitch tracking is
    both more robust and cheaper here than trying to push a chroma filterbank
    down into a register where the FFT has no resolution.
    """
    from scipy.signal import butter, sosfilt

    mono = dsp.to_mono(np.asarray(audio, dtype=np.float64))
    sos = butter(6, fmax / (sr / 2), btype="low", output="sos")
    low = sosfilt(sos, mono)

    win = int(0.093 * sr)          # ~10.7 Hz floor, below any usable bass note
    hop = int(0.046 * sr)
    lag_min = int(sr / fmax)
    lag_max = int(sr / 35.0)
    hist = np.zeros(12)
    for i in range(0, max(len(low) - win, 0), hop):
        seg = low[i:i + win]
        if np.sqrt(np.mean(seg ** 2)) < 1e-4:
            continue
        seg = seg - seg.mean()
        ac = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
        if ac[0] <= 0:
            continue
        ac = ac / ac[0]
        band = ac[lag_min:lag_max]
        if band.size < 3:
            continue
        lag = int(np.argmax(band)) + lag_min
        if ac[lag] < 0.35:          # unvoiced / noise
            continue
        f0 = sr / lag
        midi = 69 + 12 * np.log2(f0 / 440.0)
        hist[int(round(midi)) % 12] += float(ac[lag])
    if hist.sum() <= 0:
        return -1, 0.0
    pc = int(np.argmax(hist))
    conf = float(hist[pc] / hist.sum())
    return pc, conf


def salient_pitch_classes(v: np.ndarray, rel: float = 0.5,
                          lo: int = 3, hi: int = 7) -> set[int]:
    """Pitch classes a track actually sits on, by relative strength.

    Taking a fixed top-N is wrong: a riddim built on a three-note vamp has its
    set padded out with whatever noise happens to rank fourth and fifth, and
    those phantom classes then drive the consonance score. Threshold relative
    to the strongest class instead, with a floor and a ceiling so the set stays
    meaningful either way.
    """
    v = np.asarray(v, dtype=float)
    if v.max() <= 0:
        return set()
    order = np.argsort(v)[::-1]
    keep = [int(i) for i in order if v[i] >= rel * v.max()]
    if len(keep) < lo:
        keep = [int(i) for i in order[:lo]]
    return set(keep[:hi])


def pcs_dissonance(a: np.ndarray, b: np.ndarray, top_n: int = 5) -> float:
    """Consonance of the union of two tracks' strongest pitch classes.

    Takes each track's top pitch classes, forms the combined set, and sums
    Huron's dyadic consonance over every interval in it. Normalised to 0-1.
    This is the question a DJ is actually asking -- not "are these keys
    related" but "does everything sounding at once agree".
    """
    union = sorted(salient_pitch_classes(a) | salient_pitch_classes(b))
    if len(union) < 2:
        return 1.0
    total, n = 0.0, 0
    for i, x in enumerate(union):
        for y in union[i + 1:]:
            ic = min((x - y) % 12, (y - x) % 12)
            if ic == 0:
                continue
            total += INTERVAL_CLASS_CONSONANCE[ic]
            n += 1
    if n == 0:
        return 1.0
    avg = total / n
    return float(np.clip((avg + 1.428) / (1.240 + 1.428), 0.0, 1.0))


def common_tones(a: np.ndarray, b: np.ndarray, top_n: int = 7) -> int:
    return len(salient_pitch_classes(a, hi=top_n) & salient_pitch_classes(b, hi=top_n))


def camelot_direction(a: str, b: str) -> tuple[str, str]:
    """Describe what a Camelot move does, not just how far it goes."""
    na, nb = int(a[:-1]), int(b[:-1])
    la, lb = a[-1], b[-1]
    fwd = (nb - na) % 12
    back = (na - nb) % 12
    if a == b:
        return "none", "same key, no harmonic movement"
    if na == nb and la != lb:
        if lb == "B":
            return "brighten", "minor to its relative major -- opens up"
        return "darken", "major to its relative minor -- pulls in"
    if la == lb and fwd == 1:
        return "lift", "one step to the dominant -- raises tension, classic build"
    if la == lb and back == 1:
        return "relax", "one step to the subdominant -- releases tension"
    if la == lb and fwd == 2:
        return "lift hard", "two steps up -- a deliberate energy jump"
    if la == lb and back == 2:
        return "relax hard", "two steps down -- a deliberate drop in intensity"
    return "other", "not a standard wheel move"


# ---------------------------------------------------------------- rhythm

STEP_NAMES = {0: "1", 2: "1&", 4: "2", 6: "2&", 8: "3", 10: "3&", 12: "4", 14: "4&"}


@dataclass
class RhythmProfile:
    """Where a track puts its weight inside a bar."""
    kick_steps: list[int] = field(default_factory=list)
    snare_steps: list[int] = field(default_factory=list)
    backbeat: str = "unknown"
    syncopation: float = 0.0
    template: list[float] = field(default_factory=list)   # flattened bands x 16


def _peaks(row: np.ndarray, rel: float = 0.45) -> list[int]:
    if row.max() <= 0:
        return []
    return [i for i, v in enumerate(row) if v >= row.max() * rel]


def describe_backbeat(snare_steps: list[int]) -> str:
    """Classify where the backbeat sits.

    This is the distinction that decides whether two beatmatched tracks can be
    blended at all. Dancehall's snare sits on beat 3 (a half-time feel); soca
    and most four-to-the-floor material put it on 2 and 4. Overlay those and
    the two backbeats fall in different places -- the mix fights itself no
    matter how well the keys agree.
    """
    s = set(snare_steps)
    on_2_4 = 4 in s and 12 in s
    on_3 = 8 in s and not (4 in s and 12 in s)
    if on_2_4 and not on_3:
        return "2+4"
    if on_3 and not on_2_4:
        return "3 (half-time)"
    if on_3 and on_2_4:
        return "3 and 2+4"
    return "none/other"


def backbeat_steps(bar_template: np.ndarray) -> list[int]:
    """Which of the four beats carries the backbeat.

    Do not try to isolate "the snare" by band and threshold -- the 500-2000 Hz
    band also holds hats, the skank, and kick bleed, so a peak-picker there
    returns half the bar. Measured on synthetic soca it returned every even
    sixteenth, which is the hi-hat pattern, not the backbeat.

    Ask the musical question instead: of the four beat positions, which carry a
    strong mid-band accent? That is what a backbeat IS, and restricting the
    search to steps 0/4/8/12 removes every off-beat distractor at a stroke.
    """
    t = np.asarray(bar_template, dtype=float)
    if t.ndim != 2 or t.shape[1] < 16:
        return []
    mid = t[min(2, t.shape[0] - 1)]
    beats = [0, 4, 8, 12]
    vals = np.array([mid[b] for b in beats])
    if vals.max() <= 0:
        return []
    return [b for b, v in zip(beats, vals) if v >= 0.75 * vals.max()]


def rhythm_profile(bar_template: np.ndarray) -> RhythmProfile:
    """bar_template: (n_bands, 16) averaged onset energy over the bar."""
    t = np.asarray(bar_template, dtype=float)
    if t.ndim != 2 or t.shape[1] < 16:
        return RhythmProfile()
    kick = _peaks(t[0], rel=0.6)
    snare = backbeat_steps(t)
    on_beat = {0, 4, 8, 12}
    all_hits = t.sum(axis=0)
    total = all_hits.sum() + 1e-9
    off = sum(all_hits[i] for i in range(16) if i not in on_beat)
    return RhythmProfile(kick_steps=kick, snare_steps=snare,
                         backbeat=describe_backbeat(snare),
                         syncopation=float(off / total),
                         template=t.reshape(-1).tolist())


def rhythmic_compatibility(a: RhythmProfile, b: RhythmProfile) -> tuple[float, list[str]]:
    """Score how two bar patterns sit together when beatmatched. Returns (0-1, notes)."""
    notes: list[str] = []
    score = 1.0

    if a.backbeat != "unknown" and b.backbeat != "unknown":
        if a.backbeat == b.backbeat:
            notes.append(f"backbeats agree (both on {a.backbeat})")
        elif {a.backbeat, b.backbeat} == {"2+4", "3 (half-time)"}:
            score -= 0.45
            notes.append(f"BACKBEAT CONFLICT: {a.backbeat} against {b.backbeat}. "
                         "Snares land in different places -- a long blend will fight. "
                         "Cut on the phrase line, or blend only over a section where "
                         "one track's snare drops out")
        else:
            score -= 0.15
            notes.append(f"backbeats differ ({a.backbeat} vs {b.backbeat})")

    ka, kb = set(a.kick_steps), set(b.kick_steps)
    if ka and kb:
        shared = ka & kb
        extra = (ka | kb) - shared
        if 0 in shared:
            notes.append("both kick on the downbeat -- locks together")
        elif 0 in (ka ^ kb):
            score -= 0.12
            notes.append("only one track kicks on the downbeat")
        if len(extra) >= 5:
            score -= 0.15
            notes.append(f"{len(extra)} non-shared kick positions -- the low end will "
                         "get busy; roll one track's bass off through the blend")

    sync = abs(a.syncopation - b.syncopation)
    if sync > 0.28:
        score -= 0.1
        notes.append(f"very different syncopation ({a.syncopation:.2f} vs "
                     f"{b.syncopation:.2f}) -- grooves may feel unrelated")
    return float(np.clip(score, 0.0, 1.0)), notes


def harmonic_compatibility(pc_a: np.ndarray, pc_b: np.ndarray,
                           bass_a: int, bass_b: int,
                           mode_a: Mode | None = None,
                           mode_b: Mode | None = None) -> tuple[float, list[str]]:
    """Score two tracks' harmonic fit from actual pitch content. Returns (0-1, notes)."""
    notes: list[str] = []

    cons = pcs_dissonance(pc_a, pc_b)
    shared = common_tones(pc_a, pc_b)
    notes.append(f"{shared}/7 pitch classes shared; combined-set consonance {cons:.2f}")

    bass_score, bass_note = 0.6, "bass note undetected"
    if bass_a >= 0 and bass_b >= 0:
        iv = (bass_b - bass_a) % 12
        bass_score, bass_note = BASS_INTERVAL.get(iv, (0.3, f"{iv} semitones"))
        bass_note = (f"bass {PITCH_NAMES[bass_a]} -> {PITCH_NAMES[bass_b]}: {bass_note}")
    notes.append(bass_note)

    if mode_a and mode_b:
        db = mode_b.brightness - mode_a.brightness
        if db >= 2:
            notes.append(f"{mode_a.mode} -> {mode_b.mode}: a clear brightening")
        elif db <= -2:
            notes.append(f"{mode_a.mode} -> {mode_b.mode}: darkens noticeably")
        if "phrygian" in (mode_a.mode, mode_b.mode):
            notes.append("one track is Phrygian -- its b2 clashes with a natural 2, "
                         "so keep the blend short unless the other track avoids that note")

    # Bass weighted hardest: it is where dissonance is least forgiving.
    score = 0.45 * bass_score + 0.35 * cons + 0.20 * min(shared / 5.0, 1.0)
    return float(np.clip(score, 0.0, 1.0)), notes
