'use client';

import { useEffect, useState } from 'react';
import { Cat, Dog, Frog, Fish, Butterfly, Bird, Dragon, Rocket } from './index';

interface PageTransitionProps {
  show: boolean;
  storyId: string;
  onComplete: () => void;
}

// Map story IDs to their transition animations
const storyTransitions: Record<string, {
  component: React.FC<{ className?: string }>;
  animation: string;
  duration: number;
}> = {
  'jk-cat': { component: Cat, animation: 'walk-across', duration: 2000 },
  'jk-ball': { component: Bird, animation: 'fly-across', duration: 1500 },
  'jk-dog': { component: Dog, animation: 'walk-across', duration: 2000 },
  'sk-frog': { component: Frog, animation: 'hop-across', duration: 1800 },
  'sk-sun': { component: Butterfly, animation: 'flutter-across', duration: 2500 },
  'sk-fish': { component: Fish, animation: 'swim-across', duration: 2000 },
  'g1-dragon': { component: Dragon, animation: 'fly-across', duration: 2500 },
  'g1-rainbow': { component: Butterfly, animation: 'flutter-across', duration: 2500 },
  'g1-puppy': { component: Dog, animation: 'walk-across', duration: 2000 },
  'g2-space': { component: Rocket, animation: 'fly-up', duration: 2000 },
  'g2-ocean': { component: Fish, animation: 'swim-across', duration: 2000 },
  'g2-treehouse': { component: Bird, animation: 'fly-across', duration: 1500 },
  'g3-inventor': { component: Rocket, animation: 'fly-up', duration: 2000 },
  'g3-forest': { component: Bird, animation: 'fly-across', duration: 1500 },
  'g3-detective': { component: Dog, animation: 'walk-across', duration: 2000 },
};

export default function PageTransition({ show, storyId, onComplete }: PageTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const transition = storyTransitions[storyId] || {
    component: Butterfly,
    animation: 'flutter-across',
    duration: 2000,
  };

  const CharacterComponent = transition.component;

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, transition.duration);
      return () => clearTimeout(timer);
    }
  }, [show, transition.duration, onComplete]);

  if (!show || !isAnimating) return null;

  const animationClass = {
    'walk-across': 'animate-walk-across',
    'fly-across': 'animate-fly-across',
    'hop-across': 'animate-hop-across',
    'swim-across': 'animate-swim-across',
    'flutter-across': 'animate-flutter-across',
    'fly-up': 'animate-fly-up',
  }[transition.animation] || 'animate-walk-across';

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      <div className={`absolute ${animationClass}`} style={{ width: '120px', height: '100px' }}>
        <CharacterComponent className="w-full h-full" />
      </div>

      <style jsx>{`
        @keyframes walk-across {
          0% {
            left: -120px;
            bottom: 20%;
            transform: scaleX(1);
          }
          100% {
            left: 100%;
            bottom: 20%;
            transform: scaleX(1);
          }
        }

        @keyframes fly-across {
          0% {
            left: -120px;
            top: 30%;
            transform: scaleX(1) rotate(-5deg);
          }
          25% {
            top: 25%;
            transform: scaleX(1) rotate(5deg);
          }
          50% {
            top: 35%;
            transform: scaleX(1) rotate(-5deg);
          }
          75% {
            top: 28%;
            transform: scaleX(1) rotate(5deg);
          }
          100% {
            left: 100%;
            top: 32%;
            transform: scaleX(1) rotate(-5deg);
          }
        }

        @keyframes hop-across {
          0% {
            left: -120px;
            bottom: 15%;
            transform: scaleX(1) scaleY(1);
          }
          10% {
            bottom: 15%;
            transform: scaleX(1) scaleY(0.8);
          }
          30% {
            bottom: 35%;
            transform: scaleX(1) scaleY(1.1);
          }
          50% {
            bottom: 15%;
            transform: scaleX(1) scaleY(0.9);
          }
          60% {
            bottom: 15%;
            transform: scaleX(1) scaleY(0.8);
          }
          80% {
            bottom: 35%;
            transform: scaleX(1) scaleY(1.1);
          }
          100% {
            left: 100%;
            bottom: 15%;
            transform: scaleX(1) scaleY(1);
          }
        }

        @keyframes swim-across {
          0% {
            left: -120px;
            top: 50%;
            transform: scaleX(1) rotate(0deg);
          }
          25% {
            top: 45%;
            transform: scaleX(1) rotate(5deg);
          }
          50% {
            top: 55%;
            transform: scaleX(1) rotate(-5deg);
          }
          75% {
            top: 48%;
            transform: scaleX(1) rotate(5deg);
          }
          100% {
            left: 100%;
            top: 52%;
            transform: scaleX(1) rotate(0deg);
          }
        }

        @keyframes flutter-across {
          0% {
            left: -80px;
            top: 40%;
            transform: scaleX(1) rotate(-10deg);
          }
          10% {
            top: 35%;
            transform: scaleX(1) rotate(10deg);
          }
          20% {
            top: 45%;
            transform: scaleX(1) rotate(-10deg);
          }
          30% {
            top: 32%;
            transform: scaleX(1) rotate(10deg);
          }
          40% {
            top: 42%;
            transform: scaleX(1) rotate(-10deg);
          }
          50% {
            top: 38%;
            transform: scaleX(1) rotate(10deg);
          }
          60% {
            top: 48%;
            transform: scaleX(1) rotate(-10deg);
          }
          70% {
            top: 35%;
            transform: scaleX(1) rotate(10deg);
          }
          80% {
            top: 45%;
            transform: scaleX(1) rotate(-10deg);
          }
          90% {
            top: 38%;
            transform: scaleX(1) rotate(10deg);
          }
          100% {
            left: 100%;
            top: 40%;
            transform: scaleX(1) rotate(-10deg);
          }
        }

        @keyframes fly-up {
          0% {
            left: 50%;
            bottom: -150px;
            transform: translateX(-50%) rotate(0deg);
          }
          25% {
            left: 45%;
            transform: translateX(-50%) rotate(-5deg);
          }
          50% {
            left: 55%;
            transform: translateX(-50%) rotate(5deg);
          }
          75% {
            left: 48%;
            transform: translateX(-50%) rotate(-3deg);
          }
          100% {
            left: 50%;
            bottom: 100%;
            transform: translateX(-50%) rotate(0deg);
          }
        }

        .animate-walk-across {
          animation: walk-across 2s ease-in-out forwards;
        }

        .animate-fly-across {
          animation: fly-across 1.5s ease-in-out forwards;
        }

        .animate-hop-across {
          animation: hop-across 1.8s ease-in-out forwards;
        }

        .animate-swim-across {
          animation: swim-across 2s ease-in-out forwards;
        }

        .animate-flutter-across {
          animation: flutter-across 2.5s ease-in-out forwards;
        }

        .animate-fly-up {
          animation: fly-up 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
