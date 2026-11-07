// alley.js — Mural Alley's numbers and text: a street art alley in town,
// reached only from Go to, outdoors (it gets the weather). Where things
// are in its picture (the way back out to the street, the mural wall, the
// easels, the print stall and the parrot's perch), where the character
// walks and where the worker paints. Pure data: data/places.js,
// data/layout.js and data/work.js use it, ui/alley.js draws it.
//
// The alley is one picture, code-drawn (ui/alley.js) or the alley sprite
// (assets/sprites/alley.png) if there is one, drawn at SCENE_SCALE from the
// window's bottom-left corner like the Cafe's. Positions are in that
// picture's pixels: x from its left edge, rows from its top.

export const ALLEY_PLACE = 'alley';
export const ALLEY_ART = { width: 107, height: 80 };

// Feet on row 72, 8 rows from the bottom, like the Cafe. Walls both sides
// (the street is behind the alley's mouth on the left).
export const ALLEY_FEET_FROM_BOTTOM = 8;
export const ALLEY_WALK = { minX: 8, maxX: 100 };

// The alley's mouth on the left, the street seen through it: its click
// area (columns left..right, rows top..bottom) and the x where someone
// stands to go out to the street or come in.
export const ALLEY_MOUTH_PROP = 'alley.mouth';
export const ALLEY_MOUTH = { left: 1, right: 13, top: 20, bottom: 66, x: 8 };

// The mural on the back wall (columns left..right, rows top..bottom):
// done left of `doneTo`, chalked in beyond it.
export const ALLEY_MURAL = { left: 30, right: 66, top: 18, bottom: 56, doneTo: 52 };

// The easels: the worker's (where the Artist paints, standing at
// `standX` facing `facing`) and the class easel (where an art class is
// painted). `x` is the canvas's middle; it stands on the floor, the
// canvas (7 x 8) from row EASEL_CANVAS_TOP, at a painter's hands.
export const ALLEY_EASEL = { x: 22, standX: 27, facing: -1 };
export const CLASS_EASEL = { x: 74, standX: 69, facing: 1 };
export const EASEL_CANVAS_TOP = 53;

// The print stall on the right: its click area and where buyers stand
// (in front of it, facing it). Clicking it opens its menu.
export const ALLEY_STALL_PROP = 'alley.stall';
export const ALLEY_STALL = { left: 80, right: 105, top: 34, bottom: 66, x: 90 };

// The parrot's perch on the stall's right post: the bird's feet.
export const ALLEY_PERCH = { x: 101, row: 34 };

// The job that works here (data/jobs.js): they paint at the easel, and
// their shifts are painting there (data/work.js).
export const ALLEY_JOB = 'artist';

// Names for the place's click areas.
export const ALLEY_TEXT = {
  name: 'Mural Alley',
  mouth: 'Back to the street',
  stall: 'Print stall',
};

// The painter at the mural (feet on the floor): a young adult in a beret.
// Sprays the chalked-in part (an arm up, puffs of paint) for `spray`
// seconds, steps back to look at it for `gaze`, then walks `speed`
// character pixels a second to another of `spots` along it. Clicking them
// gets one of `lines` (and the parrot hears it).
export const ALLEY_PAINTER = {
  look: { skin: '#f1c27d', hair: '#c0504d', hairStyle: 'long', shirt: '#2f7fb0' },
  stage: 'adult',
  item: 'beret',
  spots: [50, 55, 60],
  spray: [3, 6],
  gaze: [2, 4],
  speed: 8,
  puffEvery: 0.25,
  label: 'Painter',
  lines: [
    'Every wall wants a story.',
    'Mind the wet paint!',
    'Blue skies, always.',
    "Rio's my best critic.",
    'Just one more wave...',
    'Art is for everyone!',
  ],
};

// Visitors: at most `max` at once, one every `spawnEvery` seconds (the
// first `firstIn` after the alley is shown). Each comes in from the
// street, walks `speed` character pixels a second to one of `spots` (the
// mural, or the stall), looks `gaze` seconds, sometimes (`secondLook`)
// another, and leaves. `elderShare` are elders; `childShare` children.
export const ALLEY_VISITORS = {
  max: 2,
  spawnEvery: [20, 50],
  firstIn: [3, 10],
  speed: 9,
  gaze: [4, 9],
  spots: [36, 42, 47, 92],
  secondLook: 0.4,
  elderShare: 0.2,
  childShare: 0.2,
};

// Rio the parrot on its perch (ALLEY_PERCH), code-drawn at SCENE_SCALE:
// sits, bobs its head every `bob` seconds, and now and then
// (`flapChance`) flaps for `flap` seconds. Clicked it repeats what the
// painter said last (once), else says one of `lines`, with a flap.
export const ALLEY_PARROT = {
  bob: [2, 5],
  bobFor: 0.6,
  flap: 0.9,
  flapChance: 0.3,
  label: 'Parrot',
  lines: ['Pretty!', 'Squawk! Art!', 'Hello! Hello!', 'Paint! Paint!'],
  colors: { body: '#2f9e5b', wing: '#3b7dd8', tail: '#e2403a', face: '#f4efe6', beak: '#3d3a4b', perch: '#6b4f3a' },
};


// The print stall's menu (from ALLEY_MIN_AGE): each item's price, what it
// gives, how long it takes there and how often it can be had (real
// minutes; game speed doesn't change it, and it waits while the app is
// closed). Paid at once. An art class is painted at the class easel
// (CLASS_EASEL) for `seconds`, its canvas filling in; a print is picked
// out at the stall. `thing` names it in the bar and the bubble. Money
// sinks (AGENTS.md): a print is about a quarter of an hour of an entry
// job's pay, a class (once a real day) under half an hour's.
export const ALLEY_MIN_AGE = 6;
export const ALLEY_ITEMS = {
  class: {
    name: 'Take an art class', thing: 'art class', price: 10, effects: { smarts: 2, happiness: 2 },
    everyMinutes: 1440, seconds: 60,
  },
  print: { name: 'Buy a print', thing: 'print', price: 6, effects: { happiness: 3 }, everyMinutes: 60, seconds: 4 },
};

// The stall's menu, the bar and the bubbles. {item} is an item's `thing`,
// {age} an age, {time} "0:42", {total} "1:00".
export const ALLEY_MENU_TEXT = {
  title: 'Print stall',
  tooYoung: 'Come back at age {age} for a class.',
  busy: 'Busy with the {item}...',
  idle: 'Prints for sale. Classes daily!',
};
export const ALLEY_BAR_TEXT = {
  toEasel: 'Off to the easel...',
  toStall: 'Heading to the stall...',
  class: 'Art class - {time} of {total}',
  print: 'Picking out a print...',
};
export const ALLEY_NEWS = {
  class: { heading: 'Class done!', text: 'You learned a new trick.' },
  print: { heading: 'A new print!', text: "It'll look lovely at home." },
};
