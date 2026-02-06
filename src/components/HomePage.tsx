'use client';

import { useState } from 'react';
import { gradeLevelInfo, type GradeLevel } from '@/lib/stories';

interface HomePageProps {
  onSelectGrade: (grade: GradeLevel) => void;
}

export default function HomePage({ onSelectGrade }: HomePageProps) {
  const [hoveredGrade, setHoveredGrade] = useState<GradeLevel | null>(null);

  const gradeButtons: { grade: GradeLevel; emoji: string; label: string }[] = [
    { grade: 'jk', emoji: '🌟', label: 'JK' },
    { grade: 'sk', emoji: '🦋', label: 'SK' },
    { grade: 'grade1', emoji: '🚀', label: 'Grade 1' },
    { grade: 'grade2', emoji: '🌈', label: 'Grade 2' },
    { grade: 'grade3', emoji: '🔮', label: 'Grade 3' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 2 + 2 + 's',
            }}
          />
        ))}
      </div>

      {/* Floating book decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['📚', '📖', '✨', '🌙', '⭐'].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-4xl animate-float opacity-30"
            style={{
              left: (i * 20) + 10 + '%',
              top: Math.random() * 80 + 10 + '%',
              animationDelay: i * 0.5 + 's',
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Logo/Title */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 tracking-tight">
            <span className="inline-block animate-bounce-slow" style={{ animationDelay: '0s' }}>W</span>
            <span className="inline-block animate-bounce-slow" style={{ animationDelay: '0.1s' }}>o</span>
            <span className="inline-block animate-bounce-slow" style={{ animationDelay: '0.2s' }}>r</span>
            <span className="inline-block animate-bounce-slow" style={{ animationDelay: '0.3s' }}>d</span>
            <span className="inline-block animate-bounce-slow text-yellow-300" style={{ animationDelay: '0.4s' }}>F</span>
            <span className="inline-block animate-bounce-slow text-yellow-300" style={{ animationDelay: '0.5s' }}>l</span>
            <span className="inline-block animate-bounce-slow text-yellow-300" style={{ animationDelay: '0.6s' }}>o</span>
            <span className="inline-block animate-bounce-slow text-yellow-300" style={{ animationDelay: '0.7s' }}>w</span>
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 font-light">
            ✨ Magical Reading Adventures ✨
          </p>
        </div>

        {/* Mascot */}
        <div className="text-8xl mb-8 animate-bounce-slow">
          📖
        </div>

        {/* Grade selection prompt */}
        <p className="text-2xl md:text-3xl text-white mb-8 font-medium animate-fade-in" style={{ animationDelay: '0.5s' }}>
          How old are you?
        </p>

        {/* Grade level buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          {gradeButtons.map(({ grade, emoji, label }) => {
            const info = gradeLevelInfo[grade];
            const isHovered = hoveredGrade === grade;

            return (
              <button
                key={grade}
                onClick={() => onSelectGrade(grade)}
                onMouseEnter={() => setHoveredGrade(grade)}
                onMouseLeave={() => setHoveredGrade(null)}
                onTouchStart={() => setHoveredGrade(grade)}
                onTouchEnd={() => setHoveredGrade(null)}
                className={`
                  relative p-6 rounded-3xl
                  bg-gradient-to-br ${info.bgGradient}
                  transform transition-all duration-300 ease-out
                  ${isHovered ? 'scale-110 shadow-2xl -translate-y-2' : 'scale-100 shadow-lg'}
                  active:scale-95
                  group
                `}
                style={{
                  boxShadow: isHovered
                    ? `0 20px 40px -10px ${info.color}80`
                    : `0 10px 20px -5px ${info.color}40`,
                }}
              >
                {/* Sparkle effect on hover */}
                {isHovered && (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </div>
                )}

                <div className="relative z-10">
                  <div className={`text-4xl md:text-5xl mb-2 transition-transform duration-300 ${isHovered ? 'scale-125' : ''}`}>
                    {emoji}
                  </div>
                  <div className="text-white font-bold text-lg md:text-xl">
                    {label}
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    {info.ageRange}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-purple-300 mt-12 text-sm md:text-base animate-fade-in" style={{ animationDelay: '1s' }}>
          Tap your age to start reading magical stories!
        </p>
      </div>
    </div>
  );
}
