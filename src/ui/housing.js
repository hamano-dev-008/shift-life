// housing.js — Draws My Yard's first two housing tiers in code: the
// sleeping bag on the grass and the tent (the house reuses the parents'
// house art, ui/props.js). ui/scene.js uses these when there's no sprite
// for a tier. Sizes and positions come from the layout (data/layout.js);
// where the character lies on each from REST_SEATS in data/home.js.

import { REST_SEATS, SLEEPING_BAG_COLORS } from '../data/home.js';
import { drawProp } from './props.js';

// The bag's colors are data: someone lying in it is covered in them too.
const {
  color: BAG, dark: BAG_DARK, light: BAG_LIGHT, zip: ZIP, pillow: PILLOW, pillowShade: PILLOW_SHADE,
} = SLEEPING_BAG_COLORS;

const TENT = '#e9a03b';
const TENT_DARK = '#c47f22';
const TENT_LIGHT = '#f2bb63';
const OPENING = '#5a3d2b';
const FLAP = '#d48d2c';
const PEG = '#8b6b4a';

export function drawSleepingBag(ctx, layout) {
  drawProp(ctx, layout, 'yard.sleepingBag', paintSleepingBag);
}

export function drawTent(ctx, layout) {
  drawProp(ctx, layout, 'yard.tent', paintTent);
}

// A blue sleeping bag lying flat, a pillow at the left end and a zip
// along the side. Its top is REST_SEATS rows above the base.
function paintSleepingBag(px, w, h) {
  const top = h - REST_SEATS['yard.sleepingBag'];
  px(0, top, w, h - top, BAG);
  px(0, top, w, 1, BAG_LIGHT);
  px(0, h - 1, w, 1, BAG_DARK);
  px(w - 1, top, 1, h - top, BAG_DARK);
  // Zip down the side, from the open end.
  px(5, h - 2, w - 8, 1, ZIP);
  // Pillow, poking up above the bag.
  px(1, 0, 5, h - 1, PILLOW);
  px(1, h - 2, 5, 1, PILLOW_SHADE);
}

// An orange A-frame tent with a ridge pole, a dark opening with a
// tied-back flap in the middle and pegs at the corners.
function paintTent(px, w, h) {
  const mid = Math.floor(w / 2);
  const slope = (w / 2 - 1) / (h - 1);
  for (let row = 0; row < h; row++) {
    const half = Math.round(1 + row * slope);
    px(mid - half, row, half * 2, 1, TENT);
    // Shaded right side, lit left edge.
    px(mid, row, half, 1, TENT_DARK);
    px(mid - half, row, 1, 1, TENT_LIGHT);
  }
  // Ridge pole tip.
  px(mid - 1, 0, 2, 1, PEG);
  // Opening: a narrow triangle up from the ground.
  const openHeight = h - 6;
  for (let row = 0; row < openHeight; row++) {
    const half = Math.round(1 + (row * 4) / openHeight);
    px(mid - half, h - openHeight + row, half * 2, 1, OPENING);
  }
  // Flap tied back on the left.
  px(mid - 6, h - openHeight + 2, 2, openHeight - 2, FLAP);
  // Pegs.
  px(0, h - 1, 1, 1, PEG);
  px(w - 1, h - 1, 1, 1, PEG);
}
