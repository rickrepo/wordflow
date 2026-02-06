'use client';

import { useCallback, useRef, useState } from 'react';
import { getAudioForWord } from './audioManager';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback((word: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const entry = getAudioForWord(word);
    if (!entry) {
      // No custom audio available
      return false;
    }

    try {
      const audio = new Audio(entry.audioData);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  const speakSlowly = useCallback((word: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const entry = getAudioForWord(word);
    if (!entry) {
      return false;
    }

    try {
      const audio = new Audio(entry.audioData);
      audio.playbackRate = 0.6; // Slow playback
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  const hasAudio = useCallback((word: string) => {
    return getAudioForWord(word) !== null;
  }, []);

  return { speak, speakSlowly, stop, isSpeaking, hasAudio };
}
