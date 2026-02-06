'use client';

import { useEffect, useState } from 'react';
import { gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { loadProgress, type GameProgress } from '@/lib/gameState';

interface HomePageProps {
  onSelectGrade: (grade: GradeLevel) => void;
}

const grades: { grade: GradeLevel; label: string; ages: string }[] = [
  { grade: 'jk', label: 'JK', ages: '3-4' },
  { grade: 'sk', label: 'SK', ages: '4-5' },
  { grade: 'grade1', label: 'Grade 1', ages: '5-6' },
  { grade: 'grade2', label: 'Grade 2', ages: '6-7' },
  { grade: 'grade3', label: 'Grade 3', ages: '7-8' },
];

export default function HomePage({ onSelectGrade }: HomePageProps) {
  const [progress, setProgress] = useState<GameProgress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Header with stats */}
      <header className="p-4 flex justify-end">
        {progress && progress.totalStars > 0 && (
          <div className="flex items-center gap-4 bg-white rounded-full px-4 py-2 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500">⭐</span>
              <span className="font-semibold text-gray-700">{progress.totalStars}</span>
            </div>
            {progress.currentStreak > 0 && (
              <>
                <div className="w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-500">🔥</span>
                  <span className="font-semibold text-gray-700">{progress.currentStreak}</span>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center px-6 pt-8 pb-16">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            WordFlow
          </h1>
          <p className="text-gray-500 text-lg">
            Learn to read with fun stories
          </p>
        </div>

        {/* Grade selection */}
        <div className="w-full max-w-md">
          <p className="text-center text-gray-600 mb-6 font-medium">
            Choose your reading level
          </p>

          <div className="space-y-3">
            {grades.map(({ grade, label, ages }) => {
              const info = gradeLevelInfo[grade];
              return (
                <button
                  key={grade}
                  onClick={() => onSelectGrade(grade)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${info.color}20` }}
                  >
                    {grade === 'jk' && '🌟'}
                    {grade === 'sk' && '🦋'}
                    {grade === 'grade1' && '🚀'}
                    {grade === 'grade2' && '🌈'}
                    {grade === 'grade3' && '🔮'}
                  </div>

                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-800 group-hover:text-gray-900">
                      {label}
                    </div>
                    <div className="text-sm text-gray-400">
                      Ages {ages}
                    </div>
                  </div>

                  <svg
                    className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress summary */}
        {progress && progress.booksCompleted.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm mb-2">Your Progress</p>
            <div className="flex items-center justify-center gap-6">
              <div>
                <div className="text-2xl font-bold text-gray-700">{progress.booksCompleted.length}</div>
                <div className="text-xs text-gray-400">Books Read</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <div className="text-2xl font-bold text-gray-700">{progress.longestStreak}</div>
                <div className="text-xs text-gray-400">Best Streak</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
