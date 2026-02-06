'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { type Story, gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { getPhoneticHelp, getSyllables, getAgeAppropriateHint } from '@/lib/phonetics';
import { calculatePageStars, recordPageComplete, loadProgress, type GameProgress } from '@/lib/gameState';
import { getStoryScene, positionClasses, sizeClasses, animationClasses, type SceneElement } from '@/lib/storyScenes';

interface StoryReaderProps {
  story: Story;
  gradeLevel: GradeLevel;
  onBack: () => void;
  onComplete: (starsEarned: number) => void;
}

interface WordState {
  word: string;
  cleanWord: string;
  punctuation: string;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  visitCount: number;
  isStruggling: boolean;
}

const STRUGGLE_THRESHOLD = 3;

export default function StoryReader({ story, gradeLevel, onBack, onComplete }: StoryReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [pageComplete, setPageComplete] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [totalStarsThisBook, setTotalStarsThisBook] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const gradeInfo = gradeLevelInfo[gradeLevel];
  const pageText = story.pages[currentPage];
  const totalPages = story.pages.length;
  const isLastPage = currentPage === totalPages - 1;
  const scene = getStoryScene(story.id);

  // Render a scene element
  const renderSceneElement = (element: SceneElement, index: number) => (
    <div
      key={index}
      className={`
        fixed pointer-events-none select-none z-0
        ${positionClasses[element.position]}
        ${sizeClasses[element.size]}
        ${animationClasses[element.animation]}
        transition-opacity duration-1000
      `}
      style={{
        opacity: element.opacity,
        animationDelay: `${element.delay}s`,
      }}
    >
      {element.emoji}
    </div>
  );

  // Load progress on mount
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // Parse words from current page
  useEffect(() => {
    const words = pageText.split(/\s+/).filter(w => w.length > 0);
    setWordStates(words.map((word, index) => ({
      word,
      cleanWord: word.replace(/[^a-zA-Z]/g, ''),
      punctuation: word.replace(/[a-zA-Z]/g, ''),
      index,
      isActive: false,
      isCompleted: false,
      visitCount: 0,
      isStruggling: false,
    })));
    setActiveWordIndex(null);
    setPageComplete(false);
    setShowCelebration(false);
    setStarsEarned(0);
    wordRefs.current = [];
  }, [pageText, currentPage]);

  // Check page completion
  useEffect(() => {
    if (wordStates.length > 0 && wordStates.every(w => w.isCompleted) && !pageComplete) {
      const struggledCount = wordStates.filter(w => w.isStruggling).length;
      const stars = calculatePageStars(wordStates.length, wordStates.length, struggledCount);
      setStarsEarned(stars);
      setPageComplete(true);

      // Delay celebration slightly for smooth UX
      setTimeout(() => {
        setShowCelebration(true);
        if (progress) {
          setProgress(recordPageComplete(progress, stars));
        }
      }, 400);
    }
  }, [wordStates, pageComplete, progress]);

  // Handle pointer movement
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || showHelp || showCelebration) return;

    const y = e.clientY - 50;
    const x = e.clientX;

    let foundIndex: number | null = null;

    wordRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      if (x >= rect.left - 10 && x <= rect.right + 10 &&
          y >= rect.top - 20 && y <= rect.bottom + 20) {
        foundIndex = index;
      }
    });

    if (foundIndex !== null && foundIndex !== activeWordIndex) {
      setActiveWordIndex(foundIndex);
      setWordStates(prev => prev.map((ws, i) => {
        if (i === foundIndex) {
          const newVisitCount = ws.visitCount + 1;
          return {
            ...ws,
            isActive: true,
            visitCount: newVisitCount,
            isStruggling: newVisitCount >= STRUGGLE_THRESHOLD,
            isCompleted: true,
          };
        }
        return { ...ws, isActive: false };
      }));
    } else if (foundIndex === null && activeWordIndex !== null) {
      setActiveWordIndex(null);
      setWordStates(prev => prev.map(ws => ({ ...ws, isActive: false })));
    }
  }, [activeWordIndex, showHelp, showCelebration]);

  // Word tap for help
  const handleWordTap = (index: number) => {
    const ws = wordStates[index];
    if (ws.visitCount >= 2 || ws.isStruggling) {
      setShowHelp(ws.cleanWord);
    }
  };

  // Navigation
  const handleNextPage = () => {
    setTotalStarsThisBook(prev => prev + starsEarned);
    setShowCelebration(false);

    if (isLastPage) {
      onComplete(totalStarsThisBook + starsEarned);
    } else {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Render word
  const renderWord = (ws: WordState, index: number) => (
    <span
      key={index}
      ref={el => { wordRefs.current[index] = el; }}
      onClick={() => handleWordTap(index)}
      className={`
        inline-block px-2 py-1 mx-0.5 my-1 rounded-lg cursor-pointer select-none
        transition-all duration-150 ease-out
        text-2xl md:text-3xl lg:text-4xl
        ${ws.isActive
          ? 'bg-blue-500 text-white scale-105 shadow-lg'
          : ws.isCompleted
            ? 'bg-blue-50 text-gray-800'
            : 'text-gray-400'}
      `}
    >
      {ws.cleanWord}{ws.punctuation}
      {ws.isStruggling && !ws.isActive && (
        <span className="absolute -top-1 -right-1 text-sm">💡</span>
      )}
    </span>
  );

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className={`min-h-screen bg-gradient-to-b ${scene.bgFrom} ${scene.bgVia || ''} ${scene.bgTo} flex flex-col relative overflow-hidden`}
      style={{ touchAction: 'none' }}
    >
      {/* Immersive scene elements */}
      {scene.elements.map((element, index) => renderSceneElement(element, index))}
      {/* Clean header */}
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
            <h1 className="text-sm font-semibold text-gray-800 leading-tight">{story.title}</h1>
            <p className="text-xs text-gray-400">Page {currentPage + 1} of {totalPages}</p>
          </div>
        </div>

        {/* Stars collected */}
        <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
          <span className="text-amber-500">⭐</span>
          <span className="text-sm font-semibold text-amber-700">{progress?.totalStars || 0}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100/50 relative z-10">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${((currentPage + (pageComplete ? 1 : 0)) / totalPages) * 100}%` }}
        />
      </div>

      {/* Main reading area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10">
        <div className="w-full max-w-3xl">
          {/* Text container */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 md:p-10">
            <p className="text-center leading-relaxed font-medium">
              {wordStates.map((ws, i) => renderWord(ws, i))}
            </p>
          </div>

          {/* Instruction */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Slide your finger under each word as you read
          </p>
        </div>
      </main>

      {/* Footer with page dots */}
      <footer className="px-6 py-4 flex justify-center relative z-10">
        <div className="flex gap-1.5">
          {story.pages.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentPage
                  ? 'w-6 bg-blue-500'
                  : i < currentPage
                    ? 'w-1.5 bg-blue-300'
                    : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </footer>

      {/* Help modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHelp(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-gray-800">
                {getSyllables(showHelp).map((syl, i) => (
                  <span key={i}>
                    <span className="text-blue-500">{syl}</span>
                    {i < getSyllables(showHelp).length - 1 && (
                      <span className="text-gray-300 mx-1">·</span>
                    )}
                  </span>
                ))}
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-blue-400 mb-1">Say it like</p>
              <p className="text-xl font-semibold text-blue-600">
                {getAgeAppropriateHint(showHelp, gradeLevel)}
              </p>
            </div>

            {getPhoneticHelp(showHelp)?.hint && (
              <p className="text-center text-gray-500 text-sm mb-4">
                💡 {getPhoneticHelp(showHelp)?.hint}
              </p>
            )}

            <button
              onClick={() => setShowHelp(null)}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Page completion celebration */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-bounce-in">
            {/* Stars earned */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map(n => (
                <span
                  key={n}
                  className={`text-4xl transition-all duration-300 ${
                    n <= starsEarned ? 'opacity-100 scale-100' : 'opacity-20 scale-75'
                  }`}
                  style={{ animationDelay: `${n * 100}ms` }}
                >
                  ⭐
                </span>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {starsEarned === 3 ? 'Perfect!' : starsEarned === 2 ? 'Great job!' : 'Good work!'}
            </h2>
            <p className="text-gray-500 mb-6">
              You earned {starsEarned} {starsEarned === 1 ? 'star' : 'stars'}!
            </p>

            <button
              onClick={handleNextPage}
              className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-600 transition-colors"
            >
              {isLastPage ? 'Finish Book 🎉' : 'Next Page →'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
