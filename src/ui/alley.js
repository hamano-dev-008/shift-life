// alley.js — Draws Mural Alley, a street art alley in town, in code: a
// strip of sky with string lights, a plaster and brick back wall with an
// archway out to the street, the mural half painted (the rest chalked in),
// two easels, a crate of spray cans, the print stall under its striped
// awning, and cobbles splashed with paint. The easels' canvases are drawn
// on their own (drawAlleyCanvas()), filling in as they're painted.
// Positions come from data/alley.js (the picture's pixels); the alley
// sprite replaces the whole picture if there is one.

import {
  ALLEY_ART, ALLEY_MOUTH, ALLEY_MURAL, ALLEY_EASEL, CLASS_EASEL, ALLEY_STALL, EASEL_CANVAS_TOP,
} from '../data/alley.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, drawLayer } from './pixel.js';

// Pure art: the alley's colors.
const SKY = '#bfe0ef';
const WIRE = '#3d3a4b';
const BULBS = ['#f6d58a', '#f4a6a6', '#9fd3a8', '#f6d58a'];
const PLASTER = '#c9b79c';
const PLASTER_DARK = '#b3a084';
const BRICK = '#b5654a';
const MORTAR = '#d9a38a';
const STONE = '#8a8079';
const STONE_DARK = '#6f6660';
const STONE_LIGHT = '#a39991';
const STREET = '#7d8590';
const STREET_LINE = '#e8e2d0';
const FAR_WALL = '#e0c8a8';
const FAR_WINDOW = '#7fa6c9';
const LAMP = '#3a3a44';
const LAMP_LIGHT = '#f6d58a';
const PIPE = '#6b7a85';
const MURAL_SKY = '#7fb8e0';
const MURAL_SUN = '#f2a33a';
const MURAL_SUN_LIGHT = '#f6d58a';
const MURAL_WAVE = '#2f7fb0';
const MURAL_FOAM = '#e8f4f8';
const MURAL_HILL = '#6aa85a';
const MURAL_PINK = '#e07a9f';
const CHALK = '#f4efe6';
const WOOD = '#8c6a4f';
const WOOD_DARK = '#6b4f3a';
const CANVAS = '#fbf6ea';
const CRATE = '#a8794a';
const CANS = ['#e2403a', '#3b7dd8', '#f2d94e', '#2f9e5b'];
const AWNING = '#e07a5f';
const AWNING_LIGHT = '#f4efe6';
const CLOTH = '#5b7fb0';
const CLOTH_DARK = '#4a6a96';
const FRAME = '#5e4130';
const PRINTS = ['#f2a33a', '#7fb8e0', '#e07a9f'];
const SPLATS = ['#e2403a', '#3b7dd8', '#f2d94e', '#e07a9f'];

const { width: W, height: H } = ALLEY_ART;
const WALL_TOP = 15;
const GROUND = 64;

function skyAndWall(layer) {
  fill(layer, 0, 0, W, WALL_TOP, SKY);
  // String lights sagging across the alley.
  for (let x = 0; x < W; x++) {
    const sag = Math.round(2 * Math.sin((Math.PI * (x % 36)) / 36));
    fill(layer, x, 9 + sag, 1, 1, WIRE);
    if (x % 6 === 3) fill(layer, x, 10 + sag, 1, 1, BULBS[(x / 6) % BULBS.length | 0]);
  }
  fill(layer, 0, WALL_TOP, W, GROUND - WALL_TOP, PLASTER);
  fill(layer, 0, WALL_TOP, W, 1, PLASTER_DARK);
  // Patches where the plaster has come away: bricks.
  for (const [x, row, w, h] of [[16, 18, 10, 7], [70, 18, 8, 6], [88, 22, 12, 6], [68, 48, 7, 5]]) {
    fill(layer, x, row, w, h, MORTAR);
    for (let r = row; r < row + h; r += 2) {
      for (let c = x + ((r - row) % 4 ? 2 : 0); c < x + w - 1; c += 4) fill(layer, c, r, 3, 1, BRICK);
    }
  }
  // A drainpipe down the wall.
  fill(layer, 76, WALL_TOP, 2, GROUND - WALL_TOP, PIPE);
  for (let row = WALL_TOP + 6; row < GROUND; row += 12) fill(layer, 75, row, 4, 1, WIRE);
}

