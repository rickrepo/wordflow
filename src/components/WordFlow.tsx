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
  index: number;
  text: string;
  cleanText: string;
  phonemes: string[] | null;
}

export default function WordFlow({ text, title }: WordFlowProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [isSpeechReady, setIsSpeechReady] = useState(false);

  // Sequential tracking
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for tracking
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const lastSpokenWordRef = useRef<string | null>(null);
  const lastSpokenPhonemeRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Velocity tracking
  const lastPointerTimeRef = useRef<number>(0);
  const lastPointerXRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);

  // Parse words once
  const words: WordData[] = text.split(/\s+/).filter(w => w.trim()).map((word, index) => {
    const cleanText = word.replace(/[.,!?;:'"()]/g, "").toLowerCase();
    return {
      id: `word-${index}`,
      index,
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

  // Reset to beginning
  const handleReset = useCallback(() => {
    setCurrentWordIndex(0);
    setCompletedWords(new Set());
    setIsComplete(false);
    setIsReviewMode(false);
    setActiveWordId(null);
    lastSpokenWordRef.current = null;
  }, []);

  // Speak text
  const speak = useCallback((text: string, rate: number = 0.8) => {
    if (!speechSynthRef.current || !isSpeechReady) return;

    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1;

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
    if (phoneme === lastSpokenPhonemeRef.current) return;
    lastSpokenPhonemeRef.current = phoneme;

    const speakable = phonemeToSpeakable(phoneme);
    speak(speakable, 0.6);
  }, [speak]);

  // Mark word as complete and advance
  const completeWord = useCallback((wordIndex: number) => {
    if (wordIndex === currentWordIndex && !isComplete) {
      setCompletedWords(prev => new Set([...prev, wordIndex]));

      if (wordIndex + 1 >= words.length) {
        setIsComplete(true);
      } else {
        setCurrentWordIndex(wordIndex + 1);
      }
    }
  }, [currentWordIndex, isComplete, words.length]);

  // Calculate velocity
  const updateVelocity = useCallback((x: number): "slow" | "fast" => {
    const now = performance.now();
    const dt = now - lastPointerTimeRef.current;

    if (dt > 0 && lastPointerTimeRef.current > 0) {
      const dx = Math.abs(x - lastPointerXRef.current);
      velocityRef.current = dx / dt;
    }

    lastPointerTimeRef.current = now;
    lastPointerXRef.current = x;

    return velocityRef.current < 0.15 ? "slow" : "fast";
  }, []);

  // Handle pointer movement
  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isStarted || isComplete) return;

    const x = event.clientX;
    const y = event.clientY - 40;

    const speed = updateVelocity(x);
    const element = document.elementFromPoint(x, y);

    if (element?.hasAttribute("data-word-index")) {
      const wordIndex = parseInt(element.getAttribute("data-word-index") || "-1", 10);
      const wordId = element.getAttribute("data-word-id");
      const word = element.getAttribute("data-word");
      const phonemesStr = element.getAttribute("data-phonemes");

      if (wordIndex < 0 || !wordId || !word) return;

      setActiveWordId(wordId);

      // Check if this is a review (going back) or current word
      const isCurrentWord = wordIndex === currentWordIndex;
      const isCompletedWord = completedWords.has(wordIndex);
      const isFutureWord = wordIndex > currentWordIndex;

      setIsReviewMode(isCompletedWord);

      // Clear pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Only speak if it's the current word OR a completed word (review)
      if (isCurrentWord || isCompletedWord) {
        debounceTimerRef.current = setTimeout(() => {
          if (speed === "fast" || !phonemesStr) {
            speakWord(word);
            // Only advance if it's the current word (not review)
            if (isCurrentWord) {
              completeWord(wordIndex);
            }
          } else {
            // Slow mode - phonemes
            const rect = element.getBoundingClientRect();
            const relativeX = x - rect.left;
            const percentage = Math.max(0, Math.min(1, relativeX / rect.width));

            const phonemes = phonemesStr.split(",");
            const phonemeIndex = Math.floor(percentage * phonemes.length);
            const clampedIndex = Math.min(phonemeIndex, phonemes.length - 1);

            if (phonemes[clampedIndex]) {
              speakPhoneme(phonemes[clampedIndex]);
            }

            // Complete word when reaching the end (last 20% of word)
            if (isCurrentWord && percentage > 0.8) {
              completeWord(wordIndex);
            }
          }
        }, 50);
      }
      // Future words - no speech, just visual feedback
    } else {
      setActiveWordId(null);
      setIsReviewMode(false);
      lastSpokenWordRef.current = null;
      lastSpokenPhonemeRef.current = null;
    }
  }, [isStarted, isComplete, updateVelocity, currentWordIndex, completedWords, speakWord, speakPhoneme, completeWord]);

  // Handle pointer leave
  const handlePointerLeave = useCallback(() => {
    setActiveWordId(null);
    setIsReviewMode(false);
    lastSpokenWordRef.current = null;
    lastSpokenPhonemeRef.current = null;
    lastPointerTimeRef.current = 0;
    velocityRef.current = 0;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup
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

  // Start screen
  if (!isStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-sky-50 p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-700 text-center mb-4">
          {title || "WordFlow"}
        </h1>
        <p className="text-sky-600 text-center text-lg mb-8 max-w-md">
          Trace your finger over the words in order to hear them read aloud!
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

  // Completion screen
  if (isComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-100 to-sky-50 p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-700 text-center mb-4">
          Great Job!
        </h1>
        <p className="text-green-600 text-center text-lg mb-8">
          You read the whole story!
        </p>
        <button
          onClick={handleReset}
          className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xl font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          Read Again
        </button>
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
        {/* Progress bar */}
        <div className="mt-2 max-w-xs mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(completedWords.size / words.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-center text-gray-500 mt-1">
            {completedWords.size} / {words.length} words
          </p>
        </div>
      </header>

      {/* Mode indicator */}
      {isReviewMode && (
        <div className="bg-blue-100 text-blue-700 text-center py-1 text-sm font-medium">
          Review Mode - Go to the highlighted word to continue
        </div>
      )}

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
              const isCurrentTarget = word.index === currentWordIndex;
              const isCompleted = completedWords.has(word.index);
              const isFuture = word.index > currentWordIndex;
              const phonemesData = word.phonemes?.join(",") || "";

              let bgColor = "bg-gray-100 text-gray-400"; // Future - grayed out
              let extraStyles = "";

              if (isCompleted) {
                bgColor = "bg-green-100 text-green-700"; // Completed - green
                if (isActive) {
                  bgColor = "bg-blue-300 text-blue-900 scale-105 shadow-md"; // Review active
                }
              } else if (isCurrentTarget) {
                bgColor = "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400"; // Current target
                if (isActive) {
                  bgColor = "bg-yellow-300 text-yellow-900 scale-110 shadow-lg ring-2 ring-yellow-500"; // Current active
                }
              } else if (isFuture && isActive) {
                // Touching future word - subtle feedback but no highlight
                extraStyles = "opacity-60";
              }

              return (
                <span
                  key={word.id}
                  data-word-id={word.id}
                  data-word-index={word.index}
                  data-word={word.cleanText}
                  data-phonemes={phonemesData}
                  className={`
                    inline-block
                    text-2xl sm:text-3xl
                    px-3 py-2
                    rounded-xl
                    cursor-pointer
                    select-none
                    transition-all duration-150
                    ${bgColor}
                    ${extraStyles}
                  `}
                >
                  {isCompleted && !isActive && (
                    <span className="mr-1 text-green-500">✓</span>
                  )}
                  {word.text}
                </span>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-sky-600 text-sm">
            {isReviewMode
              ? "Touch a completed word to hear it again, or go to the yellow word to continue"
              : "Trace the yellow highlighted word to continue reading"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
