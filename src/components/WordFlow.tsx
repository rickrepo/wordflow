"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  lookupPhonemes,
  phonemeToSpeakable,
} from "@/lib/cmu-dictionary";

// Version number - update with each release
const VERSION = "0.4.0";

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

type PlaySpeed = "slow" | "medium" | "fast";

const SPEED_DELAYS: Record<PlaySpeed, number> = {
  slow: 1500,
  medium: 800,
  fast: 400,
};

export default function WordFlow({ text, title }: WordFlowProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [isSpeechReady, setIsSpeechReady] = useState(false);

  // Sequential tracking
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Auto-play
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<PlaySpeed>("medium");
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for tracking
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const lastSpokenWordRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    setIsAutoPlaying(false);
    lastSpokenWordRef.current = null;
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
    }
  }, []);

  // Speak text and return a promise when done
  const speak = useCallback((text: string, rate: number = 0.8): Promise<void> => {
    return new Promise((resolve) => {
      if (!speechSynthRef.current || !isSpeechReady) {
        resolve();
        return;
      }

      speechSynthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      speechSynthRef.current.speak(utterance);
    });
  }, [isSpeechReady]);

  // Speak a whole word
  const speakWord = useCallback((word: string, force: boolean = false) => {
    if (!force && word === lastSpokenWordRef.current) return;
    lastSpokenWordRef.current = word;
    speak(word, 0.75);
  }, [speak]);

  // Mark word as complete and advance
  const completeWord = useCallback((wordIndex: number) => {
    if (wordIndex === currentWordIndex && !isComplete) {
      setCompletedWords(prev => new Set([...prev, wordIndex]));

      if (wordIndex + 1 >= words.length) {
        setIsComplete(true);
        setIsAutoPlaying(false);
      } else {
        setCurrentWordIndex(wordIndex + 1);
      }
    }
  }, [currentWordIndex, isComplete, words.length]);

  // Auto-play next word
  const playNextWord = useCallback(async () => {
    if (!isAutoPlaying || isComplete) return;

    const word = words[currentWordIndex];
    if (!word) return;

    setActiveWordId(word.id);
    await speak(word.cleanText, 0.75);

    // Mark as complete and advance
    setCompletedWords(prev => new Set([...prev, currentWordIndex]));

    if (currentWordIndex + 1 >= words.length) {
      setIsComplete(true);
      setIsAutoPlaying(false);
      setActiveWordId(null);
    } else {
      setCurrentWordIndex(prev => prev + 1);
      // Schedule next word
      autoPlayTimerRef.current = setTimeout(() => {
        playNextWord();
      }, SPEED_DELAYS[playSpeed]);
    }
  }, [isAutoPlaying, isComplete, currentWordIndex, words, speak, playSpeed]);

  // Start/stop auto-play
  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
      setActiveWordId(null);
    } else {
      setIsAutoPlaying(true);
    }
  }, [isAutoPlaying]);

  // Effect to handle auto-play
  useEffect(() => {
    if (isAutoPlaying && !isComplete) {
      playNextWord();
    }
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying]); // Only trigger on autoPlay toggle

  // Handle word tap
  const handleWordTap = useCallback((word: WordData, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Stop auto-play if running
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    }

    const isCurrentWord = word.index === currentWordIndex;
    const isCompletedWord = completedWords.has(word.index);

    setActiveWordId(word.id);
    setIsReviewMode(isCompletedWord && !isCurrentWord);

    // Speak the word if it's current or completed
    if (isCurrentWord || isCompletedWord) {
      speakWord(word.cleanText, true);

      // Complete if it's the current word
      if (isCurrentWord) {
        completeWord(word.index);
      }
    }

    // Clear active state after a moment
    setTimeout(() => {
      setActiveWordId(null);
      setIsReviewMode(false);
    }, 300);
  }, [isAutoPlaying, currentWordIndex, completedWords, speakWord, completeWord]);

  // Prevent context menu
  const preventContextMenu = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
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
        <p className="text-xs text-gray-400 mb-2">v{VERSION}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-700 text-center mb-4">
          {title || "WordFlow"}
        </h1>
        <p className="text-sky-600 text-center text-lg mb-8 max-w-md">
          Tap each word in order to hear it read aloud!
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
        <p className="text-xs text-gray-400 mb-2">v{VERSION}</p>
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
    <div
      className="flex min-h-screen flex-col bg-gradient-to-b from-sky-100 to-sky-50 select-none"
      onContextMenu={preventContextMenu}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <header className="flex-shrink-0 bg-white/90 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <p className="text-xs text-gray-400">v{VERSION}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-sky-700 text-center">
            {title || "WordFlow"}
          </h1>
          <div className="w-12"></div> {/* Spacer for centering */}
        </div>

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

        {/* Auto-play controls */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={toggleAutoPlay}
            className={`
              px-4 py-2 rounded-full font-semibold text-sm transition-all
              ${isAutoPlaying
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-green-500 text-white hover:bg-green-600"
              }
            `}
          >
            {isAutoPlaying ? "⏹ Stop" : "▶ Auto-Play"}
          </button>

          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            {(["slow", "medium", "fast"] as PlaySpeed[]).map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed)}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${playSpeed === speed
                    ? "bg-sky-500 text-white"
                    : "text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                {speed.charAt(0).toUpperCase() + speed.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Mode indicator */}
      {isReviewMode && (
        <div className="bg-blue-100 text-blue-700 text-center py-1 text-sm font-medium">
          Review Mode
        </div>
      )}

      {/* Reading Area */}
      <div
        className="flex-1 overflow-auto px-4 py-6"
        style={{ touchAction: "manipulation" }}
        onContextMenu={preventContextMenu}
      >
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-4 leading-relaxed">
            {words.map((word) => {
              const isActive = activeWordId === word.id;
              const isCurrentTarget = word.index === currentWordIndex;
              const isCompleted = completedWords.has(word.index);
              const isFuture = word.index > currentWordIndex;

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
                extraStyles = "opacity-60";
              }

              return (
                <span
                  key={word.id}
                  onPointerDown={(e) => handleWordTap(word, e)}
                  onContextMenu={preventContextMenu}
                  className={`
                    inline-block
                    text-2xl sm:text-3xl
                    px-3 py-2
                    rounded-xl
                    cursor-pointer
                    select-none
                    transition-all duration-150
                    active:scale-95
                    ${bgColor}
                    ${extraStyles}
                  `}
                  style={{
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                  }}
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
            {isAutoPlaying
              ? "Auto-playing... tap Stop to pause"
              : "Tap the yellow word to read it, or use Auto-Play"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
