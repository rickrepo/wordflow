// Age-appropriate stories and books for WordFlow

export type GradeLevel = 'jk' | 'sk' | 'grade1' | 'grade2' | 'grade3';

export interface Story {
  id: string;
  title: string;
  author: string;
  coverEmoji: string;
  gradeLevel: GradeLevel;
  pages: string[];
  theme: 'adventure' | 'animals' | 'fantasy' | 'nature' | 'friendship';
}

export const gradeLevelInfo: Record<GradeLevel, { name: string; ageRange: string; color: string; bgGradient: string }> = {
  jk: {
    name: 'Junior Kindergarten',
    ageRange: '3-4 years',
    color: '#FF6B9D',
    bgGradient: 'from-pink-400 to-rose-500'
  },
  sk: {
    name: 'Senior Kindergarten',
    ageRange: '4-5 years',
    color: '#9D6BFF',
    bgGradient: 'from-purple-400 to-violet-500'
  },
  grade1: {
    name: 'Grade 1',
    ageRange: '5-6 years',
    color: '#6B9DFF',
    bgGradient: 'from-blue-400 to-indigo-500'
  },
  grade2: {
    name: 'Grade 2',
    ageRange: '6-7 years',
    color: '#6BFFB8',
    bgGradient: 'from-emerald-400 to-teal-500'
  },
  grade3: {
    name: 'Grade 3',
    ageRange: '7-8 years',
    color: '#FFB86B',
    bgGradient: 'from-amber-400 to-orange-500'
  },
};

// JK Stories - Very simple, 2-3 word sentences, common sight words
const jkStories: Story[] = [
  {
    id: 'jk-cat',
    title: 'The Cat',
    author: 'WordFlow',
    coverEmoji: '🐱',
    gradeLevel: 'jk',
    theme: 'animals',
    pages: [
      'I see a cat.',
      'The cat is big.',
      'The cat is soft.',
      'I pet the cat.',
      'The cat is happy.',
    ]
  },
  {
    id: 'jk-ball',
    title: 'My Ball',
    author: 'WordFlow',
    coverEmoji: '⚽',
    gradeLevel: 'jk',
    theme: 'adventure',
    pages: [
      'I have a ball.',
      'The ball is red.',
      'I kick the ball.',
      'The ball goes up.',
      'I love my ball!',
    ]
  },
  {
    id: 'jk-dog',
    title: 'My Dog',
    author: 'WordFlow',
    coverEmoji: '🐕',
    gradeLevel: 'jk',
    theme: 'animals',
    pages: [
      'I have a dog.',
      'My dog is fun.',
      'My dog can run.',
      'I run with my dog.',
      'We are happy!',
    ]
  },
];

// SK Stories - Simple sentences, 4-5 words, basic patterns
const skStories: Story[] = [
  {
    id: 'sk-frog',
    title: 'The Little Frog',
    author: 'WordFlow',
    coverEmoji: '🐸',
    gradeLevel: 'sk',
    theme: 'animals',
    pages: [
      'A little frog sat on a log.',
      'The frog saw a big fly.',
      'The frog went hop, hop, hop!',
      'The frog got the fly.',
      'The little frog was so happy!',
    ]
  },
  {
    id: 'sk-sun',
    title: 'Good Morning Sun',
    author: 'WordFlow',
    coverEmoji: '☀️',
    gradeLevel: 'sk',
    theme: 'nature',
    pages: [
      'The sun comes up in the sky.',
      'The sun is big and yellow.',
      'The sun makes me feel warm.',
      'I play in the sun all day.',
      'Good night, sun! See you soon!',
    ]
  },
  {
    id: 'sk-fish',
    title: 'The Blue Fish',
    author: 'WordFlow',
    coverEmoji: '🐟',
    gradeLevel: 'sk',
    theme: 'animals',
    pages: [
      'I see a fish in the water.',
      'The fish is blue and small.',
      'The fish swims fast and far.',
      'The fish has a little friend.',
      'They swim and play all day!',
    ]
  },
];

