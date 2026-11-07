// ramen.js — Ramen Hinata's numbers and text: a cozy little ramen shop in
// town, reached only from Go to. Where things are in its picture (the door
// with its noren, the sign and menu tags, the counter and its stools, the
// stove and its pots), where the character walks, sits and cooks. Pure
// data: data/places.js, data/layout.js and data/work.js use it,
// ui/ramen.js draws it.
//
// The shop is one picture, code-drawn (ui/ramen.js) or the ramen sprite
// (assets/sprites/ramen.png) if there is one, drawn at SCENE_SCALE from
// the window's bottom-left corner like the Cafe's. Positions are in that
// picture's pixels: x from its left edge, rows from its top.

export const RAMEN_PLACE = 'ramen';
export const RAMEN_ART = { width: 107, height: 80 };

// Feet on row 72, 8 rows from the bottom, like the Cafe. Walls both sides.
export const RAMEN_FEET_FROM_BOTTOM = 8;
export const RAMEN_WALK = { minX: 8, maxX: 100 };

// The door on the left, a noren curtain across its top (its click area
// and the x where someone stands to go in or out).
export const RAMEN_DOOR_PROP = 'ramen.door';
export const RAMEN_DOOR = { left: 3, right: 15, top: 28, bottom: 66, x: 9 };

// The sign over the menu tags (columns left..right, rows top..bottom; its
// text in 3 x 5 pixel letters) and the paper lantern (its middle and
// top).
export const RAMEN_SIGN = { left: 20, right: 44, top: 15, bottom: 21, text: 'RAMEN' };
export const RAMEN_LANTERN = { x: 46, top: 32 };

// The counter on the right: columns left..right, its top and the bottom
// of its front. Behind it the floor is further back (`behindRow`), so its
// front hides the legs of whoever stands there. The cook keeps to
// `cookSpots`; the worker steps in at `flap` and cooks at `stoveX`.
// Clicking it opens its menu.
export const RAMEN_COUNTER_PROP = 'ramen.counter';
export const RAMEN_COUNTER = {
  left: 50, right: 106, top: 54, bottom: 66, behindRow: 57, flap: 54, stoveX: 80, cookSpots: [66, 96],
};

// The stove on the back counter: its pots, by their middle x.
export const RAMEN_POTS = [66, 80];

// The stools in front of the counter: each { id, x, row (seat top),
// facing }. The character eats at RAMEN_MY_STOOL; diners take the others.
export const RAMEN_STOOLS = [
  { id: 'stool1', x: 58, row: 63, facing: 1 },
  { id: 'stool2', x: 70, row: 63, facing: 1 },
  { id: 'stool3', x: 82, row: 63, facing: 1 },
  { id: 'stool4', x: 94, row: 63, facing: -1 },
];
export const RAMEN_MY_STOOL = 'stool1';

// The job that works here (data/jobs.js): they cook at the stove, and
// their shifts are cooking and serving (data/work.js).
export const RAMEN_JOB = 'chef';

// Names for the place's click areas.
export const RAMEN_TEXT = {
  name: 'Ramen Hinata',
  door: 'Go outside',
  counter: 'Counter',
};

// Eating at the counter (from RAMEN_MIN_AGE): each dish's price, what it
// gives, how long it's eaten (sitting at RAMEN_MY_STOOL, the bowl served
// in front of them) and how often it can be had (real minutes; game speed
// doesn't change it, and it waits while the app is closed). Paid at once.
// `thing` names it in the bar and the bubble. Money sinks (AGENTS.md):
// ramen is about ten minutes of an entry job's pay, the special (once a
// real day) about half an hour's.
export const RAMEN_MIN_AGE = 6;
export const RAMEN_ITEMS = {
  ramen: {
    name: 'Shoyu ramen', thing: 'shoyu ramen', price: 4, effects: { happiness: 2, health: 2 }, everyMinutes: 60,
    seconds: 60,
  },
  special: {
    name: "Chef's special", thing: "chef's special", price: 12, effects: { happiness: 5, health: 4 },
    everyMinutes: 1440, seconds: 60,
  },
};

// The menu, the bar and the bubbles. {item} is a dish's `thing`, {age} an
// age.
export const RAMEN_MENU_TEXT = {
  title: 'Counter',
  tooYoung: 'Come back at age {age} for a bowl.',
  busy: 'Enjoying the {item}...',
  idle: 'Sit down for a hot bowl.',
};
export const RAMEN_BAR_TEXT = {
  toStool: 'Taking a seat...',
  eating: 'Slurping the {item}...',
};
export const RAMEN_NEWS = {
  ramen: { heading: 'Slurp!', text: 'Warm all the way down.' },
  special: { heading: 'Gochisousama!', text: 'That special was something else.' },
};

// A shift is cooking at the stove, and every `every` seconds of it,
// carrying a bowl out to a seated diner (standing `gap` pixels beside
// their stool, facing them) for `serve` seconds, if anyone is seated.
export const RAMEN_SERVING = { every: 90, serve: 8, gap: 5 };

// The cook, the shop's owner, behind the counter (feet on
// RAMEN_COUNTER.behindRow): an elder in a chef's hat. Stirs a pot for
// `stir` seconds, moves to the other spot (`speed` character pixels a
// second), and serves each new diner a bowl after `serveAfter` seconds.
// Clicking them gets one of `lines`.
export const RAMEN_COOK = {
  look: { skin: '#e0ac69', hair: '#c9c9c9', hairStyle: 'short', shirt: '#f4efe6' },
  stage: 'elder',
  item: 'chefHat',
  stir: [4, 9],
  speed: 6,
  serveAfter: 4,
  label: 'Cook',
  lines: [
    'Irasshai!',
    'The broth simmered all night.',
    'Slurp loud, it means you like it.',
    'Extra egg? On the house.',
    'Forty years, same recipe.',
    'Careful, it is hot!',
  ],
};

// Diners: at most `max` at once, one every `spawnEvery` seconds while a
// stool is free (the first `firstIn` after the shop is shown). Each comes
// in at the door, walks `speed` character pixels a second to a free stool
// (not the character's), gets a bowl, eats `eat` seconds and leaves.
// `elderShare` are elders.
export const RAMEN_DINERS = {
  max: 3,
  spawnEvery: [20, 50],
  firstIn: [3, 10],
  speed: 9,
  eat: [40, 90],
  elderShare: 0.25,
};
