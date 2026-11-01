// props.js — Draws the scene's prop (a tree) in code, as
// outlined low-res pixel art scaled onto the scenery; ui/scene.js uses
// these when there's no sprite for a prop. Sizes and positions come from
// the layout (computeLayout() in scene.js, from data/layout.js).

import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';

const TRUNK = '#8b5a3c';
const TRUNK_DARK = '#6e4630';
const LEAF = '#5fa55a';
const LEAF_DARK = '#4b8a4a';
const LEAF_LIGHT = '#7cc46d';
const FRUIT = '#e07a5f';

export function drawTree(ctx, layout) {
  drawProp(ctx, layout.props.tree, paintTree, layout.scale);
}

// Paints a prop on its own layer, leaving a 1px margin for the outline,
// and places it so the art's left edge is at prop.x and bottom at prop.baseY.
function drawProp(ctx, prop, paint, scale) {
  const layer = createLayer(prop.width + 2, prop.height + 2);
  const px = (col, row, w, h, color) => fill(layer, col + 1, row + 1, w, h, color);
  paint(px, prop.width, prop.height);
  outline(layer, OUTLINE_COLOR);
  drawLayer(ctx, layer, prop.x - scale, prop.baseY + scale, scale);
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
