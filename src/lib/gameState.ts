// Gamification state management

export interface GameProgress {
  totalStars: number;
  currentStreak: number;
  longestStreak: number;
  booksCompleted: string[]; // story IDs
  pagesReadToday: number;
  lastReadDate: string | null;
}

const STORAGE_KEY = 'wordflow_progress';

// Get initial state from localStorage
export function loadProgress(): GameProgress {
  if (typeof window === 'undefined') {
    return getDefaultProgress();
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if we need to reset daily stats
      const today = new Date().toDateString();
      if (parsed.lastReadDate !== today) {
        // New day - check streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = parsed.lastReadDate === yesterday.toDateString();

        return {
          ...parsed,
          pagesReadToday: 0,
          currentStreak: wasYesterday ? parsed.currentStreak : 0,
        };
      }
      return parsed;
    }
  } catch {
    // Ignore errors
  }

  return getDefaultProgress();
}

function getDefaultProgress(): GameProgress {
  return {
    totalStars: 0,
    currentStreak: 0,
    longestStreak: 0,
    booksCompleted: [],
    pagesReadToday: 0,
    lastReadDate: null,
  };
}

// Save progress to localStorage
export function saveProgress(progress: GameProgress): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore errors
  }
}

// Calculate stars earned for a page (1-3 based on performance)
export function calculatePageStars(
  wordsCompleted: number,
  totalWords: number,
  struggledWords: number
): number {
  const completionRate = wordsCompleted / totalWords;
  const struggleRate = struggledWords / totalWords;

  if (completionRate === 1 && struggleRate === 0) {
    return 3; // Perfect
  } else if (completionRate === 1 && struggleRate < 0.2) {
    return 2; // Great
  } else {
    return 1; // Good
  }
}

// Record page completion
export function recordPageComplete(
  progress: GameProgress,
  starsEarned: number
): GameProgress {
  const today = new Date().toDateString();
  const isNewDay = progress.lastReadDate !== today;

  let newStreak = progress.currentStreak;
  if (isNewDay) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = progress.lastReadDate === yesterday.toDateString();
    newStreak = wasYesterday ? progress.currentStreak + 1 : 1;
  }

  const updated: GameProgress = {
    ...progress,
    totalStars: progress.totalStars + starsEarned,
    currentStreak: newStreak,
    longestStreak: Math.max(progress.longestStreak, newStreak),
    pagesReadToday: progress.pagesReadToday + 1,
    lastReadDate: today,
  };

  saveProgress(updated);
  return updated;
}

// Record book completion
export function recordBookComplete(
  progress: GameProgress,
  storyId: string
): GameProgress {
  if (progress.booksCompleted.includes(storyId)) {
    return progress;
  }

  const updated: GameProgress = {
    ...progress,
    booksCompleted: [...progress.booksCompleted, storyId],
  };

  saveProgress(updated);
  return updated;
}
