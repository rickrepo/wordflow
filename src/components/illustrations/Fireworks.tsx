'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  size: number;
  delay: number;
}

interface Firework {
  id: number;
  x: number;
  y: number;
  color: string;
  particles: Particle[];
}

const colors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Coral
  '#AA96DA', // Purple
  '#FCBAD3', // Pink
  '#A8D8EA', // Light blue
];

function generateParticles(x: number, y: number, color: string): Particle[] {
  const particles: Particle[] = [];
  const particleCount = 12;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      id: i,
      x,
      y,
      color,
      angle: (360 / particleCount) * i,
      speed: 80 + Math.random() * 40,
      size: 4 + Math.random() * 4,
      delay: Math.random() * 0.1,
    });
  }

  return particles;
}

export default function Fireworks({ show }: { show: boolean }) {
  const [fireworks, setFireworks] = useState<Firework[]>([]);

  useEffect(() => {
    if (!show) {
      setFireworks([]);
      return;
    }

    // Generate initial fireworks
    const initialFireworks: Firework[] = [];
    const positions = [
      { x: 20, y: 30 },
      { x: 80, y: 25 },
      { x: 50, y: 20 },
      { x: 30, y: 40 },
      { x: 70, y: 35 },
    ];

    positions.forEach((pos, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      initialFireworks.push({
        id: i,
        x: pos.x,
        y: pos.y,
        color,
        particles: generateParticles(pos.x, pos.y, color),
      });
    });

    setFireworks(initialFireworks);

    // Add more fireworks over time
    const interval = setInterval(() => {
      const x = 15 + Math.random() * 70;
      const y = 15 + Math.random() * 35;
      const color = colors[Math.floor(Math.random() * colors.length)];

      setFireworks(prev => [
        ...prev.slice(-8), // Keep last 8 fireworks
        {
          id: Date.now(),
          x,
          y,
          color,
          particles: generateParticles(x, y, color),
        },
      ]);
    }, 600);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {fireworks.map(firework => (
        <div
          key={firework.id}
          className="absolute"
          style={{
            left: `${firework.x}%`,
            top: `${firework.y}%`,
          }}
        >
          {firework.particles.map(particle => (
            <div
              key={particle.id}
              className="absolute rounded-full animate-firework-particle"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                '--angle': `${particle.angle}deg`,
                '--speed': `${particle.speed}px`,
                animationDelay: `${particle.delay}s`,
              } as React.CSSProperties}
            />
          ))}

          {/* Central burst */}
          <div
            className="absolute w-4 h-4 rounded-full animate-firework-burst"
            style={{
              backgroundColor: firework.color,
              boxShadow: `0 0 20px ${firework.color}, 0 0 40px ${firework.color}`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      ))}

      {/* Sparkle effects */}
      {show && (
        <>
          <div className="absolute top-[15%] left-[25%] text-2xl animate-twinkle">✨</div>
          <div className="absolute top-[25%] right-[20%] text-3xl animate-twinkle" style={{ animationDelay: '0.3s' }}>✨</div>
          <div className="absolute top-[35%] left-[15%] text-xl animate-twinkle" style={{ animationDelay: '0.6s' }}>✨</div>
          <div className="absolute top-[20%] right-[35%] text-2xl animate-twinkle" style={{ animationDelay: '0.9s' }}>✨</div>
          <div className="absolute top-[40%] left-[40%] text-xl animate-twinkle" style={{ animationDelay: '1.2s' }}>✨</div>
        </>
      )}

      <style jsx>{`
        @keyframes firework-particle {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(var(--speed));
            opacity: 0;
          }
        }

        @keyframes firework-burst {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }

        .animate-firework-particle {
          animation: firework-particle 1s ease-out forwards;
        }

        .animate-firework-burst {
          animation: firework-burst 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
