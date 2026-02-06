'use client';

import { useState, useEffect } from 'react';
import { type Story, gradeLevelInfo, type GradeLevel } from '@/lib/stories';

interface CompletionScreenProps {
  story: Story;
  gradeLevel: GradeLevel;
  onReadAgain: () => void;
  onChooseAnother: () => void;
  onHome: () => void;
}

export default function CompletionScreen({
  story,
  gradeLevel,
  onReadAgain,
  onChooseAnother,
  onHome,
}: CompletionScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [starsEarned] = useState(() => Math.floor(Math.random() * 2) + 3); // 3-5 stars
  const gradeInfo = gradeLevelInfo[gradeLevel];

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradeInfo.bgGradient} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => {
            const colors = ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B6B', '#C9B1FF'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: Math.random() * 100 + '%',
                  top: -20 + 'px',
                  width: Math.random() * 10 + 5 + 'px',
                  height: Math.random() * 10 + 5 + 'px',
                  backgroundColor: randomColor,
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  animationDelay: Math.random() * 2 + 's',
                  animationDuration: Math.random() * 2 + 3 + 's',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Floating celebration emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🌟', '⭐', '✨', '🎉', '🎊', '🏆'].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-4xl animate-float-up opacity-70"
            style={{
              left: (i * 15) + 10 + '%',
              bottom: '-50px',
              animationDelay: i * 0.3 + 's',
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Trophy and celebration */}
        <div className="animate-bounce-in">
          <div className="text-8xl mb-4 animate-wiggle">
            🏆
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 animate-fade-in-up">
            You Did It!
          </h1>
          <p className="text-xl text-white/90 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            You finished reading
          </p>
        </div>

        {/* Book card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-5xl mb-3">{story.coverEmoji}</div>
          <h2 className="text-2xl font-bold text-gray-800">{story.title}</h2>
          <p className="text-gray-500">by {story.author}</p>

          {/* Stars earned */}
          <div className="mt-4 flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-3xl transition-all duration-300 ${i < starsEarned ? 'animate-star-pop' : 'opacity-30'}`}
                style={{ animationDelay: i * 0.2 + 's' }}
              >
                ⭐
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            You earned {starsEarned} stars!
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={onReadAgain}
            className="w-full py-4 px-6 rounded-full bg-white text-gray-800 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            📖 Read Again
          </button>
          <button
            onClick={onChooseAnother}
            className="w-full py-4 px-6 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-lg hover:bg-white/30 transition-all"
          >
            📚 Choose Another Story
          </button>
          <button
            onClick={onHome}
            className="w-full py-4 px-6 rounded-full bg-transparent text-white/80 font-medium hover:text-white transition-all"
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
