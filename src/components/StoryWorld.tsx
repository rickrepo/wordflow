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

// Animated elements for different themes
const themeElements: Record<string, { emoji: string[]; colors: string[] }> = {
  animals: {
    emoji: ['🦋', '🐦', '🌸', '🌺', '🍃', '🌻', '☁️'],
    colors: ['from-green-400 via-emerald-500 to-teal-600', 'from-sky-300 to-green-400'],
  },
  adventure: {
    emoji: ['⭐', '🌟', '✨', '💫', '🌙', '☁️', '🎈'],
    colors: ['from-orange-400 via-pink-500 to-purple-600', 'from-yellow-300 to-orange-400'],
  },
  fantasy: {
    emoji: ['✨', '🦄', '🌈', '⭐', '🔮', '🌙', '💜'],
    colors: ['from-purple-500 via-pink-500 to-rose-500', 'from-indigo-400 to-purple-500'],
  },
  nature: {
    emoji: ['🌿', '🌻', '🦋', '☀️', '🌈', '💧', '🌸'],
    colors: ['from-cyan-400 via-teal-500 to-green-600', 'from-blue-300 to-cyan-400'],
  },
  friendship: {
    emoji: ['💕', '🌟', '🎀', '🌸', '💫', '🦋', '✨'],
    colors: ['from-pink-400 via-rose-500 to-red-500', 'from-yellow-300 to-pink-400'],
  },
};

const STRUGGLE_THRESHOLD = 3;

