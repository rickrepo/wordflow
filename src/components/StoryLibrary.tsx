'use client';

import { useEffect, useState } from 'react';
import { getStoriesByGrade, gradeLevelInfo, type GradeLevel, type Story } from '@/lib/stories';
import { loadProgress, type GameProgress } from '@/lib/gameState';

interface StoryLibraryProps {
  gradeLevel: GradeLevel;
  onSelectStory: (story: Story) => void;
  onBack: () => void;
}

export default function StoryLibrary({ gradeLevel, onSelectStory, onBack }: StoryLibraryProps) {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const stories = getStoriesByGrade(gradeLevel);
  const gradeInfo = gradeLevelInfo[gradeLevel];

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const isCompleted = (storyId: string) =>
    progress?.booksCompleted.includes(storyId) || false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{gradeInfo.name}</h1>
            <p className="text-sm text-gray-400">{stories.length} stories available</p>
          </div>

          {progress && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
              <span className="text-amber-500">⭐</span>
              <span className="font-semibold text-amber-700">{progress.totalStars}</span>
            </div>
          )}
        </div>
      </header>

      {/* Story grid */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid gap-4">
          {stories.map(story => {
            const completed = isCompleted(story.id);

            return (
              <button
                key={story.id}
                onClick={() => onSelectStory(story)}
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all text-left group"
              >
                {/* Cover */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: `${gradeInfo.color}15` }}
                >
                  {story.coverEmoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-800 truncate group-hover:text-gray-900">
                      {story.title}
                    </h2>
                    {completed && (
                      <span className="text-green-500 text-lg flex-shrink-0">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {story.pages.length} pages • {story.theme}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0"
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

        {/* Completion status */}
        {progress && (
          <div className="mt-8 text-center text-sm text-gray-400">
            {progress.booksCompleted.filter(id =>
              stories.some(s => s.id === id)
            ).length} of {stories.length} completed
          </div>
        )}
      </main>
    </div>
  );
}
