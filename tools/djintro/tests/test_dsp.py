import numpy as np
import pytest

from djintro import dsp
from djintro.synth import _kick, _skank, make_track


def test_onset_latency_is_compensated():
    """Pin dsp.ONSET_LATENCY_FRAMES to the true alignment.

    A centered STFT detects an onset before its nominal time. If this drifts,
    every per-beat measurement in the engine silently samples the wrong window,
    which is exactly the bug that made the first phase detector unusable.
    """
    sr = 44100
    x = np.zeros(sr * 2)
    k = _kick(sr)
    x[sr:sr + len(k)] += k
    _, per_band = dsp.onset_envelope(dsp.stft(x), sr)
    peak = int(np.argmax(per_band[0]))
    assert abs(peak - sr / dsp.HOP) <= 1.0


def test_kick_envelope_ignores_broadband_clicks():
    """A skank must not read as a kick, or reggae beat tracking locks off-beat."""
    sr = 44100
    kick = np.zeros(sr); kick[:len(_kick(sr))] = _kick(sr)
    skank = np.zeros(sr); s = _skank(sr, 300.0); skank[:len(s)] = s
    ke_kick = dsp.kick_envelope(dsp.stft(kick), sr).max()
    ke_skank = dsp.kick_envelope(dsp.stft(skank), sr).max()
    assert ke_kick > ke_skank * 5, f"kick {ke_kick:.3f} vs skank {ke_skank:.3f}"


@pytest.mark.parametrize("bpm", [72.0, 98.0, 126.0, 158.0])
def test_beat_tracker_recovers_tempo(bpm):
    t = make_track("four_on_floor", bars=12, bpm=bpm)
    onset, _ = dsp.onset_envelope(dsp.stft(dsp.to_mono(t.audio)), t.sr)
    beats = dsp.track_beats(onset, t.sr, bpm)
    assert len(beats) > 8
    got = 60.0 / float(np.median(np.diff(beats)))
    assert abs(got - bpm) / bpm < 0.03


def test_beat_sync_shapes():
    t = make_track("dancehall", bars=8)
    mag = dsp.stft(dsp.to_mono(t.audio))
    bf = np.round(t.beat_times * t.sr / dsp.HOP).astype(int)
    bf = bf[bf < mag.shape[1]]
    ch = dsp.beat_sync(dsp.chromagram(mag, t.sr), bf, mag.shape[1])
    assert ch.shape == (len(bf), 12)
