// office.js — Draws Paperleaf Co., a cozy small-company office, in code:
// striped wallpaper over wood panelling, a carpet, the door, a window on
// the town, the break corner (a vending machine, the printer on its
// cabinet), the water cooler, the "PAPERLEAF" sign over a whiteboard, and
// three desks with chairs and glowing monitors. Gerald the plant is drawn
// on its own (ui/officeLifeArt.js; he perks up). Positions come from
// data/office.js (the picture's pixels); the office sprite replaces the
// whole picture if there is one.

import {
  OFFICE_ART, OFFICE_DOOR, OFFICE_WINDOW, OFFICE_VENDING, OFFICE_PRINTER, OFFICE_COOLER_X, OFFICE_WHITEBOARD,
  OFFICE_SIGN, OFFICE_DESKS,
} from '../data/office.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, drawLayer } from './pixel.js';
import { drawText } from './pixelFont.js';

// Pure art: the office's colors.
const WALL = '#f1e4c8';
const WALL_STRIPE = '#e8d7b5';
const PANEL = '#a8794a';
const PANEL_DARK = '#8c6a4f';
const PANEL_TOP = '#c99b62';
const CARPET = '#7a8a9a';
const CARPET_DARK = '#6a7888';
const CARPET_LIGHT = '#8a9aaa';
const DOOR = '#8c6a4f';
const DOOR_DARK = '#6b4f3a';
const GLASS = '#cfe3e6';
const KNOB = '#f6d58a';
const SKY = '#bfe0ef';
const TOWER = '#9aa3ad';
const TOWER_DARK = '#7d8590';
const LIT = '#f6d58a';
const FRAME = '#f4efe6';
const VENDING = '#d9534f';
const VENDING_DARK = '#b5443f';
const DRINKS = ['#3b7dd8', '#f2d94e', '#2f9e5b', '#f4efe6', '#e07a5f', '#5a2e1a'];
const SLOT = '#3d3a4b';
const CABINET = '#9aa3ad';
const CABINET_DARK = '#7d8590';
const PRINTER = '#d8dde3';
const PAPER = '#ffffff';
const JUG = '#8fc3e8';
const JUG_DARK = '#6aa6d6';
const COOLER = '#eef0f2';
const BOARD = '#ffffff';
const MARKER_RED = '#e2403a';
const MARKER_BLUE = '#3b7dd8';
const MARKER_GREEN = '#2f9e5b';
const STICKY = '#f6d58a';
const SIGN = '#2f5f45';
const SIGN_TEXT = '#f4efe6';
const DESK = '#c99b62';
const DESK_DARK = '#a8794a';
const MONITOR = '#3a3a44';
const SCREEN = '#7fc4e8';
const SCREEN_TEXT = '#e8f4f8';
const KEYS = '#d8dde3';
const CHAIR = '#3a3a44';
const SEAT = '#5b7fb0';
const MUG = '#e07a5f';

const { width: W, height: H } = OFFICE_ART;
const PANEL_ROW = 50;
const FLOOR = 64;

function room(layer) {
  fill(layer, 0, 0, W, FLOOR, WALL);
  for (let x = 2; x < W; x += 6) fill(layer, x, 0, 2, PANEL_ROW, WALL_STRIPE);
  fill(layer, 0, PANEL_ROW, W, FLOOR - PANEL_ROW, PANEL);
  fill(layer, 0, PANEL_ROW, W, 1, PANEL_TOP);
  for (let x = 4; x < W; x += 10) fill(layer, x, PANEL_ROW + 3, 1, FLOOR - PANEL_ROW - 5, PANEL_DARK);
  fill(layer, 0, FLOOR, W, H - FLOOR, CARPET);
  fill(layer, 0, FLOOR, W, 1, CARPET_DARK);
  for (let row = FLOOR + 3, n = 0; row < H; row += 3, n++) {
    for (let x = (n % 2) * 4; x < W; x += 8) fill(layer, x, row, 2, 1, (n % 3) ? CARPET_LIGHT : CARPET_DARK);
  }
}

