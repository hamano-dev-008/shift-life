// post.js — Draws Pedal Post, a cozy bike courier hub, in code: a brick
// wall under a beam, a plank floor, the green front door and a window,
// the painted "PEDAL POST" sign, two bikes on a wall rack, the dispatch
// board with its route map and notes, a shelf with the coffee pot, the
// dog's bed, a pile of parcels, and the counter (a scale and a stamp on
// it, parcel cubbies behind it). The counter's front is also its own
// layer, drawn again over whoever stands behind it, and the cargo bike by
// the door is drawn on its own (it goes out on delivery runs). Positions
// come from data/post.js (the picture's pixels); the post sprite replaces
// the whole picture if there is one.

import {
  POST_ART, POST_DOOR, POST_COUNTER, POST_SIGN, POST_PILE_X, POST_SCALE_X, POST_STAMP_X, POST_DOG_BED,
  POST_CARGO_BIKE,
} from '../data/post.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { getSprite } from './assets.js';
import { drawText } from './pixelFont.js';

// Pure art: the hub's colors.
const BRICK = '#b5654a';
const BRICK_DARK = '#9c5540';
const MORTAR = '#d9a38a';
const BEAM = '#4a3324';
const FLOOR = '#8c6a4f';
const FLOOR_DARK = '#76573f';
const FLOOR_LIGHT = '#a07d5f';
const DOOR = '#3f7d5c';
const DOOR_DARK = '#2f5f45';
const GLASS = '#cfe3e6';
const SKY = '#bfe0ef';
const LEAVES = '#6aa85a';
const BOARD = '#5e4130';
const PAINT = '#f6d58a';
const RACK = '#3a3a44';
const TIRE = '#2e2a35';
const RED_FRAME = '#e07a5f';
const BLUE_FRAME = '#5b7fb0';
const GREEN_FRAME = '#2f9e5b';
const CORK = '#c49a6c';
const NOTE = '#fbf3e6';
const NOTE_YELLOW = '#f6d58a';
const PIN = '#e2403a';
const ROUTE = '#5fa55a';
const ROUTE_BLUE = '#5b7fb0';
const SHELF = '#5e4130';
const POT = '#3a3a44';
const COFFEE = '#5a2e1a';
const MUG = '#f4efe6';
const BED = '#5b7fb0';
const CUSHION = '#7fa6c9';
const BOX = '#c99b62';
const BOX_DARK = '#a8794a';
const TAPE = '#e8d29a';
const COUNTER = '#7a4e2e';
const COUNTER_DARK = '#5f3b22';
const COUNTER_TOP = '#c9925a';
const COUNTER_TOP_LIGHT = '#dba56b';
const METAL = '#9aa3ad';
const INK = '#3d3a4b';

const { width: W, height: H } = POST_ART;
const C = POST_COUNTER;

function room(layer) {
  fill(layer, 0, 0, W, 64, BRICK);
  // Bricks: rows of three, the joints staggered.
  for (let row = 5, n = 0; row < 63; row += 3, n++) {
    fill(layer, 0, row, W, 1, MORTAR);
    for (let x = (n % 2) * 3; x < W; x += 6) fill(layer, x, row + 1, 1, 2, MORTAR);
    for (let x = 2 + (n % 3) * 7; x < W; x += 19) fill(layer, x, row + 1, 3, 2, BRICK_DARK);
  }
  fill(layer, 0, 0, W, 4, BEAM);
  fill(layer, 0, 62, W, 2, BEAM);
  fill(layer, 0, 64, W, H - 64, FLOOR);
  for (let row = 64, n = 0; row < H; row += 4, n++) {
    fill(layer, 0, row, W, 1, FLOOR_DARK);
    for (let x = (n % 2) * 11; x < W; x += 22) fill(layer, x, row + 1, 1, 3, FLOOR_DARK);
    for (let x = 6 + (n % 3) * 4; x < W; x += 13) fill(layer, x, row + 2, 2, 1, FLOOR_LIGHT);
  }
}

