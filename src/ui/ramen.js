// ramen.js — Draws Ramen Hinata, a cozy little ramen shop, in code: warm
// wooden walls under a dark beam, a plank floor, the door with its indigo
// noren, the "RAMEN" sign over hanging menu tags, a paper lantern, the
// kitchen behind the counter (shelves of bowls, a noren across its top,
// the stove and its pots), the counter and four tall stools. The
// counter's front and the stools are also their own layer, drawn again
// over whoever stands behind the counter.
// Positions come from data/ramen.js (the picture's pixels); the ramen
// sprite replaces the whole picture if there is one.

import {
  RAMEN_ART, RAMEN_DOOR, RAMEN_SIGN, RAMEN_LANTERN, RAMEN_COUNTER, RAMEN_POTS, RAMEN_STOOLS, RAMEN_FEET_FROM_BOTTOM,
} from '../data/ramen.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, drawLayer } from './pixel.js';
import { getSprite } from './assets.js';
import { drawText } from './pixelFont.js';

// Pure art: the shop's colors.
const WALL = '#d9b48a';
const WALL_DARK = '#c49a6c';
const BEAM = '#4a3324';
const FLOOR = '#8c6a4f';
const FLOOR_DARK = '#76573f';
const FLOOR_LIGHT = '#a07d5f';
const DOOR = '#6b4f3a';
const GLASS = '#e8dcc0';
const NOREN = '#2f4a7a';
const NOREN_LIGHT = '#f4efe6';
const SIGN = '#3a2a1e';
const SIGN_TEXT = '#f6d58a';
const TAG = '#f4efe6';
const TAG_INK = '#3d3a4b';
const LANTERN = '#e2403a';
const LANTERN_DARK = '#b5443f';
const LANTERN_CAP = '#3a2a1e';
const KITCHEN = '#c9a27a';
const SHELF = '#5e4130';
const BOWLS = ['#f4efe6', '#e07a5f', '#2f4a7a'];
const STOVE = '#3a3a44';
const STOVE_TOP = '#5c6270';
const POT = '#9aa3ad';
const POT_DARK = '#7d8590';
const FLAME = '#f2a33a';
const COUNTER = '#8c5a34';
const COUNTER_DARK = '#6b4428';
const COUNTER_TOP = '#d9a86a';
const COUNTER_TOP_LIGHT = '#e8be85';
const STOOL = '#5e4130';
const STOOL_SEAT = '#e07a5f';

const { width: W, height: H } = RAMEN_ART;
const C = RAMEN_COUNTER;
const FLOOR_ROW = 64;

function room(layer) {
  fill(layer, 0, 0, W, FLOOR_ROW, WALL);
  for (let x = 5; x < W; x += 10) fill(layer, x, 6, 1, FLOOR_ROW - 6, WALL_DARK);
  fill(layer, 0, 0, W, 6, BEAM);
  fill(layer, 0, FLOOR_ROW - 2, W, 2, BEAM);
  fill(layer, 0, FLOOR_ROW, W, H - FLOOR_ROW, FLOOR);
  for (let row = FLOOR_ROW, n = 0; row < H; row += 4, n++) {
    fill(layer, 0, row, W, 1, FLOOR_DARK);
    for (let x = (n % 2) * 11; x < W; x += 22) fill(layer, x, row + 1, 1, 3, FLOOR_DARK);
    for (let x = 6 + (n % 3) * 4; x < W; x += 13) fill(layer, x, row + 2, 2, 1, FLOOR_LIGHT);
  }
}

// The door and its noren: three indigo panels with a white crest.
function door(layer) {
  const { left, right, top } = RAMEN_DOOR;
  fill(layer, left - 1, top - 1, right - left + 3, FLOOR_ROW + 2 - top + 1, OUTLINE_COLOR);
  fill(layer, left, top, right - left + 1, FLOOR_ROW + 2 - top, DOOR);
  fill(layer, left + 2, top + 2, right - left - 3, 20, GLASS);
  fill(layer, left + 2, top + 12, right - left - 3, 1, DOOR);
  fill(layer, Math.floor((left + right) / 2), top + 2, 1, 20, DOOR);
  for (let i = 0; i < 3; i++) {
    const x = left + i * 4;
    fill(layer, x, top, 4, 9, NOREN);
    fill(layer, x + 3, top, 1, 9, OUTLINE_COLOR);
  }
  fill(layer, left + 5, top + 3, 3, 3, NOREN_LIGHT);
  fill(layer, left + 6, top + 4, 1, 1, NOREN);
}

