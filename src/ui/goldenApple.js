// goldenApple.js — Draws the Fortune Tree's golden apple when one is ready:
// the goldenApple sprite if there's one (data/sprites.js: 4 frames of 8 x 6,
// center, right, center, left, the frame chosen by the wind in
// ui/treeDecor.js), otherwise a small code-drawn apple with a blinking
// glint, shifted a pixel as it swings. Either way it's drawn at the
// tree's scale, centered on APPLE_SPOT (data/fortuneTree.js), or anywhere
// while it falls and is held up (ui/applePick.js). Also where it hangs,
// for the glow and sparkles around it (ui/treeDecorArt.js).

import { APPLE_SPOT, APPLE_GLINT, TREE_PROP } from '../data/fortuneTree.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { APPLE_SWING } from '../data/fortuneTreeDecor.js';
import { getSprite, drawSprite } from './assets.js';
import { propRect } from './scene.js';

const GOLD = '#f2c14e';
const GOLD_DARK = '#d29a2a';
const GLINT = '#fffbe0';
const STEM = '#6e4630';
const LEAF = '#5fa55a';

// The code-drawn apple is painted on an 8x8 layer (with room for the
// outline): a rounded 4x4 body with a stem and leaf. This pixel of it is
// the apple's center.
const APPLE_SIZE = 8;
const APPLE_CENTER = 4;

// Painted once each, with and without the glint.
const appleLayers = {};

function appleLayer(glint) {
  if (appleLayers[glint]) return appleLayers[glint];
  const layer = createLayer(APPLE_SIZE, APPLE_SIZE);
  fill(layer, 3, 2, 2, 1, GOLD);
  fill(layer, 2, 3, 4, 2, GOLD);
  fill(layer, 3, 5, 2, 1, GOLD);
  fill(layer, 5, 4, 1, 1, GOLD_DARK);
  fill(layer, 4, 5, 1, 1, GOLD_DARK);
  fill(layer, 4, 1, 1, 1, STEM);
  fill(layer, 5, 1, 1, 1, LEAF);
  if (glint) fill(layer, 3, 3, 1, 1, GLINT);
  outline(layer, OUTLINE_COLOR);
  appleLayers[glint] = layer;
  return layer;
}

// Where the apple hangs, in canvas pixels: { x, y (its middle), half (half
// its drawn size, the larger side) }, or null if the place has no tree.
export function appleCenter(layout) {
  const tree = propRect(layout, TREE_PROP);
  if (!tree) return null;
  const spot = tree.sprite ? APPLE_SPOT.sprite : APPLE_SPOT.code;
  const sprite = getSprite('goldenApple');
  const half = sprite
    ? (Math.max(sprite.frameWidth, sprite.frameHeight) * (sprite.scale ?? tree.scale)) / 2
    : (APPLE_SIZE / 2) * tree.scale;
  return { x: tree.left + spot.col * tree.scale, y: tree.top + spot.row * tree.scale, half };
}

// Draws the apple on the tree, `seconds` in (for the code-drawn glint),
// swung to `frame` (APPLE_SWING.frames: 0 center, 1 right, 2 center, 3
// left), or with `at` ({ x, y }, canvas pixels) centered there instead
// (falling, or held up once picked). Does nothing if the place has no
// tree.
export function drawGoldenApple(ctx, layout, seconds, frame = 0, at = null) {
  const tree = propRect(layout, TREE_PROP);
  if (!tree) return;
  const { x, y } = at ?? appleCenter(layout);
  const scale = tree.scale;

  const sprite = getSprite('goldenApple');
  if (sprite) {
    const spriteScale = sprite.scale ?? scale;
    const left = x - Math.floor(sprite.frameWidth / 2) * spriteScale;
    const top = y - Math.floor(sprite.frameHeight / 2) * spriteScale;
    drawSprite(ctx, sprite, frame % sprite.frames, left, top + sprite.frameHeight * spriteScale, spriteScale);
    return;
  }
  const glint = seconds % APPLE_GLINT.cycle < APPLE_GLINT.on;
  const shift = APPLE_SWING.codeShift[frame % APPLE_SWING.codeShift.length] ?? 0;
  const left = x + (shift - APPLE_CENTER) * scale;
  const top = y - APPLE_CENTER * scale;
  drawLayer(ctx, appleLayer(glint), left, top + APPLE_SIZE * scale, scale);
}
