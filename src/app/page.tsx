'use client';

import { useState } from 'react';
import HomePage from '@/components/HomePage';
import StoryLibrary from '@/components/StoryLibrary';
import VocabPrep from '@/components/VocabPrep';
import StoryReader from '@/components/StoryReader';
import CompletionScreen from '@/components/CompletionScreen';
import type { GradeLevel, Story } from '@/lib/stories';
import { getStoriesByGrade } from '@/lib/stories';

type AppState = 'home' | 'library' | 'vocab' | 'reading' | 'complete';

export default function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const handleSelectGrade = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setAppState('library');
  };

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    setAppState('reading'); // Go straight to reading
  };

  const handleVocabComplete = () => {
    setAppState('reading');
  };

  const handleBackToHome = () => {
    setSelectedGrade(null);
    setSelectedStory(null);
    setAppState('home');
  };

  const handleBackToLibrary = () => {
    setSelectedStory(null);
    setAppState('library');
  };

  const handleComplete = () => {
    setAppState('complete');
  };

  const handleReadAgain = () => {
    setAppState('reading'); // Go straight to reading again
  };

  const handleNextBook = (story: Story) => {
    setSelectedStory(story);
    setAppState('reading');
  };

  switch (appState) {
    case 'home':
      return <HomePage onSelectGrade={handleSelectGrade} />;

    case 'library':
      if (!selectedGrade) {
        setAppState('home');
        return null;
      }
      return (
        <StoryLibrary
          gradeLevel={selectedGrade}
          onSelectStory={handleSelectStory}
          onBack={handleBackToHome}
        />
      );

    case 'vocab':
      if (!selectedGrade || !selectedStory) {
        setAppState('home');
        return null;
      }
      return (
        <VocabPrep
          story={selectedStory}
          gradeLevel={selectedGrade}
          onComplete={handleVocabComplete}
          onBack={handleBackToLibrary}
        />
      );

    case 'reading':
      if (!selectedGrade || !selectedStory) {
        setAppState('home');
        return null;
      }
      return (
        <StoryReader
          story={selectedStory}
          gradeLevel={selectedGrade}
          onBack={handleBackToLibrary}
          onComplete={handleComplete}
        />
      );

    case 'complete':
      if (!selectedGrade || !selectedStory) {
        setAppState('home');
        return null;
      }
      {
        const gradeStories = getStoriesByGrade(selectedGrade);
        const currentIdx = gradeStories.findIndex(s => s.id === selectedStory.id);
        const nextStory = currentIdx >= 0 && currentIdx < gradeStories.length - 1
          ? gradeStories[currentIdx + 1]
          : null;
        return (
          <CompletionScreen
            story={selectedStory}
            nextStory={nextStory}
            onReadAgain={handleReadAgain}
            onNextBook={handleNextBook}
            onChooseAnother={handleBackToLibrary}
            onHome={handleBackToHome}
          />
        );
      }

    default:
      return <HomePage onSelectGrade={handleSelectGrade} />;
  }
}
