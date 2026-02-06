'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Story, gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { getPhoneticHelp, getSyllables } from '@/lib/phonetics';

interface VocabPrepProps {
  story: Story;
  gradeLevel: GradeLevel;
  onComplete: () => void;
  onBack: () => void;
}

interface VocabWord {
  word: string;
  phonetic: string;
  syllables: string[];
  learned: boolean;
}

// Extract unique challenging words from story
function extractVocabWords(story: Story, gradeLevel: GradeLevel): VocabWord[] {
  const allText = story.pages.join(' ');
  const words = allText.toLowerCase().match(/[a-z]+/g) || [];
  const uniqueWords = [...new Set(words)];

  // Filter to words that have phonetic data and are 4+ letters (challenging)
  const minLength = gradeLevel === 'jk' ? 3 : gradeLevel === 'sk' ? 4 : 5;

  const vocabWords = uniqueWords
    .filter(word => {
      const help = getPhoneticHelp(word);
      return help && word.length >= minLength;
    })
    .slice(0, 6) // Max 6 words to learn
    .map(word => {
      const help = getPhoneticHelp(word);
      return {
        word,
        phonetic: help?.phonetic || word,
        syllables: getSyllables(word),
        learned: false,
      };
    });

  return vocabWords;
}

export default function VocabPrep({ story, gradeLevel, onComplete, onBack }: VocabPrepProps) {
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPhonetic, setShowPhonetic] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [allComplete, setAllComplete] = useState(false);

  const gradeInfo = gradeLevelInfo[gradeLevel];

  useEffect(() => {
    setVocabWords(extractVocabWords(story, gradeLevel));
  }, [story, gradeLevel]);

  const currentWord = vocabWords[currentIndex];
  const learnedCount = vocabWords.filter(w => w.learned).length;

  const handleTapWord = useCallback(() => {
    if (!showPhonetic) {
      setShowPhonetic(true);
    } else if (!currentWord?.learned) {
      // Mark as learned and celebrate
      setCelebrating(true);
      setVocabWords(prev => prev.map((w, i) =>
        i === currentIndex ? { ...w, learned: true } : w
      ));

      setTimeout(() => {
        setCelebrating(false);
        setShowPhonetic(false);

        // Check if all words learned
        const newLearnedCount = learnedCount + 1;
        if (newLearnedCount >= vocabWords.length) {
          setAllComplete(true);
        } else {
          // Move to next unlearned word
          const nextIndex = vocabWords.findIndex((w, i) => i > currentIndex && !w.learned);
          if (nextIndex !== -1) {
            setCurrentIndex(nextIndex);
          } else {
            const firstUnlearned = vocabWords.findIndex(w => !w.learned);
            if (firstUnlearned !== -1) {
              setCurrentIndex(firstUnlearned);
            }
          }
        }
      }, 1000);
    }
  }, [showPhonetic, currentWord, currentIndex, learnedCount, vocabWords.length]);

  const handleWordSelect = (index: number) => {
    if (!vocabWords[index].learned) {
      setCurrentIndex(index);
      setShowPhonetic(false);
    }
  };

  if (vocabWords.length === 0) {
    // No vocab words needed, skip to reading
    onComplete();
    return null;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradeInfo.bgGradient} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Word Power!</h1>
          <p className="text-white/80 text-sm">Learn these words first</p>
        </div>

        <div className="text-white font-bold text-lg">
          {learnedCount}/{vocabWords.length} ⭐
        </div>
      </div>

      {/* Progress stars */}
      <div className="flex justify-center gap-2 py-4">
        {vocabWords.map((word, i) => (
          <button
            key={i}
            onClick={() => handleWordSelect(i)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300
              ${word.learned
                ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50 scale-110'
                : i === currentIndex
                  ? 'bg-white/30 ring-4 ring-white scale-110'
                  : 'bg-white/20 hover:bg-white/30'}`}
          >
            {word.learned ? '⭐' : '○'}
          </button>
        ))}
      </div>

      {/* Main word display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {allComplete ? (
          // All words learned celebration
          <div className="text-center animate-bounce-in">
            <div className="text-8xl mb-6 animate-wiggle">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4">Amazing!</h2>
            <p className="text-xl text-white/90 mb-8">You learned all the words!</p>
            <button
              onClick={onComplete}
              className="py-4 px-8 rounded-full bg-white text-gray-800 font-bold text-xl shadow-2xl hover:scale-105 transition-transform"
            >
              📖 Start Reading!
            </button>
          </div>
        ) : currentWord ? (
          // Current word to learn
          <div
            onClick={handleTapWord}
            className="cursor-pointer select-none"
          >
            {/* Word card */}
            <div className={`
              bg-white rounded-3xl p-8 md:p-12 shadow-2xl
              transform transition-all duration-300
              ${celebrating ? 'scale-110 rotate-2' : 'hover:scale-105'}
              min-w-[300px] md:min-w-[400px]
            `}>
              {/* Celebration particles */}
              {celebrating && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-confetti"
                      style={{
                        left: Math.random() * 100 + '%',
                        top: '50%',
                        width: '10px',
                        height: '10px',
                        backgroundColor: ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF'][i % 4],
                        borderRadius: '50%',
                        animationDelay: Math.random() * 0.3 + 's',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Word */}
              <div className="text-center relative">
                <div className={`text-5xl md:text-7xl font-bold mb-4 transition-all duration-300
                  ${celebrating ? 'text-yellow-500' : 'text-gray-800'}`}
                >
                  {currentWord.word}
                </div>

                {/* Phonetic breakdown */}
                {showPhonetic && (
                  <div className="animate-fade-in-up">
                    <div className="text-3xl md:text-4xl text-purple-600 font-bold mb-2">
                      {currentWord.syllables.map((syl, i) => (
                        <span key={i}>
                          <span className="inline-block animate-bounce-slow" style={{ animationDelay: `${i * 0.1}s` }}>
                            {syl}
                          </span>
                          {i < currentWord.syllables.length - 1 && (
                            <span className="text-purple-300 mx-2">·</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="text-xl text-gray-500">
                      Say it: <span className="font-bold text-purple-600">{currentWord.phonetic}</span>
                    </div>
                  </div>
                )}

                {/* Tap instruction */}
                {!showPhonetic && (
                  <div className="text-gray-400 animate-pulse mt-4">
                    👆 Tap to see how to say it!
                  </div>
                )}

                {showPhonetic && !celebrating && (
                  <div className="text-green-500 font-bold mt-4 animate-pulse">
                    👆 Tap again when you know it!
                  </div>
                )}

                {celebrating && (
                  <div className="text-yellow-500 font-bold text-2xl mt-4 animate-bounce">
                    ⭐ Great job! ⭐
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Skip option */}
      {!allComplete && (
        <div className="p-4 text-center">
          <button
            onClick={onComplete}
            className="text-white/60 hover:text-white/80 underline text-sm"
          >
            Skip and start reading →
          </button>
        </div>
      )}
    </div>
  );
}