// The archway on the left, the street beyond: a far wall with a window,
// the road and a street lamp.
function mouth(layer) {
  const { left, right, top, bottom } = ALLEY_MOUTH;
  fill(layer, left - 1, top - 2, right - left + 3, bottom - top + 3, OUTLINE_COLOR);
  fill(layer, left, top - 1, right - left + 1, 1, OUTLINE_COLOR);
  fill(layer, left, top, right - left + 1, bottom - top + 1, FAR_WALL);
  fill(layer, left + 2, top + 6, 4, 5, FAR_WINDOW);
  fill(layer, left + 2, top + 8, 4, 1, OUTLINE_COLOR);
  fill(layer, left, bottom - 9, right - left + 1, 10, STREET);
  fill(layer, left + 1, bottom - 5, 3, 1, STREET_LINE);
  fill(layer, left + 7, bottom - 5, 3, 1, STREET_LINE);
  fill(layer, right - 3, top + 4, 1, bottom - top - 12, LAMP);
  fill(layer, right - 5, top + 3, 4, 2, LAMP);
  fill(layer, right - 5, top + 5, 4, 1, LAMP_LIGHT);
  // The arch's bricks.
  for (let x = left - 1; x <= right + 1; x += 3) fill(layer, x, top - 3, 2, 1, BRICK);
}

function mural(layer) {
  const { left, right, top, bottom, doneTo } = ALLEY_MURAL;
  const w = doneTo - left;
  const h = bottom - top;
  // The painted part: sky, a big sun, a hill, waves and a pink bird.
  fill(layer, left, top, w, h, MURAL_SKY);
  fill(layer, left + 4, top + 5, 12, 12, MURAL_SUN);
  fill(layer, left + 3, top + 8, 14, 6, MURAL_SUN);
  fill(layer, left + 7, top + 4, 6, 14, MURAL_SUN);
  fill(layer, left + 7, top + 8, 4, 4, MURAL_SUN_LIGHT);
  fill(layer, left, top + 22, w, 8, MURAL_HILL);
  fill(layer, left + 8, top + 20, 10, 2, MURAL_HILL);
  fill(layer, left, top + 30, w, h - 30, MURAL_WAVE);
  for (let x = left; x < doneTo; x += 6) {
    fill(layer, x, top + 30, 3, 1, MURAL_FOAM);
    fill(layer, x + 3, top + 35, 3, 1, MURAL_FOAM);
  }
  fill(layer, left + 13, top + 26 - 13, 3, 1, MURAL_PINK);
  fill(layer, left + 16, top + 12, 3, 1, MURAL_PINK);
  fill(layer, left + 15, top + 13, 1, 1, MURAL_PINK);
  // The rest chalked in: the waves and the hill go on in outline.
  fill(layer, doneTo, top + 22, right - doneTo, 1, CHALK);
  fill(layer, doneTo, top + 30, right - doneTo, 1, CHALK);
  for (let x = doneTo + 2; x < right; x += 6) fill(layer, x, top + 33, 3, 1, CHALK);
  fill(layer, right - 8, top + 6, 6, 1, CHALK);
  fill(layer, right - 8, top + 12, 6, 1, CHALK);
  fill(layer, right - 9, top + 7, 1, 5, CHALK);
  fill(layer, right - 2, top + 7, 1, 5, CHALK);
  fill(layer, doneTo, top, 1, h, CHALK);
}

// An easel: a wooden A-frame, the canvas (blank here; drawAlleyCanvas()
// paints it) on its ledge.
function easel(layer, x) {
  const top = EASEL_CANVAS_TOP;
  fill(layer, x - 3, top, 1, GROUND + 2 - top, WOOD_DARK);
  fill(layer, x + 3, top, 1, GROUND + 2 - top, WOOD_DARK);
  fill(layer, x, top - 5, 1, GROUND - top + 5, WOOD);
  fill(layer, x - 4, top + 9, 9, 1, WOOD);
  fill(layer, x - 4, top - 1, 9, 10, OUTLINE_COLOR);
  fill(layer, x - 3, top, 7, 8, CANVAS);
}

