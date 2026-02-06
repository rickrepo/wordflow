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
  | 'bird-swoop'
  | 'bear-peek'
  | 'frog-tongue'
  | 'butterfly-flutter';

const transitionPool: TransitionType[] = [
  'dinosaur-bite',
  'monster-grab',
  'cat-swipe',
  'dog-shake',
  'bird-swoop',
  'bear-peek',
  'frog-tongue',
  'butterfly-flutter',
];

// Generate paper scraps that fly around
function generatePaperScraps(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    size: 15 + Math.random() * 25,
    rotation: Math.random() * 360,
    color: ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA', '#F06292'][Math.floor(Math.random() * 7)],
  }));
}

export default function PageTransition({ show, storyId, onComplete }: PageTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);

  const transition = useMemo(() => {
    return transitionPool[Math.floor(Math.random() * transitionPool.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionKey]);

  const paperScraps = useMemo(() => generatePaperScraps(15), [transitionKey]);

  useEffect(() => {
    if (show) {
      setTransitionKey(prev => prev + 1);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || !isAnimating) return null;

  const sounds = ['CHOMP!', 'RAWR!', 'MEOW!', 'WOOF!', 'TWEET!', 'ROAR!', 'RIBBIT!', 'FLUTTER!'];
  const soundEffect = sounds[transitionPool.indexOf(transition)];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Paper texture filter definitions */}
      <svg className="absolute w-0 h-0">
        <defs>
          {/* Rough paper edge filter */}
          <filter id="paperRough" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* Texture overlay */}
          <filter id="paperTexture">
            <feTurbulence type="turbulence" baseFrequency="0.5" numOctaves="3" result="noise" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
          </filter>
          {/* Cutout shadow */}
          <filter id="cutoutShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="4" dy="4" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>
      </svg>

      {/* Slight dim overlay */}
      <div className="absolute inset-0 bg-black/5 animate-flash-dim" />

      {/* DINOSAUR - Eric Carle style tissue paper T-Rex */}
      {transition === 'dinosaur-bite' && (
        <div className="absolute -right-20 top-1/4 animate-dino-chomp" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="450" height="350" viewBox="0 0 450 350">
            {/* Body - layered tissue paper effect */}
            <path d="M380,180 Q400,120 350,100 Q300,80 280,120 Q260,80 220,100 Q180,80 150,130 Q120,100 100,150 Q80,130 90,180 Q60,200 100,220 Q80,260 130,260 Q100,300 160,290 Q140,320 200,300 Q180,340 250,310 Q240,350 300,320 Q320,350 350,300 Q380,320 390,270 Q420,280 410,230 Q440,220 420,190 Q450,170 380,180"
                  fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
            <path d="M360,190 Q370,140 330,120 Q290,100 270,140 Q250,110 220,130 Q190,120 170,160 Q150,140 140,180 Q120,170 130,210 Q110,230 150,240 Q130,270 170,265 Q160,290 200,280 Q190,310 240,295 Q250,320 290,300 Q310,320 330,285 Q360,300 365,250 Q390,260 380,220 Q400,200 360,190"
                  fill="#43A047" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <path d="M50,160 Q20,140 30,180 Q10,200 50,210 Q30,230 70,230 Q50,250 100,240 Q90,260 140,250 Q150,200 120,180 Q140,160 100,150 Q120,130 70,140 Q80,120 50,160"
                  fill="#388E3C" style={{ filter: 'url(#paperRough)' }} />
            {/* Eye - white circle with black dot */}
            <circle cx="80" cy="175" r="18" fill="#FFF9C4" />
            <circle cx="85" cy="175" r="10" fill="#1a1a1a" />
            <circle cx="88" cy="172" r="3" fill="white" />
            {/* Teeth - jagged white paper */}
            <path d="M30,195 L40,215 L50,195 L60,215 L70,195 L80,215 L90,195" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <path d="M35,205 L45,185 L55,205 L65,185 L75,205 L85,185" fill="#ECEFF1" style={{ filter: 'url(#paperRough)' }} />
            {/* Spikes on back */}
            <path d="M200,95 L215,60 L230,95" fill="#1B5E20" style={{ filter: 'url(#paperRough)' }} />
            <path d="M260,85 L280,45 L300,90" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
            <path d="M320,95 L345,55 L365,100" fill="#1B5E20" style={{ filter: 'url(#paperRough)' }} />
            {/* Legs - simple cutout style */}
            <path d="M160,290 L150,350 L180,350 L175,290" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
            <path d="M280,300 L270,350 L300,350 L295,300" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
          </svg>
        </div>
      )}

      {/* MONSTER - Fuzzy felt monster hand */}
      {transition === 'monster-grab' && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 animate-monster-grab" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="400" height="350" viewBox="0 0 400 350">
            {/* Furry arm - layered purple paper strips */}
            <path d="M150,350 Q140,320 160,280 Q140,260 170,240 Q150,220 180,200 Q160,180 190,160 Q200,120 200,100"
                  stroke="#7B1FA2" strokeWidth="80" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)' }} />
            <path d="M250,350 Q260,320 240,280 Q260,260 230,240 Q250,220 220,200 Q240,180 210,160 Q200,120 200,100"
                  stroke="#9C27B0" strokeWidth="60" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)' }} />
            {/* Palm */}
            <ellipse cx="200" cy="100" rx="90" ry="60" fill="#AB47BC" style={{ filter: 'url(#paperRough)' }} />
            {/* Fingers - individual paper cutouts */}
            <ellipse cx="100" cy="60" rx="25" ry="55" fill="#9C27B0" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="150" cy="40" rx="22" ry="60" fill="#8E24AA" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="200" cy="30" rx="22" ry="65" fill="#9C27B0" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="250" cy="40" rx="22" ry="60" fill="#8E24AA" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="300" cy="60" rx="25" ry="55" fill="#9C27B0" style={{ filter: 'url(#paperRough)' }} />
            {/* Claws - black paper triangles */}
            <path d="M100,5 L90,30 L110,30 Z" fill="#212121" />
            <path d="M150,-20 L140,10 L160,10 Z" fill="#212121" />
            <path d="M200,-35 L190,0 L210,0 Z" fill="#212121" />
            <path d="M250,-20 L240,10 L260,10 Z" fill="#212121" />
            <path d="M300,5 L290,30 L310,30 Z" fill="#212121" />
            {/* Fur tufts - little paper strips */}
            {[...Array(12)].map((_, i) => (
              <path key={i} d={`M${160 + Math.random()*80},${80 + Math.random()*40} l${Math.random()*20-10},${Math.random()*15}`}
                    stroke="#7B1FA2" strokeWidth="4" strokeLinecap="round" />
            ))}
          </svg>
        </div>
      )}

      {/* CAT - Orange tabby paper cutout */}
      {transition === 'cat-swipe' && (
        <div className="absolute -left-32 top-1/3 animate-cat-swipe" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="350" height="200" viewBox="0 0 350 200">
            {/* Arm */}
            <path d="M0,100 Q40,90 80,100 Q120,90 160,100 Q200,95 240,100"
                  stroke="#FF8A65" strokeWidth="70" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)' }} />
            <path d="M0,100 Q40,95 80,100 Q120,95 160,100 Q200,98 240,100"
                  stroke="#FFAB91" strokeWidth="50" fill="none" strokeLinecap="round" style={{ filter: 'url(#paperRough)' }} />
            {/* Paw */}
            <ellipse cx="280" cy="100" rx="60" ry="50" fill="#FFCCBC" style={{ filter: 'url(#paperRough)' }} />
            {/* Paw pads - pink paper circles */}
            <ellipse cx="265" cy="120" rx="18" ry="15" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="295" cy="80" rx="12" ry="10" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="310" cy="100" rx="12" ry="10" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="305" cy="125" rx="12" ry="10" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} />
            {/* Claws */}
            <path d="M320,65 Q340,50 330,75" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M335,85 Q355,75 340,100" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M335,115 Q355,115 340,135" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
            {/* Stripes on arm - darker orange paper */}
            <path d="M60,70 Q70,100 60,130" stroke="#E65100" strokeWidth="12" fill="none" style={{ filter: 'url(#paperRough)' }} />
            <path d="M110,75 Q120,100 110,125" stroke="#E65100" strokeWidth="10" fill="none" style={{ filter: 'url(#paperRough)' }} />
            <path d="M160,80 Q170,100 160,120" stroke="#E65100" strokeWidth="8" fill="none" style={{ filter: 'url(#paperRough)' }} />
          </svg>
        </div>
      )}

      {/* DOG - Brown paper cutout dog head */}
      {transition === 'dog-shake' && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 animate-dog-head-shake" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="280" height="260" viewBox="0 0 280 260">
            {/* Head - brown paper layers */}
            <ellipse cx="140" cy="130" rx="110" ry="90" fill="#795548" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="140" cy="135" rx="95" ry="75" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
            {/* Ears - floppy paper cutouts */}
            <path d="M30,80 Q10,40 20,100 Q5,140 40,130 Q30,110 30,80" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <path d="M250,80 Q270,40 260,100 Q275,140 240,130 Q250,110 250,80" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            {/* Snout - tan paper */}
            <ellipse cx="140" cy="160" rx="50" ry="40" fill="#D7CCC8" style={{ filter: 'url(#paperRough)' }} />
            {/* Nose - black oval */}
            <ellipse cx="140" cy="145" rx="18" ry="14" fill="#212121" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="135" cy="142" rx="5" ry="3" fill="#424242" />
            {/* Eyes - big paper circles */}
            <circle cx="95" cy="110" r="25" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="185" cy="110" r="25" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="100" cy="110" r="15" fill="#3E2723" />
            <circle cx="190" cy="110" r="15" fill="#3E2723" />
            <circle cx="104" cy="106" r="5" fill="white" />
            <circle cx="194" cy="106" r="5" fill="white" />
            {/* Tongue - pink paper */}
            <ellipse cx="140" cy="210" rx="20" ry="35" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} className="animate-tongue-wag" />
            {/* Happy eyebrows */}
            <path d="M65,85 Q95,75 115,90" stroke="#5D4037" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M165,90 Q185,75 215,85" stroke="#5D4037" strokeWidth="6" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* BIRD - Colorful paper bird swooping */}
      {transition === 'bird-swoop' && (
        <div className="absolute -top-20 left-1/4 animate-bird-swoop" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="300" height="200" viewBox="0 0 300 200">
            {/* Body */}
            <ellipse cx="150" cy="100" rx="70" ry="45" fill="#1976D2" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="155" cy="95" rx="55" ry="35" fill="#2196F3" style={{ filter: 'url(#paperRough)' }} />
            {/* Wing - layered paper feathers */}
            <path d="M120,70 Q80,30 60,60 Q40,40 50,80 Q30,70 60,100 Q50,90 90,100" fill="#0D47A1" style={{ filter: 'url(#paperRough)' }} className="animate-wing-flap" />
            <path d="M130,75 Q100,45 85,70 Q70,55 80,90" fill="#1565C0" style={{ filter: 'url(#paperRough)' }} className="animate-wing-flap" />
            {/* Head */}
            <circle cx="220" cy="85" r="35" fill="#1976D2" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="225" cy="82" r="28" fill="#2196F3" style={{ filter: 'url(#paperRough)' }} />
            {/* Eye */}
            <circle cx="235" cy="80" r="12" fill="white" />
            <circle cx="238" cy="80" r="7" fill="#1a1a1a" />
            <circle cx="240" cy="78" r="2" fill="white" />
            {/* Beak - orange/yellow paper triangle */}
            <path d="M255,85 L290,95 L255,105 Z" fill="#FF9800" style={{ filter: 'url(#paperRough)' }} />
            <path d="M255,90 L280,95 L255,100 Z" fill="#FFC107" />
            {/* Tail feathers */}
            <path d="M80,100 Q50,90 30,110 Q60,105 80,110" fill="#0D47A1" style={{ filter: 'url(#paperRough)' }} />
            <path d="M85,105 Q55,100 40,125 Q65,115 85,115" fill="#1565C0" style={{ filter: 'url(#paperRough)' }} />
            <path d="M90,115 Q65,115 55,140 Q75,125 95,120" fill="#1976D2" style={{ filter: 'url(#paperRough)' }} />
          </svg>
        </div>
      )}

      {/* BEAR - Brown paper bear peeking */}
      {transition === 'bear-peek' && (
        <div className="absolute -bottom-20 right-10 animate-bear-peek" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="320" height="300" viewBox="0 0 320 300">
            {/* Body peeking up */}
            <ellipse cx="160" cy="280" rx="140" ry="80" fill="#4E342E" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <ellipse cx="160" cy="150" rx="100" ry="85" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="160" cy="155" rx="85" ry="70" fill="#6D4C41" style={{ filter: 'url(#paperRough)' }} />
            {/* Ears - round paper circles */}
            <circle cx="70" cy="80" r="35" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="70" cy="80" r="22" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="250" cy="80" r="35" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="250" cy="80" r="22" fill="#8D6E63" style={{ filter: 'url(#paperRough)' }} />
            {/* Snout */}
            <ellipse cx="160" cy="180" rx="45" ry="35" fill="#D7CCC8" style={{ filter: 'url(#paperRough)' }} />
            {/* Nose */}
            <ellipse cx="160" cy="165" rx="16" ry="12" fill="#212121" style={{ filter: 'url(#paperRough)' }} />
            {/* Eyes */}
            <circle cx="115" cy="130" r="20" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="205" cy="130" r="20" fill="white" style={{ filter: 'url(#paperRough)' }} />
            <circle cx="118" cy="130" r="12" fill="#1a1a1a" />
            <circle cx="208" cy="130" r="12" fill="#1a1a1a" />
            <circle cx="121" cy="127" r="4" fill="white" />
            <circle cx="211" cy="127" r="4" fill="white" />
            {/* Paws on "edge" */}
            <ellipse cx="80" cy="250" rx="35" ry="25" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
            <ellipse cx="240" cy="250" rx="35" ry="25" fill="#5D4037" style={{ filter: 'url(#paperRough)' }} />
          </svg>
        </div>
      )}

      {/* FROG - Green paper frog with long tongue */}
      {transition === 'frog-tongue' && (
        <>
          {/* Tongue - pink paper strip */}
          <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-6 animate-tongue-extend origin-bottom">
            <div className="w-full rounded-t-full" style={{ height: '45vh', background: '#F48FB1', filter: 'url(#paperRough)' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-5 rounded-full" style={{ background: '#EC407A' }} />
            </div>
          </div>
          {/* Frog */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 animate-frog-appear" style={{ filter: 'url(#cutoutShadow)' }}>
            <svg width="300" height="180" viewBox="0 0 300 180">
              {/* Body */}
              <ellipse cx="150" cy="140" rx="120" ry="60" fill="#388E3C" style={{ filter: 'url(#paperRough)' }} />
              <ellipse cx="150" cy="135" rx="100" ry="50" fill="#43A047" style={{ filter: 'url(#paperRough)' }} />
              {/* Head */}
              <ellipse cx="150" cy="100" rx="90" ry="55" fill="#4CAF50" style={{ filter: 'url(#paperRough)' }} />
              {/* Eyes - big bulging paper circles */}
              <circle cx="90" cy="50" r="40" fill="#4CAF50" style={{ filter: 'url(#paperRough)' }} />
              <circle cx="210" cy="50" r="40" fill="#4CAF50" style={{ filter: 'url(#paperRough)' }} />
              <circle cx="90" cy="50" r="28" fill="white" style={{ filter: 'url(#paperRough)' }} />
              <circle cx="210" cy="50" r="28" fill="white" style={{ filter: 'url(#paperRough)' }} />
              <circle cx="95" cy="50" r="16" fill="#1a1a1a" />
              <circle cx="215" cy="50" r="16" fill="#1a1a1a" />
              <circle cx="99" cy="46" r="5" fill="white" />
              <circle cx="219" cy="46" r="5" fill="white" />
              {/* Mouth - wide open */}
              <ellipse cx="150" cy="120" rx="50" ry="25" fill="#C62828" style={{ filter: 'url(#paperRough)' }} />
              {/* Spots */}
              <circle cx="100" cy="130" r="12" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
              <circle cx="200" cy="125" r="10" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
              <circle cx="150" cy="155" r="8" fill="#2E7D32" style={{ filter: 'url(#paperRough)' }} />
            </svg>
          </div>
        </>
      )}

      {/* BUTTERFLY - Colorful paper butterfly */}
      {transition === 'butterfly-flutter' && (
        <div className="absolute animate-butterfly-flutter" style={{ filter: 'url(#cutoutShadow)' }}>
          <svg width="250" height="200" viewBox="0 0 250 200">
            {/* Wings - layered colorful paper */}
            {/* Left wings */}
            <ellipse cx="70" cy="70" rx="55" ry="45" fill="#E91E63" style={{ filter: 'url(#paperRough)' }} className="animate-wing-left" />
            <ellipse cx="75" cy="75" rx="40" ry="32" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} className="animate-wing-left" />
            <ellipse cx="60" cy="130" rx="45" ry="35" fill="#9C27B0" style={{ filter: 'url(#paperRough)' }} className="animate-wing-left" />
            <ellipse cx="65" cy="128" rx="32" ry="25" fill="#CE93D8" style={{ filter: 'url(#paperRough)' }} className="animate-wing-left" />
            {/* Right wings */}
            <ellipse cx="180" cy="70" rx="55" ry="45" fill="#E91E63" style={{ filter: 'url(#paperRough)' }} className="animate-wing-right" />
            <ellipse cx="175" cy="75" rx="40" ry="32" fill="#F48FB1" style={{ filter: 'url(#paperRough)' }} className="animate-wing-right" />
            <ellipse cx="190" cy="130" rx="45" ry="35" fill="#9C27B0" style={{ filter: 'url(#paperRough)' }} className="animate-wing-right" />
            <ellipse cx="185" cy="128" rx="32" ry="25" fill="#CE93D8" style={{ filter: 'url(#paperRough)' }} className="animate-wing-right" />
            {/* Body */}
            <ellipse cx="125" cy="100" rx="12" ry="55" fill="#4A148C" style={{ filter: 'url(#paperRough)' }} />
            {/* Head */}
            <circle cx="125" cy="45" r="15" fill="#4A148C" style={{ filter: 'url(#paperRough)' }} />
            {/* Antennae */}
            <path d="M115,35 Q100,10 95,20" stroke="#4A148C" strokeWidth="3" fill="none" />
            <circle cx="95" cy="20" r="5" fill="#E91E63" />
            <path d="M135,35 Q150,10 155,20" stroke="#4A148C" strokeWidth="3" fill="none" />
            <circle cx="155" cy="20" r="5" fill="#E91E63" />
            {/* Eyes */}
            <circle cx="120" cy="42" r="5" fill="white" />
            <circle cx="130" cy="42" r="5" fill="white" />
            <circle cx="121" cy="42" r="3" fill="#1a1a1a" />
            <circle cx="131" cy="42" r="3" fill="#1a1a1a" />
            {/* Wing patterns - dots */}
            <circle cx="55" cy="65" r="8" fill="#FFC107" />
            <circle cx="85" cy="55" r="6" fill="#FFC107" />
            <circle cx="195" cy="65" r="8" fill="#FFC107" />
            <circle cx="165" cy="55" r="6" fill="#FFC107" />
          </svg>
        </div>
      )}

      {/* Flying paper scraps */}
      {paperScraps.map((scrap) => (
        <div
          key={scrap.id}
          className="absolute animate-paper-fly"
          style={{
            left: `${scrap.x}%`,
            top: '50%',
            '--end-x': `${(Math.random() - 0.5) * 300}px`,
            '--end-y': `${(Math.random() - 0.5) * 300}px`,
            '--rotation': `${scrap.rotation + Math.random() * 360}deg`,
            animationDelay: `${0.3 + scrap.delay}s`,
          } as React.CSSProperties}
        >
          <div
            className="rounded-sm"
            style={{
              width: scrap.size,
              height: scrap.size * 0.8,
              backgroundColor: scrap.color,
              transform: `rotate(${scrap.rotation}deg)`,
              filter: 'url(#paperRough)',
            }}
          />
        </div>
      ))}

      {/* Sound effect - paper cutout style text */}
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

        @keyframes flash-dim {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash-dim {
          animation: flash-dim 2.5s ease-out forwards;
        }

        @keyframes dino-chomp {
          0% { transform: translateX(100px); }
          25% { transform: translateX(-200px) rotate(-5deg); }
          35% { transform: translateX(-200px) rotate(8deg); }
          45% { transform: translateX(-200px) rotate(-8deg); }
          55% { transform: translateX(-200px) rotate(5deg); }
          75% { transform: translateX(-200px); }
          100% { transform: translateX(150px); }
        }
        .animate-dino-chomp {
          animation: dino-chomp 2.2s ease-in-out forwards;
        }

        @keyframes monster-grab {
          0% { transform: translateX(-50%) translateY(100%); }
          35% { transform: translateX(-50%) translateY(30%); }
          50% { transform: translateX(-50%) translateY(10%) rotate(-5deg); }
          65% { transform: translateX(-50%) translateY(10%) rotate(5deg); }
          100% { transform: translateX(-50%) translateY(120%); }
        }
        .animate-monster-grab {
          animation: monster-grab 2.2s ease-in-out forwards;
        }

        @keyframes cat-swipe {
          0% { transform: translateX(0) rotate(0); }
          40% { transform: translateX(calc(100vw + 100px)) rotate(10deg); }
          100% { transform: translateX(calc(100vw + 200px)) rotate(15deg); }
        }
        .animate-cat-swipe {
          animation: cat-swipe 1.2s ease-out forwards;
        }

        @keyframes dog-head-shake {
          0% { transform: translateX(-50%) scale(0.8) rotate(-10deg); opacity: 0; }
          20% { transform: translateX(-50%) scale(1) rotate(0); opacity: 1; }
          30% { transform: translateX(-50%) rotate(15deg); }
          40% { transform: translateX(-50%) rotate(-15deg); }
          50% { transform: translateX(-50%) rotate(12deg); }
          60% { transform: translateX(-50%) rotate(-12deg); }
          70% { transform: translateX(-50%) rotate(8deg); }
          80% { transform: translateX(-50%) rotate(-5deg); }
          90% { transform: translateX(-50%) scale(1) rotate(0); }
          100% { transform: translateX(-50%) scale(0.8) rotate(10deg); opacity: 0; }
        }
        .animate-dog-head-shake {
          animation: dog-head-shake 2s ease-in-out forwards;
        }

        @keyframes tongue-wag {
          0%, 100% { transform: translateX(-3px); }
          50% { transform: translateX(3px); }
        }
        .animate-tongue-wag {
          animation: tongue-wag 0.15s ease-in-out infinite;
        }

        @keyframes bird-swoop {
          0% { transform: translate(0, 0) rotate(-20deg); }
          30% { transform: translate(100px, 150px) rotate(10deg); }
          60% { transform: translate(250px, 80px) rotate(-5deg); }
          100% { transform: translate(calc(100vw + 100px), 200px) rotate(15deg); }
        }
        .animate-bird-swoop {
          animation: bird-swoop 2s ease-in-out forwards;
        }

        @keyframes wing-flap {
          0%, 100% { transform: rotate(0) scaleY(1); }
          50% { transform: rotate(-20deg) scaleY(0.8); }
        }
        .animate-wing-flap {
          animation: wing-flap 0.2s ease-in-out infinite;
          transform-origin: right center;
        }

        @keyframes bear-peek {
          0% { transform: translateY(100%); }
          30% { transform: translateY(20%); }
          50% { transform: translateY(0) rotate(-3deg); }
          70% { transform: translateY(0) rotate(3deg); }
          85% { transform: translateY(0); }
          100% { transform: translateY(110%); }
        }
        .animate-bear-peek {
          animation: bear-peek 2.5s ease-in-out forwards;
        }

        @keyframes frog-appear {
          0% { transform: translateX(-50%) translateY(100%); }
          25% { transform: translateX(-50%) translateY(0); }
          75% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(100%); }
        }
        .animate-frog-appear {
          animation: frog-appear 2.2s ease-out forwards;
        }

        @keyframes tongue-extend {
          0% { transform: scaleY(0); }
          15% { transform: scaleY(1); }
          25% { transform: scaleY(1.15); }
          35% { transform: scaleY(0.95); }
          50% { transform: scaleY(1); }
          75% { transform: scaleY(1); }
          100% { transform: scaleY(0); }
        }
        .animate-tongue-extend {
          animation: tongue-extend 2.2s ease-in-out forwards;
        }

        @keyframes butterfly-flutter {
          0% { left: -100px; top: 60%; transform: rotate(-10deg); }
          25% { left: 30%; top: 30%; transform: rotate(5deg); }
          50% { left: 50%; top: 50%; transform: rotate(-5deg); }
          75% { left: 70%; top: 25%; transform: rotate(10deg); }
          100% { left: calc(100% + 100px); top: 40%; transform: rotate(-5deg); }
        }
        .animate-butterfly-flutter {
          animation: butterfly-flutter 2.5s ease-in-out forwards;
        }

        @keyframes wing-left {
          0%, 100% { transform: scaleX(1) rotate(0); }
          50% { transform: scaleX(0.6) rotate(10deg); }
        }
        .animate-wing-left {
          animation: wing-left 0.15s ease-in-out infinite;
          transform-origin: right center;
        }

        @keyframes wing-right {
          0%, 100% { transform: scaleX(1) rotate(0); }
          50% { transform: scaleX(0.6) rotate(-10deg); }
        }
        .animate-wing-right {
          animation: wing-right 0.15s ease-in-out infinite;
          transform-origin: left center;
        }

        @keyframes paper-fly {
          0% { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
          100% {
            transform: translate(var(--end-x), var(--end-y)) rotate(var(--rotation)) scale(0.3);
            opacity: 0;
          }
        }
        .animate-paper-fly {
          animation: paper-fly 1.5s ease-out forwards;
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
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
}
