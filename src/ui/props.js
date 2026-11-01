// props.js — Draws the outdoor props (the Fortune Tree's tree, the
// parents' house and the character's own house in My Yard) in code, as outlined low-res pixel art scaled onto the
// scenery; ui/scene.js uses these when there's no sprite for a prop. Also
// the shared prop painter and the house colors, which Home's room
// (ui/room.js) matches. Sizes and positions come from the layout
// (computeLayout() in scene.js, from data/layout.js).

import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';

// The house's colors, also used inside it (ui/room.js).
export const HOUSE_COLORS = {
  roof: '#c8645c',
  roofDark: '#a24f49',
  chimney: '#9d8f9e',
  wall: '#f6e7c8',
  wallShade: '#e3cfa8',
  door: '#9a6a45',
  knob: '#f2cc8f',
  glass: '#bfe3f0',
  glassShine: '#ffffff',
};

const TRUNK = '#8b5a3c';
const TRUNK_DARK = '#6e4630';
const LEAF = '#5fa55a';
const LEAF_DARK = '#4b8a4a';
const LEAF_LIGHT = '#7cc46d';
const FRUIT = '#e07a5f';

export function drawTree(ctx, layout) {
  drawProp(ctx, layout, 'tree', paintTree);
}

export function drawParentsHouse(ctx, layout) {
  drawProp(ctx, layout, 'parents.house', paintHouse);
}

// The character's own house (the top housing tier) looks like the
// parents' house for now.
export function drawHouse(ctx, layout) {
  drawProp(ctx, layout, 'yard.house', paintHouse);
}

// Paints prop `id` on its own layer, leaving a 1px margin for the
// outline, and places it so the art's left edge is at prop.x and bottom
// at prop.baseY. `paint(px, width, height)` paints with
// px(col, row, w, h, color) in the prop's own pixels.
export function drawProp(ctx, layout, id, paint) {
  const prop = layout.props[id];
  const layer = createLayer(prop.width + 2, prop.height + 2);
  const px = (col, row, w, h, color) => fill(layer, col + 1, row + 1, w, h, color);
  paint(px, prop.width, prop.height);
  outline(layer, OUTLINE_COLOR);
  drawLayer(ctx, layer, prop.x - layout.scale, prop.baseY + layout.scale, layout.scale);
}

function paintHouse(px, w, h) {
  const c = HOUSE_COLORS;
  const mid = Math.floor(w / 2);
  const roofHeight = mid - 1;

  // Chimney first, so the roof overlaps its base.
  px(w - 5, 1, 2, roofHeight - 2, c.chimney);
  for (let row = 0; row < roofHeight; row++) {
    const left = Math.max(0, mid - 1 - row);
    const right = Math.min(w - 1, mid + row);
    px(left, row, right - left + 1, 1, c.roof);
  }
  px(0, roofHeight - 1, w, 1, c.roofDark);

  px(1, roofHeight, w - 2, h - roofHeight, c.wall);
  px(1, roofHeight, w - 2, 1, c.wallShade);

  const doorHeight = Math.round((h - roofHeight) * 0.6);
  px(mid - 2, h - doorHeight, 4, doorHeight, c.door);
  px(mid, h - Math.ceil(doorHeight / 2), 1, 1, c.knob);

  for (const col of [3, w - 6]) {
    px(col, roofHeight + 2, 3, 3, c.glass);
    px(col, roofHeight + 2, 1, 1, c.glassShine);
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
