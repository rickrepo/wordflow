'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { type Story, gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { getPhoneticHelp, getSyllables, getAgeAppropriateHint } from '@/lib/phonetics';

interface StoryWorldProps {
  story: Story;
  gradeLevel: GradeLevel;
  onBack: () => void;
  onComplete: () => void;
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

// Scene elements based on story content keywords
const sceneElements: Record<string, string[]> = {
  cat: ['🐱', '🧶', '🐾'],
  dog: ['🐕', '🦴', '🐾'],
  ball: ['⚽', '🎾', '🏀'],
  frog: ['🐸', '🪷', '💧'],
  fish: ['🐟', '🐠', '🫧'],
  sun: ['☀️', '🌤️', '⛅'],
  dragon: ['🐉', '🔥', '⚔️'],
  rainbow: ['🌈', '☁️', '✨'],
  puppy: ['🐶', '🦴', '❤️'],
  space: ['🚀', '🌟', '🪐'],
  ocean: ['🌊', '🐚', '🦀'],
  tree: ['🌳', '🍃', '🌲'],
  forest: ['🌲', '🦌', '🍄'],
  bird: ['🐦', '🪺', '🌸'],
  star: ['⭐', '🌟', '✨'],
  moon: ['🌙', '⭐', '🌠'],
  flower: ['🌸', '🌺', '🌻'],
  garden: ['🌷', '🦋', '🌻'],
  castle: ['🏰', '👑', '⚔️'],
  princess: ['👸', '👑', '🏰'],
  robot: ['🤖', '⚙️', '💡'],
  school: ['🏫', '📚', '✏️'],
  mystery: ['🔍', '🔎', '❓'],
};

// Get scene decorations based on story title
function getSceneDecorations(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  for (const [keyword, emojis] of Object.entries(sceneElements)) {
    if (lowerTitle.includes(keyword)) {
      return emojis;
    }
  }
  return ['✨', '🌟', '💫'];
}

const STRUGGLE_THRESHOLD = 3;

export default function StoryWorld({ story, gradeLevel, onBack, onComplete }: StoryWorldProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [showPageComplete, setShowPageComplete] = useState(false);
  const [helpWord, setHelpWord] = useState<{ word: string; index: number } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const gradeInfo = gradeLevelInfo[gradeLevel];
  const pageText = story.pages[currentPage];
  const totalPages = story.pages.length;
  const decorations = getSceneDecorations(story.title);

  // Parse words from current page
  useEffect(() => {
    const words = pageText.split(/\s+/).filter(w => w.length > 0);
    setWordStates(words.map((word, index) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      const punctuation = word.replace(/[a-zA-Z]/g, '');
      return {
        word,
        cleanWord,
        punctuation,
        index,
        isActive: false,
        isCompleted: false,
        visitCount: 0,
        isStruggling: false,
      };
    }));
    setActiveWordIndex(null);
    setShowPageComplete(false);
    setHelpWord(null);
    wordRefs.current = [];
  }, [pageText, currentPage]);

  // Check if page is complete
  useEffect(() => {
    if (wordStates.length > 0 && wordStates.every(w => w.isCompleted)) {
      setTimeout(() => setShowPageComplete(true), 500);
    }
  }, [wordStates]);

