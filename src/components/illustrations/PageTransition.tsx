'use client';

import { useEffect, useState, useMemo } from 'react';

interface PageTransitionProps {
  show: boolean;
  storyId: string;
  onComplete: () => void;
}

type TransitionType =
  | 'rocket-blast'
  | 'rainbow-sweep'
  | 'star-explosion'
  | 'balloon-float'
  | 'confetti-burst'
  | 'magic-sparkle'
  | 'bubble-pop'
  | 'lightning-flash';

// Pool of exciting transitions to randomly pick from
const transitionPool: TransitionType[] = [
  'rocket-blast',
  'rainbow-sweep',
  'star-explosion',
  'balloon-float',
  'confetti-burst',
  'magic-sparkle',
  'bubble-pop',
  'lightning-flash',
];

// Generate random positions for particles
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 0.5,
    size: 20 + Math.random() * 30,
    rotation: Math.random() * 360,
    color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'][Math.floor(Math.random() * 7)],
  }));
}

export default function PageTransition({ show, storyId, onComplete }: PageTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);

  // Pick a random transition each time show becomes true
  const transition = useMemo(() => {
    return transitionPool[Math.floor(Math.random() * transitionPool.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionKey]);

  const particles = useMemo(() => generateParticles(20), [transitionKey]);
  const confetti = useMemo(() => generateParticles(40), [transitionKey]);
  const stars = useMemo(() => generateParticles(15), [transitionKey]);

  useEffect(() => {
    if (show) {
      setTransitionKey(prev => prev + 1);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || !isAnimating) return null;

  const encouragements = ['Great!', 'Awesome!', 'Amazing!', 'Wow!', 'Super!', 'Fantastic!', 'Yes!', 'Woohoo!'];
  const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Background flash */}
      <div className="absolute inset-0 animate-flash-bg" />

      {/* Rocket Blast */}
      {transition === 'rocket-blast' && (
        <>
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 animate-rocket-launch">
            <svg width="80" height="120" viewBox="0 0 80 120">
              <ellipse cx="40" cy="50" rx="20" ry="40" fill="#E74C3C" />
              <ellipse cx="40" cy="50" rx="15" ry="35" fill="#C0392B" />
              <polygon points="40,5 25,45 55,45" fill="#3498DB" />
              <circle cx="40" cy="45" r="10" fill="#85C1E9" />
              <circle cx="40" cy="45" r="6" fill="#AED6F1" />
              <polygon points="20,80 5,100 25,85" fill="#2ECC71" />
              <polygon points="60,80 75,100 55,85" fill="#2ECC71" />
              <g className="animate-flames">
                <ellipse cx="40" cy="100" rx="12" ry="20" fill="#F39C12" />
                <ellipse cx="40" cy="105" rx="8" ry="15" fill="#E74C3C" />
                <ellipse cx="40" cy="108" rx="4" ry="10" fill="#F1C40F" />
              </g>
            </svg>
          </div>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 bottom-20 -translate-x-1/2 animate-smoke-puff"
              style={{
                animationDelay: `${i * 0.1}s`,
                left: `calc(50% + ${(Math.random() - 0.5) * 60}px)`,
              }}
            >
              <div className="w-16 h-16 bg-gray-300 rounded-full opacity-60" />
            </div>
          ))}
        </>
      )}

      {/* Rainbow Sweep */}
      {transition === 'rainbow-sweep' && (
        <div className="absolute inset-0">
          {['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#AA96DA', '#FCBAD3'].map((color, i) => (
            <div
              key={i}
              className="absolute h-full animate-rainbow-bar"
              style={{
                backgroundColor: color,
                width: '20%',
                left: `${i * 20}%`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl animate-rainbow-emoji">
            🌈
          </div>
        </div>
      )}

      {/* Star Explosion */}
      {transition === 'star-explosion' && (
        <>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-center-burst">
            <span className="text-9xl">⭐</span>
          </div>
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute text-4xl animate-star-fly"
              style={{
                left: '50%',
                top: '50%',
                '--end-x': `${(star.x - 50) * 4}px`,
                '--end-y': `${(star.y - 50) * 4}px`,
                animationDelay: `${star.delay}s`,
              } as React.CSSProperties}
            >
              {['⭐', '🌟', '✨'][star.id % 3]}
            </div>
          ))}
        </>
      )}

      {/* Balloon Float */}
      {transition === 'balloon-float' && (
        <>
          {particles.slice(0, 12).map((p, i) => (
            <div
              key={p.id}
              className="absolute animate-balloon-rise"
              style={{
                left: `${8 + i * 8}%`,
                bottom: '-100px',
                animationDelay: `${p.delay}s`,
              }}
            >
              <svg width="50" height="70" viewBox="0 0 50 70">
                <ellipse cx="25" cy="25" rx="20" ry="25" fill={p.color} />
                <polygon points="25,50 20,55 30,55" fill={p.color} />
                <path d="M25 55 Q 23 62 25 70" stroke="#888" strokeWidth="1" fill="none" />
              </svg>
            </div>
          ))}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl animate-float-bounce">
            🎈
          </div>
        </>
      )}

      {/* Confetti Burst */}
      {transition === 'confetti-burst' && (
        <>
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute animate-confetti-fall"
              style={{
                left: `${c.x}%`,
                top: '-20px',
                animationDelay: `${c.delay}s`,
              }}
            >
              <div
                className="animate-confetti-spin"
                style={{
                  width: `${c.size / 3}px`,
                  height: `${c.size}px`,
                  backgroundColor: c.color,
                  borderRadius: '2px',
                }}
              />
            </div>
          ))}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl animate-party-pop">
            🎉
          </div>
        </>
      )}

      {/* Magic Sparkle */}
      {transition === 'magic-sparkle' && (
        <>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-wand-wave">
            <span className="text-8xl">🪄</span>
          </div>
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute animate-sparkle-appear"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animationDelay: `${p.delay + 0.3}s`,
              }}
            >
              <span className="text-3xl">✨</span>
            </div>
          ))}
          <div className="absolute inset-0 animate-magic-glow" />
        </>
      )}

      {/* Bubble Pop */}
      {transition === 'bubble-pop' && (
        <>
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute animate-bubble-float"
              style={{
                left: `${p.x}%`,
                bottom: '-50px',
                animationDelay: `${p.delay}s`,
              }}
            >
              <div
                className="rounded-full border-4 border-blue-300 bg-blue-100/30 animate-bubble-wobble"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                }}
              />
            </div>
          ))}
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-7xl animate-bubble-pop-center">
            🫧
          </div>
        </>
      )}

      {/* Lightning Flash */}
      {transition === 'lightning-flash' && (
        <>
          <div className="absolute inset-0 animate-lightning-flash bg-yellow-100" />
          <div className="absolute left-1/2 top-1/4 -translate-x-1/2 animate-lightning-bolt">
            <svg width="100" height="200" viewBox="0 0 100 200">
              <polygon
                points="60,0 35,80 55,80 25,200 70,100 50,100 80,0"
                fill="#F1C40F"
                stroke="#E67E22"
                strokeWidth="3"
              />
            </svg>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl animate-zap-emoji">
            ⚡
          </div>
        </>
      )}

      {/* Encouraging text */}
      <div className="absolute left-1/2 bottom-1/4 -translate-x-1/2 text-center animate-text-pop">
        <p className="text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {encouragement}
        </p>
      </div>

      <style jsx>{`
        @keyframes flash-bg {
          0% { background: transparent; }
          10% { background: rgba(255,255,255,0.8); }
          100% { background: transparent; }
        }
        .animate-flash-bg {
          animation: flash-bg 0.4s ease-out;
        }

        @keyframes rocket-launch {
          0% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(-150vh) rotate(5deg); }
        }
        .animate-rocket-launch {
          animation: rocket-launch 1.5s ease-in forwards;
        }

        @keyframes smoke-puff {
          0% { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 0.8; }
          100% { transform: translateX(-50%) translateY(100px) scale(2); opacity: 0; }
        }
        .animate-smoke-puff {
          animation: smoke-puff 1s ease-out forwards;
        }

        @keyframes rainbow-bar {
          0% { transform: translateY(100%); }
          30% { transform: translateY(0); }
          70% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
        .animate-rainbow-bar {
          animation: rainbow-bar 1.5s ease-in-out forwards;
        }

        @keyframes rainbow-emoji {
          0% { transform: translate(-50%, -50%) scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2) rotate(0deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-rainbow-emoji {
          animation: rainbow-emoji 0.8s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }

        @keyframes center-burst {
          0% { transform: translate(-50%, -50%) scale(0); }
          50% { transform: translate(-50%, -50%) scale(1.5); }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        }
        .animate-center-burst {
          animation: center-burst 0.8s ease-out forwards;
        }

        @keyframes star-fly {
          0% { transform: translate(-50%, -50%) scale(0); }
          30% { transform: translate(-50%, -50%) scale(1); }
          100% {
            transform: translate(
              calc(-50% + var(--end-x)),
              calc(-50% + var(--end-y))
            ) scale(0);
          }
        }
        .animate-star-fly {
          animation: star-fly 1.2s ease-out forwards;
        }

        @keyframes balloon-rise {
          0% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-60vh) rotate(5deg); }
          100% { transform: translateY(-120vh) rotate(-3deg); }
        }
        .animate-balloon-rise {
          animation: balloon-rise 2s ease-out forwards;
        }

        @keyframes float-bounce {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -60%) scale(1.1); }
        }
        .animate-float-bounce {
          animation: float-bounce 0.5s ease-in-out infinite;
        }

        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(120vh) rotate(720deg); }
        }
        .animate-confetti-fall {
          animation: confetti-fall 2s ease-in forwards;
        }

        @keyframes confetti-spin {
          0% { transform: rotateY(0deg) rotateX(0deg); }
          100% { transform: rotateY(720deg) rotateX(360deg); }
        }
        .animate-confetti-spin {
          animation: confetti-spin 1s linear infinite;
        }

        @keyframes party-pop {
          0% { transform: translate(-50%, -50%) scale(0) rotate(-30deg); }
          50% { transform: translate(-50%, -50%) scale(1.3) rotate(10deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        }
        .animate-party-pop {
          animation: party-pop 0.6s ease-out forwards;
        }

        @keyframes wand-wave {
          0% { transform: translate(-50%, -50%) rotate(-30deg); }
          25% { transform: translate(-50%, -50%) rotate(30deg); }
          50% { transform: translate(-50%, -50%) rotate(-20deg); }
          75% { transform: translate(-50%, -50%) rotate(20deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
        .animate-wand-wave {
          animation: wand-wave 0.8s ease-in-out;
        }

        @keyframes sparkle-appear {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
        .animate-sparkle-appear {
          animation: sparkle-appear 0.8s ease-out forwards;
        }

        @keyframes magic-glow {
          0% { background: radial-gradient(circle at center, rgba(168,85,247,0) 0%, transparent 50%); }
          50% { background: radial-gradient(circle at center, rgba(168,85,247,0.3) 0%, transparent 70%); }
          100% { background: radial-gradient(circle at center, rgba(168,85,247,0) 0%, transparent 50%); }
        }
        .animate-magic-glow {
          animation: magic-glow 1s ease-in-out;
        }

        @keyframes bubble-float {
          0% { transform: translateY(0) scale(0.8); }
          50% { transform: translateY(-50vh) scale(1); }
          100% { transform: translateY(-120vh) scale(0.5); opacity: 0; }
        }
        .animate-bubble-float {
          animation: bubble-float 2s ease-out forwards;
        }

        @keyframes bubble-wobble {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1, 0.9) rotate(5deg); }
          75% { transform: scale(0.9, 1.1) rotate(-5deg); }
        }
        .animate-bubble-wobble {
          animation: bubble-wobble 0.5s ease-in-out infinite;
        }

        @keyframes bubble-pop-center {
          0% { transform: translateX(-50%) scale(0); opacity: 0; }
          30% { transform: translateX(-50%) scale(1.2); opacity: 1; }
          50% { transform: translateX(-50%) scale(1.5); opacity: 1; }
          60% { transform: translateX(-50%) scale(2); opacity: 0.5; }
          100% { transform: translateX(-50%) scale(0); opacity: 0; }
        }
        .animate-bubble-pop-center {
          animation: bubble-pop-center 1.2s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }

        @keyframes lightning-flash {
          0%, 100% { opacity: 0; }
          5%, 15%, 25% { opacity: 0.9; }
          10%, 20% { opacity: 0.3; }
        }
        .animate-lightning-flash {
          animation: lightning-flash 0.6s ease-out;
        }

        @keyframes lightning-bolt {
          0% { transform: translateX(-50%) translateY(-100px) scale(0); opacity: 0; }
          20% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
          80% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) translateY(50px) scale(0); opacity: 0; }
        }
        .animate-lightning-bolt {
          animation: lightning-bolt 1s ease-out forwards;
        }

        @keyframes zap-emoji {
          0% { transform: translate(-50%, -50%) scale(0) rotate(-45deg); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.5) rotate(15deg); opacity: 1; }
          60% { transform: translate(-50%, -50%) scale(1.2) rotate(-10deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-zap-emoji {
          animation: zap-emoji 0.8s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }

        @keyframes text-pop {
          0% { transform: translateX(-50%) scale(0); opacity: 0; }
          50% { transform: translateX(-50%) scale(1.3); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        .animate-text-pop {
          animation: text-pop 0.5s ease-out forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
