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
export const CAFE_COUNTER = { left: 60, right: 106, top: 54, bottom: 66, behindRow: 62, flap: 62 };

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
