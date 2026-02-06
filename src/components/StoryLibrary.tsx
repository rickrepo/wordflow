'use client';

import { useState } from 'react';
import { getStoriesByGrade, gradeLevelInfo, type GradeLevel, type Story } from '@/lib/stories';

interface StoryLibraryProps {
  gradeLevel: GradeLevel;
  onSelectStory: (story: Story) => void;
  onBack: () => void;
}

export default function StoryLibrary({ gradeLevel, onSelectStory, onBack }: StoryLibraryProps) {
  const [hoveredStory, setHoveredStory] = useState<string | null>(null);
  const stories = getStoriesByGrade(gradeLevel);
  const gradeInfo = gradeLevelInfo[gradeLevel];

  const themeColors: Record<string, string> = {
    adventure: 'from-orange-400 to-red-500',
    animals: 'from-green-400 to-emerald-500',
    fantasy: 'from-purple-400 to-pink-500',
    nature: 'from-cyan-400 to-blue-500',
    friendship: 'from-yellow-400 to-orange-500',
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradeInfo.bgGradient} p-4 md:p-8`}>
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        {/* Back button and title */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors mr-4"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {gradeInfo.name}
            </h1>
            <p className="text-white/80">
              Choose a story to read!
            </p>
          </div>
        </div>

        {/* Story grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => {
            const isHovered = hoveredStory === story.id;
            const themeGradient = themeColors[story.theme] || 'from-gray-400 to-gray-500';

            return (
              <button
                key={story.id}
                onClick={() => onSelectStory(story)}
                onMouseEnter={() => setHoveredStory(story.id)}
                onMouseLeave={() => setHoveredStory(null)}
                onTouchStart={() => setHoveredStory(story.id)}
                onTouchEnd={() => setHoveredStory(null)}
                className={`
                  relative overflow-hidden rounded-3xl
                  bg-white shadow-xl
                  transform transition-all duration-300 ease-out
                  ${isHovered ? 'scale-105 shadow-2xl -translate-y-2' : 'scale-100'}
                  active:scale-98
                  text-left
                `}
              >
                {/* Book cover top */}
                <div className={`bg-gradient-to-br ${themeGradient} p-8 pb-12 relative`}>
                  {/* Decorative circles */}
                  <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/10" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-white/10" />

                  {/* Emoji */}
                  <div className={`text-7xl text-center transition-transform duration-300 ${isHovered ? 'scale-110 animate-bounce-slow' : ''}`}>
                    {story.coverEmoji}
                  </div>

                  {/* Sparkle on hover */}
                  {isHovered && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                  )}
                </div>

                {/* Book info */}
                <div className="p-5">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    {story.title}
                  </h2>
                  <p className="text-gray-500 text-sm mb-3">
                    by {story.author}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                      {story.theme}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {story.pages.length} pages
                    </span>
                  </div>
                </div>

                {/* Book spine effect */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-black/20 to-black/10" />
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {stories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-white text-xl">No stories available yet!</p>
            <p className="text-white/70">Check back soon for new adventures.</p>
          </div>
        )}
      </div>
    </div>
  );
}
