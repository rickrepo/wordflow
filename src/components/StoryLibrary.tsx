'use client';

import { useEffect, useState } from 'react';
import { getStoriesByGrade, gradeLevelInfo, type GradeLevel, type Story } from '@/lib/stories';
import { loadProgress, type GameProgress } from '@/lib/gameState';

interface StoryLibraryProps {
  gradeLevel: GradeLevel;
  onSelectStory: (story: Story) => void;
  onBack: () => void;
}

// Floating animated elements
function FloatingElement({ emoji, delay, duration, left, size }: { emoji: string; delay: number; duration: number; left: number; size: number }) {
  return (
    <div
      className="absolute animate-float-up pointer-events-none"
      style={{
        left: `${left}%`,
        bottom: '-50px',
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        fontSize: `${size}px`,
        opacity: 0.6,
      }}
    >
      {emoji}
    </div>
  );
}

export default function StoryLibrary({ gradeLevel, onSelectStory, onBack }: StoryLibraryProps) {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [hoveredStory, setHoveredStory] = useState<string | null>(null);
  const stories = getStoriesByGrade(gradeLevel);
  const gradeInfo = gradeLevelInfo[gradeLevel];

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const isCompleted = (storyId: string) =>
    progress?.booksCompleted.includes(storyId) || false;

  // Generate floating elements
  const floatingEmojis = ['📚', '⭐', '✨', '🎨', '📖', '🌟', '🎉', '💫'];
  const floaters = Array.from({ length: 12 }, (_, i) => ({
    emoji: floatingEmojis[i % floatingEmojis.length],
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 6,
    left: Math.random() * 100,
    size: 20 + Math.random() * 20,
  }));

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: `linear-gradient(135deg, ${gradeInfo.color}30 0%, #fff5e0 25%, ${gradeInfo.color}20 50%, #e0f7ff 75%, ${gradeInfo.color}30 100%)`,
          backgroundSize: '400% 400%',
        }}
      />

      {/* Floating background elements */}
      {floaters.map((f, i) => (
        <FloatingElement key={i} {...f} />
      ))}

      {/* Decorative shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-200/40 rounded-full blur-2xl animate-pulse-slow" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-pink-200/40 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-blue-200/40 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-white/50 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/80 text-gray-500 hover:text-gray-700 hover:bg-white hover:scale-110 transition-all shadow-lg border border-white/50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl animate-bounce-slow">{gradeInfo.name === 'Junior Kindergarten' ? '🐣' : gradeInfo.name === 'Senior Kindergarten' ? '🐥' : gradeInfo.name === 'Grade 1' ? '🦊' : '🦁'}</span>
              {gradeInfo.name}
            </h1>
            <p className="text-gray-500">{stories.length} adventures waiting!</p>
          </div>

          {progress && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-2xl shadow-md border border-amber-200/50">
              <span className="text-2xl animate-spin-slow">⭐</span>
              <div className="text-right">
                <div className="font-bold text-amber-700">{progress.totalStars}</div>
                <div className="text-xs text-amber-600">stars</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero section */}
      <div className="relative z-10 text-center py-8 px-4">
        <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-2">
          Pick Your Adventure!
        </h2>
        <p className="text-gray-600 text-lg">
          Tap a book to start reading 📖
        </p>
      </div>

      {/* Story grid */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((story, index) => {
            const completed = isCompleted(story.id);
            const isHovered = hoveredStory === story.id;

            return (
              <button
                key={story.id}
                onClick={() => onSelectStory(story)}
                onMouseEnter={() => setHoveredStory(story.id)}
                onMouseLeave={() => setHoveredStory(null)}
                className={`
                  relative group text-left overflow-hidden
                  bg-white/90 backdrop-blur-sm rounded-3xl p-6
                  border-2 transition-all duration-300
                  shadow-lg hover:shadow-2xl
                  ${completed ? 'border-green-300' : 'border-white/50 hover:border-blue-300'}
                  ${isHovered ? 'scale-105 -rotate-1' : 'scale-100 rotate-0'}
                `}
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Completion badge */}
                {completed && (
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12 z-10">
                    <span className="text-white text-2xl">✓</span>
                  </div>
                )}

                {/* Animated background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    background: `linear-gradient(135deg, ${gradeInfo.color}15, transparent)`,
                  }}
                />

                <div className="relative flex items-start gap-4">
                  {/* Cover with animation */}
                  <div
                    className={`
                      w-20 h-20 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0
                      transition-all duration-300 shadow-md
                      ${isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}
                    `}
                    style={{
                      backgroundColor: `${gradeInfo.color}20`,
                      boxShadow: isHovered ? `0 8px 30px ${gradeInfo.color}40` : undefined,
                    }}
                  >
                    <span className={`transition-transform duration-300 ${isHovered ? 'animate-wiggle' : ''}`}>
                      {story.coverEmoji}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className={`
                      text-xl font-bold text-gray-800 mb-1 transition-colors
                      ${isHovered ? 'text-blue-600' : ''}
                    `}>
                      {story.title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-2">
                      {story.theme}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                        📖 {story.pages.length} pages
                      </span>
                      {completed && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                          Done! 🎉
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hover arrow */}
                <div className={`
                  absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                  bg-blue-500 text-white flex items-center justify-center
                  transition-all duration-300 shadow-lg
                  ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                `}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Sparkle effect on hover */}
                {isHovered && (
                  <>
                    <div className="absolute top-2 left-8 text-yellow-400 animate-ping">✨</div>
                    <div className="absolute bottom-4 right-16 text-yellow-400 animate-ping" style={{ animationDelay: '0.3s' }}>✨</div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Completion status */}
        {progress && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-white/50">
              <div className="text-4xl">🏆</div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-800">
                  {progress.booksCompleted.filter(id => stories.some(s => s.id === id)).length} / {stories.length}
                </div>
                <div className="text-gray-500 text-sm">books completed</div>
              </div>
              <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden ml-2">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(progress.booksCompleted.filter(id => stories.some(s => s.id === id)).length / stories.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up linear infinite;
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 15s ease infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