  // Handle pointer/touch move - simplified, no trail
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || helpWord) return;

    const y = e.clientY - 60;
    const x = e.clientX;

    let foundIndex: number | null = null;

    wordRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      if (
        x >= rect.left - 15 &&
        x <= rect.right + 15 &&
        y >= rect.top - 25 &&
        y <= rect.bottom + 25
      ) {
        foundIndex = index;
      }
    });

    if (foundIndex !== null && foundIndex !== activeWordIndex) {
      setActiveWordIndex(foundIndex);

      setWordStates(prev => prev.map((ws, i) => {
        if (i === foundIndex) {
          const newVisitCount = ws.visitCount + 1;
          const isStruggling = newVisitCount >= STRUGGLE_THRESHOLD;
          return {
            ...ws,
            isActive: true,
            visitCount: newVisitCount,
            isStruggling,
            isCompleted: true,
          };
        }
        return { ...ws, isActive: false };
      }));
    } else if (foundIndex === null && activeWordIndex !== null) {
      setActiveWordIndex(null);
      setWordStates(prev => prev.map(ws => ({ ...ws, isActive: false })));
    }
  }, [activeWordIndex, helpWord]);

  // Handle word tap for help
  const handleWordTap = (index: number) => {
    const ws = wordStates[index];
    if (ws.isStruggling || ws.visitCount >= 2) {
      setHelpWord({ word: ws.cleanWord, index });
    }
  };

  // Navigate pages with smooth transition
  const goToNextPage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      if (currentPage < story.pages.length - 1) {
        setCurrentPage(currentPage + 1);
      } else {
        onComplete();
      }
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrevPage = () => {
    if (isTransitioning || currentPage === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(currentPage - 1);
      setIsTransitioning(false);
    }, 300);
  };

  // Render word
  const renderWord = (ws: WordState, index: number) => {
    const isActive = ws.isActive;

    return (
      <span
        key={index}
        ref={(el) => { wordRefs.current[index] = el; }}
        onClick={() => handleWordTap(index)}
        className={`
          relative inline-block px-3 py-2 mx-1 my-2 rounded-xl
          cursor-pointer select-none
          transition-all duration-200 ease-out
          text-3xl md:text-4xl lg:text-5xl font-semibold
          ${isActive
            ? 'bg-white text-gray-800 shadow-xl scale-110 -translate-y-1'
            : ws.isCompleted
              ? 'bg-white/90 text-gray-700'
              : 'bg-white/60 text-gray-500'}
        `}
        style={{
          boxShadow: isActive
            ? `0 8px 30px ${gradeInfo.color}50`
            : undefined,
        }}
      >
        {ws.cleanWord}{ws.punctuation}

        {/* Struggling indicator */}
        {ws.isStruggling && !isActive && (
          <span className="absolute -top-2 -right-1 text-xl">💡</span>
        )}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="min-h-screen relative overflow-hidden"
      style={{
        touchAction: 'none',
        background: `linear-gradient(180deg, ${gradeInfo.color}30 0%, ${gradeInfo.color}10 50%, white 100%)`,
      }}
    >
      {/* Subtle background decorations - slow, gentle movement */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top left decoration */}
        <div
          className="absolute text-6xl md:text-8xl opacity-20"
          style={{
            top: '10%',
            left: '5%',
            animation: 'gentle-float 20s ease-in-out infinite',
          }}
        >
          {decorations[0]}
        </div>

        {/* Top right decoration */}
        <div
          className="absolute text-5xl md:text-7xl opacity-15"
          style={{
            top: '15%',
            right: '8%',
            animation: 'gentle-float 25s ease-in-out infinite',
            animationDelay: '-5s',
          }}
        >
          {decorations[1]}
        </div>

        {/* Bottom left decoration */}
        <div
          className="absolute text-5xl md:text-6xl opacity-15"
          style={{
            bottom: '20%',
            left: '10%',
            animation: 'gentle-float 22s ease-in-out infinite',
            animationDelay: '-10s',
          }}
        >
          {decorations[2]}
        </div>

        {/* Bottom right decoration */}
        <div
          className="absolute text-4xl md:text-5xl opacity-10"
          style={{
            bottom: '25%',
            right: '12%',
            animation: 'gentle-float 28s ease-in-out infinite',
            animationDelay: '-15s',
          }}
        >
          {decorations[0]}
        </div>

        {/* Center background - story emoji */}
        <div
          className="absolute text-[10rem] md:text-[14rem] opacity-[0.08]"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {story.coverEmoji}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={onBack}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="bg-white rounded-full px-5 py-2 shadow-md">
          <span className="text-lg md:text-xl font-semibold text-gray-700">
            Page {currentPage + 1} of {totalPages}
          </span>
        </div>

        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-md flex items-center justify-center text-2xl md:text-3xl">
          {story.coverEmoji}
        </div>
      </header>

      {/* Main content area */}
      <main
        className={`
          relative z-10 flex flex-col items-center justify-center
          min-h-[65vh] px-6 md:px-12 lg:px-20
          transition-opacity duration-300
          ${isTransitioning ? 'opacity-0' : 'opacity-100'}
        `}
      >
        {/* Story text card */}
        <div className="w-full max-w-4xl">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg">
            <p className="text-center leading-relaxed">
              {wordStates.map((ws, index) => renderWord(ws, index))}
            </p>
          </div>
        </div>

        {/* Reading hint */}
        <p className="mt-6 text-gray-500 text-center">
          <span className="text-xl mr-2">👆</span>
          Slide your finger under each word as you read
        </p>
      </main>

      {/* Navigation */}
      <nav className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className={`
            w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center
            transition-all duration-200
            ${currentPage === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white shadow-lg text-gray-700 hover:shadow-xl active:scale-95'}
          `}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Progress indicator */}
        <div className="flex gap-2">
          {story.pages.map((_, i) => (
            <div
              key={i}
              className={`
                h-2 rounded-full transition-all duration-300
                ${i === currentPage
                  ? 'w-8 bg-gray-700'
                  : i < currentPage
                    ? 'w-2 bg-gray-400'
                    : 'w-2 bg-gray-300'}
              `}
            />
          ))}
        </div>

        <button
          onClick={goToNextPage}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:shadow-xl active:scale-95 transition-all duration-200"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>

      {/* Help popup */}
      {helpWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={() => setHelpWord(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-800 mb-4">
                {getSyllables(helpWord.word).map((syl, i) => (
                  <span key={i}>
                    <span style={{ color: gradeInfo.color }}>{syl}</span>
                    {i < getSyllables(helpWord.word).length - 1 && (
                      <span className="text-gray-300 mx-1">·</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl p-4 mb-6 text-center"
              style={{ backgroundColor: `${gradeInfo.color}15` }}
            >
              <div className="text-sm text-gray-500 mb-1">Say it like:</div>
              <div className="text-2xl font-bold" style={{ color: gradeInfo.color }}>
                {getAgeAppropriateHint(helpWord.word, gradeLevel)}
              </div>
            </div>

            {getPhoneticHelp(helpWord.word) && (
              <p className="text-center text-gray-500 text-sm mb-6">
                💡 {getPhoneticHelp(helpWord.word)?.hint}
              </p>
            )}

            <button
              onClick={() => setHelpWord(null)}
              className="w-full py-3 rounded-full font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: gradeInfo.color }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Page complete */}
      {showPageComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Great job!</h2>
            <p className="text-gray-600 mb-6">You finished this page!</p>

            <div className="flex gap-3">
              {currentPage > 0 && (
                <button
                  onClick={() => {
                    setShowPageComplete(false);
                    goToPrevPage();
                  }}
                  className="flex-1 py-3 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  setShowPageComplete(false);
                  goToNextPage();
                }}
                className="flex-1 py-3 rounded-full text-white font-semibold transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: gradeInfo.color }}
              >
                {currentPage < story.pages.length - 1 ? 'Next Page' : 'Finish!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for gentle floating animation */}
      <style jsx>{`
        @keyframes gentle-float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-15px) translateX(5px);
          }
        }
      `}</style>
    </div>
  );
}