// Grade 1 Stories - Longer sentences, more vocabulary
const grade1Stories: Story[] = [
  {
    id: 'g1-dragon',
    title: 'The Friendly Dragon',
    author: 'WordFlow',
    coverEmoji: '🐉',
    gradeLevel: 'grade1',
    theme: 'fantasy',
    pages: [
      'Once there was a dragon who lived in a cave.',
      'The dragon was green with big wings.',
      'But this dragon did not like to be scary.',
      'He wanted to make friends with the children.',
      'One day, a little girl came to his cave.',
      'She was not afraid of the dragon.',
      'They played together all afternoon.',
      'Now the dragon has many friends!',
    ]
  },
  {
    id: 'g1-rainbow',
    title: 'The Rainbow Garden',
    author: 'WordFlow',
    coverEmoji: '🌈',
    gradeLevel: 'grade1',
    theme: 'nature',
    pages: [
      'After the rain, something magic happened.',
      'A beautiful rainbow filled the sky.',
      'It had red, orange, yellow, and green.',
      'It also had blue, and purple too!',
      'The rainbow touched the garden below.',
      'All the flowers started to glow.',
      'Each flower was a different color.',
      'It was the most beautiful garden ever!',
    ]
  },
  {
    id: 'g1-puppy',
    title: 'My New Puppy',
    author: 'WordFlow',
    coverEmoji: '🐶',
    gradeLevel: 'grade1',
    theme: 'animals',
    pages: [
      'Today I got a new puppy!',
      'She has soft brown fur and a wet nose.',
      'Her tail wags when she is happy.',
      'I named her Bella because she is beautiful.',
      'Bella loves to run and play with me.',
      'She also loves to take long naps.',
      'I give her food and water every day.',
      'Bella is my best friend forever!',
    ]
  },
  {
    id: 'g1-mila',
    title: 'Mila and the Hula Hoops',
    author: 'WordFlow',
    coverEmoji: '🌀',
    gradeLevel: 'grade1',
    theme: 'adventure',
    pages: [
      'Mila loved hula hoops more than anything.',
      'She could spin one hoop around her waist.',
      'Then she added two hoops at the same time!',
      'She tried three hoops and they all kept spinning.',
      'Her friends watched and cheered for her.',
      'Mila even tried a hoop on her arm.',
      'She danced and spun all around the yard.',
      'Mila smiled because hula hoops make her happy!',
    ]
  },
  {
    id: 'g1-eric',
    title: 'Eric and the Fast Cars',
    author: 'WordFlow',
    coverEmoji: '🏎️',
    gradeLevel: 'grade1',
    theme: 'adventure',
    pages: [
      'Eric loved cars more than anything.',
      'He had a big red car and a small blue one.',
      'He liked to race them down the driveway.',
      'The red car was fast but the blue car was faster!',
      'Eric made a ramp out of an old box.',
      'The cars flew off the ramp into the air!',
      'His little sister wanted to race cars too.',
      'Now Eric and his sister race cars every day!',
    ]
  },
];

// Grade 2 Stories - More complex sentences and vocabulary
const grade2Stories: Story[] = [
  {
    id: 'g2-space',
    title: 'Journey to the Stars',
    author: 'WordFlow',
    coverEmoji: '🚀',
    gradeLevel: 'grade2',
    theme: 'adventure',
    pages: [
      'Maya always dreamed of visiting the stars.',
      'One night, something amazing happened.',
      'A sparkly spaceship landed in her backyard!',
      'A friendly alien invited her aboard.',
      'They zoomed past the moon and planets.',
      'Maya saw Saturn with its beautiful rings.',
      'She waved at astronauts on a space station.',
      'The stars twinkled like diamonds all around.',
      'When Maya got home, she smiled at the sky.',
      'She knew her friends up there were watching.',
    ]
  },
  {
    id: 'g2-ocean',
    title: 'Secrets of the Ocean',
    author: 'WordFlow',
    coverEmoji: '🐙',
    gradeLevel: 'grade2',
    theme: 'nature',
    pages: [
      'Deep beneath the waves, a world comes alive.',
      'Colorful fish swim through coral gardens.',
      'An octopus hides among the rocks.',
      'A sea turtle glides gracefully through the water.',
      'Dolphins jump and play near the surface.',
      'A whale sings a beautiful, deep song.',
      'Jellyfish float like glowing lanterns.',
      'Starfish rest on the sandy ocean floor.',
      'The ocean holds so many amazing secrets.',
      'What wonderful creatures will we discover next?',
    ]
  },
  {
    id: 'g2-treehouse',
    title: 'The Magic Treehouse',
    author: 'WordFlow',
    coverEmoji: '🏡',
    gradeLevel: 'grade2',
    theme: 'fantasy',
    pages: [
      'In the old oak tree stood a special treehouse.',
      'Jake and Emma discovered it one summer day.',
      'When they climbed inside, books were everywhere!',
      'Each book could take them on an adventure.',
      'They read about knights and castles long ago.',
      'Suddenly, the treehouse began to spin!',
      'When it stopped, they were in a real castle!',
      'They met a princess who needed their help.',
      'Together, they solved the mystery of the lost crown.',
      'The magic treehouse brought them safely home.',
    ]
  },
];

