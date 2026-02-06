'use client';

// Eric Carle-inspired SVG illustrations with textured, collage-style art
// Features bold colors, layered shapes, and organic textures

import React from 'react';

// SVG filter for paper texture effect
export const TextureFilter = () => (
  <svg className="absolute w-0 h-0">
    <defs>
      <filter id="paper-texture" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
        <feDiffuseLighting in="noise" lightingColor="white" surfaceScale="2" result="light">
          <feDistantLight azimuth="45" elevation="60" />
        </feDiffuseLighting>
        <feBlend in="SourceGraphic" in2="light" mode="multiply" />
      </filter>
      <filter id="rough-edge">
        <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence" />
        <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

// Animated Caterpillar - Eric Carle's signature character
export const Caterpillar = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 80" className={`${className}`} style={{ filter: 'url(#rough-edge)' }}>
    {/* Body segments with crawling animation */}
    <g className="animate-caterpillar-crawl">
      {/* Segment 1 - tail */}
      <ellipse cx="30" cy="50" rx="15" ry="12" fill="#8BC34A" />
      <ellipse cx="28" cy="48" rx="8" ry="6" fill="#9CCC65" opacity="0.7" />

      {/* Segment 2 */}
      <ellipse cx="50" cy="45" rx="16" ry="13" fill="#7CB342" />
      <ellipse cx="48" cy="43" rx="9" ry="7" fill="#8BC34A" opacity="0.7" />

      {/* Segment 3 */}
      <ellipse cx="72" cy="42" rx="17" ry="14" fill="#689F38" />
      <ellipse cx="70" cy="40" rx="10" ry="8" fill="#7CB342" opacity="0.7" />

      {/* Segment 4 */}
      <ellipse cx="96" cy="40" rx="18" ry="15" fill="#558B2F" />
      <ellipse cx="94" cy="38" rx="11" ry="9" fill="#689F38" opacity="0.7" />

      {/* Segment 5 */}
      <ellipse cx="122" cy="42" rx="17" ry="14" fill="#689F38" />
      <ellipse cx="120" cy="40" rx="10" ry="8" fill="#7CB342" opacity="0.7" />
    </g>

    {/* Head */}
    <g className="animate-caterpillar-head">
      <circle cx="150" cy="40" r="22" fill="#E53935" />
      <circle cx="148" cy="38" r="14" fill="#EF5350" opacity="0.6" />

      {/* Eyes */}
      <circle cx="158" cy="35" r="6" fill="white" />
      <circle cx="160" cy="34" r="3" fill="#1A1A1A" />
      <circle cx="161" cy="33" r="1" fill="white" />

      {/* Antenna */}
      <line x1="155" y1="22" x2="160" y2="8" stroke="#4E342E" strokeWidth="3" strokeLinecap="round" />
      <circle cx="160" cy="6" r="4" fill="#E53935" />
      <line x1="165" y1="24" x2="175" y2="12" stroke="#4E342E" strokeWidth="3" strokeLinecap="round" />
      <circle cx="176" cy="10" r="4" fill="#E53935" />
    </g>

    {/* Legs */}
    <g className="animate-caterpillar-legs">
      <line x1="35" y1="60" x2="30" y2="72" stroke="#4E342E" strokeWidth="2" />
      <line x1="55" y1="56" x2="50" y2="68" stroke="#4E342E" strokeWidth="2" />
      <line x1="77" y1="54" x2="72" y2="66" stroke="#4E342E" strokeWidth="2" />
      <line x1="101" y1="53" x2="96" y2="65" stroke="#4E342E" strokeWidth="2" />
      <line x1="127" y1="54" x2="122" y2="66" stroke="#4E342E" strokeWidth="2" />
    </g>
  </svg>
);

