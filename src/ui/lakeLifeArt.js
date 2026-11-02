// lakeLifeArt.js — Draws the Lake's wildlife (ui/lakeLife.js) at
// SCENE_SCALE, behind the character: frogs (sitting, blinking, croaking
// with a throat puff, hopping) code-drawn with an outline or from the
// lake.frog sprite, butterflies (wings open and closed) code-drawn in
// their color or from lake.butterfly.<color> / a tinted lake.butterfly
// sprite, and the ripples and splashes on the water. Also turns click
// boxes into canvas rectangles. Colors come from data/lakeLife.js.

import { FROGS, BUTTERFLIES } from '../data/lakeLife.js';
import { LAKE_ART } from '../data/lake.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { getSprite, drawSprite } from './assets.js';

// Pure art: the water's ripple and splash colors.
const RIPPLE = '#a9cdf3';
const RIPPLE_FADING = '#79ade9';
const SPLASH = '#e6f2fd';

// The code-drawn frog, front view, 4 x 3 (the hop stretches to 4 rows):
// y eye, G body, d legs, t throat. Drawn with a 1px outline.
const FROG_FRAMES = {
  idle: ['y..y', 'GGGG', 'dGGd'],
  blink: ['G..G', 'GGGG', 'dGGd'],
  croak: ['y..y', 'GGGG', 'dttd'],
  croakBig: ['y..y', 'GttG', 'dttd'],
  hop: ['y..y', 'GGGG', '.GG.', 'd..d'],
};
// lake.frog sprite frames, in order: idle, blink, croak, hop.
const FROG_SPRITE_FRAME = { idle: 0, blink: 1, croak: 2, croakBig: 2, hop: 3 };

// The code-drawn butterfly, 3 x 3: w wings, b body. No outline (it's
// tiny).
const BUTTERFLY_FRAMES = {
  open: ['wbw', 'wbw', 'w.w'],
  closed: ['.w.', '.w.', '.b.'],
};
// lake.butterfly sprite frames, in order: wings open, wings closed.
const BUTTERFLY_SPRITE_FRAME = { open: 0, closed: 1 };

const layers = new Map();

function patternLayer(key, rows, colors, outlined) {
  if (!layers.has(key)) {
    const pad = outlined ? 1 : 0;
    const layer = createLayer(rows[0].length + pad * 2, rows.length + pad * 2);
    rows.forEach((line, row) => [...line].forEach((char, col) => {
      if (char !== '.') fill(layer, col + pad, row + pad, 1, 1, colors[char]);
    }));
    if (outlined) outline(layer, OUTLINE_COLOR);
    layers.set(key, layer);
  }
  return layers.get(key);
}

// Canvas y of the top edge of picture row `row` (the picture is drawn
// from the window's bottom-left corner).
function rowY(layout, row) {
  return layout.height - (LAKE_ART.height - row) * layout.scale;
}

