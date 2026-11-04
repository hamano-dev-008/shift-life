// sprite.js — Draws the character as a small pixel sprite, in code,
// with goal activity props, job items, the guitar and notes while
// busking, asleep under a blanket with floating z's while resting, and the arm
// holding the fishing rod (or raising the catch) while fishing; the rod,
// line and catch themselves are drawn by ui/fishing.js from
// fishingHand(). All character drawing lives here so it can be swapped for hand-drawn sprite
// sheets later without touching the rest of the game.
//
// The sprite is painted facing right on a small layer in character pixels,
// outlined, then scaled up by CHARACTER_SCALE (data/layout.js), which is
// separate from the scene scale (mirrored when facing left). Where a
// sprite PNG exists for the body and animation (see data/sprites.js), it
// is drawn instead, the same way. An adult standing or walking is built
// from recolored part art where all its parts exist (ui/characterParts.js).

import { CHARACTER_SHAPES, CRAWL_POSE, SIT_POSE } from '../data/characterShapes.js';
import {
  ELDER_HAIR_COLOR, PANTS_COLOR, PANTS_DARK, SHOE_COLOR, EYE_COLOR, EYE_WHITE,
  MOUTH_COLOR, MOUTH_COLOR_LIGHT, OUTLINE_COLOR, SHADOW_COLOR,
} from '../data/appearance.js';
import { ACTIVITY_LOOPS } from '../data/animation.js';
import { BUSK_LOOPS } from '../data/fortuneTree.js';
import { FARM_LOOPS } from '../data/farm.js';
import {
  REST_LOOPS, REST_BLANKET, REST_PILLOW, REST_FACE, REST_PREVIEW_BED, SLEEPING_BAG_COLORS,
} from '../data/home.js';
import { lyingLayout, lyingHeadCenter } from './lying.js';
import { createLayer, clearLayer, fill, outline, drawLayer } from './pixel.js';
import { getSprite, frameAtTime, frameAtProgress, drawSprite } from './assets.js';
import { adultParts, drawPartFrame } from './characterParts.js';
import { PART_FRAME } from '../data/characterParts.js';

// Big enough for the tallest stage plus hair and outline. Column ANCHOR is
// the character's center; feet end just above the last row, which is left
// for the outline.
// Layer sizes and coordinates below are in character pixels.
const LAYER_WIDTH = 32;
const LAYER_HEIGHT = 30;
const ANCHOR = 16;
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
// Farming (pure art): a rice seedling and a pulled weed in the hand, the
// sickle's wooden handle and steel blade.
const SEEDLING = '#7fcf5a';
const WEED = '#3c6b2a';
const SICKLE_HANDLE = '#8b5a3c';
const SICKLE_BLADE = '#d9dde8';
const SICKLE_EDGE = '#9aa0ad';
const BAG_FLAP = '#7a4a2a';

// Busking: a wooden guitar and musical notes.
const GUITAR = '#c98a4b';
const GUITAR_DARK = '#7a4a2a';
const GUITAR_NECK = '#8b5a3c';
const NOTE_COLORS = ['#ffffff', '#f2c14e'];
// A note glyph, 3 wide and 4 tall: flag, stem, and the head at the bottom.
const NOTE_PIXELS = [[1, 0], [2, 0], [1, 1], [1, 2], [0, 3], [1, 3]];
// How many rows a note rises before it fades.
const NOTE_RISE_ROWS = 12;

// Resting: a "z" glyph, 3x3, rising from the sleeping head.
const Z_COLORS = ['#ffffff', '#cfe8ff'];
const Z_PIXELS = [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]];
const Z_RISE_ROWS = 10;

const {
  pageFlip: PAGE_FLIP_EVERY, coin: COIN_BEAT, wave: WAVE_BEAT, heart: HEART_EVERY, sweat: SWEAT_EVERY,
} = ACTIVITY_LOOPS;

// A toddler's head shift on each frame of the walk cycle: forward on one
// passing step, back on the other.
const TODDLE_SWAY = [0, 1, 0, -1];