function doorAndWindow(layer) {
  const { left, right, top } = POST_DOOR;
  fill(layer, left - 1, top - 1, right - left + 3, 66 - top + 2, OUTLINE_COLOR);
  fill(layer, left, top, right - left + 1, 66 - top + 1, DOOR);
  fill(layer, left + 2, top + 2, right - left - 3, 14, GLASS);
  fill(layer, left + 2, top + 8, right - left - 3, 1, DOOR_DARK);
  fill(layer, left + 2, top + 19, right - left - 3, 18, DOOR_DARK);
  fill(layer, right - 2, top + 22, 1, 3, PAINT);
  // A window right of the door: sky and a tree outside.
  fill(layer, 18, 21, 15, 19, OUTLINE_COLOR);
  fill(layer, 19, 22, 13, 17, SKY);
  fill(layer, 22, 28, 7, 6, LEAVES);
  fill(layer, 25, 34, 1, 5, BOARD);
  fill(layer, 25, 22, 1, 17, OUTLINE_COLOR);
  fill(layer, 19, 30, 13, 1, OUTLINE_COLOR);
}

function sign(layer) {
  const { left, right, top, bottom, text } = POST_SIGN;
  fill(layer, left - 1, top - 1, right - left + 3, bottom - top + 3, OUTLINE_COLOR);
  fill(layer, left, top, right - left + 1, bottom - top + 1, BOARD);
  drawText(layer, left + 4, top + 2, text, () => PAINT);
}

// A bike side on, its wheels' middles `x - 5` and `x + 5` on `row`.
function bike(layer, x, row, frame) {
  for (const cx of [x - 5, x + 5]) {
    fill(layer, cx - 2, row - 3, 5, 1, TIRE);
    fill(layer, cx - 2, row + 3, 5, 1, TIRE);
    fill(layer, cx - 3, row - 2, 1, 5, TIRE);
    fill(layer, cx + 3, row - 2, 1, 5, TIRE);
    fill(layer, cx, row, 1, 1, METAL);
  }
  fill(layer, x - 5, row - 1, 10, 1, frame);
  fill(layer, x - 2, row - 4, 1, 4, frame);
  fill(layer, x - 3, row - 5, 3, 1, TIRE);
  fill(layer, x + 3, row - 5, 1, 5, frame);
  fill(layer, x + 2, row - 6, 3, 1, TIRE);
}

function rackAndBoard(layer) {
  fill(layer, 36, 22, 26, 1, RACK);
  for (const x of [41, 55]) fill(layer, x, 22, 1, 3, RACK);
  bike(layer, 42, 30, RED_FRAME);
  bike(layer, 56, 30, BLUE_FRAME);
  // The dispatch board: a route map and pinned notes.
  fill(layer, 63, 21, 17, 21, OUTLINE_COLOR);
  fill(layer, 64, 22, 15, 19, CORK);
  fill(layer, 65, 23, 8, 7, NOTE);
  fill(layer, 66, 26, 6, 1, ROUTE);
  fill(layer, 68, 24, 1, 5, ROUTE_BLUE);
  fill(layer, 70, 27, 1, 1, PIN);
  for (const [x, row, color] of [[74, 23, NOTE_YELLOW], [74, 30, NOTE], [66, 33, NOTE_YELLOW], [71, 34, NOTE]]) {
    fill(layer, x, row, 4, 4, color);
    fill(layer, x + 1, row, 1, 1, PIN);
  }
}

function shelfAndBed(layer) {
  // The coffee shelf: the pot and two mugs.
  fill(layer, 40, 45, 20, 1, SHELF);
  fill(layer, 43, 38, 5, 7, POT);
  fill(layer, 44, 41, 3, 3, COFFEE);
  fill(layer, 48, 40, 1, 2, POT);
  fill(layer, 51, 42, 3, 3, MUG);
  fill(layer, 55, 42, 3, 3, BLUE_FRAME);
  // The dog's bed on the floor.
  const { x, row } = POST_DOG_BED;
  fill(layer, x - 6, row - 2, 13, 4, OUTLINE_COLOR);
  fill(layer, x - 5, row - 1, 11, 2, BED);
  fill(layer, x - 4, row - 1, 9, 1, CUSHION);
}

