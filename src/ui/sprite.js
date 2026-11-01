// sprite.js — Draws the character as a small pixel sprite, in code,
// with goal activity props and job items. All character drawing lives here so it can be swapped for hand-drawn sprite
// sheets later without touching the rest of the game.
//
// The sprite is painted facing right on a small layer in character pixels,
// outlined, then scaled up by CHARACTER_SCALE (data/layout.js), which is
// separate from the scene scale (mirrored when facing left).

import { CHARACTER_SHAPES, CRAWL_POSE, SIT_POSE } from '../data/characterShapes.js';
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

// Job items (`item` in data/jobs.js; pure art).
const HARD_HAT = '#f2c14e';
const HARD_HAT_BRIM = '#d29a2a';
const CHEF_WHITE = '#ffffff';
const CHEF_BAND = '#e3e3ea';
const CAP = '#d9534f';
const CAP_BRIM = '#a83c39';
const STRAW = '#e8c96a';
const STRAW_BRIM = '#c9a64a';
const HAT_BAND = '#b5452f';
const BERET = '#c8414b';
const FRAMES = '#3b6fd6';
const HEADPHONE_BAND = '#4a4e69';
const HEADPHONE_CUP = '#4a6fd1';
const TIE = '#3a5bc7';
const TIE_KNOT = '#2c4699';
const COLLAR = '#ffffff';
const APRON = '#a86b4a';
const APRON_DARK = '#7f4f35';
const LAB_COAT = '#f4f6f8';
const TUBE = '#4a4e69';
const STETHOSCOPE_BELL = '#c9ccd6';
const STRAP = '#7a4a2a';
const BAG = '#9c6236';
const BAG_FLAP = '#7a4a2a';

const {
  pageFlip: PAGE_FLIP_EVERY, coin: COIN_BEAT, wave: WAVE_BEAT, heart: HEART_EVERY, sweat: SWEAT_EVERY,
} = ACTIVITY_LOOPS;

// A toddler's head shift on each frame of the walk cycle: forward on one
// passing step, back on the other.
const TODDLE_SWAY = [0, 1, 0, -1];

const layer = createLayer(LAYER_WIDTH, LAYER_HEIGHT);

// The body proportions in use: a toddler has their own; otherwise the
// life stage's.
function shapeOf(stage, pose) {
  return CHARACTER_SHAPES[pose.gait === 'toddle' ? 'toddler' : stage];
}

function isCrawling(pose) {
  return pose.gait === 'crawl' && !pose.sit;
}

// How tall the figure is from the feet to the top of the head (not
// counting hair), in character pixels, for placing bubbles above it.
export function figureHeight(stage, pose) {
  const shape = shapeOf(stage, pose);
  if (pose.sit) return shape.body + shape.head;
  if (isCrawling(pose)) return CRAWL_POSE.limbs + shape.body + CRAWL_POSE.headAbove;
  return shape.legs + shape.body + shape.head;
}

// Draws the character. `pose` comes from poseOf() in animator.js;
// `expression` is 'smile', 'neutral', or 'frown'; feetY is the canvas row
// the feet rest on; scale is screen pixels per character pixel. `item` is
// the job item they wear or carry (data/jobs.js), or null; it shows while
// standing or walking.
export function drawCharacter(ctx, pose, stage, appearance, expression, feetY, scale, item = null) {
  const shape = shapeOf(stage, pose);
  const px = (col, row, w, h, color) => fill(layer, ANCHOR + col, row, w, h, color);

  clearLayer(layer);
  if (pose.sit) {
    drawSitting(px, shape, stage, appearance, expression, pose);
  } else if (isCrawling(pose)) {
    drawCrawling(px, shape, stage, appearance, expression, pose);
  } else {
    drawStanding(px, shape, stage, appearance, expression, pose, item);
  }
  outline(layer, OUTLINE_COLOR);

  const length = isCrawling(pose) ? shape.width + CRAWL_POSE.shin + 2 : shape.width;
  const shadowWidth = (length + 2) * scale;
  ctx.fillStyle = SHADOW_COLOR;
  ctx.fillRect(pose.x - shadowWidth / 2, feetY, shadowWidth, scale);
  drawLayer(ctx, layer, pose.x, feetY + scale, scale, {
    anchorCol: ANCHOR,
    flip: pose.facing === -1,
  });
}