const layer = createLayer(LAYER_WIDTH, LAYER_HEIGHT);

// The body proportions in use: a toddler on their feet has their own;
// otherwise (lying down too) the life stage's.
function shapeOf(stage, pose) {
  return CHARACTER_SHAPES[pose.gait === 'toddle' && !pose.lying ? 'toddler' : stage];
}

function isCrawling(pose) {
  return pose.gait === 'crawl' && !pose.sit;
}

// How tall the figure is from the feet to the top of the head (not
// counting hair), in character pixels, for placing bubbles above it.
export function figureHeight(stage, pose) {
  const shape = shapeOf(stage, pose);
  if (pose.lying) return (pose.bed ?? REST_PREVIEW_BED).headLift + shape.head;
  if (pose.sit) return shape.body + shape.head;
  if (isCrawling(pose)) return CRAWL_POSE.limbs + shape.body + CRAWL_POSE.headAbove;
  return shape.legs + shape.body + shape.head;
}

// The canvas x over the middle of the head, for bubbles: the pose's x,
// or lying down, the sleeping head's (toward the pose's facing side).
export function headX(stage, pose, scale) {
  if (!pose.lying) return pose.x;
  return pose.x + lyingHeadCenter(CHARACTER_SHAPES[stage]) * scale * (pose.facing === -1 ? -1 : 1);
}

// Where to put the pose's x so that, lying down facing right, the head's
// middle is at canvas x `x` (a bed's pillow end).
export function lyingXForHead(stage, x, scale) {
  return x - lyingHeadCenter(CHARACTER_SHAPES[stage]) * scale;
}

// Animations whose sprite frames follow the walk cycle (distance walked)
// rather than time.
const STEPPED_ANIMATIONS = ['walk', 'crawl', 'jog'];

// The animation the pose shows, as named in data/sprites.js. An activity
// comes first, so busking (sitting) is 'busk' rather than 'sit'.
function animationOf(pose) {
  if (pose.activity) return pose.activity;
  if (pose.sit) return 'sit';
  if (isCrawling(pose)) return 'crawl';
  return pose.walk ? 'walk' : 'idle';
}

// The sprite for the pose, if there's a PNG for it, with the frame to
// show: { sprite, frame }, or null to draw in code. A version for the
// expression (e.g. character.adult.idle.frown) comes first.
function characterSprite(pose, stage, expression) {
  const body = pose.gait === 'toddle' ? 'toddler' : stage;
  const animation = animationOf(pose);
  const name = `character.${body}.${animation}`;
  const sprite = getSprite(`${name}.${expression}`) ?? getSprite(name);
  if (!sprite) return null;
  let frame;
  if (STEPPED_ANIMATIONS.includes(animation) && pose.walk) {
    frame = frameAtProgress(sprite, pose.walk.cycle);
  } else {
    frame = frameAtTime(sprite, pose.activity ? pose.activityTime : pose.time);
  }
  return { sprite, frame };
}

