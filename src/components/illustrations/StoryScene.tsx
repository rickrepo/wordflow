'use client';

// Full scene compositions for each story
// Combines multiple illustrations to create immersive backgrounds

import React, { useRef, useEffect } from 'react';
import {
  TextureFilter,
  Caterpillar,
  Butterfly,
  Fish,
  Bird,
  Sun,
  Moon,
  Tree,
  Frog,
  Dog,
  Cat,
  Dragon,
  Rocket,
  Stars,
  Cloud,
  Waves,
  Grass,
} from './index';

interface StorySceneProps {
  storyId: string;
  className?: string;
}

// Tap animation keyframes
const tapAnimCSS = `
  @keyframes tap-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    30% { transform: translateY(-20px) scale(1.15); }
    50% { transform: translateY(0) scale(1); }
    70% { transform: translateY(-8px) scale(1.05); }
  }
  @keyframes tap-spin {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.1); }
    100% { transform: rotate(360deg) scale(1); }
  }
  @keyframes tap-wiggle {
    0%, 100% { transform: rotate(0) scale(1); }
    20% { transform: rotate(-12deg) scale(1.15); }
    40% { transform: rotate(10deg) scale(1.12); }
    60% { transform: rotate(-5deg) scale(1.05); }
    80% { transform: rotate(3deg) scale(1.02); }
  }
  @keyframes tap-grow {
    0%, 100% { transform: scale(1); }
    40% { transform: scale(1.3); }
    60% { transform: scale(0.9); }
    80% { transform: scale(1.1); }
  }
`;

