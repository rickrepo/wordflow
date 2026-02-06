'use client';

import { useEffect, useState } from 'react';

interface PageTransitionProps {
  show: boolean;
  storyId: string;
  onComplete: () => void;
}

// Simple, fun page flip transition - playful effect between pages
export default function PageTransition({ show, storyId, onComplete }: PageTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Fun flip animation overlay */}
      <div className="absolute inset-0 animate-flip-away">
        <div className="w-full h-full bg-gradient-to-br from-blue-100/90 via-white/95 to-purple-100/90 backdrop-blur-sm" />
      </div>

      {/* Sparkle trail */}
      <div className="absolute top-1/2 left-1/4 animate-sparkle-1 text-3xl">✨</div>
      <div className="absolute top-1/3 left-1/2 animate-sparkle-2 text-2xl">⭐</div>
      <div className="absolute top-2/3 right-1/4 animate-sparkle-3 text-3xl">✨</div>

      <style jsx>{`
        @keyframes flip-away {
          0% {
            transform: perspective(1500px) rotateY(0deg) scale(1);
            opacity: 0;
          }
          15% {
            transform: perspective(1500px) rotateY(0deg) scale(1);
            opacity: 0.9;
          }
          50% {
            transform: perspective(1500px) rotateY(90deg) scale(0.95);
            opacity: 0.7;
          }
          85% {
            transform: perspective(1500px) rotateY(180deg) scale(1);
            opacity: 0.3;
          }
          100% {
            transform: perspective(1500px) rotateY(180deg) scale(1);
            opacity: 0;
          }
        }
        .animate-flip-away {
          animation: flip-away 0.9s ease-in-out forwards;
          transform-origin: center center;
          transform-style: preserve-3d;
        }

        @keyframes sparkle-1 {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          30% { transform: translate(20px, -30px) scale(1.2); opacity: 1; }
          100% { transform: translate(50px, -80px) scale(0); opacity: 0; }
        }
        .animate-sparkle-1 {
          animation: sparkle-1 0.7s ease-out forwards;
          animation-delay: 0.1s;
        }

        @keyframes sparkle-2 {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          30% { transform: translate(-15px, -40px) scale(1.3); opacity: 1; }
          100% { transform: translate(-40px, -100px) scale(0); opacity: 0; }
        }
        .animate-sparkle-2 {
          animation: sparkle-2 0.7s ease-out forwards;
          animation-delay: 0.2s;
        }

        @keyframes sparkle-3 {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          30% { transform: translate(25px, -35px) scale(1.1); opacity: 1; }
          100% { transform: translate(60px, -90px) scale(0); opacity: 0; }
        }
        .animate-sparkle-3 {
          animation: sparkle-3 0.7s ease-out forwards;
          animation-delay: 0.15s;
        }
      `}</style>
    </div>
  );
}