// Standing and walking (toddlers too). Passing frames bob the body up 1px
// (the legs stretch to match); idle breathing dips the head 1px. `item`
// is the job item, or null; a lab coat replaces the shirt.
function drawStanding(px, shape, stage, appearance, expression, pose, item) {
  const look = item === 'labCoat' ? { ...appearance, shirt: LAB_COAT } : appearance;
  const walk = pose.walk;
  const toddling = pose.gait === 'toddle' && walk;
  const bob = walk && walk.frame % 2 === 1 ? 1 : 0;
  const bodyTop = FOOT_ROW - shape.legs - shape.body - bob;
  const headTop = bodyTop - shape.head + pose.breath;
  const bodyLeft = -Math.floor(shape.width / 2);
  // A toddler's head sways forward and back with each wobbly step.
  const sway = toddling ? TODDLE_SWAY[walk.frame] : 0;
  const headLeft = -Math.floor(shape.head / 2) + shape.stoop + sway;

  // Arms swing opposite the legs: when the near leg is forward (frame 0)
  // the front arm swings back, and vice versa on frame 2.
  const swing = !walk || walk.frame % 2 === 1 ? 0 : walk.frame === 0 ? -1 : 1;

  drawLegs(px, shape, stage, look, bodyLeft, bodyTop + shape.body, walk);
  // The back arm goes behind the torso and the front arm over it. A
  // toddler holds both out for balance instead.
  const frontArm = bodyLeft + shape.width;
  if (toddling) {
    drawBalanceArm(px, look, bodyLeft - 1, bodyTop, -1, walk.frame);
    px(bodyLeft, bodyTop, shape.width, shape.body, look.shirt);
    drawBalanceArm(px, look, frontArm, bodyTop, 1, walk.frame);
  } else {
    drawArm(px, shape, look, bodyLeft - 1, bodyTop, -swing);
    px(bodyLeft, bodyTop, shape.width, shape.body, look.shirt);
    if (!drawActivityArm(px, shape, look, frontArm, bodyTop, pose)) {
      drawArm(px, shape, look, frontArm, bodyTop, swing);
    }
  }
  drawJobItemOnBody(px, shape, appearance, item, bodyLeft, bodyTop);
  drawHead(px, shape, stage, look, headLeft, headTop, pose.blinking, expression);
  drawJobItemOnHead(px, shape, item, headLeft, headTop);
  drawActivityExtras(px, shape, frontArm, bodyTop, headLeft, headTop, pose);
}

// Job items worn on the torso, drawn over the shirt: a tie, an apron, the
// open front of a lab coat (the shirt showing through), a stethoscope, or
// a satchel's strap with the bag at the back hip. Columns and rows are
// from the torso's top-left.
function drawJobItemOnBody(px, shape, look, item, bodyLeft, bodyTop) {
  const on = (col, row, w, h, color) => px(bodyLeft + col, bodyTop + row, w, h, color);
  const { width: w, body: b } = shape;
  const middle = Math.floor(w / 2);
  switch (item) {
    case 'tie':
      on(middle - 1, 0, 1, 1, COLLAR);
      on(middle + 1, 0, 1, 1, COLLAR);
      on(middle, 0, 1, 1, TIE_KNOT);
      on(middle, 1, 1, b - 2, TIE);
      break;
    case 'apron':
      // Straps over the shoulders, then the bib down past the waist.
      on(1, 0, 1, 2, APRON);
      on(w - 2, 0, 1, 2, APRON);
      on(1, 2, w - 2, b - 1, APRON);
      on(middle - 1, b - 2, 2, 1, APRON_DARK);
      break;
    case 'labCoat':
      on(middle - 1, 0, 2, b, look.shirt);
      on(0, b, 1, 1, LAB_COAT);
      on(w - 1, b, 1, 1, LAB_COAT);
      break;
    case 'stethoscope':
      on(1, 0, 1, 2, TUBE);
      on(w - 2, 0, 1, 3, TUBE);
      on(w - 3, 3, 2, 1, STETHOSCOPE_BELL);
      break;
    case 'satchel':
      // The strap runs from the front shoulder down to the back hip.
      for (let row = 0; row < b; row++) {
        on(w - 2 - Math.round((row * (w - 2)) / (b - 1)), row, 2, 1, STRAP);
      }
      on(-2, b - 2, 3, 3, BAG);
      on(-2, b - 2, 3, 1, BAG_FLAP);
      break;
    default:
      break;
  }
}

