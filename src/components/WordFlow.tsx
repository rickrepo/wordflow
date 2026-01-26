"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  lookupPhonemes,
  phonemeToSpeakable,
  getBasePhoneme,
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

interface PhonemeSegment {
  phoneme: string;
  speakable: string;
  index: number;
}

// Velocity thresholds (pixels per millisecond)
const SLOW_THRESHOLD = 0.3; // Below this = slow glide (phoneme mode)
const FAST_THRESHOLD = 0.8; // Above this = fast sweep (whole word)

export default function WordFlow({ text, title }: WordFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [activePhonemeIndex, setActivePhonemeIndex] = useState<number>(-1);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [mode, setMode] = useState<"word" | "phoneme">("word");

  // Refs for tracking
  const lastSpokenRef = useRef<string | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const velocityRef = useRef<number>(0);
  const currentWordRef = useRef<WordData | null>(null);
  const phonemeQueueRef = useRef<PhonemeSegment[]>([]);
  const lastPhonemeIndexRef = useRef<number>(-1);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
      setIsSpeechSupported(true);
    } else {
      setIsSpeechSupported(false);
    }
  }, []);

  // Speak a word or phoneme using Web Speech API
  const speak = useCallback((text: string, rate: number = 0.8) => {
    if (!speechSynthRef.current) return;

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    speechSynthRef.current.speak(utterance);
  }, []);

  // Speak a single phoneme
  const speakPhoneme = useCallback(
    (phoneme: string) => {
      const speakable = phonemeToSpeakable(phoneme);
      speak(speakable, 0.6); // Slower rate for phonemes
    },
    [speak]
  );

  // Speak the whole word
  const speakWord = useCallback(
    (word: string) => {
      speak(word, 0.8);
    },
    [speak]
  );

  // Calculate velocity from pointer movement
  const calculateVelocity = useCallback((x: number, y: number): number => {
    const now = performance.now();
    const last = lastPositionRef.current;

    if (last) {
      const dx = x - last.x;
      const dy = y - last.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const dt = now - last.time;

      if (dt > 0) {
        velocityRef.current = distance / dt;
      }
    }

    lastPositionRef.current = { x, y, time: now };
    return velocityRef.current;
  }, []);

  // Handle pointer movement with velocity tracking
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const x = event.clientX;
      // Look-ahead offset: check 50px ABOVE the finger position
      const y = event.clientY - 50;

      // Calculate current velocity
      const velocity = calculateVelocity(x, y);

      // Determine mode based on velocity
      const newMode = velocity < SLOW_THRESHOLD ? "phoneme" : "word";
      if (newMode !== mode) {
        setMode(newMode);
      }

      // Use elementFromPoint to find which element is at this position
      const element = document.elementFromPoint(x, y);

      // Check if we hit a phoneme segment
      if (element && element.hasAttribute("data-phoneme-index")) {
        const wordId = element.getAttribute("data-word-id");
        const phonemeIndex = parseInt(
          element.getAttribute("data-phoneme-index") || "-1",
          10
        );
        const phoneme = element.getAttribute("data-phoneme");
        const word = element.getAttribute("data-word");

        if (wordId) {
          setActiveWordId(wordId);
          setActivePhonemeIndex(phonemeIndex);

          // In phoneme mode with slow movement, speak individual phonemes
          if (
            newMode === "phoneme" &&
            phoneme &&
            phonemeIndex !== lastPhonemeIndexRef.current
          ) {
            lastPhonemeIndexRef.current = phonemeIndex;
            speakPhoneme(phoneme);
          }
          // In word mode with fast movement, speak the whole word
          else if (
            newMode === "word" &&
            word &&
            word !== lastSpokenRef.current
          ) {
            lastSpokenRef.current = word;
            lastPhonemeIndexRef.current = -1;
            speakWord(word);
          }
        }
      }
      // Check if we hit a word without phoneme data
      else if (element && element.hasAttribute("data-word-id")) {
        const wordId = element.getAttribute("data-word-id");
        const word = element.getAttribute("data-word");

        if (wordId && word) {
          setActiveWordId(wordId);
          setActivePhonemeIndex(-1);

          if (word !== lastSpokenRef.current) {
            lastSpokenRef.current = word;
            speakWord(word);
          }
        }
      } else {
        // Not over any word
        if (activeWordId) {
          setActiveWordId(null);
          setActivePhonemeIndex(-1);
          lastPhonemeIndexRef.current = -1;
        }
      }
    },
    [mode, activeWordId, calculateVelocity, speakPhoneme, speakWord]
  );

  // Handle pointer leave
  const handlePointerLeave = useCallback(() => {
    setActiveWordId(null);
    setActivePhonemeIndex(-1);
    lastSpokenRef.current = null;
    lastPositionRef.current = null;
    lastPhonemeIndexRef.current = -1;
    velocityRef.current = 0;
  }, []);

  // Parse text into words with phoneme data
  const words: WordData[] = text.split(/\s+/).map((word, index) => {
    const cleanText = word.replace(/[.,!?;:'"()]/g, "");
    return {
      id: `word-${index}`,
      text: word,
      cleanText,
      phonemes: lookupPhonemes(cleanText),
    };
  });

  // Render a word with phoneme segments if available
  const renderWord = (word: WordData) => {
    const isActive = activeWordId === word.id;

    // If word has phonemes, render as segments
    if (word.phonemes && word.phonemes.length > 0) {
      return (
        <span
          key={word.id}
          className={`
            inline-flex items-center
            mx-1 my-2
            rounded-lg
            select-none
            transition-all duration-150
            ${isActive ? "bg-yellow-200" : ""}
          `}
        >
          {word.phonemes.map((phoneme, pIndex) => {
            const isPhonemeActive = isActive && activePhonemeIndex === pIndex;
            const basePhoneme = getBasePhoneme(phoneme);

            // Calculate which letters this phoneme roughly corresponds to
            // This is a simplification - real mapping would be more complex
            const letterCount = Math.ceil(
              word.cleanText.length / word.phonemes!.length
            );
            const startIdx = pIndex * letterCount;
            const letters = word.text.slice(startIdx, startIdx + letterCount);

            return (
              <span
                key={`${word.id}-p${pIndex}`}
                data-word-id={word.id}
                data-word={word.cleanText}
                data-phoneme-index={pIndex}
                data-phoneme={basePhoneme}
                className={`
                  inline-block
                  text-3xl sm:text-4xl
                  px-1 py-1
                  cursor-pointer
                  transition-all duration-100 ease-out
                  ${
                    isPhonemeActive
                      ? "bg-yellow-400 text-yellow-900 scale-125 rounded-md shadow-lg"
                      : isActive
                        ? "text-yellow-800"
                        : "text-gray-800"
                  }
                `}
              >
                {letters || "·"}
              </span>
            );
          })}
          {/* Handle trailing punctuation */}
          {word.text.length > word.cleanText.length && (
            <span className="text-3xl sm:text-4xl text-gray-800">
              {word.text.slice(word.cleanText.length)}
            </span>
          )}
        </span>
      );
    }

    // Fallback for words without phoneme data
    return (
      <span
        key={word.id}
        data-word-id={word.id}
        data-word={word.cleanText}
        className={`
          inline-block
          text-3xl sm:text-4xl
          px-2 py-1
          mx-1 my-2
          rounded-lg
          cursor-pointer
          select-none
          transition-all duration-150 ease-out
          ${
            isActive
              ? "bg-yellow-300 text-yellow-900 scale-110 shadow-md animate-pulse"
              : "text-gray-800 hover:bg-yellow-100"
          }
        `}
      >
        {word.text}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-100 to-sky-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm shadow-sm px-4 py-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-700 text-center">
          {title || "WordFlow"}
        </h1>
        {!isSpeechSupported && (
          <p className="text-red-500 text-center text-sm mt-2">
            Speech is not supported in this browser
          </p>
        )}
        <p className="text-sky-600 text-center text-sm mt-1">
          Trace your finger over the words to hear them!
        </p>
        {/* Mode indicator */}
        <div className="flex justify-center mt-2">
          <span
            className={`
            text-xs px-3 py-1 rounded-full font-medium
            ${
              mode === "phoneme"
                ? "bg-purple-100 text-purple-700"
                : "bg-green-100 text-green-700"
            }
          `}
          >
            {mode === "phoneme" ? "Slow: Sound it out" : "Fast: Whole word"}
          </span>
        </div>
      </header>

      {/* Reading Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto px-4 py-6 sm:px-8 sm:py-8"
        style={{ touchAction: "none" }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-lg p-6 sm:p-8">
          <p className="leading-loose text-center">
            {words.map((word) => renderWord(word))}
          </p>
        </div>
      </div>

      {/* Footer hint */}
      <footer className="flex-shrink-0 bg-white/80 backdrop-blur-sm px-4 py-3 text-center">
        <p className="text-sky-500 text-xs sm:text-sm">
          Move slowly to hear each sound, or quickly for the whole word
        </p>
      </footer>
    </div>
  );
}
