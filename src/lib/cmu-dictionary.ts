// CMU Pronouncing Dictionary subset for common children's words
// Format: WORD -> array of phonemes (ARPAbet notation)
// Phonemes with numbers indicate stress (0=no stress, 1=primary, 2=secondary)

export const cmuDictionary: Record<string, string[]> = {
  // Story words
  once: ["W", "AH1", "N", "S"],
  upon: ["AH0", "P", "AA1", "N"],
  a: ["AH0"],
  time: ["T", "AY1", "M"],
  there: ["DH", "EH1", "R"],
  was: ["W", "AA1", "Z"],
  little: ["L", "IH1", "T", "AH0", "L"],
  cat: ["K", "AE1", "T"],
  named: ["N", "EY1", "M", "D"],
  whiskers: ["W", "IH1", "S", "K", "ER0", "Z"],
  loved: ["L", "AH1", "V", "D"],
  to: ["T", "UW1"],
  play: ["P", "L", "EY1"],
  in: ["IH0", "N"],
  the: ["DH", "AH0"],
  sunny: ["S", "AH1", "N", "IY0"],
  garden: ["G", "AA1", "R", "D", "AH0", "N"],
  one: ["W", "AH1", "N"],
  day: ["D", "EY1"],
  she: ["SH", "IY1"],
  found: ["F", "AW1", "N", "D"],
  big: ["B", "IH1", "G"],
  red: ["R", "EH1", "D"],
  ball: ["B", "AO1", "L"],
  bounced: ["B", "AW1", "N", "S", "T"],
  high: ["HH", "AY1"],
  into: ["IH1", "N", "T", "UW0"],
  sky: ["S", "K", "AY1"],
  jumped: ["JH", "AH1", "M", "P", "T"],
  and: ["AE1", "N", "D"],
  but: ["B", "AH1", "T"],
  too: ["T", "UW1"],
  friendly: ["F", "R", "EH1", "N", "D", "L", "IY0"],
  bird: ["B", "ER1", "D"],
  came: ["K", "EY1", "M"],
  down: ["D", "AW1", "N"],
  helped: ["HH", "EH1", "L", "P", "T"],
  together: ["T", "AH0", "G", "EH1", "DH", "ER0"],
  they: ["DH", "EY1"],
  played: ["P", "L", "EY1", "D"],
  all: ["AO1", "L"],
  long: ["L", "AO1", "NG"],
  when: ["W", "EH1", "N"],
  sun: ["S", "AH1", "N"],
  went: ["W", "EH1", "N", "T"],
  home: ["HH", "OW1", "M"],
  happy: ["HH", "AE1", "P", "IY0"],
  end: ["EH1", "N", "D"],

  // Common phonics words
  dog: ["D", "AO1", "G"],
  run: ["R", "AH1", "N"],
  jump: ["JH", "AH1", "M", "P"],
  sit: ["S", "IH1", "T"],
  hat: ["HH", "AE1", "T"],
  mat: ["M", "AE1", "T"],
  sat: ["S", "AE1", "T"],
  bat: ["B", "AE1", "T"],
  rat: ["R", "AE1", "T"],
  pat: ["P", "AE1", "T"],
  can: ["K", "AE1", "N"],
  man: ["M", "AE1", "N"],
  fan: ["F", "AE1", "N"],
  pan: ["P", "AE1", "N"],
  ran: ["R", "AE1", "N"],
  van: ["V", "AE1", "N"],
  bed: ["B", "EH1", "D"],
  pet: ["P", "EH1", "T"],
  wet: ["W", "EH1", "T"],
  get: ["G", "EH1", "T"],
  let: ["L", "EH1", "T"],
  set: ["S", "EH1", "T"],
  pig: ["P", "IH1", "G"],
  dig: ["D", "IH1", "G"],
  wig: ["W", "IH1", "G"],
  fig: ["F", "IH1", "G"],
  hot: ["HH", "AA1", "T"],
  pot: ["P", "AA1", "T"],
  dot: ["D", "AA1", "T"],
  got: ["G", "AA1", "T"],
  lot: ["L", "AA1", "T"],
  not: ["N", "AA1", "T"],
  cup: ["K", "AH1", "P"],
  pup: ["P", "AH1", "P"],
  up: ["AH1", "P"],
  bug: ["B", "AH1", "G"],
  hug: ["HH", "AH1", "G"],
  rug: ["R", "AH1", "G"],
  mug: ["M", "AH1", "G"],
  tug: ["T", "AH1", "G"],

  // More common words
  is: ["IH1", "Z"],
  it: ["IH1", "T"],
  at: ["AE1", "T"],
  on: ["AA1", "N"],
  an: ["AE1", "N"],
  if: ["IH1", "F"],
  of: ["AH1", "V"],
  or: ["AO1", "R"],
  no: ["N", "OW1"],
  go: ["G", "OW1"],
  so: ["S", "OW1"],
  we: ["W", "IY1"],
  he: ["HH", "IY1"],
  me: ["M", "IY1"],
  be: ["B", "IY1"],
  my: ["M", "AY1"],
  by: ["B", "AY1"],
  do: ["D", "UW1"],
  see: ["S", "IY1"],
  you: ["Y", "UW1"],
  are: ["AA1", "R"],
  for: ["F", "AO1", "R"],
  her: ["HH", "ER1"],
  him: ["HH", "IH1", "M"],
  his: ["HH", "IH1", "Z"],
  has: ["HH", "AE1", "Z"],
  had: ["HH", "AE1", "D"],
  have: ["HH", "AE1", "V"],
  said: ["S", "EH1", "D"],
  with: ["W", "IH1", "DH"],
  this: ["DH", "IH1", "S"],
  that: ["DH", "AE1", "T"],
  from: ["F", "R", "AH1", "M"],
  come: ["K", "AH1", "M"],
  make: ["M", "EY1", "K"],
  like: ["L", "AY1", "K"],
  look: ["L", "UH1", "K"],
  good: ["G", "UH1", "D"],
  book: ["B", "UH1", "K"],
  took: ["T", "UH1", "K"],
  cook: ["K", "UH1", "K"],
  food: ["F", "UW1", "D"],
  moon: ["M", "UW1", "N"],
  soon: ["S", "UW1", "N"],
  room: ["R", "UW1", "M"],
  tree: ["T", "R", "IY1"],
  green: ["G", "R", "IY1", "N"],
  blue: ["B", "L", "UW1"],
  black: ["B", "L", "AE1", "K"],
  white: ["W", "AY1", "T"],
  brown: ["B", "R", "AW1", "N"],
  yellow: ["Y", "EH1", "L", "OW0"],
  pink: ["P", "IH1", "NG", "K"],
  fish: ["F", "IH1", "SH"],
  wish: ["W", "IH1", "SH"],
  ship: ["SH", "IH1", "P"],
  shop: ["SH", "AA1", "P"],
  stop: ["S", "T", "AA1", "P"],
  step: ["S", "T", "EH1", "P"],
  spin: ["S", "P", "IH1", "N"],
  swim: ["S", "W", "IH1", "M"],
  frog: ["F", "R", "AO1", "G"],
  trip: ["T", "R", "IH1", "P"],
  drip: ["D", "R", "IH1", "P"],
  drop: ["D", "R", "AA1", "P"],
  clap: ["K", "L", "AE1", "P"],
  flat: ["F", "L", "AE1", "T"],
  glad: ["G", "L", "AE1", "D"],
  plan: ["P", "L", "AE1", "N"],
  plus: ["P", "L", "AH1", "S"],
  club: ["K", "L", "AH1", "B"],
};