// Animated Butterfly
export const Butterfly = ({ className = '', color = 'orange' }: { className?: string; color?: 'orange' | 'blue' | 'purple' }) => {
  const colors = {
    orange: { main: '#FF9800', light: '#FFB74D', dark: '#F57C00' },
    blue: { main: '#2196F3', light: '#64B5F6', dark: '#1976D2' },
    purple: { main: '#9C27B0', light: '#BA68C8', dark: '#7B1FA2' },
  };
  const c = colors[color];

  return (
    <svg viewBox="0 0 120 100" className={className}>
      <g className="animate-butterfly-fly">
        {/* Left wing */}
        <g className="animate-wing-left origin-center">
          <ellipse cx="35" cy="40" rx="30" ry="35" fill={c.main} />
          <ellipse cx="30" cy="35" rx="18" ry="20" fill={c.light} opacity="0.7" />
          <circle cx="25" cy="30" r="8" fill={c.dark} opacity="0.5" />
          <circle cx="40" cy="50" r="6" fill={c.dark} opacity="0.5" />
        </g>

        {/* Right wing */}
        <g className="animate-wing-right origin-center">
          <ellipse cx="85" cy="40" rx="30" ry="35" fill={c.main} />
          <ellipse cx="90" cy="35" rx="18" ry="20" fill={c.light} opacity="0.7" />
          <circle cx="95" cy="30" r="8" fill={c.dark} opacity="0.5" />
          <circle cx="80" cy="50" r="6" fill={c.dark} opacity="0.5" />
        </g>

        {/* Body */}
        <ellipse cx="60" cy="50" rx="6" ry="25" fill="#4E342E" />
        <ellipse cx="60" cy="48" rx="4" ry="20" fill="#5D4037" opacity="0.6" />

        {/* Head */}
        <circle cx="60" cy="22" r="8" fill="#4E342E" />

        {/* Antenna */}
        <path d="M55 18 Q50 8 45 5" stroke="#4E342E" strokeWidth="2" fill="none" />
        <path d="M65 18 Q70 8 75 5" stroke="#4E342E" strokeWidth="2" fill="none" />
        <circle cx="45" cy="5" r="3" fill="#4E342E" />
        <circle cx="75" cy="5" r="3" fill="#4E342E" />
      </g>
    </svg>
  );
};

// Animated Fish
export const Fish = ({ className = '', color = 'blue' }: { className?: string; color?: 'blue' | 'orange' | 'green' }) => {
  const colors = {
    blue: { main: '#2196F3', light: '#64B5F6', dark: '#1565C0', accent: '#0D47A1' },
    orange: { main: '#FF9800', light: '#FFB74D', dark: '#EF6C00', accent: '#E65100' },
    green: { main: '#4CAF50', light: '#81C784', dark: '#2E7D32', accent: '#1B5E20' },
  };
  const c = colors[color];

  return (
    <svg viewBox="0 0 140 80" className={className}>
      <g className="animate-fish-swim">
        {/* Tail */}
        <g className="animate-fish-tail origin-left">
          <path d="M10 40 L30 20 L30 60 Z" fill={c.dark} />
          <path d="M15 40 L28 25 L28 55 Z" fill={c.main} opacity="0.7" />
        </g>

        {/* Body */}
        <ellipse cx="70" cy="40" rx="50" ry="30" fill={c.main} />
        <ellipse cx="65" cy="35" rx="35" ry="20" fill={c.light} opacity="0.6" />

        {/* Scales pattern */}
        <g opacity="0.3">
          <circle cx="50" cy="35" r="8" fill={c.dark} />
          <circle cx="70" cy="35" r="8" fill={c.dark} />
          <circle cx="90" cy="35" r="8" fill={c.dark} />
          <circle cx="60" cy="50" r="8" fill={c.dark} />
          <circle cx="80" cy="50" r="8" fill={c.dark} />
        </g>

        {/* Dorsal fin */}
        <path d="M60 12 Q70 0 85 12" fill={c.dark} />

        {/* Eye */}
        <circle cx="100" cy="35" r="10" fill="white" />
        <circle cx="103" cy="34" r="6" fill="#1A1A1A" />
        <circle cx="105" cy="32" r="2" fill="white" />

        {/* Mouth */}
        <ellipse cx="118" cy="42" rx="4" ry="3" fill={c.accent} />

        {/* Bubbles */}
        <g className="animate-bubbles">
          <circle cx="125" cy="30" r="3" fill="#E3F2FD" opacity="0.8" />
          <circle cx="130" cy="22" r="2" fill="#E3F2FD" opacity="0.6" />
          <circle cx="128" cy="15" r="2.5" fill="#E3F2FD" opacity="0.4" />
        </g>
      </g>
    </svg>
  );
};

