// store.js — The 6-Eleven's numbers and text: a small, bright konbini in
// town, reached only from Go to. Where things are in its picture (the
// glass front and its door, the register counter, the fridges, the
// shelves), where the character walks and where the worker stands behind
// the register. Pure data: data/places.js, data/layout.js and
// data/work.js use it, ui/store.js draws it.
//
// The store is one picture, code-drawn (ui/store.js) or the store sprite
// (assets/sprites/store.png) if there is one, drawn at SCENE_SCALE from
// the window's bottom-left corner like the Cafe's. Positions are in that
// picture's pixels: x from its left edge, rows from its top.

export const STORE_PLACE = 'store';
export const STORE_ART = { width: 107, height: 80 };

// Feet on row 72, 8 rows from the bottom, like the Cafe. Walls (the glass
// front on the left, a wall on the right) on both sides.
export const STORE_FEET_FROM_BOTTOM = 8;
export const STORE_WALK = { minX: 8, maxX: 100 };

// The glass front (columns left..right, rows top..bottom; the street shows
// through it) and its sliding door: the door's columns, its click area's
// rows (it stops above the sidewalk seen through it, so the pigeon there
// can be clicked) and the x where someone stands to go in or out.
export const STORE_FRONT = { left: 0, right: 27, top: 16, bottom: 66 };
export const STORE_DOOR_PROP = 'store.door';
export const STORE_DOOR = { left: 4, right: 16, top: 24, bottom: 54, x: 10 };

// The sidewalk outside, seen through the glass: the row a pigeon walks on
// and how far it goes (the stretch seen through the door, clear of the
// magazine rack).
export const STORE_SIDEWALK = { row: 62, left: 3, right: 15 };

// The register counter on the right: columns left..right, its top (the
// lighter row) and the bottom of its front. Behind it the floor is
// further back (`behindRow`), so its front hides the legs of whoever
// stands there. `flap` is where the character steps in to work; the
// clerk stays at `clerkX` by the register. Clicking it opens the
// register's menu.
export const STORE_COUNTER_PROP = 'store.counter';
export const STORE_COUNTER = { left: 70, right: 106, top: 52, bottom: 66, behindRow: 56, flap: 74, clerkX: 89 };

// Where the register (on the counter) and the hot food case are, by their
// middle x; where shoppers stand to pay (on the floor, in front of the
// register).
export const STORE_REGISTER_X = 81;
export const STORE_HOT_CASE_X = 100;
export const STORE_PAY_X = 80;

// Where shoppers stop to browse: the drink fridges along the back wall and
// the snack shelves in the middle, by x.
export const STORE_BROWSE = [32, 42, 52, 62];

// The sign over the register (columns left..right, rows top..bottom) and
// what it says, in its 3 x 5 pixel letters.
export const STORE_SIGN = { left: 69, right: 103, top: 7, bottom: 21, text: '6-ELEVEN' };

// The job that works at the 6-Eleven (data/jobs.js): they stand behind
// the register there, and can work shifts (data/work.js).
export const STORE_JOB = 'shop';

// Names for the place's click areas.
export const STORE_TEXT = {
  name: '6-Eleven',
  door: 'Go outside',
  counter: 'Register',
};

// The clerk behind the register (feet on STORE_COUNTER.behindRow, at
// clerkX): a young adult on a long night, in the shop's cap. Standing
// `idle`, now and then (`yawnChance` each time) a big yawn and stretch
// for `yawn` seconds; scanning while a shopper pays. Clicking them gets
// one of `lines`.
export const STORE_CLERK = {
  look: { skin: '#f1c27d', hair: '#2b1d14', hairStyle: 'spiky', shirt: '#2f9e5b' },
  stage: 'adult',
  item: 'cap',
  idle: [4, 9],
  yawn: 1.6,
  yawnChance: 0.3,
  label: 'Clerk',
  lines: [
    'Welcome to 6-Eleven!',
    'Point card? ...No? Okay.',
    'Want that heated up?',
    'Bag for that?',
    'Long night...',
    'Six is the new seven.',
  ],
};

