// fortuneTree.js — Numbers and text for the Fortune Tree place: busking
// (playing an instrument under the tree for tips) and the golden apple.
// Pure data: game/fortuneTree.js and the drawing code read it.

// The place (data/places.js) where the tree can be clicked, and the prop
// (data/layout.js) that is the tree.
export const FORTUNE_TREE_PLACE = 'fortuneTree';
export const TREE_PROP = 'tree';

// Busking and apple picking unlock at this age (whole years).
export const TREE_MIN_AGE = 6;

// Every SESSION_MINUTES of busking pays SESSION_PAY dollars and counts as
// one full session. Real minutes: game speed doesn't change it, and time
// doesn't pass while the app is closed. Stopping early pays nothing for
// the unfinished session. Targets about $5 per real hour (AGENTS.md).
export const SESSION_MINUTES = 60;
export const SESSION_PAY = 5;

// A golden apple grows every APPLE_EVERY_HOURS real hours, one at a time
// (the timer waits while one is ready). Picking succeeds with chance
// base + perSession x full sessions since the last successful pick, at
// most max. Success pays APPLE_REWARD and resets the sessions counted.
// Either way the apple is gone and the next one starts growing. Targets
// an apple about every 8 real hours (AGENTS.md); an hour of busking adds
// 2%.
export const APPLE_EVERY_HOURS = 8;
export const PICK_CHANCE = { base: 0.1, perSession: 0.02, max: 0.5 };
export const APPLE_REWARD = 888;

// Where the apple hangs: the pixel its center lands on, as { col, row }
// from the top-left of the tree's art. `sprite` is for tree.png (in its
// own pixels), `code` for the code-drawn tree (in scene pixels, counting
// its 1px outline). The apple is drawn at the tree's scale.
export const APPLE_SPOT = {
  sprite: { col: 23, row: 12 },
  code: { col: 13, row: 11 },
};

// Busking visuals, in seconds: a musical note floats up every `note` and
// rises for `noteRise`; the strumming hand moves every `strum`.
export const BUSK_LOOPS = { note: 1, noteRise: 2, strum: 0.25 };

// The golden apple's glint blinks on for this long in each cycle.
export const APPLE_GLINT = { cycle: 1.2, on: 0.3 };

// Menu and bubble text. {name} becomes the character's name, {age} an
// age, {pay} dollars, {minutes} SESSION_MINUTES.
export const TREE_TEXT = {
  tooYoung: 'Come back at age {age} to play here and pick apples.',
  play: 'Play an instrument',
  stop: 'Stop playing',
  pick: 'Pick the golden apple',
  idleStatus: 'Busking pays ${pay} every {minutes} min.',
  playingStatus: 'Playing: {time} of {total}',
  sessions: 'Full sessions: {count}',
  appleReady: 'A golden apple is ready!',
  appleGrowing: 'Next apple in {time}',
  chance: 'Pick chance: {percent}%',
  sessionPaid: { heading: 'Busking', text: 'Tips from passersby!' },
  appleWon: { heading: 'Golden apple!', text: '{name} picked the golden apple!' },
  appleLost: { text: 'The apple slipped away...' },
  // The activity bar while busking; {time} and {total} as m:ss.
  bar: 'Busking - {time} of {total}',
  // The activity bar while walking to the tree to play.
  onTheWay: 'Walking to the tree...',
};
