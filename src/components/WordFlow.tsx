"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  lookupPhonemes,
  phonemeToSpeakable,
} from "@/lib/cmu-dictionary";

interface WordFlowProps {
  text: string;
  title?: string;
}

interface WordData {
  id: string;
  text: string;
  cleanText: string;
  phonemes: string[] | null;
}

export default function WordFlow({ text, title }: WordFlowProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [isSpeechReady, setIsSpeechReady] = useState(false);
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(-1);

  // Refs for tracking
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const lastSpokenWordRef = useRef<string | null>(null);
  const lastSpokenPhonemeRef = useRef<string | null>(null);
  const isSpeakingRef = useRef(false);
  const speechQueueRef = useRef<string[]>([]);

  // Velocity tracking
  const lastPointerTimeRef = useRef<number>(0);
  const lastPointerXRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);

  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse words once
  const words: WordData[] = text.split(/\s+/).filter(w => w.trim()).map((word, index) => {
    const cleanText = word.replace(/[.,!?;:'"()]/g, "").toLowerCase();
    return {
      id: `word-${index}`,
      text: word,
      cleanText,
      phonemes: lookupPhonemes(cleanText),
    };
  });

  // Initialize speech synthesis after user interaction (required for iOS)
  const initializeSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;

      // iOS requires speaking something to initialize
      const utterance = new SpeechSynthesisUtterance("");
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);

      setIsSpeechReady(true);
    }
  }, []);

  // Handle start button tap
  const handleStart = useCallback(() => {
    initializeSpeech();
    setIsStarted(true);
  }, [initializeSpeech]);

  // Speak text with proper queuing
  const speak = useCallback((text: string, rate: number = 0.8) => {
    if (!speechSynthRef.current || !isSpeechReady) return;

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();
    isSpeakingRef.current = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    utterance.onend = () => {
      isSpeakingRef.current = false;
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };

    speechSynthRef.current.speak(utterance);
  }, [isSpeechReady]);

  // Speak a whole word
  const speakWord = useCallback((word: string) => {
    if (word === lastSpokenWordRef.current) return;
    lastSpokenWordRef.current = word;
    lastSpokenPhonemeRef.current = null;
    speak(word, 0.75);
  }, [speak]);

  // Speak a phoneme
  const speakPhoneme = useCallback((phoneme: string) => {
    const key = phoneme;
    if (key === lastSpokenPhonemeRef.current) return;
    lastSpokenPhonemeRef.current = key;

    const speakable = phonemeToSpeakable(phoneme);
    speak(speakable, 0.6);
  }, [speak]);

  // Calculate velocity and determine if slow or fast
  const updateVelocity = useCallback((x: number): "slow" | "fast" => {
    const now = performance.now();
    const dt = now - lastPointerTimeRef.current;

    if (dt > 0 && lastPointerTimeRef.current > 0) {
      const dx = Math.abs(x - lastPointerXRef.current);
      velocityRef.current = dx / dt; // pixels per ms
    }

    lastPointerTimeRef.current = now;
    lastPointerXRef.current = x;

    // Threshold: 0.2 px/ms is considered slow
    return velocityRef.current < 0.15 ? "slow" : "fast";
  }, []);

  // Handle pointer/touch movement
  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isStarted) return;

    const x = event.clientX;
    const y = event.clientY - 40; // Look above finger

    const speed = updateVelocity(x);

    // Find element at pointer position
    const element = document.elementFromPoint(x, y);

    if (element?.hasAttribute("data-word-id")) {
      const wordId = element.getAttribute("data-word-id");
      const word = element.getAttribute("data-word");
      const phonemesStr = element.getAttribute("data-phonemes");

      if (!wordId || !word) return;

      setActiveWordId(wordId);

      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the speech to prevent rapid firing
      debounceTimerRef.current = setTimeout(() => {
        if (speed === "fast" || !phonemesStr) {
          // Fast mode or no phonemes: speak whole word
          setCurrentPhonemeIndex(-1);
          speakWord(word);
        } else {
          // Slow mode: calculate which phoneme based on position within word
          const rect = element.getBoundingClientRect();
          const relativeX = x - rect.left;
          const percentage = Math.max(0, Math.min(1, relativeX / rect.width));

          const phonemes = phonemesStr.split(",");
          const phonemeIndex = Math.floor(percentage * phonemes.length);
          const clampedIndex = Math.min(phonemeIndex, phonemes.length - 1);

          setCurrentPhonemeIndex(clampedIndex);

          if (phonemes[clampedIndex]) {
            speakPhoneme(phonemes[clampedIndex]);
          }
        }
      }, 50); // 50ms debounce

    } else {
      // Not over a word
      setActiveWordId(null);
      setCurrentPhonemeIndex(-1);
      lastSpokenWordRef.current = null;
      lastSpokenPhonemeRef.current = null;
    }
  }, [isStarted, updateVelocity, speakWord, speakPhoneme]);

  // Handle pointer leave
  const handlePointerLeave = useCallback(() => {
    setActiveWordId(null);
    setCurrentPhonemeIndex(-1);
    lastSpokenWordRef.current = null;
    lastSpokenPhonemeRef.current = null;
    lastPointerTimeRef.current = 0;
    velocityRef.current = 0;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Start screen for iOS compatibility
  if (!isStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-sky-50 p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-700 text-center mb-4">
          {title || "WordFlow"}
        </h1>
        <p className="text-sky-600 text-center text-lg mb-8 max-w-md">
          Trace your finger over the words to hear them read aloud!
        </p>
        <button
          onClick={handleStart}
          className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xl font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          Tap to Start
        </button>
        <p className="text-sky-400 text-sm mt-6">
          Tap the button to enable sound
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-100 to-sky-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/90 shadow-sm px-4 py-3">
        <h1 className="text-xl sm:text-2xl font-bold text-sky-700 text-center">
          {title || "WordFlow"}
        </h1>
      </header>

      {/* Reading Area */}
      <div
        className="flex-1 overflow-auto px-4 py-6"
        style={{ touchAction: "none" }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-4 leading-relaxed">
            {words.map((word) => {
              const isActive = activeWordId === word.id;
              const phonemesData = word.phonemes?.join(",") || "";

              return (
                <span
                  key={word.id}
                  data-word-id={word.id}
                  data-word={word.cleanText}
                  data-phonemes={phonemesData}
                  className={`
                    inline-block
                    text-2xl sm:text-3xl
                    px-3 py-2
                    rounded-xl
                    cursor-pointer
                    select-none
                    transition-all duration-100
                    ${isActive
                      ? "bg-yellow-300 text-yellow-900 scale-110 shadow-md"
                      : "text-gray-800 bg-gray-50 hover:bg-yellow-100"
                    }
                  `}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-sky-600 text-sm">
            Move slowly to sound out letters, or quickly for whole words
          </p>
        </div>
      </div>
    </div>
  );
}
