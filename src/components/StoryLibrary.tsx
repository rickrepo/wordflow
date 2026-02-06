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
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const stories = getStoriesByGrade(gradeLevel);
  const gradeInfo = gradeLevelInfo[gradeLevel];

  const themeEmojis: Record<string, string> = {
    adventure: '🗺️',
    animals: '🐾',
    fantasy: '✨',
    nature: '🌿',
    friendship: '💕',
  };

  const handleStoryTap = (story: Story) => {
    setSelectedStory(story);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradeInfo.bgGradient}`}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={onBack}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-4"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              📚 Story Library
            </h1>
            <p className="text-white/80 text-sm md:text-base">
              {gradeInfo.name} • {stories.length} adventures await!
            </p>
          </div>
        </div>
      </div>

      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        {['📖', '⭐', '🌟', '✨', '📚'].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-4xl md:text-6xl animate-float"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Story grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {stories.map((story, index) => {
            const isHovered = hoveredStory === story.id;

            return (
              <button
                key={story.id}
                onClick={() => handleStoryTap(story)}
                onMouseEnter={() => setHoveredStory(story.id)}
                onMouseLeave={() => setHoveredStory(null)}
                className={`
                  relative group text-left
                  transform transition-all duration-300 ease-out
                  ${isHovered ? 'scale-105 -translate-y-2 z-10' : 'scale-100'}
                  animate-fade-in-up
                `}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Book card */}
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl">
                  {/* Cover illustration area */}
                  <div
                    className="relative h-48 md:h-56 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${gradeInfo.color}40, ${gradeInfo.color}80)`,
                    }}
                  >
                    {/* Decorative circles */}
                    <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white/10" />

                    {/* Cover emoji */}
                    <div className={`
                      text-7xl md:text-8xl
                      transition-transform duration-300
                      ${isHovered ? 'scale-125 animate-bounce-slow' : ''}
                    `}>
                      {story.coverEmoji}
                    </div>

                    {/* Shimmer effect on hover */}
                    {isHovered && (
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>
                    )}

                    {/* Theme badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                      <span>{themeEmojis[story.theme] || '📖'}</span>
                      <span className="text-xs font-medium text-gray-700 capitalize">{story.theme}</span>
                    </div>
                  </div>

                  {/* Book info */}
                  <div className="p-5 md:p-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                      {story.title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-4">
                      by {story.author}
                    </p>

                    {/* Page count and reading time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-lg">📄</span>
                        <span className="text-sm">{story.pages.length} pages</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(3)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-lg">⭐</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Book spine effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-gray-300 to-gray-400" />

                  {/* Read button overlay on hover */}
                  <div className={`
                    absolute inset-0 bg-black/0 flex items-center justify-center
                    transition-all duration-300
                    ${isHovered ? 'bg-black/30' : 'pointer-events-none'}
                  `}>
                    <div className={`
                      bg-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl
                      transform transition-all duration-300
                      ${isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
                    `}
                    style={{ color: gradeInfo.color }}
                    >
                      📖 Read Now!
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story preview modal */}
      {selectedStory && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with cover */}
            <div
              className="p-8 text-center"
              style={{
                background: `linear-gradient(135deg, ${gradeInfo.color}60, ${gradeInfo.color})`,
              }}
            >
              <div className="text-8xl mb-4 animate-bounce-slow">
                {selectedStory.coverEmoji}
              </div>
              <h2 className="text-3xl font-bold text-white mb-1">
                {selectedStory.title}
              </h2>
              <p className="text-white/80">
                by {selectedStory.author}
              </p>
            </div>

            {/* Story details */}
            <div className="p-6">
              <div className="flex justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl mb-1">📄</div>
                  <div className="text-gray-600 font-medium">{selectedStory.pages.length} pages</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-1">{themeEmojis[selectedStory.theme]}</div>
                  <div className="text-gray-600 font-medium capitalize">{selectedStory.theme}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-1">⏱️</div>
                  <div className="text-gray-600 font-medium">~{selectedStory.pages.length * 2} min</div>
                </div>
              </div>

              {/* Preview text */}
              <div className="bg-amber-50 rounded-2xl p-4 mb-6">
                <p className="text-gray-700 italic">
                  &ldquo;{selectedStory.pages[0].substring(0, 80)}...&rdquo;
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedStory(null)}
                  className="flex-1 py-4 rounded-full bg-gray-200 text-gray-700 font-bold text-lg hover:bg-gray-300 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => onSelectStory(selectedStory)}
                  className={`flex-1 py-4 rounded-full bg-gradient-to-r ${gradeInfo.bgGradient} text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-lg`}
                >
                  Let&apos;s Read! 📖
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