// Phoneme to IPA mapping for Amazon Polly SSML
export const arpabetToIPA: Record<string, string> = {
  // Vowels
  AA: "ɑ",
  AE: "æ",
  AH: "ʌ",
  AO: "ɔ",
  AW: "aʊ",
  AY: "aɪ",
  EH: "ɛ",
  ER: "ɝ",
  EY: "eɪ",
  IH: "ɪ",
  IY: "i",
  OW: "oʊ",
  OY: "ɔɪ",
  UH: "ʊ",
  UW: "u",

  // Consonants
  B: "b",
  CH: "tʃ",
  D: "d",
  DH: "ð",
  F: "f",
  G: "ɡ",
  HH: "h",
  JH: "dʒ",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "ŋ",
  P: "p",
  R: "ɹ",
  S: "s",
  SH: "ʃ",
  T: "t",
  TH: "θ",
  V: "v",
  W: "w",
  Y: "j",
  Z: "z",
  ZH: "ʒ",
};

// Human-readable phoneme display names
export const phonemeDisplayName: Record<string, string> = {
  // Vowels
  AA: "ah",
  AE: "a",
  AH: "uh",
  AO: "aw",
  AW: "ow",
  AY: "eye",
  EH: "eh",
  ER: "er",
  EY: "ay",
  IH: "ih",
  IY: "ee",
  OW: "oh",
  OY: "oy",
  UH: "oo",
  UW: "oo",
  // Consonants
  B: "b",
  CH: "ch",
  D: "d",
  DH: "th",
  F: "f",
  G: "g",
  HH: "h",
  JH: "j",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "ng",
  P: "p",
  R: "r",
  S: "s",
  SH: "sh",
  T: "t",
  TH: "th",
  V: "v",
  W: "w",
  Y: "y",
  Z: "z",
  ZH: "zh",
};

