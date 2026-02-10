'use client';

import { useEffect, useState } from 'react';
import { gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { loadProgress, type GameProgress } from '@/lib/gameState';

interface HomePageProps {
  onSelectGrade: (grade: GradeLevel) => void;
}

const grades: { grade: GradeLevel; label: string; ages: string; emoji: string; color: string }[] = [
  { grade: 'jk', label: 'JK', ages: '3-4', emoji: '🌟', color: '#FFD93D' },
  { grade: 'sk', label: 'SK', ages: '4-5', emoji: '🦋', color: '#6BCB77' },
  { grade: 'grade1', label: 'Grade 1', ages: '5-6', emoji: '🚀', color: '#4D96FF' },
  { grade: 'grade2', label: 'Grade 2', ages: '6-7', emoji: '🌈', color: '#FF6B6B' },
  { grade: 'grade3', label: 'Grade 3', ages: '7-8', emoji: '🔮', color: '#9B59B6' },
];

// Floating animated elements
const floatingElements = [
  { emoji: '📚', x: 10, y: 15, size: 40, delay: 0 },
  { emoji: '✨', x: 85, y: 20, size: 30, delay: 0.5 },
  { emoji: '🌟', x: 15, y: 75, size: 35, delay: 1 },
  { emoji: '📖', x: 80, y: 70, size: 38, delay: 1.5 },
  { emoji: '🎈', x: 5, y: 45, size: 32, delay: 2 },
  { emoji: '🦄', x: 90, y: 45, size: 36, delay: 2.5 },
  { emoji: '🌈', x: 50, y: 8, size: 42, delay: 0.3 },
  { emoji: '🎨', x: 92, y: 85, size: 28, delay: 1.2 },
];

export default function HomePage({ onSelectGrade }: HomePageProps) {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [hoveredGrade, setHoveredGrade] = useState<GradeLevel | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    setProgress(loadProgress());
    // Hide welcome animation after delay
    const timer = setTimeout(() => setShowWelcome(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-pink-200 bg-gradient-to-b from-blue-400 via-purple-300 to-pink-200 relative overflow-hidden">
      {/* Animated background clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-0 animate-cloud-drift-slow">
          <svg width="200" height="80" viewBox="0 0 200 80" className="opacity-40">
            <ellipse cx="60" cy="50" rx="50" ry="25" fill="white" />
            <ellipse cx="100" cy="40" rx="60" ry="30" fill="white" />
            <ellipse cx="150" cy="50" rx="45" ry="22" fill="white" />
          </svg>
        </div>
        <div className="absolute top-32 right-0 animate-cloud-drift-slow" style={{ animationDelay: '3s' }}>
          <svg width="180" height="70" viewBox="0 0 180 70" className="opacity-30">
            <ellipse cx="50" cy="45" rx="45" ry="22" fill="white" />
            <ellipse cx="90" cy="35" rx="55" ry="28" fill="white" />
            <ellipse cx="140" cy="45" rx="40" ry="20" fill="white" />
          </svg>
        </div>
      </div>

      {/* Floating animated elements */}
      {floatingElements.map((el, i) => (
        <div
          key={i}
          className="absolute pointer-events-none animate-float-wobble"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            fontSize: `${el.size}px`,
            animationDelay: `${el.delay}s`,
          }}
        >
          {el.emoji}
        </div>
      ))}

      {/* Sparkle effects */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-twinkle pointer-events-none"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.4}s`,
          }}
        >
          <span className="text-2xl">✨</span>
        </div>
      ))}

      {/* Header with stats */}
      <header className="relative z-10 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {progress && progress.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg animate-bounce-gentle">
              <span className="text-orange-500 text-xl">🔥</span>
              <span className="font-bold text-gray-700">{progress.currentStreak} day streak!</span>
            </div>
          )}
        </div>
        {progress && progress.totalStars > 0 && (
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <span className="text-amber-500 text-xl animate-pulse-star">⭐</span>
            <span className="font-bold text-gray-700 text-lg">{progress.totalStars}</span>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-4 pb-16">
        {/* Welcome animation */}
        <div className={`text-center mb-8 transition-all duration-1000 ${showWelcome ? 'animate-welcome-bounce' : ''}`}>
          {/* Animated mascot */}
          <div className="relative inline-block mb-4">
            <div className="text-8xl md:text-9xl animate-mascot-bounce">
              📚
            </div>
            <div className="absolute -right-4 -top-2 text-4xl animate-sparkle-pop" style={{ animationDelay: '0.5s' }}>
              ✨
            </div>
            <div className="absolute -left-4 top-8 text-3xl animate-sparkle-pop" style={{ animationDelay: '1s' }}>
              🌟
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg mb-3 animate-title-pop">
            WordFlow
          </h1>
          <p className="text-xl text-white/90 font-medium drop-shadow">
            Let&apos;s read amazing stories together!
          </p>
        </div>

        {/* Grade selection cards */}
        <div className="w-full max-w-md">
          <p className="text-center text-white font-semibold text-lg mb-4 drop-shadow">
            Pick your level to start! 🎯
          </p>

          <div className="space-y-3">
            {grades.map(({ grade, label, ages, emoji, color }, index) => {
              const isHovered = hoveredGrade === grade;
              return (
                <button
                  key={grade}
                  onClick={() => onSelectGrade(grade)}
                  onMouseEnter={() => setHoveredGrade(grade)}
                  onMouseLeave={() => setHoveredGrade(null)}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-2xl shadow-lg
                    transform transition-all duration-200 ease-out
                    ${isHovered ? 'scale-105 -translate-y-1' : 'scale-100'}
                    hover:shadow-xl active:scale-98
                    animate-card-slide-in
                  `}
                  style={{
                    backgroundColor: isHovered ? color : 'white',
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div
                    className={`
                      w-16 h-16 rounded-xl flex items-center justify-center text-3xl
                      transition-all duration-200
                      ${isHovered ? 'bg-white/30 scale-110 animate-wiggle' : 'bg-gray-50'}
                    `}
                  >
                    {emoji}
                  </div>

                  <div className="flex-1 text-left">
                    <div className={`text-xl font-bold transition-colors ${isHovered ? 'text-white' : 'text-gray-800'}`}>
                      {label}
                    </div>
                    <div className={`text-sm font-medium transition-colors ${isHovered ? 'text-white/80' : 'text-gray-400'}`}>
                      Ages {ages}
                    </div>
                  </div>

                  <div className={`text-2xl transition-all duration-200 ${isHovered ? 'translate-x-1 text-white' : 'text-gray-300'}`}>
                    →
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress summary */}
        {progress && progress.booksCompleted.length > 0 && (
          <div className="mt-10 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-sm w-full animate-fade-in-up">
            <h3 className="text-center text-gray-600 font-medium mb-4">Your Reading Journey 🏆</h3>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">{progress.booksCompleted.length}</div>
                <div className="text-xs text-gray-400 font-medium">Books Read</div>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500">{progress.totalStars}</div>
                <div className="text-xs text-gray-400 font-medium">Stars Earned</div>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">{progress.longestStreak}</div>
                <div className="text-xs text-gray-400 font-medium">Best Streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Fun footer message */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm font-medium animate-pulse-slow">
            Reading is an adventure! 🚀
          </p>
        </div>
      </main>

      <style jsx>{`
        @keyframes cloud-drift-slow {
          0%, 100% { transform: translateX(-100px); }
          50% { transform: translateX(100px); }
        }
        .animate-cloud-drift-slow {
          animation: cloud-drift-slow 20s ease-in-out infinite;
        }

        @keyframes float-wobble {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          25% { transform: translateY(-15px) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-20px) rotate(3deg); }
        }
        .animate-float-wobble {
          animation: float-wobble 4s ease-in-out infinite;
        }

        @keyframes mascot-bounce {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        .animate-mascot-bounce {
          animation: mascot-bounce 2s ease-in-out infinite;
        }

        @keyframes welcome-bounce {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-welcome-bounce {
          animation: welcome-bounce 0.8s ease-out forwards;
        }

        @keyframes title-pop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-title-pop {
          animation: title-pop 0.6s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }

        @keyframes sparkle-pop {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          80% { transform: scale(0.9); opacity: 1; }
        }
        .animate-sparkle-pop {
          animation: sparkle-pop 2s ease-in-out infinite;
        }

        @keyframes card-slide-in {
          0% { transform: translateX(-50px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-card-slide-in {
          animation: card-slide-in 0.5s ease-out forwards;
          opacity: 0;
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg) scale(1.1); }
          50% { transform: rotate(5deg) scale(1.1); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        @keyframes pulse-star {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-pulse-star {
          animation: pulse-star 1.5s ease-in-out infinite;
        }

        @keyframes fade-in-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