// Job items worn on the head, drawn over the hair. Columns and rows are
// from the head's top-left (the face is toward the high columns; negative
// rows are above the head).
function drawJobItemOnHead(px, shape, item, headLeft, headTop) {
  const at = (col, row, w, h, color) => px(headLeft + col, headTop + row, w, h, color);
  const size = shape.head;
  const eyeRow = Math.floor(size / 2) - 2;
  switch (item) {
    case 'hardHat':
      at(1, -2, size - 2, 1, HARD_HAT);
      at(0, -1, size, 1, HARD_HAT);
      at(0, 0, size + 1, 1, HARD_HAT_BRIM);
      break;
    case 'chefHat':
      at(0, -4, size, 2, CHEF_WHITE);
      at(1, -2, size - 2, 2, CHEF_WHITE);
      at(0, 0, size, 1, CHEF_BAND);
      break;
    case 'cap':
      at(1, -2, size - 2, 1, CAP);
      at(0, -1, size, 2, CAP);
      at(size - 1, 0, 3, 1, CAP_BRIM);
      break;
    case 'strawHat':
      at(1, -2, size - 2, 1, STRAW);
      at(1, -1, size - 2, 1, HAT_BAND);
      at(-2, 0, size + 4, 1, STRAW_BRIM);
      break;
    case 'beret':
      // Tilted toward the back of the head.
      at(2, -3, 1, 1, BERET);
      at(0, -2, size - 2, 1, BERET);
      at(-1, -1, size, 2, BERET);
      break;
    case 'glasses':
      // Colored rims beside and under both eyes (a rim above would read
      // as hair), the bridge between them, and the arm back to the ear.
      at(size - 7, eyeRow, 1, 2, FRAMES);
      at(size - 4, eyeRow, 1, 1, FRAMES);
      at(size - 1, eyeRow, 1, 2, FRAMES);
      at(size - 6, eyeRow + 2, 2, 1, FRAMES);
      at(size - 3, eyeRow + 2, 2, 1, FRAMES);
      at(0, eyeRow, 1, 1, FRAMES);
      break;
    case 'headphones':
      at(1, -2, size - 3, 1, HEADPHONE_BAND);
      at(0, -1, 1, 3, HEADPHONE_BAND);
      at(-1, eyeRow, 2, 3, HEADPHONE_CUP);
      break;
    default:
      break;
  }
}

// A toddler's arm held out from the shoulder and a little raised, hand
// bobbing up a pixel on the other step. `out` is -1 (back) or 1 (front).
function drawBalanceArm(px, look, col, bodyTop, out, frame) {
  const lift = frame === (out > 0 ? 1 : 3) ? 1 : 0;
  px(col, bodyTop + 1, 1, 1, look.shirt);
  px(col + out, bodyTop - lift, 1, 1, look.skin);
}

