// props.js — Draws the scene's props (a house and a tree) as outlined
// low-res pixel art scaled onto the backdrop. Sizes and positions come
// from PROPS in data/layout.js.

import { PROPS, SPRITE_SCALE } from '../data/layout.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';

const ROOF = '#c8645c';
const ROOF_DARK = '#a24f49';
const CHIMNEY = '#9d8f9e';
const WALL = '#f6e7c8';
const WALL_SHADE = '#e3cfa8';
const DOOR = '#9a6a45';
const KNOB = '#f2cc8f';
const GLASS = '#bfe3f0';
const GLASS_SHINE = '#ffffff';

const TRUNK = '#8b5a3c';
const TRUNK_DARK = '#6e4630';
const LEAF = '#5fa55a';
const LEAF_DARK = '#4b8a4a';
const LEAF_LIGHT = '#7cc46d';
const FRUIT = '#e07a5f';

export function drawProps(ctx) {
  drawProp(ctx, PROPS.house, paintHouse);
  drawProp(ctx, PROPS.tree, paintTree);
}

// Paints a prop on its own layer, leaving a 1px margin for the outline,
// and places it so the art's left edge is at prop.x and bottom at prop.baseY.
function drawProp(ctx, prop, paint) {
  const layer = createLayer(prop.width + 2, prop.height + 2);
  const px = (col, row, w, h, color) => fill(layer, col + 1, row + 1, w, h, color);
  paint(px, prop.width, prop.height);
  outline(layer, OUTLINE_COLOR);
  drawLayer(ctx, layer, prop.x - SPRITE_SCALE, prop.baseY + SPRITE_SCALE, SPRITE_SCALE);
}

function paintHouse(px, w, h) {
  const mid = Math.floor(w / 2);
  const roofHeight = mid - 1;

  // Chimney first, so the roof overlaps its base.
  px(w - 5, 1, 2, roofHeight - 2, CHIMNEY);
  for (let row = 0; row < roofHeight; row++) {
    const left = Math.max(0, mid - 1 - row);
    const right = Math.min(w - 1, mid + row);
    px(left, row, right - left + 1, 1, ROOF);
  }
  px(0, roofHeight - 1, w, 1, ROOF_DARK);

  px(1, roofHeight, w - 2, h - roofHeight, WALL);
  px(1, roofHeight, w - 2, 1, WALL_SHADE);

  const doorHeight = Math.round((h - roofHeight) * 0.6);
  px(mid - 2, h - doorHeight, 4, doorHeight, DOOR);
  px(mid, h - Math.ceil(doorHeight / 2), 1, 1, KNOB);

  for (const col of [3, w - 6]) {
    px(col, roofHeight + 2, 3, 3, GLASS);
    px(col, roofHeight + 2, 1, 1, GLASS_SHINE);
  }
}

function paintTree(px, w, h) {
  const mid = w / 2;
  const canopyHeight = Math.round(h * 0.6);
  const trunkTop = canopyHeight - 3;

  px(mid - 2, trunkTop, 4, h - trunkTop, TRUNK);
  px(mid - 2, trunkTop, 1, h - trunkTop, TRUNK_DARK);
  px(mid - 3, h - 1, 1, 1, TRUNK);
  px(mid + 2, h - 1, 1, 1, TRUNK);

  // Filled pixel circle centered on (cx, cy).
  const blob = (cx, cy, r, color) => {
    for (let y = Math.floor(cy - r); y < cy + r; y++) {
      for (let x = Math.floor(cx - r); x < cx + r; x++) {
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) px(x, y, 1, 1, color);
      }
    }
  };
  const lobes = [
    [mid, canopyHeight * 0.45, mid - 0.5],
    [mid - 3.5, canopyHeight - 5.5, 4.5],
    [mid + 3.5, canopyHeight - 5.5, 4.5],
  ];
  // A dark copy shifted down 1px leaves a shaded rim along the bottom.
  for (const [cx, cy, r] of lobes) blob(cx, cy + 1, r, LEAF_DARK);
  for (const [cx, cy, r] of lobes) blob(cx, cy, r, LEAF);
  blob(mid - 2, 5, 3, LEAF_LIGHT);

  px(4, 9, 1, 1, FRUIT);
  px(11, 6, 1, 1, FRUIT);
  px(9, 12, 1, 1, FRUIT);
}
