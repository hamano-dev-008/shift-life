// farm.js — The Farm's numbers and text: where the character walks there,
// the three rice paddies (where, what they cost), growing rice (seed
// cost, real-time growth, stages, weeds, harvest pay), the short jobs at
// a paddy (planting, pulling weeds, harvesting), the code-drawn crops'
// colors and sway, and the menu, bar and bubble text. Pure data:
// data/places.js and data/layout.js use it for the place and the paddy
// props, game/farm.js runs the farming, ui/farm.js draws it.
//
// The Farm's background is one picture, farm.background.png
// (assets/sprites/), drawn at SCENE_SCALE from the window's bottom-left
// corner (sky and grass and a code-drawn path and paddies without it).
// Positions below are in that picture's pixels: x from its left edge,
// rows from its top (row 0 is the top row, FARM_ART.height - 1 the
// bottom one). Change them to match the art if it changes.

// The place's id (saved; don't rename it).
export const FARM_PLACE = 'farm';

// The picture's size.
export const FARM_ART = { width: 107, height: 80 };

// The background's sprite name, and what's drawn without it.
export const FARM_BACKGROUND = 'farm.background';
export const FARM_BACKGROUND_FALLBACK = ['sky', 'grass', 'farm.ground'];

// Feet on the dirt path (rows 72-76): row 75, 5 rows from the bottom.
export const FARM_FEET_FROM_BOTTOM = 5;

// Walking: the whole width, open on the left (to the yard), stopping
// before the right edge (closed: work trips leave by the left).
export const FARM_WALK = { minX: null, maxX: 100 };

// From this age the character can farm (any age can visit).
export const FARM_MIN_AGE = 10;

// The water in the paddies, rows top..bottom (inclusive).
export const PADDY_WATER = { top: 65, bottom: 69 };

// The paddies, left to right: the prop id (saved; its click area and the
// spot on the path in front of it), its water's columns left..right
// (inclusive), and its price ($0: owned from the start; the first click
// on one not owned yet offers it).
export const PADDIES = [
  { id: 'farm.paddy1', left: 1, right: 20, price: 0 },
  { id: 'farm.paddy2', left: 22, right: 37, price: 100 },
  { id: 'farm.paddy3', left: 39, right: 57, price: 250 },
];

// Rice. `seedCost` dollars to plant a paddy; it grows over `growHours`
// REAL hours (only while the app runs; game speed doesn't change it),
// through `stages` (seedlings from the start, young from `young` of the
// way), and is ripe (golden) at the end. Once during growth, weeds may
// come up: with `weedChance`, at a random point in `weedsAt` (shares of
// the growth). Pulling them adds `weedBonus` to the harvest. Harvesting
// a ripe paddy sells it for `pay` dollars (plus the bonus) and leaves
// plain water again.
export const RICE = {
  seedCost: 5,
  growHours: 6,
  young: 1 / 3,
  weedChance: 0.6,
  weedsAt: [0.2, 0.7],
  weedBonus: 0.2,
  pay: 25,
};

// The jobs at a paddy, done once the character has walked to the path in
// front of it: how many real seconds each takes there, and the pose's
// animation (ui/sprite.js).
export const FARM_JOBS = {
  plant: { seconds: 4, animation: 'plant' },
  weed: { seconds: 3, animation: 'weed' },
  harvest: { seconds: 3, animation: 'harvest' },
};

// The farming poses (ui/sprite.js), in seconds: planting, the hand
// dips to the water and back every `plant`; pulling weeds, it tugs up
// every `weed`; harvesting, the sickle swings down and back every
// `swing`.
export const FARM_LOOPS = { plant: 0.6, weed: 0.4, swing: 0.45 };

// The code-drawn crops (each has a sprite name too, data/sprites.js):
// colors, and how a ripe paddy sways (its heads lean one way then the
// other every `swayEvery` seconds, each column a little later).
export const RICE_ART = {
  water: '#9fb4c9',
  seedling: '#7fcf5a',
  seedlingDark: '#4f9a3c',
  young: '#5fbf45',
  youngDark: '#3f8f35',
  ripe: '#e9c25a',
  ripeDark: '#c99a35',
  head: '#f4d77a',
  weeds: '#2a3f1a',
  weedsLight: '#c2d64a',
  swayEvery: 1.4,
};

// The code-drawn ground without the picture: the dirt path's rows and
// colors, and the paddies' banks.
export const FARM_GROUND = {
  path: { top: 72, bottom: 76, color: '#dbb183', edge: '#c49768' },
  bank: '#8c603e',
  bankLight: '#ad7f54',
};

// Text. {price}, {need}, {cost}, {pay}, {time}, {age} are filled in.
export const FARM_TEXT = {
  // The paddies' click areas (hover names).
  paddyNames: ['Rice paddy 1', 'Rice paddy 2', 'Rice paddy 3'],
  tooYoung: 'Farming starts at {age}. Come back later!',
  buy: 'Buy this paddy - ${price}',
  need: 'Need ${need} more.',
  forSale: 'For sale.',
  plant: 'Plant rice - ${cost}',
  empty: 'Just water. Ready to plant.',
  growing: 'Growing: {stage}, {time} left',
  stages: { seedling: 'seedlings', young: 'young rice', ripe: 'ripe' },
  weeds: 'Weeds are coming up!',
  weeded: 'Weeded: +20% at harvest.',
  pullWeeds: 'Pull weeds',
  harvest: 'Harvest - ${pay}',
  ready: 'Golden and ready!',
  working: 'Working here...',
  // The activity bar.
  bar: { plant: 'Planting rice...', weed: 'Pulling weeds...', harvest: 'Harvesting...' },
  onTheWay: 'Walking to the paddy...',
  // Bubbles.
  bought: { heading: 'New paddy!', text: '{name} bought a rice paddy.' },
  planted: { heading: null, text: 'Rice planted!' },
  pulled: { heading: null, text: 'Weeds pulled!' },
  harvested: { heading: 'Harvest!', text: 'Sold the rice for ${pay}.' },
  // The dev menu.
  devGrow: 'Grow paddies',
  devGive: 'Give paddies',
};
