"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { lookupPhonemes } from "@/lib/cmu-dictionary";

const VERSION = "0.5.0";

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
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [isSpeechReady, setIsSpeechReady] = useState(false);

  // Sequential tracking
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  // Auto-play
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<PlaySpeed>("medium");

  // Refs to avoid stale closures
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const currentWordIndexRef = useRef(0);
  const isAutoPlayingRef = useRef(false);
  const isCompleteRef = useRef(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const wordsRef = useRef(words);

  // Keep refs in sync
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);

  // Initialize speech
  const initializeSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance("");
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      setIsSpeechReady(true);
    }
  }, []);

  const handleStart = useCallback(() => {
    initializeSpeech();
    setIsStarted(true);
  }, [initializeSpeech]);

  const handleReset = useCallback(() => {
    setCurrentWordIndex(0);
    currentWordIndexRef.current = 0;
    setCompletedWords(new Set());
    setIsComplete(false);
    isCompleteRef.current = false;
    setActiveWordIndex(null);
    setIsAutoPlaying(false);
    isAutoPlayingRef.current = false;
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
    }
  }, []);

  // Speak and return promise
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

  // Complete word and advance
  const completeWordAt = useCallback((index: number) => {
    setCompletedWords(prev => new Set([...prev, index]));
    if (index + 1 >= wordsRef.current.length) {
      setIsComplete(true);
      isCompleteRef.current = true;
      setIsAutoPlaying(false);
      isAutoPlayingRef.current = false;
    } else {
      setCurrentWordIndex(index + 1);
      currentWordIndexRef.current = index + 1;
    }
  }, []);

  // Auto-play one word then schedule next
  const autoPlayStep = useCallback(async () => {
    if (!isAutoPlayingRef.current || isCompleteRef.current) return;

    const idx = currentWordIndexRef.current;
    const word = wordsRef.current[idx];
    if (!word) return;

    setActiveWordIndex(idx);
    await speak(word.cleanText, 0.75);

    if (!isAutoPlayingRef.current) return; // Stopped during speech

    completeWordAt(idx);
    setActiveWordIndex(null);

    if (currentWordIndexRef.current < wordsRef.current.length && isAutoPlayingRef.current) {
      autoPlayTimerRef.current = setTimeout(autoPlayStep, SPEED_DELAYS[playSpeed]);
    }
  }, [speak, completeWordAt, playSpeed]);

  // Toggle auto-play
  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      isAutoPlayingRef.current = false;
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
      setActiveWordIndex(null);
    } else {
      setIsAutoPlaying(true);
      isAutoPlayingRef.current = true;
      autoPlayStep();
    }
  }, [isAutoPlaying, autoPlayStep]);

  // Handle word tap
  const handleWordTap = useCallback((word: WordData) => {
    // Stop auto-play
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      isAutoPlayingRef.current = false;
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    }

    const isCurrentWord = word.index === currentWordIndex;
    const isCompletedWord = completedWords.has(word.index);

    if (isCurrentWord || isCompletedWord) {
      setActiveWordIndex(word.index);
      speak(word.cleanText, 0.75);

      if (isCurrentWord) {
        completeWordAt(word.index);
      }

      setTimeout(() => setActiveWordIndex(null), 400);
    }
  }, [isAutoPlaying, currentWordIndex, completedWords, speak, completeWordAt]);

  // Prevent context menu
  const preventContextMenu = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      if (speechSynthRef.current) speechSynthRef.current.cancel();
    };
  }, []);

  // Start screen
  if (!isStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 p-8">
        <p className="text-xs text-gray-400 mb-2">v{VERSION}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-800 text-center mb-4">
          {title || "WordFlow"}
        </h1>
        <p className="text-amber-700 text-center text-lg mb-8 max-w-md">
          Tap each word in order to hear it read aloud!
        </p>
        <button
          onClick={handleStart}
          className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xl font-semibold px-8 py-4 rounded-2xl shadow-lg"
        >
          Tap to Start
        </button>
      </div>
    );
  }

  // Completion screen
  if (isComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50 p-8">
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
          className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xl font-semibold px-8 py-4 rounded-2xl shadow-lg"
        >
          Read Again
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-amber-50 select-none"
      onContextMenu={preventContextMenu}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
    >
      {/* Header */}
      <header className="flex-shrink-0 bg-white shadow-sm px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <p className="text-xs text-gray-400">v{VERSION}</p>
          <h1 className="text-lg sm:text-xl font-bold text-amber-800">
            {title || "WordFlow"}
          </h1>
          <div className="w-10" />
        </div>

        {/* Progress */}
        <div className="mt-2 max-w-xs mx-auto">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(completedWords.size / words.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-center text-gray-400 mt-1">
            {completedWords.size} / {words.length}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={toggleAutoPlay}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isAutoPlaying
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {isAutoPlaying ? "⏹ Stop" : "▶ Play"}
          </button>
          <div className="flex bg-gray-100 rounded-full p-0.5">
            {(["slow", "medium", "fast"] as PlaySpeed[]).map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed)}
                className={`px-2 py-1 rounded-full text-xs transition-all ${
                  playSpeed === speed
                    ? "bg-amber-500 text-white"
                    : "text-gray-500"
                }`}
              >
                {speed === "slow" ? "🐢" : speed === "medium" ? "🚶" : "🏃"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Book content */}
      <div
        className="flex-1 overflow-auto px-4 py-6"
        style={{ touchAction: "manipulation" }}
        onContextMenu={preventContextMenu}
      >
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 sm:p-8">
          <p className="text-2xl sm:text-3xl leading-relaxed text-gray-800" style={{ lineHeight: "2" }}>
            {words.map((word, idx) => {
              const isActive = activeWordIndex === idx;
              const isCurrent = idx === currentWordIndex;
              const isCompleted = completedWords.has(idx);
              const isFuture = idx > currentWordIndex;

              let style: React.CSSProperties = {};
              let className = "cursor-pointer transition-colors duration-150 ";

              if (isActive) {
                style.backgroundColor = "#fef08a"; // yellow-200
                style.borderRadius = "4px";
                style.padding = "0 2px";
                style.margin = "0 -2px";
              } else if (isCurrent) {
                style.backgroundColor = "#fef9c3"; // yellow-100
                style.borderRadius = "4px";
                style.padding = "0 2px";
                style.margin = "0 -2px";
                style.textDecoration = "underline";
                style.textDecorationColor = "#f59e0b"; // amber-500
                style.textUnderlineOffset = "4px";
              } else if (isCompleted) {
                style.color = "#16a34a"; // green-600
              } else if (isFuture) {
                style.color = "#9ca3af"; // gray-400
              }

              return (
                <span key={word.id}>
                  <span
                    onClick={() => handleWordTap(word)}
                    onContextMenu={preventContextMenu}
                    style={style}
                    className={className}
                  >
                    {word.text}
                  </span>
                  {idx < words.length - 1 && " "}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
