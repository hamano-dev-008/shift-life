// characterParts.js — The layered character art (parts.<set>.<animation>.<part>.png) for every life
// stage: frame size, each part set's animations, parts in order and where
// the head, torso and arm sit in each frame, the sleeping head, and how the
// parts' colors follow the appearance.

import { MOUTH_COLOR, MOUTH_COLOR_LIGHT, ELDER_HAIR_COLOR } from './appearance.js';

// Each frame is `width` x `height` with no outline; column `center` is the
// character's center and the bottom row is left empty for the outline, one
// below the feet (like the code-drawn character's layer).
export const PART_FRAME = { width: 20, height: 26, center: 10 };

// Parts back to front. `{hair}` is the appearance's hair style; `face` is
// face.<expression>, face.blink while blinking, or (with the set's
// `lookBack`, sitting) face.back while looking back over the shoulder;
// `onlyFor` limits a part to one hair style and `onlyIn` to one
// animation; `then` draws the job item's torso or head piece (ui/sprite.js)
// right after the part; `arm` is the front arm, left out where the pose
// draws its own (a standing activity's, the busker's strumming arm);
// `still` parts don't move with a sitting baby's wobble.
const ADULT_ORDER = [
  { part: 'hair.long.back', onlyFor: 'long' },
  { part: 'body' },
  { part: 'clothes', then: 'bodyItem' },
  { part: 'arm', arm: true },
  { part: 'face' },
  { part: 'hair.{hair}', then: 'headItem' },
];
// Children's and teens' clothes are part of `body`.
const KID_ORDER = [
  { part: 'hair.long.back', onlyFor: 'long' },
  { part: 'body', then: 'bodyItem' },
  { part: 'arm', arm: true },
  { part: 'face' },
  { part: 'hair.{hair}', then: 'headItem' },
];
// Babies and toddlers: arms in `body`, a tuft of hair whatever the style.
const INFANT_ORDER = [
  { part: 'legs', onlyIn: 'sit', still: true },
  { part: 'body' },
  { part: 'face' },
  { part: 'hair.tuft' },
];

// Where things are in a frame, in the frame's pixels (column from the
// left, row from the top), as the code-drawn figure puts them (frame
// column = 10 + code column, frame row = code row - 4) and checked
// against the art: `head` is the head's top-left and `body` the torso's
// top-left and its rows, for job items (a breathing frame's shoulders dip
// a row; walking's passing frames bob up one; a toddler's head sways);
// `arm` is the front arm's column and the row above its shoulder, where a
// pose's own arm and what it holds go (the art's arm doesn't dip with a
// breath). Babies and toddlers have no `arm` (they don't do activities).
const place = (head, body, arm) => ({ head, body, arm });

