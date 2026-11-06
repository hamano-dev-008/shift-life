// cafe.js — Draws the Cafe, a small Japanese kissaten, in code: the
// plaster wall and dark wood paneling under a ceiling beam, paper
// lanterns, the shoji window and its sill, the front door with its noren,
// the menu board, the shelves of cups behind the counter, the table and
// chairs, a potted plant, and the counter itself with its siphon brewers
// and stools. The counter's front is also its own layer, drawn again over
// whoever stands behind it (the master, or the character at work) so it
// hides their legs. Positions come from data/cafe.js (the picture's
// pixels); the cafe sprite replaces the whole picture if there is one.

import {
  CAFE_ART, CAFE_DOOR, CAFE_COUNTER, CAFE_WINDOW, CAFE_SILL, CAFE_SEATS, CAFE_TABLE, CAFE_SIPHONS,
} from '../data/cafe.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, drawLayer } from './pixel.js';
import { getSprite } from './assets.js';

// Pure art: the room's colors.
const WALL = '#e8d5ae';
const WALL_SHADE = '#dcc59a';
const WALL_LIT = '#f1e2bf';
const BEAM = '#4a3324';
const BEAM_LIGHT = '#5e4130';
const PANEL = '#6e4a30';
const PANEL_DARK = '#5a3b26';
const PANEL_LIGHT = '#82593a';
const FLOOR = '#9a6a43';
const FLOOR_DARK = '#85583a';
const FLOOR_LIGHT = '#ad7a4f';
const DOOR_WOOD = '#7a5233';
const DOOR_GLASS = '#cfe3e6';
const NOREN = '#2f3f6b';
const NOREN_LIGHT = '#45598f';
const NOREN_MARK = '#f3ead2';
const SHOJI = '#f5ecd6';
const SHOJI_LINE = '#b89a6e';
const LANTERN = '#f6d58a';
const LANTERN_DARK = '#d9a85a';
const CORD = '#3a2a20';
const SHELF = '#5a3b26';
const CUP = '#f4efe6';
const CUP_BLUE = '#5b7fb0';
const JAR = '#c88a4a';
const BOTTLE = '#3f6e4a';
const COUNTER_TOP = '#c9925a';
const COUNTER_TOP_LIGHT = '#dba56b';
const COUNTER = '#7a4e2e';
const COUNTER_DARK = '#5f3b22';
const GLASS = '#d8ecf2';
const COFFEE = '#5a2e1a';
const METAL = '#3a3a44';
const FLAME = '#f2a03a';
const SEAT = '#a33f3a';
const SEAT_LIGHT = '#c0564e';
const TABLE = '#6e4a30';
const CHAIR = '#9a6a43';
const CHAIR_DARK = '#6e4a30';
const TABLE_TOP = '#8a5e3c';
const BOARD = '#2e4a3a';
const CHALK = '#e8efe6';
const POT = '#b0653f';
const LEAF = '#4f8a4a';
const LEAF_LIGHT = '#6aa85a';

const { width: W, height: H } = CAFE_ART;
const C = CAFE_COUNTER;

function wallAndFloor(layer) {
  fill(layer, 0, 0, W, 63, WALL);
  for (let x = 2; x < W; x += 9) fill(layer, x, 6, 1, 38, WALL_SHADE);
  // The ceiling beam and the dark wood paneling below the plaster.
  fill(layer, 0, 0, W, 4, BEAM);
  fill(layer, 0, 3, W, 1, BEAM_LIGHT);
  fill(layer, 0, 44, W, 20, PANEL);
  fill(layer, 0, 44, W, 1, PANEL_LIGHT);
  for (let x = 1; x < W; x += 5) fill(layer, x, 46, 1, 17, PANEL_DARK);
  fill(layer, 0, 62, W, 2, PANEL_DARK);
  // Wide planks, joints staggered.
  fill(layer, 0, 64, W, H - 64, FLOOR);
  for (let row = 64, n = 0; row < H; row += 4, n++) {
    fill(layer, 0, row, W, 1, FLOOR_DARK);
    for (let x = (n % 2) * 9; x < W; x += 18) fill(layer, x, row + 1, 1, 3, FLOOR_DARK);
    for (let x = 4 + (n % 3) * 5; x < W; x += 15) fill(layer, x, row + 2, 3, 1, FLOOR_LIGHT);
  }
}

// Where the paper lanterns hang (their middles).
const LANTERNS = [52, 74, 96];

// The warm light a lantern throws on the plaster around it.
function lanternLight(layer, x) {
  for (let dy = -7; dy <= 7; dy++) {
    for (let dx = -9; dx <= 9; dx++) {
      if ((dx / 9) ** 2 + (dy / 7) ** 2 <= 1 && 13 + dy > 3 && 13 + dy < 44) fill(layer, x + dx, 13 + dy, 1, 1, WALL_LIT);
    }
  }
}

