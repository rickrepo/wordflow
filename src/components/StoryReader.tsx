'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { type Story, gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { getPhoneticHelp, getSyllables, getAgeAppropriateHint } from '@/lib/phonetics';
import { recordPageComplete, loadProgress, type GameProgress } from '@/lib/gameState';
import StoryScene from './illustrations/StoryScene';
import PageTransition from './illustrations/PageTransition';
import BackgroundCharacter from './illustrations/BackgroundCharacter';

interface StoryReaderProps {
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

export default function StoryReader({ story, gradeLevel, onBack, onComplete }: StoryReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [pageComplete, setPageComplete] = useState(false);
  const [showPageTransition, setShowPageTransition] = useState(false);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [swipePos, setSwipePos] = useState<{ x: number; y: number } | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const pageText = story.pages[currentPage];
  const totalPages = story.pages.length;
  const isLastPage = currentPage === totalPages - 1;

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

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
    setSwipePos(null);
    wordRefs.current = [];
  }, [pageText, currentPage]);

  useEffect(() => {
    if (wordStates.length > 0 && wordStates.every(w => w.isCompleted) && !pageComplete) {
      setPageComplete(true);
      if (progress) {
        setProgress(recordPageComplete(progress, 1));
      }
      setTimeout(() => {
        if (isLastPage) {
          onComplete();
        } else {
          setShowPageTransition(true);
        }
      }, 300);
    }
  }, [wordStates, pageComplete, progress, isLastPage, onComplete]);

  // Core swipe logic - works with both pointer and touch coordinates
  const handleSwipe = useCallback((x: number, y: number) => {
    if (!containerRef.current || showHelp || showPageTransition || pageComplete) return;

    setSwipePos({ x, y });

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
      const nextToRead = wordStates.findIndex(ws => !ws.isCompleted);
      setActiveWordIndex(foundIndex);

      setWordStates(prev => prev.map((ws, i) => {
        if (i === foundIndex) {
          const newVisitCount = ws.visitCount + 1;
          const canComplete = i === nextToRead || ws.isCompleted || nextToRead === -1;
          return {
            ...ws,
            isActive: true,
            visitCount: newVisitCount,
            isStruggling: canComplete ? newVisitCount >= STRUGGLE_THRESHOLD : ws.isStruggling,
            isCompleted: canComplete ? true : ws.isCompleted,
          };
        }
        return { ...ws, isActive: false };
      }));
    } else if (foundIndex === null && activeWordIndex !== null) {
      setActiveWordIndex(null);
      setWordStates(prev => prev.map(ws => ({ ...ws, isActive: false })));
    }
  }, [activeWordIndex, showHelp, showPageTransition, pageComplete, wordStates]);

  // Pointer events (desktop + some mobile)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    handleSwipe(e.clientX, e.clientY);
  }, [handleSwipe]);

  // Touch events (mobile fallback - ensures it works on all touch devices)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleSwipe(touch.clientX, touch.clientY);
    }
  }, [handleSwipe]);

  const handleSwipeEnd = useCallback(() => {
    setSwipePos(null);
  }, []);

  const handleWordTap = (index: number) => {
    const ws = wordStates[index];
    if (ws.visitCount >= 2 || ws.isStruggling) {
      setShowHelp(ws.cleanWord);
    }
  };

  const handlePageTransitionComplete = () => {
    setShowPageTransition(false);
    setCurrentPage(prev => prev + 1);
  };

  const nextWordIndex = wordStates.findIndex(ws => !ws.isCompleted);

  // Check if swipe line should show (only within text area)
  const showSwipeLine = (() => {
    if (!swipePos || !textRef.current) return false;
    const textRect = textRef.current.getBoundingClientRect();
    return swipePos.y >= textRect.top - 40 && swipePos.y <= textRect.bottom + 40;
  })();

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handleSwipeEnd}
      onPointerLeave={handleSwipeEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleSwipeEnd}
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Full-screen immersive story scene */}
      <StoryScene storyId={story.id} />

      {/* Subtle background character animation */}
      <BackgroundCharacter storyId={story.id} />

      {/* Tiny back button - top left, unobtrusive */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/20 text-white/80 hover:bg-black/30 transition-all z-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Main reading area - centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Text container - the book page */}
          <div ref={textRef} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 px-6 py-8 sm:px-10 sm:py-12 md:px-12 md:py-14">
            <p className="text-center" style={{ lineHeight: '2.2' }}>
              {wordStates.map((ws, i) => {
                const isNextWord = i === nextWordIndex;
                const wordStyle: React.CSSProperties = {
                  display: 'inline',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-out',
                  fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                };

                if (ws.isActive) {
                  wordStyle.color = '#2563EB';
                  wordStyle.fontWeight = 700;
                  wordStyle.textDecoration = 'underline';
                  wordStyle.textDecorationColor = '#3B82F6';
                  wordStyle.textUnderlineOffset = '6px';
                  wordStyle.textDecorationThickness = '3px';
                } else if (ws.isCompleted) {
                  wordStyle.color = '#1F2937';
                } else if (isNextWord) {
                  wordStyle.color = '#1F2937';
                  wordStyle.fontWeight = 600;
                  wordStyle.textDecoration = 'underline';
                  wordStyle.textDecorationColor = '#FCD34D';
                  wordStyle.textUnderlineOffset = '6px';
                  wordStyle.textDecorationThickness = '2px';
                  wordStyle.textDecorationStyle = 'dashed';
                } else {
                  wordStyle.color = '#9CA3AF';
                }

                return (
                  <span key={i}>
                    <span
                      ref={el => { wordRefs.current[i] = el; }}
                      onClick={() => handleWordTap(i)}
                      style={wordStyle}
                    >
                      {ws.cleanWord}{ws.punctuation}
                      {ws.isStruggling && !ws.isActive && (
                        <span style={{ fontSize: '0.75rem', verticalAlign: 'super' }}>💡</span>
                      )}
                    </span>
                    {i < wordStates.length - 1 && ' '}
                  </span>
                );
              })}
            </p>
          </div>

          {/* Page indicator dots - subtle, below the card */}
          <div className="flex items-center justify-center mt-5">
            <div className="flex gap-1.5">
              {story.pages.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentPage
                      ? 'w-6 h-2 bg-white/90'
                      : i < currentPage
                        ? 'w-2 h-2 bg-white/60'
                        : 'w-2 h-2 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Swipe guide line - follows finger position */}
      {showSwipeLine && swipePos && (
        <div
          style={{
            position: 'fixed',
            left: swipePos.x - 30,
            top: swipePos.y + 10,
            width: 60,
            height: 4,
            borderRadius: 2,
            background: 'linear-gradient(90deg, transparent, #3B82F6, #3B82F6, transparent)',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.5), 0 0 4px rgba(59, 130, 246, 0.3)',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      )}

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

      {/* Page transition animation */}
      <PageTransition
        show={showPageTransition}
        storyId={story.id}
        onComplete={handlePageTransitionComplete}
      />
    </div>
  );
}
