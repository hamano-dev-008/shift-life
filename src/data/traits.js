// traits.js — Personality traits a character is born with. They decide
// which choice the character picks when the player leaves an event
// unanswered (see `lean` in data/events.js).

// Traits come in opposite pairs; a character gets at most one from each.
export const TRAIT_PAIRS = [
  ['bold', 'careful'],
  ['social', 'shy'],
  ['curious', 'lazy'],
];

// How many traits a newborn rolls: [min, max].
export const TRAIT_COUNT = [2, 3];

export const TRAIT_LABELS = {
  bold: 'Bold',
  careful: 'Careful',
  social: 'Social',
  shy: 'Shy',
  curious: 'Curious',
  lazy: 'Lazy',
};
