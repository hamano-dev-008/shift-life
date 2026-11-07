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
