// cafe.js — The Cafe's numbers and text: a small Japanese kissaten in
// town, reached only from Go to. Where things are in its picture (the
// door, the counter, the window sill, seats), where the character walks
// and stands behind the counter. Pure data: data/places.js and
// data/layout.js use it for the place and its props, ui/cafe.js draws it.
//
// The Cafe is one picture, code-drawn (ui/cafe.js) or the cafe sprite
// (assets/sprites/cafe.png) if there is one, drawn at SCENE_SCALE from
// the window's bottom-left corner like the Lake's. Positions are in that
// picture's pixels: x from its left edge, rows from its top.

export const CAFE_PLACE = 'cafe';
export const CAFE_ART = { width: 107, height: 80 };

// The floor's front edge, where the character walks: feet on row 72, 8
// rows from the bottom. Walls on both sides (walking stays between them,
// and work trips don't leave from here).
export const CAFE_FEET_FROM_BOTTOM = 8;
export const CAFE_WALK = { minX: 8, maxX: 100 };

// The front door (left wall, with the noren over it): its click area,
// columns left..right and rows top..bottom, and the x where someone
// stands to go in or out.
export const CAFE_DOOR_PROP = 'cafe.door';
export const CAFE_DOOR = { left: 2, right: 15, top: 30, bottom: 66, x: 9 };

// The counter along the right: columns left..right, its top (the two
// lighter rows) and the bottom of its front. Behind it the floor is
// further back: someone standing there has their feet on `behindRow`, so
// the counter's front hides their legs. `flap` is the x of the gap at its
// left end where they step in. Clicking it opens the counter's menu.
export const CAFE_COUNTER_PROP = 'cafe.counter';
export const CAFE_COUNTER = { left: 60, right: 106, top: 54, bottom: 66, behindRow: 58, flap: 62 };

// The window and its sill (where the cat lies), columns left..right; the
// sill's top row.
export const CAFE_WINDOW = { left: 22, right: 42, top: 12, bottom: 35 };
export const CAFE_SILL = { left: 20, right: 44, row: 37 };

// Seats: stools in front of the counter (seat top row) and the table's
// two chairs, each { x, row, facing }.
export const CAFE_SEATS = [
  { id: 'stool1', x: 70, row: 63, facing: 1 },
  { id: 'stool2', x: 82, row: 63, facing: 1 },
  { id: 'stool3', x: 94, row: 63, facing: -1 },
  { id: 'chairL', x: 28, row: 66, facing: 1 },
  { id: 'chairR', x: 50, row: 66, facing: -1 },
];

// The table between the chairs: its middle and top row.
export const CAFE_TABLE = { x: 39, row: 60 };

// The two siphon brewers on the counter, by their middle x.
export const CAFE_SIPHONS = [76, 88];

// Names for the place's click areas.
export const CAFE_TEXT = {
  name: 'Cafe',
  door: 'Go outside',
  counter: 'Counter',
};

// The cafe master, behind the counter (feet on CAFE_COUNTER.behindRow):
// an elder in a white shirt and apron. Between `spots` (x in the
// picture's pixels: polishing cups at the far end, or at a siphon) they
// walk `speed` character pixels a second; they polish a cup for `polish`
// seconds, brew at a siphon for `brew`, or just stand for `idle`
// ([min, max], random). All the spots are right of the counter's flap,
// where the character stands to work. Clicking them gets one of `lines`.
export const CAFE_MASTER = {
  look: { skin: '#f1c27d', hair: '#5a3825', hairStyle: 'short', shirt: '#f4efe6' },
  stage: 'elder',
  item: 'apron',
  spots: { polish: 98, siphons: CAFE_SIPHONS.map((x) => x + 4) },
  speed: 6,
  polish: [6, 12],
  brew: [5, 9],
  idle: [3, 6],
  label: 'Master',
  lines: [
    'Irasshaimase!',
    'Fresh beans today.',
    'Take your time.',
    'The siphon is slow, but worth it.',
    'Rain is good for coffee.',
    'Tama likes the warm sill.',
  ],
};

// Customers: at most `max` at once, one coming in every `spawnEvery`
// seconds while there's a free seat (the first `firstIn` after the Cafe
// is shown). They come in at the door, walk `speed` character pixels a
// second to a free seat in `seats` (ids in CAFE_SEATS; chairL is kept for
// the character), get a cup `servedAfter` seconds after sitting, stay
// `stay` seconds, and leave by the door. `elderShare` of them are elders.
export const CAFE_CUSTOMERS = {
  max: 2,
  spawnEvery: [30, 80],
  firstIn: [3, 12],
  speed: 9,
  servedAfter: 2.5,
  stay: [45, 120],
  seats: ['stool1', 'stool2', 'stool3', 'chairR'],
  elderShare: 0.25,
};

// Tama, the cafe cat, on the window sill (CAFE_SILL), drawn at
// SCENE_SCALE. She sleeps `sleep` seconds (breathing every `breath`),
// wakes and sits `sit`, sometimes (`stretchChance`) stretches for
// `stretch` seconds, and sometimes (`moveChance`) pads `speed` scene
// pixels a second to another spot on the sill before settling again.
// Clicking her wakes her (or gets a meow), with one of `lines`.
export const CAFE_CAT = {
  sleep: [20, 60],
  breath: 1.4,
  sit: [5, 12],
  blink: [2, 5],
  stretch: 1.6,
  stretchChance: 0.5,
  moveChance: 0.5,
  speed: 4,
  margin: 5,
  label: 'Cat',
  lines: { woken: 'mrrp?', awake: 'meow~' },
  colors: { fur: '#e8a04f', stripe: '#c0762f', white: '#fbf3e6', eye: '#3d3a4b', nose: '#e98b8b' },
};

// A cup on the counter or the table: where it sits relative to the seat
// (`counter`: on the counter top in front of a stool; `table`: on the
// table, toward the chair) and its steam, a wisp rising `steamRise`
// pixels every `steamEvery` seconds.
export const CAFE_CUP = { steamEvery: 1.2, steamRise: 4, colors: { cup: '#f4efe6', coffee: '#5a2e1a', steam: '#ffffff' } };
