// store.js — Draws the 6-Eleven, a bright konbini, in code: white walls
// under strip lights, a tiled floor, the glass front with the street
// outside and its sliding door, the drink fridges along the back wall,
// the snack shelves, the magazine rack, the ATM, and the register counter
// (striped orange, green and red) with the register and the hot food
// case, under the "6-ELEVEN" sign. The counter's front is also its own
// layer, drawn again over whoever stands behind it, and the glass's
// shine over whatever is outside it (the pigeon). Positions come from
// data/store.js (the picture's pixels); the store sprite replaces the
// whole picture if there is one.

import {
  STORE_ART, STORE_FRONT, STORE_DOOR, STORE_COUNTER, STORE_SIGN, STORE_REGISTER_X, STORE_HOT_CASE_X,
} from '../data/store.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, drawLayer } from './pixel.js';
import { getSprite } from './assets.js';

// Pure art: the store's colors.
const WALL = '#f2f1ec';
const WALL_SHADE = '#e3e2dc';
const CEILING = '#e6e8eb';
const LIGHT = '#ffffff';
const TILE = '#f4f4f1';
const TILE_LINE = '#dcdfe3';
const FRAME = '#9aa3ad';
const FRAME_DARK = '#6f7883';
const SKY = '#cfe9f5';
const BUILDING = '#d9c8b0';
const BUILDING_WINDOW = '#a9c4d6';
const ROAD = '#8a8f96';
const SIDEWALK = '#c9c4bc';
const SHINE = '#ffffff';
const MAT = '#5a6a7a';
const FRIDGE = '#8e98a3';
const FRIDGE_GLASS = '#e8f6ff';
const SHELF = '#b9c0c8';
const COUNTER = '#f7f7f4';
const COUNTER_TOP = '#c9ccd1';
const ORANGE = '#f28c28';
const GREEN = '#2f9e5b';
const RED = '#e2403a';
const REGISTER = '#4a4f57';
const SCREEN = '#5fc9b8';
const WARM = '#f6d58a';
const BUN = '#f3e3c3';
const ODEN = '#d9a85a';
const ATM = '#7d8a99';
// Packs, bottles and magazines in many colors.
const GOODS = ['#e8483f', '#3fa34d', '#f2a33a', '#3b7dd8', '#f2d94e', '#c45ab8', '#ffffff'];

const { width: W, height: H } = STORE_ART;
const C = STORE_COUNTER;