// A paper lantern hanging from the beam, its middle at `x`.
function lantern(layer, x) {
  fill(layer, x, 4, 1, 6, CORD);
  fill(layer, x - 2, 10, 5, 1, LANTERN_DARK);
  fill(layer, x - 3, 11, 7, 5, LANTERN);
  fill(layer, x - 3, 13, 7, 1, LANTERN_DARK);
  fill(layer, x - 2, 16, 5, 1, LANTERN_DARK);
  fill(layer, x - 4, 11, 1, 5, OUTLINE_COLOR);
  fill(layer, x + 4, 11, 1, 5, OUTLINE_COLOR);
}

function shojiWindow(layer) {
  const { left, right, top, bottom } = CAFE_WINDOW;
  fill(layer, left - 1, top - 1, right - left + 3, bottom - top + 3, OUTLINE_COLOR);
  fill(layer, left, top, right - left + 1, bottom - top + 1, DOOR_WOOD);
  fill(layer, left + 1, top + 1, right - left - 1, bottom - top - 1, SHOJI);
  for (let x = left + 4; x < right; x += 4) fill(layer, x, top + 1, 1, bottom - top - 1, SHOJI_LINE);
  for (let row = top + 5; row < bottom; row += 5) fill(layer, left + 1, row, right - left - 1, 1, SHOJI_LINE);
  // The sill the cat lies on.
  fill(layer, CAFE_SILL.left, CAFE_SILL.row, CAFE_SILL.right - CAFE_SILL.left + 1, 2, DOOR_WOOD);
  fill(layer, CAFE_SILL.left, CAFE_SILL.row + 2, CAFE_SILL.right - CAFE_SILL.left + 1, 1, OUTLINE_COLOR);
}

function door(layer) {
  const { left, right, top, bottom } = CAFE_DOOR;
  fill(layer, left - 1, top - 1, right - left + 3, bottom - top + 2, OUTLINE_COLOR);
  fill(layer, left, top, right - left + 1, bottom - top + 1, DOOR_WOOD);
  // A lattice door: glass panes between slats.
  for (let row = top + 9; row < bottom - 3; row += 5) {
    for (let x = left + 2; x < right - 1; x += 4) fill(layer, x, row, 3, 4, DOOR_GLASS);
  }
  // The noren: three indigo flaps over the top, with a white crest.
  const flap = Math.floor((right - left + 1) / 3);
  for (let i = 0; i < 3; i++) {
    const x = left + i * flap;
    fill(layer, x, top - 4, flap - 1, 11, i % 2 ? NOREN_LIGHT : NOREN);
  }
  fill(layer, left - 1, top - 5, right - left + 3, 1, CORD);
  const middle = Math.floor((left + right) / 2);
  fill(layer, middle - 1, top, 3, 3, NOREN_MARK);
  fill(layer, middle, top + 1, 1, 1, NOREN);
}

function menuBoard(layer) {
  fill(layer, 46, 19, 12, 15, OUTLINE_COLOR);
  fill(layer, 47, 20, 10, 13, BOARD);
  for (const [row, width] of [[22, 7], [25, 5], [27, 6], [30, 4]]) fill(layer, 48, row, width, 1, CHALK);
  fill(layer, 55, 25, 1, 1, CHALK);
  fill(layer, 55, 30, 1, 1, CHALK);
}

// Shelves on the wall behind the counter, with cups, jars and bottles.
function shelves(layer) {
  for (const row of [28, 37, 46]) fill(layer, C.left + 4, row, C.right - C.left - 6, 1, SHELF);
  for (let i = 0, x = C.left + 6; x < C.right - 4; i++, x += 4) {
    // Cups (every third a blue one) on top; jars and bottles below.
    fill(layer, x, 26, 2, 2, i % 3 === 1 ? CUP_BLUE : CUP);
    fill(layer, x + 2, 26, 1, 1, i % 3 === 1 ? CUP_BLUE : CUP);
    if (i % 2) {
      fill(layer, x, 33, 3, 4, JAR);
      fill(layer, x, 33, 3, 1, SHELF);
    } else {
      fill(layer, x + 1, 31, 1, 2, BOTTLE);
      fill(layer, x, 33, 3, 4, BOTTLE);
    }
  }
}

function plant(layer) {
  fill(layer, 16, 59, 7, 8, OUTLINE_COLOR);
  fill(layer, 17, 60, 5, 6, POT);
  fill(layer, 17, 60, 5, 1, OUTLINE_COLOR);
  // Leaves fanning up and out.
  for (const [x, row, w, h, color] of [
    [18, 46, 3, 5, LEAF], [15, 50, 3, 4, LEAF], [21, 49, 3, 4, LEAF], [17, 52, 5, 7, LEAF],
    [19, 47, 1, 3, LEAF_LIGHT], [16, 51, 1, 2, LEAF_LIGHT], [22, 50, 1, 2, LEAF_LIGHT], [19, 54, 1, 3, LEAF_LIGHT],
  ]) fill(layer, x, row, w, h, color);
}

