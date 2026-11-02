// lake.js — The Lake's numbers and text: where the character can stand and
// walk, the dock's click area and fishing spot, where the bobber lands,
// and the water shimmer. Pure data: data/places.js and data/layout.js use it for
// the place and the dock prop, ui/lake.js draws the shimmer, ui/fishing.js
// the line and bobber. Fishing itself is in data/activities.js and
// data/fishing.js.
//
// The Lake's background is one picture, lake.png (assets/sprites/), drawn
// at SCENE_SCALE from the window's bottom-left corner. Positions below are
// in that picture's pixels: x from its left edge, rows from its top
// (row 0 is the top row, LAKE_ART.height - 1 the bottom one). Change them
// to match the art if it changes.

// The place's id (saved; don't rename it).
export const LAKE_PLACE = 'lake';

// The picture's size. The code-drawn Lake (used when lake.png is missing)
// is drawn this size too.
export const LAKE_ART = { width: 107, height: 80 };

// Rows above the window bottom where the character's feet rest at the
// Lake: the dock top and shore are row 68, 12 rows from the bottom.
export const LAKE_FEET_FROM_BOTTOM = 12;

// Where the character's center may walk at the Lake: from the dock's left
// tip to the right edge. null keeps the usual limit (WANDER_MARGIN in
// data/layout.js) on that side. A side with a limit is closed: work trips
// leave through the other side.
export const LAKE_WALK = { minX: 25, maxX: null };

// The dock's prop id (its click area and visit spot; data/layout.js).
// Clicking it opens the fishing menu (data/activities.js).
export const DOCK_PROP = 'lake.dock';

// The dock's click area, columns left..right and rows top..bottom (both
// inclusive), and the fishing spot near its left tip (the x where the
// character stands when visiting the dock).
export const DOCK = { left: 25, right: 80, top: 67, bottom: 71 };

// The dock's wood in lake.png (its dark top edge, gold planks, brown side
// and posts): the pixels of these colors inside DOCK are the dock's
// silhouette, for the hover outline. Without lake.png (or with none of
// these colors there) the outline goes around the click area instead.
export const DOCK_COLORS = ['#4e3952', '#5e4e5b', '#f4c657', '#ecaf50', '#8e5f4f', '#2d2e56', '#50423f'];
export const FISHING_SPOT_X = 27;

// Where the bobber lands, cast to the left into the open water: the
// column of its middle and the water row it floats on.
export const BOBBER_SPOT = { x: 12, row: 69 };

// The water shimmer: a few highlight pixels that slowly twinkle and drift
// across the water, drawn in code over the background.
//   area      The water they may appear on (columns left..right, rows
//             top..bottom, inclusive).
//   avoid     Boxes in the area they never show on (the dock and its
//             posts), same format.
//   count     How many sparkles there are.
//   colors    Their colors from faint to brightest; a sparkle steps up
//             through them and back down. The brightest is 2 pixels wide.
//   cycle     Seconds one twinkle takes (each sparkle picks its own in
//             this range). After each one it shows up somewhere else.
//   visible   Share of each cycle the sparkle shows (the rest it's gone).
//   drift     Pixels per second it drifts sideways (its own speed in this
//             range, either way).
export const SHIMMER = {
  area: { left: 0, right: 78, top: 61, bottom: 79 },
  avoid: [{ left: 23, right: 90, top: 66, bottom: 75 }],
  count: 7,
  colors: ['#79ade9', '#a9cdf3', '#e6f2fd'],
  cycle: [3, 6],
  visible: 0.45,
  drift: [0.3, 0.9],
};
