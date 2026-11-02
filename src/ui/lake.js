// lake.js — Draws the Lake: the code-drawn background used when lake.png
// is missing (sky, far shore, water, the dock and the grassy shore), and
// the water shimmer, a few highlight pixels that slowly twinkle and drift,
// drawn every frame over the background. Positions come from data/lake.js
// (in the picture's pixels: x from the left, rows from the top).

import {
  LAKE_ART, LAKE_FEET_FROM_BOTTOM, DOCK, SHIMMER,
} from '../data/lake.js';
import { createLayer, fill, drawLayer } from './pixel.js';

// Pure art for the code-drawn Lake.
const SKY_BANDS = ['#8ecae6', '#a9d3e6', '#c5dbe0', '#e3dcd2', '#fde2c8'];
const FAR_SHORE = '#56739e';
const WATER_LINE = '#98baea';
const WATER = '#3487d8';
const WATER_LIGHT = '#589de3';
const WATER_DEEP = '#2975cd';
const PLANK = '#f4c657';
const PLANK_DARK = '#8e5f4f';
const DOCK_EDGE = '#2d2e56';
const GRASS = '#8cb44c';
const GRASS_DARK = '#609959';
const SOIL = '#5e4e5b';
// Rows of the code-drawn Lake: where the far shore and the water start,
// and the column where the grassy shore starts.
const FAR_SHORE_ROW = 57;
const WATER_ROW = 60;
const SHORE_X = 86;

// The code-drawn Lake on its own layer, the size of lake.png.
function paintLake() {
  const { width, height } = LAKE_ART;
  const layer = createLayer(width, height);
  const band = Math.ceil(FAR_SHORE_ROW / SKY_BANDS.length);
  SKY_BANDS.forEach((color, i) => fill(layer, 0, i * band, width, band, color));
  fill(layer, 0, FAR_SHORE_ROW, width, WATER_ROW - FAR_SHORE_ROW, FAR_SHORE);
  fill(layer, 0, WATER_ROW, width, height - WATER_ROW, WATER);
  fill(layer, 0, WATER_ROW, width, 1, WATER_LINE);
  for (let row = WATER_ROW + 3; row < height; row += 4) fill(layer, 0, row, width, 1, WATER_LIGHT);
  fill(layer, 0, height - 3, width, 3, WATER_DEEP);

  // The dock: its top (where the feet go) is the feet row.
  const top = height - LAKE_FEET_FROM_BOTTOM;
  const dockWidth = SHORE_X - DOCK.left;
  fill(layer, DOCK.left, top - 1, dockWidth, 1, DOCK_EDGE);
  fill(layer, DOCK.left, top, dockWidth, 1, PLANK);
  fill(layer, DOCK.left, top + 1, dockWidth, 1, DOCK_EDGE);
  fill(layer, DOCK.left, top + 2, dockWidth, 1, PLANK_DARK);
  for (let x = DOCK.left + 2; x < SHORE_X; x += 20) fill(layer, x, top + 3, 1, 4, SOIL);

  // The grassy shore on the right, level with the dock.
  fill(layer, SHORE_X, top - 5, width - SHORE_X, height - top + 5, GRASS);
  fill(layer, SHORE_X, top + 2, width - SHORE_X, height - top - 2, GRASS_DARK);
  return layer;
}

let lakeLayer = null;

// Draws the code-drawn Lake over the whole window, from its bottom-left
// corner (where lake.png goes).
export function drawLake(ctx, layout) {
  lakeLayer ??= paintLake();
  drawLayer(ctx, lakeLayer, 0, layout.height, layout.scale);
}

// Cheap deterministic noise in 0..1, so each sparkle's spots, speeds and
// timing are the same every run.
function noise(a, b) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function between([min, max], t) {
  return min + (max - min) * t;
}

function inBox(box, x, y) {
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
}

// The sparkles showing `seconds` in, in the picture's pixels: [{ x, y,
// width, color }]. Each one twinkles once per cycle (stepping up through
// SHIMMER.colors and back down), drifting sideways, then shows up
// somewhere else. Pixels off the water or on the dock aren't shown.
export function shimmerSparkles(seconds) {
  const { area, avoid, count, colors, cycle, visible, drift } = SHIMMER;
  const sparkles = [];
  for (let i = 0; i < count; i++) {
    const period = between(cycle, noise(i, 1));
    const t = seconds / period + noise(i, 2);
    const round = Math.floor(t);
    const into = t - round;
    if (into >= visible) continue;
    // Up through the colors and back down over the visible part.
    const rise = 1 - Math.abs(2 * (into / visible) - 1);
    const level = Math.min(colors.length - 1, Math.floor(rise * colors.length));
    const seed = round * 4;
    const speed = between(drift, noise(i, seed + 3)) * (noise(i, seed + 4) < 0.5 ? -1 : 1);
    const startX = area.left + noise(i, seed + 5) * (area.right - area.left + 1);
    const x = Math.floor(startX + speed * into * period);
    const y = area.top + Math.floor(noise(i, seed + 6) * (area.bottom - area.top + 1));
    const width = level === colors.length - 1 ? 2 : 1;
    const fits = (col) => inBox(area, col, y) && !avoid.some((box) => inBox(box, col, y));
    if (!fits(x) || !fits(x + width - 1)) continue;
    sparkles.push({ x, y, width, color: colors[level] });
  }
  return sparkles;
}

// Draws the water shimmer `seconds` in, over the Lake's background.
export function drawShimmer(ctx, layout, seconds) {
  const { scale, height } = layout;
  for (const sparkle of shimmerSparkles(seconds)) {
    ctx.fillStyle = sparkle.color;
    ctx.fillRect(sparkle.x * scale, height - (LAKE_ART.height - sparkle.y) * scale, sparkle.width * scale, scale);
  }
}
