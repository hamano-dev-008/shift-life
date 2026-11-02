// home.js — Numbers and text for resting: lying down on a sofa, in the
// sleeping bag or in the tent to slowly regain health. How fast depends
// on where (restMinutes in data/housing.js). Pure data: game/home.js and
// the drawing code read it.

// Props the character can rest on, with the height, in scene pixels above
// the prop's base (its bottom row), where they lie: the top of the sofa's
// seat cushions, the top of the sleeping bag, the tent's floor. A sprite
// for one of these should keep that height. A place's first resting prop
// that shows is where they rest there.
export const REST_SEATS = {
  'home.sofa': 6,
  'yard.sleepingBag': 3,
  'yard.tent': 0,
};

// Resting gains REST_HEALTH health every few real minutes (restMinutes in
// data/housing.js), never above REST_HEALTH_MAX. Real minutes: game speed
// doesn't change it, and time doesn't pass while the app is closed. The
// rest carries on (with no more gain) until the player picks "Get up".
export const REST_HEALTH = 1;
export const REST_HEALTH_MAX = 100;

// Resting visuals, in seconds: a "z" floats up every `z` and rises for
// `zRise`.
export const REST_LOOPS = { z: 1.2, zRise: 2.4 };

// How the character lies on each rest spot: lying on their back, head
// toward the left end (facing right), the head's middle `head` scene
// pixels from the prop's drawn left edge (lined up with its pillow).
// `pillow`: a small cream pillow is drawn under the head (the sleeping
// bag has its own). `cover`: 'blanket' (REST_BLANKET) or 'bag' (the
// sleeping bag itself, in SLEEPING_BAG_COLORS). `headLift`: character
// pixels the back of the head sits above where the body lies (on the
// pillow). A sprite for one of these props should keep its pillow end
// there.
export const REST_BEDS = {
  'home.sofa': { head: 8, pillow: true, cover: 'blanket', headLift: 2 },
  'yard.sleepingBag': { head: 4.5, pillow: false, cover: 'bag', headLift: 1 },
  'yard.tent': { head: 7, pillow: true, cover: 'blanket', headLift: 2 },
};
// The dev menu's "Rest now" lies down right where they are, like this.
export const REST_PREVIEW_BED = { pillow: true, cover: 'blanket', headLift: 2 };

// The pillow under a resting head: `rows` tall (its top corners rounded
// off, its bottom row in `shade`), reaching `overhang` character pixels
// past the head on each side.
export const REST_PILLOW = { color: '#fff3d6', shade: '#e3d2ad', rows: 3, overhang: 2 };

// The blanket over a resting body, from the chest down (the shirt shows
// at the shoulders, `shoulders` character pixels), with a bump for the
// feet: a soft blue, a lighter top edge, a darker underside.
export const REST_BLANKET = { color: '#a9c1e8', light: '#cbdcf5', dark: '#8aa3cf', shoulders: 2 };

// The sleeping bag's colors (drawn in ui/housing.js; also the cover over
// someone lying in it).
export const SLEEPING_BAG_COLORS = {
  color: '#5b7fc7', light: '#7d9ddb', dark: '#46659f', zip: '#d9dde8', pillow: '#fffaf0', pillowShade: '#e6dccb',
};

// The sleeping face: rosy cheeks.
export const REST_FACE = { cheek: '#f09a9a' };

// Sleeping, in seconds: the blanket's top edge over the chest rises 1
// pixel and falls back every `breath`; the mouth opens to a tiny "o" for
// `mouthOpen` every `mouthEvery` (random between, the same every run).
export const SLEEP_LOOPS = { breath: 1.8, mouthEvery: [4, 6], mouthOpen: 0.6 };

// Rest menu text (its title is the prop's name from `targets` in
// data/places.js). {amount} is REST_HEALTH, {minutes} the minutes per
// gain here, {health} and {max} the health now and REST_HEALTH_MAX,
// {time} and {total} the time rested towards the next gain and the time
// it takes.
export const REST_TEXT = {
  rest: 'Rest',
  getUp: 'Get up',
  idle: 'Resting restores {amount} health every {minutes} min.',
  resting: 'Resting: {time} of {total}',
  health: 'Health: {health}/{max}',
  full: 'Fully rested!',
  // The activity bar while resting.
  bar: 'Resting - Health {health}/{max}',
  // The activity bar while walking to the rest spot; {seat} from
  // REST_SPOT_NAMES.
  onTheWay: 'Going to the {seat}...',
};

// The dev menu's "Rest now" (lying down asleep where they are, to see the
// pose) and its notes when it can't.
export const REST_DEV_TEXT = {
  button: 'Rest now',
  cantNow: 'Not now.',
  busy: 'Busy: stop what they are doing first.',
};

// What each rest spot is called in running text.
export const REST_SPOT_NAMES = {
  'home.sofa': 'sofa',
  'yard.sleepingBag': 'sleeping bag',
  'yard.tent': 'tent',
};
