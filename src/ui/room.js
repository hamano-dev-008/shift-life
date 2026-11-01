// room.js — Draws Home, the living room inside the house, in code: the
// wallpapered back wall and wooden floor (painted in scene pixels on a
// grid, like the sky and grass), and the window, front door and sofa
// (outlined props). It uses the house's colors (HOUSE_COLORS in
// ui/props.js) so inside matches outside. ui/scene.js uses these when
// there's no sprite for a piece. Sizes and positions come from the layout
// (data/layout.js); the sofa's seat height from data/home.js.

import { SOFA_SEAT } from '../data/home.js';
import { HOUSE_COLORS, drawProp } from './props.js';

const c = HOUSE_COLORS;
const WALL_DOT = '#ecc9b0';
const BASEBOARD = c.door;
const BASEBOARD_TOP = '#b07f55';
const FLOOR = '#b07a4f';
const FLOOR_DARK = '#946240';
const FLOOR_LIGHT = '#c08a5c';
const FLOOR_SHADOW = '#7a5235';
const WOOD_DARK = '#7a5235';
const PANEL = '#a87850';
const FRAME = '#fffaf0';
const SKY = '#8ecae6';
const SKY_LOW = '#b5ddef';
const HORIZON = '#fde2c8';
const HILL = '#7cc46d';
const CLOUD = '#ffffff';
const CUSHION = '#d97a70';
const CUSHION_LIGHT = '#e59a90';

// Cheap deterministic noise so the floor grain looks the same every launch.
function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// The back wall above the floor: striped wallpaper with small dots, and a
// wooden baseboard where it meets the floor. `grid` is in scene pixels;
// the floor starts at row floorTop.
export function drawWall(grid, floorTop) {
  const { ctx, width } = grid;
  ctx.fillStyle = c.wall;
  ctx.fillRect(0, 0, width, floorTop);
  ctx.fillStyle = c.wallShade;
  for (let x = 0; x < width; x += 6) ctx.fillRect(x, 0, 1, floorTop);
  ctx.fillStyle = WALL_DOT;
  for (let y = 3; y < floorTop - 4; y += 6) {
    for (let x = 3; x < width; x += 6) ctx.fillRect(x, y, 1, 1);
  }
  ctx.fillStyle = BASEBOARD;
  ctx.fillRect(0, floorTop - 3, width, 3);
  ctx.fillStyle = BASEBOARD_TOP;
  ctx.fillRect(0, floorTop - 3, width, 1);
}

// The wooden floor: planks three rows deep with staggered joints, a
// little grain, and a shadow line along the wall.
export function drawFloor(grid, floorTop) {
  const { ctx, width, height } = grid;
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, floorTop, width, height - floorTop);
  ctx.fillStyle = FLOOR_DARK;
  for (let y = floorTop + 3; y < height; y += 3) ctx.fillRect(0, y, width, 1);
  for (let band = 0; floorTop + band * 3 < height; band++) {
    const top = floorTop + band * 3;
    for (let x = (band * 11) % 23; x < width; x += 23) ctx.fillRect(x, top, 1, 3);
  }
  ctx.fillStyle = FLOOR_LIGHT;
  for (let y = floorTop + 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (noise(x, y) < 0.05) ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.fillStyle = FLOOR_SHADOW;
  ctx.fillRect(0, floorTop, width, 1);
}

export function drawHomeWindow(ctx, layout) {
  drawProp(ctx, layout, 'home.window', paintWindow);
}

export function drawHomeDoor(ctx, layout) {
  drawProp(ctx, layout, 'home.door', paintDoor);
}

export function drawSofa(ctx, layout) {
  drawProp(ctx, layout, 'home.sofa', paintSofa);
}

// A window with curtains either side and a sill, showing a bit of sky (a
// cloud, the horizon and a strip of hill) through four panes.
function paintWindow(px, w, h) {
  px(0, 0, w, 1, WOOD_DARK);
  // Frame and glass between the curtains.
  const left = 3;
  const right = w - 4;
  px(left, 1, right - left + 1, h - 3, FRAME);
  const glassLeft = left + 1;
  const glassWidth = right - left - 1;
  const glassTop = 2;
  const glassHeight = h - 5;
  px(glassLeft, glassTop, glassWidth, glassHeight, SKY);
  px(glassLeft, glassTop + Math.floor(glassHeight / 2), glassWidth, glassHeight - Math.floor(glassHeight / 2), SKY_LOW);
  px(glassLeft, glassTop + glassHeight - 2, glassWidth, 1, HORIZON);
  px(glassLeft, glassTop + glassHeight - 1, glassWidth, 1, HILL);
  px(glassLeft + 2, glassTop + 2, 4, 1, CLOUD);
  px(glassLeft + 3, glassTop + 1, 2, 1, CLOUD);
  px(glassLeft + glassWidth - 6, glassTop + 5, 3, 1, CLOUD);
  // Panes.
  const mid = Math.floor(w / 2);
  px(mid, 1, 1, h - 3, FRAME);
  px(left, glassTop + Math.floor(glassHeight / 2) - 1, right - left + 1, 1, FRAME);
  // Curtains, gathered with a fold.
  for (const col of [0, w - 3]) {
    px(col, 1, 3, h - 2, c.roof);
    px(col + 1, 1, 1, h - 2, c.roofDark);
  }
  // Sill.
  px(2, h - 2, w - 4, 1, c.door);
  px(2, h - 1, w - 4, 1, WOOD_DARK);
}

// The front door: a frame, two raised panels and a brass knob.
function paintDoor(px, w, h) {
  px(0, 0, w, h, WOOD_DARK);
  px(1, 1, w - 2, h - 1, c.door);
  const panelWidth = w - 6;
  const upper = [3, Math.floor(h * 0.4) - 3];
  const lower = [Math.floor(h * 0.4) + 1, h - 3];
  for (const [top, bottom] of [upper, lower]) {
    px(3, top, panelWidth, bottom - top, WOOD_DARK);
    px(4, top + 1, panelWidth - 1, bottom - top - 1, PANEL);
  }
  px(w - 3, Math.floor(h * 0.55), 1, 2, c.knob);
}

// A two-seat sofa in the roof's red: a backrest with two cushions,
// rounded armrests, seat cushions whose top is SOFA_SEAT rows above the
// base (where the character lies), and short wooden legs.
function paintSofa(px, w, h) {
  const seatTop = h - SOFA_SEAT;
  const mid = Math.floor(w / 2);
  // Backrest.
  px(4, 0, w - 8, 1, c.roof);
  px(3, 1, w - 6, seatTop - 1, c.roof);
  px(mid, 2, 1, seatTop - 2, c.roofDark);
  // Armrests, shaded on the outside.
  for (const col of [0, w - 4]) {
    px(col + 1, 3, 2, 1, c.roof);
    px(col, 4, 4, h - 6, c.roof);
  }
  px(0, 4, 1, h - 6, c.roofDark);
  px(w - 1, 4, 1, h - 6, c.roofDark);
  // Seat cushions.
  px(4, seatTop, w - 8, 3, CUSHION);
  px(4, seatTop, w - 8, 1, CUSHION_LIGHT);
  px(mid, seatTop, 1, 3, c.roofDark);
  // Base and legs.
  px(1, h - 3, w - 2, 2, c.roofDark);
  px(2, h - 1, 1, 1, WOOD_DARK);
  px(w - 3, h - 1, 1, 1, WOOD_DARK);
}
