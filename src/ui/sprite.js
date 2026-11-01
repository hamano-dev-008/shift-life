// sprite.js — Draws the character as a small pixel sprite, in code. All
// character drawing lives here so it can be swapped for hand-drawn sprite
// sheets later without touching the rest of the game.
//
// The sprite is painted facing right on a small layer in character pixels,
// outlined, then scaled up by CHARACTER_SCALE (data/layout.js), which is
// separate from the scene scale (mirrored when facing left).

import { CHARACTER_SHAPES } from '../data/characterShapes.js';
import {
  ELDER_HAIR_COLOR, PANTS_COLOR, PANTS_DARK, SHOE_COLOR, EYE_COLOR, EYE_WHITE,
  MOUTH_COLOR, MOUTH_COLOR_LIGHT, OUTLINE_COLOR, SHADOW_COLOR,
} from '../data/appearance.js';
import { ACTIVITY_LOOPS } from '../data/animation.js';
import { createLayer, clearLayer, fill, outline, drawLayer } from './pixel.js';

// Big enough for the tallest stage plus hair and outline. Column ANCHOR is
// the character's center; feet end just above the last row, which is left
// for the outline.
// Layer sizes and coordinates below are in character pixels.
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

// Goal activity props (pure art).
const BOOK_COVER = '#b5452f';
const BOOK_PAGE = '#fffaf0';
const COIN = '#f2c14e';
const COIN_DARK = '#d29a2a';
const HEART = '#e8647a';
const SWEAT = '#9fd3ef';

const {
  pageFlip: PAGE_FLIP_EVERY, coin: COIN_BEAT, wave: WAVE_BEAT, heart: HEART_EVERY, sweat: SWEAT_EVERY,
} = ACTIVITY_LOOPS;

const layer = createLayer(LAYER_WIDTH, LAYER_HEIGHT);

// Draws the character. `pose` comes from poseOf() in animator.js;
// `expression` is 'smile', 'neutral', or 'frown'; feetY is the canvas row
// the feet rest on; scale is screen pixels per character pixel.
export function drawCharacter(ctx, pose, stage, appearance, expression, feetY, scale) {
  const shape = CHARACTER_SHAPES[stage];
  const px = (col, row, w, h, color) => fill(layer, ANCHOR + col, row, w, h, color);

  // Passing frames bob the body up 1px (the legs stretch to match); idle
  // breathing dips the head 1px.
  const walk = pose.walk;
  const bob = walk && walk.frame % 2 === 1 ? 1 : 0;
  const bodyTop = FOOT_ROW - shape.legs - shape.body - bob;
  const headTop = bodyTop - shape.head + pose.breath;
  const bodyLeft = -Math.floor(shape.width / 2);
  const headLeft = -Math.floor(shape.head / 2) + shape.stoop;

  // Arms swing opposite the legs: when the near leg is forward (frame 0)
  // the front arm swings back, and vice versa on frame 2.
  const swing = !walk || walk.frame % 2 === 1 ? 0 : walk.frame === 0 ? -1 : 1;

  clearLayer(layer);
  drawLegs(px, shape, stage, appearance, bodyLeft, bodyTop + shape.body, walk);
  // The back arm goes behind the torso and the front arm over it.
  drawArm(px, shape, appearance, bodyLeft - 1, bodyTop, -swing);
  px(bodyLeft, bodyTop, shape.width, shape.body, appearance.shirt);
  const frontArm = bodyLeft + shape.width;
  if (!drawActivityArm(px, shape, appearance, frontArm, bodyTop, pose)) {
    drawArm(px, shape, appearance, frontArm, bodyTop, swing);
  }
  drawHead(px, shape, stage, appearance, headLeft, headTop, pose.blinking, expression);
  drawActivityExtras(px, shape, frontArm, bodyTop, headLeft, headTop, pose);
  outline(layer, OUTLINE_COLOR);

  const shadowWidth = (shape.width + 2) * scale;
  ctx.fillStyle = SHADOW_COLOR;
  ctx.fillRect(pose.x - shadowWidth / 2, feetY, shadowWidth, scale);
  drawLayer(ctx, layer, pose.x, feetY + scale, scale, {
    anchorCol: ANCHOR,
    flip: pose.facing === -1,
  });
}

// Legs from row `top` down to the ground. Standing, they're side by side
// as seen in 3/4 view. Walking, both hang from the hips (side view) and
// reach forward or back per the walk pose; the far leg is darker and drawn
// first so the near leg overlaps it. At a contact pose the feet land where
// the standing feet are, so starting and stopping don't jump.
function drawLegs(px, shape, stage, look, bodyLeft, top, walk) {
  // Babies have bare feet under a onesie.
  const color = (far) => (stage === 'baby' ? look.skin : far ? PANTS_DARK : PANTS_COLOR);
  const shoe = stage === 'baby' ? look.skin : SHOE_COLOR;
  if (!walk) {
    drawLeg(px, bodyLeft + 1, top, 0, false, color(false), shoe);
    drawLeg(px, bodyLeft + shape.width - 3, top, 0, false, color(false), shoe);
    return;
  }
  const hip = bodyLeft + Math.floor(shape.width / 2) - 1;
  drawLeg(px, hip, top, walk.farReach, walk.farLifted, color(true), shoe);
  drawLeg(px, hip, top, walk.nearReach, walk.nearLifted, color(false), shoe);
}

