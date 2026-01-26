"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  lookupPhonemes,
  phonemeToSpeakable,
  getBasePhoneme,
  getPhonemeDisplayName
} from "@/lib/cmu-dictionary";

const VERSION = "0.7.0";

interface WordFlowProps {
  text: string;
  title?: string;
}

interface PhonemeData {
  phoneme: string;
  display: string;
  sound: string;
}

interface WordData {
  id: string;
  index: number;
  text: string;
  cleanText: string;
  phonemes: PhonemeData[];
}

type PlaySpeed = "slow" | "medium" | "fast";

const SPEED_DELAYS: Record<PlaySpeed, number> = {
  slow: 1500,
  medium: 800,
  fast: 400,
};

// Word card with phoneme segments
function WordCard({
  word,
  isCurrentTarget,
  isCompleted,
  isFuture,
  onComplete,
  speechSynth,
  isSpeechReady,
}: {
  word: WordData;
  isCurrentTarget: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  onComplete: () => void;
  speechSynth: SpeechSynthesis | null;
  isSpeechReady: boolean;
}) {
  const [activePhonemeIndex, setActivePhonemeIndex] = useState(-1);
  const [completedPhonemes, setCompletedPhonemes] = useState<Set<number>>(new Set());

  // Reset when word changes
  useEffect(() => {
    setActivePhonemeIndex(-1);
    setCompletedPhonemes(new Set());
  }, [word.id, isCurrentTarget]);

  const speak = useCallback((text: string, rate: number = 0.7) => {
    if (!speechSynth || !isSpeechReady) return;
    speechSynth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    speechSynth.speak(utterance);
  }, [speechSynth, isSpeechReady]);

  const speakWholeWord = useCallback(() => {
    speak(word.cleanText, 0.75);
  }, [speak, word.cleanText]);

  const speakPhoneme = useCallback((phonemeData: PhonemeData) => {
    speak(phonemeData.sound, 0.5);
  }, [speak]);

  // Handle phoneme tap
  const handlePhonemeTap = useCallback((index: number) => {
    if (isFuture) return;

    const phoneme = word.phonemes[index];
    if (!phoneme) return;

    setActivePhonemeIndex(index);
    speakPhoneme(phoneme);

    // Mark as completed
    setCompletedPhonemes(prev => new Set([...prev, index]));

    // Clear active after a moment
    setTimeout(() => setActivePhonemeIndex(-1), 300);

    // If all phonemes completed, complete the word
    const newCompleted = new Set([...completedPhonemes, index]);
    if (newCompleted.size === word.phonemes.length && isCurrentTarget) {
      setTimeout(() => {
        speakWholeWord();
        onComplete();
      }, 400);
    }
  }, [isFuture, word.phonemes, speakPhoneme, completedPhonemes, isCurrentTarget, speakWholeWord, onComplete]);

  // Handle word tap (speak whole word)
  const handleWordTap = useCallback(() => {
    if (isFuture) return;
    speakWholeWord();
    if (isCurrentTarget) {
      // Mark all phonemes as complete
      setCompletedPhonemes(new Set(word.phonemes.map((_, i) => i)));
      onComplete();
    }
  }, [isFuture, speakWholeWord, isCurrentTarget, word.phonemes, onComplete]);

  // Colors
  let containerBg = "bg-gray-50 border-gray-200";
  let wordColor = "text-gray-400";

  if (isCompleted) {
    containerBg = "bg-green-50 border-green-300";
    wordColor = "text-green-700";
  } else if (isCurrentTarget) {
    containerBg = "bg-amber-50 border-amber-400 ring-2 ring-amber-300";
    wordColor = "text-amber-900";
  }

  return (
    <div className={`flex flex-col items-center m-2 p-3 rounded-xl border-2 ${containerBg} transition-all`}>
      {/* Word - tap for whole word */}
      <button
        onClick={handleWordTap}
        disabled={isFuture}
        className={`text-2xl sm:text-3xl font-semibold ${wordColor} mb-2 disabled:cursor-not-allowed`}
      >
        {word.text}
      </button>

      {/* Phoneme segments */}
      {word.phonemes.length > 0 ? (
        <div className="flex gap-1 flex-wrap justify-center">
          {word.phonemes.map((phoneme, idx) => {
            const isActive = activePhonemeIndex === idx;
            const isPhonemeCompleted = completedPhonemes.has(idx);

            let phonemeBg = "bg-gray-200 text-gray-500";
            if (isFuture) {
              phonemeBg = "bg-gray-100 text-gray-300";
            } else if (isActive) {
              phonemeBg = "bg-yellow-400 text-yellow-900 scale-110";
            } else if (isPhonemeCompleted) {
              phonemeBg = "bg-green-400 text-green-900";
            } else if (isCurrentTarget) {
              phonemeBg = "bg-amber-200 text-amber-800 hover:bg-amber-300";
            } else if (isCompleted) {
              phonemeBg = "bg-green-200 text-green-700";
            }

            return (
              <button
                key={idx}
                onClick={() => handlePhonemeTap(idx)}
                disabled={isFuture}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-bold
                  transition-all duration-150
                  disabled:cursor-not-allowed
                  ${phonemeBg}
                `}
              >
                {phoneme.display}
              </button>
            );
          })}
        </div>
      ) : (
        <span className="text-xs text-gray-400 italic">no phonemes</span>
      )}

      {/* Progress indicator */}
      {isCurrentTarget && word.phonemes.length > 0 && (
        <div className="flex gap-0.5 mt-2">
          {word.phonemes.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                completedPhonemes.has(idx) ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}

      {/* Hint */}
      {isCurrentTarget && completedPhonemes.size === 0 && (
        <p className="text-xs text-amber-500 mt-1">tap each sound or the word</p>
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

  // Parse words with phoneme data
  const words: WordData[] = text.split(/\s+/).filter(w => w.trim()).map((word, index) => {
    const cleanText = word.replace(/[.,!?;:'"()]/g, "").toLowerCase();
    const rawPhonemes = lookupPhonemes(cleanText) || [];
    const phonemes: PhonemeData[] = rawPhonemes.map(p => ({
      phoneme: p,
      display: getPhonemeDisplayName(p),
      sound: phonemeToSpeakable(p),
    }));
    return {
      id: `word-${index}`,
      index,
      text: word,
      cleanText,
      phonemes,
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
      // iOS initialization
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
  const autoPlayStep = useCallback(() => {
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
        <p className="text-amber-700 text-center mb-4 max-w-sm">
          Tap each sound button to hear it, then tap the word to hear it all together!
        </p>
        <div className="bg-amber-100 rounded-lg p-4 mb-6 max-w-sm">
          <p className="text-amber-800 text-sm text-center">
            <strong>Note:</strong> Browser voices can&apos;t perfectly pronounce individual sounds.
            For best results, use Amazon Polly in production.
          </p>
        </div>
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
          <p className="text-xs text-center text-gray-400 mt-0.5">
            {completedWords.size} / {words.length} words
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={toggleAutoPlay}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAutoPlaying ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            {isAutoPlaying ? "⏹ Stop" : "▶ Play All"}
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
              speechSynth={speechSynthRef.current}
              isSpeechReady={isSpeechReady}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t py-2 px-4">
        <div className="flex justify-center gap-4 text-xs text-gray-500">
          <span>🔘 tap sounds</span>
          <span>📖 tap word</span>
          <span>▶ auto-play</span>
        </div>
      </div>
    </div>
  );
}
