// sprite.js — Draws the character as a small pixel sprite, in code. All
// character drawing lives here so it can be swapped for hand-drawn sprite
// sheets later without touching the rest of the game.

import { ELDER_HAIR_COLOR, PANTS_COLOR, SHOE_COLOR, EYE_COLOR } from '../data/appearance.js';

// Body proportions per life stage, in canvas pixels. `stoop` pushes the
// head forward in the direction the character faces.
const SHAPES = {
  baby: { head: 5, body: 3, legs: 1, width: 5, stoop: 0 },
  child: { head: 6, body: 3, legs: 3, width: 4, stoop: 0 },
  teen: { head: 6, body: 4, legs: 4, width: 5, stoop: 0 },
  adult: { head: 6, body: 5, legs: 5, width: 5, stoop: 0 },
  elder: { head: 6, body: 5, legs: 4, width: 5, stoop: 1 },
};

const SHADOW_COLOR = 'rgba(40, 70, 40, 0.25)';

// Draws one character. `pose` comes from poseOf() in animator.js; feetY is
// the canvas row their feet rest on.
export function drawCharacter(ctx, { x, facing, blinking, breath, step }, stage, appearance, feetY) {
  const shape = SHAPES[stage];

  // Sprites are designed facing right, in columns relative to x. Facing
  // left mirrors every rectangle around x.
  const rect = (col, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(facing === 1 ? x + col : x - col - w, y, w, h);
  };

  const legsTop = feetY - shape.legs;
  const bodyTop = legsTop - shape.body;
  const headTop = bodyTop - shape.head + breath;
  const bodyLeft = -Math.floor(shape.width / 2);
  const headLeft = -Math.floor(shape.head / 2) + shape.stoop;

  rect(bodyLeft - 1, feetY, shape.width + 2, 1, SHADOW_COLOR);
  drawLegs(rect, shape, stage, appearance, bodyLeft, legsTop, feetY, step);

  // Body and arms: sleeves in the shirt color with a skin-colored hand.
  rect(bodyLeft, bodyTop, shape.width, shape.body, appearance.shirt);
  for (const col of [bodyLeft - 1, bodyLeft + shape.width]) {
    rect(col, bodyTop + 1, 1, shape.body - 1, appearance.shirt);
    rect(col, bodyTop + shape.body - 1, 1, 1, appearance.skin);
  }

  rect(headLeft, headTop, shape.head, shape.head, appearance.skin);
  const hair = stage === 'elder' ? ELDER_HAIR_COLOR : appearance.hair;
  const hairStyle = stage === 'baby' ? 'tuft' : appearance.hairStyle;
  drawHair((col, row, w, h) => rect(headLeft + col, headTop + row, w, h, hair), hairStyle, shape.head);

  if (!blinking) {
    const eyeRow = headTop + shape.head - 3;
    rect(headLeft + shape.head - 2, eyeRow, 1, 1, EYE_COLOR);
    rect(headLeft + shape.head - 4, eyeRow, 1, 1, EYE_COLOR);
  }
}

function drawLegs(rect, shape, stage, appearance, bodyLeft, legsTop, feetY, step) {
  // Babies wear a onesie and have bare feet.
  if (stage === 'baby') {
    rect(bodyLeft, legsTop, 2, shape.legs, appearance.skin);
    rect(bodyLeft + shape.width - 2, legsTop, 2, shape.legs, appearance.skin);
    return;
  }
  const legCols = [bodyLeft, bodyLeft + shape.width - 2];
  legCols.forEach((col, i) => {
    // While walking, one leg at a time is lifted 1px off the ground.
    const bottom = step === i ? feetY - 1 : feetY;
    rect(col, legsTop, 2, bottom - legsTop - 1, PANTS_COLOR);
    rect(col, bottom - 1, 2, 1, SHOE_COLOR);
  });
}

// `px(col, row, w, h)` fills hair relative to the head's top-left, with the
// face on the right (high columns) side and the back of the head at col 0.
function drawHair(px, style, size) {
  const middle = Math.floor(size / 2);
  switch (style) {
    case 'tuft':
      px(middle - 1, 0, 2, 1);
      px(middle, -1, 1, 1);
      break;
    case 'short':
      px(0, 0, size, 2);
      px(0, 2, 1, 2);
      break;
    case 'long':
      px(0, 0, size, 2);
      px(0, 2, 2, size);
      px(size - 1, 2, 1, 1);
      break;
    case 'spiky':
      for (let col = 0; col < size; col += 2) px(col, -1, 1, 1);
      px(0, 0, size, 2);
      px(0, 2, 1, 1);
      break;
    case 'bun':
      px(0, 0, size, 2);
      px(0, 2, 1, 2);
      px(1, -2, 2, 2);
      break;
  }
}