// One 2px-wide leg from row `top` to the ground, slanting so the foot ends
// `reach` pixels forward (negative = back). A lifted foot stops 1px above
// the ground. The foot is 3px wide, with the toe pointing forward.
function drawLeg(px, col, top, reach, lifted, color, shoeColor) {
  const length = FOOT_ROW - top;
  const rows = lifted && length > 1 ? length - 1 : length;
  for (let i = 0; i < rows; i++) {
    const t = (i + 1) / length;
    const offset = Math.sign(reach) * Math.round(Math.abs(reach) * t);
    const isFoot = i === rows - 1;
    px(col + offset, top + i, isFoot ? 3 : 2, 1, isFoot ? shoeColor : color);
  }
}

// One arm hanging beside the torso: a short sleeve, then the bare arm and
// hand. `swing` shifts the lower arm 1px forward (1) or back (-1).
function drawArm(px, shape, look, col, bodyTop, swing) {
  const armLength = shape.body - 1;
  const sleeve = Math.ceil(armLength / 2);
  px(col, bodyTop + 1, 1, sleeve, look.shirt);
  px(col + swing, bodyTop + 1 + sleeve, 1, armLength - sleeve, look.skin);
}

// The front arm during an activity: held out to hold a book or a coin, or
// raised and waving. Returns false if the activity uses the normal arm.
function drawActivityArm(px, shape, look, col, bodyTop, pose) {
  const sleeve = Math.ceil((shape.body - 1) / 2);
  switch (pose.activity) {
    case 'read':
    case 'coins':
      // Upper arm down, forearm forward at the elbow.
      px(col, bodyTop + 1, 1, sleeve, look.shirt);
      px(col + 1, bodyTop + sleeve, 2, 1, look.skin);
      return true;
    case 'wave': {
      // Shoulder, elbow out, hand up beside the face rocking side to side.
      const rock = Math.floor(pose.activityTime / WAVE_BEAT) % 2;
      px(col, bodyTop + 1, 1, 1, look.shirt);
      px(col + 1, bodyTop, 1, 1, look.shirt);
      px(col + 1 + rock, bodyTop - 2, 1, 2, look.skin);
      return true;
    }
    default:
      return false;
  }
}

// Things that go with an activity: the open book (a page flips now and
// then), the coin stack being counted (a coin flips up from the hand), a
// heart floating up while waving, a sweat drop while jogging.
function drawActivityExtras(px, shape, armCol, bodyTop, headLeft, headTop, pose) {
  const t = pose.activityTime;
  const hand = armCol + 2;
  const handRow = bodyTop + Math.ceil((shape.body - 1) / 2);
  switch (pose.activity) {
    case 'read': {
      px(hand, handRow - 2, 2, 3, BOOK_COVER);
      const flipping = t % PAGE_FLIP_EVERY < 0.25;
      px(hand + (flipping ? 1 : 0), handRow - 2, 1, 3, BOOK_PAGE);
      break;
    }
    case 'coins': {
      const stack = 1 + (Math.floor(t / COIN_BEAT) % 3);
      for (let i = 0; i < stack; i++) {
        px(hand + 1, FOOT_ROW - 1 - i, 2, 1, i % 2 ? COIN_DARK : COIN);
      }
      const flip = (t % COIN_BEAT) / COIN_BEAT;
      const lift = flip < 0.5 ? [1, 2, 2, 1][Math.floor(flip * 8)] : 0;
      px(hand, handRow - 1 - lift, 1, 1, COIN);
      break;
    }
    case 'wave': {
      const phase = (t % HEART_EVERY) / HEART_EVERY;
      if (phase > 0.7) break;
      const top = Math.max(1, headTop - 4 - Math.floor(phase * 4));
      const left = headLeft + shape.head;
      px(left, top, 1, 1, HEART);
      px(left + 2, top, 1, 1, HEART);
      px(left, top + 1, 3, 1, HEART);
      px(left + 1, top + 2, 1, 1, HEART);
      break;
    }
    case 'jog': {
      const phase = (t % SWEAT_EVERY) / SWEAT_EVERY;
      if (phase < 0.6) px(headLeft - 2, headTop + 1 + Math.floor(phase * 5), 1, 1, SWEAT);
      break;
    }
    default:
      break;
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
