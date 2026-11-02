// treeDecorArt.js — Draws the Fortune Tree place's moving decoration:
// the falling golden leaves (the fortuneTree.leaf sprite, or code-drawn 3 x 2
// in two flutter frames) with a rare one's glint, and the sparkles around
// a ready golden apple, and the apple's soft golden glow (rings of whole
// tree-sized pixels, pulsing, flashing when it's picked). Also the area
// the leaves fall in, from the tree's
// drawn box. Numbers and colors are in data/fortuneTreeDecor.js; the
// leaves' motion in ui/treeDecor.js; the wishing well in ui/props.js.

import { LEAVES, LEAF_COLORS, APPLE_GLOW } from '../data/fortuneTreeDecor.js';
import { TREE_PROP } from '../data/fortuneTree.js';
import { createLayer, fill, drawLayer } from './pixel.js';
import { getSprite, drawSprite } from './assets.js';
import { propRect } from './scene.js';
import { appleCenter } from './goldenApple.js';
import { leafLook, appleSparkles, appleGlow } from './treeDecor.js';

// Where the leaves fall, in scene pixels: { canopy ({ left, right, top,
// bottom }: LEAVES.canopy of the tree's drawn box), rows (the window's
// height) }, or null without a tree.
export function treeDecorArea(layout) {
  const tree = propRect(layout, TREE_PROP);
  if (!tree) return null;
  const { scale } = layout;
  const { canopy } = LEAVES;
  return {
    canopy: {
      left: (tree.left + tree.width * canopy.left) / scale,
      right: (tree.left + tree.width * canopy.right) / scale,
      top: (tree.top + tree.height * canopy.top) / scale,
      bottom: (tree.top + tree.height * canopy.bottom) / scale,
    },
    rows: layout.height / scale,
  };
}

// The code-drawn leaf's two frames, 3 x 2: tilted one way, then the other.
const LEAF_FRAMES = [
  [[1, 0], [2, 0], [0, 1], [1, 1, 'dark']],
  [[0, 0], [1, 0], [1, 1, 'dark'], [2, 1]],
];
const leafLayers = [];

function leafLayer(frame) {
  if (leafLayers[frame]) return leafLayers[frame];
  const layer = createLayer(3, 2);
  for (const [col, row, shade] of LEAF_FRAMES[frame]) {
    fill(layer, col, row, 1, 1, shade ? LEAF_COLORS.dark : LEAF_COLORS.leaf);
  }
  leafLayers[frame] = layer;
  return layer;
}

// Draws the falling and fading leaves (`decor` from ui/treeDecor.js).
export function drawTreeDecor(ctx, layout, decor) {
  const { scale } = layout;
  const sprite = getSprite('fortuneTree.leaf');
  for (const leaf of decor.leaves) {
    const look = leafLook(leaf);
    const left = look.col * scale;
    ctx.save();
    ctx.globalAlpha = look.opacity;
    if (sprite) {
      const spriteScale = sprite.scale ?? scale;
      drawSprite(ctx, sprite, look.frame % sprite.frames, left, look.row * scale + sprite.frameHeight * spriteScale,
        spriteScale);
    } else {
      drawLayer(ctx, leafLayer(look.frame), left, (look.row + 2) * scale, scale);
    }
    ctx.restore();
    if (look.glint) {
      ctx.fillStyle = LEAF_COLORS.sparkle;
      ctx.fillRect(left + 3 * scale, (look.row - 1) * scale, scale, scale);
    }
  }
}

// Draws the soft golden glow behind the apple, `seconds` in, brighter
// while `flashLeft` seconds of a pick's flash are left: semi-transparent
// rings of whole tree-sized pixels (the tree's scale), outermost first, so
// it's strongest near the apple. Draw it before the apple.
export function drawAppleGlow(ctx, layout, seconds, flashLeft = 0) {
  const apple = appleCenter(layout);
  const tree = propRect(layout, TREE_PROP);
  if (!apple || !tree) return;
  const size = tree.scale;
  ctx.save();
  ctx.fillStyle = APPLE_GLOW.color;
  for (const ring of appleGlow(seconds, flashLeft)) {
    ctx.globalAlpha = ring.alpha;
    for (const [dx, dy] of ring.cells) ctx.fillRect(apple.x + dx * size, apple.y + dy * size, size, size);
  }
  ctx.restore();
}

// Draws the sparkles twinkling around a ready golden apple, `seconds` in.
export function drawAppleSparkles(ctx, layout, seconds) {
  const apple = appleCenter(layout);
  if (!apple) return;
  const { scale } = layout;
  const inner = Math.max(2, Math.ceil(apple.half / scale));
  for (const sparkle of appleSparkles(seconds, inner)) {
    const x = Math.round(apple.x / scale + sparkle.dx) * scale;
    const y = Math.round(apple.y / scale + sparkle.dy) * scale;
    ctx.fillStyle = sparkle.color;
    ctx.fillRect(x, y, scale, scale);
    if (sparkle.size) {
      ctx.fillRect(x - scale, y, 3 * scale, scale);
      ctx.fillRect(x, y - scale, scale, 3 * scale);
    }
  }
}
