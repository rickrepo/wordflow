'use client';

import { useEffect, useState } from 'react';

interface BookCompleteCharacterProps {
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

// Dramatic character peek-in animation for book completion
export default function BookCompleteCharacter({ storyId }: BookCompleteCharacterProps) {
  const [show, setShow] = useState(false);
  const character = getCharacterForStory(storyId);

  useEffect(() => {
    // Delay the animation slightly
    const timer = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Paper texture filter */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="bookPaperRough" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="bookShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="4" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>
      </svg>

      {/* BEAR - peeking from bottom right */}
      {character === 'bear' && (
        <div className="absolute -bottom-10 right-10 animate-peek-celebrate" style={{ filter: 'url(#bookShadow)' }}>
          <svg width="280" height="250" viewBox="0 0 280 250" overflow="visible">
            <ellipse cx="140" cy="230" rx="130" ry="70" fill="#4E342E" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="120" rx="95" ry="80" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="125" rx="80" ry="68" fill="#6D4C41" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="60" cy="55" r="35" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="60" cy="55" r="22" fill="#8D6E63" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="220" cy="55" r="35" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="220" cy="55" r="22" fill="#8D6E63" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="155" rx="42" ry="35" fill="#D7CCC8" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="140" rx="17" ry="13" fill="#212121" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="100" cy="100" r="20" fill="white" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="180" cy="100" r="20" fill="white" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="105" cy="103" r="12" fill="#1a1a1a" />
            <circle cx="185" cy="103" r="12" fill="#1a1a1a" />
            <circle cx="108" cy="99" r="4" fill="white" />
            <circle cx="188" cy="99" r="4" fill="white" />
            <path d="M120,175 Q140,195 160,175" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
            <ellipse cx="70" cy="205" rx="35" ry="25" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="210" cy="205" rx="35" ry="25" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
          </svg>
        </div>
      )}

      {/* DOG - peeking from bottom center */}
      {character === 'dog' && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 animate-peek-celebrate-bounce" style={{ filter: 'url(#bookShadow)' }}>
          <svg width="280" height="240" viewBox="0 0 280 240" overflow="visible">
            <ellipse cx="140" cy="220" rx="130" ry="65" fill="#795548" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="115" rx="95" ry="80" fill="#8D6E63" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="120" rx="82" ry="68" fill="#A1887F" style={{ filter: 'url(#bookPaperRough)' }} />
            <path d="M35,85 Q5,40 20,100 Q-5,140 45,125" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
            <path d="M245,85 Q275,40 260,100 Q285,140 235,125" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="150" rx="48" ry="40" fill="#EFEBE9" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="130" rx="19" ry="15" fill="#212121" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="95" cy="95" r="24" fill="white" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="185" cy="95" r="24" fill="white" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="100" cy="98" r="14" fill="#3E2723" />
            <circle cx="190" cy="98" r="14" fill="#3E2723" />
            <circle cx="104" cy="94" r="5" fill="white" />
            <circle cx="194" cy="94" r="5" fill="white" />
            <ellipse cx="140" cy="195" rx="20" ry="32" fill="#F48FB1" style={{ filter: 'url(#bookPaperRough)' }} className="animate-tongue-wag" />
            <path d="M65,70 Q100,55 125,75" stroke="#5D4037" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M155,75 Q180,55 215,70" stroke="#5D4037" strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* CAT - peeking from right side */}
      {character === 'cat' && (
        <div className="absolute -right-8 top-1/3 animate-peek-celebrate-side" style={{ filter: 'url(#bookShadow)' }}>
          <svg width="240" height="280" viewBox="0 0 240 280" overflow="visible">
            <ellipse cx="160" cy="170" rx="90" ry="105" fill="#FF8A65" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="155" cy="170" rx="75" ry="90" fill="#FFAB91" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="115" cy="100" rx="78" ry="70" fill="#FF8A65" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="110" cy="100" rx="65" ry="58" fill="#FFAB91" style={{ filter: 'url(#bookPaperRough)' }} />
            <path d="M55,42 L35,5 L75,35" fill="#FF8A65" style={{ filter: 'url(#bookPaperRough)' }} />
            <path d="M60,45 L48,18 L72,40" fill="#F48FB1" />
            <path d="M160,35 L188,2 L178,42" fill="#FF8A65" style={{ filter: 'url(#bookPaperRough)' }} />
            <path d="M162,40 L182,15 L175,45" fill="#F48FB1" />
            <ellipse cx="85" cy="92" rx="19" ry="22" fill="#C8E6C9" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="145" cy="92" rx="19" ry="22" fill="#C8E6C9" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="88" cy="94" rx="9" ry="15" fill="#1a1a1a" />
            <ellipse cx="148" cy="94" rx="9" ry="15" fill="#1a1a1a" />
            <path d="M115,115 L106,128 L124,128 Z" fill="#F48FB1" style={{ filter: 'url(#bookPaperRough)' }} />
            <line x1="60" y1="115" x2="15" y2="105" stroke="#5D4037" strokeWidth="2" />
            <line x1="60" y1="125" x2="12" y2="130" stroke="#5D4037" strokeWidth="2" />
            <line x1="60" y1="135" x2="15" y2="150" stroke="#5D4037" strokeWidth="2" />
            <line x1="170" y1="115" x2="215" y2="105" stroke="#5D4037" strokeWidth="2" />
            <line x1="170" y1="125" x2="218" y2="130" stroke="#5D4037" strokeWidth="2" />
            <line x1="170" y1="135" x2="215" y2="150" stroke="#5D4037" strokeWidth="2" />
            <ellipse cx="40" cy="245" rx="35" ry="25" fill="#FFCCBC" style={{ filter: 'url(#bookPaperRough)' }} />
          </svg>
        </div>
      )}

      {/* FROG - bouncing from bottom */}
      {character === 'frog' && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 animate-peek-celebrate-bounce-high" style={{ filter: 'url(#bookShadow)' }}>
          <svg width="300" height="200" viewBox="0 0 300 200" overflow="visible">
            <ellipse cx="150" cy="160" rx="125" ry="60" fill="#388E3C" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="150" cy="155" rx="105" ry="50" fill="#43A047" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="150" cy="105" rx="100" ry="62" fill="#4CAF50" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="85" cy="48" r="42" fill="#4CAF50" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="215" cy="48" r="42" fill="#4CAF50" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="85" cy="48" r="30" fill="white" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="215" cy="48" r="30" fill="white" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="90" cy="48" r="17" fill="#1a1a1a" />
            <circle cx="220" cy="48" r="17" fill="#1a1a1a" />
            <circle cx="95" cy="43" r="6" fill="white" />
            <circle cx="225" cy="43" r="6" fill="white" />
            <path d="M100,130 Q150,165 200,130" stroke="#2E7D32" strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="108" cy="145" r="13" fill="#2E7D32" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="192" cy="140" r="11" fill="#2E7D32" style={{ filter: 'url(#bookPaperRough)' }} />
          </svg>
        </div>
      )}

      {/* BUTTERFLY - fluttering at top */}
      {character === 'butterfly' && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 animate-peek-celebrate-flutter" style={{ filter: 'url(#bookShadow)' }}>
          <svg width="260" height="220" viewBox="0 0 260 220" overflow="visible">
            <ellipse cx="65" cy="85" rx="55" ry="45" fill="#E91E63" className="animate-wing-left" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="70" cy="90" rx="40" ry="32" fill="#F48FB1" className="animate-wing-left" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="55" cy="150" rx="45" ry="38" fill="#9C27B0" className="animate-wing-left" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="60" cy="148" rx="30" ry="26" fill="#CE93D8" className="animate-wing-left" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="195" cy="85" rx="55" ry="45" fill="#E91E63" className="animate-wing-right" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="190" cy="90" rx="40" ry="32" fill="#F48FB1" className="animate-wing-right" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="205" cy="150" rx="45" ry="38" fill="#9C27B0" className="animate-wing-right" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="200" cy="148" rx="30" ry="26" fill="#CE93D8" className="animate-wing-right" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="130" cy="120" rx="13" ry="60" fill="#4A148C" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="130" cy="55" r="18" fill="#4A148C" style={{ filter: 'url(#bookPaperRough)' }} />
            <path d="M118,42 Q100,12 95,22" stroke="#4A148C" strokeWidth="3" fill="none" />
            <circle cx="95" cy="22" r="6" fill="#E91E63" />
            <path d="M142,42 Q160,12 165,22" stroke="#4A148C" strokeWidth="3" fill="none" />
            <circle cx="165" cy="22" r="6" fill="#E91E63" />
            <circle cx="122" cy="53" r="6" fill="white" />
            <circle cx="138" cy="53" r="6" fill="white" />
            <circle cx="50" cy="80" r="9" fill="#FFC107" />
            <circle cx="210" cy="80" r="9" fill="#FFC107" />
          </svg>
        </div>
      )}

      {/* For other characters, default to bear style from bottom */}
      {!['bear', 'dog', 'cat', 'frog', 'butterfly'].includes(character) && (
        <div className="absolute -bottom-10 right-10 animate-peek-celebrate" style={{ filter: 'url(#bookShadow)' }}>
          <svg width="280" height="250" viewBox="0 0 280 250" overflow="visible">
            <ellipse cx="140" cy="230" rx="130" ry="70" fill="#4E342E" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="120" rx="95" ry="80" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="125" rx="80" ry="68" fill="#6D4C41" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="60" cy="55" r="35" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="60" cy="55" r="22" fill="#8D6E63" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="220" cy="55" r="35" fill="#5D4037" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="220" cy="55" r="22" fill="#8D6E63" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="155" rx="42" ry="35" fill="#D7CCC8" style={{ filter: 'url(#bookPaperRough)' }} />
            <ellipse cx="140" cy="140" rx="17" ry="13" fill="#212121" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="100" cy="100" r="20" fill="white" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="180" cy="100" r="20" fill="white" style={{ filter: 'url(#bookPaperRough)' }} />
            <circle cx="105" cy="103" r="12" fill="#1a1a1a" />
            <circle cx="185" cy="103" r="12" fill="#1a1a1a" />
            <path d="M120,175 Q140,195 160,175" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <style jsx>{`
        @keyframes peek-celebrate {
          0% { transform: translateY(100%); }
          30% { transform: translateY(0) rotate(-5deg); }
          45% { transform: translateY(0) rotate(5deg); }
          60% { transform: translateY(0) rotate(-3deg); }
          75% { transform: translateY(0) rotate(3deg); }
          100% { transform: translateY(0) rotate(0); }
        }
        .animate-peek-celebrate {
          animation: peek-celebrate 1.5s ease-out forwards;
        }

        @keyframes peek-celebrate-bounce {
          0% { transform: translateX(-50%) translateY(100%); }
          25% { transform: translateX(-50%) translateY(-20px) rotate(-3deg); }
          40% { transform: translateX(-50%) translateY(10px) rotate(3deg); }
          55% { transform: translateX(-50%) translateY(-10px) rotate(-2deg); }
          70% { transform: translateX(-50%) translateY(5px) rotate(1deg); }
          100% { transform: translateX(-50%) translateY(0) rotate(0); }
        }
        .animate-peek-celebrate-bounce {
          animation: peek-celebrate-bounce 1.5s ease-out forwards;
        }

        @keyframes peek-celebrate-bounce-high {
          0% { transform: translateX(-50%) translateY(100%); }
          20% { transform: translateX(-50%) translateY(-40px); }
          35% { transform: translateX(-50%) translateY(15px); }
          50% { transform: translateX(-50%) translateY(-25px); }
          65% { transform: translateX(-50%) translateY(8px); }
          80% { transform: translateX(-50%) translateY(-10px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        .animate-peek-celebrate-bounce-high {
          animation: peek-celebrate-bounce-high 1.8s ease-out forwards;
        }

        @keyframes peek-celebrate-side {
          0% { transform: translateX(100%); }
          30% { transform: translateX(0) rotate(-5deg); }
          50% { transform: translateX(0) rotate(5deg); }
          70% { transform: translateX(0) rotate(-3deg); }
          100% { transform: translateX(0) rotate(0); }
        }
        .animate-peek-celebrate-side {
          animation: peek-celebrate-side 1.5s ease-out forwards;
        }

        @keyframes peek-celebrate-flutter {
          0% { transform: translateX(-50%) translateY(-100%); }
          30% { transform: translateX(-50%) translateY(30px) rotate(-5deg); }
          50% { transform: translateX(-50%) translateY(15px) rotate(5deg); }
          70% { transform: translateX(-50%) translateY(25px) rotate(-3deg); }
          100% { transform: translateX(-50%) translateY(20px) rotate(0); }
        }
        .animate-peek-celebrate-flutter {
          animation: peek-celebrate-flutter 2s ease-out forwards;
        }

        @keyframes wing-left {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.65); }
        }
        .animate-wing-left {
          animation: wing-left 0.2s ease-in-out infinite;
          transform-origin: right center;
        }
        .animate-wing-right {
          animation: wing-left 0.2s ease-in-out infinite;
          transform-origin: left center;
        }

        @keyframes tongue-wag {
          0%, 100% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
        }
        .animate-tongue-wag {
          animation: tongue-wag 0.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
