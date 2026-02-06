'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { type Story, gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { getPhoneticHelp, getSyllables, getAgeAppropriateHint } from '@/lib/phonetics';

interface BookReaderProps {
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

const STRUGGLE_THRESHOLD = 3;

export default function BookReader({ story, gradeLevel, onBack, onComplete }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [showPageComplete, setShowPageComplete] = useState(false);
  const [helpWord, setHelpWord] = useState<{ word: string; rect: DOMRect } | null>(null);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const bookRef = useRef<HTMLDivElement>(null);
  const sparkleId = useRef(0);

  const gradeInfo = gradeLevelInfo[gradeLevel];
  const pageText = story.pages[currentPage];
  const totalPages = story.pages.length;

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
      setTimeout(() => setShowPageComplete(true), 300);
    }
  }, [wordStates]);

  // Add sparkle effect
  const addSparkle = useCallback((x: number, y: number) => {
    const id = sparkleId.current++;
    setSparkles(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== id));
    }, 1000);
  }, []);

  // Handle pointer/touch move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!bookRef.current || helpWord) return;

    const y = e.clientY - 60; // Look ahead offset for finger
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

      // Add sparkle at touch point
      addSparkle(x, e.clientY);

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
  }, [activeWordIndex, addSparkle, helpWord]);

  // Handle word tap for help
  const handleWordTap = (index: number, e: React.MouseEvent) => {
    const ws = wordStates[index];
    const ref = wordRefs.current[index];
    if ((ws.isStruggling || ws.visitCount >= 2) && ref) {
      e.stopPropagation();
      const rect = ref.getBoundingClientRect();
      setHelpWord({ word: ws.cleanWord, rect });
    }
  };

  // Close help popup
  const closeHelp = () => setHelpWord(null);

  // Navigate pages with animation
  const goToNextPage = () => {
    if (isPageTurning) return;
    setIsPageTurning(true);
    setTimeout(() => {
      if (currentPage < story.pages.length - 1) {
        setCurrentPage(currentPage + 1);
      } else {
        onComplete();
      }
      setIsPageTurning(false);
    }, 300);
  };

  const goToPrevPage = () => {
    if (isPageTurning || currentPage === 0) return;
    setIsPageTurning(true);
    setTimeout(() => {
      setCurrentPage(currentPage - 1);
      setIsPageTurning(false);
    }, 300);
  };

  // Render help popup
  const renderHelpPopup = () => {
    if (!helpWord) return null;

    const help = getPhoneticHelp(helpWord.word);
    const syllables = getSyllables(helpWord.word);
    const hint = getAgeAppropriateHint(helpWord.word, gradeLevel);

    // Calculate position (centered above word, but keep on screen)
    const bookRect = bookRef.current?.getBoundingClientRect();
    if (!bookRect) return null;

    let left = helpWord.rect.left + helpWord.rect.width / 2 - bookRect.left;
    let top = helpWord.rect.top - bookRect.top - 20;

    // Keep popup on screen
    const popupWidth = 280;
    if (left - popupWidth / 2 < 20) left = popupWidth / 2 + 20;
    if (left + popupWidth / 2 > bookRect.width - 20) left = bookRect.width - popupWidth / 2 - 20;
    if (top < 100) top = helpWord.rect.bottom - bookRect.top + 20;

    return (
      <div
        className="fixed inset-0 z-50"
        onClick={closeHelp}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="absolute z-50 animate-bounce-in"
          style={{
            left: helpWord.rect.left + helpWord.rect.width / 2,
            top: helpWord.rect.top - 10,
            transform: 'translate(-50%, -100%)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-6 min-w-[280px] max-w-[320px]">
            {/* Word with syllables */}
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {syllables.map((syl, i) => (
                  <span key={i}>
                    <span
                      className="inline-block text-purple-600 animate-bounce-slow"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    >
                      {syl}
                    </span>
                    {i < syllables.length - 1 && (
                      <span className="text-gray-300 mx-1">·</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* How to say it */}
            <div className="bg-purple-50 rounded-2xl p-4 mb-4">
              <div className="text-sm text-purple-600 font-medium mb-1">Say it like:</div>
              <div className="text-2xl font-bold text-purple-700">{hint}</div>
            </div>

            {/* Tip */}
            {help && (
              <div className="text-center text-gray-500 text-sm">
                💡 {help.hint}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={closeHelp}
              className="w-full mt-4 py-3 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-600 transition-colors"
            >
              Got it! 👍
            </button>
          </div>

          {/* Arrow pointing to word */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0"
            style={{
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '12px solid white',
            }}
          />
        </div>
      </div>
    );
  };

  // Render a single word
  const renderWord = (ws: WordState, index: number) => {
    const isActive = ws.isActive;

    return (
      <span
        key={index}
        ref={(el) => { wordRefs.current[index] = el; }}
        onClick={(e) => handleWordTap(index, e)}
        className={`
          relative inline-block px-2 py-2 mx-1 my-3 rounded-xl
          transition-all duration-200 ease-out
          cursor-pointer select-none
          ${isActive ? 'z-20' : 'z-10'}
        `}
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${gradeInfo.color}, ${gradeInfo.color}dd)`
            : ws.isCompleted
              ? `${gradeInfo.color}20`
              : 'transparent',
          boxShadow: isActive
            ? `0 0 40px ${gradeInfo.color}80, 0 0 80px ${gradeInfo.color}40, 0 8px 32px rgba(0,0,0,0.2)`
            : 'none',
          transform: isActive ? 'scale(1.25) translateY(-4px)' : 'scale(1)',
        }}
      >
        {/* Magic glow rings */}
        {isActive && (
          <>
            <span
              className="absolute inset-0 rounded-xl animate-ping-slow opacity-60"
              style={{ background: `${gradeInfo.color}40` }}
            />
            <span
              className="absolute -inset-3 rounded-2xl opacity-40"
              style={{
                background: `radial-gradient(circle, ${gradeInfo.color}60 0%, transparent 70%)`,
                filter: 'blur(8px)',
              }}
            />
          </>
        )}

        {/* Struggling indicator */}
        {ws.isStruggling && !isActive && (
          <span className="absolute -top-3 -right-1 text-2xl animate-bounce z-30">
            💡
          </span>
        )}

        {/* Word text */}
        <span className={`
          relative z-10 font-bold text-3xl md:text-4xl lg:text-5xl
          transition-colors duration-200
          ${isActive ? 'text-white drop-shadow-lg' : ws.isCompleted ? 'text-gray-700' : 'text-gray-500'}
        `}>
          {ws.cleanWord}
        </span>
        {ws.punctuation && (
          <span className={`relative z-10 text-3xl md:text-4xl lg:text-5xl ${isActive ? 'text-white' : 'text-gray-700'}`}>
            {ws.punctuation}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-amber-100 flex flex-col overflow-hidden">
      {/* Sparkle effects */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="fixed pointer-events-none z-50"
          style={{ left: sparkle.x, top: sparkle.y }}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-sparkle"
              style={{
                background: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#98FB98', '#DDA0DD'][i],
                transform: `rotate(${i * 60}deg) translateX(${20 + Math.random() * 20}px)`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      ))}

      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 bg-amber-800 text-white">
        <button
          onClick={onBack}
          className="p-2 md:p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center flex-1">
          <h1 className="text-lg md:text-xl font-bold truncate px-2">{story.title}</h1>
        </div>

        <div className="text-sm md:text-base font-medium bg-white/20 px-3 py-1 rounded-full">
          {currentPage + 1} / {totalPages}
        </div>
      </div>

      {/* Book container */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div
          ref={bookRef}
          onPointerMove={handlePointerMove}
          className={`
            relative w-full max-w-4xl aspect-[4/3] md:aspect-[3/2]
            bg-gradient-to-br from-amber-50 to-orange-50
            rounded-lg md:rounded-2xl shadow-2xl
            transition-transform duration-300
            ${isPageTurning ? 'scale-95 opacity-80' : ''}
          `}
          style={{
            touchAction: 'none',
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.5),
              inset 0 -2px 0 rgba(0, 0, 0, 0.1)
            `,
          }}
        >
          {/* Book spine shadow */}
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-black/20 via-black/10 to-transparent rounded-l-lg md:rounded-l-2xl" />

          {/* Page edge effect (right side) */}
          <div className="absolute right-0 top-2 bottom-2 w-2 md:w-3 bg-gradient-to-r from-transparent to-amber-200/50 rounded-r" />

          {/* Page lines decoration */}
          <div className="absolute right-1 top-4 bottom-4 w-1 flex flex-col justify-between opacity-30">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-px bg-amber-400" />
            ))}
          </div>

          {/* Story emoji decoration */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 text-4xl md:text-6xl opacity-10">
            {story.coverEmoji}
          </div>

          {/* Page content */}
          <div className="absolute inset-0 flex flex-col p-6 md:p-10 lg:p-12 pl-10 md:pl-16">
            {/* Chapter/Page indicator */}
            <div className="text-amber-600 text-sm md:text-base font-medium mb-4 md:mb-6">
              Page {currentPage + 1}
            </div>

            {/* Text content */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-center leading-loose md:leading-loose max-w-3xl">
                {wordStates.map((ws, index) => renderWord(ws, index))}
              </p>
            </div>

            {/* Page decoration */}
            <div className="text-center text-amber-300 text-xl md:text-2xl tracking-widest mt-4">
              ✦ ✦ ✦
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className={`
              absolute left-2 md:left-4 top-1/2 -translate-y-1/2
              w-10 h-10 md:w-14 md:h-14 rounded-full
              flex items-center justify-center
              transition-all duration-200
              ${currentPage === 0
                ? 'bg-gray-300/50 text-gray-400 cursor-not-allowed'
                : 'bg-amber-600 text-white shadow-lg hover:bg-amber-700 hover:scale-110'}
            `}
          >
            <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNextPage}
            className={`
              absolute right-2 md:right-4 top-1/2 -translate-y-1/2
              w-10 h-10 md:w-14 md:h-14 rounded-full
              flex items-center justify-center
              bg-amber-600 text-white shadow-lg
              hover:bg-amber-700 hover:scale-110
              transition-all duration-200
            `}
          >
            <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Reading instruction */}
      <div className="text-center pb-4 text-amber-700">
        <span className="text-2xl">👆</span>
        <span className="ml-2">Slide your finger under each word as you read!</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-amber-200">
        <div
          className={`h-full bg-gradient-to-r ${gradeInfo.bgGradient} transition-all duration-500`}
          style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
        />
      </div>

      {/* Help popup */}
      {renderHelpPopup()}

      {/* Page complete celebration */}
      {showPageComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 animate-bounce-in shadow-2xl">
            <div className="text-7xl mb-4 animate-wiggle">🌟</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Awesome!</h2>
            <p className="text-gray-600 text-lg mb-6">You read this whole page!</p>

            <div className="flex gap-3">
              {currentPage > 0 && (
                <button
                  onClick={() => {
                    setShowPageComplete(false);
                    goToPrevPage();
                  }}
                  className="flex-1 py-4 px-6 rounded-full bg-gray-200 text-gray-700 font-bold text-lg hover:bg-gray-300 transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => {
                  setShowPageComplete(false);
                  goToNextPage();
                }}
                className={`flex-1 py-4 px-6 rounded-full bg-gradient-to-r ${gradeInfo.bgGradient} text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-lg`}
              >
                {currentPage < story.pages.length - 1 ? 'Next Page →' : 'Finish! 🎉'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
