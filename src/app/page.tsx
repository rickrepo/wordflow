'use client';

import { useState } from 'react';
import HomePage from '@/components/HomePage';
import StoryLibrary from '@/components/StoryLibrary';
import VocabPrep from '@/components/VocabPrep';
import StoryReader from '@/components/StoryReader';
import CompletionScreen from '@/components/CompletionScreen';
import type { GradeLevel, Story } from '@/lib/stories';

type AppState = 'home' | 'library' | 'vocab' | 'reading' | 'complete';

export default function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);

  const handleSelectGrade = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setAppState('library');
  };

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    setAppState('vocab'); // Go to vocab prep first
  };

  const handleVocabComplete = () => {
    setAppState('reading');
  };

  const handleBackToHome = () => {
    setSelectedGrade(null);
    setSelectedStory(null);
    setStarsEarned(0);
    setAppState('home');
  };

  const handleBackToLibrary = () => {
    setSelectedStory(null);
    setStarsEarned(0);
    setAppState('library');
  };

  const handleComplete = (stars: number) => {
    setStarsEarned(stars);
    setAppState('complete');
  };

  const handleReadAgain = () => {
    setStarsEarned(0);
    setAppState('vocab'); // Start from vocab prep when reading again
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
      return (
        <CompletionScreen
          story={selectedStory}
          gradeLevel={selectedGrade}
          starsEarned={starsEarned}
          onReadAgain={handleReadAgain}
          onChooseAnother={handleBackToLibrary}
          onHome={handleBackToHome}
        />
      );

    default:
      return <HomePage onSelectGrade={handleSelectGrade} />;
  }
}