export default function StoryWorld({ story, gradeLevel, onBack, onComplete }: StoryWorldProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [showPageComplete, setShowPageComplete] = useState(false);
  const [helpWord, setHelpWord] = useState<{ word: string; index: number } | null>(null);
  const [floatingElements, setFloatingElements] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);
  const [magicTrail, setMagicTrail] = useState<{ id: number; x: number; y: number }[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const trailId = useRef(0);

  const gradeInfo = gradeLevelInfo[gradeLevel];
  const pageText = story.pages[currentPage];
  const totalPages = story.pages.length;
  const theme = themeElements[story.theme] || themeElements.adventure;

  // Generate floating elements for this page
  useEffect(() => {
    const elements = [...Array(12)].map((_, i) => ({
      id: i,
      emoji: theme.emoji[i % theme.emoji.length],
      x: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setFloatingElements(elements);
  }, [currentPage, theme.emoji]);

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

  // Add magic trail effect
  const addTrail = useCallback((x: number, y: number) => {
    const id = trailId.current++;
    setMagicTrail(prev => [...prev.slice(-15), { id, x, y }]);
  }, []);

  // Handle pointer/touch move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || helpWord) return;

    const y = e.clientY - 70;
    const x = e.clientX;

    // Add trail
    addTrail(e.clientX, e.clientY);

    let foundIndex: number | null = null;

    wordRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      if (
        x >= rect.left - 20 &&
        x <= rect.right + 20 &&
        y >= rect.top - 30 &&
        y <= rect.bottom + 30
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
  }, [activeWordIndex, addTrail, helpWord]);

  // Handle word tap for help
  const handleWordTap = (index: number) => {
    const ws = wordStates[index];
    if (ws.isStruggling || ws.visitCount >= 2) {
      setHelpWord({ word: ws.cleanWord, index });
    }
  };

  // Navigate pages
  const goToNextPage = () => {
    if (currentPage < story.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Render word with magic effects
  const renderWord = (ws: WordState, index: number) => {
    const isActive = ws.isActive;

    return (
      <span
        key={index}
        ref={(el) => { wordRefs.current[index] = el; }}
        onClick={() => handleWordTap(index)}
        className="relative inline-block mx-2 my-4 cursor-pointer select-none"
        style={{
          transform: isActive ? 'scale(1.3) translateY(-8px)' : 'scale(1)',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Glow effect */}
        {isActive && (
          <span
            className="absolute inset-0 -m-4 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, ${gradeInfo.color}80 0%, transparent 70%)`,
              filter: 'blur(15px)',
            }}
          />
        )}

        {/* Word bubble */}
        <span
          className={`
            relative z-10 px-4 py-2 rounded-2xl font-bold
            text-4xl md:text-5xl lg:text-6xl
            transition-all duration-200
            ${isActive
              ? 'bg-white text-gray-800 shadow-2xl'
              : ws.isCompleted
                ? 'bg-white/80 text-gray-700'
                : 'bg-white/40 text-gray-600'}
          `}
          style={{
            boxShadow: isActive
              ? `0 10px 40px ${gradeInfo.color}60, 0 0 60px ${gradeInfo.color}40`
              : 'none',
          }}
        >
          {ws.cleanWord}
          {ws.punctuation}

          {/* Struggling sparkle */}
          {ws.isStruggling && !isActive && (
            <span className="absolute -top-4 -right-2 text-3xl animate-bounce">💡</span>
          )}

          {/* Active sparkles */}
          {isActive && (
            <span className="absolute -top-2 -right-2 text-2xl animate-spin-slow">✨</span>
          )}
        </span>
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className={`min-h-screen bg-gradient-to-b ${theme.colors[0]} relative overflow-hidden`}
      style={{ touchAction: 'none' }}
    >
      {/* Animated sky/background layer */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.colors[1]} opacity-50`} />

        {/* Moving clouds/shapes */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`cloud-${i}`}
            className="absolute rounded-full bg-white/30 animate-float-slow"
            style={{
              width: 100 + i * 50 + 'px',
              height: 40 + i * 20 + 'px',
              left: (i * 25) + '%',
              top: 10 + (i % 3) * 15 + '%',
              animationDelay: i * 2 + 's',
              animationDuration: 15 + i * 3 + 's',
            }}
          />
        ))}
      </div>

      {/* Floating animated elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingElements.map((el) => (
          <div
            key={el.id}
            className="absolute text-5xl md:text-6xl animate-float-random"
            style={{
              left: el.x + '%',
              top: Math.random() * 60 + 20 + '%',
              animationDelay: el.delay + 's',
            }}
          >
            {el.emoji}
          </div>
        ))}
      </div>

      {/* Magic trail */}
      {magicTrail.map((point, i) => (
        <div
          key={point.id}
          className="fixed pointer-events-none z-40"
          style={{
            left: point.x - 10,
            top: point.y - 10,
            opacity: (i / magicTrail.length) * 0.8,
          }}
        >
          <div
            className="w-5 h-5 rounded-full animate-ping"
            style={{
              background: `radial-gradient(circle, ${gradeInfo.color} 0%, transparent 70%)`,
            }}
          />
        </div>
      ))}

      {/* Story emoji floating in background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] md:text-[16rem] opacity-20 animate-float-slow pointer-events-none">
        {story.coverEmoji}
      </div>

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={onBack}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="bg-white/90 rounded-full px-6 py-3 shadow-lg">
          <span className="text-xl md:text-2xl font-bold text-gray-700">
            {currentPage + 1} ✨ {totalPages}
          </span>
        </div>

        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-3xl">
          {story.coverEmoji}
        </div>
      </div>

      {/* Main story content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-6 md:px-12">
        {/* Story text */}
        <div className="text-center max-w-5xl">
          <p className="leading-loose">
            {wordStates.map((ws, index) => renderWord(ws, index))}
          </p>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-between px-6 md:px-12">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className={`
            w-20 h-20 md:w-24 md:h-24 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${currentPage === 0
              ? 'bg-white/30 text-gray-400'
              : 'bg-white shadow-2xl text-gray-700 hover:scale-110 active:scale-95'}
          `}
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNextPage}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-2xl flex items-center justify-center text-gray-700 hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Reading hint */}
      <div className="absolute bottom-32 left-0 right-0 text-center z-10">
        <div className="inline-block bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          <span className="text-lg md:text-xl text-gray-600">
            👆 Slide your finger under the words!
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {story.pages.map((_, i) => (
          <div
            key={i}
            className={`
              h-3 rounded-full transition-all duration-300
              ${i === currentPage
                ? 'w-10 bg-white shadow-lg'
                : i < currentPage
                  ? 'w-3 bg-white/80'
                  : 'w-3 bg-white/40'}
            `}
          />
        ))}
      </div>

      {/* Help popup */}
      {helpWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setHelpWord(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Word display */}
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-gray-800 mb-4">
                {getSyllables(helpWord.word).map((syl, i) => (
                  <span key={i}>
                    <span
                      className="inline-block animate-bounce-slow"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                        color: gradeInfo.color,
                      }}
                    >
                      {syl}
                    </span>
                    {i < getSyllables(helpWord.word).length - 1 && (
                      <span className="text-gray-300 mx-2">·</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Pronunciation */}
            <div
              className="rounded-2xl p-5 mb-6 text-center"
              style={{ backgroundColor: `${gradeInfo.color}20` }}
            >
              <div className="text-lg text-gray-600 mb-1">Say it like:</div>
              <div className="text-3xl font-bold" style={{ color: gradeInfo.color }}>
                {getAgeAppropriateHint(helpWord.word, gradeLevel)}
              </div>
            </div>

            {/* Tip */}
            {getPhoneticHelp(helpWord.word) && (
              <div className="text-center text-gray-500 mb-6">
                💡 {getPhoneticHelp(helpWord.word)?.hint}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setHelpWord(null)}
              className="w-full py-4 rounded-full font-bold text-xl text-white transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: gradeInfo.color }}
            >
              Got it! 👍
            </button>
          </div>
        </div>
      )}

      {/* Page complete celebration */}
      {showPageComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />

          {/* Confetti */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 animate-confetti"
                style={{
                  left: Math.random() * 100 + '%',
                  top: '-20px',
                  backgroundColor: ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B6B'][i % 5],
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  animationDelay: Math.random() * 2 + 's',
                }}
              />
            ))}
          </div>

          <div className="relative bg-white rounded-[2rem] p-10 text-center max-w-md mx-4 shadow-2xl animate-bounce-in">
            <div className="text-8xl mb-4 animate-wiggle">🎉</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Amazing!</h2>
            <p className="text-xl text-gray-600 mb-8">You read the whole page!</p>

            <div className="flex gap-4">
              {currentPage > 0 && (
                <button
                  onClick={() => {
                    setShowPageComplete(false);
                    goToPrevPage();
                  }}
                  className="flex-1 py-5 rounded-full bg-gray-200 text-gray-700 font-bold text-xl hover:bg-gray-300 transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => {
                  setShowPageComplete(false);
                  goToNextPage();
                }}
                className="flex-1 py-5 rounded-full text-white font-bold text-xl shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: gradeInfo.color }}
              >
                {currentPage < story.pages.length - 1 ? 'Next! →' : 'Finish! 🏆'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