function doorAndWindow(layer) {
  const { left, right, top } = OFFICE_DOOR;
  fill(layer, left - 1, top - 1, right - left + 3, FLOOR + 2 - top + 1, OUTLINE_COLOR);
  fill(layer, left, top, right - left + 1, FLOOR + 2 - top, DOOR);
  fill(layer, left + 2, top + 3, right - left - 3, 10, GLASS);
  fill(layer, left + 2, top + 16, right - left - 3, 1, DOOR_DARK);
  fill(layer, left + 2, top + 26, right - left - 3, 1, DOOR_DARK);
  fill(layer, right - 2, top + 20, 1, 2, KNOB);
  // The window: the town's towers, a few windows lit.
  const w = OFFICE_WINDOW;
  fill(layer, w.left - 1, w.top - 1, w.right - w.left + 3, w.bottom - w.top + 3, OUTLINE_COLOR);
  fill(layer, w.left, w.top, w.right - w.left + 1, w.bottom - w.top + 1, SKY);
  for (const [x, top, width] of [[w.left + 1, w.top + 8, 5], [w.left + 7, w.top + 4, 6], [w.left + 14, w.top + 10, 7]]) {
    fill(layer, x, top, width, w.bottom - top + 1, x === w.left + 7 ? TOWER_DARK : TOWER);
    for (let row = top + 2; row < w.bottom - 1; row += 3) {
      for (let c = x + 1; c < x + width - 1; c += 2) if ((row + c) % 4) fill(layer, c, row, 1, 1, LIT);
    }
  }
  fill(layer, w.left, Math.floor((w.top + w.bottom) / 2), w.right - w.left + 1, 1, FRAME);
  fill(layer, Math.floor((w.left + w.right) / 2), w.top, 1, w.bottom - w.top + 1, FRAME);
}

function breakCorner(layer) {
  const v = OFFICE_VENDING;
  fill(layer, v.left - 1, v.top - 1, v.right - v.left + 3, v.bottom - v.top + 2, OUTLINE_COLOR);
  fill(layer, v.left, v.top, v.right - v.left + 1, v.bottom - v.top, VENDING);
  fill(layer, v.left + 1, v.top + 2, 6, 16, GLASS);
  DRINKS.forEach((color, i) => fill(layer, v.left + 2 + (i % 2) * 3, v.top + 3 + Math.floor(i / 2) * 5, 2, 3, color));
  fill(layer, v.left + 8, v.top + 4, 2, 6, VENDING_DARK);
  fill(layer, v.left + 8, v.top + 12, 2, 1, SLOT);
  fill(layer, v.left + 2, v.bottom - 6, 6, 3, SLOT);
  const p = OFFICE_PRINTER;
  fill(layer, p.left - 1, p.top - 1, p.right - p.left + 3, p.bottom - p.top + 2, OUTLINE_COLOR);
  fill(layer, p.left, p.top + 5, p.right - p.left + 1, p.bottom - p.top - 5, CABINET);
  fill(layer, p.left, p.top + 9, p.right - p.left + 1, 1, CABINET_DARK);
  fill(layer, p.left + 4, p.top + 7, 3, 1, CABINET_DARK);
  fill(layer, p.left + 4, p.top + 11, 3, 1, CABINET_DARK);
  fill(layer, p.left + 1, p.top, p.right - p.left - 1, 5, PRINTER);
  fill(layer, p.left + 2, p.top - 1, p.right - p.left - 3, 1, PAPER);
  fill(layer, p.left + 2, p.top + 3, p.right - p.left - 3, 1, SLOT);
  // The water cooler.
  const x = OFFICE_COOLER_X;
  fill(layer, x - 3, 45, 7, 22, OUTLINE_COLOR);
  fill(layer, x - 2, 46, 5, 6, JUG);
  fill(layer, x - 2, 49, 5, 1, JUG_DARK);
  fill(layer, x - 2, 52, 5, 14, COOLER);
  fill(layer, x - 1, 55, 1, 1, MARKER_BLUE);
  fill(layer, x + 1, 55, 1, 1, MARKER_RED);
}

