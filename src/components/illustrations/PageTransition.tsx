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
  | 'giant-tongue';

// Kid-friendly animal transitions only
const transitionPool: TransitionType[] = [
  'dinosaur-bite',
  'monster-grab',
  'cat-swipe',
  'dog-shake',
  'giant-tongue',
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
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Semi-transparent overlay that dims the scene slightly during transition */}
      <div className="absolute inset-0 bg-black/10 animate-flash-dim" />

      {/* DINOSAUR BITE - A T-Rex head comes in and chomps at the text area */}
      {transition === 'dinosaur-bite' && (
        <>
          {/* Bite mark overlay - semi-transparent to show scene through */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 animate-bite-reveal">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path
                d="M200,0 L200,200 L0,200 L0,150 Q30,140 40,120 Q50,100 40,80 Q30,60 50,40 Q70,20 60,0 Z"
                fill="rgba(0,0,0,0.3)"
              />
            </svg>
          </div>
          {/* T-Rex head */}
          <div className="absolute -right-40 top-1/4 animate-dino-chomp drop-shadow-2xl">
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
          {/* Paper/text crumbs flying from the "bite" */}
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
                className="rounded-sm bg-white/80 shadow-md"
                style={{ width: c.size, height: c.size }}
              />
            </div>
          ))}
        </>
      )}

      {/* MONSTER GRAB - Giant furry hand reaches in and grabs */}
      {transition === 'monster-grab' && (
        <>
          {/* Claw scratch marks on screen */}
          <div className="absolute inset-0 animate-scratch-marks pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <path d="M20,10 Q25,50 30,90" stroke="rgba(0,0,0,0.2)" strokeWidth="3" fill="none" className="animate-scratch-line" />
              <path d="M40,5 Q45,50 50,95" stroke="rgba(0,0,0,0.25)" strokeWidth="4" fill="none" className="animate-scratch-line" style={{ animationDelay: '0.1s' }} />
              <path d="M60,8 Q65,50 70,92" stroke="rgba(0,0,0,0.2)" strokeWidth="3" fill="none" className="animate-scratch-line" style={{ animationDelay: '0.2s' }} />
            </svg>
          </div>
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 animate-monster-grab drop-shadow-2xl">
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

      {/* CAT SWIPE - Cat paw swipes across and bats at the text */}
      {transition === 'cat-swipe' && (
        <>
          <div className="absolute -left-40 top-1/3 animate-cat-swipe drop-shadow-2xl">
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
          {/* Items being batted around */}
          {confetti.slice(0, 8).map((c) => (
            <div
              key={c.id}
              className="absolute animate-fly-off-screen"
              style={{
                left: `${20 + c.x * 0.6}%`,
                top: '40%',
                animationDelay: `${0.2 + c.delay}s`,
              }}
            >
              <span className="text-3xl drop-shadow-lg">{['📚', '✏️', '📖', '🎨', '⭐', '✨', '💫', '🌟'][c.id % 8]}</span>
            </div>
          ))}
        </>
      )}

      {/* DOG SHAKE - Dog head appears shaking with excitement */}
      {transition === 'dog-shake' && (
        <>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 animate-dog-head-shake drop-shadow-2xl">
            <svg width="250" height="200" viewBox="0 0 250 200">
              {/* Head */}
              <ellipse cx="125" cy="100" rx="100" ry="80" fill="#D2691E" />
              {/* Snout */}
              <ellipse cx="125" cy="140" rx="50" ry="40" fill="#DEB887" />
              {/* Nose */}
              <ellipse cx="125" cy="120" rx="20" ry="15" fill="#2a2a2a" />
              {/* Tongue hanging out in excitement */}
              <ellipse cx="125" cy="175" rx="20" ry="30" fill="#FF69B4" className="animate-tongue-wag" />
              {/* Eyes - excited! */}
              <circle cx="80" cy="80" r="20" fill="white" />
              <circle cx="170" cy="80" r="20" fill="white" />
              <circle cx="85" cy="80" r="12" fill="#2a2a2a" />
              <circle cx="175" cy="80" r="12" fill="#2a2a2a" />
              {/* Sparkle in eyes */}
              <circle cx="88" cy="76" r="4" fill="white" />
              <circle cx="178" cy="76" r="4" fill="white" />
              {/* Excited eyebrows */}
              <path d="M50,55 Q80,45 100,60" stroke="#8B4513" strokeWidth="6" fill="none" />
              <path d="M150,60 Q170,45 200,55" stroke="#8B4513" strokeWidth="6" fill="none" />
              {/* Ears flopping */}
              <ellipse cx="30" cy="60" rx="30" ry="50" fill="#A0522D" className="animate-ear-flop" />
              <ellipse cx="220" cy="60" rx="30" ry="50" fill="#A0522D" className="animate-ear-flop" style={{ animationDelay: '0.1s' }} />
            </svg>
          </div>
          {/* Drool/slobber drops */}
          {confetti.slice(0, 6).map((c) => (
            <div
              key={c.id}
              className="absolute animate-drip-fall"
              style={{
                left: `calc(50% + ${(c.id - 3) * 15}px)`,
                top: '55%',
                animationDelay: `${0.5 + c.delay}s`,
              }}
            >
              <div className="w-3 h-4 bg-blue-200/70 rounded-full" />
            </div>
          ))}
        </>
      )}


      {/* GIANT TONGUE - Frog peeks up and tongue zaps out */}
      {transition === 'giant-tongue' && (
        <>
          {/* Tongue zapping across screen */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-8 animate-tongue-extend origin-bottom">
            <div className="w-full bg-pink-400 rounded-t-full" style={{ height: '50vh' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 bg-pink-400 rounded-full" />
            </div>
          </div>
          {/* Frog peeking from bottom */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 animate-frog-appear drop-shadow-2xl">
            <svg width="250" height="150" viewBox="0 0 250 150">
              {/* Head */}
              <ellipse cx="125" cy="100" rx="100" ry="60" fill="#2ECC71" />
              {/* Eyes - big and bulging */}
              <circle cx="70" cy="30" r="40" fill="#2ECC71" />
              <circle cx="180" cy="30" r="40" fill="#2ECC71" />
              <circle cx="70" cy="30" r="30" fill="white" />
              <circle cx="180" cy="30" r="30" fill="white" />
              <circle cx="75" cy="30" r="18" fill="#2a2a2a" />
              <circle cx="185" cy="30" r="18" fill="#2a2a2a" />
              <circle cx="80" cy="25" r="6" fill="white" />
              <circle cx="190" cy="25" r="6" fill="white" />
              {/* Mouth open */}
              <ellipse cx="125" cy="110" rx="50" ry="25" fill="#C0392B" />
            </svg>
          </div>
        </>
      )}


      <style jsx>{`
        @keyframes flash-dim {
          0% { opacity: 0; }
          10% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash-dim { animation: flash-dim 1.5s ease-out forwards; }

        @keyframes dino-chomp {
          0% { transform: translateX(0); }
          25% { transform: translateX(-250px); }
          35% { transform: translateX(-250px) rotate(-8deg); }
          45% { transform: translateX(-250px) rotate(5deg); }
          65% { transform: translateX(-250px); }
          100% { transform: translateX(100px); }
        }
        .animate-dino-chomp { animation: dino-chomp 1.4s ease-in-out forwards; }

        @keyframes bite-reveal {
          0%, 30% { opacity: 0; }
          40% { opacity: 1; }
          100% { opacity: 1; }
        }
        .animate-bite-reveal { animation: bite-reveal 1.4s ease-out forwards; }

        @keyframes jaw {
          0%, 25%, 50%, 75%, 100% { transform: translateY(0); }
          12%, 37%, 62% { transform: translateY(15px); }
        }
        .animate-jaw { animation: jaw 0.6s ease-in-out infinite; }

        @keyframes crumb-fly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--end-x), var(--end-y)) scale(0.5); opacity: 0; }
        }
        .animate-crumb-fly { animation: crumb-fly 0.8s ease-out forwards; }

        @keyframes monster-grab {
          0% { transform: translateX(-50%) translateY(100%); }
          35% { transform: translateX(-50%) translateY(20%); }
          55% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(150%); }
        }
        .animate-monster-grab { animation: monster-grab 1.4s ease-in-out forwards; }

        @keyframes finger-curl {
          0%, 30% { transform: rotate(0); }
          50% { transform: rotate(30deg); }
          100% { transform: rotate(30deg); }
        }
        .animate-finger-curl { animation: finger-curl 1s ease-in-out forwards; }

        @keyframes scratch-line {
          0% { stroke-dashoffset: 200; opacity: 0; }
          30% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.3; }
        }
        .animate-scratch-line { stroke-dasharray: 200; animation: scratch-line 0.6s ease-out forwards; }

        @keyframes scratch-marks {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-scratch-marks { animation: scratch-marks 1.4s ease-out forwards; }

        @keyframes cat-swipe {
          0% { transform: translateX(0); }
          40% { transform: translateX(calc(100vw + 100px)); }
          100% { transform: translateX(calc(100vw + 200px)); }
        }
        .animate-cat-swipe { animation: cat-swipe 0.8s ease-out forwards; }

        @keyframes fly-off-screen {
          0% { transform: translateX(0) rotate(0); opacity: 1; }
          100% { transform: translateX(300px) translateY(-150px) rotate(540deg); opacity: 0; }
        }
        .animate-fly-off-screen { animation: fly-off-screen 0.8s ease-out forwards; }

        @keyframes dog-head-shake {
          0%, 100% { transform: translateX(-50%) rotate(0); }
          12% { transform: translateX(-50%) rotate(18deg); }
          25% { transform: translateX(-50%) rotate(-18deg); }
          37% { transform: translateX(-50%) rotate(12deg); }
          50% { transform: translateX(-50%) rotate(-12deg); }
          62% { transform: translateX(-50%) rotate(6deg); }
          75% { transform: translateX(-50%) rotate(-6deg); }
        }
        .animate-dog-head-shake { animation: dog-head-shake 1.2s ease-in-out forwards; }

        @keyframes ear-flop {
          0%, 100% { transform: rotate(0); }
          50% { transform: rotate(30deg); }
        }
        .animate-ear-flop { animation: ear-flop 0.15s ease-in-out infinite; transform-origin: bottom center; }

        @keyframes tongue-wag {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .animate-tongue-wag { animation: tongue-wag 0.1s ease-in-out infinite; }

        @keyframes drip-fall {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(200px) scale(0.5); opacity: 0; }
        }
        .animate-drip-fall { animation: drip-fall 0.8s ease-in forwards; }

        @keyframes frog-appear {
          0% { transform: translateX(-50%) translateY(100%); }
          30% { transform: translateX(-50%) translateY(0); }
          75% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(100%); }
        }
        .animate-frog-appear { animation: frog-appear 1.4s ease-out forwards; }

        @keyframes tongue-extend {
          0% { transform: scaleY(0); }
          20% { transform: scaleY(1); }
          30% { transform: scaleY(1.1); }
          70% { transform: scaleY(1); }
          100% { transform: scaleY(0); }
        }
        .animate-tongue-extend { animation: tongue-extend 1.4s ease-in-out forwards; }
      `}</style>
    </div>
  );
}