// Scene wrapper - background elements are tappable with fun animations
const SceneWrapper = ({ children, bgClass }: { children: React.ReactNode; bgClass: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Enable pointer events on positioned scene elements (skip full-screen overlays)
    Array.from(container.children).forEach(child => {
      if (!(child instanceof HTMLDivElement)) return;
      const cls = child.className || '';
      if (cls.includes('inset-0')) return;
      child.style.pointerEvents = 'auto';
      child.style.cursor = 'pointer';
    });

    // Animate the tapped element
    const handleClick = (e: MouseEvent) => {
      let el = e.target as HTMLElement | null;
      while (el && el !== container) {
        if (el.parentElement === container && el instanceof HTMLDivElement) {
          el.style.animation = 'none';
          void el.offsetHeight; // force reflow
          const anims = [
            'tap-bounce 0.5s ease-out',
            'tap-spin 0.5s ease-in-out',
            'tap-wiggle 0.5s ease-out',
            'tap-grow 0.4s ease-out',
          ];
          el.style.animation = anims[Math.floor(Math.random() * anims.length)];
          el.addEventListener('animationend', () => {
            el!.style.animation = ''; // restore CSS class animation
          }, { once: true });
          return;
        }
        el = el.parentElement;
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, []);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none ${bgClass}`}>
      <TextureFilter />
      {children}
      <style dangerouslySetInnerHTML={{ __html: tapAnimCSS }} />
    </div>
  );
};

// Individual scene compositions
const CatScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-100">
    {/* Sun in corner */}
    <div className="absolute -top-10 -right-10 w-48 h-48 opacity-80">
      <Sun />
    </div>

    {/* Clouds */}
    <div className="absolute top-16 left-10 w-32 opacity-60">
      <Cloud />
    </div>
    <div className="absolute top-8 right-1/4 w-24 opacity-40">
      <Cloud />
    </div>

    {/* Main cat - bottom left */}
    <div className="absolute bottom-20 left-8 w-40 md:w-56 opacity-90">
      <Cat />
    </div>

    {/* Yarn ball decoration */}
    <div className="absolute bottom-24 right-12 w-16 h-16">
      <svg viewBox="0 0 60 60" className="animate-bounce-slow">
        <circle cx="30" cy="30" r="25" fill="#E91E63" />
        <path d="M15 25 Q30 15 45 25 Q35 35 25 25 Q35 20 40 30" stroke="#F48FB1" strokeWidth="3" fill="none" />
        <circle cx="28" cy="28" r="18" fill="#EC407A" opacity="0.6" />
      </svg>
    </div>

    {/* Grass at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-80">
      <Grass />
    </div>

    {/* Paw prints scattered */}
    <div className="absolute top-1/3 right-8 opacity-30 text-4xl">🐾</div>
    <div className="absolute bottom-1/3 left-1/4 opacity-20 text-3xl">🐾</div>
  </SceneWrapper>
);

const DogScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-sky-200 via-blue-100 to-green-100">
    {/* Sun */}
    <div className="absolute -top-8 left-8 w-36 h-36 opacity-70">
      <Sun />
    </div>

    {/* Clouds */}
    <div className="absolute top-12 right-16 w-36 opacity-70">
      <Cloud />
    </div>
    <div className="absolute top-20 left-1/3 w-28 opacity-50">
      <Cloud />
    </div>

    {/* Dog - bottom right */}
    <div className="absolute bottom-16 right-4 w-48 md:w-64 opacity-90">
      <Dog />
    </div>

    {/* Trees */}
    <div className="absolute bottom-8 left-4 w-24 md:w-32 opacity-70">
      <Tree />
    </div>
    <div className="absolute bottom-8 left-1/3 w-20 opacity-50">
      <Tree />
    </div>

    {/* Bone */}
    <div className="absolute bottom-28 left-1/4 opacity-60">
      <svg viewBox="0 0 80 30" className="w-16 animate-bounce-slow">
        <ellipse cx="12" cy="8" rx="10" ry="7" fill="#FFFDE7" />
        <ellipse cx="12" cy="22" rx="10" ry="7" fill="#FFFDE7" />
        <ellipse cx="68" cy="8" rx="10" ry="7" fill="#FFFDE7" />
        <ellipse cx="68" cy="22" rx="10" ry="7" fill="#FFFDE7" />
        <rect x="10" y="8" width="60" height="14" fill="#FFFDE7" />
        <ellipse cx="12" cy="8" rx="7" ry="5" fill="#FFF9C4" opacity="0.6" />
      </svg>
    </div>

    {/* Grass */}
    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-90">
      <Grass />
    </div>

    {/* Paw prints */}
    <div className="absolute top-1/2 left-12 opacity-25 text-3xl">🐾</div>
  </SceneWrapper>
);

const BallScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-sky-300 via-sky-100 to-green-200">
    {/* Sun */}
    <div className="absolute -top-6 -left-6 w-40 h-40 opacity-75">
      <Sun />
    </div>

    {/* Clouds */}
    <div className="absolute top-8 right-8 w-32 opacity-60">
      <Cloud />
    </div>

    {/* Trees on sides */}
    <div className="absolute bottom-4 left-2 w-28 md:w-36 opacity-80">
      <Tree />
    </div>
    <div className="absolute bottom-4 right-2 w-24 md:w-32 opacity-70">
      <Tree />
    </div>

    {/* Ball bouncing */}
    <div className="absolute bottom-32 left-1/3 opacity-90">
      <svg viewBox="0 0 60 60" className="w-20 animate-bounce-slow">
        <circle cx="30" cy="30" r="28" fill="#F44336" />
        <circle cx="25" cy="25" r="18" fill="#EF5350" opacity="0.6" />
        <path d="M15 30 Q30 45 45 30" stroke="white" strokeWidth="3" fill="none" opacity="0.5" />
        <path d="M30 10 L30 50" stroke="white" strokeWidth="2" opacity="0.3" />
      </svg>
    </div>

    {/* Bird flying */}
    <div className="absolute top-20 right-1/4 w-20 opacity-70">
      <Bird />
    </div>

    {/* Grass */}
    <div className="absolute bottom-0 left-0 right-0 h-16 opacity-90">
      <Grass />
    </div>
  </SceneWrapper>
);

const FrogScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-green-200 via-emerald-100 to-cyan-200">
    {/* Lily pads and water */}
    <div className="absolute bottom-0 left-0 right-0 h-32">
      <Waves className="absolute bottom-0 left-0 right-0 h-24" />
    </div>

    {/* Log */}
    <div className="absolute bottom-24 left-1/4 w-48 opacity-80">
      <svg viewBox="0 0 160 40">
        <ellipse cx="80" cy="25" rx="75" ry="15" fill="#5D4037" />
        <ellipse cx="80" cy="22" rx="70" ry="12" fill="#6D4C41" opacity="0.6" />
        <ellipse cx="5" cy="25" rx="8" ry="12" fill="#4E342E" />
        <ellipse cx="155" cy="25" rx="8" ry="12" fill="#4E342E" />
        {/* Wood grain */}
        <path d="M20 20 Q50 18 80 20 Q110 22 140 20" stroke="#4E342E" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M25 28 Q60 26 100 28 Q130 30 145 28" stroke="#4E342E" strokeWidth="1" fill="none" opacity="0.5" />
      </svg>
    </div>

    {/* Frog on log */}
    <div className="absolute bottom-28 left-1/3 w-36 md:w-44 opacity-95">
      <Frog />
    </div>

    {/* Lily pads */}
    <div className="absolute bottom-8 left-8 opacity-70">
      <svg viewBox="0 0 80 50" className="w-20">
        <ellipse cx="40" cy="30" rx="35" ry="18" fill="#4CAF50" />
        <path d="M40 12 L40 30" stroke="#2E7D32" strokeWidth="2" />
        <ellipse cx="38" cy="28" rx="25" ry="12" fill="#66BB6A" opacity="0.6" />
      </svg>
    </div>
    <div className="absolute bottom-4 right-16 opacity-60">
      <svg viewBox="0 0 60 40" className="w-16">
        <ellipse cx="30" cy="25" rx="28" ry="14" fill="#4CAF50" />
        <ellipse cx="28" cy="23" rx="20" ry="10" fill="#66BB6A" opacity="0.6" />
      </svg>
    </div>

    {/* Dragonfly */}
    <div className="absolute top-20 right-12 opacity-60">
      <svg viewBox="0 0 60 40" className="w-14 animate-float">
        <ellipse cx="20" cy="20" rx="15" ry="4" fill="#64B5F6" opacity="0.6" />
        <ellipse cx="45" cy="20" rx="12" ry="3" fill="#64B5F6" opacity="0.6" />
        <ellipse cx="30" cy="22" rx="8" ry="3" fill="#1976D2" />
        <circle cx="38" cy="22" r="4" fill="#0D47A1" />
      </svg>
    </div>

    {/* Cattails */}
    <div className="absolute bottom-16 right-4 opacity-70">
      <svg viewBox="0 0 40 100" className="w-8">
        <line x1="20" y1="100" x2="20" y2="30" stroke="#4E342E" strokeWidth="3" />
        <ellipse cx="20" cy="25" rx="8" ry="18" fill="#5D4037" />
        <line x1="30" y1="100" x2="35" y2="45" stroke="#4E342E" strokeWidth="2" />
        <ellipse cx="36" cy="40" rx="6" ry="14" fill="#5D4037" />
      </svg>
    </div>
  </SceneWrapper>
);

const SunScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-yellow-200 via-orange-100 to-amber-100">
    {/* Big sun */}
    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 opacity-90">
      <Sun />
    </div>

    {/* Clouds */}
    <div className="absolute top-1/4 left-4 w-28 opacity-50">
      <Cloud />
    </div>
    <div className="absolute top-1/3 right-8 w-36 opacity-40">
      <Cloud />
    </div>

    {/* Sunflowers */}
    <div className="absolute bottom-4 left-8 opacity-80">
      <svg viewBox="0 0 60 120" className="w-16 animate-sway">
        <line x1="30" y1="120" x2="30" y2="50" stroke="#4CAF50" strokeWidth="6" />
        <ellipse cx="30" cy="42" rx="25" ry="22" fill="#FFC107" />
        <circle cx="30" cy="42" r="12" fill="#795548" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <ellipse
            key={i}
            cx={30 + Math.cos((angle * Math.PI) / 180) * 18}
            cy={42 + Math.sin((angle * Math.PI) / 180) * 16}
            rx="10"
            ry="6"
            fill="#FFEB3B"
            transform={`rotate(${angle} ${30 + Math.cos((angle * Math.PI) / 180) * 18} ${42 + Math.sin((angle * Math.PI) / 180) * 16})`}
          />
        ))}
      </svg>
    </div>
    <div className="absolute bottom-4 right-12 opacity-70">
      <svg viewBox="0 0 50 100" className="w-12 animate-sway" style={{ animationDelay: '0.5s' }}>
        <line x1="25" y1="100" x2="25" y2="45" stroke="#4CAF50" strokeWidth="5" />
        <ellipse cx="25" cy="38" rx="20" ry="18" fill="#FFC107" />
        <circle cx="25" cy="38" r="10" fill="#795548" />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <ellipse
            key={i}
            cx={25 + Math.cos((angle * Math.PI) / 180) * 14}
            cy={38 + Math.sin((angle * Math.PI) / 180) * 12}
            rx="8"
            ry="5"
            fill="#FFEB3B"
            transform={`rotate(${angle} ${25 + Math.cos((angle * Math.PI) / 180) * 14} ${38 + Math.sin((angle * Math.PI) / 180) * 12})`}
          />
        ))}
      </svg>
    </div>

    {/* Butterflies */}
    <div className="absolute top-1/2 left-1/4 w-16 opacity-70">
      <Butterfly color="orange" />
    </div>
    <div className="absolute top-1/3 right-1/4 w-12 opacity-60">
      <Butterfly color="purple" />
    </div>

    {/* Grass */}
    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-80">
      <Grass />
    </div>
  </SceneWrapper>
);

const FishScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-cyan-300 via-blue-300 to-blue-500">
    {/* Water surface light */}
    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-cyan-200/50 to-transparent" />

    {/* Main fish */}
    <div className="absolute top-1/4 left-8 w-40 md:w-52 opacity-90">
      <Fish color="blue" />
    </div>

    {/* Second fish */}
    <div className="absolute bottom-1/3 right-8 w-32 opacity-80">
      <Fish color="orange" />
    </div>

    {/* Small fish */}
    <div className="absolute top-1/2 right-1/4 w-24 opacity-70">
      <Fish color="green" />
    </div>

    {/* Coral and seaweed */}
    <div className="absolute bottom-0 left-4 opacity-70">
      <svg viewBox="0 0 80 120" className="w-20">
        {/* Coral */}
        <path d="M20 120 Q15 80 25 60 Q20 40 30 30 Q25 50 35 70 Q30 90 40 120" fill="#E91E63" />
        <path d="M40 120 Q45 90 35 70 Q40 50 50 40 Q45 60 55 80 Q50 100 60 120" fill="#FF5722" />
        <path d="M28 120 Q30 100 25 85 Q35 70 30 55" stroke="#F48FB1" strokeWidth="3" fill="none" />
      </svg>
    </div>

    {/* Seaweed */}
    <div className="absolute bottom-0 right-8 opacity-60">
      <svg viewBox="0 0 60 140" className="w-14">
        <path d="M20 140 Q10 100 20 70 Q10 50 20 20" stroke="#4CAF50" strokeWidth="8" fill="none" className="animate-sway" />
        <path d="M40 140 Q50 110 40 80 Q50 60 40 30" stroke="#66BB6A" strokeWidth="6" fill="none" className="animate-sway" style={{ animationDelay: '0.3s' }} />
      </svg>
    </div>

    {/* Bubbles scattered */}
    <div className="absolute top-1/4 right-1/3 opacity-50 animate-bubbles">
      <svg viewBox="0 0 40 60" className="w-8">
        <circle cx="20" cy="50" r="8" fill="#E3F2FD" />
        <circle cx="30" cy="35" r="5" fill="#E3F2FD" />
        <circle cx="15" cy="20" r="6" fill="#E3F2FD" />
        <circle cx="25" cy="10" r="4" fill="#E3F2FD" />
      </svg>
    </div>

    {/* Sandy bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-200/60 to-transparent" />
  </SceneWrapper>
);

const DragonScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-purple-300 via-violet-200 to-indigo-200">
    {/* Moon */}
    <div className="absolute top-4 right-8 w-24 opacity-70">
      <Moon />
    </div>

    {/* Stars */}
    <div className="absolute inset-0 opacity-40">
      <Stars />
    </div>

    {/* Castle silhouette */}
    <div className="absolute bottom-0 right-4 opacity-50">
      <svg viewBox="0 0 140 160" className="w-36">
        <rect x="30" y="80" width="80" height="80" fill="#4A148C" />
        <rect x="10" y="60" width="30" height="100" fill="#4A148C" />
        <rect x="100" y="60" width="30" height="100" fill="#4A148C" />
        {/* Towers */}
        <rect x="5" y="40" width="10" height="20" fill="#4A148C" />
        <rect x="25" y="40" width="10" height="20" fill="#4A148C" />
        <rect x="105" y="40" width="10" height="20" fill="#4A148C" />
        <rect x="125" y="40" width="10" height="20" fill="#4A148C" />
        {/* Tower tops */}
        <path d="M5 40 L10 25 L15 40 Z" fill="#4A148C" />
        <path d="M25 40 L30 25 L35 40 Z" fill="#4A148C" />
        <path d="M105 40 L110 25 L115 40 Z" fill="#4A148C" />
        <path d="M125 40 L130 25 L135 40 Z" fill="#4A148C" />
        {/* Windows */}
        <rect x="55" y="100" width="30" height="60" fill="#7C4DFF" rx="15" />
        <circle cx="25" cy="90" r="8" fill="#7C4DFF" />
        <circle cx="115" cy="90" r="8" fill="#7C4DFF" />
      </svg>
    </div>

    {/* Mountains */}
    <div className="absolute bottom-0 left-0 opacity-40">
      <svg viewBox="0 0 200 100" className="w-48">
        <path d="M0 100 L40 30 L80 100 Z" fill="#5E35B1" />
        <path d="M60 100 L110 20 L160 100 Z" fill="#673AB7" />
        <path d="M120 100 L170 40 L200 100 Z" fill="#5E35B1" />
      </svg>
    </div>

    {/* Dragon */}
    <div className="absolute bottom-24 left-4 w-56 md:w-72 opacity-95">
      <Dragon />
    </div>

    {/* Sparkles */}
    <div className="absolute top-1/3 left-1/2 text-2xl animate-twinkle">✨</div>
    <div className="absolute top-1/2 right-1/3 text-xl animate-twinkle" style={{ animationDelay: '0.5s' }}>✨</div>
  </SceneWrapper>
);

const RainbowScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-pink-200 via-purple-100 to-blue-100">
    {/* Rainbow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-70">
      <svg viewBox="0 0 300 150" className="w-80">
        <path d="M20 150 Q150 -50 280 150" stroke="#EF5350" strokeWidth="12" fill="none" />
        <path d="M30 150 Q150 -40 270 150" stroke="#FF9800" strokeWidth="12" fill="none" />
        <path d="M40 150 Q150 -30 260 150" stroke="#FFEB3B" strokeWidth="12" fill="none" />
        <path d="M50 150 Q150 -20 250 150" stroke="#4CAF50" strokeWidth="12" fill="none" />
        <path d="M60 150 Q150 -10 240 150" stroke="#2196F3" strokeWidth="12" fill="none" />
        <path d="M70 150 Q150 0 230 150" stroke="#9C27B0" strokeWidth="12" fill="none" />
      </svg>
    </div>

    {/* Clouds at rainbow ends */}
    <div className="absolute top-24 left-4 w-28 opacity-80">
      <Cloud />
    </div>
    <div className="absolute top-24 right-4 w-28 opacity-80">
      <Cloud />
    </div>

    {/* Flowers */}
    <div className="absolute bottom-8 left-8 opacity-80">
      <svg viewBox="0 0 50 80" className="w-12 animate-sway">
        <line x1="25" y1="80" x2="25" y2="40" stroke="#4CAF50" strokeWidth="4" />
        <circle cx="25" cy="30" r="15" fill="#E91E63" />
        <circle cx="25" cy="30" r="8" fill="#FFEB3B" />
      </svg>
    </div>
    <div className="absolute bottom-8 right-12 opacity-70">
      <svg viewBox="0 0 50 80" className="w-10 animate-sway" style={{ animationDelay: '0.3s' }}>
        <line x1="25" y1="80" x2="25" y2="45" stroke="#4CAF50" strokeWidth="3" />
        <circle cx="25" cy="35" r="12" fill="#9C27B0" />
        <circle cx="25" cy="35" r="6" fill="#FFEB3B" />
      </svg>
    </div>
    <div className="absolute bottom-4 left-1/3 opacity-75">
      <svg viewBox="0 0 40 70" className="w-8 animate-sway" style={{ animationDelay: '0.6s' }}>
        <line x1="20" y1="70" x2="20" y2="35" stroke="#4CAF50" strokeWidth="3" />
        <circle cx="20" cy="28" r="10" fill="#FF5722" />
        <circle cx="20" cy="28" r="5" fill="#FFEB3B" />
      </svg>
    </div>

    {/* Butterflies */}
    <div className="absolute top-1/3 left-1/4 w-14 opacity-75">
      <Butterfly color="blue" />
    </div>
    <div className="absolute top-1/2 right-1/3 w-12 opacity-65">
      <Butterfly color="purple" />
    </div>

    {/* Grass */}
    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-80">
      <Grass />
    </div>
  </SceneWrapper>
);

const PuppyScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-amber-100 via-yellow-50 to-green-100">
    {/* Sun */}
    <div className="absolute -top-8 -right-8 w-40 opacity-70">
      <Sun />
    </div>

    {/* House silhouette */}
    <div className="absolute top-16 right-8 opacity-40">
      <svg viewBox="0 0 100 100" className="w-24">
        <path d="M10 60 L50 25 L90 60 Z" fill="#795548" />
        <rect x="15" y="60" width="70" height="40" fill="#A1887F" />
        <rect x="40" y="70" width="20" height="30" fill="#5D4037" />
        <rect x="25" y="70" width="12" height="12" fill="#64B5F6" />
        <rect x="63" y="70" width="12" height="12" fill="#64B5F6" />
      </svg>
    </div>

    {/* Puppy */}
    <div className="absolute bottom-20 left-8 w-52 md:w-64 opacity-95">
      <Dog />
    </div>

    {/* Heart */}
    <div className="absolute top-1/3 left-1/3 opacity-60 animate-pulse-grow">
      <svg viewBox="0 0 50 45" className="w-10">
        <path d="M25 45 L5 25 Q0 15 10 10 Q20 5 25 15 Q30 5 40 10 Q50 15 45 25 Z" fill="#E91E63" />
      </svg>
    </div>

    {/* Tree */}
    <div className="absolute bottom-4 right-4 w-28 opacity-60">
      <Tree />
    </div>

    {/* Bone */}
    <div className="absolute bottom-32 right-1/3 opacity-50">
      <svg viewBox="0 0 60 25" className="w-14 animate-bounce-slow">
        <ellipse cx="10" cy="6" rx="8" ry="5" fill="#FFFDE7" />
        <ellipse cx="10" cy="19" rx="8" ry="5" fill="#FFFDE7" />
        <ellipse cx="50" cy="6" rx="8" ry="5" fill="#FFFDE7" />
        <ellipse cx="50" cy="19" rx="8" ry="5" fill="#FFFDE7" />
        <rect x="8" y="6" width="44" height="13" fill="#FFFDE7" />
      </svg>
    </div>

    {/* Grass */}
    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-80">
      <Grass />
    </div>
  </SceneWrapper>
);

const SpaceScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900">
    {/* Stars background */}
    <div className="absolute inset-0 opacity-80">
      <Stars />
    </div>
    <div className="absolute inset-0 opacity-60" style={{ transform: 'rotate(45deg)' }}>
      <Stars />
    </div>

    {/* Moon */}
    <div className="absolute top-8 right-8 w-28 opacity-80">
      <Moon />
    </div>

    {/* Rocket */}
    <div className="absolute top-1/4 left-8 w-24 md:w-32 opacity-95">
      <Rocket />
    </div>

    {/* Planet Saturn */}
    <div className="absolute bottom-1/4 right-8 opacity-70">
      <svg viewBox="0 0 100 80" className="w-28 animate-float">
        <ellipse cx="50" cy="40" rx="45" ry="12" fill="#FFB74D" opacity="0.5" transform="rotate(-20 50 40)" />
        <circle cx="50" cy="40" r="25" fill="#FFC107" />
        <circle cx="45" cy="35" r="15" fill="#FFE082" opacity="0.5" />
        <ellipse cx="50" cy="40" rx="45" ry="8" fill="none" stroke="#FFB74D" strokeWidth="3" transform="rotate(-20 50 40)" />
      </svg>
    </div>

    {/* Alien */}
    <div className="absolute bottom-20 left-1/4 opacity-80">
      <svg viewBox="0 0 60 80" className="w-16 animate-float" style={{ animationDelay: '1s' }}>
        <ellipse cx="30" cy="35" rx="25" ry="30" fill="#4CAF50" />
        <ellipse cx="30" cy="30" rx="20" ry="22" fill="#66BB6A" opacity="0.6" />
        <ellipse cx="20" cy="30" rx="8" ry="12" fill="#1A1A1A" />
        <ellipse cx="40" cy="30" rx="8" ry="12" fill="#1A1A1A" />
        <ellipse cx="22" cy="28" rx="3" ry="5" fill="white" />
        <ellipse cx="42" cy="28" rx="3" ry="5" fill="white" />
        <ellipse cx="30" cy="50" rx="8" ry="4" fill="#388E3C" />
        <line x1="15" y1="8" x2="12" y2="0" stroke="#4CAF50" strokeWidth="3" />
        <circle cx="12" cy="0" r="4" fill="#4CAF50" />
        <line x1="45" y1="8" x2="48" y2="0" stroke="#4CAF50" strokeWidth="3" />
        <circle cx="48" cy="0" r="4" fill="#4CAF50" />
      </svg>
    </div>

    {/* Distant stars twinkling */}
    <div className="absolute top-1/2 left-1/2 text-xs text-white animate-twinkle">★</div>
    <div className="absolute top-1/3 right-1/4 text-sm text-yellow-200 animate-twinkle" style={{ animationDelay: '0.5s' }}>★</div>
    <div className="absolute bottom-1/3 left-1/3 text-xs text-white animate-twinkle" style={{ animationDelay: '1s' }}>★</div>
  </SceneWrapper>
);

const OceanScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-cyan-400 via-blue-400 to-blue-700">
    {/* Light rays from surface */}
    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-200/40 to-transparent" />

    {/* Octopus */}
    <div className="absolute bottom-20 left-4 opacity-85">
      <svg viewBox="0 0 100 120" className="w-28 animate-float">
        {/* Tentacles */}
        <path d="M20 70 Q10 90 15 110 Q20 100 25 110" stroke="#9C27B0" strokeWidth="8" fill="none" className="animate-sway" />
        <path d="M35 75 Q30 95 28 115" stroke="#9C27B0" strokeWidth="7" fill="none" className="animate-sway" style={{ animationDelay: '0.2s' }} />
        <path d="M50 78 Q50 100 45 118" stroke="#9C27B0" strokeWidth="7" fill="none" className="animate-sway" style={{ animationDelay: '0.4s' }} />
        <path d="M65 75 Q70 95 72 115" stroke="#9C27B0" strokeWidth="7" fill="none" className="animate-sway" style={{ animationDelay: '0.3s' }} />
        <path d="M80 70 Q90 90 85 110 Q80 100 75 110" stroke="#9C27B0" strokeWidth="8" fill="none" className="animate-sway" style={{ animationDelay: '0.5s' }} />
        {/* Body */}
        <ellipse cx="50" cy="45" rx="35" ry="40" fill="#9C27B0" />
        <ellipse cx="48" cy="40" rx="25" ry="28" fill="#BA68C8" opacity="0.5" />
        {/* Eyes */}
        <circle cx="35" cy="40" r="10" fill="white" />
        <circle cx="65" cy="40" r="10" fill="white" />
        <circle cx="37" cy="40" r="6" fill="#1A1A1A" />
        <circle cx="67" cy="40" r="6" fill="#1A1A1A" />
        <circle cx="38" cy="38" r="2" fill="white" />
        <circle cx="68" cy="38" r="2" fill="white" />
        {/* Smile */}
        <path d="M40 58 Q50 65 60 58" stroke="#7B1FA2" strokeWidth="2" fill="none" />
      </svg>
    </div>

    {/* Sea turtle */}
    <div className="absolute top-1/4 right-8 opacity-80">
      <svg viewBox="0 0 90 70" className="w-24 animate-fish-swim">
        {/* Flippers */}
        <ellipse cx="25" cy="25" rx="18" ry="8" fill="#4CAF50" transform="rotate(-30 25 25)" />
        <ellipse cx="65" cy="25" rx="18" ry="8" fill="#4CAF50" transform="rotate(30 65 25)" />
        <ellipse cx="20" cy="50" rx="12" ry="6" fill="#4CAF50" transform="rotate(20 20 50)" />
        <ellipse cx="70" cy="50" rx="12" ry="6" fill="#4CAF50" transform="rotate(-20 70 50)" />
        {/* Shell */}
        <ellipse cx="45" cy="38" rx="28" ry="22" fill="#8D6E63" />
        <ellipse cx="45" cy="35" rx="22" ry="16" fill="#A1887F" />
        {/* Shell pattern */}
        <path d="M35 30 L45 25 L55 30" stroke="#6D4C41" strokeWidth="2" fill="none" />
        <path d="M30 40 L45 35 L60 40" stroke="#6D4C41" strokeWidth="2" fill="none" />
        {/* Head */}
        <ellipse cx="75" cy="38" rx="12" ry="10" fill="#66BB6A" />
        <circle cx="80" cy="35" r="3" fill="#1A1A1A" />
      </svg>
    </div>

    {/* Jellyfish */}
    <div className="absolute top-1/2 left-1/3 opacity-60">
      <svg viewBox="0 0 50 80" className="w-12 animate-float" style={{ animationDelay: '0.5s' }}>
        <ellipse cx="25" cy="20" rx="22" ry="18" fill="#E1BEE7" opacity="0.8" />
        <ellipse cx="25" cy="18" rx="15" ry="12" fill="#F3E5F5" opacity="0.6" />
        <path d="M10 35 Q8 55 12 75" stroke="#CE93D8" strokeWidth="2" fill="none" className="animate-sway" />
        <path d="M18 38 Q15 58 20 78" stroke="#CE93D8" strokeWidth="2" fill="none" className="animate-sway" style={{ animationDelay: '0.1s' }} />
        <path d="M25 38 Q25 60 25 80" stroke="#CE93D8" strokeWidth="2" fill="none" className="animate-sway" style={{ animationDelay: '0.2s' }} />
        <path d="M32 38 Q35 58 30 78" stroke="#CE93D8" strokeWidth="2" fill="none" className="animate-sway" style={{ animationDelay: '0.3s' }} />
        <path d="M40 35 Q42 55 38 75" stroke="#CE93D8" strokeWidth="2" fill="none" className="animate-sway" style={{ animationDelay: '0.4s' }} />
      </svg>
    </div>

    {/* Whale in distance */}
    <div className="absolute bottom-1/3 right-1/4 opacity-50">
      <svg viewBox="0 0 120 60" className="w-32 animate-float" style={{ animationDelay: '1s' }}>
        <ellipse cx="50" cy="35" rx="45" ry="22" fill="#1976D2" />
        <ellipse cx="100" cy="20" rx="15" ry="18" fill="#1976D2" transform="rotate(20 100 20)" />
        <circle cx="20" cy="30" r="4" fill="white" />
        <circle cx="21" cy="30" r="2" fill="#0D47A1" />
      </svg>
    </div>

    {/* Bubbles */}
    <div className="absolute top-1/3 right-12 animate-bubbles opacity-50">
      <svg viewBox="0 0 30 60" className="w-8">
        <circle cx="15" cy="50" r="6" fill="#E3F2FD" />
        <circle cx="20" cy="35" r="4" fill="#E3F2FD" />
        <circle cx="12" cy="20" r="5" fill="#E3F2FD" />
        <circle cx="18" cy="8" r="3" fill="#E3F2FD" />
      </svg>
    </div>

    {/* Coral bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-16 opacity-60">
      <svg viewBox="0 0 400 60" className="w-full h-full" preserveAspectRatio="none">
        <path d="M0 60 L0 40 Q20 20 40 40 Q60 10 80 35 Q100 15 120 40 Q140 5 160 30 Q180 20 200 45 Q220 15 240 35 Q260 10 280 40 Q300 20 320 35 Q340 5 360 40 Q380 25 400 40 L400 60 Z" fill="#FF7043" />
        <path d="M0 60 L0 50 Q30 35 60 50 Q90 30 120 45 Q150 25 180 50 Q210 35 240 48 Q270 30 300 50 Q330 40 360 52 Q390 45 400 50 L400 60 Z" fill="#E91E63" opacity="0.7" />
      </svg>
    </div>
  </SceneWrapper>
);

const TreehouseScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-green-300 via-emerald-200 to-amber-100">
    {/* Sun peeking through */}
    <div className="absolute -top-10 right-4 w-32 opacity-60">
      <Sun />
    </div>

    {/* Big tree with treehouse */}
    <div className="absolute bottom-0 left-4 opacity-90">
      <svg viewBox="0 0 200 300" className="w-48 md:w-56">
        {/* Trunk */}
        <rect x="80" y="180" width="40" height="120" fill="#5D4037" rx="5" />
        <rect x="88" y="190" width="15" height="100" fill="#6D4C41" opacity="0.5" rx="3" />

        {/* Branches */}
        <path d="M80 200 Q40 180 20 200" stroke="#5D4037" strokeWidth="12" fill="none" />
        <path d="M120 190 Q160 170 180 190" stroke="#5D4037" strokeWidth="10" fill="none" />

        {/* Foliage */}
        <ellipse cx="100" cy="120" rx="80" ry="60" fill="#388E3C" />
        <ellipse cx="95" cy="110" rx="60" ry="45" fill="#43A047" opacity="0.7" />
        <ellipse cx="50" cy="140" rx="45" ry="35" fill="#4CAF50" />
        <ellipse cx="150" cy="135" rx="40" ry="30" fill="#4CAF50" />
        <ellipse cx="100" cy="80" rx="50" ry="40" fill="#66BB6A" />

        {/* Treehouse */}
        <rect x="60" y="140" width="80" height="50" fill="#8D6E63" />
        <rect x="65" y="145" width="70" height="40" fill="#A1887F" opacity="0.6" />
        <path d="M55 140 L100 110 L145 140 Z" fill="#6D4C41" />
        <rect x="85" y="160" width="30" height="30" fill="#5D4037" rx="2" />
        <rect x="70" y="150" width="12" height="12" fill="#BBDEFB" />
        <rect x="118" y="150" width="12" height="12" fill="#BBDEFB" />

        {/* Ladder */}
        <line x1="100" y1="190" x2="100" y2="250" stroke="#5D4037" strokeWidth="4" />
        <line x1="110" y1="190" x2="110" y2="250" stroke="#5D4037" strokeWidth="4" />
        <line x1="100" y1="200" x2="110" y2="200" stroke="#5D4037" strokeWidth="3" />
        <line x1="100" y1="215" x2="110" y2="215" stroke="#5D4037" strokeWidth="3" />
        <line x1="100" y1="230" x2="110" y2="230" stroke="#5D4037" strokeWidth="3" />
        <line x1="100" y1="245" x2="110" y2="245" stroke="#5D4037" strokeWidth="3" />
      </svg>
    </div>

    {/* Books floating/scattered */}
    <div className="absolute top-1/3 right-8 opacity-70">
      <svg viewBox="0 0 50 60" className="w-12 animate-float">
        <rect x="5" y="10" width="35" height="45" fill="#E53935" rx="2" />
        <rect x="8" y="13" width="29" height="39" fill="#EF5350" rx="1" />
        <line x1="10" y1="20" x2="34" y2="20" stroke="white" strokeWidth="1" opacity="0.5" />
        <line x1="10" y1="25" x2="30" y2="25" stroke="white" strokeWidth="1" opacity="0.5" />
      </svg>
    </div>
    <div className="absolute bottom-1/3 right-1/4 opacity-60">
      <svg viewBox="0 0 45 55" className="w-10 animate-float" style={{ animationDelay: '0.5s' }}>
        <rect x="5" y="8" width="32" height="42" fill="#1976D2" rx="2" />
        <rect x="8" y="11" width="26" height="36" fill="#2196F3" rx="1" />
      </svg>
    </div>

    {/* Squirrel */}
    <div className="absolute top-1/4 right-12 opacity-75">
      <svg viewBox="0 0 50 60" className="w-12 animate-bounce-slow">
        {/* Tail */}
        <path d="M10 30 Q0 15 15 10 Q25 5 30 15 Q20 20 15 30" fill="#8D6E63" />
        {/* Body */}
        <ellipse cx="28" cy="40" rx="15" ry="18" fill="#A1887F" />
        <ellipse cx="26" cy="38" rx="10" ry="12" fill="#BCAAA4" opacity="0.5" />
        {/* Head */}
        <circle cx="38" cy="28" r="10" fill="#A1887F" />
        {/* Ears */}
        <ellipse cx="34" cy="20" rx="4" ry="6" fill="#8D6E63" />
        <ellipse cx="42" cy="20" rx="4" ry="6" fill="#8D6E63" />
        {/* Eye */}
        <circle cx="42" cy="26" r="3" fill="#1A1A1A" />
        <circle cx="43" cy="25" r="1" fill="white" />
        {/* Nose */}
        <circle cx="46" cy="30" r="2" fill="#5D4037" />
      </svg>
    </div>

    {/* Falling leaves */}
    <div className="absolute top-20 left-1/3 text-2xl opacity-50 animate-confetti">🍂</div>
    <div className="absolute top-32 right-1/3 text-xl opacity-40 animate-confetti" style={{ animationDelay: '1s' }}>🍂</div>

    {/* Grass */}
    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-80">
      <Grass />
    </div>
  </SceneWrapper>
);

const InventorScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-slate-200 via-zinc-100 to-amber-50">
    {/* Lightbulb idea */}
    <div className="absolute top-8 left-8 opacity-70">
      <svg viewBox="0 0 60 90" className="w-16 animate-pulse-grow">
        {/* Glow */}
        <circle cx="30" cy="35" r="30" fill="#FFEB3B" opacity="0.3" />
        {/* Bulb */}
        <circle cx="30" cy="35" r="22" fill="#FFEB3B" />
        <circle cx="28" cy="32" r="14" fill="#FFF59D" opacity="0.6" />
        {/* Base */}
        <rect x="22" y="55" width="16" height="6" fill="#9E9E9E" />
        <rect x="24" y="61" width="12" height="4" fill="#757575" />
        <rect x="22" y="65" width="16" height="6" fill="#9E9E9E" />
        {/* Rays */}
        <line x1="30" y1="5" x2="30" y2="0" stroke="#FFD54F" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="15" x2="55" y2="10" stroke="#FFD54F" strokeWidth="3" strokeLinecap="round" />
        <line x1="10" y1="15" x2="5" y2="10" stroke="#FFD54F" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>

    {/* Robot */}
    <div className="absolute bottom-16 right-8 opacity-85">
      <svg viewBox="0 0 80 120" className="w-24 animate-bounce-slow">
        {/* Antenna */}
        <line x1="40" y1="15" x2="40" y2="5" stroke="#757575" strokeWidth="3" />
        <circle cx="40" cy="3" r="5" fill="#F44336" className="animate-pulse-soft" />
        {/* Head */}
        <rect x="20" y="15" width="40" height="35" fill="#78909C" rx="5" />
        <rect x="25" y="20" width="30" height="25" fill="#90A4AE" rx="3" />
        {/* Eyes */}
        <circle cx="32" cy="32" r="6" fill="#1A1A1A" />
        <circle cx="48" cy="32" r="6" fill="#1A1A1A" />
        <circle cx="34" cy="30" r="2" fill="#64B5F6" />
        <circle cx="50" cy="30" r="2" fill="#64B5F6" />
        {/* Mouth */}
        <rect x="30" y="42" width="20" height="4" fill="#455A64" rx="2" />
        {/* Body */}
        <rect x="15" y="52" width="50" height="45" fill="#607D8B" rx="5" />
        <rect x="20" y="57" width="40" height="35" fill="#78909C" rx="3" />
        {/* Chest panel */}
        <rect x="28" y="62" width="24" height="18" fill="#455A64" rx="2" />
        <circle cx="35" cy="68" r="3" fill="#4CAF50" className="animate-pulse-soft" />
        <circle cx="45" cy="68" r="3" fill="#F44336" />
        <rect x="32" y="74" width="16" height="3" fill="#2196F3" />
        {/* Arms */}
        <rect x="5" y="55" width="12" height="30" fill="#78909C" rx="3" />
        <rect x="63" y="55" width="12" height="30" fill="#78909C" rx="3" />
        {/* Legs */}
        <rect x="22" y="97" width="14" height="20" fill="#607D8B" rx="3" />
        <rect x="44" y="97" width="14" height="20" fill="#607D8B" rx="3" />
      </svg>
    </div>

    {/* Gears */}
    <div className="absolute top-1/4 right-1/4 opacity-40">
      <svg viewBox="0 0 60 60" className="w-16 animate-spin-slow">
        <circle cx="30" cy="30" r="25" fill="#9E9E9E" />
        <circle cx="30" cy="30" r="18" fill="#BDBDBD" />
        <circle cx="30" cy="30" r="8" fill="#757575" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <rect
            key={i}
            x="27"
            y="2"
            width="6"
            height="10"
            fill="#9E9E9E"
            transform={`rotate(${angle} 30 30)`}
          />
        ))}
      </svg>
    </div>
    <div className="absolute bottom-1/3 left-1/4 opacity-30">
      <svg viewBox="0 0 40 40" className="w-10 animate-spin-slow" style={{ animationDirection: 'reverse' }}>
        <circle cx="20" cy="20" r="16" fill="#757575" />
        <circle cx="20" cy="20" r="10" fill="#9E9E9E" />
        <circle cx="20" cy="20" r="5" fill="#616161" />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <rect
            key={i}
            x="18"
            y="2"
            width="4"
            height="6"
            fill="#757575"
            transform={`rotate(${angle} 20 20)`}
          />
        ))}
      </svg>
    </div>

    {/* Tools */}
    <div className="absolute bottom-24 left-12 opacity-50">
      <svg viewBox="0 0 50 80" className="w-10">
        {/* Wrench */}
        <ellipse cx="25" cy="15" rx="12" ry="10" fill="#607D8B" />
        <rect x="22" y="20" width="6" height="55" fill="#78909C" />
        <ellipse cx="25" cy="15" rx="6" ry="5" fill="#455A64" />
      </svg>
    </div>

    {/* Sparks */}
    <div className="absolute top-1/2 left-1/3 text-xl animate-twinkle">⚡</div>
    <div className="absolute bottom-1/4 right-1/3 text-lg animate-twinkle" style={{ animationDelay: '0.5s' }}>⚡</div>
  </SceneWrapper>
);

const ForestScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-green-400 via-emerald-300 to-green-200">
    {/* Trees */}
    <div className="absolute bottom-0 left-0 w-28 md:w-36 opacity-90">
      <Tree />
    </div>
    <div className="absolute bottom-0 right-0 w-32 md:w-40 opacity-85">
      <Tree />
    </div>
    <div className="absolute bottom-0 left-1/4 w-24 opacity-70">
      <Tree />
    </div>

    {/* Owl */}
    <div className="absolute top-20 left-12 opacity-80">
      <svg viewBox="0 0 60 80" className="w-16">
        {/* Body */}
        <ellipse cx="30" cy="55" rx="22" ry="25" fill="#8D6E63" />
        <ellipse cx="30" cy="50" rx="16" ry="18" fill="#A1887F" opacity="0.6" />
        {/* Chest pattern */}
        <ellipse cx="30" cy="60" rx="12" ry="15" fill="#D7CCC8" />
        {/* Head */}
        <ellipse cx="30" cy="25" rx="20" ry="18" fill="#8D6E63" />
        {/* Ear tufts */}
        <path d="M15 15 L18 5 L22 12" fill="#6D4C41" />
        <path d="M45 15 L42 5 L38 12" fill="#6D4C41" />
        {/* Eyes */}
        <circle cx="22" cy="25" r="8" fill="#FFEB3B" />
        <circle cx="38" cy="25" r="8" fill="#FFEB3B" />
        <circle cx="23" cy="25" r="5" fill="#1A1A1A" />
        <circle cx="39" cy="25" r="5" fill="#1A1A1A" />
        <circle cx="24" cy="24" r="1.5" fill="white" />
        <circle cx="40" cy="24" r="1.5" fill="white" />
        {/* Beak */}
        <path d="M27 32 L30 40 L33 32 Z" fill="#FF9800" />
        {/* Wings */}
        <ellipse cx="12" cy="50" rx="8" ry="15" fill="#795548" />
        <ellipse cx="48" cy="50" rx="8" ry="15" fill="#795548" />
      </svg>
    </div>

    {/* Deer */}
    <div className="absolute bottom-20 right-1/4 opacity-75">
      <svg viewBox="0 0 80 100" className="w-20 animate-sway" style={{ animationDuration: '5s' }}>
        {/* Body */}
        <ellipse cx="40" cy="60" rx="30" ry="22" fill="#8D6E63" />
        <ellipse cx="38" cy="55" rx="22" ry="16" fill="#A1887F" opacity="0.5" />
        {/* Legs */}
        <rect x="18" y="75" width="6" height="25" fill="#6D4C41" />
        <rect x="30" y="75" width="6" height="25" fill="#6D4C41" />
        <rect x="48" y="75" width="6" height="25" fill="#6D4C41" />
        <rect x="58" y="75" width="6" height="25" fill="#6D4C41" />
        {/* Neck & Head */}
        <ellipse cx="65" cy="45" rx="8" ry="15" fill="#8D6E63" />
        <ellipse cx="70" cy="30" rx="12" ry="10" fill="#A1887F" />
        {/* Antlers */}
        <path d="M65 20 L60 8 L55 15" stroke="#5D4037" strokeWidth="3" fill="none" />
        <path d="M75 20 L80 8 L85 15" stroke="#5D4037" strokeWidth="3" fill="none" />
        {/* Eye */}
        <circle cx="75" cy="28" r="3" fill="#1A1A1A" />
        {/* Nose */}
        <ellipse cx="80" cy="32" rx="3" ry="2" fill="#5D4037" />
        {/* Tail */}
        <ellipse cx="12" cy="55" rx="6" ry="4" fill="#D7CCC8" />
      </svg>
    </div>

    {/* Squirrel */}
    <div className="absolute top-1/3 right-8 opacity-70">
      <svg viewBox="0 0 40 50" className="w-10 animate-bounce-slow">
        <path d="M8 25 Q0 12 12 8 Q20 4 25 12 Q18 18 12 25" fill="#8D6E63" />
        <ellipse cx="22" cy="32" rx="12" ry="14" fill="#A1887F" />
        <circle cx="30" cy="22" r="8" fill="#A1887F" />
        <circle cx="34" cy="20" r="2" fill="#1A1A1A" />
        <ellipse cx="28" cy="15" rx="3" ry="5" fill="#8D6E63" />
      </svg>
    </div>

    {/* Mushrooms */}
    <div className="absolute bottom-8 left-1/3 opacity-60">
      <svg viewBox="0 0 40 50" className="w-10">
        <rect x="16" y="30" width="8" height="20" fill="#FFFDE7" />
        <ellipse cx="20" cy="28" rx="18" ry="12" fill="#F44336" />
        <circle cx="12" cy="25" r="3" fill="white" />
        <circle cx="25" cy="22" r="4" fill="white" />
        <circle cx="18" cy="32" r="2" fill="white" />
      </svg>
    </div>

    {/* Beaver */}
    <div className="absolute bottom-12 left-16 opacity-75">
      <svg viewBox="0 0 60 50" className="w-14">
        {/* Body */}
        <ellipse cx="25" cy="30" rx="20" ry="16" fill="#795548" />
        {/* Tail */}
        <ellipse cx="5" cy="35" rx="12" ry="8" fill="#5D4037" transform="rotate(-20 5 35)" />
        {/* Head */}
        <circle cx="45" cy="28" r="12" fill="#8D6E63" />
        {/* Eye */}
        <circle cx="50" cy="25" r="3" fill="#1A1A1A" />
        {/* Nose */}
        <ellipse cx="55" cy="30" rx="4" ry="3" fill="#4E342E" />
        {/* Teeth */}
        <rect x="50" y="34" width="4" height="6" fill="#FFFDE7" />
        <rect x="54" y="34" width="4" height="6" fill="#FFFDE7" />
      </svg>
    </div>

    {/* Grass */}
    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-90">
      <Grass />
    </div>
  </SceneWrapper>
);

const DetectiveScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-amber-200 via-yellow-100 to-orange-100">
    {/* Sun */}
    <div className="absolute -top-8 right-8 w-32 opacity-60">
      <Sun />
    </div>

    {/* School building */}
    <div className="absolute top-12 left-8 opacity-50">
      <svg viewBox="0 0 120 100" className="w-32">
        <rect x="10" y="30" width="100" height="70" fill="#FFCCBC" />
        <rect x="15" y="35" width="90" height="60" fill="#FFAB91" opacity="0.5" />
        <path d="M0 30 L60 5 L120 30 Z" fill="#8D6E63" />
        {/* Windows */}
        <rect x="25" y="45" width="15" height="15" fill="#90CAF9" />
        <rect x="52" y="45" width="15" height="15" fill="#90CAF9" />
        <rect x="79" y="45" width="15" height="15" fill="#90CAF9" />
        {/* Door */}
        <rect x="48" y="65" width="24" height="35" fill="#5D4037" rx="12" />
        {/* Flag */}
        <line x1="60" y1="5" x2="60" y2="-10" stroke="#5D4037" strokeWidth="2" />
        <rect x="60" y="-10" width="20" height="12" fill="#F44336" />
      </svg>
    </div>

    {/* Magnifying glass */}
    <div className="absolute top-20 right-12 opacity-70">
      <svg viewBox="0 0 70 70" className="w-20 animate-float">
        <circle cx="28" cy="28" r="22" fill="none" stroke="#5D4037" strokeWidth="6" />
        <circle cx="28" cy="28" r="18" fill="#E3F2FD" opacity="0.5" />
        <circle cx="28" cy="28" r="15" fill="#BBDEFB" opacity="0.3" />
        <line x1="44" y1="44" x2="65" y2="65" stroke="#5D4037" strokeWidth="8" strokeLinecap="round" />
        {/* Shine */}
        <path d="M18 18 Q22 14 26 18" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />
      </svg>
    </div>

    {/* Raccoons */}
    <div className="absolute bottom-16 right-8 opacity-85">
      <svg viewBox="0 0 80 70" className="w-24 animate-sway" style={{ animationDuration: '3s' }}>
        {/* Body */}
        <ellipse cx="40" cy="50" rx="28" ry="18" fill="#757575" />
        <ellipse cx="38" cy="47" rx="20" ry="13" fill="#9E9E9E" opacity="0.5" />
        {/* Tail */}
        <ellipse cx="8" cy="45" rx="12" ry="8" fill="#757575" transform="rotate(-30 8 45)" />
        <ellipse cx="8" cy="45" rx="10" ry="6" fill="#424242" opacity="0.5" transform="rotate(-30 8 45)" />
        {/* Stripes on tail */}
        <path d="M3 42 Q8 40 13 42" stroke="#424242" strokeWidth="2" fill="none" />
        <path d="M5 48 Q8 46 11 48" stroke="#424242" strokeWidth="2" fill="none" />
        {/* Head */}
        <ellipse cx="60" cy="35" rx="18" ry="15" fill="#9E9E9E" />
        {/* Mask */}
        <ellipse cx="52" cy="33" rx="7" ry="5" fill="#424242" />
        <ellipse cx="68" cy="33" rx="7" ry="5" fill="#424242" />
        {/* Eyes */}
        <circle cx="52" cy="33" r="4" fill="white" />
        <circle cx="68" cy="33" r="4" fill="white" />
        <circle cx="53" cy="33" r="2" fill="#1A1A1A" />
        <circle cx="69" cy="33" r="2" fill="#1A1A1A" />
        {/* Ears */}
        <ellipse cx="48" cy="22" rx="5" ry="7" fill="#757575" />
        <ellipse cx="72" cy="22" rx="5" ry="7" fill="#757575" />
        {/* Nose */}
        <ellipse cx="60" cy="42" rx="4" ry="3" fill="#424242" />
        {/* Paws */}
        <ellipse cx="55" cy="65" rx="6" ry="5" fill="#9E9E9E" />
        <ellipse cx="70" cy="65" rx="6" ry="5" fill="#9E9E9E" />
      </svg>
    </div>

    {/* Basketball */}
    <div className="absolute bottom-20 left-16 opacity-60">
      <svg viewBox="0 0 50 50" className="w-12 animate-bounce-slow">
        <circle cx="25" cy="25" r="22" fill="#FF5722" />
        <circle cx="22" cy="22" r="15" fill="#FF7043" opacity="0.5" />
        <path d="M25 3 L25 47" stroke="#BF360C" strokeWidth="2" />
        <path d="M3 25 L47 25" stroke="#BF360C" strokeWidth="2" />
        <path d="M8 8 Q25 20 8 42" stroke="#BF360C" strokeWidth="2" fill="none" />
        <path d="M42 8 Q25 20 42 42" stroke="#BF360C" strokeWidth="2" fill="none" />
      </svg>
    </div>

    {/* Footprints */}
    <div className="absolute bottom-8 left-1/3 opacity-40 text-2xl">👣</div>
    <div className="absolute bottom-12 left-1/2 opacity-30 text-xl">👣</div>

    {/* Notepad */}
    <div className="absolute top-1/2 left-4 opacity-50">
      <svg viewBox="0 0 40 55" className="w-10">
        <rect x="5" y="5" width="30" height="45" fill="#FFFDE7" rx="2" />
        <line x1="10" y1="15" x2="30" y2="15" stroke="#BDBDBD" strokeWidth="1" />
        <line x1="10" y1="22" x2="30" y2="22" stroke="#BDBDBD" strokeWidth="1" />
        <line x1="10" y1="29" x2="25" y2="29" stroke="#BDBDBD" strokeWidth="1" />
        <line x1="10" y1="36" x2="28" y2="36" stroke="#BDBDBD" strokeWidth="1" />
        {/* Pencil */}
        <rect x="32" y="8" width="6" height="40" fill="#FFC107" transform="rotate(15 35 28)" />
        <path d="M30 48 L32 55 L38 50 Z" fill="#FFB74D" transform="rotate(15 35 28)" />
      </svg>
    </div>

    {/* Grass */}
    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-80">
      <Grass />
    </div>
  </SceneWrapper>
);

const HulaHoopScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-pink-200 via-fuchsia-100 to-yellow-100">
    {/* Sun */}
    <div className="absolute -top-8 -right-8 w-40 opacity-70">
      <Sun />
    </div>

    {/* Clouds */}
    <div className="absolute top-12 left-8 w-28 opacity-50">
      <Cloud />
    </div>

    {/* Hula hoops scattered */}
    <div className="absolute bottom-1/3 left-1/4 opacity-70">
      <svg viewBox="0 0 120 120" className="w-32 animate-spin-slow" style={{ animationDuration: '4s' }}>
        <circle cx="60" cy="60" r="50" fill="none" stroke="#E91E63" strokeWidth="8" />
        <circle cx="60" cy="60" r="50" fill="none" stroke="#F48FB1" strokeWidth="4" strokeDasharray="15 10" />
      </svg>
    </div>
    <div className="absolute top-1/3 right-12 opacity-60">
      <svg viewBox="0 0 100 100" className="w-24 animate-spin-slow" style={{ animationDuration: '5s', animationDirection: 'reverse' }}>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#9C27B0" strokeWidth="7" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#CE93D8" strokeWidth="3" strokeDasharray="12 8" />
      </svg>
    </div>
    <div className="absolute bottom-24 right-1/4 opacity-50">
      <svg viewBox="0 0 80 80" className="w-20 animate-spin-slow" style={{ animationDuration: '6s' }}>
        <circle cx="40" cy="40" r="33" fill="none" stroke="#FF9800" strokeWidth="6" />
        <circle cx="40" cy="40" r="33" fill="none" stroke="#FFB74D" strokeWidth="3" strokeDasharray="10 6" />
      </svg>
    </div>

    {/* Girl figure (Mila) */}
    <div className="absolute bottom-16 left-8 opacity-90">
      <svg viewBox="0 0 80 130" className="w-24">
        {/* Hair */}
        <ellipse cx="40" cy="28" rx="18" ry="20" fill="#5D4037" />
        <ellipse cx="25" cy="40" rx="8" ry="16" fill="#5D4037" />
        <ellipse cx="55" cy="40" rx="8" ry="16" fill="#5D4037" />
        {/* Face */}
        <circle cx="40" cy="30" r="15" fill="#FFCCBC" />
        {/* Eyes */}
        <circle cx="34" cy="28" r="3" fill="#1A1A1A" />
        <circle cx="46" cy="28" r="3" fill="#1A1A1A" />
        <circle cx="35" cy="27" r="1" fill="white" />
        <circle cx="47" cy="27" r="1" fill="white" />
        {/* Smile */}
        <path d="M34 35 Q40 40 46 35" stroke="#E91E63" strokeWidth="2" fill="none" />
        {/* Body / dress */}
        <path d="M30 45 L25 90 L55 90 L50 45 Z" fill="#E91E63" />
        <path d="M32 48 L28 85 L52 85 L48 48 Z" fill="#F48FB1" opacity="0.6" />
        {/* Arms out */}
        <line x1="30" y1="52" x2="10" y2="60" stroke="#FFCCBC" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="52" x2="70" y2="60" stroke="#FFCCBC" strokeWidth="6" strokeLinecap="round" />
        {/* Legs */}
        <rect x="32" y="90" width="6" height="25" fill="#FFCCBC" />
        <rect x="42" y="90" width="6" height="25" fill="#FFCCBC" />
        {/* Shoes */}
        <ellipse cx="35" cy="117" rx="8" ry="5" fill="#9C27B0" />
        <ellipse cx="45" cy="117" rx="8" ry="5" fill="#9C27B0" />
        {/* Hoop around waist */}
        <ellipse cx="40" cy="70" rx="30" ry="10" fill="none" stroke="#4CAF50" strokeWidth="5" className="animate-sway" style={{ animationDuration: '0.8s' }} />
      </svg>
    </div>

    {/* Butterflies */}
    <div className="absolute top-1/4 left-1/2 w-12 opacity-65">
      <Butterfly color="purple" />
    </div>

    {/* Grass */}
    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-80">
      <Grass />
    </div>

    {/* Sparkles */}
    <div className="absolute top-1/2 right-8 text-xl animate-twinkle">✨</div>
    <div className="absolute bottom-1/4 left-1/3 text-lg animate-twinkle" style={{ animationDelay: '0.7s' }}>✨</div>
  </SceneWrapper>
);

const CarsScene = () => (
  <SceneWrapper bgClass="bg-gradient-to-b from-sky-200 via-blue-100 to-slate-200">
    {/* Sun */}
    <div className="absolute -top-8 left-4 w-36 opacity-65">
      <Sun />
    </div>

    {/* Clouds */}
    <div className="absolute top-10 right-12 w-32 opacity-55">
      <Cloud />
    </div>
    <div className="absolute top-20 left-1/3 w-24 opacity-40">
      <Cloud />
    </div>

    {/* Road */}
    <div className="absolute bottom-0 left-0 right-0 opacity-80">
      <svg viewBox="0 0 400 60" className="w-full" preserveAspectRatio="none">
        <rect x="0" y="10" width="400" height="50" fill="#616161" />
        <rect x="0" y="8" width="400" height="6" fill="#9E9E9E" />
        {/* Dashed center line */}
        <line x1="0" y1="35" x2="400" y2="35" stroke="#FFC107" strokeWidth="3" strokeDasharray="20 15" />
      </svg>
    </div>

    {/* Red car */}
    <div className="absolute bottom-10 left-8 opacity-90">
      <svg viewBox="0 0 120 60" className="w-32">
        {/* Body */}
        <rect x="10" y="25" width="100" height="25" fill="#F44336" rx="5" />
        <path d="M30 25 Q35 8 55 8 Q75 8 80 25" fill="#E53935" />
        {/* Windows */}
        <path d="M35 25 Q38 13 55 13 Q62 13 65 25" fill="#BBDEFB" />
        <path d="M68 25 Q70 15 78 25" fill="#BBDEFB" />
        {/* Wheels */}
        <circle cx="30" cy="50" r="10" fill="#424242" />
        <circle cx="30" cy="50" r="5" fill="#9E9E9E" />
        <circle cx="85" cy="50" r="10" fill="#424242" />
        <circle cx="85" cy="50" r="5" fill="#9E9E9E" />
        {/* Headlight */}
        <ellipse cx="108" cy="35" rx="4" ry="5" fill="#FFEB3B" />
      </svg>
    </div>

    {/* Blue car (faster, ahead) */}
    <div className="absolute bottom-12 right-4 opacity-85">
      <svg viewBox="0 0 110 55" className="w-28">
        {/* Body */}
        <rect x="8" y="22" width="95" height="23" fill="#1976D2" rx="5" />
        <path d="M28 22 Q32 7 50 7 Q68 7 72 22" fill="#1565C0" />
        {/* Windows */}
        <path d="M32 22 Q35 11 50 11 Q58 11 60 22" fill="#BBDEFB" />
        <path d="M63 22 Q65 13 72 22" fill="#BBDEFB" />
        {/* Wheels */}
        <circle cx="28" cy="45" r="9" fill="#424242" />
        <circle cx="28" cy="45" r="4.5" fill="#9E9E9E" />
        <circle cx="78" cy="45" r="9" fill="#424242" />
        <circle cx="78" cy="45" r="4.5" fill="#9E9E9E" />
        {/* Headlight */}
        <ellipse cx="100" cy="32" rx="3.5" ry="4.5" fill="#FFEB3B" />
        {/* Speed lines */}
        <line x1="0" y1="28" x2="-12" y2="28" stroke="#90CAF9" strokeWidth="2" opacity="0.6" />
        <line x1="0" y1="35" x2="-15" y2="35" stroke="#90CAF9" strokeWidth="2" opacity="0.5" />
      </svg>
    </div>

    {/* Ramp */}
    <div className="absolute bottom-14 left-1/3 opacity-60">
      <svg viewBox="0 0 80 50" className="w-20">
        <path d="M0 50 L80 50 L80 15 Z" fill="#8D6E63" />
        <path d="M5 50 L80 50 L80 20 Z" fill="#A1887F" opacity="0.5" />
      </svg>
    </div>

    {/* Boy figure (Eric) */}
    <div className="absolute bottom-20 right-1/3 opacity-80">
      <svg viewBox="0 0 50 90" className="w-14">
        {/* Hair */}
        <ellipse cx="25" cy="18" rx="12" ry="13" fill="#3E2723" />
        {/* Face */}
        <circle cx="25" cy="20" r="10" fill="#FFCCBC" />
        {/* Eyes */}
        <circle cx="21" cy="18" r="2" fill="#1A1A1A" />
        <circle cx="29" cy="18" r="2" fill="#1A1A1A" />
        {/* Smile */}
        <path d="M21 24 Q25 28 29 24" stroke="#E91E63" strokeWidth="1.5" fill="none" />
        {/* Body / shirt */}
        <rect x="15" y="30" width="20" height="28" fill="#2196F3" rx="3" />
        <rect x="17" y="33" width="16" height="22" fill="#42A5F5" opacity="0.5" rx="2" />
        {/* Arms */}
        <line x1="15" y1="34" x2="5" y2="48" stroke="#FFCCBC" strokeWidth="5" strokeLinecap="round" />
        <line x1="35" y1="34" x2="45" y2="48" stroke="#FFCCBC" strokeWidth="5" strokeLinecap="round" />
        {/* Legs */}
        <rect x="17" y="58" width="5" height="20" fill="#424242" />
        <rect x="28" y="58" width="5" height="20" fill="#424242" />
        {/* Shoes */}
        <ellipse cx="19" cy="80" rx="6" ry="4" fill="#F44336" />
        <ellipse cx="31" cy="80" rx="6" ry="4" fill="#F44336" />
      </svg>
    </div>

    {/* Tree */}
    <div className="absolute bottom-4 left-0 w-20 opacity-50">
      <Tree />
    </div>
  </SceneWrapper>
);

// Main scene selector
export default function StoryScene({ storyId, className = '' }: StorySceneProps) {
  const scenes: Record<string, React.ReactNode> = {
    'jk-cat': <CatScene />,
    'jk-ball': <BallScene />,
    'jk-dog': <DogScene />,
    'sk-frog': <FrogScene />,
    'sk-sun': <SunScene />,
    'sk-fish': <FishScene />,
    'g1-dragon': <DragonScene />,
    'g1-rainbow': <RainbowScene />,
    'g1-puppy': <PuppyScene />,
    'g1-mila': <HulaHoopScene />,
    'g1-eric': <CarsScene />,
    'g2-space': <SpaceScene />,
    'g2-ocean': <OceanScene />,
    'g2-treehouse': <TreehouseScene />,
    'g3-inventor': <InventorScene />,
    'g3-forest': <ForestScene />,
    'g3-detective': <DetectiveScene />,
  };

  // Default scene if story not found
  const DefaultScene = () => (
    <SceneWrapper bgClass="bg-gradient-to-b from-blue-100 via-white to-purple-100">
      <div className="absolute top-8 left-8 w-24 opacity-50">
        <Sun />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-10 opacity-70">
        <Grass />
      </div>
    </SceneWrapper>
  );

  return (
    <div className={`absolute inset-0 ${className}`}>
      {scenes[storyId] || <DefaultScene />}
    </div>
  );
}
