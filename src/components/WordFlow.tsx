"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";

interface WordFlowProps {
  text: string;
  title?: string;
}

export default function WordFlow({ text, title }: WordFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const lastSpokenWordRef = useRef<string | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
      setIsSpeechSupported(true);
    } else {
      setIsSpeechSupported(false);
    }
  }, []);

  // Speak a word using Web Speech API
  const speakWord = useCallback((word: string) => {
    if (!speechSynthRef.current) return;

    // Cancel any ongoing speech to prevent overlapping
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8; // Slower pace for children
    utterance.pitch = 1.1; // Slightly higher pitch, more child-friendly
    utterance.volume = 1;

    speechSynthRef.current.speak(utterance);
  }, []);

  // Handle pointer movement with look-ahead offset
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const x = event.clientX;
      // Look-ahead offset: check 50px ABOVE the finger position
      // so the child's hand doesn't block the word
      const y = event.clientY - 50;

      // Use elementFromPoint to find which word element is at this position
      const element = document.elementFromPoint(x, y);

      if (element && element.hasAttribute("data-word-id")) {
        const wordId = element.getAttribute("data-word-id");
        const word = element.getAttribute("data-word");

        if (wordId && word && wordId !== activeWordId) {
          setActiveWordId(wordId);

          // Only speak if it's a new word (debounce by word)
          if (word !== lastSpokenWordRef.current) {
            lastSpokenWordRef.current = word;
            speakWord(word);
          }
        }
      } else {
        // Pointer is not over a word
        setActiveWordId(null);
      }
    },
    [activeWordId, speakWord]
  );

  // Handle pointer leave - clear active word
  const handlePointerLeave = useCallback(() => {
    setActiveWordId(null);
    lastSpokenWordRef.current = null;
  }, []);

  // Parse text into words with unique IDs
  const words = text.split(/\s+/).map((word, index) => ({
    id: `word-${index}`,
    text: word,
    // Clean version for speech (remove punctuation for cleaner pronunciation)
    cleanText: word.replace(/[.,!?;:'"()]/g, ""),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-100 to-sky-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm shadow-sm px-4 py-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-700 text-center">
          {title || "WordFlow"}
        </h1>
        {!isSpeechSupported && (
          <p className="text-red-500 text-center text-sm mt-2">
            Speech is not supported in this browser
          </p>
        )}
        <p className="text-sky-600 text-center text-sm mt-1">
          Trace your finger over the words to hear them!
        </p>
      </header>

      {/* Reading Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto px-4 py-6 sm:px-8 sm:py-8"
        style={{ touchAction: "none" }} // Prevent scrolling while tracing
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-lg p-6 sm:p-8">
          <p className="leading-loose text-center">
            {words.map((word) => (
              <span
                key={word.id}
                data-word-id={word.id}
                data-word={word.cleanText}
                className={`
                  inline-block
                  text-3xl sm:text-4xl
                  px-2 py-1
                  mx-1 my-2
                  rounded-lg
                  cursor-pointer
                  select-none
                  transition-all duration-150 ease-out
                  ${
                    activeWordId === word.id
                      ? "bg-yellow-300 text-yellow-900 scale-110 shadow-md animate-pulse"
                      : "text-gray-800 hover:bg-yellow-100"
                  }
                `}
              >
                {word.text}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Footer hint */}
      <footer className="flex-shrink-0 bg-white/80 backdrop-blur-sm px-4 py-3 text-center">
        <p className="text-sky-500 text-xs sm:text-sm">
          Move your finger slowly over each word
        </p>
      </footer>
    </div>
  );
}
