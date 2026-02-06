'use client';

import { useEffect, useState, useMemo } from 'react';

interface PageTransitionProps {
  show: boolean;
  storyId: string;
  onComplete: () => void;
}

type TransitionType =
  | 'dinosaur-bite'
  | 'monster-grab'
  | 'cat-swipe'
  | 'dog-shake'
  | 'tornado-spin'
  | 'rocket-crash'
  | 'giant-tongue'
  | 'ninja-slice';

// Pool of crazy transitions
const transitionPool: TransitionType[] = [
  'dinosaur-bite',
  'monster-grab',
  'cat-swipe',
  'dog-shake',
  'tornado-spin',
  'rocket-crash',
  'giant-tongue',
  'ninja-slice',
];

// Generate confetti particles
function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    size: 8 + Math.random() * 12,
    color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'][Math.floor(Math.random() * 7)],
  }));
}

export default function PageTransition({ show, storyId, onComplete }: PageTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);

  // Pick a random transition each time
  const transition = useMemo(() => {
    return transitionPool[Math.floor(Math.random() * transitionPool.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionKey]);

  const confetti = useMemo(() => generateConfetti(30), [transitionKey]);

  useEffect(() => {
    if (show) {
      setTransitionKey(prev => prev + 1);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || !isAnimating) return null;

  const encouragements = ['CHOMP!', 'WOOSH!', 'SWOOSH!', 'CRASH!', 'ZOOM!', 'POW!', 'WHOA!', 'WOW!'];
  const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Page being "destroyed" effect */}
      <div className="absolute inset-0 bg-white animate-page-shake" />

      {/* DINOSAUR BITE - A T-Rex head comes in and takes a bite out of the screen */}
      {transition === 'dinosaur-bite' && (
        <>
          {/* Bite mark left behind */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 animate-bite-reveal">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path
                d="M200,0 L200,200 L0,200 L0,150 Q30,140 40,120 Q50,100 40,80 Q30,60 50,40 Q70,20 60,0 Z"
                fill="#1a1a1a"
              />
            </svg>
          </div>
          {/* T-Rex head */}
          <div className="absolute -right-40 top-1/4 animate-dino-chomp">
            <svg width="400" height="300" viewBox="0 0 400 300">
              {/* Head */}
              <ellipse cx="250" cy="150" rx="150" ry="100" fill="#2D5A27" />
              <ellipse cx="250" cy="150" rx="140" ry="90" fill="#3D7A37" />
              {/* Snout */}
              <ellipse cx="80" cy="140" rx="100" ry="60" fill="#3D7A37" />
              <ellipse cx="60" cy="130" rx="80" ry="45" fill="#4D8A47" />
              {/* Nostril */}
              <ellipse cx="20" cy="110" rx="8" ry="12" fill="#1D3A17" />
              {/* Eye */}
              <circle cx="280" cy="100" r="35" fill="white" />
              <circle cx="290" cy="100" r="20" fill="#1a1a1a" />
              <circle cx="295" cy="95" r="6" fill="white" />
              {/* Angry eyebrow */}
              <path d="M240,60 Q280,50 320,70" stroke="#1D3A17" strokeWidth="12" fill="none" />
              {/* Teeth - top jaw */}
              <path d="M0,160 L20,200 L40,160 L60,200 L80,160 L100,200 L120,160 L140,200 L160,160"
                    fill="white" stroke="#ddd" strokeWidth="2" />
              {/* Teeth - bottom jaw */}
              <path d="M10,180 L30,140 L50,180 L70,140 L90,180 L110,140 L130,180 L150,140"
                    fill="white" stroke="#ddd" strokeWidth="2" className="animate-jaw" />
              {/* Scales */}
              <circle cx="320" cy="80" r="15" fill="#2D5A27" />
              <circle cx="350" cy="110" r="12" fill="#2D5A27" />
              <circle cx="370" cy="150" r="10" fill="#2D5A27" />
            </svg>
          </div>
          {/* Crumbs flying */}
          {confetti.slice(0, 15).map((c) => (
            <div
              key={c.id}
              className="absolute animate-crumb-fly"
              style={{
                right: '30%',
                top: '30%',
                '--end-x': `${(Math.random() - 0.5) * 300}px`,
                '--end-y': `${Math.random() * 200 + 100}px`,
                animationDelay: `${0.3 + c.delay}s`,
              } as React.CSSProperties}
            >
              <div
                className="rounded-sm bg-gray-200"
                style={{ width: c.size, height: c.size }}
              />
            </div>
          ))}
        </>
      )}

      {/* MONSTER GRAB - Giant furry hand grabs the page */}
      {transition === 'monster-grab' && (
        <>
          <div className="absolute inset-0 animate-page-crumple" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 animate-monster-grab">
            <svg width="400" height="300" viewBox="0 0 400 300">
              {/* Furry arm */}
              <ellipse cx="200" cy="280" rx="100" ry="60" fill="#8B4513" />
              {/* Palm */}
              <ellipse cx="200" cy="150" rx="120" ry="80" fill="#A0522D" />
              {/* Fingers */}
              <ellipse cx="80" cy="80" rx="35" ry="70" fill="#8B4513" className="origin-bottom animate-finger-curl" style={{ animationDelay: '0.1s' }} />
              <ellipse cx="140" cy="50" rx="30" ry="80" fill="#8B4513" className="origin-bottom animate-finger-curl" style={{ animationDelay: '0.15s' }} />
              <ellipse cx="200" cy="40" rx="30" ry="85" fill="#8B4513" className="origin-bottom animate-finger-curl" style={{ animationDelay: '0.2s' }} />
              <ellipse cx="260" cy="50" rx="30" ry="80" fill="#8B4513" className="origin-bottom animate-finger-curl" style={{ animationDelay: '0.25s' }} />
              <ellipse cx="320" cy="80" rx="35" ry="70" fill="#8B4513" className="origin-bottom animate-finger-curl" style={{ animationDelay: '0.3s' }} />
              {/* Claws */}
              {[80, 140, 200, 260, 320].map((x, i) => (
                <ellipse key={i} cx={x} cy={i === 2 ? -20 : i === 0 || i === 4 ? 30 : 0} rx="12" ry="25" fill="#2a2a2a" />
              ))}
              {/* Fur texture */}
              {[...Array(20)].map((_, i) => (
                <line
                  key={i}
                  x1={100 + Math.random() * 200}
                  y1={120 + Math.random() * 60}
                  x2={100 + Math.random() * 200}
                  y2={130 + Math.random() * 60}
                  stroke="#6B3513"
                  strokeWidth="3"
                />
              ))}
            </svg>
          </div>
        </>
      )}

      {/* CAT SWIPE - Cat paw swipes across and knocks everything off */}
      {transition === 'cat-swipe' && (
        <>
          <div className="absolute inset-0 animate-slide-off-right" />
          <div className="absolute -left-40 top-1/3 animate-cat-swipe">
            <svg width="300" height="200" viewBox="0 0 300 200">
              {/* Arm */}
              <ellipse cx="50" cy="100" rx="80" ry="50" fill="#FF9F43" />
              {/* Paw */}
              <ellipse cx="200" cy="100" rx="80" ry="60" fill="#FFB366" />
              {/* Paw pads */}
              <ellipse cx="180" cy="130" rx="25" ry="20" fill="#FF7675" />
              <ellipse cx="220" cy="80" rx="15" ry="12" fill="#FF7675" />
              <ellipse cx="250" cy="95" rx="15" ry="12" fill="#FF7675" />
              <ellipse cx="250" cy="125" rx="15" ry="12" fill="#FF7675" />
              {/* Claws extended */}
              <path d="M270,70 Q290,50 280,80" fill="white" stroke="#ddd" strokeWidth="2" />
              <path d="M285,90 Q310,75 295,105" fill="white" stroke="#ddd" strokeWidth="2" />
              <path d="M285,120 Q310,115 295,140" fill="white" stroke="#ddd" strokeWidth="2" />
              {/* Stripes */}
              <path d="M80,70 Q100,80 80,100" stroke="#E67E22" strokeWidth="8" fill="none" />
              <path d="M60,90 Q80,100 60,120" stroke="#E67E22" strokeWidth="8" fill="none" />
            </svg>
          </div>
          {/* Items flying off */}
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute animate-fly-off-screen"
              style={{
                left: `${20 + c.x * 0.6}%`,
                top: '40%',
                animationDelay: `${0.2 + c.delay}s`,
              }}
            >
              <span className="text-2xl">{['📚', '✏️', '📖', '🎨', '⭐'][c.id % 5]}</span>
            </div>
          ))}
        </>
      )}

      {/* DOG SHAKE - Dog grabs and shakes the page like a toy */}
      {transition === 'dog-shake' && (
        <>
          <div className="absolute inset-0 animate-violent-shake" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 animate-dog-head-shake">
            <svg width="250" height="200" viewBox="0 0 250 200">
              {/* Head */}
              <ellipse cx="125" cy="100" rx="100" ry="80" fill="#D2691E" />
              {/* Snout */}
              <ellipse cx="125" cy="140" rx="50" ry="40" fill="#DEB887" />
              {/* Nose */}
              <ellipse cx="125" cy="120" rx="20" ry="15" fill="#2a2a2a" />
              {/* Eyes */}
              <circle cx="80" cy="80" r="20" fill="white" />
              <circle cx="170" cy="80" r="20" fill="white" />
              <circle cx="85" cy="80" r="12" fill="#2a2a2a" />
              <circle cx="175" cy="80" r="12" fill="#2a2a2a" />
              {/* Excited eyebrows */}
              <path d="M50,55 Q80,45 100,60" stroke="#8B4513" strokeWidth="6" fill="none" />
              <path d="M150,60 Q170,45 200,55" stroke="#8B4513" strokeWidth="6" fill="none" />
              {/* Ears flopping */}
              <ellipse cx="30" cy="60" rx="30" ry="50" fill="#A0522D" className="animate-ear-flop" />
              <ellipse cx="220" cy="60" rx="30" ry="50" fill="#A0522D" className="animate-ear-flop" style={{ animationDelay: '0.1s' }} />
              {/* Tongue */}
              <ellipse cx="125" cy="175" rx="20" ry="30" fill="#FF69B4" className="animate-tongue-wag" />
              {/* Paper in mouth */}
              <rect x="60" y="150" width="130" height="40" fill="white" stroke="#ddd" className="animate-paper-in-mouth" />
            </svg>
          </div>
          {/* Paper pieces flying */}
          {confetti.slice(0, 20).map((c) => (
            <div
              key={c.id}
              className="absolute animate-paper-fly"
              style={{
                left: '50%',
                top: '40%',
                '--end-x': `${(Math.random() - 0.5) * 400}px`,
                '--end-y': `${(Math.random() - 0.5) * 300}px`,
                '--rotation': `${Math.random() * 720}deg`,
                animationDelay: `${0.5 + c.delay}s`,
              } as React.CSSProperties}
            >
              <div
                className="bg-white border border-gray-200"
                style={{ width: c.size, height: c.size * 1.4 }}
              />
            </div>
          ))}
        </>
      )}

      {/* TORNADO SPIN - Everything gets sucked into a tornado */}
      {transition === 'tornado-spin' && (
        <>
          <div className="absolute inset-0 animate-spiral-away" />
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 animate-tornado-grow">
            <svg width="300" height="500" viewBox="0 0 300 500">
              {/* Tornado funnel */}
              <path d="M150,0 Q50,100 80,200 Q30,300 100,400 Q60,450 150,500 Q240,450 200,400 Q270,300 220,200 Q250,100 150,0"
                    fill="url(#tornadoGradient)" className="animate-tornado-spin" />
              <defs>
                <linearGradient id="tornadoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4a5568" />
                  <stop offset="50%" stopColor="#718096" />
                  <stop offset="100%" stopColor="#4a5568" />
                </linearGradient>
              </defs>
              {/* Debris in tornado */}
              <text x="100" y="150" className="animate-debris-spin text-xl">📚</text>
              <text x="180" y="250" className="animate-debris-spin text-xl" style={{ animationDelay: '0.2s' }}>✏️</text>
              <text x="120" y="350" className="animate-debris-spin text-xl" style={{ animationDelay: '0.4s' }}>📖</text>
            </svg>
          </div>
        </>
      )}

      {/* ROCKET CRASH - Rocket crashes through the page */}
      {transition === 'rocket-crash' && (
        <>
          <div className="absolute inset-0 animate-explosion-crack" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 animate-rocket-crash-in">
            <svg width="120" height="200" viewBox="0 0 120 200">
              {/* Rocket body */}
              <ellipse cx="60" cy="100" rx="30" ry="70" fill="#E74C3C" />
              <ellipse cx="60" cy="100" rx="22" ry="60" fill="#C0392B" />
              {/* Nose */}
              <polygon points="60,20 40,70 80,70" fill="#3498DB" />
              {/* Window */}
              <circle cx="60" cy="85" r="15" fill="#85C1E9" />
              {/* Fins */}
              <polygon points="30,140 10,180 40,160" fill="#2ECC71" />
              <polygon points="90,140 110,180 80,160" fill="#2ECC71" />
              {/* Flames */}
              <g className="animate-flames-intense">
                <ellipse cx="60" cy="175" rx="20" ry="30" fill="#F39C12" />
                <ellipse cx="60" cy="185" rx="15" ry="25" fill="#E74C3C" />
                <ellipse cx="60" cy="190" rx="8" ry="15" fill="#F1C40F" />
              </g>
            </svg>
          </div>
          {/* Impact cracks */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 animate-crack-spread">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-black origin-center"
                style={{
                  width: '4px',
                  height: '150px',
                  transform: `rotate(${i * 45}deg)`,
                }}
              />
            ))}
          </div>
          {/* Explosion particles */}
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute animate-explosion-particle"
              style={{
                left: '50%',
                top: '35%',
                '--end-x': `${(Math.random() - 0.5) * 500}px`,
                '--end-y': `${(Math.random() - 0.5) * 400}px`,
                animationDelay: `${0.4 + c.delay * 0.5}s`,
              } as React.CSSProperties}
            >
              <div
                className="rounded-full"
                style={{
                  width: c.size,
                  height: c.size,
                  backgroundColor: c.color,
                }}
              />
            </div>
          ))}
        </>
      )}

      {/* GIANT TONGUE - Frog tongue grabs and pulls page away */}
      {transition === 'giant-tongue' && (
        <>
          <div className="absolute inset-0 animate-pull-down" />
          <div className="absolute -bottom-60 left-1/2 -translate-x-1/2 animate-frog-appear">
            <svg width="300" height="200" viewBox="0 0 300 200">
              {/* Body */}
              <ellipse cx="150" cy="150" rx="130" ry="80" fill="#27AE60" />
              {/* Head */}
              <ellipse cx="150" cy="80" rx="100" ry="70" fill="#2ECC71" />
              {/* Eyes */}
              <circle cx="90" cy="30" r="35" fill="#2ECC71" />
              <circle cx="210" cy="30" r="35" fill="#2ECC71" />
              <circle cx="90" cy="30" r="25" fill="white" />
              <circle cx="210" cy="30" r="25" fill="white" />
              <circle cx="95" cy="30" r="15" fill="#2a2a2a" />
              <circle cx="215" cy="30" r="15" fill="#2a2a2a" />
              {/* Mouth open */}
              <ellipse cx="150" cy="110" rx="60" ry="30" fill="#C0392B" />
            </svg>
          </div>
          {/* Tongue */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-12 animate-tongue-extend origin-bottom">
            <div className="w-full bg-pink-400 rounded-full" style={{ height: '60vh' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-8 bg-pink-400 rounded-full" />
            </div>
          </div>
        </>
      )}

      {/* NINJA SLICE - Ninja sword slices through */}
      {transition === 'ninja-slice' && (
        <>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-slice-fall-top origin-bottom" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white animate-slice-fall-bottom origin-top" />
          </div>
          <div className="absolute -left-40 top-1/2 -translate-y-1/2 animate-ninja-slice">
            <svg width="400" height="60" viewBox="0 0 400 60">
              {/* Blade */}
              <polygon points="0,30 350,25 380,30 350,35" fill="linear-gradient(#e0e0e0, #ffffff, #e0e0e0)" />
              <polygon points="0,30 350,25 380,30 350,35" fill="#C0C0C0" />
              <line x1="0" y1="30" x2="350" y2="30" stroke="white" strokeWidth="2" />
              {/* Handle */}
              <rect x="380" y="20" width="60" height="20" fill="#2a2a2a" rx="3" />
              <rect x="390" y="22" width="5" height="16" fill="#FFD700" />
              <rect x="400" y="22" width="5" height="16" fill="#FFD700" />
            </svg>
          </div>
          {/* Slash effect */}
          <div className="absolute inset-0 animate-slash-flash bg-white" />
          {/* Paper pieces */}
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute animate-slice-piece"
              style={{
                left: `${c.x}%`,
                top: '50%',
                '--end-y': `${c.id % 2 === 0 ? -200 : 200}px`,
                '--rotation': `${(Math.random() - 0.5) * 90}deg`,
                animationDelay: `${0.3 + c.delay * 0.3}s`,
              } as React.CSSProperties}
            >
              <div
                className="bg-white border-t border-gray-300"
                style={{ width: c.size * 2, height: c.size * 3 }}
              />
            </div>
          ))}
        </>
      )}

      {/* Sound effect text */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-sound-effect">
        <p className="text-7xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] comic-text">
          {encouragement}
        </p>
      </div>

      <style jsx>{`
        .comic-text {
          font-family: 'Comic Sans MS', cursive;
          -webkit-text-stroke: 3px #333;
        }

        @keyframes page-shake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-20px) rotate(-1deg); }
          20% { transform: translateX(20px) rotate(1deg); }
          30% { transform: translateX(-15px) rotate(-0.5deg); }
          40% { transform: translateX(15px) rotate(0.5deg); }
          50% { transform: translateX(-10px); }
          60% { transform: translateX(10px); }
        }
        .animate-page-shake {
          animation: page-shake 0.5s ease-in-out;
        }

        @keyframes dino-chomp {
          0% { transform: translateX(0); }
          20% { transform: translateX(-250px); }
          30% { transform: translateX(-250px) rotate(-10deg); }
          40% { transform: translateX(-250px) rotate(5deg); }
          50% { transform: translateX(-250px) rotate(-5deg); }
          70% { transform: translateX(-250px); }
          100% { transform: translateX(100px); }
        }
        .animate-dino-chomp {
          animation: dino-chomp 2s ease-in-out forwards;
        }

        @keyframes bite-reveal {
          0%, 40% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 1; }
        }
        .animate-bite-reveal {
          animation: bite-reveal 2s ease-out forwards;
        }

        @keyframes jaw {
          0%, 25%, 50%, 75%, 100% { transform: translateY(0); }
          12%, 37%, 62% { transform: translateY(15px); }
        }
        .animate-jaw {
          animation: jaw 0.6s ease-in-out infinite;
        }

        @keyframes crumb-fly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--end-x), var(--end-y)) scale(0.5); opacity: 0; }
        }
        .animate-crumb-fly {
          animation: crumb-fly 1s ease-out forwards;
        }

        @keyframes monster-grab {
          0% { transform: translateX(-50%) translateY(100%); }
          30% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-50px); }
          100% { transform: translateX(-50%) translateY(150%); }
        }
        .animate-monster-grab {
          animation: monster-grab 2s ease-in-out forwards;
        }

        @keyframes finger-curl {
          0%, 30% { transform: rotate(0); }
          50% { transform: rotate(30deg); }
          100% { transform: rotate(30deg); }
        }
        .animate-finger-curl {
          animation: finger-curl 1.5s ease-in-out forwards;
        }

        @keyframes page-crumple {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.8) rotate(5deg); opacity: 0.8; }
          100% { transform: scale(0.3) translateY(100%); opacity: 0; }
        }
        .animate-page-crumple {
          animation: page-crumple 2s ease-in forwards;
        }

        @keyframes cat-swipe {
          0% { transform: translateX(0); }
          30% { transform: translateX(calc(100vw + 100px)); }
          100% { transform: translateX(calc(100vw + 200px)); }
        }
        .animate-cat-swipe {
          animation: cat-swipe 1s ease-out forwards;
        }

        @keyframes slide-off-right {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%) rotate(15deg); opacity: 0; }
        }
        .animate-slide-off-right {
          animation: slide-off-right 0.8s ease-in forwards;
          animation-delay: 0.2s;
        }

        @keyframes fly-off-screen {
          0% { transform: translateX(0) rotate(0); opacity: 1; }
          100% { transform: translateX(200px) translateY(-100px) rotate(360deg); opacity: 0; }
        }
        .animate-fly-off-screen {
          animation: fly-off-screen 0.8s ease-out forwards;
        }

        @keyframes dog-head-shake {
          0%, 100% { transform: translateX(-50%) rotate(0); }
          10% { transform: translateX(-50%) rotate(20deg); }
          20% { transform: translateX(-50%) rotate(-20deg); }
          30% { transform: translateX(-50%) rotate(15deg); }
          40% { transform: translateX(-50%) rotate(-15deg); }
          50% { transform: translateX(-50%) rotate(10deg); }
          60% { transform: translateX(-50%) rotate(-10deg); }
          70% { transform: translateX(-50%) rotate(5deg); }
          80% { transform: translateX(-50%) rotate(-5deg); }
        }
        .animate-dog-head-shake {
          animation: dog-head-shake 1.5s ease-in-out forwards;
        }

        @keyframes violent-shake {
          0%, 100% { transform: translate(0, 0) rotate(0); }
          10% { transform: translate(-30px, 10px) rotate(-5deg); }
          20% { transform: translate(30px, -10px) rotate(5deg); }
          30% { transform: translate(-25px, 15px) rotate(-3deg); }
          40% { transform: translate(25px, -15px) rotate(3deg); }
          50% { transform: translate(-20px, 10px) rotate(-2deg); }
          60% { transform: translate(20px, -10px) rotate(2deg); }
        }
        .animate-violent-shake {
          animation: violent-shake 1s ease-in-out;
        }

        @keyframes ear-flop {
          0%, 100% { transform: rotate(0); }
          50% { transform: rotate(30deg); }
        }
        .animate-ear-flop {
          animation: ear-flop 0.15s ease-in-out infinite;
          transform-origin: bottom center;
        }

        @keyframes tongue-wag {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .animate-tongue-wag {
          animation: tongue-wag 0.1s ease-in-out infinite;
        }

        @keyframes paper-in-mouth {
          0%, 100% { transform: rotate(0); }
          50% { transform: rotate(5deg); }
        }
        .animate-paper-in-mouth {
          animation: paper-in-mouth 0.15s ease-in-out infinite;
        }

        @keyframes paper-fly {
          0% { transform: translate(-50%, -50%) rotate(0) scale(1); opacity: 1; }
          100% {
            transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y)))
                       rotate(var(--rotation)) scale(0.5);
            opacity: 0;
          }
        }
        .animate-paper-fly {
          animation: paper-fly 1s ease-out forwards;
        }

        @keyframes tornado-grow {
          0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
          30% { transform: translateX(-50%) scaleY(1); opacity: 1; }
          100% { transform: translateX(-50%) scaleY(1.2); opacity: 1; }
        }
        .animate-tornado-grow {
          animation: tornado-grow 1.5s ease-out forwards;
          transform-origin: bottom center;
        }

        @keyframes tornado-spin {
          from { transform: rotate(0); }
          to { transform: rotate(360deg); }
        }
        .animate-tornado-spin {
          animation: tornado-spin 0.5s linear infinite;
          transform-origin: center center;
        }

        @keyframes spiral-away {
          0% { transform: scale(1) rotate(0); opacity: 1; }
          100% { transform: scale(0) rotate(720deg); opacity: 0; }
        }
        .animate-spiral-away {
          animation: spiral-away 1.5s ease-in forwards;
          animation-delay: 0.3s;
        }

        @keyframes debris-spin {
          from { transform: rotate(0) translateX(30px); }
          to { transform: rotate(360deg) translateX(30px); }
        }
        .animate-debris-spin {
          animation: debris-spin 0.3s linear infinite;
          transform-origin: -30px center;
        }

        @keyframes rocket-crash-in {
          0% { transform: translateX(-50%) translateY(0) rotate(180deg); }
          40% { transform: translateX(-50%) translateY(calc(50vh + 100px)) rotate(180deg); }
          45% { transform: translateX(-50%) translateY(calc(50vh + 80px)) rotate(175deg); }
          100% { transform: translateX(-50%) translateY(calc(50vh + 80px)) rotate(175deg); }
        }
        .animate-rocket-crash-in {
          animation: rocket-crash-in 1s ease-in forwards;
        }

        @keyframes explosion-crack {
          0%, 40% { background: white; }
          45% { background: #ff6b6b; }
          50% { background: white; }
          55% { background: #ff6b6b; }
          60% { background: transparent; }
        }
        .animate-explosion-crack {
          animation: explosion-crack 1s ease-out forwards;
        }

        @keyframes crack-spread {
          0% { transform: translateX(-50%) scale(0); opacity: 0; }
          40% { transform: translateX(-50%) scale(0); opacity: 0; }
          50% { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(2); opacity: 0; }
        }
        .animate-crack-spread {
          animation: crack-spread 1.5s ease-out forwards;
        }

        @keyframes flames-intense {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          25% { transform: scaleY(1.3) scaleX(0.9); }
          50% { transform: scaleY(0.9) scaleX(1.1); }
          75% { transform: scaleY(1.2) scaleX(0.95); }
        }
        .animate-flames-intense {
          animation: flames-intense 0.1s ease-in-out infinite;
          transform-origin: center top;
        }

        @keyframes explosion-particle {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% {
            transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(1);
            opacity: 0;
          }
        }
        .animate-explosion-particle {
          animation: explosion-particle 0.8s ease-out forwards;
        }

        @keyframes frog-appear {
          0% { transform: translateX(-50%) translateY(100%); }
          40% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        .animate-frog-appear {
          animation: frog-appear 0.8s ease-out forwards;
        }

        @keyframes tongue-extend {
          0% { transform: scaleY(0); }
          30% { transform: scaleY(1); }
          60% { transform: scaleY(1); }
          100% { transform: scaleY(0); }
        }
        .animate-tongue-extend {
          animation: tongue-extend 2s ease-in-out forwards;
        }

        @keyframes pull-down {
          0%, 30% { transform: translateY(0); opacity: 1; }
          60% { transform: translateY(20px); opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .animate-pull-down {
          animation: pull-down 2s ease-in forwards;
        }

        @keyframes ninja-slice {
          0% { transform: translateY(-50%) translateX(0); }
          30% { transform: translateY(-50%) translateX(calc(100vw + 200px)); }
          100% { transform: translateY(-50%) translateX(calc(100vw + 400px)); }
        }
        .animate-ninja-slice {
          animation: ninja-slice 0.6s ease-out forwards;
        }

        @keyframes slice-fall-top {
          0%, 30% { transform: rotate(0); }
          100% { transform: rotate(-10deg) translateY(-50px); opacity: 0; }
        }
        .animate-slice-fall-top {
          animation: slice-fall-top 1s ease-in forwards;
          animation-delay: 0.3s;
        }

        @keyframes slice-fall-bottom {
          0%, 30% { transform: rotate(0); }
          100% { transform: rotate(10deg) translateY(50px); opacity: 0; }
        }
        .animate-slice-fall-bottom {
          animation: slice-fall-bottom 1s ease-in forwards;
          animation-delay: 0.3s;
        }

        @keyframes slash-flash {
          0%, 25% { opacity: 0; }
          30% { opacity: 1; }
          35% { opacity: 0; }
          100% { opacity: 0; }
        }
        .animate-slash-flash {
          animation: slash-flash 0.6s ease-out forwards;
        }

        @keyframes slice-piece {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% {
            transform: translateY(var(--end-y)) rotate(var(--rotation));
            opacity: 0;
          }
        }
        .animate-slice-piece {
          animation: slice-piece 1s ease-out forwards;
        }

        @keyframes sound-effect {
          0% { transform: translate(-50%, -50%) scale(0) rotate(-10deg); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.3) rotate(5deg); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
          80% { transform: translate(-50%, -50%) scale(1.1) rotate(-3deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0) rotate(10deg); opacity: 0; }
        }
        .animate-sound-effect {
          animation: sound-effect 1.5s ease-out forwards;
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
}
