'use client';

import { useEffect, useState } from 'react';
import { type Story, gradeLevelInfo, type GradeLevel } from '@/lib/stories';
import { loadProgress, recordBookComplete, type GameProgress } from '@/lib/gameState';

interface CompletionScreenProps {
  story: Story;
  gradeLevel: GradeLevel;
  starsEarned: number;
  onReadAgain: () => void;
  onChooseAnother: () => void;
  onHome: () => void;
}

export default function CompletionScreen({
  story,
  gradeLevel,
  starsEarned,
  onReadAgain,
  onChooseAnother,
  onHome,
}: CompletionScreenProps) {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [isNewBook, setIsNewBook] = useState(false);
  const gradeInfo = gradeLevelInfo[gradeLevel];

  useEffect(() => {
    const current = loadProgress();
    const wasCompleted = current.booksCompleted.includes(story.id);
    setIsNewBook(!wasCompleted);

    if (!wasCompleted) {
      setProgress(recordBookComplete(current, story.id));
    } else {
      setProgress(current);
    }
  }, [story.id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-6">
      {/* Trophy animation */}
      <div className="text-8xl mb-6 animate-bounce-slow">
        🏆
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 text-center">
        You finished the book!
      </h1>

      <p className="text-gray-500 text-lg mb-8 text-center">
        {story.title}
      </p>

      {/* Stats card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 w-full max-w-sm">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-3xl font-bold text-amber-500">{starsEarned}</div>
            <div className="text-sm text-gray-500">Stars Earned</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <div className="text-3xl font-bold text-blue-500">{story.pages.length}</div>
            <div className="text-sm text-gray-500">Pages Read</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <div className="text-3xl font-bold text-green-500">{progress?.currentStreak || 0}</div>
            <div className="text-sm text-gray-500">Day Streak</div>
          </div>
        </div>

        {isNewBook && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <span className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-sm font-medium">
              🎖️ New Book Completed!
            </span>
          </div>
        )}
      </div>

      {/* Total progress */}
      <div className="text-center mb-8">
        <p className="text-gray-400 text-sm mb-1">Total Stars Collected</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">⭐</span>
          <span className="text-3xl font-bold text-amber-600">{progress?.totalStars || 0}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onReadAgain}
          className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-600 transition-colors"
        >
          Read Again
        </button>

        <button
          onClick={onChooseAnother}
          className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors"
        >
          Choose Another Book
        </button>

        <button
          onClick={onHome}
          className="w-full py-3 text-gray-400 font-medium hover:text-gray-600 transition-colors"
        >
          Back to Home
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
