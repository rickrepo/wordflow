'use client';

import { useState } from 'react';

interface BackgroundCharacterProps {
  storyId: string;
}

// Map story IDs to their character type
function getCharacterForStory(storyId: string): string {
  const storyCharacterMap: Record<string, string> = {
    'jk-cat': 'cat',
    'jk-ball': 'dog',
    'jk-dog': 'dog',
    'sk-frog': 'frog',
    'sk-sun': 'butterfly',
    'sk-fish': 'fish',
    'g1-dragon': 'dragon',
    'g1-rainbow': 'butterfly',
    'g1-puppy': 'dog',
    'g2-space': 'rocket',
    'g2-ocean': 'octopus',
    'g2-treehouse': 'bird',
    'g3-inventor': 'robot',
    'g3-forest': 'bear',
    'g3-detective': 'owl',
  };
  return storyCharacterMap[storyId] || 'bear';
}

// Subtle background character that moves gently during reading
// Click for a fun surprise!
export default function BackgroundCharacter({ storyId }: BackgroundCharacterProps) {
  const character = getCharacterForStory(storyId);
  const [isClicked, setIsClicked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    if (isClicked) return; // Prevent spam clicking
    setIsClicked(true);
    setClickCount(prev => prev + 1);
    // Reset after animation
    setTimeout(() => setIsClicked(false), 1500);
  };

  // Different silly reactions based on click count
  const getReactionClass = () => {
    if (!isClicked) return '';
    const reactions = ['animate-silly-spin', 'animate-silly-bounce', 'animate-silly-flip', 'animate-silly-shake', 'animate-silly-grow'];
    return reactions[clickCount % reactions.length];
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-5 cursor-pointer transition-opacity duration-300 ${isClicked ? 'opacity-100' : 'opacity-40 hover:opacity-70'} ${getReactionClass()}`}
      onClick={handleClick}
    >
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="bgPaperRough" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* CAT - walking/prowling */}
      {character === 'cat' && (
        <div className="animate-walk-slow w-20 h-16">
          <svg viewBox="0 0 80 60" className="w-full h-full">
            <ellipse cx="40" cy="35" rx="25" ry="18" fill="#FF8A65" style={{ filter: 'url(#bgPaperRough)' }} />
            <circle cx="25" cy="25" r="12" fill="#FF8A65" style={{ filter: 'url(#bgPaperRough)' }} />
            <path d="M15,18 L10,8 L20,15" fill="#FF8A65" />
            <path d="M30,15 L35,5 L38,15" fill="#FF8A65" />
            <circle cx="22" cy="23" r="3" fill="white" />
            <circle cx="28" cy="23" r="3" fill="white" />
            <circle cx="23" cy="24" r="1.5" fill="#1a1a1a" />
            <circle cx="29" cy="24" r="1.5" fill="#1a1a1a" />
            <path d="M65,35 Q75,30 70,40" stroke="#FF8A65" strokeWidth="4" fill="none" className="animate-tail-swish" />
            <ellipse cx="20" cy="50" rx="5" ry="8" fill="#FF8A65" className="animate-leg-walk" />
            <ellipse cx="55" cy="50" rx="5" ry="8" fill="#FF8A65" className="animate-leg-walk-alt" />
          </svg>
        </div>
      )}

      {/* DOG - happy trotting */}
      {character === 'dog' && (
        <div className="animate-trot w-20 h-16">
          <svg viewBox="0 0 80 60" className="w-full h-full">
            <ellipse cx="40" cy="35" rx="25" ry="16" fill="#8D6E63" style={{ filter: 'url(#bgPaperRough)' }} />
            <circle cx="20" cy="28" r="14" fill="#8D6E63" style={{ filter: 'url(#bgPaperRough)' }} />
            <ellipse cx="15" cy="28" rx="8" ry="6" fill="#D7CCC8" />
            <circle cx="17" cy="24" r="4" fill="white" />
            <circle cx="25" cy="24" r="4" fill="white" />
            <circle cx="18" cy="25" r="2" fill="#1a1a1a" />
            <circle cx="26" cy="25" r="2" fill="#1a1a1a" />
            <ellipse cx="10" cy="32" rx="4" ry="3" fill="#3E2723" />
            <path d="M5,20 Q0,25 8,28" fill="#5D4037" />
            <path d="M30,18 Q35,12 38,20" fill="#5D4037" />
            <path d="M65,32 Q75,25 72,38" stroke="#8D6E63" strokeWidth="5" fill="none" className="animate-tail-wag" />
            <ellipse cx="22" cy="48" rx="4" ry="7" fill="#8D6E63" className="animate-leg-walk" />
            <ellipse cx="55" cy="48" rx="4" ry="7" fill="#8D6E63" className="animate-leg-walk-alt" />
          </svg>
        </div>
      )}

      {/* FROG - hopping */}
      {character === 'frog' && (
        <div className="animate-hop w-16 h-14">
          <svg viewBox="0 0 60 50" className="w-full h-full">
            <ellipse cx="30" cy="32" rx="22" ry="14" fill="#4CAF50" style={{ filter: 'url(#bgPaperRough)' }} />
            <circle cx="18" cy="18" r="10" fill="#4CAF50" style={{ filter: 'url(#bgPaperRough)' }} />
            <circle cx="42" cy="18" r="10" fill="#4CAF50" style={{ filter: 'url(#bgPaperRough)' }} />
            <circle cx="18" cy="16" r="6" fill="white" />
            <circle cx="42" cy="16" r="6" fill="white" />
            <circle cx="19" cy="16" r="3" fill="#1a1a1a" />
            <circle cx="43" cy="16" r="3" fill="#1a1a1a" />
            <path d="M22,38 Q18,45 10,45" stroke="#388E3C" strokeWidth="4" fill="none" className="animate-frog-leg" />
            <path d="M38,38 Q42,45 50,45" stroke="#388E3C" strokeWidth="4" fill="none" className="animate-frog-leg" />
          </svg>
        </div>
      )}

      {/* BUTTERFLY - fluttering */}
      {character === 'butterfly' && (
        <div className="animate-flutter w-16 h-14">
          <svg viewBox="0 0 60 50" className="w-full h-full">
            <ellipse cx="20" cy="22" rx="14" ry="12" fill="#E91E63" className="animate-wing-left-bg" style={{ filter: 'url(#bgPaperRough)' }} />
            <ellipse cx="40" cy="22" rx="14" ry="12" fill="#E91E63" className="animate-wing-right-bg" style={{ filter: 'url(#bgPaperRough)' }} />
            <ellipse cx="18" cy="35" rx="10" ry="8" fill="#9C27B0" className="animate-wing-left-bg" style={{ filter: 'url(#bgPaperRough)' }} />
            <ellipse cx="42" cy="35" rx="10" ry="8" fill="#9C27B0" className="animate-wing-right-bg" style={{ filter: 'url(#bgPaperRough)' }} />
            <ellipse cx="30" cy="28" rx="4" ry="15" fill="#4A148C" />
            <circle cx="30" cy="12" r="5" fill="#4A148C" />
            <path d="M27,8 Q22,2 20,5" stroke="#4A148C" strokeWidth="1.5" fill="none" />
            <path d="M33,8 Q38,2 40,5" stroke="#4A148C" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}

      {/* FISH - swimming */}
      {character === 'fish' && (
        <div className="animate-swim w-18 h-12">
          <svg viewBox="0 0 70 45" className="w-full h-full">
            <ellipse cx="30" cy="22" rx="22" ry="14" fill="#2196F3" style={{ filter: 'url(#bgPaperRough)' }} />
            <path d="M52,22 L65,12 L65,32 Z" fill="#1976D2" className="animate-fish-tail" style={{ filter: 'url(#bgPaperRough)' }} />
            <path d="M25,10 Q35,2 42,10" fill="#1976D2" />
            <circle cx="18" cy="20" r="5" fill="white" />
            <circle cx="19" cy="20" r="3" fill="#1a1a1a" />
            <ellipse cx="8" cy="22" rx="4" ry="3" fill="#F48FB1" />
          </svg>
        </div>
      )}

      {/* DRAGON - flying slowly */}
      {character === 'dragon' && (
        <div className="animate-fly-slow w-24 h-16">
          <svg viewBox="0 0 90 60" className="w-full h-full">
            <ellipse cx="45" cy="35" rx="28" ry="16" fill="#4CAF50" style={{ filter: 'url(#bgPaperRough)' }} />
            <ellipse cx="22" cy="30" rx="16" ry="12" fill="#4CAF50" style={{ filter: 'url(#bgPaperRough)' }} />
            <ellipse cx="10" cy="32" rx="10" ry="7" fill="#66BB6A" />
            <circle cx="18" cy="26" r="5" fill="#FFF9C4" />
            <ellipse cx="19" cy="27" rx="2" ry="3" fill="#FF5722" />
            <path d="M12,22 L8,12 L16,20" fill="#FF5722" />
            <path d="M28,20 L35,10 L32,22" fill="#FF5722" />
            <path d="M45,22 Q55,8 65,15 Q70,10 75,18" fill="#388E3C" className="animate-wing-flap-slow" style={{ filter: 'url(#bgPaperRough)' }} />
            <path d="M75,35 Q85,30 82,42" stroke="#4CAF50" strokeWidth="4" fill="none" />
          </svg>
        </div>
      )}

      {/* ROCKET - hovering */}
      {character === 'rocket' && (
        <div className="animate-hover w-12 h-20">
          <svg viewBox="0 0 45 75" className="w-full h-full">
            <ellipse cx="22" cy="35" rx="12" ry="28" fill="#E53935" style={{ filter: 'url(#bgPaperRough)' }} />
            <path d="M22,5 L12,25 L32,25 Z" fill="#1976D2" />
            <circle cx="22" cy="32" r="7" fill="#BBDEFB" />
            <path d="M10,50 L2,65 L14,55" fill="#FFC107" />
            <path d="M34,50 L42,65 L30,55" fill="#FFC107" />
            <ellipse cx="22" cy="65" rx="6" ry="10" fill="#FF9800" className="animate-flame" />
          </svg>
        </div>
      )}

      {/* OCTOPUS - floating */}
      {character === 'octopus' && (
        <div className="animate-float-gentle w-20 h-18">
          <svg viewBox="0 0 75 70" className="w-full h-full">
            <ellipse cx="38" cy="25" rx="25" ry="20" fill="#9C27B0" style={{ filter: 'url(#bgPaperRough)' }} />
            <circle cx="30" cy="22" r="5" fill="white" />
            <circle cx="46" cy="22" r="5" fill="white" />
            <circle cx="31" cy="23" r="3" fill="#1a1a1a" />
            <circle cx="47" cy="23" r="3" fill="#1a1a1a" />
            <path d="M20,40 Q10,55 18,60" stroke="#7B1FA2" strokeWidth="5" fill="none" className="animate-tentacle-1" />
            <path d="M32,42 Q28,58 35,62" stroke="#9C27B0" strokeWidth="4" fill="none" className="animate-tentacle-2" />
            <path d="M44,42 Q48,58 42,62" stroke="#7B1FA2" strokeWidth="4" fill="none" className="animate-tentacle-3" />
            <path d="M56,40 Q66,55 58,60" stroke="#9C27B0" strokeWidth="5" fill="none" className="animate-tentacle-4" />
          </svg>
        </div>
      )}

      {/* BIRD - flying */}
      {character === 'bird' && (
        <div className="animate-fly-bob w-18 h-14">
          <svg viewBox="0 0 70 55" className="w-full h-full">
            <ellipse cx="35" cy="30" rx="18" ry="12" fill="#2196F3" style={{ filter: 'url(#bgPaperRough)' }} />
            <circle cx="50" cy="25" r="10" fill="#2196F3" style={{ filter: 'url(#bgPaperRough)' }} />
            <path d="M58,25 L70,28 L58,31" fill="#FF9800" />
            <circle cx="54" cy="23" r="4" fill="white" />
            <circle cx="55" cy="23" r="2" fill="#1a1a1a" />
            <path d="M25,22 Q10,10 15,25 Q5,30 20,32" fill="#1565C0" className="animate-wing-flap-bg" style={{ filter: 'url(#bgPaperRough)' }} />
            <path d="M20,35 Q10,45 18,50" fill="#1976D2" />
          </svg>
        </div>
      )}

      {/* ROBOT - walking stiffly */}
      {character === 'robot' && (
        <div className="animate-robot-walk w-14 h-20">
          <svg viewBox="0 0 50 75" className="w-full h-full">
            <rect x="12" y="25" width="26" height="30" rx="3" fill="#78909C" style={{ filter: 'url(#bgPaperRough)' }} />
            <rect x="15" y="8" width="20" height="18" rx="3" fill="#90A4AE" style={{ filter: 'url(#bgPaperRough)' }} />
            <rect x="18" y="12" width="5" height="7" rx="1" fill="#BBDEFB" />
            <rect x="27" y="12" width="5" height="7" rx="1" fill="#BBDEFB" />
            <rect x="22" y="0" width="6" height="10" fill="#546E7A" />
            <circle cx="25" cy="3" r="4" fill="#FF5722" className="animate-blink" />
            <rect x="5" y="30" width="10" height="5" rx="2" fill="#78909C" />
            <rect x="35" y="30" width="10" height="5" rx="2" fill="#78909C" />
            <rect x="15" y="55" width="7" height="15" rx="2" fill="#78909C" className="animate-robot-leg" />
            <rect x="28" y="55" width="7" height="15" rx="2" fill="#78909C" className="animate-robot-leg-alt" />
          </svg>
        </div>
      )}

      {/* BEAR - lumbering walk */}
      {character === 'bear' && (
        <div className="animate-lumber w-22 h-16">
          <svg viewBox="0 0 85 60" className="w-full h-full">
            <ellipse cx="45" cy="38" rx="30" ry="18" fill="#5D4037" style={{ filter: 'url(#bgPaperRough)' }} />
            <circle cx="22" cy="30" r="16" fill="#5D4037" style={{ filter: 'url(#bgPaperRough)' }} />
            <circle cx="10" cy="18" r="8" fill="#5D4037" />
            <circle cx="10" cy="18" r="5" fill="#8D6E63" />
            <circle cx="34" cy="18" r="8" fill="#5D4037" />
            <circle cx="34" cy="18" r="5" fill="#8D6E63" />
            <ellipse cx="22" cy="38" rx="10" ry="8" fill="#D7CCC8" />
            <ellipse cx="22" cy="34" rx="5" ry="4" fill="#3E2723" />
            <circle cx="15" cy="28" r="4" fill="white" />
            <circle cx="28" cy="28" r="4" fill="white" />
            <circle cx="16" cy="29" r="2" fill="#1a1a1a" />
            <circle cx="29" cy="29" r="2" fill="#1a1a1a" />
            <ellipse cx="25" cy="52" rx="6" ry="8" fill="#5D4037" className="animate-leg-walk" />
            <ellipse cx="60" cy="52" rx="6" ry="8" fill="#5D4037" className="animate-leg-walk-alt" />
          </svg>
        </div>
      )}

      {/* OWL - gentle head bob */}
      {character === 'owl' && (
        <div className="animate-owl-bob w-16 h-18">
          <svg viewBox="0 0 60 70" className="w-full h-full">
            <ellipse cx="30" cy="45" rx="20" ry="22" fill="#795548" style={{ filter: 'url(#bgPaperRough)' }} />
            <ellipse cx="30" cy="50" rx="12" ry="14" fill="#D7CCC8" />
            <ellipse cx="30" cy="25" rx="18" ry="16" fill="#8D6E63" style={{ filter: 'url(#bgPaperRough)' }} />
            <path d="M15,12 L10,2 L20,10" fill="#5D4037" />
            <path d="M45,12 L50,2 L40,10" fill="#5D4037" />
            <circle cx="22" cy="22" r="8" fill="#FFF9C4" />
            <circle cx="38" cy="22" r="8" fill="#FFF9C4" />
            <circle cx="22" cy="22" r="6" fill="white" />
            <circle cx="38" cy="22" r="6" fill="white" />
            <circle cx="24" cy="22" r="3" fill="#1a1a1a" className="animate-blink-slow" />
            <circle cx="40" cy="22" r="3" fill="#1a1a1a" className="animate-blink-slow" />
            <path d="M30,28 L26,36 L30,34 L34,36 Z" fill="#FF9800" />
          </svg>
        </div>
      )}

      <style jsx>{`
        @keyframes walk-slow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        .animate-walk-slow { animation: walk-slow 3s ease-in-out infinite; }

        @keyframes trot {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(4px) translateY(-3px); }
          50% { transform: translateX(8px) translateY(0); }
          75% { transform: translateX(4px) translateY(-3px); }
        }
        .animate-trot { animation: trot 1.5s ease-in-out infinite; }

        @keyframes hop {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-15px); }
          50% { transform: translateY(-15px); }
          80% { transform: translateY(0); }
        }
        .animate-hop { animation: hop 2s ease-in-out infinite; }

        @keyframes flutter {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-8px) translateX(4px); }
          50% { transform: translateY(-4px) translateX(8px); }
          75% { transform: translateY(-10px) translateX(4px); }
        }
        .animate-flutter { animation: flutter 2s ease-in-out infinite; }

        @keyframes swim {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(6px) rotate(3deg); }
          50% { transform: translateX(12px) rotate(0deg); }
          75% { transform: translateX(6px) rotate(-3deg); }
        }
        .animate-swim { animation: swim 3s ease-in-out infinite; }

        @keyframes fly-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-10px) translateX(8px); }
        }
        .animate-fly-slow { animation: fly-slow 4s ease-in-out infinite; }

        @keyframes hover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-hover { animation: hover 2s ease-in-out infinite; }

        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        .animate-float-gentle { animation: float-gentle 3s ease-in-out infinite; }

        @keyframes fly-bob {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-12px) translateX(10px); }
        }
        .animate-fly-bob { animation: fly-bob 2.5s ease-in-out infinite; }

        @keyframes robot-walk {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-robot-walk { animation: robot-walk 2s steps(4) infinite; }

        @keyframes lumber {
          0%, 100% { transform: translateX(0) rotate(-1deg); }
          50% { transform: translateX(6px) rotate(1deg); }
        }
        .animate-lumber { animation: lumber 3s ease-in-out infinite; }

        @keyframes owl-bob {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .animate-owl-bob { animation: owl-bob 4s ease-in-out infinite; }

        @keyframes tail-swish {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(20deg); }
        }
        .animate-tail-swish { animation: tail-swish 1s ease-in-out infinite; transform-origin: left center; }

        @keyframes tail-wag {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        .animate-tail-wag { animation: tail-wag 0.3s ease-in-out infinite; transform-origin: left center; }

        @keyframes leg-walk {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        .animate-leg-walk { animation: leg-walk 0.5s ease-in-out infinite; transform-origin: top center; }
        .animate-leg-walk-alt { animation: leg-walk 0.5s ease-in-out infinite 0.25s; transform-origin: top center; }

        @keyframes frog-leg {
          0%, 70%, 100% { transform: scaleY(1); }
          30% { transform: scaleY(0.6); }
        }
        .animate-frog-leg { animation: frog-leg 2s ease-in-out infinite; transform-origin: top center; }

        @keyframes wing-left-bg {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.6); }
        }
        .animate-wing-left-bg { animation: wing-left-bg 0.2s ease-in-out infinite; transform-origin: right center; }
        .animate-wing-right-bg { animation: wing-left-bg 0.2s ease-in-out infinite; transform-origin: left center; }

        @keyframes fish-tail {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
        .animate-fish-tail { animation: fish-tail 0.4s ease-in-out infinite; transform-origin: left center; }

        @keyframes wing-flap-slow {
          0%, 100% { transform: rotate(0deg) scaleY(1); }
          50% { transform: rotate(-10deg) scaleY(0.9); }
        }
        .animate-wing-flap-slow { animation: wing-flap-slow 0.6s ease-in-out infinite; transform-origin: bottom left; }

        @keyframes wing-flap-bg {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-20deg); }
        }
        .animate-wing-flap-bg { animation: wing-flap-bg 0.3s ease-in-out infinite; transform-origin: right center; }

        @keyframes flame {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.3) scaleX(0.85); }
        }
        .animate-flame { animation: flame 0.15s ease-in-out infinite; transform-origin: center top; }

        @keyframes tentacle-1 {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-tentacle-1 { animation: tentacle-1 1.2s ease-in-out infinite; transform-origin: top center; }
        .animate-tentacle-2 { animation: tentacle-1 1s ease-in-out infinite 0.1s; transform-origin: top center; }
        .animate-tentacle-3 { animation: tentacle-1 1.1s ease-in-out infinite 0.2s; transform-origin: top center; }
        .animate-tentacle-4 { animation: tentacle-1 1.3s ease-in-out infinite 0.15s; transform-origin: top center; }

        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.2; }
        }
        .animate-blink { animation: blink 2s ease-in-out infinite; }

        @keyframes blink-slow {
          0%, 85%, 100% { transform: scaleY(1); }
          90% { transform: scaleY(0.1); }
        }
        .animate-blink-slow { animation: blink-slow 4s ease-in-out infinite; }

        @keyframes robot-leg {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-robot-leg { animation: robot-leg 0.5s steps(2) infinite; }
        .animate-robot-leg-alt { animation: robot-leg 0.5s steps(2) infinite 0.25s; }

        /* Silly click reactions */
        @keyframes silly-spin {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(180deg) scale(1.3); }
          50% { transform: rotate(360deg) scale(1); }
          75% { transform: rotate(540deg) scale(1.2); }
          100% { transform: rotate(720deg) scale(1); }
        }
        .animate-silly-spin { animation: silly-spin 1s ease-in-out; }

        @keyframes silly-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          15% { transform: translateY(-60px) scale(1.1); }
          30% { transform: translateY(0) scale(0.9, 1.1); }
          45% { transform: translateY(-40px) scale(1.05); }
          60% { transform: translateY(0) scale(0.95, 1.05); }
          75% { transform: translateY(-20px) scale(1); }
          90% { transform: translateY(0) scale(1); }
        }
        .animate-silly-bounce { animation: silly-bounce 1.2s ease-out; }

        @keyframes silly-flip {
          0% { transform: perspective(400px) rotateX(0deg) scale(1); }
          40% { transform: perspective(400px) rotateX(180deg) scale(1.2); }
          70% { transform: perspective(400px) rotateX(360deg) scale(0.9); }
          100% { transform: perspective(400px) rotateX(360deg) scale(1); }
        }
        .animate-silly-flip { animation: silly-flip 1s ease-in-out; }

        @keyframes silly-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-15px) rotate(-10deg); }
          20% { transform: translateX(15px) rotate(10deg); }
          30% { transform: translateX(-12px) rotate(-8deg); }
          40% { transform: translateX(12px) rotate(8deg); }
          50% { transform: translateX(-8px) rotate(-5deg); }
          60% { transform: translateX(8px) rotate(5deg); }
          70% { transform: translateX(-5px) rotate(-3deg); }
          80% { transform: translateX(5px) rotate(3deg); }
          90% { transform: translateX(-2px) rotate(-1deg); }
        }
        .animate-silly-shake { animation: silly-shake 0.8s ease-out; }

        @keyframes silly-grow {
          0% { transform: scale(1); }
          20% { transform: scale(2) rotate(5deg); }
          40% { transform: scale(2.2) rotate(-5deg); }
          60% { transform: scale(1.8) rotate(3deg); }
          80% { transform: scale(1.2) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-silly-grow { animation: silly-grow 1.3s ease-out; }
      `}</style>
    </div>
  );
}
