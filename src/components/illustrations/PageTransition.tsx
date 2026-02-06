'use client';

import { useEffect, useState } from 'react';

interface PageTransitionProps {
  show: boolean;
  storyId: string;
  onComplete: () => void;
}

// Map story IDs to their matching character
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

// Sound effects for each character
const characterSounds: Record<string, string> = {
  cat: 'MEOW!',
  dog: 'WOOF!',
  frog: 'RIBBIT!',
  butterfly: 'FLUTTER!',
  fish: 'SPLASH!',
  dragon: 'ROAR!',
  rocket: 'ZOOM!',
  octopus: 'SPLISH!',
  bird: 'TWEET!',
  robot: 'BEEP!',
  bear: 'GROWL!',
  owl: 'HOOT!',
};

export default function PageTransition({ show, storyId, onComplete }: PageTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const character = getCharacterForStory(storyId);
  const soundEffect = characterSounds[character] || 'WOW!';

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Paper texture filter definitions */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="paperRough" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="cutoutShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="4" dy="4" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>
      </svg>

      {/* CAT - Orange tabby peeking from side */}
      {character === 'cat' && (
        <div className="absolute -right-10 top-1/4 animate-peek-right" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="280" height="320" viewBox="0 0 280 320">
            {/* Body */}
            <ellipse cx="200" cy="200" rx="100" ry="120" fill="#FF8A65" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="195" cy="200" rx="85" ry="105" fill="#FFAB91" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <ellipse cx="140" cy="120" rx="90" ry="80" fill="#FF8A65" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="135" cy="120" rx="75" ry="68" fill="#FFAB91" style={{ filter: 'url(#paperRough)' }} />
            {/* Ears */}
            <path d="M70,50 L50,10 L90,40 Z" fill="#FF8A65" style={{ filter: 'url(#paperRough)' }} />
            <path d="M75,50 L60,20 L88,45 Z" fill="#F48FB1" />
            <path d="M190,40 L220,5 L210,50 Z" fill="#FF8A65" style={{ filter: 'url(#paperRough)' }} />
            <path d="M195,45 L215,15 L208,48 Z" fill="#F48FB1" />
            {/* Eyes */}
            <ellipse cx="105" cy="110" rx="22" ry="25" fill="#C8E6C9" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="175" cy="110" rx="22" ry="25" fill="#C8E6C9" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="108" cy="112" rx="10" ry="18" fill="#1a1a1a" />
            <ellipse cx="178" cy="112" rx="10" ry="18" fill="#1a1a1a" />
            <ellipse cx="110" cy="108" rx="4" ry="5" fill="white" />
            <ellipse cx="180" cy="108" rx="4" ry="5" fill="white" />
            {/* Nose */}
            <path d="M140,135 L130,150 L150,150 Z" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} />
            {/* Whiskers */}
            <line x1="70" y1="140" x2="20" y2="130" stroke="#5D4037" strokeWidth="2" />
            <line x1="70" y1="150" x2="15" y2="155" stroke="#5D4037" strokeWidth="2" />
            <line x1="70" y1="160" x2="20" y2="175" stroke="#5D4037" strokeWidth="2" />
            <line x1="210" y1="140" x2="260" y2="130" stroke="#5D4037" strokeWidth="2" />
            <line x1="210" y1="150" x2="265" y2="155" stroke="#5D4037" strokeWidth="2" />
            <line x1="210" y1="160" x2="260" y2="175" stroke="#5D4037" strokeWidth="2" />
            {/* Stripes */}
            <path d="M100,60 Q110,80 100,100" stroke="#E65100" strokeWidth="8" fill="none" style={{ filter: 'url(#paperRough)' }} />
            <path d="M140,50 Q150,75 140,95" stroke="#E65100" strokeWidth="8" fill="none" style={{ filter: 'url(#paperRough)' }} />
            <path d="M180,60 Q190,80 180,95" stroke="#E65100" strokeWidth="6" fill="none" style={{ filter: 'url(#paperRough)' }} />
            {/* Paw reaching */}
            <ellipse cx="50" cy="280" rx="40" ry="30" fill="#FFCCBC" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="35" cy="265" r="10" fill="#F48FB1" />
            <circle cx="55" cy="260" r="10" fill="#F48FB1" />
            <circle cx="70" cy="270" r="10" fill="#F48FB1" />
          </svg>
        </div>
      )}

      {/* DOG - Brown dog peeking from bottom */}
      {character === 'dog' && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 animate-peek-bottom" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="320" height="280" viewBox="0 0 320 280">
            {/* Body peeking */}
            <ellipse cx="160" cy="260" rx="150" ry="80" fill="#795548" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <ellipse cx="160" cy="140" rx="110" ry="95" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="160" cy="145" rx="95" ry="80" fill="#A1887F" style={{ filter: 'url(#paperRough)' }} />
            {/* Ears */}
            <path d="M40,100 Q10,50 25,120 Q5,160 50,145" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <path d="M280,100 Q310,50 295,120 Q315,160 270,145" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            {/* Snout */}
            <ellipse cx="160" cy="175" rx="55" ry="45" fill="#EFEBE9" style={{ filter: 'url(#paperRough)' }} />
            {/* Nose */}
            <ellipse cx="160" cy="155" rx="22" ry="18" fill="#212121" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="155" cy="152" rx="6" ry="4" fill="#424242" />
            {/* Eyes */}
            <circle cx="110" cy="115" r="28" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="210" cy="115" r="28" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="115" cy="118" r="16" fill="#3E2723" />
            <circle cx="215" cy="118" r="16" fill="#3E2723" />
            <circle cx="119" cy="114" r="5" fill="white" />
            <circle cx="219" cy="114" r="5" fill="white" />
            {/* Tongue */}
            <ellipse cx="160" cy="220" rx="22" ry="38" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} className="animate-tongue-wag" />
            {/* Eyebrows - happy */}
            <path d="M75,90 Q110,75 135,95" stroke="#5D4037" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M185,95 Q210,75 245,90" stroke="#5D4037" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Paws on edge */}
            <ellipse cx="90" cy="240" rx="40" ry="28" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="230" cy="240" rx="40" ry="28" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
          </svg>
        </div>
      )}

      {/* FROG - Green frog peeking from bottom */}
      {character === 'frog' && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 animate-peek-bottom-bounce" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="340" height="220" viewBox="0 0 340 220">
            {/* Body */}
            <ellipse cx="170" cy="180" rx="140" ry="70" fill="#388E3C" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="170" cy="175" rx="120" ry="58" fill="#43A047" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <ellipse cx="170" cy="120" rx="110" ry="70" fill="#4CAF50" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="170" cy="115" rx="95" ry="58" fill="#66BB6A" style={{ filter: 'url(#paperRough)' }} />
            {/* Eyes - big and bulging */}
            <circle cx="100" cy="55" r="48" fill="#4CAF50" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="240" cy="55" r="48" fill="#4CAF50" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="100" cy="55" r="35" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="240" cy="55" r="35" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="105" cy="55" r="20" fill="#1a1a1a" />
            <circle cx="245" cy="55" r="20" fill="#1a1a1a" />
            <circle cx="110" cy="50" r="7" fill="white" />
            <circle cx="250" cy="50" r="7" fill="white" />
            {/* Smile */}
            <path d="M110,145 Q170,180 230,145" stroke="#2E7D32" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Spots */}
            <circle cx="120" cy="160" r="15" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="220" cy="155" r="12" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="170" cy="190" r="10" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
            {/* Front legs */}
            <ellipse cx="70" cy="200" rx="35" ry="22" fill="#43A047" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="270" cy="200" rx="35" ry="22" fill="#43A047" style={{ filter: 'url(#paperRough)' }} />
          </svg>
        </div>
      )}

      {/* BUTTERFLY - Colorful butterfly fluttering from top */}
      {character === 'butterfly' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-peek-top-flutter" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="280" height="240" viewBox="0 0 280 240">
            {/* Left wings */}
            <ellipse cx="70" cy="90" rx="60" ry="50" fill="#E91E63" style={{ filter: 'url(#paperRough)' }} className="animate-wing-left" />
            <ellipse cx="75" cy="95" rx="42" ry="35" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} className="animate-wing-left" />
            <ellipse cx="60" cy="160" rx="48" ry="40" fill="#9C27B0" style={{ filter: 'url(#paperRough)' }} className="animate-wing-left" />
            <ellipse cx="65" cy="158" rx="32" ry="28" fill="#CE93D8" style={{ filter: 'url(#paperRough)' }} className="animate-wing-left" />
            {/* Right wings */}
            <ellipse cx="210" cy="90" rx="60" ry="50" fill="#E91E63" style={{ filter: 'url(#paperRough)' }} className="animate-wing-right" />
            <ellipse cx="205" cy="95" rx="42" ry="35" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} className="animate-wing-right" />
            <ellipse cx="220" cy="160" rx="48" ry="40" fill="#9C27B0" style={{ filter: 'url(#paperRough)' }} className="animate-wing-right" />
            <ellipse cx="215" cy="158" rx="32" ry="28" fill="#CE93D8" style={{ filter: 'url(#paperRough)' }} className="animate-wing-right" />
            {/* Body */}
            <ellipse cx="140" cy="130" rx="14" ry="65" fill="#4A148C" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <circle cx="140" cy="60" r="20" fill="#4A148C" style={{ filter: 'url(#paperRough)' }} />
            {/* Antennae */}
            <path d="M128,45 Q110,15 105,25" stroke="#4A148C" strokeWidth="3" fill="none" />
            <circle cx="105" cy="25" r="6" fill="#E91E63" />
            <path d="M152,45 Q170,15 175,25" stroke="#4A148C" strokeWidth="3" fill="none" />
            <circle cx="175" cy="25" r="6" fill="#E91E63" />
            {/* Eyes */}
            <circle cx="132" cy="58" r="6" fill="white" />
            <circle cx="148" cy="58" r="6" fill="white" />
            <circle cx="133" cy="58" r="4" fill="#1a1a1a" />
            <circle cx="149" cy="58" r="4" fill="#1a1a1a" />
            {/* Wing dots */}
            <circle cx="55" cy="85" r="10" fill="#FFC107" />
            <circle cx="90" cy="75" r="7" fill="#FFC107" />
            <circle cx="225" cy="85" r="10" fill="#FFC107" />
            <circle cx="190" cy="75" r="7" fill="#FFC107" />
          </svg>
        </div>
      )}

      {/* FISH - Colorful fish peeking from side */}
      {character === 'fish' && (
        <div className="absolute -left-10 top-1/3 animate-peek-left" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="300" height="200" viewBox="0 0 300 200">
            {/* Body */}
            <ellipse cx="150" cy="100" rx="110" ry="70" fill="#2196F3" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="145" cy="95" rx="95" ry="58" fill="#64B5F6" style={{ filter: 'url(#paperRough)' }} />
            {/* Tail */}
            <path d="M260,100 L300,50 L300,150 Z" fill="#1976D2" style={{ filter: 'url(#paperRough)' }} />
            <path d="M265,100 L295,60 L295,140 Z" fill="#42A5F5" style={{ filter: 'url(#paperRough)' }} />
            {/* Fins */}
            <path d="M120,35 Q150,0 180,35" fill="#1976D2" style={{ filter: 'url(#paperRough)' }} />
            <path d="M130,40 Q150,15 170,40" fill="#42A5F5" />
            <path d="M130,165 Q150,190 170,165" fill="#1976D2" style={{ filter: 'url(#paperRough)' }} />
            {/* Eye */}
            <circle cx="80" cy="85" r="30" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="85" cy="85" r="18" fill="#1a1a1a" />
            <circle cx="90" cy="80" r="6" fill="white" />
            {/* Mouth */}
            <ellipse cx="30" cy="100" rx="18" ry="12" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} />
            {/* Scales pattern */}
            <path d="M100,70 Q120,60 140,70" stroke="#1565C0" strokeWidth="3" fill="none" />
            <path d="M110,90 Q130,80 150,90" stroke="#1565C0" strokeWidth="3" fill="none" />
            <path d="M100,110 Q120,100 140,110" stroke="#1565C0" strokeWidth="3" fill="none" />
            <path d="M140,75 Q160,65 180,75" stroke="#1565C0" strokeWidth="3" fill="none" />
            <path d="M150,95 Q170,85 190,95" stroke="#1565C0" strokeWidth="3" fill="none" />
            {/* Bubbles */}
            <circle cx="20" cy="60" r="8" fill="#BBDEFB" className="animate-bubble" />
            <circle cx="35" cy="40" r="6" fill="#BBDEFB" className="animate-bubble" style={{ animationDelay: '0.2s' }} />
            <circle cx="15" cy="30" r="5" fill="#BBDEFB" className="animate-bubble" style={{ animationDelay: '0.4s' }} />
          </svg>
        </div>
      )}

      {/* DRAGON - Green/red dragon peeking from side */}
      {character === 'dragon' && (
        <div className="absolute -right-10 top-1/4 animate-peek-right-roar" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="350" height="320" viewBox="0 0 350 320">
            {/* Neck/Body */}
            <ellipse cx="280" cy="200" rx="90" ry="130" fill="#388E3C" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="275" cy="200" rx="75" ry="115" fill="#43A047" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <ellipse cx="140" cy="140" rx="100" ry="80" fill="#4CAF50" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="135" cy="140" rx="85" ry="68" fill="#66BB6A" style={{ filter: 'url(#paperRough)' }} />
            {/* Snout */}
            <ellipse cx="60" cy="155" rx="55" ry="40" fill="#4CAF50" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="55" cy="152" rx="45" ry="32" fill="#66BB6A" style={{ filter: 'url(#paperRough)' }} />
            {/* Nostrils with smoke */}
            <ellipse cx="25" cy="140" rx="8" ry="10" fill="#2E7D32" />
            <ellipse cx="45" cy="138" rx="8" ry="10" fill="#2E7D32" />
            {/* Eyes */}
            <ellipse cx="100" cy="110" rx="25" ry="28" fill="#FFF9C4" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="170" cy="110" rx="25" ry="28" fill="#FFF9C4" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="105" cy="112" rx="12" ry="20" fill="#FF5722" />
            <ellipse cx="175" cy="112" rx="12" ry="20" fill="#FF5722" />
            <ellipse cx="107" cy="108" rx="4" ry="6" fill="#1a1a1a" />
            <ellipse cx="177" cy="108" rx="4" ry="6" fill="#1a1a1a" />
            {/* Horns */}
            <path d="M80,70 L60,20 L95,65" fill="#FF5722" style={{ filter: 'url(#paperRough)' }} />
            <path d="M180,65 L210,15 L195,60" fill="#FF5722" style={{ filter: 'url(#paperRough)' }} />
            {/* Spikes on head */}
            <path d="M130,60 L140,30 L150,60" fill="#E65100" style={{ filter: 'url(#paperRough)' }} />
            {/* Teeth */}
            <path d="M25,170 L35,195 L45,170 L55,195 L65,170 L75,195 L85,170" fill="white" style={{ filter: 'url(#paperRough)' }} />
            {/* Fire breath */}
            <ellipse cx="-10" cy="165" rx="35" ry="25" fill="#FF9800" className="animate-fire" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="-5" cy="165" rx="25" ry="18" fill="#FF5722" className="animate-fire" />
            <ellipse cx="0" cy="165" rx="15" ry="12" fill="#FFC107" className="animate-fire" />
            {/* Scales on neck */}
            <circle cx="220" cy="120" r="12" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="245" cy="150" r="10" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="235" cy="100" r="8" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
          </svg>
        </div>
      )}

      {/* ROCKET - Rocket zooming from top */}
      {character === 'rocket' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-peek-top-zoom" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="160" height="300" viewBox="0 0 160 300">
            {/* Body */}
            <ellipse cx="80" cy="150" rx="45" ry="100" fill="#E53935" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="78" cy="150" rx="38" ry="90" fill="#EF5350" style={{ filter: 'url(#paperRough)' }} />
            {/* Nose cone */}
            <path d="M80,30 L45,100 L115,100 Z" fill="#1976D2" style={{ filter: 'url(#paperRough)' }} />
            <path d="M80,40 L52,95 L108,95 Z" fill="#42A5F5" />
            {/* Window */}
            <circle cx="80" cy="130" r="25" fill="#BBDEFB" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="80" cy="130" r="18" fill="#64B5F6" />
            <circle cx="73" cy="123" r="6" fill="white" opacity="0.6" />
            {/* Fins */}
            <path d="M35,200 L5,270 L45,230" fill="#FFC107" style={{ filter: 'url(#paperRough)' }} />
            <path d="M125,200 L155,270 L115,230" fill="#FFC107" style={{ filter: 'url(#paperRough)' }} />
            {/* Flames */}
            <ellipse cx="80" cy="265" rx="30" ry="45" fill="#FF9800" className="animate-fire" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="80" cy="270" rx="22" ry="35" fill="#FF5722" className="animate-fire" />
            <ellipse cx="80" cy="275" rx="14" ry="25" fill="#FFC107" className="animate-fire" />
            {/* Stars around */}
            <text x="10" y="80" fontSize="20" className="animate-twinkle">⭐</text>
            <text x="135" y="100" fontSize="16" className="animate-twinkle" style={{ animationDelay: '0.3s' }}>✨</text>
            <text x="5" y="180" fontSize="14" className="animate-twinkle" style={{ animationDelay: '0.6s' }}>⭐</text>
          </svg>
        </div>
      )}

      {/* OCTOPUS - Purple octopus peeking from bottom */}
      {character === 'octopus' && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 animate-peek-bottom-wave" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="360" height="280" viewBox="0 0 360 280">
            {/* Head */}
            <ellipse cx="180" cy="100" rx="100" ry="90" fill="#7B1FA2" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="175" cy="95" rx="85" ry="78" fill="#9C27B0" style={{ filter: 'url(#paperRough)' }} />
            {/* Eyes */}
            <ellipse cx="140" cy="90" rx="28" ry="32" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="220" cy="90" rx="28" ry="32" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="145" cy="92" r="16" fill="#1a1a1a" />
            <circle cx="225" cy="92" r="16" fill="#1a1a1a" />
            <circle cx="149" cy="88" r="5" fill="white" />
            <circle cx="229" cy="88" r="5" fill="white" />
            {/* Smile */}
            <path d="M150,140 Q180,170 210,140" stroke="#4A148C" strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* Tentacles */}
            <path d="M80,180 Q50,220 70,260 Q90,280 110,250" stroke="#7B1FA2" strokeWidth="25" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)' }} className="animate-tentacle" />
            <path d="M120,190 Q100,240 130,280" stroke="#9C27B0" strokeWidth="22" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)', animationDelay: '0.1s' }} className="animate-tentacle" />
            <path d="M165,195 Q160,250 180,280" stroke="#7B1FA2" strokeWidth="22" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)', animationDelay: '0.2s' }} className="animate-tentacle" />
            <path d="M210,195 Q220,250 200,280" stroke="#9C27B0" strokeWidth="22" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)', animationDelay: '0.15s' }} className="animate-tentacle" />
            <path d="M255,190 Q280,240 250,280" stroke="#7B1FA2" strokeWidth="22" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)', animationDelay: '0.25s' }} className="animate-tentacle" />
            <path d="M290,180 Q330,220 310,260 Q290,280 260,250" stroke="#9C27B0" strokeWidth="25" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)', animationDelay: '0.05s' }} className="animate-tentacle" />
            {/* Suction cups */}
            <circle cx="70" cy="240" r="6" fill="#E1BEE7" />
            <circle cx="85" cy="255" r="5" fill="#E1BEE7" />
            <circle cx="290" cy="240" r="6" fill="#E1BEE7" />
            <circle cx="275" cy="255" r="5" fill="#E1BEE7" />
          </svg>
        </div>
      )}

      {/* BIRD - Blue bird peeking from top */}
      {character === 'bird' && (
        <div className="absolute -top-5 right-1/4 animate-peek-top" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="260" height="220" viewBox="0 0 260 220">
            {/* Body */}
            <ellipse cx="130" cy="140" rx="80" ry="65" fill="#1976D2" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="125" cy="135" rx="68" ry="55" fill="#2196F3" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <circle cx="130" cy="75" r="55" fill="#1976D2" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="125" cy="72" r="46" fill="#2196F3" style={{ filter: 'url(#paperRough)' }} />
            {/* Eye */}
            <circle cx="145" cy="65" r="20" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="150" cy="65" r="12" fill="#1a1a1a" />
            <circle cx="153" cy="62" r="4" fill="white" />
            {/* Beak */}
            <path d="M175,75 L220,85 L175,95 Z" fill="#FF9800" style={{ filter: 'url(#paperRough)' }} />
            <path d="M178,82 L210,85 L178,90 Z" fill="#FFB74D" />
            {/* Wing */}
            <path d="M60,120 Q20,100 30,150 Q10,180 60,170 Q40,160 70,150" fill="#0D47A1" style={{ filter: 'url(#paperRough)' }} className="animate-wing-flap" />
            <path d="M70,125 Q40,115 50,155 Q35,170 75,165" fill="#1565C0" style={{ filter: 'url(#paperRough)' }} className="animate-wing-flap" />
            {/* Tail feathers */}
            <path d="M180,160 Q220,180 200,210" fill="#0D47A1" style={{ filter: 'url(#paperRough)' }} />
            <path d="M175,165 Q210,190 185,220" fill="#1565C0" style={{ filter: 'url(#paperRough)' }} />
            {/* Tuft on head */}
            <path d="M90,30 Q100,5 115,25" fill="#0D47A1" style={{ filter: 'url(#paperRough)' }} />
            <path d="M100,35 Q115,15 125,30" fill="#1565C0" style={{ filter: 'url(#paperRough)' }} />
          </svg>
        </div>
      )}

      {/* ROBOT - Friendly robot peeking from side */}
      {character === 'robot' && (
        <div className="absolute -left-5 top-1/4 animate-peek-left" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="260" height="320" viewBox="0 0 260 320">
            {/* Body */}
            <rect x="60" y="150" width="140" height="150" rx="15" fill="#78909C" style={{ filter: 'url(#paperRough)' }} />
            <rect x="70" y="160" width="120" height="130" rx="10" fill="#90A4AE" style={{ filter: 'url(#paperRough)' }} />
            {/* Chest panel */}
            <rect x="95" y="185" width="70" height="50" rx="5" fill="#37474F" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="115" cy="200" r="8" fill="#4CAF50" className="animate-blink-light" />
            <circle cx="145" cy="200" r="8" fill="#F44336" className="animate-blink-light" style={{ animationDelay: '0.5s' }} />
            <rect x="105" y="218" width="50" height="8" rx="2" fill="#4CAF50" />
            {/* Head */}
            <rect x="75" y="50" width="110" height="95" rx="15" fill="#78909C" style={{ filter: 'url(#paperRough)' }} />
            <rect x="85" y="58" width="90" height="80" rx="10" fill="#90A4AE" style={{ filter: 'url(#paperRough)' }} />
            {/* Eyes */}
            <rect x="95" y="75" width="30" height="35" rx="5" fill="#BBDEFB" style={{ filter: 'url(#paperRough)' }} />
            <rect x="135" y="75" width="30" height="35" rx="5" fill="#BBDEFB" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="110" cy="92" r="10" fill="#1976D2" />
            <circle cx="150" cy="92" r="10" fill="#1976D2" />
            <circle cx="113" cy="89" r="3" fill="white" />
            <circle cx="153" cy="89" r="3" fill="white" />
            {/* Mouth */}
            <rect x="105" y="120" width="50" height="12" rx="3" fill="#37474F" />
            <rect x="110" y="122" width="8" height="8" fill="#4CAF50" />
            <rect x="122" y="122" width="8" height="8" fill="#4CAF50" />
            <rect x="134" y="122" width="8" height="8" fill="#4CAF50" />
            <rect x="146" y="122" width="8" height="8" fill="#4CAF50" />
            {/* Antenna */}
            <rect x="125" y="20" width="10" height="35" fill="#546E7A" />
            <circle cx="130" cy="15" r="12" fill="#FF5722" className="animate-blink-light" />
            {/* Arms */}
            <rect x="10" y="170" width="55" height="25" rx="10" fill="#78909C" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="20" cy="182" r="18" fill="#90A4AE" style={{ filter: 'url(#paperRough)' }} />
            <rect x="195" y="170" width="55" height="25" rx="10" fill="#78909C" style={{ filter: 'url(#paperRough)' }} />
            {/* Bolts */}
            <circle cx="80" y="165" r="5" fill="#455A64" />
            <circle cx="180" y="165" r="5" fill="#455A64" />
          </svg>
        </div>
      )}

      {/* BEAR - Brown bear peeking from bottom */}
      {character === 'bear' && (
        <div className="absolute -bottom-10 right-10 animate-peek-bottom-tilt" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="340" height="300" viewBox="0 0 340 300">
            {/* Body */}
            <ellipse cx="170" cy="280" rx="150" ry="85" fill="#4E342E" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <ellipse cx="170" cy="145" rx="110" ry="95" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="170" cy="150" rx="95" ry="82" fill="#6D4C41" style={{ filter: 'url(#paperRough)' }} />
            {/* Ears */}
            <circle cx="75" cy="70" r="40" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="75" cy="70" r="25" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="265" cy="70" r="40" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="265" cy="70" r="25" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
            {/* Snout */}
            <ellipse cx="170" cy="185" rx="50" ry="40" fill="#D7CCC8" style={{ filter: 'url(#paperRough)' }} />
            {/* Nose */}
            <ellipse cx="170" cy="168" rx="20" ry="15" fill="#212121" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="165" cy="165" rx="5" ry="4" fill="#424242" />
            {/* Eyes */}
            <circle cx="120" cy="125" r="24" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="220" cy="125" r="24" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="125" cy="128" r="14" fill="#1a1a1a" />
            <circle cx="225" cy="128" r="14" fill="#1a1a1a" />
            <circle cx="129" cy="124" r="5" fill="white" />
            <circle cx="229" cy="124" r="5" fill="white" />
            {/* Smile */}
            <path d="M145,200 Q170,220 195,200" stroke="#4E342E" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Paws */}
            <ellipse cx="90" cy="250" rx="42" ry="30" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="250" cy="250" rx="42" ry="30" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
          </svg>
        </div>
      )}

      {/* OWL - Wise owl peeking from top */}
      {character === 'owl' && (
        <div className="absolute -top-5 left-1/3 animate-peek-top" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="280" height="280" viewBox="0 0 280 280">
            {/* Body */}
            <ellipse cx="140" cy="190" rx="90" ry="100" fill="#795548" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="140" cy="185" rx="75" ry="88" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
            {/* Belly */}
            <ellipse cx="140" cy="210" rx="50" ry="60" fill="#D7CCC8" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <ellipse cx="140" cy="85" rx="75" ry="65" fill="#795548" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="140" cy="85" rx="65" ry="55" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
            {/* Ear tufts */}
            <path d="M75,35 L60,5 L90,30" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <path d="M205,35 L220,5 L190,30" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            {/* Eyes - big and round */}
            <circle cx="105" cy="80" r="35" fill="#FFF9C4" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="175" cy="80" r="35" fill="#FFF9C4" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="105" cy="80" r="28" fill="white" />
            <circle cx="175" cy="80" r="28" fill="white" />
            <circle cx="110" cy="80" r="16" fill="#1a1a1a" />
            <circle cx="180" cy="80" r="16" fill="#1a1a1a" />
            <circle cx="114" cy="76" r="5" fill="white" />
            <circle cx="184" cy="76" r="5" fill="white" />
            {/* Beak */}
            <path d="M140,100 L125,130 L140,125 L155,130 Z" fill="#FF9800" style={{ filter: 'url(#paperRough)' }} />
            {/* Wings */}
            <path d="M50,150 Q20,180 35,230 Q25,260 60,250 Q45,235 70,220" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <path d="M230,150 Q260,180 245,230 Q255,260 220,250 Q235,235 210,220" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            {/* Chest feathers */}
            <path d="M100,160 Q115,150 130,160" stroke="#A1887F" strokeWidth="4" fill="none" />
            <path d="M115,175 Q130,165 145,175" stroke="#A1887F" strokeWidth="4" fill="none" />
            <path d="M130,190 Q145,180 160,190" stroke="#A1887F" strokeWidth="4" fill="none" />
          </svg>
        </div>
      )}

      {/* Sound effect text */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-sound-effect">
        <p className="text-7xl font-black comic-text" style={{ filter: 'url(#cutoutShadow)' }}>
          {soundEffect}
        </p>
      </div>

      <style jsx>{`
        .comic-text {
          font-family: 'Comic Sans MS', cursive;
          color: #FDD835;
          -webkit-text-stroke: 4px #E65100;
          paint-order: stroke fill;
        }

        @keyframes peek-right {
          0% { transform: translateX(100%); }
          20% { transform: translateX(0) rotate(-5deg); }
          40% { transform: translateX(0) rotate(5deg); }
          60% { transform: translateX(0) rotate(-3deg); }
          80% { transform: translateX(0); }
          100% { transform: translateX(110%); }
        }
        .animate-peek-right {
          animation: peek-right 2.5s ease-in-out forwards;
        }

        @keyframes peek-right-roar {
          0% { transform: translateX(100%); }
          25% { transform: translateX(-20px) rotate(-3deg); }
          35% { transform: translateX(-20px) rotate(3deg) scale(1.05); }
          45% { transform: translateX(-20px) rotate(-2deg) scale(1.05); }
          70% { transform: translateX(-20px); }
          100% { transform: translateX(110%); }
        }
        .animate-peek-right-roar {
          animation: peek-right-roar 2.5s ease-in-out forwards;
        }

        @keyframes peek-left {
          0% { transform: translateX(-100%); }
          20% { transform: translateX(0) rotate(5deg); }
          40% { transform: translateX(0) rotate(-5deg); }
          60% { transform: translateX(0) rotate(3deg); }
          80% { transform: translateX(0); }
          100% { transform: translateX(-110%); }
        }
        .animate-peek-left {
          animation: peek-left 2.5s ease-in-out forwards;
        }

        @keyframes peek-bottom {
          0% { transform: translateX(-50%) translateY(100%); }
          25% { transform: translateX(-50%) translateY(0) rotate(-3deg); }
          40% { transform: translateX(-50%) translateY(0) rotate(3deg); }
          60% { transform: translateX(-50%) translateY(0) rotate(-2deg); }
          80% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(110%); }
        }
        .animate-peek-bottom {
          animation: peek-bottom 2.5s ease-in-out forwards;
        }

        @keyframes peek-bottom-bounce {
          0% { transform: translateX(-50%) translateY(100%); }
          20% { transform: translateX(-50%) translateY(-20px); }
          30% { transform: translateX(-50%) translateY(10px); }
          40% { transform: translateX(-50%) translateY(-10px); }
          50% { transform: translateX(-50%) translateY(5px); }
          70% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(110%); }
        }
        .animate-peek-bottom-bounce {
          animation: peek-bottom-bounce 2.5s ease-in-out forwards;
        }

        @keyframes peek-bottom-wave {
          0% { transform: translateX(-50%) translateY(100%); }
          25% { transform: translateX(-50%) translateY(10px) rotate(-3deg); }
          35% { transform: translateX(-50%) translateY(0) rotate(3deg); }
          45% { transform: translateX(-50%) translateY(5px) rotate(-2deg); }
          55% { transform: translateX(-50%) translateY(0) rotate(2deg); }
          75% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(110%); }
        }
        .animate-peek-bottom-wave {
          animation: peek-bottom-wave 2.5s ease-in-out forwards;
        }

        @keyframes peek-bottom-tilt {
          0% { transform: translateY(100%) rotate(10deg); }
          25% { transform: translateY(0) rotate(-5deg); }
          40% { transform: translateY(0) rotate(5deg); }
          55% { transform: translateY(0) rotate(-3deg); }
          75% { transform: translateY(0) rotate(0); }
          100% { transform: translateY(110%) rotate(-10deg); }
        }
        .animate-peek-bottom-tilt {
          animation: peek-bottom-tilt 2.5s ease-in-out forwards;
        }

        @keyframes peek-top {
          0% { transform: translateY(-100%); }
          25% { transform: translateY(0) rotate(3deg); }
          40% { transform: translateY(0) rotate(-3deg); }
          60% { transform: translateY(0) rotate(2deg); }
          80% { transform: translateY(0); }
          100% { transform: translateY(-110%); }
        }
        .animate-peek-top {
          animation: peek-top 2.5s ease-in-out forwards;
        }

        @keyframes peek-top-flutter {
          0% { transform: translateX(-50%) translateY(-100%); }
          20% { transform: translateX(-50%) translateY(20px) rotate(-5deg); }
          35% { transform: translateX(-50%) translateY(10px) rotate(5deg); }
          50% { transform: translateX(-50%) translateY(15px) rotate(-3deg); }
          65% { transform: translateX(-50%) translateY(10px) rotate(3deg); }
          80% { transform: translateX(-50%) translateY(12px); }
          100% { transform: translateX(-50%) translateY(-110%); }
        }
        .animate-peek-top-flutter {
          animation: peek-top-flutter 2.5s ease-in-out forwards;
        }

        @keyframes peek-top-zoom {
          0% { transform: translateX(-50%) translateY(-100%) scale(0.8); }
          30% { transform: translateX(-50%) translateY(30px) scale(1.1); }
          45% { transform: translateX(-50%) translateY(20px) scale(1); }
          70% { transform: translateX(-50%) translateY(25px); }
          100% { transform: translateX(-50%) translateY(-120%) scale(0.9); }
        }
        .animate-peek-top-zoom {
          animation: peek-top-zoom 2.5s ease-in-out forwards;
        }

        @keyframes tongue-wag {
          0%, 100% { transform: translateX(-3px); }
          50% { transform: translateX(3px); }
        }
        .animate-tongue-wag {
          animation: tongue-wag 0.15s ease-in-out infinite;
        }

        @keyframes wing-flap {
          0%, 100% { transform: rotate(0) scaleY(1); }
          50% { transform: rotate(-15deg) scaleY(0.85); }
        }
        .animate-wing-flap {
          animation: wing-flap 0.2s ease-in-out infinite;
          transform-origin: right center;
        }

        @keyframes wing-left {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.7); }
        }
        .animate-wing-left {
          animation: wing-left 0.15s ease-in-out infinite;
          transform-origin: right center;
        }

        @keyframes wing-right {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.7); }
        }
        .animate-wing-right {
          animation: wing-right 0.15s ease-in-out infinite;
          transform-origin: left center;
        }

        @keyframes fire {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
          50% { transform: scaleY(1.2) scaleX(0.9); opacity: 1; }
        }
        .animate-fire {
          animation: fire 0.1s ease-in-out infinite;
          transform-origin: center bottom;
        }

        @keyframes bubble {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-10px) scale(1.1); opacity: 1; }
        }
        .animate-bubble {
          animation: bubble 1s ease-in-out infinite;
        }

        @keyframes tentacle {
          0%, 100% { transform: rotate(0); }
          50% { transform: rotate(8deg); }
        }
        .animate-tentacle {
          animation: tentacle 0.5s ease-in-out infinite;
          transform-origin: top center;
        }

        @keyframes blink-light {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-blink-light {
          animation: blink-light 0.8s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .animate-twinkle {
          animation: twinkle 0.6s ease-in-out infinite;
        }

        @keyframes sound-effect {
          0% { transform: translate(-50%, -50%) scale(0) rotate(-15deg); opacity: 0; }
          25% { transform: translate(-50%, -50%) scale(1.2) rotate(5deg); opacity: 1; }
          40% { transform: translate(-50%, -50%) scale(1) rotate(0); opacity: 1; }
          70% { transform: translate(-50%, -50%) scale(1.1) rotate(-3deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0) rotate(15deg); opacity: 0; }
        }
        .animate-sound-effect {
          animation: sound-effect 1.8s ease-out forwards;
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
