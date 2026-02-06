'use client';

// Audio file management for word pronunciations
// Stores audio as base64 data URLs in localStorage for simplicity
// In production, you'd want to use a proper file storage solution

export interface AudioEntry {
  word: string;
  audioData: string; // base64 data URL
  fileName: string;
  addedAt: number;
}

export interface AudioLibrary {
  entries: AudioEntry[];
}

const STORAGE_KEY = 'wordflow_audio_library';

export function loadAudioLibrary(): AudioLibrary {
  if (typeof window === 'undefined') {
    return { entries: [] };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { entries: [] };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { entries: [] };
  }
}

export function saveAudioLibrary(library: AudioLibrary): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function addAudioEntry(word: string, audioData: string, fileName: string): AudioLibrary {
  const library = loadAudioLibrary();

  // Remove existing entry for this word if it exists
  const filtered = library.entries.filter(e => e.word.toLowerCase() !== word.toLowerCase());

  const newEntry: AudioEntry = {
    word: word.toLowerCase(),
    audioData,
    fileName,
    addedAt: Date.now(),
  };

  const updated = {
    entries: [...filtered, newEntry],
  };

  saveAudioLibrary(updated);
  return updated;
}

export function removeAudioEntry(word: string): AudioLibrary {
  const library = loadAudioLibrary();
  const updated = {
    entries: library.entries.filter(e => e.word.toLowerCase() !== word.toLowerCase()),
  };
  saveAudioLibrary(updated);
  return updated;
}

export function getAudioForWord(word: string): AudioEntry | null {
  const library = loadAudioLibrary();
  return library.entries.find(e => e.word.toLowerCase() === word.toLowerCase()) || null;
}

export function hasAudioForWord(word: string): boolean {
  return getAudioForWord(word) !== null;
}

// Play audio for a word
export function playWordAudio(word: string): boolean {
  const entry = getAudioForWord(word);
  if (!entry) return false;

  try {
    const audio = new Audio(entry.audioData);
    audio.play();
    return true;
  } catch {
    return false;
  }
}

// Play audio slowly (by reducing playback rate)
export function playWordAudioSlowly(word: string): boolean {
  const entry = getAudioForWord(word);
  if (!entry) return false;

  try {
    const audio = new Audio(entry.audioData);
    audio.playbackRate = 0.6;
    audio.play();
    return true;
  } catch {
    return false;
  }
}

// Convert file to base64 data URL
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