// Animated Bird
export const Bird = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 80" className={className}>
    <g className="animate-bird-fly">
      {/* Body */}
      <ellipse cx="50" cy="45" rx="25" ry="18" fill="#F44336" />
      <ellipse cx="48" cy="42" rx="18" ry="12" fill="#EF5350" opacity="0.6" />

      {/* Wing */}
      <g className="animate-wing-flap origin-center">
        <ellipse cx="45" cy="40" rx="20" ry="12" fill="#D32F2F" transform="rotate(-20 45 40)" />
        <ellipse cx="43" cy="38" rx="14" ry="8" fill="#E53935" opacity="0.6" transform="rotate(-20 43 38)" />
      </g>

      {/* Head */}
      <circle cx="72" cy="38" r="14" fill="#F44336" />
      <circle cx="70" cy="36" r="9" fill="#EF5350" opacity="0.5" />

      {/* Eye */}
      <circle cx="78" cy="35" r="5" fill="white" />
      <circle cx="79" cy="34" r="3" fill="#1A1A1A" />
      <circle cx="80" cy="33" r="1" fill="white" />

      {/* Beak */}
      <path d="M86 40 L98 42 L86 46 Z" fill="#FF9800" />
      <path d="M86 42 L94 43 L86 45 Z" fill="#FFB74D" opacity="0.7" />

      {/* Tail */}
      <path d="M25 45 L5 35 L10 45 L5 55 Z" fill="#D32F2F" />
    </g>
  </svg>
);

// Sun with rays
export const Sun = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 120 120" className={className}>
    <g className="animate-sun-pulse">
      {/* Rays */}
      <g className="animate-sun-rays">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={i}
            x1="60"
            y1="60"
            x2={60 + Math.cos((angle * Math.PI) / 180) * 55}
            y2={60 + Math.sin((angle * Math.PI) / 180) * 55}
            stroke="#FFC107"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.8"
          />
        ))}
      </g>

      {/* Main circle */}
      <circle cx="60" cy="60" r="35" fill="#FFEB3B" />
      <circle cx="55" cy="55" r="25" fill="#FFF59D" opacity="0.6" />

      {/* Face */}
      <circle cx="48" cy="55" r="4" fill="#F57F17" />
      <circle cx="72" cy="55" r="4" fill="#F57F17" />
      <path d="M45 70 Q60 80 75 70" stroke="#F57F17" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

// Moon
export const Moon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <g className="animate-moon-glow">
      {/* Glow */}
      <circle cx="50" cy="50" r="45" fill="#FFF9C4" opacity="0.3" />

      {/* Main moon */}
      <circle cx="50" cy="50" r="35" fill="#FFF9C4" />
      <circle cx="45" cy="45" r="25" fill="#FFFDE7" opacity="0.6" />

      {/* Craters */}
      <circle cx="40" cy="40" r="8" fill="#FFF59D" opacity="0.5" />
      <circle cx="60" cy="55" r="6" fill="#FFF59D" opacity="0.5" />
      <circle cx="45" cy="65" r="5" fill="#FFF59D" opacity="0.5" />
    </g>
  </svg>
);

