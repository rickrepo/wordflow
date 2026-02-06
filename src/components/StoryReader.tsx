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
  const [swipeX, setSwipeX] = useState<number | null>(null);
  const [swipeY, setSwipeY] = useState<number | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const pageText = story.pages[currentPage];
  const totalPages = story.pages.length;
  const isLastPage = currentPage === totalPages - 1;

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
    setSwipeX(null);
    setSwipeY(null);
    wordRefs.current = [];
  }, [pageText, currentPage]);

  // Check page completion - immediately trigger transition (no star modal)
  useEffect(() => {
    if (wordStates.length > 0 && wordStates.every(w => w.isCompleted) && !pageComplete) {
      setPageComplete(true);

      // Record progress
      if (progress) {
        setProgress(recordPageComplete(progress, 1));
      }

      // Small delay then show page transition
      setTimeout(() => {
        if (isLastPage) {
          onComplete();
        } else {
          setShowPageTransition(true);
        }
      }, 300);
    }
  }, [wordStates, pageComplete, progress, isLastPage, onComplete]);

  // Handle pointer movement - enforces left-to-right reading order
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || showHelp || showPageTransition || pageComplete) return;

    const x = e.clientX;
    const y = e.clientY;

    // Update swipe line position
    setSwipeX(x);
    setSwipeY(y);

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
      // Get the next word that should be read
      const nextToRead = wordStates.findIndex(ws => !ws.isCompleted);

      // Only allow completing the next word in sequence (left-to-right)
      // But allow highlighting any word for visual feedback
      setActiveWordIndex(foundIndex);

      setWordStates(prev => prev.map((ws, i) => {
        if (i === foundIndex) {
          const newVisitCount = ws.visitCount + 1;
          // Only mark as completed if it's the next word in sequence OR already completed
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

  const handlePointerUp = useCallback(() => {
    setSwipeX(null);
    setSwipeY(null);
  }, []);

  // Word tap for help
  const handleWordTap = (index: number) => {
    const ws = wordStates[index];
    if (ws.visitCount >= 2 || ws.isStruggling) {
      setShowHelp(ws.cleanWord);
    }
  };

  // Called when page transition animation completes
  const handlePageTransitionComplete = () => {
    setShowPageTransition(false);
    setCurrentPage(prev => prev + 1);
  };

  // Find the next word to read for highlighting
  const nextWordIndex = wordStates.findIndex(ws => !ws.isCompleted);

  // Render word - natural text flow, no extra spacing
  const renderWord = (ws: WordState, index: number) => {
    const isNextWord = index === nextWordIndex;

    return (
      <span
        key={index}
        ref={el => { wordRefs.current[index] = el; }}
        onClick={() => handleWordTap(index)}
        className={`
          inline cursor-pointer select-none
          transition-all duration-150 ease-out
          text-3xl md:text-4xl lg:text-5xl
          ${ws.isActive
            ? 'text-blue-600 font-bold swipe-word-active'
            : ws.isCompleted
              ? 'text-gray-800'
              : isNextWord
                ? 'text-gray-800 font-semibold swipe-word-next'
                : 'text-gray-400'}
        `}
      >
        {ws.cleanWord}{ws.punctuation}
        {ws.isStruggling && !ws.isActive && (
          <span className="text-sm align-super">💡</span>
        )}
      </span>
    );
  };

  // Calculate the swipe line position relative to the text container
  const getSwipeLine = () => {
    if (swipeX === null || swipeY === null || !textRef.current) return null;
    const textRect = textRef.current.getBoundingClientRect();
    // Only show line when pointer is within the text area (with some vertical padding)
    if (swipeY < textRect.top - 40 || swipeY > textRect.bottom + 40) return null;
    return { x: swipeX, y: swipeY };
  };

  const swipeLine = getSwipeLine();

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ touchAction: 'none' }}
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Text container - the book page */}
          <div ref={textRef} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 px-8 py-10 md:px-12 md:py-14">
            <p className="text-center leading-loose">
              {wordStates.map((ws, i) => (
                <span key={i}>
                  {renderWord(ws, i)}
                  {i < wordStates.length - 1 && ' '}
                </span>
              ))}
            </p>

            {/* Swipe guide line - shows under the text where finger is */}
            {swipeLine && (
              <div
                className="swipe-line pointer-events-none"
                style={{
                  position: 'fixed',
                  left: swipeLine.x - 30,
                  top: swipeLine.y + 8,
                  width: 60,
                  zIndex: 50,
                }}
              />
            )}
          </div>

          {/* Page indicator - subtle, below the card */}
          <div className="flex items-center justify-center gap-2 mt-6">
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

      <style jsx>{`
        .swipe-line {
          height: 4px;
          background: linear-gradient(90deg, transparent, #3B82F6, #3B82F6, transparent);
          border-radius: 2px;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.5), 0 0 4px rgba(59, 130, 246, 0.3);
          animation: swipe-glow 0.8s ease-in-out infinite alternate;
        }
        @keyframes swipe-glow {
          from { opacity: 0.7; box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); }
          to { opacity: 1; box-shadow: 0 0 16px rgba(59, 130, 246, 0.6); }
        }
        .swipe-word-active {
          text-decoration: underline;
          text-decoration-color: #3B82F6;
          text-underline-offset: 6px;
          text-decoration-thickness: 3px;
        }
        .swipe-word-next {
          text-decoration: underline;
          text-decoration-color: #FCD34D;
          text-underline-offset: 6px;
          text-decoration-thickness: 2px;
          text-decoration-style: dashed;
        }
      `}</style>
    </div>
  );
}