function crate(layer) {
  fill(layer, 33, 58, 10, 8, OUTLINE_COLOR);
  fill(layer, 34, 59, 8, 6, CRATE);
  fill(layer, 34, 61, 8, 1, WOOD_DARK);
  CANS.forEach((color, i) => {
    fill(layer, 35 + i * 2, 56, 1, 3, color);
    fill(layer, 35 + i * 2, 55, 1, 1, OUTLINE_COLOR);
  });
}

function stall(layer) {
  const { left, right, top, bottom } = ALLEY_STALL;
  // Posts, the awning, the line of prints and the table.
  fill(layer, left + 1, top + 2, 1, bottom - top - 1, WOOD_DARK);
  fill(layer, right - 1, top + 2, 1, bottom - top - 1, WOOD_DARK);
  fill(layer, left - 1, top, right - left + 3, 7, OUTLINE_COLOR);
  for (let x = left; x <= right; x++) fill(layer, x, top + 1, 1, 4, (x - left) % 6 < 3 ? AWNING : AWNING_LIGHT);
  for (let x = left; x <= right; x += 3) fill(layer, x, top + 5, 2, 1, (x - left) % 6 < 3 ? AWNING : AWNING_LIGHT);
  fill(layer, left + 2, top + 9, right - left - 3, 1, WIRE);
  PRINTS.forEach((color, i) => {
    const x = left + 4 + i * 7;
    fill(layer, x, top + 10, 5, 6, FRAME);
    fill(layer, x + 1, top + 11, 3, 4, color);
  });
  const tableTop = bottom - 12;
  fill(layer, left, tableTop - 1, right - left + 1, bottom - tableTop + 2, OUTLINE_COLOR);
  fill(layer, left + 1, tableTop, right - left - 1, 2, WOOD);
  fill(layer, left + 1, tableTop + 2, right - left - 1, bottom - tableTop - 2, CLOTH);
  for (let x = left + 3; x < right - 1; x += 4) fill(layer, x, tableTop + 2, 1, bottom - tableTop - 2, CLOTH_DARK);
  // Prints stacked on the table and a pot of brushes.
  fill(layer, left + 3, tableTop - 2, 6, 2, CANVAS);
  fill(layer, left + 4, tableTop - 3, 6, 1, PRINTS[1]);
  fill(layer, right - 8, tableTop - 4, 3, 4, CANS[1]);
  fill(layer, right - 8, tableTop - 6, 1, 2, WOOD);
  fill(layer, right - 6, tableTop - 7, 1, 3, WOOD);
}

function ground(layer) {
  fill(layer, 0, GROUND, W, H - GROUND, STONE);
  fill(layer, 0, GROUND, W, 1, STONE_DARK);
  for (let row = GROUND + 2, n = 0; row < H; row += 3, n++) {
    for (let x = (n % 2) * 3; x < W; x += 6) {
      fill(layer, x, row, 4, 1, STONE_LIGHT);
      fill(layer, x + 4, row - 1, 1, 2, STONE_DARK);
    }
  }
  // Splashes of paint on the cobbles.
  for (const [x, row, color] of [[46, 67, SPLATS[0]], [58, 66, SPLATS[1]], [24, 70, SPLATS[2]], [66, 74, SPLATS[3]],
    [38, 76, SPLATS[1]]]) {
    fill(layer, x, row, 2, 1, color);
    fill(layer, x + 1, row + 1, 1, 1, color);
  }
}

let alleyLayer = null;

// The whole alley (the code-drawn picture), the easels' canvases blank.
export function drawAlley(ctx, layout) {
  if (!alleyLayer) {
    alleyLayer = createLayer(W, H);
    for (const paint of [skyAndWall, mouth, mural, ground, crate, stall]) paint(alleyLayer);
    easel(alleyLayer, ALLEY_EASEL.x);
    easel(alleyLayer, CLASS_EASEL.x);
  }
  drawLayer(ctx, alleyLayer, 0, layout.height, layout.scale);
}
