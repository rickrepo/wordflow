'use client';

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { type Story, gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { getPhoneticHelp, getSyllables, getAgeAppropriateHint } from '@/lib/phonetics';
import { recordPageComplete, loadProgress, type GameProgress } from '@/lib/gameState';
import StoryScene from './illustrations/StoryScene';

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

// A detected line of text with its Y position and full width
interface TextLine {
  y: number;       // bottom edge of the line (where underline goes)
  left: number;    // leftmost word edge
  right: number;   // rightmost word edge
  wordIndices: number[];
}

const STRUGGLE_THRESHOLD = 3;

export default function StoryReader({ story, gradeLevel, onBack, onComplete }: StoryReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [pageComplete, setPageComplete] = useState(false);
  const [showPageTransition, setShowPageTransition] = useState(false);
  const [pageFading, setPageFading] = useState(false);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [textLines, setTextLines] = useState<TextLine[]>([]);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [pointerXOnLine, setPointerXOnLine] = useState<number | null>(null); // relative to textBox left
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textBoxRef = useRef<HTMLDivElement>(null);

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
    setTextLines([]);
    setHasStartedReading(false);
    wordRefs.current = [];
  }, [pageText, currentPage]);

  // Detect lines of text by measuring word positions after render
  useLayoutEffect(() => {
    if (wordStates.length === 0 || wordRefs.current.length === 0) return;

    // Small delay to ensure layout is settled
    const timer = setTimeout(() => {
      if (!textBoxRef.current) return;
      const boxRect = textBoxRef.current.getBoundingClientRect();
      const lines: TextLine[] = [];
      const lineMap = new Map<number, { left: number; right: number; indices: number[] }>();

      wordRefs.current.forEach((ref, index) => {
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        // Round Y to group words on the same visual line (within 5px)
        const bottomY = Math.round(rect.bottom);
        let matchedKey: number | null = null;
        for (const key of lineMap.keys()) {
          if (Math.abs(key - bottomY) < 10) {
            matchedKey = key;
            break;
          }
        }
        const key = matchedKey ?? bottomY;
        const existing = lineMap.get(key);
        if (existing) {
          existing.left = Math.min(existing.left, rect.left);
          existing.right = Math.max(existing.right, rect.right);
          existing.indices.push(index);
        } else {
          lineMap.set(key, { left: rect.left, right: rect.right, indices: [index] });
        }
      });

      lineMap.forEach((val, key) => {
        lines.push({
          y: key - boxRect.top, // relative to text box
          left: val.left - boxRect.left,
          right: val.right - boxRect.left,
          wordIndices: val.indices,
        });
      });

      lines.sort((a, b) => a.y - b.y);
      setTextLines(lines);
    }, 50);

    return () => clearTimeout(timer);
  }, [wordStates]);

  // Check page completion
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
          // Simple fade transition to next page
          setPageFading(true);
          setTimeout(() => {
            setCurrentPage(prev => prev + 1);
            setPageFading(false);
          }, 400);
        }
      }, 300);
    }
  }, [wordStates, pageComplete, progress, isLastPage, onComplete]);

  // Pointer handler - works for both mouse and touch with touch-action: none
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || showHelp || showPageTransition || pageComplete) return;

    const x = e.clientX;
    const y = e.clientY - 50;

    // Track pointer X position relative to textBox for the finger indicator
    if (textBoxRef.current) {
      const boxRect = textBoxRef.current.getBoundingClientRect();
      setPointerXOnLine(x - boxRect.left);
    }

    // Find which word the pointer is over
    let foundIndex: number | null = null;
    wordRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      if (x >= rect.left - 10 && x <= rect.right + 10 &&
          y >= rect.top - 20 && y <= rect.bottom + 20) {
        foundIndex = index;
      }
    });

    // Strict sequential: only the next unread word can be completed
    const nextToRead = wordStates.findIndex(ws => !ws.isCompleted);

    if (foundIndex !== null) {
      if (!hasStartedReading) setHasStartedReading(true);

      // Only activate and complete if it's the next word in sequence
      if (foundIndex === nextToRead) {
        setActiveWordIndex(foundIndex);
        setWordStates(prev => prev.map((ws, i) => {
          if (i === foundIndex) {
            const newVisitCount = ws.visitCount + 1;
            return {
              ...ws,
              isActive: true,
              isCompleted: true,
              visitCount: newVisitCount,
              isStruggling: newVisitCount >= STRUGGLE_THRESHOLD,
            };
          }
          return { ...ws, isActive: false };
        }));
      } else if (foundIndex !== activeWordIndex) {
        // Swiped over a word that's not next - just show it's active but don't complete
        setActiveWordIndex(foundIndex);
        setWordStates(prev => prev.map((ws, i) => ({
          ...ws,
          isActive: i === foundIndex,
        })));
      }
    } else if (activeWordIndex !== null) {
      setActiveWordIndex(null);
      setWordStates(prev => prev.map(ws => ({ ...ws, isActive: false })));
    }
  }, [activeWordIndex, showHelp, showPageTransition, pageComplete, wordStates, hasStartedReading]);

  // Word tap for help
  const handleWordTap = (index: number) => {
    const ws = wordStates[index];
    if (ws.visitCount >= 2 || ws.isStruggling) {
      setShowHelp(ws.cleanWord);
    }
  };

  const nextWordIndex = wordStates.findIndex(ws => !ws.isCompleted);

  // Figure out which line is "active" (has the next word to read)
  const activeLineIndex = textLines.findIndex(line =>
    line.wordIndices.includes(nextWordIndex)
  );

  // Check if all words on a line are completed
  const isLineCompleted = (line: TextLine) =>
    line.wordIndices.every(i => wordStates[i]?.isCompleted);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' } as React.CSSProperties}
    >
      {/* Full-screen immersive story scene */}
      <StoryScene storyId={story.id} />

      {/* Floating controls */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.9)', padding: '8px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <svg style={{ width: 18, height: 18, color: '#4B5563' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Books</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.9)', padding: '8px 14px', borderRadius: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: 18 }}>{story.coverEmoji}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{currentPage + 1}/{totalPages}</span>
        </div>
      </div>

      {/* Progress dots at bottom */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
        {story.pages.map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 9999,
              transition: 'all 0.3s',
              width: i === currentPage ? 24 : 8,
              height: 8,
              background: i === currentPage ? '#3B82F6' : i < currentPage ? '#60A5FA' : 'rgba(255,255,255,0.6)',
            }}
          />
        ))}
      </div>

      {/* Main reading area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative', zIndex: 10, opacity: pageFading ? 0 : 1, transition: 'opacity 0.35s ease' }}>
        <div style={{ width: '100%', maxWidth: 768 }}>
          {/* Text container with guide lines */}
          <div
            ref={textBoxRef}
            style={{
              position: 'relative',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 16,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.5)',
              padding: '32px 24px',
            }}
          >
            {/* The text */}
            <p style={{ textAlign: 'center', lineHeight: 2.8, fontWeight: 500, margin: 0, fontSize: 'clamp(1.4rem, 5vw, 2.2rem)' }}>
              {wordStates.map((ws, i) => {
                const isNextWord = i === nextWordIndex;

                const wordStyle: React.CSSProperties = {
                  display: 'inline',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-out',
                  position: 'relative',
                  borderRadius: 4,
                  padding: '2px 4px',
                };

                if (ws.isActive && (ws.isCompleted || isNextWord)) {
                  // Active on the correct next word - blue highlight
                  wordStyle.background = '#3B82F6';
                  wordStyle.color = 'white';
                  wordStyle.borderRadius = 6;
                  wordStyle.boxShadow = '0 2px 8px rgba(59,130,246,0.4)';
                } else if (ws.isActive && !ws.isCompleted) {
                  // Finger is on wrong word (not next) - subtle red hint
                  wordStyle.background = 'rgba(239,68,68,0.15)';
                  wordStyle.color = '#9CA3AF';
                  wordStyle.borderRadius = 6;
                } else if (ws.isCompleted) {
                  wordStyle.color = '#1F2937';
                } else if (isNextWord) {
                  // Next word to read - bold with bright yellow background
                  wordStyle.color = '#1F2937';
                  wordStyle.fontWeight = 700;
                  wordStyle.background = 'rgba(253,224,71,0.5)';
                  wordStyle.borderRadius = 6;
                  wordStyle.boxShadow = '0 0 6px rgba(253,224,71,0.4)';
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
                        <span style={{ fontSize: '0.6em', verticalAlign: 'super', marginLeft: 2 }}>💡</span>
                      )}
                    </span>
                    {i < wordStates.length - 1 && ' '}
                  </span>
                );
              })}
            </p>

            {/* Guide lines under each line of text */}
            {textLines.map((line, lineIdx) => {
              const completed = isLineCompleted(line);
              const active = lineIdx === activeLineIndex;
              let lineColor = '#E5E7EB'; // gray for unread
              if (completed) lineColor = '#86EFAC'; // green for done
              else if (active) lineColor = '#3B82F6'; // blue for current
              const lineWidth = line.right - line.left + 8;

              return (
                <div key={lineIdx} style={{ position: 'absolute', left: line.left - 4, top: line.y + 4, width: lineWidth, pointerEvents: 'none' }}>
                  {/* The line itself */}
                  <div
                    style={{
                      width: '100%',
                      height: active ? 4 : 3,
                      borderRadius: 2,
                      background: lineColor,
                      transition: 'all 0.3s ease',
                      boxShadow: active ? '0 0 8px rgba(59,130,246,0.4)' : 'none',
                    }}
                  />
                  {/* Finger indicator: animated hint when not started, follows pointer when swiping */}
                  {active && !pageComplete && (
                    hasStartedReading && pointerXOnLine !== null ? (
                      <div
                        style={{
                          position: 'absolute',
                          top: -10,
                          left: Math.max(0, Math.min(pointerXOnLine - line.left + 4, lineWidth - 28)),
                          fontSize: 28,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                          transition: 'left 0.05s linear',
                          pointerEvents: 'none',
                        }}
                      >
                        👆
                      </div>
                    ) : !hasStartedReading && (
                      <div
                        className="hand-guide"
                        style={{
                          position: 'absolute',
                          top: -10,
                          left: 0,
                          fontSize: 28,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                        }}
                      >
                        👆
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Help modal */}
      {showHelp && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={() => setShowHelp(null)}
        >
          <div
            style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 384, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 32, fontWeight: 700, color: '#1F2937' }}>
                {getSyllables(showHelp).map((syl, i) => (
                  <span key={i}>
                    <span style={{ color: '#3B82F6' }}>{syl}</span>
                    {i < getSyllables(showHelp).length - 1 && (
                      <span style={{ color: '#D1D5DB', margin: '0 4px' }}>·</span>
                    )}
                  </span>
                ))}
              </p>
            </div>

            <div style={{ background: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#93C5FD', marginBottom: 4 }}>Say it like</p>
              <p style={{ fontSize: 20, fontWeight: 600, color: '#2563EB' }}>
                {getAgeAppropriateHint(showHelp, gradeLevel)}
              </p>
            </div>

            {getPhoneticHelp(showHelp)?.hint && (
              <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
                💡 {getPhoneticHelp(showHelp)?.hint}
              </p>
            )}

            <button
              onClick={() => setShowHelp(null)}
              style={{ width: '100%', padding: 12, background: '#3B82F6', color: 'white', borderRadius: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 16 }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* CSS animation for the hand guide */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-right {
          0% { transform: translateX(0); opacity: 0.9; }
          80% { transform: translateX(calc(100% - 28px)); opacity: 0.9; }
          100% { transform: translateX(0); opacity: 0.5; }
        }
        .hand-guide {
          animation: slide-right 2.5s ease-in-out infinite;
        }
      `}} />

    </div>
  );
}