// Tree
export const Tree = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 150" className={className}>
    <g className="animate-tree-sway">
      {/* Trunk */}
      <rect x="40" y="100" width="20" height="50" fill="#5D4037" rx="2" />
      <rect x="45" y="105" width="8" height="40" fill="#6D4C41" opacity="0.6" rx="1" />

      {/* Foliage layers */}
      <ellipse cx="50" cy="85" rx="40" ry="25" fill="#388E3C" />
      <ellipse cx="48" cy="82" rx="30" ry="18" fill="#43A047" opacity="0.7" />

      <ellipse cx="50" cy="60" rx="35" ry="22" fill="#43A047" />
      <ellipse cx="48" cy="57" rx="25" ry="15" fill="#4CAF50" opacity="0.7" />

      <ellipse cx="50" cy="38" rx="28" ry="18" fill="#4CAF50" />
      <ellipse cx="48" cy="35" rx="18" ry="12" fill="#66BB6A" opacity="0.7" />

      <ellipse cx="50" cy="20" rx="18" ry="12" fill="#66BB6A" />
      <ellipse cx="48" cy="18" rx="10" ry="7" fill="#81C784" opacity="0.7" />
    </g>
  </svg>
);

// Frog
export const Frog = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 120 100" className={className}>
    <g className="animate-frog-hop">
      {/* Back legs */}
      <ellipse cx="25" cy="75" rx="20" ry="10" fill="#388E3C" transform="rotate(-30 25 75)" />
      <ellipse cx="95" cy="75" rx="20" ry="10" fill="#388E3C" transform="rotate(30 95 75)" />

      {/* Body */}
      <ellipse cx="60" cy="60" rx="40" ry="30" fill="#4CAF50" />
      <ellipse cx="58" cy="55" rx="30" ry="22" fill="#66BB6A" opacity="0.6" />

      {/* Front legs */}
      <ellipse cx="30" cy="70" rx="12" ry="8" fill="#43A047" />
      <ellipse cx="90" cy="70" rx="12" ry="8" fill="#43A047" />

      {/* Head bump */}
      <ellipse cx="60" cy="35" rx="30" ry="20" fill="#4CAF50" />

      {/* Eyes */}
      <g className="animate-frog-blink">
        <circle cx="45" cy="25" r="12" fill="#4CAF50" />
        <circle cx="75" cy="25" r="12" fill="#4CAF50" />
        <circle cx="45" cy="25" r="8" fill="white" />
        <circle cx="75" cy="25" r="8" fill="white" />
        <circle cx="47" cy="24" r="5" fill="#1A1A1A" />
        <circle cx="77" cy="24" r="5" fill="#1A1A1A" />
        <circle cx="48" cy="23" r="1.5" fill="white" />
        <circle cx="78" cy="23" r="1.5" fill="white" />
      </g>

      {/* Mouth */}
      <path d="M45 50 Q60 58 75 50" stroke="#2E7D32" strokeWidth="2" fill="none" />

      {/* Spots */}
      <circle cx="50" cy="55" r="5" fill="#388E3C" opacity="0.5" />
      <circle cx="70" cy="60" r="4" fill="#388E3C" opacity="0.5" />
    </g>
  </svg>
);

