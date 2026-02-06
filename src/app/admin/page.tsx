'use client';

import { useState, useEffect, useRef } from 'react';
import {
  loadAudioLibrary,
  addAudioEntry,
  removeAudioEntry,
  fileToDataUrl,
  playWordAudio,
  type AudioLibrary,
  type AudioEntry,
} from '@/lib/audioManager';

export default function AdminPage() {
  const [library, setLibrary] = useState<AudioLibrary>({ entries: [] });
  const [newWord, setNewWord] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLibrary(loadAudioLibrary());
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        showMessage('error', 'Please select an audio file (MP3, WAV, etc.)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!newWord.trim()) {
      showMessage('error', 'Please enter a word');
      return;
    }
    if (!selectedFile) {
      showMessage('error', 'Please select an audio file');
      return;
    }

    setIsUploading(true);
    try {
      const audioData = await fileToDataUrl(selectedFile);
      const updated = addAudioEntry(newWord.trim(), audioData, selectedFile.name);
      setLibrary(updated);
      setNewWord('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showMessage('success', `Audio added for "${newWord.trim()}"`);
    } catch (error) {
      showMessage('error', 'Failed to upload audio file');
    }
    setIsUploading(false);
  };

  const handleRemove = (word: string) => {
    if (confirm(`Remove audio for "${word}"?`)) {
      const updated = removeAudioEntry(word);
      setLibrary(updated);
      showMessage('success', `Removed audio for "${word}"`);
    }
  };

  const handlePlay = (word: string) => {
    playWordAudio(word);
  };

  const filteredEntries = library.entries.filter(e =>
    e.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedEntries = [...filteredEntries].sort((a, b) =>
    a.word.localeCompare(b.word)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Audio Manager</h1>
              <p className="text-gray-500 mt-1">Upload MP3 files for word pronunciations</p>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back to App
            </a>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Audio</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Word
              </label>
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="e.g., butterfly"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Audio File (MP3, WAV)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium file:cursor-pointer"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleUpload}
                disabled={isUploading || !newWord.trim() || !selectedFile}
                className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                  isUploading || !newWord.trim() || !selectedFile
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Add Audio'}
              </button>
            </div>
          </div>

          {selectedFile && (
            <p className="mt-3 text-sm text-gray-500">
              Selected: {selectedFile.name}
            </p>
          )}
        </div>

        {/* Audio Library */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Audio Library ({library.entries.length} words)
            </h2>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search words..."
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>

          {sortedEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {library.entries.length === 0 ? (
                <>
                  <p className="text-4xl mb-3">🎵</p>
                  <p>No audio files yet. Add your first word above!</p>
                </>
              ) : (
                <p>No words match your search.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.word}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{entry.word}</p>
                    <p className="text-xs text-gray-400 truncate">{entry.fileName}</p>
                  </div>

                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => handlePlay(entry.word)}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Play"
                    >
                      🔊
                    </button>
                    <button
                      onClick={() => handleRemove(entry.word)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-800 mb-2">Tips for Recording Audio</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Record in a quiet environment</li>
            <li>• Speak clearly and at a moderate pace</li>
            <li>• Keep recordings short (just the word)</li>
            <li>• Use MP3 format for smaller file sizes</li>
            <li>• Consider recording both normal and slow versions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