// A cardboard box, `w` x `h`, its top-left at (x, row), taped across.
function box(layer, x, row, w, h) {
  fill(layer, x - 1, row - 1, w + 2, h + 2, OUTLINE_COLOR);
  fill(layer, x, row, w, h, BOX);
  fill(layer, x, row + h - 1, w, 1, BOX_DARK);
  fill(layer, x + Math.floor(w / 2), row, 1, h, TAPE);
}

function parcels(layer) {
  const x = POST_PILE_X;
  box(layer, x - 6, 59, 7, 6);
  box(layer, x + 2, 60, 6, 5);
  box(layer, x - 3, 53, 6, 5);
  // Cubbies of parcels on the wall behind the counter.
  for (const row of [22, 32, 42]) {
    fill(layer, C.left + 2, row + 8, C.right - C.left - 2, 1, SHELF);
    for (let i = 0, bx = C.left + 3; bx < C.right - 5; i++, bx += 7) box(layer, bx, row + 3 + (i % 2), 5, 5 - (i % 2));
  }
}

// What stands in front of whoever is behind the counter: the counter, the
// scale (a parcel on it) and the stamp on its ink pad.
function counterFront(layer) {
  fill(layer, C.left - 1, C.top - 1, C.right - C.left + 2, 1, OUTLINE_COLOR);
  fill(layer, C.left, C.top, C.right - C.left + 1, 2, COUNTER_TOP);
  fill(layer, C.left, C.top, C.right - C.left + 1, 1, COUNTER_TOP_LIGHT);
  fill(layer, C.left, C.top + 2, C.right - C.left + 1, C.bottom - C.top - 1, COUNTER);
  for (let x = C.left + 4; x < C.right; x += 8) fill(layer, x, C.top + 4, 1, C.bottom - C.top - 6, COUNTER_DARK);
  fill(layer, C.left - 1, C.top, 1, C.bottom - C.top + 1, OUTLINE_COLOR);
  fill(layer, POST_SCALE_X - 3, C.top - 1, 7, 1, METAL);
  fill(layer, POST_SCALE_X - 1, C.top - 2, 3, 1, METAL);
  box(layer, POST_SCALE_X - 2, C.top - 6, 5, 4);
  fill(layer, POST_STAMP_X - 2, C.top - 1, 5, 1, INK);
  fill(layer, POST_STAMP_X, C.top - 4, 1, 3, PIN);
  fill(layer, POST_STAMP_X - 1, C.top - 5, 3, 1, PIN);
}

let roomLayer = null;
let frontLayer = null;
let bikeLayer = null;

function paint(...painters) {
  const layer = createLayer(W, H);
  for (const paintIt of painters) paintIt(layer);
  return layer;
}

// The whole hub (the code-drawn picture), without the cargo bike.
export function drawPost(ctx, layout) {
  roomLayer ??= paint(room, doorAndWindow, sign, rackAndBoard, shelfAndBed, parcels, counterFront);
  drawLayer(ctx, roomLayer, 0, layout.height, layout.scale);
}

// The counter's front again, over whoever stands behind it. Not with the
// post sprite (a picture has no separate layers).
export function drawPostCounterFront(ctx, layout) {
  if (getSprite('post')) return;
  frontLayer ??= paint(counterFront);
  drawLayer(ctx, frontLayer, 0, layout.height, layout.scale);
}

// The cargo bike parked by the door (unless it's out on a delivery run):
// a bike with a big box on the front, outlined.
export function drawCargoBike(ctx, layout) {
  if (!bikeLayer) {
    bikeLayer = createLayer(20, 14);
    bike(bikeLayer, 9, 9, GREEN_FRAME);
    fill(bikeLayer, 13, 1, 6, 5, BOX_DARK);
    fill(bikeLayer, 14, 2, 4, 3, BOX);
    fill(bikeLayer, 16, 2, 1, 3, TAPE);
    outline(bikeLayer, OUTLINE_COLOR);
  }
  const { x, row } = POST_CARGO_BIKE;
  const { scale } = layout;
  drawLayer(ctx, bikeLayer, (x - 9) * scale, layout.height - (POST_ART.height - row - 4) * scale, scale);
}