// Dog
export const Dog = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 140 120" className={className}>
    <g className="animate-dog-wag">
      {/* Tail */}
      <g className="animate-tail-wag origin-bottom-left">
        <path d="M15 60 Q5 40 15 25" stroke="#8D6E63" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>

      {/* Body */}
      <ellipse cx="60" cy="70" rx="45" ry="30" fill="#A1887F" />
      <ellipse cx="58" cy="65" rx="35" ry="22" fill="#BCAAA4" opacity="0.5" />

      {/* Back leg */}
      <ellipse cx="30" cy="95" rx="12" ry="18" fill="#8D6E63" />

      {/* Front leg */}
      <ellipse cx="90" cy="95" rx="10" ry="20" fill="#8D6E63" />

      {/* Head */}
      <ellipse cx="110" cy="55" rx="25" ry="22" fill="#A1887F" />
      <ellipse cx="108" cy="52" rx="18" ry="16" fill="#BCAAA4" opacity="0.5" />

      {/* Ear */}
      <ellipse cx="95" cy="40" rx="12" ry="18" fill="#8D6E63" transform="rotate(-20 95 40)" />

      {/* Snout */}
      <ellipse cx="128" cy="60" rx="12" ry="10" fill="#BCAAA4" />
      <ellipse cx="130" cy="58" rx="5" ry="4" fill="#4E342E" />

      {/* Eye */}
      <circle cx="115" cy="50" r="6" fill="white" />
      <circle cx="117" cy="49" r="4" fill="#4E342E" />
      <circle cx="118" cy="48" r="1.5" fill="white" />

      {/* Tongue */}
      <ellipse cx="130" cy="70" rx="5" ry="8" fill="#E57373" className="animate-pant" />
    </g>
  </svg>
);

// Cat
export const Cat = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 120 110" className={className}>
    <g>
      {/* Tail */}
      <g className="animate-cat-tail origin-bottom-left">
        <path d="M15 70 Q0 50 10 30 Q15 20 25 25" stroke="#FF9800" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>

      {/* Body */}
      <ellipse cx="55" cy="70" rx="35" ry="28" fill="#FF9800" />
      <ellipse cx="53" cy="65" rx="25" ry="20" fill="#FFB74D" opacity="0.5" />

      {/* Stripes */}
      <path d="M40 55 Q55 50 70 55" stroke="#F57C00" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M38 65 Q55 60 72 65" stroke="#F57C00" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M40 75 Q55 70 70 75" stroke="#F57C00" strokeWidth="3" fill="none" opacity="0.6" />

      {/* Front paws */}
      <ellipse cx="75" cy="95" rx="8" ry="10" fill="#FFB74D" />
      <ellipse cx="45" cy="95" rx="8" ry="10" fill="#FFB74D" />

      {/* Head */}
      <circle cx="90" cy="50" r="22" fill="#FF9800" />
      <circle cx="88" cy="47" r="15" fill="#FFB74D" opacity="0.5" />

      {/* Ears */}
      <path d="M72 35 L78 15 L88 32 Z" fill="#FF9800" />
      <path d="M75 32 L79 20 L85 32 Z" fill="#FFB74D" opacity="0.5" />
      <path d="M92 32 L102 15 L108 35 Z" fill="#FF9800" />
      <path d="M95 32 L101 20 L105 32 Z" fill="#FFB74D" opacity="0.5" />

      {/* Inner ears */}
      <path d="M77 30 L79 22 L83 30 Z" fill="#FFCC80" />
      <path d="M97 30 L101 22 L103 30 Z" fill="#FFCC80" />

      {/* Eyes */}
      <ellipse cx="82" cy="48" rx="5" ry="6" fill="#81C784" />
      <ellipse cx="98" cy="48" rx="5" ry="6" fill="#81C784" />
      <ellipse cx="83" cy="48" rx="2" ry="4" fill="#1A1A1A" />
      <ellipse cx="99" cy="48" rx="2" ry="4" fill="#1A1A1A" />

      {/* Nose */}
      <path d="M88 56 L90 60 L92 56 Z" fill="#E57373" />

      {/* Whiskers */}
      <g opacity="0.6">
        <line x1="70" y1="55" x2="60" y2="52" stroke="#5D4037" strokeWidth="1" />
        <line x1="70" y1="58" x2="58" y2="58" stroke="#5D4037" strokeWidth="1" />
        <line x1="70" y1="61" x2="60" y2="64" stroke="#5D4037" strokeWidth="1" />
        <line x1="110" y1="55" x2="120" y2="52" stroke="#5D4037" strokeWidth="1" />
        <line x1="110" y1="58" x2="122" y2="58" stroke="#5D4037" strokeWidth="1" />
        <line x1="110" y1="61" x2="120" y2="64" stroke="#5D4037" strokeWidth="1" />
      </g>

      {/* Mouth */}
      <path d="M85 62 Q90 66 95 62" stroke="#5D4037" strokeWidth="1.5" fill="none" />
    </g>
  </svg>
);