// A click box (critterBoxes()) in canvas pixels, { left, top, width,
// height }, kept inside the window.
export function boxToRect(layout, box) {
  const { scale } = layout;
  const left = Math.max(0, Math.round(box.left * scale));
  const top = Math.max(0, Math.round(rowY(layout, box.top)));
  const right = Math.min(layout.width, Math.round(box.right * scale));
  const bottom = Math.min(layout.height, Math.round(rowY(layout, box.bottom)));
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

// Which frog frame shows now.
function frogFrame(frog) {
  if (frog.state === 'hop') return 'hop';
  if (frog.state === 'croak') return Math.floor(frog.t / FROGS.croakFrame) === 1 ? 'croakBig' : 'croak';
  return frog.blinkLeft > 0 ? 'blink' : 'idle';
}

function drawFrog(ctx, layout, frog) {
  const frame = frogFrame(frog);
  const { scale } = layout;
  const bottom = rowY(layout, Math.round(frog.row));
  const sprite = getSprite('lake.frog');
  if (sprite) {
    const own = sprite.scale ?? scale;
    drawSprite(ctx, sprite, Math.min(FROG_SPRITE_FRAME[frame], sprite.frames - 1),
      Math.round(frog.x) * scale, bottom, own, { anchorCol: sprite.anchorX });
    return;
  }
  const { body, dark, eye, throat } = FROGS.colors;
  const layer = patternLayer(`frog:${frame}`, FROG_FRAMES[frame], { y: eye, G: body, d: dark, t: throat }, true);
  const left = Math.round(frog.x - layer.width / 2);
  drawLayer(ctx, layer, left * scale, bottom, scale);
}

// A copy of the lake.butterfly sprite tinted with `wing` (multiplied, so
// a white or gray sprite takes the color), as a sprite (cached).
const tinted = new Map();
function tintedSprite(sprite, wing) {
  if (!tinted.has(wing)) {
    const canvas = document.createElement('canvas');
    canvas.width = sprite.image.naturalWidth ?? sprite.image.width;
    canvas.height = sprite.image.naturalHeight ?? sprite.image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sprite.image, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = wing;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(sprite.image, 0, 0);
    tinted.set(wing, { ...sprite, image: canvas });
  }
  return tinted.get(wing);
}

// Which butterfly frame shows now: flapping while flying, slowly opening
// and closing while resting.
function butterflyFrame(butterfly) {
  const every = butterfly.state === 'land' ? BUTTERFLIES.restFlap : BUTTERFLIES.flap;
  return Math.floor(butterfly.t / every) % 2 ? 'closed' : 'open';
}

function drawButterfly(ctx, layout, butterfly) {
  const frame = butterflyFrame(butterfly);
  const { scale } = layout;
  const flying = butterfly.state !== 'land';
  const bob = flying ? Math.sin((butterfly.t / BUTTERFLIES.bob.cycle) * 2 * Math.PI) * BUTTERFLIES.bob.rows : 0;
  const bottom = rowY(layout, Math.round(butterfly.row - bob));
  const color = BUTTERFLIES.colors.find((candidate) => candidate.id === butterfly.color) ?? BUTTERFLIES.colors[0];
  const own = getSprite(`lake.butterfly.${color.id}`);
  const base = own ? null : getSprite('lake.butterfly');
  const sprite = own ?? (base ? tintedSprite(base, color.wing) : null);
  if (sprite) {
    drawSprite(ctx, sprite, Math.min(BUTTERFLY_SPRITE_FRAME[frame], sprite.frames - 1),
      Math.round(butterfly.x) * scale, bottom, sprite.scale ?? scale, { anchorCol: sprite.anchorX });
    return;
  }
  const layer = patternLayer(`butterfly:${color.id}:${frame}`, BUTTERFLY_FRAMES[frame],
    { w: color.wing, b: BUTTERFLIES.body }, false);
  drawLayer(ctx, layer, Math.round(butterfly.x - layer.width / 2) * scale, bottom, scale);
}

function dot(ctx, layout, col, row, color) {
  const { scale } = layout;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(col) * scale, rowY(layout, Math.round(row)), scale, scale);
}

// A ring spreading on the water around (x, row), flattened.
function drawRipple(ctx, layout, effect) {
  const { seconds, radius, flat } = FROGS.ripple;
  const u = effect.t / seconds;
  const r = 1 + (radius - 1) * u;
  const color = u < 0.6 ? RIPPLE : RIPPLE_FADING;
  const seen = new Set();
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * 2 * Math.PI;
    const col = Math.round(effect.x - 0.5 + Math.cos(angle) * r);
    const row = Math.round(effect.row + Math.sin(angle) * r * flat);
    const key = `${col},${row}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dot(ctx, layout, col, row, color);
  }
}

// Drops flying up and out from (x, row).
function drawSplash(ctx, layout, effect) {
  const u = effect.t / FROGS.splash;
  const spread = 1 + u * 2;
  const rise = Math.sin(u * Math.PI) * 3;
  for (const [dx, dy] of [[-2, -1], [-1, -2], [1, -2], [2, -1]]) {
    dot(ctx, layout, effect.x - 0.5 + dx * spread, effect.row - 1 + dy - rise, SPLASH);
  }
}

// Draws all of it: ripples and splashes, frogs, then butterflies.
export function drawLakeLife(ctx, layout, life) {
  for (const effect of life.effects) {
    if (effect.kind === 'ripple') drawRipple(ctx, layout, effect);
    else drawSplash(ctx, layout, effect);
  }
  for (const frog of life.frogs) {
    if (frog.state !== 'under') drawFrog(ctx, layout, frog);
  }
  for (const butterfly of life.butterflies) drawButterfly(ctx, layout, butterfly);
}