// Shoppers: at most `max` at once, one every `spawnEvery` seconds (the
// first `firstIn` after the store is shown). Each comes in at the door
// (the door chimes `chime`), walks `speed` character pixels a second to
// a spot in STORE_BROWSE and browses `browse` seconds (reaching up for
// something `reachChance` of the time), sometimes (`secondLook`) a second
// spot, then waits their turn and pays at STORE_PAY_X for `pay` seconds
// while the clerk scans, and leaves by the door. `elderShare` are elders.
export const STORE_SHOPPERS = {
  max: 2,
  spawnEvery: [25, 60],
  firstIn: [3, 10],
  speed: 10,
  browse: [3, 7],
  reachChance: 0.5,
  secondLook: 0.5,
  pay: [3, 5],
  queueGap: 7,
  elderShare: 0.2,
  chime: 'ding-dong!',
};

// The pigeon on the sidewalk outside (STORE_SIDEWALK), code-drawn at
// SCENE_SCALE: it walks `speed` scene pixels a second (head bobbing every
// `bob`), stops to peck (`peck` seconds) or stands (`idle`); clicked, it
// flies off up and away at `flySpeed` and lands back `returnIn` seconds
// later. `line` is its bubble when clicked.
export const STORE_PIGEON = {
  speed: 2,
  bob: 0.25,
  peck: [1.5, 4],
  idle: [2, 6],
  flySpeed: 22,
  returnIn: [15, 35],
  label: 'Pigeon',
  line: 'coo!',
  colors: { body: '#8d93a0', dark: '#5c6270', neck: '#6fb39a', beak: '#3d3a4b', feet: '#e98b8b' },
};

// Buying at the register (from STORE_MIN_AGE): each item's price, what
// it gives once eaten or drunk, and how often it can be had (real
// minutes; game speed doesn't change it, and it waits while the app is
// closed). The character pays at the register (PURCHASE_TIMES.pay seconds
// while the clerk scans), then has it by the glass front at STORE_EAT_X
// for PURCHASE_TIMES.enjoy seconds ("munch!"). Money sinks (AGENTS.md):
// a few minutes of an entry job's pay each.
//
// The scratch card is had the same way but scratched instead
// (PURCHASE_TIMES.scratch seconds): it wins one of `prizes` (each with
// its chance), else nothing. On average it pays back $1.30 of its $2
// (0.08 x $10 + 0.01 x $50), so it's a sink too, never a way to earn.
export const STORE_MIN_AGE = 6;
export const STORE_ITEMS = {
  onigiri: { name: 'Onigiri', price: 2, effects: { health: 1, happiness: 1 }, everyMinutes: 60 },
  iceCream: { name: 'Ice cream', price: 3, effects: { happiness: 3 }, everyMinutes: 60 },
  energyDrink: { name: 'Energy drink', price: 4, effects: { health: 3 }, everyMinutes: 60 },
  scratch: {
    name: 'Scratch card',
    price: 2,
    everyMinutes: 60,
    prizes: [{ chance: 0.08, pay: 10 }, { chance: 0.01, pay: 50 }],
  },
};
export const PURCHASE_TIMES = { pay: 3, enjoy: 20, scratch: 3 };
export const STORE_EAT_X = 22;

// What's in their hand while they have it (ui/storeLifeArt.js): each
// item's colors.
export const STORE_ITEM_COLORS = {
  onigiri: { main: '#fbfaf5', wrap: '#2e2a35' },
  iceCream: { main: '#f4c6c6', wrap: '#d9a85a' },
  energyDrink: { main: '#3b7dd8', wrap: '#f2d94e' },
  scratch: { main: '#f2d94e', wrap: '#c0c4cc' },
};

// The register's menu, the bar and the bubbles. {item} is an item's name,
// {pay} dollars, {age} an age.
export const STORE_MENU_TEXT = {
  title: 'Register',
  tooYoung: 'Come back at age {age} for a snack.',
  busy: 'Having the {item}...',
  idle: 'Grab a snack, or try your luck.',
};
export const STORE_BAR_TEXT = {
  toRegister: 'Heading to the register...',
  paying: 'Paying for the {item}...',
  toWindow: 'Off to the window...',
  enjoying: 'Having the {item}...',
  scratching: 'Scratching the card...',
};
export const STORE_NEWS = {
  munch: { heading: 'Munch!', text: 'The {item} hits the spot.' },
  won: { heading: 'A winner!', text: 'The scratch card pays ${pay}!' },
  lost: { text: 'No luck this time...' },
};