// Grade 3 Stories - Chapter-style, complex vocabulary and sentences
const grade3Stories: Story[] = [
  {
    id: 'g3-inventor',
    title: 'The Young Inventor',
    author: 'WordFlow',
    coverEmoji: '💡',
    gradeLevel: 'grade3',
    theme: 'adventure',
    pages: [
      'Sophia was always building and creating things.',
      'Her bedroom looked like a workshop full of gadgets.',
      'One day, she decided to build a robot helper.',
      'She collected old parts from around the house.',
      'Gears, wires, and buttons covered her desk.',
      'After many tries, the robot finally worked!',
      'She named it Sparky because it made little sparks.',
      'Sparky helped Sophia clean her room in minutes.',
      'It could even bring her snacks from the kitchen!',
      'But the best part was that Sparky became her friend.',
      'Together, they dreamed up even bigger inventions.',
      'Sophia knew anything was possible with imagination.',
    ]
  },
  {
    id: 'g3-forest',
    title: 'Guardians of the Forest',
    author: 'WordFlow',
    coverEmoji: '🌲',
    gradeLevel: 'grade3',
    theme: 'nature',
    pages: [
      'The ancient forest held many wonderful secrets.',
      'Animals lived together in perfect harmony there.',
      'But one day, a terrible storm threatened the woods.',
      'Thunder crashed and lightning split the dark sky.',
      'The wise old owl called all creatures together.',
      'Each animal had a special talent to share.',
      'The beavers built a dam to control the flooding.',
      'Birds carried seeds to replant damaged areas.',
      'Squirrels stored extra food for everyone to share.',
      'The deer led the young animals to safety.',
      'When the storm finally passed, the forest remained.',
      'Working together, they had protected their home.',
    ]
  },
  {
    id: 'g3-detective',
    title: 'The Playground Mystery',
    author: 'WordFlow',
    coverEmoji: '🔍',
    gradeLevel: 'grade3',
    theme: 'adventure',
    pages: [
      'Something strange was happening at Maple Elementary.',
      'Every day, items from the playground disappeared.',
      'First it was a basketball, then some jump ropes.',
      'Marcus decided to investigate the mystery.',
      'He interviewed students and took careful notes.',
      'He noticed footprints leading toward the old shed.',
      'With his friend Lily, he followed the trail.',
      'Inside the shed, they found all the missing items!',
      'A family of raccoons had made a cozy nest there.',
      'The furry thieves had been collecting treasures.',
      'The principal helped relocate the raccoon family.',
      'Marcus became known as the school detective hero!',
    ]
  },
];

export const allStories: Story[] = [
  ...jkStories,
  ...skStories,
  ...grade1Stories,
  ...grade2Stories,
  ...grade3Stories,
];

export function getStoriesByGrade(gradeLevel: GradeLevel): Story[] {
  return allStories.filter(story => story.gradeLevel === gradeLevel);
}

export function getStoryById(id: string): Story | undefined {
  return allStories.find(story => story.id === id);
}
