"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { lookupPhonemes, phonemeToSpeakable } from "@/lib/cmu-dictionary";

const VERSION = "0.6.0";

interface WordFlowProps {
  text: string;
  title?: string;
}

interface WordData {
  id: string;
  index: number;
  text: string;
  cleanText: string;
  phonemes: string[];
}

type PlaySpeed = "slow" | "medium" | "fast";

const SPEED_DELAYS: Record<PlaySpeed, number> = {
  slow: 1500,
  medium: 800,
  fast: 400,
};

// Individual word card with slider
function WordCard({
  word,
  isCurrentTarget,
  isCompleted,
  isFuture,
  onComplete,
  isSpeechReady,
  speechSynth,
}: {
  word: WordData;
  isCurrentTarget: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  onComplete: () => void;
  isSpeechReady: boolean;
  speechSynth: SpeechSynthesis | null;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderProgress, setSliderProgress] = useState(0);
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(-1);

  // Tracking for velocity
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const lastPhonemeSpokenRef = useRef(-1);

  const speak = useCallback((text: string, rate: number = 0.8) => {
    if (!speechSynth || !isSpeechReady) return;
    speechSynth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    speechSynth.speak(utterance);
  }, [speechSynth, isSpeechReady]);

  const speakPhoneme = useCallback((phoneme: string) => {
    const sound = phonemeToSpeakable(phoneme);
    speak(sound, 0.6);
  }, [speak]);

  const speakWord = useCallback(() => {
    speak(word.cleanText, 0.75);
  }, [speak, word.cleanText]);

  const getProgressFromEvent = useCallback((clientX: number): number => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, []);

  const handleDragStart = useCallback((clientX: number) => {
    if (isFuture) return; // Can't interact with future words

    setIsDragging(true);
    lastXRef.current = clientX;
    lastTimeRef.current = performance.now();
    lastPhonemeSpokenRef.current = -1;

    const progress = getProgressFromEvent(clientX);
    setSliderProgress(progress);
  }, [isFuture, getProgressFromEvent]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || isFuture) return;

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    const dx = Math.abs(clientX - lastXRef.current);

    if (dt > 0) {
      velocityRef.current = dx / dt; // px per ms
    }

    lastXRef.current = clientX;
    lastTimeRef.current = now;

    const progress = getProgressFromEvent(clientX);
    setSliderProgress(progress);

    // Determine which phoneme we're on
    if (word.phonemes.length > 0) {
      const phonemeIndex = Math.floor(progress * word.phonemes.length);
      const clampedIndex = Math.min(phonemeIndex, word.phonemes.length - 1);
      setCurrentPhonemeIndex(clampedIndex);

      // Slow drag = speak phonemes (velocity < 0.3 px/ms)
      if (velocityRef.current < 0.3 && clampedIndex !== lastPhonemeSpokenRef.current) {
        lastPhonemeSpokenRef.current = clampedIndex;
        speakPhoneme(word.phonemes[clampedIndex]);
      }
    }
  }, [isDragging, isFuture, getProgressFromEvent, word.phonemes, speakPhoneme]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // If we reached the end (>80%), complete the word
    if (sliderProgress > 0.8) {
      // Fast drag or reached end = speak whole word
      if (velocityRef.current >= 0.3 || word.phonemes.length === 0) {
        speakWord();
      }

      if (isCurrentTarget) {
        onComplete();
      }
    }

    // Reset after a moment
    setTimeout(() => {
      setSliderProgress(0);
      setCurrentPhonemeIndex(-1);
      lastPhonemeSpokenRef.current = -1;
    }, 300);
  }, [isDragging, sliderProgress, isCurrentTarget, onComplete, speakWord, word.phonemes.length]);

  // Pointer event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    handleDragEnd();
  }, [handleDragEnd]);

  // Tap to speak whole word
  const handleTap = useCallback(() => {
    if (isFuture) return;
    speakWord();
    if (isCurrentTarget) {
      onComplete();
    }
  }, [isFuture, speakWord, isCurrentTarget, onComplete]);

  // Determine colors
  let wordColor = "text-gray-400"; // Future
  let bgColor = "bg-gray-100";
  let sliderBg = "bg-gray-200";
  let sliderFill = "bg-gray-300";

  if (isCompleted) {
    wordColor = "text-green-700";
    bgColor = "bg-green-50";
    sliderBg = "bg-green-100";
    sliderFill = "bg-green-400";
  } else if (isCurrentTarget) {
    wordColor = "text-amber-900";
    bgColor = "bg-amber-50 ring-2 ring-amber-400";
    sliderBg = "bg-amber-100";
    sliderFill = "bg-amber-500";
  }

  if (isDragging) {
    bgColor = isCurrentTarget ? "bg-yellow-100 ring-2 ring-yellow-500" : "bg-blue-50";
    sliderFill = isCurrentTarget ? "bg-yellow-500" : "bg-blue-400";
  }

  return (
    <div
      className={`inline-flex flex-col items-center mx-1 my-2 p-2 rounded-lg transition-all ${bgColor}`}
      style={{ minWidth: "60px" }}
    >
      {/* Word */}
      <span
        className={`text-2xl sm:text-3xl font-medium ${wordColor} cursor-pointer select-none`}
        onClick={handleTap}
      >
        {word.text}
      </span>

      {/* Phoneme indicator */}
      {isDragging && word.phonemes.length > 0 && currentPhonemeIndex >= 0 && (
        <span className="text-xs text-amber-600 font-mono mt-1">
          {word.phonemes[currentPhonemeIndex]}
        </span>
      )}

      {/* Slider track */}
      <div
        ref={sliderRef}
        className={`w-full h-3 mt-2 rounded-full ${sliderBg} relative cursor-pointer touch-none`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        {/* Progress fill */}
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all ${sliderFill}`}
          style={{ width: `${sliderProgress * 100}%` }}
        />

        {/* Phoneme markers */}
        {word.phonemes.length > 1 && (
          <div className="absolute inset-0 flex">
            {word.phonemes.map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-white/30 last:border-r-0"
              />
            ))}
          </div>
        )}

        {/* Drag handle */}
        {isDragging && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-amber-500"
            style={{ left: `calc(${sliderProgress * 100}% - 8px)` }}
          />
        )}
      </div>

      {/* Hint for current word */}
      {isCurrentTarget && !isDragging && (
        <span className="text-xs text-amber-500 mt-1">slide →</span>
      )}
    </div>
  );
}

export default function WordFlow({ text, title }: WordFlowProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [isSpeechReady, setIsSpeechReady] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  // Sequential tracking
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  // Auto-play
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<PlaySpeed>("medium");
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentWordIndexRef = useRef(0);
  const isAutoPlayingRef = useRef(false);

  // Parse words
  const words: WordData[] = text.split(/\s+/).filter(w => w.trim()).map((word, index) => {
    const cleanText = word.replace(/[.,!?;:'"()]/g, "").toLowerCase();
    const phonemes = lookupPhonemes(cleanText) || [];
    return {
      id: `word-${index}`,
      index,
      text: word,
      cleanText,
      phonemes: phonemes.map(p => p.replace(/[0-2]$/, "")), // Remove stress markers
    };
  });

  const wordsRef = useRef(words);

  // Sync refs
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

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
    setIsAutoPlaying(false);
    isAutoPlayingRef.current = false;
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
  }, []);

  const completeWord = useCallback((index: number) => {
    setCompletedWords(prev => new Set([...prev, index]));
    if (index + 1 >= wordsRef.current.length) {
      setIsComplete(true);
      setIsAutoPlaying(false);
      isAutoPlayingRef.current = false;
    } else {
      setCurrentWordIndex(index + 1);
      currentWordIndexRef.current = index + 1;
    }
  }, []);

  // Auto-play
  const autoPlayStep = useCallback(async () => {
    if (!isAutoPlayingRef.current) return;

    const idx = currentWordIndexRef.current;
    const word = wordsRef.current[idx];
    if (!word || !speechSynthRef.current) return;

    speechSynthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(word.cleanText);
    utterance.rate = 0.75;

    utterance.onend = () => {
      if (!isAutoPlayingRef.current) return;

      completeWord(idx);

      if (currentWordIndexRef.current < wordsRef.current.length && isAutoPlayingRef.current) {
        autoPlayTimerRef.current = setTimeout(autoPlayStep, SPEED_DELAYS[playSpeed]);
      }
    };

    speechSynthRef.current.speak(utterance);
  }, [completeWord, playSpeed]);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      isAutoPlayingRef.current = false;
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      if (speechSynthRef.current) speechSynthRef.current.cancel();
    } else {
      setIsAutoPlaying(true);
      isAutoPlayingRef.current = true;
      autoPlayStep();
    }
  }, [isAutoPlaying, autoPlayStep]);

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 p-6">
        <p className="text-xs text-gray-400 mb-2">v{VERSION}</p>
        <h1 className="text-3xl font-bold text-amber-800 text-center mb-4">
          {title || "WordFlow"}
        </h1>
        <p className="text-amber-700 text-center mb-6 max-w-sm">
          Slide across each word to hear it. Go slow for letter sounds!
        </p>
        <button
          onClick={handleStart}
          className="bg-amber-500 active:bg-amber-600 text-white text-xl font-semibold px-8 py-4 rounded-2xl shadow-lg"
        >
          Tap to Start
        </button>
      </div>
    );
  }

  // Complete screen
  if (isComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50 p-6">
        <p className="text-xs text-gray-400 mb-2">v{VERSION}</p>
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-green-700 text-center mb-4">Great Job!</h1>
        <button
          onClick={handleReset}
          className="bg-green-500 active:bg-green-600 text-white text-xl font-semibold px-8 py-4 rounded-2xl shadow-lg"
        >
          Read Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-amber-50 select-none">
      {/* Header */}
      <header className="flex-shrink-0 bg-white shadow-sm px-4 py-2">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <p className="text-xs text-gray-400">v{VERSION}</p>
          <h1 className="text-lg font-bold text-amber-800">{title || "WordFlow"}</h1>
          <div className="w-10" />
        </div>

        {/* Progress */}
        <div className="mt-1 max-w-xs mx-auto">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(completedWords.size / words.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={toggleAutoPlay}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAutoPlaying ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            {isAutoPlaying ? "⏹ Stop" : "▶ Play"}
          </button>
          <div className="flex bg-gray-100 rounded-full p-0.5">
            {(["slow", "medium", "fast"] as PlaySpeed[]).map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed)}
                className={`px-2 py-1 rounded-full text-xs ${
                  playSpeed === speed ? "bg-amber-500 text-white" : "text-gray-500"
                }`}
              >
                {speed === "slow" ? "🐢" : speed === "medium" ? "🚶" : "🏃"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Words */}
      <div className="flex-1 overflow-auto px-2 py-4">
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center">
          {words.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              isCurrentTarget={word.index === currentWordIndex}
              isCompleted={completedWords.has(word.index)}
              isFuture={word.index > currentWordIndex}
              onComplete={() => completeWord(word.index)}
              isSpeechReady={isSpeechReady}
              speechSynth={speechSynthRef.current}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white/80 text-center py-2">
        <p className="text-amber-600 text-sm">
          Slide the bar under each word. Slow = sounds, Fast = whole word
        </p>
      </div>
    </div>
  );
}
