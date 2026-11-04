// characterParts.js — The layered adult character art (parts.adult.<animation>.<part>.png):
// frame size, which parts stack in which order, where the head and torso
// sit in each frame, and how the parts' colors follow the appearance.

import { MOUTH_COLOR, MOUTH_COLOR_LIGHT } from './appearance.js';

// Each frame is `width` x `height` with no outline; column `center` is the
// character's center and the bottom row is left empty for the outline, one
// below the feet (like the code-drawn character's layer).
export const PART_FRAME = { width: 20, height: 26, center: 10 };

// Frames per animation: idle's and sit's frame is pose.breath, walk's
// floor(pose.walk.cycle * frames). Standing activities use idle, jogging
// walk, and every sitting pose (busking, the end of a life) sit.
export const PART_ANIMATIONS = { idle: { frames: 2 }, walk: { frames: 8 }, sit: { frames: 2 } };

// Back to front. `{hair}` is the appearance's hair style; `face` is
// face.<expression>, or face.blink while blinking; `onlyFor` limits a part
// to one hair style; `then` draws the job item's torso or head piece
// (ui/sprite.js) right after the part. `arm` is the front arm, left out
// where the pose draws its own (a standing activity's, the busker's
// strumming arm).
export const PART_ORDER = [
  { part: 'hair.long.back', onlyFor: 'long' },
  { part: 'body' },
  { part: 'clothes', then: 'bodyItem' },
  { part: 'arm', arm: true },
  { part: 'face' },
  { part: 'hair.{hair}', then: 'headItem' },
];

// Where things are in each frame, in the frame's pixels (column from the
// left, row from the top): `head` is the 8 x 8 head's top-left and `body`
// the torso's top-left and its rows, for job items (the breathing frame's
// shoulders dip a row; the walk's passing frames bob up one); `arm` is the
// front arm's column and the row above its shoulder, where a pose's own
// arm and what it holds go (the art's arm doesn't dip with a breath).
const STILL = { head: [6, 5], body: [6, 13, 6], arm: [14, 13] };
const BOB = { head: [6, 4], body: [6, 12, 6], arm: [14, 12] };
export const PART_PLACES = {
  idle: [STILL, { head: [6, 6], body: [6, 14, 5], arm: [14, 13] }],
  walk: [STILL, STILL, BOB, BOB, STILL, STILL, BOB, BOB],
  sit: [
    { head: [6, 11], body: [6, 19, 6], arm: [14, 19] },
    { head: [6, 12], body: [6, 20, 5], arm: [14, 19] },
  ],
};

// Busking on the sit art: the guitar's hip column and the ground row it
// rests on (drawGuitar() in ui/sprite.js), in the frame's pixels.
export const PART_GUITAR = { hip: 13, ground: 24 };

// Asleep: the adult's head (parts.adult.lying.<part>.png), one 16 x 16
// frame each, drawn back to front over the code-drawn pillow, shoulders
// and blanket, its 8 x 8 head's top-left at `head` put where the
// code-drawn sleeping head goes. `mouthOpen` is the tiny "o" every few
// breaths (pixels from the head's top-left, in the mouth's color).
export const LYING_PARTS = {
  frame: { width: 16, height: 16 },
  head: [5, 4],
  order: ['head', 'hair.{hair}', 'face.sleep'],
  mouthOpen: [[6, 2], [6, 3], [6, 4], [5, 3]],
};

// Recoloring by exact color match. Each art color in `from` becomes the
// appearance's `base` color (skin, hair or shirt) mixed toward `toward` by
// `amount`: mix(c, t, k) = c + (t - c) * k per channel, rounded. Where
// `over` is set, `toward` or `amount` is a pair [if not, if so] picked by
// whether R+G+B of the base color is over it. Pants, shoes, eyes and eye
// whites aren't listed, so they keep their colors.
const SHADE = [70, 40, 90];
const HIGHLIGHT = [255, 240, 200];
// The art's mouth color (the sleeping head's open "o" uses its recolor).
export const PART_MOUTH = '#5f4036';
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
  { from: PART_MOUTH, base: 'skin', toward: [MOUTH_COLOR_LIGHT, MOUTH_COLOR], amount: 0.8, over: 420 },
];