function signAndMenu(layer) {
  const s = RAMEN_SIGN;
  fill(layer, s.left - 1, s.top - 1, s.right - s.left + 3, s.bottom - s.top + 3, OUTLINE_COLOR);
  fill(layer, s.left, s.top, s.right - s.left + 1, s.bottom - s.top + 1, SIGN);
  drawText(layer, s.left + 4, s.top + 1, s.text, () => SIGN_TEXT);
  // Menu tags hanging in a row: a dish's name brushed down each.
  const tagTop = s.bottom + 4;
  for (let x = s.left; x < s.right - 3; x += 5) {
    fill(layer, x, tagTop, 4, 14, OUTLINE_COLOR);
    fill(layer, x + 1, tagTop + 1, 2, 12, TAG);
    for (let row = tagTop + 2; row < tagTop + 11; row += 3) fill(layer, x + 1, row, 2, 1, TAG_INK);
  }
  // The paper lantern.
  const { x, top } = RAMEN_LANTERN;
  fill(layer, x, 6, 1, top - 6, LANTERN_CAP);
  fill(layer, x - 3, top, 7, 10, OUTLINE_COLOR);
  fill(layer, x - 2, top + 1, 5, 8, LANTERN);
  fill(layer, x - 2, top + 3, 5, 1, LANTERN_DARK);
  fill(layer, x - 2, top + 6, 5, 1, LANTERN_DARK);
  fill(layer, x - 2, top, 5, 1, LANTERN_CAP);
  fill(layer, x - 2, top + 9, 5, 1, LANTERN_CAP);
}

// Behind the counter: the kitchen wall, shelves of bowls, a noren across
// the top, the stove with its pots on the back counter.
function kitchen(layer) {
  fill(layer, C.left, 18, C.right - C.left + 1, C.top - 18, KITCHEN);
  for (let x = C.left; x <= C.right; x += 9) {
    fill(layer, x, 18, 8, 7, NOREN);
    fill(layer, x + 8, 18, 1, 7, OUTLINE_COLOR);
  }
  for (const row of [32, 40]) {
    fill(layer, 86, row, 20, 1, SHELF);
    for (let x = 87, i = 0; x < 104; x += 4, i++) fill(layer, x, row - 2, 3, 2, BOWLS[i % BOWLS.length]);
  }
  fill(layer, C.left + 6, 46, 38, 1, OUTLINE_COLOR);
  fill(layer, C.left + 6, 47, 38, C.top - 47, STOVE);
  fill(layer, C.left + 6, 47, 38, 1, STOVE_TOP);
  for (const x of RAMEN_POTS) {
    fill(layer, x - 4, 39, 9, 8, OUTLINE_COLOR);
    fill(layer, x - 3, 40, 7, 6, POT);
    fill(layer, x - 3, 44, 7, 1, POT_DARK);
    fill(layer, x - 4, 41, 1, 1, POT_DARK);
    fill(layer, x + 4, 41, 1, 1, POT_DARK);
    fill(layer, x - 2, 47, 5, 1, FLAME);
  }
}

// The tall stools in front of the counter, standing on the floor where
// people walk (the feet row): a cushioned seat, a post with a footrest
// ring, and a round base, outlined.
function stools(layer) {
  const feetRow = H - RAMEN_FEET_FROM_BOTTOM;
  for (const { x, row } of RAMEN_STOOLS) {
    fill(layer, x - 4, row - 2, 9, 4, OUTLINE_COLOR);
    fill(layer, x - 3, row - 1, 7, 1, STOOL_SEAT);
    fill(layer, x - 3, row, 7, 1, STOOL);
    fill(layer, x - 1, row + 2, 3, feetRow - row - 2, OUTLINE_COLOR);
    fill(layer, x, row + 1, 1, feetRow - row - 1, STOOL);
    fill(layer, x - 3, row + 4, 7, 3, OUTLINE_COLOR);
    fill(layer, x - 2, row + 5, 5, 1, STOOL);
    fill(layer, x - 3, feetRow - 1, 7, 2, OUTLINE_COLOR);
    fill(layer, x - 2, feetRow - 1, 5, 1, STOOL);
  }
}

// What stands in front of whoever is behind the counter: the counter.
function counterFront(layer) {
  fill(layer, C.left - 1, C.top - 1, C.right - C.left + 2, 1, OUTLINE_COLOR);
  fill(layer, C.left, C.top, C.right - C.left + 1, 2, COUNTER_TOP);
  fill(layer, C.left, C.top, C.right - C.left + 1, 1, COUNTER_TOP_LIGHT);
  fill(layer, C.left, C.top + 2, C.right - C.left + 1, C.bottom - C.top - 1, COUNTER);
  for (let x = C.left + 3; x < C.right; x += 6) fill(layer, x, C.top + 3, 1, C.bottom - C.top - 4, COUNTER_DARK);
  fill(layer, C.left - 1, C.top, 1, C.bottom - C.top + 1, OUTLINE_COLOR);
}

let roomLayer = null;
let frontLayer = null;

function paint(...painters) {
  const layer = createLayer(W, H);
  for (const paintIt of painters) paintIt(layer);
  return layer;
}

// The whole shop (the code-drawn picture).
export function drawRamen(ctx, layout) {
  roomLayer ??= paint(room, door, signAndMenu, kitchen, counterFront, stools);
  drawLayer(ctx, roomLayer, 0, layout.height, layout.scale);
}

// The counter's front and the stools in front of it again, over whoever
// stands behind it. Not with the ramen sprite (a picture has no separate
// layers).
export function drawRamenCounterFront(ctx, layout) {
  if (getSprite('ramen')) return;
  frontLayer ??= paint(counterFront, stools);
  drawLayer(ctx, frontLayer, 0, layout.height, layout.scale);
}