function tableAndChairs(layer) {
  const { x, row } = CAFE_TABLE;
  for (const seat of CAFE_SEATS.filter((s) => s.id.startsWith('chair'))) {
    // A wooden chair seen from the side, its back away from the table.
    const back = seat.facing === 1 ? seat.x - 4 : seat.x + 3;
    fill(layer, back - 1, seat.row - 10, 3, 18, OUTLINE_COLOR);
    fill(layer, back, seat.row - 9, 1, 16, CHAIR);
    fill(layer, seat.x - 5, seat.row - 1, 11, 4, OUTLINE_COLOR);
    fill(layer, seat.x - 4, seat.row, 9, 2, CHAIR);
    fill(layer, seat.x - 4, seat.row + 1, 9, 1, CHAIR_DARK);
    fill(layer, seat.x - 4, seat.row + 2, 1, 5, CHAIR_DARK);
    fill(layer, seat.x + 4, seat.row + 2, 1, 5, CHAIR_DARK);
  }
  fill(layer, x - 8, row - 1, 17, 4, OUTLINE_COLOR);
  fill(layer, x - 7, row, 15, 2, TABLE);
  fill(layer, x - 7, row, 15, 1, TABLE_TOP);
  fill(layer, x - 2, row + 3, 5, 9, OUTLINE_COLOR);
  fill(layer, x - 1, row + 3, 3, 8, TABLE);
  fill(layer, x - 5, row + 10, 11, 2, OUTLINE_COLOR);
  fill(layer, x - 4, row + 10, 9, 1, TABLE);
}

// What stands in front of whoever is behind the counter: the brewers on
// it, the counter, and the stools in front of it.
function counterFront(layer) {
  for (const x of CAFE_SIPHONS) {
    fill(layer, x - 1, C.top - 9, 3, 1, METAL);
    fill(layer, x - 2, C.top - 8, 5, 3, GLASS);
    fill(layer, x - 2, C.top - 6, 5, 1, COFFEE);
    fill(layer, x, C.top - 5, 1, 1, GLASS);
    fill(layer, x - 2, C.top - 4, 5, 3, GLASS);
    fill(layer, x - 2, C.top - 2, 5, 1, COFFEE);
    fill(layer, x - 3, C.top - 1, 7, 1, METAL);
    fill(layer, x, C.top - 1, 1, 1, FLAME);
  }
  fill(layer, C.left - 1, C.top - 1, C.right - C.left + 2, 1, OUTLINE_COLOR);
  fill(layer, C.left, C.top, C.right - C.left + 1, 2, COUNTER_TOP);
  fill(layer, C.left, C.top, C.right - C.left + 1, 1, COUNTER_TOP_LIGHT);
  fill(layer, C.left, C.top + 2, C.right - C.left + 1, C.bottom - C.top - 1, COUNTER);
  for (let x = C.left + 5; x < C.right; x += 10) fill(layer, x, C.top + 4, 1, C.bottom - C.top - 6, COUNTER_DARK);
  fill(layer, C.left, C.bottom, C.right - C.left + 1, 1, COUNTER_DARK);
  fill(layer, C.left - 1, C.top, 1, C.bottom - C.top + 1, OUTLINE_COLOR);
  for (const seat of CAFE_SEATS.filter((s) => s.id.startsWith('stool'))) {
    fill(layer, seat.x - 2, seat.row, 5, 2, SEAT);
    fill(layer, seat.x - 1, seat.row, 3, 1, SEAT_LIGHT);
    fill(layer, seat.x, seat.row + 2, 1, 6, METAL);
    fill(layer, seat.x - 2, seat.row + 8, 5, 1, METAL);
  }
}

let roomLayer = null;
let frontLayer = null;

function paintRoom() {
  const layer = createLayer(W, H);
  wallAndFloor(layer);
  for (const x of LANTERNS) lanternLight(layer, x);
  for (const x of LANTERNS) lantern(layer, x);
  shojiWindow(layer);
  door(layer);
  menuBoard(layer);
  shelves(layer);
  plant(layer);
  tableAndChairs(layer);
  counterFront(layer);
  return layer;
}

function paintFront() {
  const layer = createLayer(W, H);
  counterFront(layer);
  return layer;
}

// The whole Cafe (the code-drawn picture).
export function drawCafe(ctx, layout) {
  roomLayer ??= paintRoom();
  drawLayer(ctx, roomLayer, 0, layout.height, layout.scale);
}

// The counter's front again, over whoever stands behind it. Not with the
// cafe sprite (a picture has no separate counter).
export function drawCafeCounterFront(ctx, layout) {
  if (getSprite('cafe')) return;
  frontLayer ??= paintFront();
  drawLayer(ctx, frontLayer, 0, layout.height, layout.scale);
}
