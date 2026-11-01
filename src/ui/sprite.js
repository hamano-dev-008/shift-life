// sprite.js — Draws the character as a small pixel sprite, in code. All
// character drawing lives here so it can be swapped for hand-drawn sprite
// sheets later without touching the rest of the game.
//
// The sprite is painted facing right on a small layer in sprite pixels,
// outlined, then scaled up by SPRITE_SCALE (mirrored when facing left).

import { CHARACTER_SHAPES } from '../data/characterShapes.js';
import { SPRITE_SCALE } from '../data/layout.js';
import {
  ELDER_HAIR_COLOR, PANTS_COLOR, SHOE_COLOR, EYE_COLOR, EYE_WHITE,
  MOUTH_COLOR, MOUTH_COLOR_LIGHT, OUTLINE_COLOR, SHADOW_COLOR,
} from '../data/appearance.js';
import { createLayer, clearLayer, fill, outline, drawLayer } from './pixel.js';

// Big enough for the tallest stage plus hair and outline. Column ANCHOR is
// the character's center; feet end just above the last row, which is left
// for the outline.
const LAYER_WIDTH = 24;
const LAYER_HEIGHT = 30;
const ANCHOR = 12;
const FOOT_ROW = LAYER_HEIGHT - 1;

// Mouth pixels as [col, row] offsets from the mouth's top-left.
const MOUTHS = {
  smile: [[0, 0], [1, 1], [2, 1], [3, 0]],
  neutral: [[1, 1], [2, 1]],
  frown: [[0, 1], [1, 0], [2, 0], [3, 1]],
};

const layer = createLayer(LAYER_WIDTH, LAYER_HEIGHT);

// Draws the character. `pose` comes from poseOf() in animator.js;
// `expression` is 'smile', 'neutral', or 'frown'; feetY is the canvas row
// the feet rest on.
export function drawCharacter(ctx, pose, stage, appearance, expression, feetY) {
  const shape = CHARACTER_SHAPES[stage];
  const px = (col, row, w, h, color) => fill(layer, ANCHOR + col, row, w, h, color);

  // Mid-stride the body sinks 1px; idle breathing dips the head 1px.
  const legsTop = FOOT_ROW - shape.legs;
  const bodyTop = legsTop - shape.body + (pose.stride ? 1 : 0);
  const headTop = bodyTop - shape.head + pose.breath;
  const bodyLeft = -Math.floor(shape.width / 2);
  const headLeft = -Math.floor(shape.head / 2) + shape.stoop;

  clearLayer(layer);
  drawLegs(px, shape, stage, appearance, bodyLeft, legsTop, pose.stride);
  drawBody(px, shape, appearance, bodyLeft, bodyTop);
  drawHead(px, shape, stage, appearance, headLeft, headTop, pose.blinking, expression);
  outline(layer, OUTLINE_COLOR);

  const shadowWidth = (shape.width + 2) * SPRITE_SCALE;
  ctx.fillStyle = SHADOW_COLOR;
  ctx.fillRect(pose.x - shadowWidth / 2, feetY, shadowWidth, SPRITE_SCALE);
  drawLayer(ctx, layer, pose.x, feetY + SPRITE_SCALE, SPRITE_SCALE, {
    anchorCol: ANCHOR,
    flip: pose.facing === -1,
  });
}

// Two legs, 2px wide. Mid-stride they splay apart (front leg forward, back
// leg back) more toward the feet; otherwise they stand straight.
function drawLegs(px, shape, stage, look, bodyLeft, legsTop, stride) {
  const back = bodyLeft + 1;
  const front = bodyLeft + shape.width - 3;
  const maxSplay = Math.min(2, Math.ceil(shape.legs / 2));
  for (let i = 0; i < shape.legs; i++) {
    const splay = stride ? Math.round(((i + 1) / shape.legs) * maxSplay) : 0;
    const isFoot = i === shape.legs - 1;
    // Babies have bare feet under a onesie; feet get a toe pointing forward.
    const color = stage === 'baby' ? look.skin : isFoot ? SHOE_COLOR : PANTS_COLOR;
    const width = isFoot ? 3 : 2;
    px(back - splay, legsTop + i, width, 1, color);
    px(front + splay, legsTop + i, width, 1, color);
  }
}

// Torso with an arm on each side: short sleeve, then bare arm and hand.
function drawBody(px, shape, look, bodyLeft, bodyTop) {
  px(bodyLeft, bodyTop, shape.width, shape.body, look.shirt);
  const armLength = shape.body - 1;
  const sleeve = Math.ceil(armLength / 2);
  for (const col of [bodyLeft - 1, bodyLeft + shape.width]) {
    px(col, bodyTop + 1, 1, sleeve, look.shirt);
    px(col, bodyTop + 1 + sleeve, 1, armLength - sleeve, look.skin);
  }
}

// Head in 3/4 view facing right: the back of the head is column 0 and the
// face sits toward the high columns. Hair only frames the top and sides,
// so eyes and mouth always stay visible.
function drawHead(px, shape, stage, look, headLeft, headTop, blinking, expression) {
  const size = shape.head;
  const at = (col, row, w, h, color) => px(headLeft + col, headTop + row, w, h, color);

  at(0, 0, size, size, look.skin);

  const hairColor = stage === 'elder' ? ELDER_HAIR_COLOR : look.hair;
  const hairStyle = stage === 'baby' ? 'tuft' : look.hairStyle;
  drawHair((col, row, w, h) => at(col, row, w, h, hairColor), hairStyle, size);

  // Eyes are 2x2: white toward the back, pupil toward the front. A cheek
  // row separates them from the mouth so expressions stay distinct.
  const eyeRow = Math.floor(size / 2) - 2;
  for (const col of [size - 6, size - 3]) {
    if (blinking) {
      at(col, eyeRow + 1, 2, 1, EYE_COLOR);
    } else {
      at(col, eyeRow, 1, 2, EYE_WHITE);
      at(col + 1, eyeRow, 1, 2, EYE_COLOR);
    }
  }

  const mouthLeft = size - 6;
  const mouthTop = eyeRow + 3;
  // Darker skin gets a lighter mouth so it stays readable.
  const mouthColor = brightness(look.skin) < 0.4 ? MOUTH_COLOR_LIGHT : MOUTH_COLOR;
  for (const [col, row] of MOUTHS[expression]) {
    at(mouthLeft + col, mouthTop + row, 1, 1, mouthColor);
  }
}

// Perceived brightness (0-1) of a '#rrggbb' color.
function brightness(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// `px(col, row, w, h)` paints hair relative to the head's top-left (rows
// above 0 sit on top of the head). Every style keeps to the top rows and
// the head's edges.
function drawHair(px, style, size) {
  const cap = () => {
    px(1, -1, size - 2, 1);
    px(0, 0, size, 1);
  };
  switch (style) {
    case 'tuft':
      px(Math.floor(size / 2) - 1, -1, 2, 1);
      px(Math.floor(size / 2), -2, 1, 1);
      break;
    case 'short':
      cap();
      px(0, 1, 1, 3);
      px(size - 1, 1, 1, 1);
      break;
    case 'long':
      cap();
      px(-1, 0, 1, size + 2);
      px(0, 1, 1, size + 1);
      px(size - 1, 1, 1, 2);
      break;
    case 'spiky':
      cap();
      for (let col = 1; col < size - 1; col += 2) px(col, -2, 1, 1);
      px(0, 1, 1, 2);
      px(size - 1, 1, 1, 1);
      break;
    case 'bun':
      cap();
      px(-1, -3, 3, 3);
      px(0, 1, 1, 3);
      break;
  }
}
