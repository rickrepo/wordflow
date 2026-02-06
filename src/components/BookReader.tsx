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
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  visitCount: number;
  isStruggling: boolean;
  showHelp: boolean;
}

const STRUGGLE_THRESHOLD = 3; // Number of revisits to trigger help

export default function BookReader({ story, gradeLevel, onBack, onComplete }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [showPageComplete, setShowPageComplete] = useState(false);
  const [showPhoneticPopup, setShowPhoneticPopup] = useState<number | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const gradeInfo = gradeLevelInfo[gradeLevel];
  const pageText = story.pages[currentPage];

  // Parse words from current page
  useEffect(() => {
    const words = pageText.split(/\s+/).filter(w => w.length > 0);
    setWordStates(words.map((word, index) => ({
      word,
      index,
      isActive: false,
      isCompleted: false,
      visitCount: 0,
      isStruggling: false,
      showHelp: false,
    })));
    setActiveWordIndex(null);
    setShowPageComplete(false);
    setShowPhoneticPopup(null);
    wordRefs.current = [];
  }, [pageText, currentPage]);

  // Check if page is complete
  useEffect(() => {
    if (wordStates.length > 0 && wordStates.every(w => w.isCompleted)) {
      setShowPageComplete(true);
    }
  }, [wordStates]);

  // Handle pointer/touch move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current) return;

    const y = e.clientY - 50; // Look ahead offset
    const x = e.clientX;

    // Find which word is under the pointer
    let foundIndex: number | null = null;

    wordRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      if (
        x >= rect.left - 10 &&
        x <= rect.right + 10 &&
        y >= rect.top - 20 &&
        y <= rect.bottom + 20
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
            isCompleted: true, // Mark as completed when touched
          };
        }
        return {
          ...ws,
          isActive: false,
        };
      }));
    } else if (foundIndex === null && activeWordIndex !== null) {
      setActiveWordIndex(null);
      setWordStates(prev => prev.map(ws => ({ ...ws, isActive: false })));
    }
  }, [activeWordIndex]);

  // Handle word tap for help
  const handleWordTap = (index: number) => {
    const ws = wordStates[index];
    if (ws.isStruggling || ws.visitCount >= 2) {
      setShowPhoneticPopup(showPhoneticPopup === index ? null : index);
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

  // Render a single word
  const renderWord = (ws: WordState, index: number) => {
    const cleanWord = ws.word.replace(/[^a-zA-Z]/g, '');
    const punctuation = ws.word.replace(/[a-zA-Z]/g, '');
    const hasHelp = getPhoneticHelp(cleanWord) !== null;
    const syllables = getSyllables(cleanWord);
    const hint = getAgeAppropriateHint(cleanWord, gradeLevel);
    const isShowingHelp = showPhoneticPopup === index;

    return (
      <span
        key={index}
        ref={(el) => { wordRefs.current[index] = el; }}
        onClick={() => handleWordTap(index)}
        className={`
          relative inline-block px-2 py-1 mx-1 my-2 rounded-xl
          transition-all duration-300 ease-out
          cursor-pointer select-none
          ${ws.isActive ? 'transform scale-125 z-20' : ''}
          ${ws.isCompleted ? 'opacity-100' : 'opacity-70'}
          ${ws.isStruggling ? 'animate-pulse-soft' : ''}
        `}
        style={{
          background: ws.isActive
            ? `linear-gradient(135deg, ${gradeInfo.color}40, ${gradeInfo.color}60)`
            : ws.isCompleted
            ? `linear-gradient(135deg, ${gradeInfo.color}20, ${gradeInfo.color}30)`
            : 'transparent',
          boxShadow: ws.isActive
            ? `0 0 30px ${gradeInfo.color}80, 0 0 60px ${gradeInfo.color}40, inset 0 0 20px ${gradeInfo.color}20`
            : 'none',
          transform: ws.isActive ? 'scale(1.2)' : 'scale(1)',
        }}
      >
        {/* Magical glow effect */}
        {ws.isActive && (
          <>
            <span
              className="absolute inset-0 rounded-xl animate-ping-slow"
              style={{
                background: `radial-gradient(circle, ${gradeInfo.color}60 0%, transparent 70%)`,
              }}
            />
            <span
              className="absolute -inset-2 rounded-2xl"
              style={{
                background: `radial-gradient(circle, ${gradeInfo.color}30 0%, transparent 60%)`,
                filter: 'blur(8px)',
              }}
            />
          </>
        )}

        {/* Struggling indicator */}
        {ws.isStruggling && !ws.isActive && (
          <span className="absolute -top-2 -right-2 text-lg animate-bounce">
            💡
          </span>
        )}

        {/* Word text */}
        <span className={`
          relative z-10 font-bold
          ${ws.isActive ? 'text-white' : 'text-gray-800'}
          ${ws.isStruggling ? 'underline decoration-wavy decoration-yellow-400' : ''}
        `}>
          {isShowingHelp ? (
            // Show syllable breakdown
            <span className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl">{syllables.join(' · ')}</span>
              <span className="text-sm text-gray-600 mt-1">{hint}</span>
            </span>
          ) : (
            cleanWord
          )}
        </span>
        {punctuation && <span className="relative z-10">{punctuation}</span>}

        {/* Phonetic popup */}
        {isShowingHelp && hasHelp && (
          <div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-30
                       bg-white rounded-2xl shadow-2xl p-4 min-w-[200px]
                       animate-fade-in-up"
          >
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2
                          w-4 h-4 bg-white rotate-45" />
            <div className="relative">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  {syllables.map((syl, i) => (
                    <span key={i}>
                      <span className="text-purple-600">{syl}</span>
                      {i < syllables.length - 1 && <span className="text-gray-400 mx-1">·</span>}
                    </span>
                  ))}
                </div>
                <div className="text-lg text-gray-600 mb-1">
                  Say it like: <span className="font-bold text-purple-600">{hint}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Tap again to close
                </div>
              </div>
            </div>
          </div>
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm shadow-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800">{story.title}</h1>
          <p className="text-sm text-gray-500">Page {currentPage + 1} of {story.pages.length}</p>
        </div>

        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200">
        <div
          className={`h-full bg-gradient-to-r ${gradeInfo.bgGradient} transition-all duration-500`}
          style={{ width: `${((currentPage + 1) / story.pages.length) * 100}%` }}
        />
      </div>

      {/* Book content area */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="flex-1 flex flex-col items-center justify-center p-6 md:p-12"
        style={{ touchAction: 'none' }}
      >
        {/* Page content - book style */}
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
          {/* Book decorations */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-200 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-gray-100 to-transparent" />

          {/* Page emoji decoration */}
          <div className="absolute top-4 right-4 text-4xl opacity-20">
            {story.coverEmoji}
          </div>

          {/* Text content */}
          <div className="relative text-center leading-relaxed">
            <p className="text-2xl md:text-4xl font-serif text-gray-800 leading-loose">
              {wordStates.map((ws, index) => renderWord(ws, index))}
            </p>
          </div>

          {/* Page decoration */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-300">
            ✧ ✧ ✧
          </div>
        </div>

        {/* Reading instruction */}
        <p className="text-gray-500 mt-6 text-center text-sm md:text-base animate-pulse">
          Slide your finger under each word as you read ✨
        </p>

        {/* Page complete celebration */}
        {showPageComplete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 animate-bounce-in">
              <div className="text-6xl mb-4">🌟</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Amazing!</h2>
              <p className="text-gray-600 mb-6">You finished this page!</p>

              <div className="flex gap-4">
                {currentPage > 0 && (
                  <button
                    onClick={() => {
                      setShowPageComplete(false);
                      goToPrevPage();
                    }}
                    className="flex-1 py-3 px-6 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowPageComplete(false);
                    goToNextPage();
                  }}
                  className={`flex-1 py-3 px-6 rounded-full bg-gradient-to-r ${gradeInfo.bgGradient} text-white font-bold hover:opacity-90 transition-opacity`}
                >
                  {currentPage < story.pages.length - 1 ? 'Next Page →' : 'Finish! 🎉'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="p-4 bg-white/80 backdrop-blur-sm flex justify-between items-center">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className={`py-2 px-4 rounded-full font-medium transition-all
            ${currentPage === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          ← Previous
        </button>

        <div className="flex gap-1">
          {story.pages.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all
                ${i === currentPage
                  ? `bg-gradient-to-r ${gradeInfo.bgGradient} w-4`
                  : i < currentPage
                    ? 'bg-gray-400'
                    : 'bg-gray-200'}`}
            />
          ))}
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage === story.pages.length - 1 && !showPageComplete}
          className={`py-2 px-4 rounded-full font-medium transition-all
            ${currentPage === story.pages.length - 1 && !showPageComplete
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : `bg-gradient-to-r ${gradeInfo.bgGradient} text-white hover:opacity-90`}`}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