function boardAndSign(layer) {
  const b = OFFICE_WHITEBOARD;
  fill(layer, b.left - 1, b.top - 1, b.right - b.left + 3, b.bottom - b.top + 3, OUTLINE_COLOR);
  fill(layer, b.left, b.top, b.right - b.left + 1, b.bottom - b.top + 1, BOARD);
  // A rising chart, a list and two sticky notes.
  for (const [dx, h] of [[2, 3], [5, 5], [8, 4], [11, 8]]) fill(layer, b.left + dx, b.bottom - 2 - h, 2, h, MARKER_BLUE);
  fill(layer, b.left + 2, b.bottom - 1, 12, 1, MARKER_GREEN);
  for (let row = b.top + 3; row < b.top + 12; row += 3) fill(layer, b.left + 16, row, 6, 1, MARKER_RED);
  fill(layer, b.right - 4, b.top + 2, 3, 3, STICKY);
  fill(layer, b.right - 4, b.top + 7, 3, 3, STICKY);
  const s = OFFICE_SIGN;
  fill(layer, s.left - 1, s.top - 1, s.right - s.left + 3, s.bottom - s.top + 3, OUTLINE_COLOR);
  fill(layer, s.left, s.top, s.right - s.left + 1, s.bottom - s.top + 1, SIGN);
  drawText(layer, s.left + 2, s.top + 1, s.text, () => SIGN_TEXT);
}

// A desk with its chair: the chair's back on the left, the desk's top and
// legs, a keyboard and a mug, and the monitor at its right end.
function desk(layer, d, i) {
  fill(layer, d.seatX - 4, d.seatRow - 8, 2, 9, CHAIR);
  fill(layer, d.seatX - 3, d.seatRow, 6, 1, SEAT);
  fill(layer, d.seatX - 3, d.seatRow - 1, 6, 1, CHAIR);
  fill(layer, d.seatX, d.seatRow + 1, 1, FLOOR - d.seatRow, CHAIR);
  fill(layer, d.seatX - 2, FLOOR + 1, 5, 1, CHAIR);
  fill(layer, d.left - 1, d.top - 1, d.right - d.left + 3, 3, OUTLINE_COLOR);
  fill(layer, d.left, d.top, d.right - d.left + 1, 1, DESK);
  fill(layer, d.left + 1, d.top + 1, 1, FLOOR + 2 - d.top - 1, DESK_DARK);
  fill(layer, d.right - 1, d.top + 1, 1, FLOOR + 2 - d.top - 1, DESK_DARK);
  fill(layer, d.left + 1, d.top - 1, 4, 1, KEYS);
  if (i !== 1) fill(layer, d.left + 6, d.top - 2, 2, 2, MUG);
  const mx = d.right - 4;
  fill(layer, mx - 1, d.top - 9, 6, 7, OUTLINE_COLOR);
  fill(layer, mx, d.top - 8, 4, 5, SCREEN);
  fill(layer, mx, d.top - 7, 3, 1, SCREEN_TEXT);
  fill(layer, mx, d.top - 5, 2, 1, SCREEN_TEXT);
  fill(layer, mx + 1, d.top - 2, 2, 1, MONITOR);
}

let officeLayer = null;

// The whole office (the code-drawn picture), without Gerald.
export function drawOffice(ctx, layout) {
  if (!officeLayer) {
    officeLayer = createLayer(W, H);
    for (const paint of [room, doorAndWindow, breakCorner, boardAndSign]) paint(officeLayer);
    OFFICE_DESKS.forEach((d, i) => desk(officeLayer, d, i));
  }
  drawLayer(ctx, officeLayer, 0, layout.height, layout.scale);
}
