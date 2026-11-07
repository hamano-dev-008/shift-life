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
// through it) and its sliding door: the door's click area and the x where
// someone stands to go in or out.
export const STORE_FRONT = { left: 0, right: 27, top: 16, bottom: 66 };
export const STORE_DOOR_PROP = 'store.door';
export const STORE_DOOR = { left: 4, right: 16, top: 24, bottom: 66, x: 10 };

// The sidewalk outside, seen through the glass: the row a pigeon walks on
// and how far it goes.
export const STORE_SIDEWALK = { row: 62, left: 2, right: 25 };

// The register counter on the right: columns left..right, its top (the
// lighter row) and the bottom of its front. Behind it the floor is
// further back (`behindRow`), so its front hides the legs of whoever
// stands there. `flap` is where the character steps in to work; the
// clerk stays at `clerkX` by the register. Clicking it opens the
// register's menu.
export const STORE_COUNTER_PROP = 'store.counter';
export const STORE_COUNTER = { left: 70, right: 106, top: 52, bottom: 66, behindRow: 58, flap: 74, clerkX: 92 };

// Where the register (on the counter) and the hot food case are, by their
// middle x; where shoppers stand to pay (on the floor, in front of the
// register).
export const STORE_REGISTER_X = 86;
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
