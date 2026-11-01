// infant.js — How the youngest characters move: the ages they crawl,
// toddle and walk at, crawl and toddle speeds and strides, toddler plops,
// the sitting baby's fidgets, and the "first steps" celebration.
// Speeds and strides are in character pixels (CHARACTER_SCALE in
// data/layout.js), so they scale with the character; trip lengths are in
// scene pixels, like other distances on the ground.

// Under CRAWL_UNTIL_AGE the character crawls; from then until WALK_FROM_AGE
// they toddle; from WALK_FROM_AGE they walk normally. Whole years.
export const CRAWL_UNTIL_AGE = 3;
export const WALK_FROM_AGE = 4;

// speed: character pixels per second. stride: how far a hand, knee or foot
// reaches at a contact pose; frames advance one per `stride` pixels moved,
// so planted hands, knees and feet stay put. maxTrip: the longest trip, in
// scene pixels (props further away are skipped).
export const CRAWL = { speed: 3, stride: 2, maxTrip: 24 };
export const TODDLE = { speed: 4, stride: 1, maxTrip: 36 };

// While toddling, the chance per second of plopping down to sit, and how
// long they sit before getting up and carrying on, in seconds.
export const PLOP_CHANCE = 0.12;
export const PLOP_DURATION = [1.2, 2.5];

// A sitting baby fidgets every BABY_FIDGET_INTERVAL seconds: either looks
// around (back over their shoulder) for BABY_LOOK_DURATION, or, with the
// rest of the chance, wobbles side to side for BABY_WOBBLE_DURATION.
export const BABY_FIDGET_INTERVAL = [2, 5];
export const BABY_LOOK_CHANCE = 0.6;
export const BABY_LOOK_DURATION = [0.8, 1.6];
export const BABY_WOBBLE_DURATION = 0.8;

// Shown in a celebration bubble when the character turns CRAWL_UNTIL_AGE
// while the app is running. {name} becomes their name.
export const FIRST_STEPS = { heading: 'First steps!', text: '{name} is walking!' };