// Sitting on the ground (a baby at rest, or a toddler who plopped down):
// upright torso, legs out in front, hands by the hips. A wobble shifts the
// upper body sideways; `gaze` turns the eyes back over the shoulder.
function drawSitting(px, shape, stage, look, expression, pose) {
  const bodyTop = FOOT_ROW - shape.body;
  const bodyLeft = -Math.floor(shape.width / 2) + pose.wobble;
  const headTop = bodyTop - shape.head + pose.breath;
  const headLeft = -Math.floor(shape.head / 2) + pose.wobble;
  // The legs start under the front of the torso and stay put on the
  // ground while the body wobbles.
  const hip = -Math.floor(shape.width / 2) + shape.width - 1;
  const ground = FOOT_ROW - 1;

  drawArm(px, shape, look, bodyLeft - 1, bodyTop, 0);
  px(bodyLeft, bodyTop, shape.width, shape.body, look.shirt);
  drawArm(px, shape, look, bodyLeft + shape.width, bodyTop, 0);
  // Legs stretched out in front, past the hand resting on them, toes up.
  px(hip, ground, SIT_POSE.legs, 1, look.skin);
  px(hip + SIT_POSE.legs - 1, ground - 1, 1, 1, look.skin);
  drawHead(px, shape, stage, look, headLeft, headTop, pose.blinking, expression, pose.gaze);
}

// On hands and knees: the torso lies flat on CRAWL_POSE.limbs-tall arms
// and legs, the head raised in front. Opposite hand and knee move
// together and planted ones stay put (see walkPose() in animator.js); far
// limbs are a shade darker and drawn behind the torso.
function drawCrawling(px, shape, stage, look, expression, pose) {
  const walk = pose.walk;
  const { limbs, headAbove, back } = CRAWL_POSE;
  // No bob: crawlers keep low, and the limbs stay joined to the torso.
  const torsoTop = FOOT_ROW - limbs - shape.body;
  const torsoLeft = -back;
  const shoulder = torsoLeft + shape.width - 1;
  const hip = torsoLeft + 1;
  const headLeft = shoulder - 1;
  const headTop = torsoTop - headAbove + pose.breath;
  const farSkin = darken(look.skin, 0.85);

  // Near hand + far knee share one reach, far hand + near knee the other.
  const nearReach = walk ? walk.nearReach : 0;
  const farReach = walk ? walk.farReach : 0;
  const nearLifted = walk ? walk.nearLifted : false;
  const farLifted = walk ? walk.farLifted : false;

  drawCrawlLimb(px, shoulder, farReach, farLifted, farSkin, false);
  drawCrawlLimb(px, hip, nearReach, nearLifted, farSkin, true);
  px(torsoLeft, torsoTop, shape.width, shape.body, look.shirt);
  drawCrawlLimb(px, hip, farReach, farLifted, look.skin, true);
  drawCrawlLimb(px, shoulder, nearReach, nearLifted, look.skin, false);
  drawHead(px, shape, stage, look, headLeft, headTop, pose.blinking, expression);
}

// One crawling arm or leg from the torso down to the ground, landing
// `reach` pixels forward. An arm ends in a 2px hand; a leg ends in a 2px
// knee with the shin trailing back along the ground. A lifted limb stops
// a pixel short of the ground.
function drawCrawlLimb(px, col, reach, lifted, color, isLeg) {
  const { limbs, shin } = CRAWL_POSE;
  const ground = FOOT_ROW - 1;
  const low = lifted ? ground - 1 : ground;
  for (let row = ground - limbs + 1; row < low; row++) {
    const t = (row - (ground - limbs)) / limbs;
    px(col + Math.sign(reach) * Math.round(Math.abs(reach) * t), row, isLeg ? 2 : 1, 1, color);
  }
  if (isLeg) {
    px(col + reach - shin, low, shin + 2, 1, color);
  } else {
    px(col + reach, low, 2, 1, color);
  }
}

// `hex` with each channel scaled by `factor` (below 1 darkens).
function darken(hex, factor) {
  const channels = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * factor));
  return `#${channels.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
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
// so eyes and mouth always stay visible. `gaze` -1 moves the pupils to the
// back of the eyes (looking back over the shoulder).
function drawHead(px, shape, stage, look, headLeft, headTop, blinking, expression, gaze = 0) {
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
      const pupil = gaze < 0 ? 0 : 1;
      at(col + 1 - pupil, eyeRow, 1, 2, EYE_WHITE);
      at(col + pupil, eyeRow, 1, 2, EYE_COLOR);
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