// Stretched phoneme sounds for Web Speech API (best effort)
// Note: Web Speech API is not designed for phonemes - use Amazon Polly for production
export const phonemeToSound: Record<string, string> = {
  // Vowels - use stretched natural sounds
  AA: "ahhh",
  AE: "aaah",
  AH: "uhhh",
  AO: "awww",
  AW: "owww",
  AY: "aye",
  EH: "ehhh",
  ER: "errr",
  EY: "ayy",
  IH: "ihhh",
  IY: "eeee",
  OW: "ohhh",
  OY: "oyyy",
  UH: "ooo",
  UW: "oooo",

  // Consonants - use letter sounds where possible
  B: "buh",
  CH: "chuh",
  D: "duh",
  DH: "thuh",
  F: "ffff",
  G: "guh",
  HH: "huh",
  JH: "juh",
  K: "kuh",
  L: "llll",
  M: "mmmm",
  N: "nnnn",
  NG: "ng",
  P: "puh",
  R: "rrr",
  S: "sss",
  SH: "shh",
  T: "tuh",
  TH: "th",
  V: "vvv",
  W: "wuh",
  Y: "yuh",
  Z: "zzz",
  ZH: "zh",
};

/**
 * Look up phonemes for a word
 * Returns array of phonemes or null if not found
 */
export function lookupPhonemes(word: string): string[] | null {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  return cmuDictionary[normalized] || null;
}

/**
 * Get the base phoneme without stress marker
 */
export function getBasePhoneme(phoneme: string): string {
  return phoneme.replace(/[0-2]$/, "");
}

/**
 * Convert ARPAbet phoneme to speakable sound
 */
export function phonemeToSpeakable(phoneme: string): string {
  const base = getBasePhoneme(phoneme);
  return phonemeToSound[base] || phoneme;
}

/**
 * Get human-readable display name for phoneme
 */
export function getPhonemeDisplayName(phoneme: string): string {
  const base = getBasePhoneme(phoneme);
  return phonemeDisplayName[base] || base.toLowerCase();
}

/**
 * Convert ARPAbet phoneme to IPA for Polly SSML
 */
export function phonemeToIPAString(phoneme: string): string {
  const base = getBasePhoneme(phoneme);
  return arpabetToIPA[base] || phoneme.toLowerCase();
}

/**
 * Generate SSML for Amazon Polly to speak phonemes
 */
export function generatePollySSML(phonemes: string[]): string {
  const phonemeMarkup = phonemes
    .map((p) => {
      const ipa = phonemeToIPAString(p);
      return `<phoneme alphabet="ipa" ph="${ipa}"/>`;
    })
    .join(" ");
  return `<speak>${phonemeMarkup}</speak>`;
}