// Each part set: the parts in order, its animations (frames and each
// frame's place; idle's and sit's frame is pose.breath, walk's and
// crawl's floor(pose.walk.cycle * frames)), `guitar` (busking on the sit
// art: drawGuitar()'s hip column and the ground row, in the frame's
// pixels), `hair` (a color all its hair is recolored from instead of the
// character's), `lookBack` and `lying` (asleep, the head comes from
// LYING_PARTS). Standing activities use idle, jogging walk, and every
// sitting pose (busking, a plop, the end of a life) sit. A toddler (the
// toddle gait, also when plopped down) uses `toddler`.
const ADULT = place([6, 5], [6, 13, 6], [14, 13]);
const ADULT_BOB = place([6, 4], [6, 12, 6], [14, 12]);
const CHILD = place([6, 10], [7, 18, 4], [13, 18]);
const CHILD_BOB = place([6, 9], [7, 17, 4], [13, 17]);
const TEEN = place([6, 7], [7, 15, 5], [14, 15]);
const TEEN_BOB = place([6, 6], [7, 14, 5], [14, 14]);
const ELDER = place([7, 6], [6, 14, 6], [14, 14]);
const ELDER_BOB = place([7, 5], [6, 13, 6], [14, 13]);
const CRAWL = place([9, 15], [5, 20, 3]);
export const PART_SETS = {
  baby: {
    order: INFANT_ORDER,
    lookBack: true,
    animations: {
      sit: { frames: 2, places: [place([7, 15], [7, 22, 3]), place([7, 16], [7, 23, 2])] },
      crawl: { frames: 8, places: Array(8).fill(CRAWL) },
    },
  },
  toddler: {
    order: INFANT_ORDER,
    lookBack: true,
    animations: {
      idle: { frames: 2, places: [place([7, 12], [7, 19, 4]), place([7, 13], [7, 20, 3])] },
      walk: {
        frames: 4,
        places: [place([7, 12], [7, 19, 4]), place([8, 11], [7, 18, 4]), place([7, 12], [7, 19, 4]), place([6, 11], [7, 18, 4])],
      },
      sit: { frames: 2, places: [place([7, 14], [7, 21, 4]), place([7, 15], [7, 22, 3])] },
    },
  },
  child: {
    order: KID_ORDER,
    lying: true,
    guitar: { hip: 12, ground: 24 },
    animations: {
      idle: { frames: 2, places: [CHILD, place([6, 11], [7, 19, 3], [13, 18])] },
      walk: { frames: 8, places: [CHILD, CHILD, CHILD_BOB, CHILD_BOB, CHILD, CHILD, CHILD_BOB, CHILD_BOB] },
      sit: { frames: 2, places: [place([6, 13], [7, 21, 4], [13, 21]), place([6, 14], [7, 22, 3], [13, 21])] },
    },
  },
  teen: {
    order: KID_ORDER,
    lying: true,
    guitar: { hip: 13, ground: 24 },
    animations: {
      idle: { frames: 2, places: [TEEN, place([6, 8], [7, 16, 4], [14, 15])] },
      walk: { frames: 8, places: [TEEN, TEEN, TEEN_BOB, TEEN_BOB, TEEN, TEEN, TEEN_BOB, TEEN_BOB] },
      sit: { frames: 2, places: [place([6, 12], [7, 20, 5], [14, 20]), place([6, 13], [7, 21, 4], [14, 20])] },
    },
  },
  adult: {
    order: ADULT_ORDER,
    lying: true,
    guitar: { hip: 13, ground: 24 },
    animations: {
      idle: { frames: 2, places: [ADULT, place([6, 6], [6, 14, 5], [14, 13])] },
      walk: { frames: 8, places: [ADULT, ADULT, ADULT_BOB, ADULT_BOB, ADULT, ADULT, ADULT_BOB, ADULT_BOB] },
      sit: { frames: 2, places: [place([6, 11], [6, 19, 6], [14, 19]), place([6, 12], [6, 20, 5], [14, 19])] },
    },
  },
  // Elders' heads lean a column forward, sitting too.
  elder: {
    order: ADULT_ORDER,
    hair: ELDER_HAIR_COLOR,
    lying: true,
    guitar: { hip: 13, ground: 24 },
    animations: {
      idle: { frames: 2, places: [ELDER, place([7, 7], [6, 15, 5], [14, 14])] },
      walk: { frames: 4, places: [ELDER, ELDER_BOB, ELDER, ELDER_BOB] },
      sit: { frames: 2, places: [place([7, 11], [6, 19, 6], [14, 19]), place([7, 12], [6, 20, 5], [14, 19])] },
    },
  },
};

// Asleep (sets with `lying`): the head from the adult's parts
// (parts.adult.lying.<part>.png), one 16 x 16 frame each, drawn back to
// front over the code-drawn pillow, shoulders and blanket, its 8 x 8
// head's top-left at `head` put where the code-drawn sleeping head goes.
// `mouthOpen` is the tiny "o" every few breaths (pixels from the head's
// top-left, in the mouth's color). Babies and toddlers sleep code-drawn.
export const LYING_PARTS = {
  set: 'adult',
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