// Draws the character. `pose` comes from poseOf() in animator.js;
// `expression` is 'smile', 'neutral', or 'frown'; groundY is the canvas row
// the feet rest on; scale is screen pixels per character pixel. `item` is
// the job item they wear or carry (data/jobs.js), or null; it shows while
// standing or walking. A lying pose is drawn `pose.lift` canvas pixels
// higher (on the sofa), with no shadow.
export function drawCharacter(ctx, pose, stage, appearance, expression, groundY, scale, item = null, hitOnly = false) {
  const feetY = groundY - (pose.lift ?? 0);
  const shape = shapeOf(stage, pose);
  const length = isCrawling(pose) ? shape.width + CRAWL_POSE.shin + 2 : shape.width;
  const shadowWidth = (length + 2) * scale;
  const drawShadow = () => {
    if (pose.lift || hitOnly) return;
    ctx.fillStyle = SHADOW_COLOR;
    ctx.fillRect(pose.x - shadowWidth / 2, feetY, shadowWidth, scale);
  };

  const fromSprite = characterSprite(pose, stage, expression);
  if (fromSprite) {
    drawShadow();
    const spriteScale = fromSprite.sprite.scale ?? scale;
    drawSprite(ctx, fromSprite.sprite, fromSprite.frame, pose.x, feetY + spriteScale, spriteScale, {
      anchorCol: fromSprite.sprite.anchorX,
      flip: pose.facing === -1,
    });
    return;
  }

  pose = { ...pose, hitOnly };
  const px = (col, row, w, h, color) => fill(layer, ANCHOR + col, row, w, h, color);
  clearLayer(layer);
  if (pose.lying) {
    drawLying(px, shape, stage, appearance, expression, pose);
  } else if (pose.sit) {
    drawSitting(px, shape, stage, appearance, expression, pose);
  } else if (isCrawling(pose)) {
    drawCrawling(px, shape, stage, appearance, expression, pose);
  } else {
    const parts = adultParts(stage, pose, wornLook(appearance, item), expression);
    if (parts) {
      drawStandingParts(px, parts, shape, appearance, item);
    } else {
      drawStanding(px, shape, stage, appearance, expression, pose, item);
    }
  }
  outline(layer, OUTLINE_COLOR);

  drawShadow();
  drawLayer(ctx, layer, pose.x, feetY + scale, scale, {
    anchorCol: ANCHOR,
    flip: pose.facing === -1,
  });
}

// Standing and walking (toddlers too). Passing frames bob the body up 1px
// (the legs stretch to match); idle breathing dips the head 1px. `item`
// is the job item, or null; a lab coat replaces the shirt.
function drawStanding(px, shape, stage, appearance, expression, pose, item) {
  const look = wornLook(appearance, item);
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
  if (!pose.hitOnly) drawActivityExtras(px, shape, frontArm, bodyTop, headLeft, headTop, pose);
}

// The appearance as worn with job item `item`: a lab coat replaces the shirt.
function wornLook(appearance, item) {
  return item === 'labCoat' ? { ...appearance, shirt: LAB_COAT } : appearance;
}

