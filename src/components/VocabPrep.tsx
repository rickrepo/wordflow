'use client';

import { useState, useEffect } from 'react';
import { type Story, type GradeLevel } from '@/lib/stories';
import { useSpeech } from '@/lib/useSpeech';
import StoryScene from './illustrations/StoryScene';

interface VocabPrepProps {
  story: Story;
  gradeLevel: GradeLevel;
  onComplete: () => void;
  onBack: () => void;
}

// Extract unique words from story that might be challenging
function getKeyWords(story: Story, gradeLevel: GradeLevel): string[] {
  const allText = story.pages.join(' ');
  const words = allText.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase());
  const uniqueWords = [...new Set(words)].filter(w => w.length > 0);

  // Filter based on grade level - longer words are harder
  const minLength = gradeLevel === 'jk' ? 3 : gradeLevel === 'sk' ? 3 : gradeLevel === 'grade1' ? 4 : 5;

  // Get challenging words (longer ones, excluding common sight words)
  const sightWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'it', 'he', 'she', 'they', 'we', 'you', 'i', 'my', 'his', 'her', 'its', 'our', 'your', 'this', 'that', 'these', 'those'];

  const challenging = uniqueWords
    .filter(w => w.length >= minLength && !sightWords.includes(w))
    .slice(0, 6); // Max 6 vocab words

  return challenging;
}

export default function VocabPrep({ story, gradeLevel, onComplete, onBack }: VocabPrepProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showSpeakAnimation, setShowSpeakAnimation] = useState(false);

  const { speak, isSpeaking, hasAudio } = useSpeech();
  const vocabWords = getKeyWords(story, gradeLevel);

  // If no vocab words, skip directly to story
  useEffect(() => {
    if (vocabWords.length === 0) {
      onComplete();
    }
  }, [vocabWords.length, onComplete]);

  const currentWord = vocabWords[currentWordIndex];
  const wordHasAudio = currentWord ? hasAudio(currentWord) : false;

  // Auto-play word when it appears (if audio exists)
  useEffect(() => {
    if (currentWord && hasAudio(currentWord)) {
      const timer = setTimeout(() => {
        speak(currentWord);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentWordIndex, currentWord, hasAudio, speak]);

  const handlePlayWord = () => {
    if (currentWord && wordHasAudio) {
      setShowSpeakAnimation(true);
      speak(currentWord);
      setTimeout(() => setShowSpeakAnimation(false), 1000);
    }
  };

  const handleNext = () => {
    if (currentWordIndex < vocabWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (vocabWords.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Story scene background */}
      <StoryScene storyId={story.id} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-gray-100 relative z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-2xl">{story.coverEmoji}</span>
          <div className="text-center">
            <h1 className="text-sm font-semibold text-gray-800 leading-tight">New Words</h1>
            <p className="text-xs text-gray-400">{story.title}</p>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          Skip
        </button>
      </header>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-4 relative z-10">
        {vocabWords.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentWordIndex
                ? 'w-8 bg-blue-500'
                : i < currentWordIndex
                  ? 'w-2 bg-green-400'
                  : 'w-2 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Main content - Simple word display */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Word card - simple and clean */}
          <div
            className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={handleNext}
          >
            {/* Word number */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-400 text-sm">
                {currentWordIndex + 1} / {vocabWords.length}
              </span>
              {wordHasAudio && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayWord();
                  }}
                  disabled={isSpeaking}
                  className={`p-3 rounded-full transition-all ${
                    isSpeaking
                      ? 'bg-blue-100 text-blue-400'
                      : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-110 active:scale-95'
                  }`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </button>
              )}
            </div>

            {/* The word - BIG and clear */}
            <h2 className={`text-6xl md:text-7xl font-bold text-gray-800 mb-8 transition-transform ${showSpeakAnimation ? 'scale-110' : ''}`}>
              {currentWord}
            </h2>

            {/* Sound waves animation when speaking */}
            {isSpeaking && (
              <div className="flex justify-center gap-1 mb-6">
                <div className="w-1 h-4 bg-blue-400 rounded-full animate-sound-wave" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-6 bg-blue-500 rounded-full animate-sound-wave" style={{ animationDelay: '100ms' }} />
                <div className="w-1 h-8 bg-blue-400 rounded-full animate-sound-wave" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-6 bg-blue-500 rounded-full animate-sound-wave" style={{ animationDelay: '300ms' }} />
                <div className="w-1 h-4 bg-blue-400 rounded-full animate-sound-wave" style={{ animationDelay: '400ms' }} />
              </div>
            )}

            {/* Tap hint */}
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <span>Tap anywhere for next word</span>
              <svg className="w-5 h-5 animate-bounce-x" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* No audio notice */}
          {!wordHasAudio && (
            <p className="text-center text-gray-400 text-sm mt-4">
              No audio for this word.{' '}
              <a href="/admin" className="text-blue-500 hover:underline">Add in Admin</a>
            </p>
          )}
        </div>
      </main>

      {/* Bottom action */}
      <div className="p-4 relative z-10">
        <button
          onClick={handleNext}
          className="w-full max-w-md mx-auto block py-4 bg-blue-500 text-white rounded-2xl font-semibold text-lg hover:bg-blue-600 transition-colors shadow-lg"
        >
          {currentWordIndex < vocabWords.length - 1 ? 'Next →' : 'Start Reading! 📖'}
        </button>
      </div>

      <style jsx>{`
        @keyframes sound-wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.5); }
        }
        .animate-sound-wave {
          animation: sound-wave 0.4s ease-in-out infinite;
        }
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