// Dragon
export const Dragon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 180 140" className={className}>
    <g className="animate-dragon-fly">
      {/* Wing */}
      <g className="animate-dragon-wing origin-center">
        <path d="M70 50 Q40 20 20 40 Q40 35 50 50 Q30 40 15 55 Q35 50 55 60 Q25 55 10 75 Q40 65 70 70 Z" fill="#66BB6A" />
        <path d="M65 52 Q45 30 30 45 Q42 42 52 55 Q35 48 25 60 Q42 55 60 65 Z" fill="#81C784" opacity="0.6" />
      </g>

      {/* Tail */}
      <path d="M30 90 Q10 100 5 85 Q15 95 25 85" fill="#4CAF50" />
      <g className="animate-tail-swish">
        <path d="M5 85 L0 75 L8 82 Z" fill="#388E3C" />
      </g>

      {/* Body */}
      <ellipse cx="70" cy="85" rx="45" ry="25" fill="#4CAF50" />
      <ellipse cx="68" cy="80" rx="35" ry="18" fill="#66BB6A" opacity="0.6" />

      {/* Spines */}
      <g fill="#388E3C">
        <path d="M40 62 L45 55 L50 62 Z" />
        <path d="M55 60 L60 52 L65 60 Z" />
        <path d="M70 60 L75 50 L80 60 Z" />
        <path d="M85 62 L90 54 L95 62 Z" />
      </g>

      {/* Legs */}
      <ellipse cx="45" cy="105" rx="10" ry="15" fill="#43A047" />
      <ellipse cx="95" cy="105" rx="10" ry="15" fill="#43A047" />

      {/* Head */}
      <ellipse cx="130" cy="75" rx="30" ry="25" fill="#4CAF50" />
      <ellipse cx="128" cy="72" rx="22" ry="18" fill="#66BB6A" opacity="0.5" />

      {/* Horns */}
      <path d="M115 55 L108 40 L120 52 Z" fill="#FFC107" />
      <path d="M125 52 L125 35 L132 50 Z" fill="#FFC107" />

      {/* Eye */}
      <circle cx="140" cy="68" r="8" fill="#FFEB3B" />
      <ellipse cx="142" cy="68" rx="3" ry="5" fill="#1A1A1A" />

      {/* Nostril smoke */}
      <g className="animate-smoke">
        <circle cx="158" cy="80" r="4" fill="#90A4AE" opacity="0.5" />
        <circle cx="162" cy="75" r="3" fill="#90A4AE" opacity="0.3" />
      </g>

      {/* Snout */}
      <ellipse cx="155" cy="82" rx="12" ry="10" fill="#43A047" />
      <circle cx="152" cy="80" r="2" fill="#2E7D32" />
      <circle cx="158" cy="80" r="2" fill="#2E7D32" />

      {/* Smile */}
      <path d="M148 90 Q155 96 162 90" stroke="#2E7D32" strokeWidth="2" fill="none" />
    </g>
  </svg>
);

