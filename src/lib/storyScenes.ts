// Story scene configurations for immersive backgrounds
// Each story gets a custom scene that transforms the entire screen

export interface SceneElement {
  emoji: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'bottom';
  size: 'sm' | 'md' | 'lg' | 'xl';
  animation: 'float' | 'sway' | 'bounce' | 'none';
  delay: number; // animation delay in seconds
  opacity: number; // 0-1
}

export interface StoryScene {
  // Background gradient colors
  bgFrom: string;
  bgTo: string;
  bgVia?: string;

  // Decorative elements around the reading area
  elements: SceneElement[];

  // Ambient color overlay (very subtle)
  ambientColor?: string;
}

// Position mappings for responsive placement
export const positionClasses: Record<SceneElement['position'], string> = {
  'top-left': 'top-8 left-4 md:top-12 md:left-8',
  'top-right': 'top-8 right-4 md:top-12 md:right-8',
  'bottom-left': 'bottom-24 left-4 md:bottom-32 md:left-8',
  'bottom-right': 'bottom-24 right-4 md:bottom-32 md:right-8',
  'left': 'top-1/2 left-4 md:left-8 -translate-y-1/2',
  'right': 'top-1/2 right-4 md:right-8 -translate-y-1/2',
  'top': 'top-20 left-1/2 -translate-x-1/2',
  'bottom': 'bottom-32 left-1/2 -translate-x-1/2',
};

export const sizeClasses: Record<SceneElement['size'], string> = {
  'sm': 'text-2xl md:text-3xl',
  'md': 'text-3xl md:text-4xl',
  'lg': 'text-4xl md:text-5xl',
  'xl': 'text-5xl md:text-6xl',
};

export const animationClasses: Record<SceneElement['animation'], string> = {
  'float': 'animate-float-slow',
  'sway': 'animate-sway',
  'bounce': 'animate-bounce-slow',
  'none': '',
};