// An adult standing or walking from the part art (ui/characterParts.js),
// with the job item's pieces on the art's own torso and head.
function drawStandingParts(px, { frame, place, strips }, shape, appearance, item) {
  const left = ANCHOR - PART_FRAME.center;
  const top = LAYER_HEIGHT - PART_FRAME.height;
  const [bodyCol, bodyRow, bodyRows] = place.body;
  const [headCol, headRow] = place.head;
  for (const { canvas, then } of strips) {
    drawPartFrame(layer, canvas, frame, left, top);
    if (then === 'bodyItem') {
      drawJobItemOnBody(px, { ...shape, body: bodyRows }, appearance, item, bodyCol - PART_FRAME.center, top + bodyRow);
    } else if (then === 'headItem') {
      drawJobItemOnHead(px, shape, item, headCol - PART_FRAME.center, top + headRow);
    }
  }
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

// Sitting on the ground (a baby at rest, a toddler who plopped down, or
// anyone busking): upright torso, legs out in front, hands by the hips. A
// wobble shifts the upper body sideways; `gaze` turns the eyes back over
// the shoulder. Babies' legs are bare; older legs wear trousers and shoes
// and are as long as standing legs. Busking adds a guitar on the lap.
function drawSitting(px, shape, stage, look, expression, pose) {
  const bodyTop = FOOT_ROW - shape.body;
  const bodyLeft = -Math.floor(shape.width / 2) + pose.wobble;
  const headTop = bodyTop - shape.head + pose.breath;
  const headLeft = -Math.floor(shape.head / 2) + pose.wobble;
  // The legs start under the front of the torso and stay put on the
  // ground while the body wobbles.
  const hip = -Math.floor(shape.width / 2) + shape.width - 1;
  const ground = FOOT_ROW - 1;

  const bare = stage === 'baby';
  const legs = bare ? SIT_POSE.legs : Math.max(SIT_POSE.legs, shape.legs);
  const busking = pose.activity === 'busk';

  if (!busking) drawArm(px, shape, look, bodyLeft - 1, bodyTop, 0);
  px(bodyLeft, bodyTop, shape.width, shape.body, look.shirt);
  // Legs stretched out in front, past the hand resting on them, toes up.
  px(hip, ground, legs, 1, bare ? look.skin : PANTS_COLOR);
  px(hip + legs - 1, ground - 1, 1, 1, bare ? look.skin : SHOE_COLOR);
  if (busking) {
    drawGuitar(px, shape, look, hip, ground, bodyLeft + shape.width, bodyTop, pose.activityTime);
  } else {
    drawArm(px, shape, look, bodyLeft + shape.width, bodyTop, 0);
  }
  drawHead(px, shape, stage, look, headLeft, headTop, pose.blinking, expression, pose.gaze);
  if (busking && !pose.hitOnly) drawNotes(px, headLeft + shape.head + 1, headTop + 2, pose.activityTime);
}

// Asleep on the back (resting), laid out by lyingLayout() (ui/lying.js):
// head at the left end on its pillow (pose.bed's; REST_PREVIEW_BED
// without one), the shirt at the shoulders, a blanket (or the sleeping
// bag) from the chest down with the feet making a bump, its top edge over
// the chest rising and falling with each breath, and z's floating up from
// the face. The pillow and z's aren't part of the figure, so a hit mask
// (pose.hitOnly) leaves them out.
function drawLying(px, shape, stage, look, expression, pose) {
  const bed = pose.bed ?? REST_PREVIEW_BED;
  const t = pose.activityTime ?? 0;
  const lay = lyingLayout(shape, bed, t);
  const { body } = lay;
  const row = (up) => FOOT_ROW - up; // rows counted up from the bottom
  if (lay.pillow && !pose.hitOnly) {
    const { left, width, rows } = lay.pillow;
    px(left, row(rows - 2), width, rows - 1, REST_PILLOW.color);
    px(left + 1, row(rows - 1), width - 2, 1, REST_PILLOW.color);
    px(left, row(0), width, 1, REST_PILLOW.shade);
  }
  const { left, width, top } = lay.shoulders;
  px(left, row(top), width, top + 1, look.shirt);
  const cover = bed.cover === 'bag' ? SLEEPING_BAG_COLORS : REST_BLANKET;
  for (const { col, top: up } of lay.blanket) {
    px(col, row(up), 1, up + 1, cover.color);
    px(col, row(up), 1, 1, cover.light);
    px(col, row(0), 1, 1, cover.dark);
  }
  drawLyingHead(px, shape, stage, look, body.left, row(lay.headTop), lay.mouthOpen);
  if (!pose.hitOnly) drawZs(px, body.left + body.head - 1, row(lay.headTop) - 2, t);
}

// The sleeping head, turned on its side to lie along the body: the crown
// toward the left (the pillow end) with the hair there and around the
// back of the head, underneath; the face up and a little toward the
// viewer: closed eyes as small curved lines, rosy cheeks and a small
// relaxed mouth, now and then a tiny "o" (`mouthOpen`). It's the standing
// head (drawHead()) turned a quarter: standing (col, row) is lying
// (row, size - 1 - col), so every hair style (and the elder's grey) keeps
// its shape.
function drawLyingHead(px, shape, stage, look, headLeft, headTop, mouthOpen) {
  const size = shape.head;
  const at = (col, row, w, h, color) => px(headLeft + col, headTop + row, w, h, color);
  const turned = (col, row, w, h, color) => at(row, size - col - w, h, w, color);

  at(0, 0, size, size, look.skin);
  const hairColor = stage === 'elder' ? ELDER_HAIR_COLOR : look.hair;
  const hairStyle = stage === 'baby' ? 'tuft' : look.hairStyle;
  drawHair((col, row, w, h) => turned(col, row, w, h, hairColor), hairStyle, size);

  // The face, seen from the side as it looks up: a closed eye (a lid
  // line curving down from the brow) with a rosy cheek beside it, and
  // the mouth on the face's top edge by the chin.
  const eyeCol = Math.floor(size / 2) - 1;
  const eyeRow = 2;
  at(eyeCol - 1, eyeRow, 1, 1, EYE_COLOR);
  at(eyeCol, eyeRow + 1, 2, 1, EYE_COLOR);
  at(eyeCol + 2, eyeRow + 2, 1, 1, REST_FACE.cheek);
  const mouthColor = brightness(look.skin) < 0.4 ? MOUTH_COLOR_LIGHT : MOUTH_COLOR;
  // On the face's top edge, between the nose and the chin: a small
  // closed mouth, or a tiny "o" a little deeper and wider.
  if (mouthOpen) {
    at(size - 2, 0, 1, 2, mouthColor);
    at(size - 1, 1, 1, 1, mouthColor);
  } else {
    at(size - 2, 0, 1, 1, mouthColor);
  }
}

// Sleepy z's: one starts every REST_LOOPS.z seconds with its bottom row at
// `bottom`, drifts up Z_RISE_ROWS over REST_LOOPS.zRise, alternating
// colors and columns.
function drawZs(px, col, bottom, t) {
  const { z: every, zRise: rise } = REST_LOOPS;
  const newest = Math.floor(t / every);
  for (let i = newest; i >= 0 && t - i * every < rise; i--) {
    const phase = (t - i * every) / rise;
    const top = Math.max(1, bottom - 2 - Math.floor(phase * Z_RISE_ROWS));
    const left = col + (i % 2) * 2 + Math.floor(phase * 2);
    for (const [x, y] of Z_PIXELS) px(left + x, top + y, 1, 1, Z_COLORS[i % 2]);
  }
}

// A guitar resting on the lap: a wooden body with a sound hole, the neck
// rising forward with a hand on it, and the front hand strumming (bobbing
// a row every BUSK_LOOPS.strum seconds).
function drawGuitar(px, shape, look, hip, ground, armCol, bodyTop, t) {
  const top = ground - 3;
  const left = hip + 1;
  px(left, top, 3, 3, GUITAR);
  px(left + 1, top + 1, 1, 1, GUITAR_DARK);
  for (let i = 0; i < 3; i++) px(left + 3 + i, top - i, 1, 1, GUITAR_NECK);
  px(left + 6, top - 3, 1, 1, GUITAR_DARK);
  px(left + 4, top - 1, 1, 1, look.skin);
  const sleeve = Math.ceil((shape.body - 1) / 2);
  const strum = Math.floor(t / BUSK_LOOPS.strum) % 2;
  px(armCol, bodyTop + 1, 1, sleeve, look.shirt);
  px(left + 1, top + strum, 1, 1, look.skin);
}

// Musical notes floating up in front of the face: one starts every
// BUSK_LOOPS.note seconds with its bottom row at `bottom`, drifts up
// NOTE_RISE_ROWS over BUSK_LOOPS.noteRise, and alternates colors and
// columns.
function drawNotes(px, col, bottom, t) {
  const { note: every, noteRise: rise } = BUSK_LOOPS;
  const newest = Math.floor(t / every);
  for (let i = newest; i >= 0 && t - i * every < rise; i--) {
    const phase = (t - i * every) / rise;
    const top = Math.max(1, bottom - 3 - Math.floor(phase * NOTE_RISE_ROWS));
    const left = col + (i % 2) * 2 + (phase > 0.5 ? 1 : 0);
    for (const [x, y] of NOTE_PIXELS) px(left + x, top + y, 1, 1, NOTE_COLORS[i % 2]);
  }
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
    case 'fish':
      if (pose.fishing?.phase === 'show') {
        // Holding the catch up high: shoulder, elbow out, hand raised.
        px(col, bodyTop + 1, 1, 1, look.shirt);
        px(col + 1, bodyTop, 1, 1, look.shirt);
        px(col + 1, bodyTop - 2, 1, 2, look.skin);
      } else {
        // Holding the rod out in front, like a book.
        px(col, bodyTop + 1, 1, sleeve, look.shirt);
        px(col + 1, bodyTop + sleeve, 2, 1, look.skin);
      }
      return true;
    case 'plant':
    case 'weed': {
      // Reaching down in front: planting dips the hand to the water and
      // back; pulling weeds tugs it up.
      const beat = pose.activity === 'plant' ? FARM_LOOPS.plant : FARM_LOOPS.weed;
      const low = Math.floor(pose.activityTime / beat) % 2 === 0;
      const lift = pose.activity === 'weed' ? (low ? 0 : 2) : (low ? 0 : 1);
      px(col, bodyTop + 1, 1, sleeve, look.shirt);
      px(col + 1, bodyTop + sleeve + 1 - lift, 1, shape.body - sleeve, look.skin);
      return true;
    }
    case 'harvest': {
      // The sickle arm: raised forward, then swung down low.
      const down = Math.floor(pose.activityTime / FARM_LOOPS.swing) % 2 === 1;
      px(col, bodyTop + 1, 1, sleeve, look.shirt);
      if (down) {
        px(col + 1, bodyTop + sleeve + 1, 2, 1, look.skin);
      } else {
        px(col + 1, bodyTop + sleeve - 1, 1, 2, look.skin);
      }
      return true;
    }
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
    case 'plant':
    case 'weed': {
      // A seedling going in, or a weed coming out, in the hand.
      const beat = pose.activity === 'plant' ? FARM_LOOPS.plant : FARM_LOOPS.weed;
      const low = Math.floor(t / beat) % 2 === 0;
      const lift = pose.activity === 'weed' ? (low ? 0 : 2) : (low ? 0 : 1);
      const bottom = bodyTop + shape.body - lift;
      const color = pose.activity === 'plant' ? SEEDLING : WEED;
      px(armCol + 2, bottom - 1, 1, 2, color);
      if (pose.activity === 'weed' && !low) px(armCol + 3, bottom, 1, 1, WEED);
      break;
    }
    case 'harvest': {
      // The sickle: a handle in the hand and a curved blade, held up then
      // swung down through the rice.
      const down = Math.floor(t / FARM_LOOPS.swing) % 2 === 1;
      if (down) {
        const row = handRow + 1;
        px(armCol + 3, row, 1, 1, SICKLE_HANDLE);
        px(armCol + 4, row, 1, 1, SICKLE_BLADE);
        px(armCol + 5, row + 1, 1, 1, SICKLE_BLADE);
        px(armCol + 4, row + 2, 1, 1, SICKLE_EDGE);
      } else {
        const row = handRow - 2;
        px(armCol + 1, row, 1, 1, SICKLE_HANDLE);
        px(armCol + 1, row - 1, 1, 1, SICKLE_BLADE);
        px(armCol + 2, row - 2, 2, 1, SICKLE_BLADE);
        px(armCol + 3, row - 1, 1, 1, SICKLE_EDGE);
      }
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

// Where the hand holding the fishing rod is while fishing (pose.activity
// 'fish', standing), in canvas pixels: { x, y } (the middle of the hand
// pixel), with `unit` (canvas pixels per character pixel) and `facing`,
// for drawing the rod, line and catch from it (ui/fishing.js). While
// showing a catch it's the raised hand. Matches the code-drawn figure;
// a character.<body>.fish sprite should hold its hand in the same place.
export function fishingHand(stage, pose, groundY, scale) {
  const shape = shapeOf(stage, pose);
  const bodyTop = FOOT_ROW - shape.legs - shape.body;
  const armCol = -Math.floor(shape.width / 2) + shape.width;
  const sleeve = Math.ceil((shape.body - 1) / 2);
  const [col, row] = pose.fishing?.phase === 'show'
    ? [armCol + 1, bodyTop - 2]
    : [armCol + 2, bodyTop + sleeve];
  const top = groundY + scale - LAYER_HEIGHT * scale;
  return {
    x: pose.x + pose.facing * (col + 0.5) * scale,
    y: top + (row + 0.5) * scale,
    unit: scale,
    facing: pose.facing,
  };
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
