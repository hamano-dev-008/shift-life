// endOfLife.js — Numbers and text for the end of a life: ageing, when a
// life ends, the gentle goodbye, the life summary and its title, and the
// Book of past lives. Pure data: game/endOfLife.js and the drawing code
// read it.

// From this age (whole years) health drops each in-game year, on the
// birthday, by the amount for where they live: a better home slows it.
// Keyed by housing tier id (data/housing.js); `parents` is for anyone
// still living with their parents. Resting still restores health.
export const AGEING_FROM_AGE = 50;
export const AGEING_LOSS = { parents: 1, sleepingBag: 3, tent: 2, house: 1 };

// When a life can end. Nobody younger than `minAge` ever dies (babies,
// children and teens). From `minAge`, a life ends when health reaches 0.
// From `fromAge`, each birthday also rolls a chance:
//   (base + perYear x years past fromAge) x the health factor,
// where the health factor runs from `lowHealthFactor` at 0 health to
// `highHealthFactor` at 100, so a healthier character tends to live
// longer. At `maxAge`, the natural limit, the life always ends.
export const DEATH = {
  minAge: 18,
  fromAge: 70,
  base: 0.02,
  perYear: 0.01,
  lowHealthFactor: 2,
  highHealthFactor: 0.4,
  maxAge: 100,
};

// The goodbye, in seconds: the character sits down and, after
// `eyesCloseAfter`, closes their eyes; the scene fades over `fadeSeconds`
// to `fadeMax` (0-1) of the fade color (in ui/farewell.js); the summary
// card opens `summaryAfter` seconds after the end (or `summaryAfterLoad`
// when the app opens on a life that has ended).
export const FAREWELL = {
  eyesCloseAfter: 2,
  fadeSeconds: 8,
  fadeMax: 0.6,
  summaryAfter: 9,
  summaryAfterLoad: 1.5,
};

// The life title, "The {adjective} {noun}".
//
// Adjective: from the character's strongest trait. Each trait scores
// `TRAIT_SCORE.base`, plus `job` for each job held whose `lean`
// (data/jobs.js) includes it, plus `goal` if the goal at the end is in
// its TRAIT_GOALS. The highest score wins; ties go to the trait listed
// first. A character with no traits gets FALLBACK_ADJECTIVE.
export const TRAIT_SCORE = { base: 1, job: 2, goal: 1 };
export const TRAIT_ADJECTIVES = {
  bold: 'Daring',
  careful: 'Steady',
  social: 'Friendly',
  shy: 'Quiet',
  curious: 'Curious',
  lazy: 'Easygoing',
};
export const TRAIT_GOALS = {
  bold: ['fortune'],
  careful: ['healthy'],
  social: ['heart'],
  shy: ['scholar'],
  curious: ['scholar', 'free'],
  lazy: ['free'],
};
export const FALLBACK_ADJECTIVE = 'Gentle';

// Noun: the first of these that fits:
//   1. BUSKER.noun after at least BUSKER.sessions full busking sessions
//      (over the whole life), or BUSKER.apples golden apples won.
//   2. The job of their highest title (JOB_NOUNS, by job id).
//   3. The goal at the end (GOAL_NOUNS, by goal id).
//   4. FALLBACK_NOUN.
export const BUSKER = { sessions: 20, apples: 1, noun: 'Busker' };
export const JOB_NOUNS = {
  cafe: 'Barista',
  shop: 'Shopkeeper',
  courier: 'Courier',
  farm: 'Farmer',
  artist: 'Artist',
  builder: 'Builder',
  chef: 'Chef',
  office: 'Clerk',
  teacher: 'Teacher',
  developer: 'Coder',
  scientist: 'Scientist',
  doctor: 'Healer',
};
export const GOAL_NOUNS = {
  scholar: 'Scholar',
  fortune: 'Saver',
  heart: 'Friend',
  healthy: 'Athlete',
  free: 'Wanderer',
};
export const FALLBACK_NOUN = 'Soul';
export const TITLE_FORMAT = 'The {adjective} {noun}';

// How many finished lives the Book of past lives keeps (the oldest go
// first).
export const BOOK_MAX_LIVES = 200;

// Text. {name} is the character's name, {age} an age, {from} and {to}
// ages, {count} a number, {amount} dollars.
export const END_TEXT = {
  farewell: '{name} drifted off peacefully at {age}.',
  farewellHint: 'Click to see their life',
  summaryHeading: 'A life well lived',
  ages: '{name}, {from}-{to}',
  rows: {
    goal: 'Goal',
    milestones: 'Milestones',
    jobs: 'Jobs',
    topTitle: 'Top title',
    money: 'Money',
    home: 'Home',
    apples: 'Golden apples',
  },
  noMilestones: 'None yet',
  noJobs: 'Never worked',
  // A milestone reached; {goal} is its goal's name.
  milestone: '{label} ({age})',
  money: '${amount}',
  parentsHome: "Parents' house",
  newLife: 'Start a new life',
  bookTitle: 'Book of past lives',
  bookEmpty: 'No finished lives yet.',
  bookEntry: '{name}, {from}-{to}',
  back: 'Back',
  // Dev menu.
  tooYoung: 'Too young: nobody under {age} dies.',
  alreadyEnded: 'This life has ended.',
};