// Rocket
export const Rocket = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 80 150" className={className}>
    <g className="animate-rocket-fly">
      {/* Flames */}
      <g className="animate-flames">
        <ellipse cx="40" cy="140" rx="12" ry="15" fill="#FF5722" />
        <ellipse cx="40" cy="138" rx="8" ry="12" fill="#FF9800" />
        <ellipse cx="40" cy="135" rx="5" ry="8" fill="#FFEB3B" />
      </g>

      {/* Fins */}
      <path d="M15 110 L5 130 L25 115 Z" fill="#1976D2" />
      <path d="M65 110 L75 130 L55 115 Z" fill="#1976D2" />

      {/* Body */}
      <path d="M20 120 L20 50 Q40 10 60 50 L60 120 Z" fill="#F5F5F5" />
      <path d="M25 115 L25 55 Q40 20 55 55 L55 115 Z" fill="white" opacity="0.6" />

      {/* Window */}
      <circle cx="40" cy="70" r="15" fill="#1976D2" />
      <circle cx="40" cy="70" r="11" fill="#64B5F6" />
      <circle cx="36" cy="66" r="4" fill="white" opacity="0.6" />

      {/* Stripes */}
      <rect x="20" y="95" width="40" height="8" fill="#E53935" />
      <rect x="20" y="45" width="40" height="5" fill="#E53935" />

      {/* Tip */}
      <ellipse cx="40" cy="25" rx="8" ry="12" fill="#E53935" />
    </g>
  </svg>
);

// Stars (multiple twinkling)
export const Stars = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className}>
    {[
      { x: 30, y: 40, size: 1, delay: 0 },
      { x: 80, y: 20, size: 0.8, delay: 0.5 },
      { x: 150, y: 50, size: 1.2, delay: 1 },
      { x: 170, y: 120, size: 0.7, delay: 1.5 },
      { x: 40, y: 150, size: 0.9, delay: 2 },
      { x: 120, y: 170, size: 1.1, delay: 0.3 },
      { x: 100, y: 80, size: 0.6, delay: 0.8 },
    ].map((star, i) => (
      <g key={i} transform={`translate(${star.x}, ${star.y}) scale(${star.size})`} style={{ animationDelay: `${star.delay}s` }} className="animate-twinkle">
        <path d="M10 0 L12 7 L20 7 L14 12 L16 20 L10 15 L4 20 L6 12 L0 7 L8 7 Z" fill="#FFF59D" />
      </g>
    ))}
  </svg>
);

// Clouds
export const Cloud = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 120 60" className={className}>
    <g className="animate-cloud-drift">
      <ellipse cx="35" cy="40" rx="25" ry="18" fill="white" />
      <ellipse cx="60" cy="35" rx="30" ry="22" fill="white" />
      <ellipse cx="90" cy="40" rx="22" ry="16" fill="white" />
      <ellipse cx="50" cy="45" rx="20" ry="12" fill="white" />
      <ellipse cx="75" cy="45" rx="18" ry="10" fill="white" />

      {/* Highlight */}
      <ellipse cx="55" cy="30" rx="20" ry="12" fill="#F5F5F5" opacity="0.8" />
    </g>
  </svg>
);

// Ocean waves
export const Waves = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 60" className={className} preserveAspectRatio="none">
    <g className="animate-wave">
      <path d="M0 30 Q25 10 50 30 T100 30 T150 30 T200 30 L200 60 L0 60 Z" fill="#1976D2" opacity="0.8" />
      <path d="M0 35 Q25 20 50 35 T100 35 T150 35 T200 35 L200 60 L0 60 Z" fill="#2196F3" opacity="0.6" />
      <path d="M0 42 Q25 28 50 42 T100 42 T150 42 T200 42 L200 60 L0 60 Z" fill="#64B5F6" opacity="0.4" />
    </g>
  </svg>
);

// Grass
export const Grass = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 40" className={className} preserveAspectRatio="none">
    <rect x="0" y="20" width="200" height="20" fill="#4CAF50" />
    {Array.from({ length: 25 }).map((_, i) => (
      <path
        key={i}
        d={`M${i * 8 + 2} 22 Q${i * 8 + 4} 5 ${i * 8 + 6} 22`}
        stroke="#66BB6A"
        strokeWidth="2"
        fill="none"
        className="animate-grass-sway"
        style={{ animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </svg>
);
