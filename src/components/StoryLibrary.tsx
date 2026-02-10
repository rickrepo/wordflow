'use client';

import { useEffect, useState } from 'react';
import { getStoriesByGrade, gradeLevelInfo, type GradeLevel, type Story } from '@/lib/stories';
import { loadProgress, type GameProgress } from '@/lib/gameState';

interface StoryLibraryProps {
  gradeLevel: GradeLevel;
  onSelectStory: (story: Story) => void;
  onBack: () => void;
}

const floatingElements = [
  { emoji: '📚', x: 8, y: 12, size: 36, delay: 0 },
  { emoji: '✨', x: 88, y: 18, size: 28, delay: 0.5 },
  { emoji: '🌟', x: 12, y: 72, size: 32, delay: 1 },
  { emoji: '📖', x: 82, y: 68, size: 34, delay: 1.5 },
  { emoji: '🎈', x: 6, y: 42, size: 30, delay: 2 },
  { emoji: '🦄', x: 92, y: 42, size: 34, delay: 2.5 },
];

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

  const completedCount = progress
    ? progress.booksCompleted.filter(id => stories.some(s => s.id === id)).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-purple-300 to-pink-200 relative overflow-hidden">
      {/* Animated background clouds - same as HomePage */}
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

      {/* Floating animated elements - same style as HomePage */}
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
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-twinkle pointer-events-none"
          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${15 + Math.random() * 70}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          <span className="text-2xl">✨</span>
        </div>
      ))}

      {/* Header - same style as HomePage */}
      <header className="relative z-10 p-4 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg hover:scale-105 transition-all"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-bold text-gray-700">Home</span>
        </button>

        {progress && progress.totalStars > 0 && (
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <span className="text-amber-500 text-xl animate-pulse-star">⭐</span>
            <span className="font-bold text-gray-700 text-lg">{progress.totalStars}</span>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-2 pb-16">
        {/* Title section - matching HomePage style */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 animate-mascot-bounce">
            {gradeLevel === 'jk' ? '🐣' : gradeLevel === 'sk' ? '🐥' : gradeLevel === 'grade1' ? '🦊' : gradeLevel === 'grade2' ? '🦁' : '🔮'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-2 animate-title-pop">
            {gradeInfo.name}
          </h1>
          <p className="text-lg text-white/90 font-medium drop-shadow">
            Pick a story to read! 📖
          </p>
        </div>

        {/* Story cards */}
        <div className="w-full max-w-md space-y-3">
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
                  w-full flex items-center gap-4 p-4 rounded-2xl shadow-lg
                  transform transition-all duration-200 ease-out
                  ${isHovered ? 'scale-105 -translate-y-1' : 'scale-100'}
                  hover:shadow-xl active:scale-98
                  animate-card-slide-in
                `}
                style={{
                  backgroundColor: isHovered ? gradeInfo.color : 'white',
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Cover emoji */}
                <div
                  className={`
                    w-16 h-16 rounded-xl flex items-center justify-center text-3xl
                    transition-all duration-200 relative
                    ${isHovered ? 'bg-white/30 scale-110 animate-wiggle' : 'bg-gray-50'}
                  `}
                >
                  {story.coverEmoji}
                  {completed && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow">
                      ✓
                    </div>
                  )}
                </div>

                {/* Story info */}
                <div className="flex-1 text-left">
                  <div className={`text-lg font-bold transition-colors ${isHovered ? 'text-white' : 'text-gray-800'}`}>
                    {story.title}
                  </div>
                  <div className={`text-sm font-medium transition-colors ${isHovered ? 'text-white/80' : 'text-gray-400'}`}>
                    {story.pages.length} pages · {story.theme}
                    {completed && ' · Done! 🎉'}
                  </div>
                </div>

                {/* Arrow */}
                <div className={`text-2xl transition-all duration-200 ${isHovered ? 'translate-x-1 text-white' : 'text-gray-300'}`}>
                  →
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress summary - matching HomePage style */}
        {progress && completedCount > 0 && (
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-sm w-full animate-fade-in-up">
            <h3 className="text-center text-gray-600 font-medium mb-4">Progress 🏆</h3>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">{completedCount}</div>
                <div className="text-xs text-gray-400 font-medium">of {stories.length} done</div>
              </div>
              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / stories.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Fun footer */}
        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm font-medium animate-pulse-slow">
            {stories.length - completedCount > 0
              ? `${stories.length - completedCount} adventures waiting! 🚀`
              : 'All books completed! Amazing! 🌟'}
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

        @keyframes title-pop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-title-pop {
          animation: title-pop 0.6s ease-out forwards;
          animation-delay: 0.1s;
          opacity: 0;
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