// Scene configurations for each story
export const storyScenes: Record<string, StoryScene> = {
  // JK Stories
  'jk-cat': {
    bgFrom: 'from-amber-50',
    bgVia: 'via-orange-50',
    bgTo: 'to-yellow-50',
    elements: [
      { emoji: '🐱', position: 'top-left', size: 'lg', animation: 'sway', delay: 0, opacity: 0.4 },
      { emoji: '🧶', position: 'bottom-right', size: 'md', animation: 'bounce', delay: 0.5, opacity: 0.35 },
      { emoji: '🐾', position: 'top-right', size: 'sm', animation: 'float', delay: 1, opacity: 0.25 },
      { emoji: '🐾', position: 'bottom-left', size: 'sm', animation: 'float', delay: 1.5, opacity: 0.25 },
      { emoji: '☀️', position: 'top', size: 'md', animation: 'float', delay: 0.3, opacity: 0.3 },
    ],
  },
  'jk-ball': {
    bgFrom: 'from-green-50',
    bgVia: 'via-emerald-50',
    bgTo: 'to-teal-50',
    elements: [
      { emoji: '⚽', position: 'top-right', size: 'lg', animation: 'bounce', delay: 0, opacity: 0.4 },
      { emoji: '🏃', position: 'bottom-left', size: 'md', animation: 'sway', delay: 0.5, opacity: 0.35 },
      { emoji: '🌳', position: 'left', size: 'lg', animation: 'sway', delay: 0.2, opacity: 0.3 },
      { emoji: '🌳', position: 'right', size: 'lg', animation: 'sway', delay: 0.7, opacity: 0.3 },
      { emoji: '☀️', position: 'top-left', size: 'md', animation: 'float', delay: 0, opacity: 0.35 },
    ],
  },
  'jk-dog': {
    bgFrom: 'from-sky-50',
    bgVia: 'via-blue-50',
    bgTo: 'to-cyan-50',
    elements: [
      { emoji: '🐕', position: 'top-left', size: 'lg', animation: 'bounce', delay: 0, opacity: 0.4 },
      { emoji: '🦴', position: 'bottom-right', size: 'md', animation: 'sway', delay: 0.5, opacity: 0.35 },
      { emoji: '🐾', position: 'top-right', size: 'sm', animation: 'float', delay: 1, opacity: 0.25 },
      { emoji: '🌿', position: 'bottom-left', size: 'md', animation: 'sway', delay: 0.3, opacity: 0.3 },
      { emoji: '🏠', position: 'right', size: 'md', animation: 'none', delay: 0, opacity: 0.25 },
    ],
  },

  // SK Stories
  'sk-frog': {
    bgFrom: 'from-green-100',
    bgVia: 'via-emerald-50',
    bgTo: 'to-lime-50',
    elements: [
      { emoji: '🐸', position: 'bottom-left', size: 'lg', animation: 'bounce', delay: 0, opacity: 0.45 },
      { emoji: '🪷', position: 'bottom-right', size: 'md', animation: 'float', delay: 0.5, opacity: 0.35 },
      { emoji: '🪵', position: 'bottom', size: 'lg', animation: 'none', delay: 0, opacity: 0.3 },
      { emoji: '🦟', position: 'top-right', size: 'sm', animation: 'float', delay: 1, opacity: 0.3 },
      { emoji: '💧', position: 'top-left', size: 'sm', animation: 'bounce', delay: 0.8, opacity: 0.25 },
    ],
  },
  'sk-sun': {
    bgFrom: 'from-yellow-100',
    bgVia: 'via-orange-50',
    bgTo: 'to-amber-50',
    elements: [
      { emoji: '☀️', position: 'top', size: 'xl', animation: 'float', delay: 0, opacity: 0.5 },
      { emoji: '🌻', position: 'bottom-left', size: 'md', animation: 'sway', delay: 0.3, opacity: 0.4 },
      { emoji: '🌻', position: 'bottom-right', size: 'md', animation: 'sway', delay: 0.6, opacity: 0.4 },
      { emoji: '☁️', position: 'top-left', size: 'md', animation: 'float', delay: 1, opacity: 0.3 },
      { emoji: '☁️', position: 'top-right', size: 'lg', animation: 'float', delay: 1.5, opacity: 0.25 },
    ],
  },
  'sk-fish': {
    bgFrom: 'from-blue-100',
    bgVia: 'via-cyan-50',
    bgTo: 'to-sky-50',
    elements: [
      { emoji: '🐟', position: 'top-left', size: 'lg', animation: 'float', delay: 0, opacity: 0.4 },
      { emoji: '🐠', position: 'bottom-right', size: 'md', animation: 'float', delay: 0.5, opacity: 0.35 },
      { emoji: '🫧', position: 'top-right', size: 'sm', animation: 'float', delay: 1, opacity: 0.25 },
      { emoji: '🫧', position: 'left', size: 'sm', animation: 'float', delay: 1.2, opacity: 0.2 },
      { emoji: '🪸', position: 'bottom-left', size: 'md', animation: 'sway', delay: 0.3, opacity: 0.35 },
      { emoji: '🐚', position: 'bottom', size: 'sm', animation: 'none', delay: 0, opacity: 0.3 },
    ],
  },

  // Grade 1 Stories
  'g1-dragon': {
    bgFrom: 'from-purple-100',
    bgVia: 'via-violet-50',
    bgTo: 'to-fuchsia-50',
    elements: [
      { emoji: '🐉', position: 'top-left', size: 'xl', animation: 'float', delay: 0, opacity: 0.4 },
      { emoji: '🏰', position: 'bottom-right', size: 'lg', animation: 'none', delay: 0, opacity: 0.35 },
      { emoji: '✨', position: 'top-right', size: 'sm', animation: 'float', delay: 0.5, opacity: 0.35 },
      { emoji: '✨', position: 'left', size: 'sm', animation: 'float', delay: 1, opacity: 0.3 },
      { emoji: '⛰️', position: 'bottom-left', size: 'md', animation: 'none', delay: 0, opacity: 0.3 },
      { emoji: '🌙', position: 'top', size: 'md', animation: 'sway', delay: 0.3, opacity: 0.25 },
    ],
  },
  'g1-rainbow': {
    bgFrom: 'from-pink-50',
    bgVia: 'via-purple-50',
    bgTo: 'to-blue-50',
    elements: [
      { emoji: '🌈', position: 'top', size: 'xl', animation: 'none', delay: 0, opacity: 0.5 },
      { emoji: '🌸', position: 'bottom-left', size: 'md', animation: 'sway', delay: 0.3, opacity: 0.4 },
      { emoji: '🌷', position: 'bottom-right', size: 'md', animation: 'sway', delay: 0.5, opacity: 0.4 },
      { emoji: '🦋', position: 'top-left', size: 'sm', animation: 'float', delay: 1, opacity: 0.35 },
      { emoji: '🦋', position: 'right', size: 'sm', animation: 'float', delay: 1.5, opacity: 0.3 },
      { emoji: '☁️', position: 'top-right', size: 'md', animation: 'float', delay: 0.8, opacity: 0.25 },
    ],
  },
  'g1-puppy': {
    bgFrom: 'from-amber-50',
    bgVia: 'via-yellow-50',
    bgTo: 'to-orange-50',
    elements: [
      { emoji: '🐶', position: 'bottom-left', size: 'lg', animation: 'bounce', delay: 0, opacity: 0.45 },
      { emoji: '🏡', position: 'top-right', size: 'md', animation: 'none', delay: 0, opacity: 0.3 },
      { emoji: '🦴', position: 'bottom-right', size: 'md', animation: 'sway', delay: 0.5, opacity: 0.35 },
      { emoji: '🐾', position: 'top-left', size: 'sm', animation: 'float', delay: 1, opacity: 0.25 },
      { emoji: '🌳', position: 'right', size: 'lg', animation: 'sway', delay: 0.3, opacity: 0.3 },
      { emoji: '❤️', position: 'top', size: 'sm', animation: 'bounce', delay: 0.8, opacity: 0.35 },
    ],
  },

  // Grade 2 Stories
  'g2-space': {
    bgFrom: 'from-indigo-100',
    bgVia: 'via-purple-100',
    bgTo: 'to-slate-900',
    elements: [
      { emoji: '🚀', position: 'top-left', size: 'lg', animation: 'float', delay: 0, opacity: 0.45 },
      { emoji: '🌙', position: 'top-right', size: 'lg', animation: 'sway', delay: 0.3, opacity: 0.4 },
      { emoji: '⭐', position: 'left', size: 'sm', animation: 'float', delay: 0.5, opacity: 0.35 },
      { emoji: '⭐', position: 'right', size: 'sm', animation: 'float', delay: 1, opacity: 0.3 },
      { emoji: '🪐', position: 'bottom-right', size: 'lg', animation: 'float', delay: 0.8, opacity: 0.4 },
      { emoji: '👽', position: 'bottom-left', size: 'md', animation: 'sway', delay: 1.2, opacity: 0.35 },
    ],
  },
  'g2-ocean': {
    bgFrom: 'from-cyan-100',
    bgVia: 'via-blue-100',
    bgTo: 'to-indigo-100',
    elements: [
      { emoji: '🐙', position: 'bottom-left', size: 'lg', animation: 'float', delay: 0, opacity: 0.4 },
      { emoji: '🐢', position: 'top-right', size: 'md', animation: 'float', delay: 0.5, opacity: 0.35 },
      { emoji: '🐬', position: 'top-left', size: 'md', animation: 'float', delay: 0.3, opacity: 0.4 },
      { emoji: '🐋', position: 'right', size: 'lg', animation: 'float', delay: 1, opacity: 0.35 },
      { emoji: '🪼', position: 'left', size: 'md', animation: 'float', delay: 1.5, opacity: 0.3 },
      { emoji: '🪸', position: 'bottom-right', size: 'md', animation: 'sway', delay: 0.8, opacity: 0.35 },
      { emoji: '🫧', position: 'bottom', size: 'sm', animation: 'float', delay: 1.2, opacity: 0.25 },
    ],
  },
  'g2-treehouse': {
    bgFrom: 'from-green-100',
    bgVia: 'via-emerald-50',
    bgTo: 'to-amber-50',
    elements: [
      { emoji: '🏡', position: 'top-left', size: 'lg', animation: 'sway', delay: 0, opacity: 0.4 },
      { emoji: '🌳', position: 'left', size: 'xl', animation: 'sway', delay: 0.2, opacity: 0.4 },
      { emoji: '📚', position: 'bottom-right', size: 'md', animation: 'float', delay: 0.5, opacity: 0.35 },
      { emoji: '🍂', position: 'top-right', size: 'sm', animation: 'float', delay: 1, opacity: 0.3 },
      { emoji: '🐿️', position: 'right', size: 'md', animation: 'bounce', delay: 0.8, opacity: 0.35 },
      { emoji: '✨', position: 'top', size: 'sm', animation: 'float', delay: 1.2, opacity: 0.3 },
    ],
  },

  // Grade 3 Stories
  'g3-inventor': {
    bgFrom: 'from-slate-100',
    bgVia: 'via-zinc-50',
    bgTo: 'to-amber-50',
    elements: [
      { emoji: '💡', position: 'top-left', size: 'lg', animation: 'float', delay: 0, opacity: 0.45 },
      { emoji: '🤖', position: 'bottom-right', size: 'lg', animation: 'bounce', delay: 0.3, opacity: 0.4 },
      { emoji: '⚙️', position: 'top-right', size: 'md', animation: 'none', delay: 0, opacity: 0.3 },
      { emoji: '🔧', position: 'left', size: 'md', animation: 'sway', delay: 0.5, opacity: 0.3 },
      { emoji: '⚡', position: 'bottom-left', size: 'sm', animation: 'float', delay: 1, opacity: 0.35 },
      { emoji: '🔩', position: 'right', size: 'sm', animation: 'float', delay: 1.2, opacity: 0.25 },
    ],
  },
  'g3-forest': {
    bgFrom: 'from-green-100',
    bgVia: 'via-emerald-100',
    bgTo: 'to-teal-50',
    elements: [
      { emoji: '🌲', position: 'left', size: 'xl', animation: 'sway', delay: 0, opacity: 0.4 },
      { emoji: '🌲', position: 'right', size: 'xl', animation: 'sway', delay: 0.3, opacity: 0.4 },
      { emoji: '🦉', position: 'top-left', size: 'md', animation: 'sway', delay: 0.5, opacity: 0.4 },
      { emoji: '🦌', position: 'bottom-right', size: 'md', animation: 'bounce', delay: 0.8, opacity: 0.35 },
      { emoji: '🐿️', position: 'top-right', size: 'sm', animation: 'bounce', delay: 1, opacity: 0.35 },
      { emoji: '🍄', position: 'bottom-left', size: 'sm', animation: 'none', delay: 0, opacity: 0.3 },
      { emoji: '🦫', position: 'bottom', size: 'md', animation: 'sway', delay: 1.2, opacity: 0.35 },
    ],
  },
  'g3-detective': {
    bgFrom: 'from-amber-100',
    bgVia: 'via-yellow-50',
    bgTo: 'to-orange-50',
    elements: [
      { emoji: '🔍', position: 'top-left', size: 'lg', animation: 'float', delay: 0, opacity: 0.45 },
      { emoji: '🏫', position: 'top-right', size: 'md', animation: 'none', delay: 0, opacity: 0.3 },
      { emoji: '🦝', position: 'bottom-right', size: 'lg', animation: 'bounce', delay: 0.5, opacity: 0.4 },
      { emoji: '🏀', position: 'bottom-left', size: 'md', animation: 'bounce', delay: 0.8, opacity: 0.35 },
      { emoji: '📝', position: 'left', size: 'sm', animation: 'sway', delay: 1, opacity: 0.3 },
      { emoji: '👣', position: 'bottom', size: 'sm', animation: 'none', delay: 0, opacity: 0.25 },
    ],
  },
};

// Default scene for stories without custom configuration
export const defaultScene: StoryScene = {
  bgFrom: 'from-blue-50',
  bgVia: 'via-white',
  bgTo: 'to-purple-50',
  elements: [
    { emoji: '📖', position: 'top-left', size: 'md', animation: 'float', delay: 0, opacity: 0.3 },
    { emoji: '✨', position: 'top-right', size: 'sm', animation: 'float', delay: 0.5, opacity: 0.25 },
    { emoji: '⭐', position: 'bottom-left', size: 'sm', animation: 'float', delay: 1, opacity: 0.25 },
  ],
};

export function getStoryScene(storyId: string): StoryScene {
  return storyScenes[storyId] || defaultScene;
}
