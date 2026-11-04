// farmAnimalsArt.js — Draws the Farm's chickens (ui/farmAnimals.js) at
// SCENE_SCALE, after the rice and before the character: code-drawn side
// views with a 1px outline (standing, the other leg forward, pecking with
// the head down), facing their way, or the farm.chicken sprite (3 frames:
// stand, walk, peck). Chickens inside the barn aren't drawn. Colors come
// from data/farmAnimals.js.

import { CHICKENS } from '../data/farmAnimals.js';
import { LAKE_ART } from '../data/lake.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { getSprite, drawSprite } from './assets.js';
import { chickenFrame, chickensToDraw } from './farmAnimals.js';

// The code-drawn chicken facing right, 5 x 5: r comb, w body, s wing, b
// beak, e eye, l legs.
const CHICKEN_FRAMES = {
  stand: ['...r.', 'w..eb', 'wwsw.', '.ww..', '.l.l.'],
  walk: ['...r.', 'w..eb', 'wwsw.', '.ww..', '..ll.'],
  peck: ['.....', 'w....', 'wwswr', '.wweb', '.l.l.'],
};
// farm.chicken sprite frames, in order.
const SPRITE_FRAME = { stand: 0, walk: 1, peck: 2 };

const layers = new Map();
function chickenLayer(frame) {
  if (!layers.has(frame)) {
    const rows = CHICKEN_FRAMES[frame];
    const { body, wing, comb, beak, eye, legs } = CHICKENS.colors;
    const colors = { w: body, s: wing, r: comb, b: beak, e: eye, l: legs };
    const layer = createLayer(rows[0].length + 2, rows.length + 2);
    rows.forEach((line, row) => [...line].forEach((char, col) => {
      if (char !== '.') fill(layer, col + 1, row + 1, 1, 1, colors[char]);
    }));
    outline(layer, OUTLINE_COLOR);
    layers.set(frame, layer);
  }
  return layers.get(frame);
}

// Canvas y of the bottom edge of picture row `row`.
function rowBottom(layout, row) {
  return layout.height - (LAKE_ART.height - row - 1) * layout.scale;
}

// Draws one chicken.
function drawChicken(ctx, layout, chicken) {
  const { scale } = layout;
  const frame = chickenFrame(chicken);
  const bottom = rowBottom(layout, Math.round(chicken.row));
  const flip = chicken.facing < 0;
  const sprite = getSprite('farm.chicken');
  if (sprite) {
    const own = sprite.scale ?? scale;
    drawSprite(ctx, sprite, Math.min(SPRITE_FRAME[frame], sprite.frames - 1), Math.round(chicken.x) * scale, bottom,
      own, { anchorCol: sprite.anchorX ?? Math.floor(sprite.frameWidth / 2), flip });
    return;
  }
  const layer = chickenLayer(frame);
  // Its middle column on its x, whichever way it faces; the outline's
  // bottom row below the feet' row.
  drawLayer(ctx, layer, Math.round(chicken.x) * scale, bottom + scale, scale,
    { anchorCol: Math.floor(layer.width / 2), flip });
}

// Draws the chickens that are out, back to front.
export function drawFarmAnimals(ctx, layout, animals) {
  for (const chicken of chickensToDraw(animals)) drawChicken(ctx, layout, chicken);
}