// The sign's letters, 3 x 5 (N is 4 wide); '#' is a pixel.
const LETTERS = {
  6: ['###', '#..', '###', '#.#', '###'],
  '-': ['...', '...', '###', '...', '...'],
  E: ['###', '#..', '##.', '#..', '###'],
  L: ['#..', '#..', '#..', '#..', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
};

const good = (i) => GOODS[i % GOODS.length];

function room(layer) {
  fill(layer, 0, 0, W, 64, WALL);
  for (let x = 30; x < W; x += 12) fill(layer, x, 4, 1, 60, WALL_SHADE);
  fill(layer, 0, 0, W, 4, CEILING);
  for (let x = 32; x < W - 4; x += 18) fill(layer, x, 3, 10, 1, LIGHT);
  fill(layer, 0, 64, W, H - 64, TILE);
  for (let row = 64; row < H; row += 5) fill(layer, 0, row, W, 1, TILE_LINE);
  for (let x = 3; x < W; x += 7) fill(layer, x, 64, 1, H - 64, TILE_LINE);
  fill(layer, 0, 63, W, 1, WALL_SHADE);
}

// The glass front: the street outside (sky, the building across, the
// road, the sidewalk), the frame, the sliding door and the mat.
function glassFront(layer) {
  const { left, right, top, bottom } = STORE_FRONT;
  const width = right - left + 1;
  fill(layer, left, top, width, 22, SKY);
  fill(layer, left, top + 8, width, 22, BUILDING);
  for (let x = left + 2; x < right; x += 5) {
    for (let row = top + 10; row < top + 28; row += 6) fill(layer, x, row, 3, 3, BUILDING_WINDOW);
  }
  fill(layer, left, top + 30, width, 10, ROAD);
  fill(layer, left, top + 35, width, 1, LIGHT);
  fill(layer, left, top + 40, width, bottom - top - 39, SIDEWALK);
  // Frame: the outer edge, the top rail, and the posts.
  fill(layer, left, top - 1, width, 2, FRAME_DARK);
  fill(layer, right, top, 1, bottom - top + 1, FRAME_DARK);
  for (const x of [STORE_DOOR.left - 1, STORE_DOOR.right + 1]) fill(layer, x, STORE_DOOR.top, 1, bottom - STORE_DOOR.top + 1, FRAME);
  fill(layer, STORE_DOOR.left - 1, STORE_DOOR.top, STORE_DOOR.right - STORE_DOOR.left + 3, 1, FRAME);
  // The door's handle bar and the mat in front of it.
  fill(layer, STORE_DOOR.right - 2, STORE_DOOR.top + 18, 1, 6, FRAME_DARK);
  fill(layer, STORE_DOOR.left, 65, STORE_DOOR.right - STORE_DOOR.left + 1, 3, MAT);
  // A low magazine rack under the glass right of the door.
  fill(layer, STORE_DOOR.right + 3, 56, right - STORE_DOOR.right - 4, 11, SHELF);
  for (let i = 0, x = STORE_DOOR.right + 4; x < right - 2; i++, x += 3) {
    fill(layer, x, 57, 2, 4, good(i + 2));
    fill(layer, x, 62, 2, 4, good(i + 4));
  }
}

function fridges(layer) {
  for (let door = 0; door < 4; door++) {
    const left = 29 + door * 10;
    fill(layer, left, 13, 10, 33, FRIDGE);
    fill(layer, left + 1, 14, 8, 30, FRIDGE_GLASS);
    for (const [i, row] of [21, 29, 37].entries()) {
      fill(layer, left + 1, row + 3, 8, 1, FRIDGE);
      for (let x = left + 2, n = 0; x < left + 9; x += 2, n++) fill(layer, x, row, 1, 3, good(door + i + n));
    }
    fill(layer, left + 8, 26, 1, 6, FRAME_DARK);
  }
  fill(layer, 29, 12, 40, 1, OUTLINE_COLOR);
}

// The snack shelves in the middle of the floor, and the ATM by the
// counter.
function shelvesAndAtm(layer) {
  fill(layer, 29, 49, 34, 1, OUTLINE_COLOR);
  fill(layer, 29, 50, 34, 16, SHELF);
  for (const row of [51, 56, 61]) {
    fill(layer, 29, row + 4, 34, 1, FRAME);
    for (let i = 0, x = 30; x < 62; i++, x += 2) fill(layer, x, row, 2, 4, good(i + row));
  }
  fill(layer, 63, 40, 7, 26, OUTLINE_COLOR);
  fill(layer, 64, 41, 5, 24, ATM);
  fill(layer, 65, 43, 3, 3, SCREEN);
  fill(layer, 65, 48, 3, 2, REGISTER);
}

// The wall behind the counter: the sign and a shelf of small goods.
function behindCounter(layer) {
  const { left, right, top, bottom, text } = STORE_SIGN;
  fill(layer, left - 1, top - 1, right - left + 3, bottom - top + 3, OUTLINE_COLOR);
  fill(layer, left, top, right - left + 1, bottom - top + 1, LIGHT);
  fill(layer, left, top + 1, right - left + 1, 2, ORANGE);
  fill(layer, left, top + 3, right - left + 1, 1, GREEN);
  fill(layer, left, bottom - 2, right - left + 1, 1, GREEN);
  fill(layer, left, bottom - 1, right - left + 1, 1, RED);
  let x = left + 2;
  for (const char of text) {
    const rows = LETTERS[char];
    rows.forEach((line, row) => [...line].forEach((pixel, col) => {
      if (pixel === '#') fill(layer, x + col, top + 6 + row, 1, 1, char === '6' ? GREEN : RED);
    }));
    x += rows[0].length + 1;
  }
  for (const row of [30, 38]) {
    fill(layer, C.left + 3, row + 4, C.right - C.left - 4, 1, SHELF);
    for (let i = 0, gx = C.left + 4; gx < C.right - 2; i++, gx += 2) fill(layer, gx, row, 1, 4, good(i * 3 + row));
  }
}

// What stands in front of whoever is behind the counter: the counter (its
// orange, green and red stripes), the register and the hot food case.
function counterFront(layer) {
  fill(layer, C.left - 1, C.top - 1, C.right - C.left + 2, 1, OUTLINE_COLOR);
  fill(layer, C.left, C.top, C.right - C.left + 1, 2, COUNTER_TOP);
  fill(layer, C.left, C.top + 2, C.right - C.left + 1, C.bottom - C.top - 1, COUNTER);
  fill(layer, C.left, C.top + 7, C.right - C.left + 1, 1, ORANGE);
  fill(layer, C.left, C.top + 8, C.right - C.left + 1, 1, GREEN);
  fill(layer, C.left, C.top + 9, C.right - C.left + 1, 1, RED);
  fill(layer, C.left, C.bottom, C.right - C.left + 1, 1, WALL_SHADE);
  fill(layer, C.left - 1, C.top, 1, C.bottom - C.top + 1, OUTLINE_COLOR);
  // The register: a screen on a stand, and its base.
  const r = STORE_REGISTER_X;
  fill(layer, r - 4, C.top - 3, 9, 3, REGISTER);
  fill(layer, r - 1, C.top - 6, 1, 3, REGISTER);
  fill(layer, r - 3, C.top - 9, 6, 4, REGISTER);
  fill(layer, r - 2, C.top - 8, 4, 2, SCREEN);
  // The hot food case: buns and oden under a warm light.
  const h = STORE_HOT_CASE_X;
  fill(layer, h - 6, C.top - 10, 12, 10, OUTLINE_COLOR);
  fill(layer, h - 5, C.top - 9, 10, 9, WARM);
  for (const x of [h - 4, h - 1, h + 2]) fill(layer, x, C.top - 7, 2, 2, BUN);
  for (const x of [h - 4, h - 2, h, h + 2]) fill(layer, x, C.top - 3, 1, 2, ODEN);
}

// The glass's shine: a few light streaks over the street outside.
function shine(layer) {
  const { left, right, top } = STORE_FRONT;
  for (const start of [left + 3, left + 18]) {
    for (let i = 0; i < 6; i++) {
      const x = start + i;
      if (x < right) fill(layer, x, top + 30 - i * 2, 1, 2, SHINE);
    }
  }
}

let roomLayer = null;
let frontLayer = null;
let shineLayer = null;

function paint(...painters) {
  const layer = createLayer(W, H);
  for (const paintIt of painters) paintIt(layer);
  return layer;
}

// The whole store (the code-drawn picture).
export function drawStore(ctx, layout) {
  roomLayer ??= paint(room, glassFront, fridges, shelvesAndAtm, behindCounter, counterFront, shine);
  drawLayer(ctx, roomLayer, 0, layout.height, layout.scale);
}

// The counter's front again, over whoever stands behind it, and the
// glass's shine again, over whatever's outside. Not with the store
// sprite (a picture has no separate layers).
export function drawStoreCounterFront(ctx, layout) {
  if (getSprite('store')) return;
  frontLayer ??= paint(counterFront);
  drawLayer(ctx, frontLayer, 0, layout.height, layout.scale);
}

export function drawStoreShine(ctx, layout) {
  if (getSprite('store')) return;
  shineLayer ??= paint(shine);
  drawLayer(ctx, shineLayer, 0, layout.height, layout.scale);
}
