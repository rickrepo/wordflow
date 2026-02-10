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
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [pageComplete, setPageComplete] = useState(false);
  const [showPageTransition, setShowPageTransition] = useState(false);
  const [pageFading, setPageFading] = useState(false);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [textLines, setTextLines] = useState<TextLine[]>([]);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const pointerXRef = useRef<number | null>(null);
  const isPointerDownRef = useRef(false);
  const swipeActiveRef = useRef(false);    // true ONLY after confirmed deliberate swipe
  const startXRef = useRef(0);             // X at pointerDown
  const fingerRef = useRef<HTMLDivElement>(null);
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
      isCompleted: false,
      visitCount: 0,
      isStruggling: false,
    })));
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
      }, 1500); // patient delay so kids can finish reading the completed page
    }
  }, [wordStates, pageComplete, progress, isLastPage, onComplete]);

  const nextWordIndex = wordStates.findIndex(ws => !ws.isCompleted);

  // Figure out which line is "active" (has the next word to read)
  const activeLineIndex = textLines.findIndex(line =>
    line.wordIndices.includes(nextWordIndex)
  );

  // Two-phase state machine:
  //   IDLE  → finger is down but we don't know if it's a tap or swipe yet
  //   SWIPE → confirmed deliberate rightward swipe, now we complete words
  // Transition: pointer must move 50px net rightward from touch start.
  // This is ~13mm on a phone — impossible to hit with a tap, easy with a swipe.
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || showHelp || showPageTransition || pageComplete) return;
    if (!isPointerDownRef.current) return;

    const x = e.clientX;
    const y = e.clientY - 10;

    // Always update finger visual for responsiveness (even before swipe confirmed)
    if (textBoxRef.current) {
      const boxRect = textBoxRef.current.getBoundingClientRect();
      pointerXRef.current = x - boxRect.left;

      if (fingerRef.current && hasStartedReading) {
        const activeLine = textLines[activeLineIndex];
        if (activeLine) {
          const lineWidth = activeLine.right - activeLine.left + 8;
          const nextToReadIdx = wordStates.findIndex(ws => !ws.isCompleted);
          let maxX = lineWidth - 28;
          if (nextToReadIdx >= 0 && wordRefs.current[nextToReadIdx]) {
            const nextWordRect = wordRefs.current[nextToReadIdx]!.getBoundingClientRect();
            maxX = nextWordRect.right - boxRect.left - activeLine.left + 8;
          }
          const fingerX = pointerXRef.current - activeLine.left + 4;
          const clampedX = Math.max(0, Math.min(fingerX, maxX));
          fingerRef.current.style.left = `${clampedX}px`;
          fingerRef.current.style.transition = 'left 0.05s linear';
        }
      }
    }

    // Phase 1: Is this a confirmed swipe yet?
    if (!swipeActiveRef.current) {
      if (x - startXRef.current >= 50) {
        swipeActiveRef.current = true;
        if (!hasStartedReading) setHasStartedReading(true);
      } else {
        return; // still might be a tap — do nothing
      }
    }

    // Phase 2: Swipe confirmed — complete words the finger has passed
    setWordStates(prev => {
      let changed = false;
      const updated = prev.map(ws => ({ ...ws }));

      for (let i = 0; i < updated.length; i++) {
        if (updated[i].isCompleted) continue;

        const ref = wordRefs.current[i];
        if (!ref) break;

        const rect = ref.getBoundingClientRect();
        const fingerBelowLine = y > rect.bottom + 25;
        const onSameLine = y >= rect.top - 25 && y <= rect.bottom + 25;
        const fingerPastWord = x >= rect.left + rect.width * 0.3;

        if (fingerBelowLine || (onSameLine && fingerPastWord)) {
          const newVisitCount = updated[i].visitCount + 1;
          updated[i] = {
            ...updated[i],
            isCompleted: true,
            visitCount: newVisitCount,
            isStruggling: newVisitCount >= STRUGGLE_THRESHOLD,
          };
          changed = true;
        } else {
          break;
        }
      }

      return changed ? updated : prev;
    });
  }, [showHelp, showPageTransition, pageComplete, wordStates, hasStartedReading, textLines, activeLineIndex]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    swipeActiveRef.current = false; // every new touch starts as not-a-swipe
    startXRef.current = e.clientX;
  }, []);

  const handlePointerUp = useCallback(() => {
    isPointerDownRef.current = false;
    swipeActiveRef.current = false;
    // Snap finger back to next word position via DOM
    if (fingerRef.current && textBoxRef.current) {
      const nextIdx = wordStates.findIndex(ws => !ws.isCompleted);
      const activeLine = textLines.find(line => line.wordIndices.includes(nextIdx));
      if (activeLine && nextIdx >= 0 && wordRefs.current[nextIdx]) {
        const wordRect = wordRefs.current[nextIdx]!.getBoundingClientRect();
        const boxRect = textBoxRef.current.getBoundingClientRect();
        const defaultX = wordRect.left - boxRect.left - activeLine.left + 4;
        const lineWidth = activeLine.right - activeLine.left + 8;
        const clampedX = Math.max(0, Math.min(defaultX, lineWidth - 28));
        fingerRef.current.style.left = `${clampedX}px`;
        fingerRef.current.style.transition = 'left 0.2s ease-out';
      }
    }
  }, [wordStates, textLines]);

  // Word tap for help
  const handleWordTap = (index: number) => {
    const ws = wordStates[index];
    if (ws.visitCount >= 2 || ws.isStruggling) {
      setShowHelp(ws.cleanWord);
    }
  };

  // Check if all words on a line are completed
  const isLineCompleted = (line: TextLine) =>
    line.wordIndices.every(i => wordStates[i]?.isCompleted);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' } as React.CSSProperties}
    >
      {/* Full-screen immersive story scene */}
      <StoryScene storyId={story.id} />

      {/* Floating controls - z-index 20 to stay above the main reading area */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
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
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 20 }}>
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
                const wordStyle: React.CSSProperties = {
                  display: 'inline',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease-out',
                  position: 'relative',
                  padding: '2px 4px',
                };

                if (ws.isCompleted) {
                  // Done - dark text
                  wordStyle.color = '#1F2937';
                } else {
                  // Unread (including next) - gray until finger reaches it
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
                      {ws.isStruggling && (
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
                  {/* Finger indicator: always visible on active line */}
                  {active && !pageComplete && (() => {
                    // Compute where the next word on this line is
                    const nextWordOnLine = line.wordIndices.find(idx => !wordStates[idx]?.isCompleted);
                    let defaultX = 0;
                    if (nextWordOnLine !== undefined && wordRefs.current[nextWordOnLine] && textBoxRef.current) {
                      const wordRect = wordRefs.current[nextWordOnLine]!.getBoundingClientRect();
                      const boxRect = textBoxRef.current.getBoundingClientRect();
                      defaultX = wordRect.left - boxRect.left - line.left + 4;
                    }

                    const clampedX = Math.max(0, Math.min(defaultX, lineWidth - 28));

                    return !hasStartedReading ? (
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
                    ) : (
                      <div
                        ref={fingerRef}
                        style={{
                          position: 'absolute',
                          top: -10,
                          left: clampedX,
                          fontSize: 28,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                          transition: 'left 0.2s ease-out',
                          pointerEvents: 'none',
                        }}
                      >
                        👆
                      </div>
                    );
                  })()}
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
