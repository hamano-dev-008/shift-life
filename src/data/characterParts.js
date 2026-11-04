// characterParts.js — The layered adult character art (parts.adult.<animation>.<part>.png):
// frame size, which parts stack in which order, where the head and torso
// sit in each frame, and how the parts' colors follow the appearance.

import { MOUTH_COLOR, MOUTH_COLOR_LIGHT } from './appearance.js';

// Each frame is `width` x `height` with no outline; column `center` is the
// character's center and the bottom row is left empty for the outline, one
// below the feet (like the code-drawn character's layer).
export const PART_FRAME = { width: 20, height: 26, center: 10 };

// Frames per animation: idle's frame is pose.breath, walk's
// floor(pose.walk.cycle * frames).
export const PART_ANIMATIONS = { idle: { frames: 2 }, walk: { frames: 8 } };

// Back to front. `{hair}` is the appearance's hair style; `face` is
// face.<expression>, or face.blink while blinking; `onlyFor` limits a part
// to one hair style; `then` draws the job item's torso or head piece
// (ui/sprite.js) right after the part.
export const PART_ORDER = [
  { part: 'hair.long.back', onlyFor: 'long' },
  { part: 'body' },
  { part: 'clothes', then: 'bodyItem' },
  { part: 'face' },
  { part: 'hair.{hair}', then: 'headItem' },
];

// Where the art's head and torso are in each frame, in the frame's pixels
// (column from the left, row from the top), for drawing job items on them:
// `head` is the 8 x 8 head's top-left, `body` the torso's top-left and its
// rows (the breathing frame's shoulders dip a row; the walk's passing
// frames bob up one).
const STILL = { head: [6, 5], body: [6, 13, 6] };
const BOB = { head: [6, 4], body: [6, 12, 6] };
export const PART_PLACES = {
  idle: [STILL, { head: [6, 6], body: [6, 14, 5] }],
  walk: [STILL, STILL, BOB, BOB, STILL, STILL, BOB, BOB],
};

// Recoloring by exact color match. Each art color in `from` becomes the
// appearance's `base` color (skin, hair or shirt) mixed toward `toward` by
// `amount`: mix(c, t, k) = c + (t - c) * k per channel, rounded. Where
// `over` is set, `toward` or `amount` is a pair [if not, if so] picked by
// whether R+G+B of the base color is over it. Pants, shoes, eyes and eye
// whites aren't listed, so they keep their colors.
const SHADE = [70, 40, 90];
const HIGHLIGHT = [255, 240, 200];
export const PART_COLORS = [
  { from: '#f1c27d', base: 'skin' },
  { from: '#cfa376', base: 'skin', toward: SHADE, amount: 0.2 },
  // The far leg while walking.
  { from: '#b08770', base: 'skin', toward: SHADE, amount: 0.38 },
  { from: '#e0b37a', base: 'skin', toward: SHADE, amount: 0.1 },
  { from: '#5a3825', base: 'hair' },
  { from: '#553432', base: 'hair', toward: SHADE, amount: 0.25 },
  // The art's highlight is this formula's result for its own hair color.
  { from: '#6e4e39', base: 'hair', toward: HIGHLIGHT, amount: [0.12, 0.3], over: 200 },
  { from: '#e07a5f', base: 'shirt' },
  { from: '#c16a5e', base: 'shirt', toward: SHADE, amount: 0.2 },
  // Dark on light skin, light on dark skin, so the mouth stays readable.
  { from: '#5f4036', base: 'skin', toward: [MOUTH_COLOR_LIGHT, MOUTH_COLOR], amount: 0.8, over: 420 },
];
