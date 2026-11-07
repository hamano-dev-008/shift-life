// post.js — Pedal Post's numbers and text: a cozy bike courier hub in
// town, reached only from Go to. Where things are in its picture (the
// door, the cargo bike by it, the counter, the parcel pile, the dog's
// bed), where the character walks and where the worker stands. Pure data:
// data/places.js, data/layout.js and data/work.js use it, ui/post.js
// draws it.
//
// The hub is one picture, code-drawn (ui/post.js) or the post sprite
// (assets/sprites/post.png) if there is one, drawn at SCENE_SCALE from the
// window's bottom-left corner like the Cafe's. Positions are in that
// picture's pixels: x from its left edge, rows from its top.

export const POST_PLACE = 'post';
export const POST_ART = { width: 107, height: 80 };

// Feet on row 72, 8 rows from the bottom, like the Cafe. Walls both sides.
export const POST_FEET_FROM_BOTTOM = 8;
export const POST_WALK = { minX: 8, maxX: 100 };

// The front door on the left (its click area and the x where someone
// stands to go in or out) and the cargo bike parked right of it (its
// middle and the row its wheels stand on). The bike goes out with the
// character on a delivery run.
export const POST_DOOR_PROP = 'post.door';
export const POST_DOOR = { left: 3, right: 15, top: 28, bottom: 66, x: 9 };
export const POST_CARGO_BIKE = { x: 24, row: 69 };

// The counter on the right: columns left..right, its top and the bottom
// of its front; behind it the floor is further back (`behindRow`), so its
// front hides the legs of whoever stands there. The character steps in at
// `flap`; the dispatcher keeps to `dispatcherX`. Clicking it opens its
// menu.
export const POST_COUNTER_PROP = 'post.counter';
export const POST_COUNTER = { left: 80, right: 106, top: 52, bottom: 66, behindRow: 56, flap: 84, dispatcherX: 97 };

// Where people stand to hand a parcel over the counter (on the floor), the
// parcel pile on the floor left of the counter (its middle), the scale
// and the stamp on the counter.
export const POST_HAND_IN_X = 86;
export const POST_PILE_X = 72;
export const POST_SCALE_X = 90;
export const POST_STAMP_X = 102;

// The dog's bed on the floor, under the coffee shelf: its middle and the
// row the dog lies on.
export const POST_DOG_BED = { x: 50, row: 69 };

// The sign over the wall (columns left..right, rows top..bottom) and what
// it says, in 3 x 5 pixel letters.
export const POST_SIGN = { left: 33, right: 77, top: 10, bottom: 18, text: 'PEDAL POST' };

// The job that works at Pedal Post (data/jobs.js): they stand behind the
// counter there, and their shifts are delivery runs (data/work.js).
export const POST_JOB = 'courier';

// Names for the place's click areas.
export const POST_TEXT = {
  name: 'Pedal Post',
  door: 'Go outside',
  counter: 'Counter',
};

// The dispatcher behind the counter (feet on POST_COUNTER.behindRow, at
// dispatcherX): an adult in a courier's satchel. Standing `idle`, they
// stamp a parcel now and then (and whenever one is handed in), for
// `stamp` seconds, the stamp thunking down every `thunk`. Clicking them
// gets one of `lines`.
export const POST_DISPATCHER = {
  look: { skin: '#e0ac69', hair: '#5a3825', hairStyle: 'bun', shirt: '#e07a5f' },
  stage: 'adult',
  item: 'satchel',
  idle: [5, 11],
  stamp: 1.6,
  thunk: 0.4,
  label: 'Dispatcher',
  lines: [
    'Pedal Post! Rain or shine.',
    'Route 3 has the big hill.',
    'Parcels in, smiles out.',
    "Mochi's on guard duty.",
    'Fresh coffee on the shelf!',
    'Every parcel matters.',
  ],
};

// The rider: takes a parcel from the pile (reaching down `pick` seconds)
// out of the door to deliver it, is out `out` seconds, and comes back in
// for the next, walking `speed` character pixels a second.
export const POST_RIDER = {
  look: { skin: '#c68642', hair: '#1f1f2e', hairStyle: 'short', shirt: '#2f9e5b' },
  stage: 'adult',
  item: 'satchel',
  speed: 11,
  pick: 1.2,
  out: [20, 45],
  firstOut: [2, 8],
};

// Customers: one at a time comes in every `spawnEvery` seconds (the first
// `firstIn` after the hub is shown) with a parcel, walks `speed`
// character pixels a second to POST_HAND_IN_X, hands it over for `hand`
// seconds (the dispatcher stamps it), and leaves by the door. `elderShare`
// are elders.
export const POST_CUSTOMERS = {
  spawnEvery: [30, 70],
  firstIn: [4, 12],
  speed: 9,
  hand: 3,
  elderShare: 0.25,
};

// Mochi, the hub's shiba, on its bed (POST_DOG_BED), code-drawn at
// SCENE_SCALE. Sleeps `sleep` seconds (breathing every `breath`), sits
// up `sit` seconds (wagging `wagChance` of the time), and sometimes
// (`sniffChance`) trots `speed` scene pixels a second to sniff at the
// door and back. Clicking it wakes it ("Woof?") or gets a wag and
// "Woof!".
export const POST_DOG = {
  sleep: [20, 50],
  breath: 1.3,
  sit: [6, 12],
  wagChance: 0.5,
  wag: 0.2,
  sniffChance: 0.4,
  sniff: 2.5,
  speed: 6,
  label: 'Dog',
  lines: { woken: 'Woof?', awake: 'Woof!' },
  colors: { fur: '#d9873b', cream: '#f6e3c2', dark: '#3d3a4b', nose: '#2e2a35' },
};
