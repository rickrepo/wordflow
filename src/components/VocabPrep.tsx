'use client';

import { useState, useEffect } from 'react';
import { type Story, gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { getSyllables, getAgeAppropriateHint } from '@/lib/phonetics';
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
  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const gradeInfo = gradeLevelInfo[gradeLevel];
  const vocabWords = getKeyWords(story, gradeLevel);

  // If no vocab words, skip directly to story
  useEffect(() => {
    if (vocabWords.length === 0) {
      onComplete();
    }
  }, [vocabWords.length, onComplete]);

  const currentWord = vocabWords[currentWordIndex];
  const syllables = currentWord ? getSyllables(currentWord) : [];
  const hint = currentWord ? getAgeAppropriateHint(currentWord, gradeLevel) : '';

  const handleRevealWord = () => {
    setRevealedWords(prev => new Set(prev).add(currentWordIndex));
  };

  const handleNextWord = () => {
    if (currentWordIndex < vocabWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleStartReading = () => {
    onComplete();
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
            <h1 className="text-sm font-semibold text-gray-800 leading-tight">Word Practice</h1>
            <p className="text-xs text-gray-400">{story.title}</p>
          </div>
        </div>

        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-4 relative z-10">
        {vocabWords.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentWordIndex
                ? 'w-8 bg-blue-500'
                : i < currentWordIndex || revealedWords.has(i)
                  ? 'w-2 bg-blue-300'
                  : 'w-2 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10">
        {!isComplete ? (
          <div className="w-full max-w-md">
            {/* Word card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
              <p className="text-gray-400 text-sm mb-4">
                Word {currentWordIndex + 1} of {vocabWords.length}
              </p>

              {/* The word */}
              <div className="mb-6">
                <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
                  {currentWord}
                </h2>

                {/* Syllable breakdown */}
                {revealedWords.has(currentWordIndex) && (
                  <div className="animate-fade-in">
                    <p className="text-2xl font-medium text-gray-600 mb-2">
                      {syllables.map((syl, i) => (
                        <span key={i}>
                          <span className="text-blue-500">{syl}</span>
                          {i < syllables.length - 1 && (
                            <span className="text-gray-300 mx-1">·</span>
                          )}
                        </span>
                      ))}
                    </p>

                    {/* Pronunciation hint */}
                    <div className="bg-blue-50 rounded-xl p-4 mt-4">
                      <p className="text-xs text-blue-400 mb-1">Say it like</p>
                      <p className="text-xl font-semibold text-blue-600">{hint}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!revealedWords.has(currentWordIndex) ? (
                <button
                  onClick={handleRevealWord}
                  className="w-full py-4 bg-amber-500 text-white rounded-xl font-semibold text-lg hover:bg-amber-600 transition-colors"
                >
                  Show Me How to Say It
                </button>
              ) : (
                <button
                  onClick={handleNextWord}
                  className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-600 transition-colors"
                >
                  {currentWordIndex < vocabWords.length - 1 ? 'Next Word →' : 'Ready to Read!'}
                </button>
              )}
            </div>

            {/* Encouragement */}
            <p className="text-center text-gray-500 text-sm mt-6">
              Learning these words will help you read the story!
            </p>
          </div>
        ) : (
          /* Completion screen */
          <div className="w-full max-w-md text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8">
              <div className="text-6xl mb-4">🌟</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Great Job!</h2>
              <p className="text-gray-500 mb-6">
                You practiced {vocabWords.length} new words!
              </p>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {vocabWords.map((word, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>

              <button
                onClick={handleStartReading}
                className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold text-lg hover:bg-green-600 transition-colors"
              >
                Start Reading! 📖
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
