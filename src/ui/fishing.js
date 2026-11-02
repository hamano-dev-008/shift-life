// fishing.js — Draws fishing over the scene: the rod in the character's
// hand (swung back to cast, out while waiting, jiggling at a bite, bent
// while reeling), the line, the bobber (flying out on the cast, bobbing
// with ripples, dipping with a splash at a bite, pulled in while
// reeling, jerking at the dock while the reveal's suspense plays), and
// the catch held up high. Also the fish icons (a fish.<id> sprite, or
// code-drawn), on the scene, in the fish collection and on the reveal
// card, and their silhouettes.
// Timing comes from data/fishing.js, where the bobber lands from
// data/lake.js; the hand from fishingHand() in ui/sprite.js.

import { FISHING_TIMES, FISHING_LOOPS } from '../data/fishing.js';
import { LAKE_ART, BOBBER_SPOT, DOCK } from '../data/lake.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { getSprite, drawSprite } from './assets.js';

// Pure art.
const ROD = '#7a4a2a';
const ROD_TIP = '#e8d8b0';
const LINE = '#f1ece0';
const BOBBER_TOP = '#e0584a';
const BOBBER_BOTTOM = '#ffffff';
const RIPPLE = '#a9cdf3';
const SPLASH = '#e6f2fd';
const SILHOUETTE = '#bfb6a5';

// The rod's pixels as [col, row] from the hand (drawn facing right,
// mirrored when facing left; rows go up with negative numbers). The last
// pixel is the tip, where the line starts.
const RODS = {
  out: [[1, -1], [2, -2], [3, -2], [4, -3], [5, -4], [6, -4], [7, -5]],
  dipped: [[1, -1], [2, -1], [3, -2], [4, -2], [5, -2], [6, -3], [7, -3]],
  bent: [[1, -1], [2, -2], [3, -3], [4, -3], [5, -3], [6, -2], [7, -1]],
  back: [[0, -1], [0, -2], [-1, -3], [-1, -4], [-2, -5], [-2, -6], [-3, -7]],
  up: [[1, -1], [1, -2], [1, -3], [2, -4], [2, -5], [2, -6], [2, -7]],
};
// While landing (the reveal's suspense), the bobber jerks up a pixel
// and back every this many seconds.
const LAND_JERK = 0.08;
// Share of the cast spent with the rod back, then upright; after that
// the rod is out and the bobber flies.
const CAST_BACK = 0.3;
const CAST_UP = 0.45;
// How high the bobber arcs on the cast, and how far the line sags, in
// character pixels.
const CAST_ARC = 12;
const LINE_SAG = 2;

// The rod for how the fishing looks now (fishingLook() in game/fishing.js),
// or null while holding up the catch.
function rodFor(look) {
  switch (look.phase) {
    case 'cast': {
      const share = look.seconds / FISHING_TIMES.cast;
      if (share < CAST_BACK) return RODS.back;
      return share < CAST_UP ? RODS.up : RODS.out;
    }
    case 'bite':
      return Math.floor(look.seconds / FISHING_LOOPS.jiggle) % 2 ? RODS.dipped : RODS.out;
    case 'reel':
    case 'land':
      return RODS.bent;
    case 'show':
      return null;
    default:
      return RODS.out;
  }
}

// Fills one character pixel whose middle is at (x, y).
function dot(ctx, x, y, unit, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - unit / 2), Math.round(y - unit / 2), unit, unit);
}

// Snaps canvas x or y to the middle of a `unit` grid cell.
function snap(value, unit) {
  return Math.floor(value / unit) * unit + unit / 2;
}

// A line of character pixels from (x1, y1) to (x2, y2), sagging `sag`
// pixels in the middle.
function drawLine(ctx, x1, y1, x2, y2, unit, sag) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / unit));
  for (let i = 1; i < steps; i++) {
    const u = i / steps;
    const x = x1 + (x2 - x1) * u;
    const y = y1 + (y2 - y1) * u + Math.sin(Math.PI * u) * sag * unit;
    dot(ctx, snap(x, unit), snap(y, unit), unit, LINE);
  }
}

// The bobber, floating with its middle at canvas x and its bottom on the
// water line `waterY`; `sunk` rows of it are under water.
function drawBobber(ctx, x, waterY, unit, sunk = 0) {
  const left = Math.round(x - unit);
  ctx.fillStyle = BOBBER_TOP;
  ctx.fillRect(left, waterY - (2 - sunk) * unit, unit * 2, unit);
  if (sunk < 1) {
    ctx.fillStyle = BOBBER_BOTTOM;
    ctx.fillRect(left, waterY - unit, unit * 2, unit);
  }
}

// Drops flying up and out from (x, y), `progress` 0 to 1.
function drawSplash(ctx, x, y, unit, progress) {
  if (progress > 0.8) return;
  const spread = 1 + progress * 2;
  const rise = Math.sin(progress * Math.PI) * 3;
  for (const [dx, dy] of [[-2, -1], [-1, -2], [1, -2], [2, -1]]) {
    dot(ctx, x + dx * spread * unit, y + (dy - rise) * unit, unit, SPLASH);
  }
}

// Draws the rod, line, bobber and splashes, or the catch held up, for
// `look` (fishingLook()) from `hand` (fishingHand() in ui/sprite.js).
export function drawFishing(ctx, layout, hand, look) {
  const { unit, facing } = hand;
  if (look.phase === 'show') {
    // Held up in the raised hand, out in front of the face.
    if (look.catch) {
      drawFishIcon(ctx, look.catch, hand.x + facing * unit * 1.5, hand.y - unit / 2, unit,
        { align: facing < 0 ? 'right' : 'left' });
    }
    return;
  }
  const rod = rodFor(look);
  rod.forEach(([col, row], i) => {
    dot(ctx, hand.x + facing * col * unit, hand.y + row * unit, unit, i === rod.length - 1 ? ROD_TIP : ROD);
  });
  const [tipCol, tipRow] = rod.at(-1);
  const tipX = hand.x + facing * tipCol * unit;
  const tipY = hand.y + tipRow * unit;

  const { scale, height } = layout;
  const waterY = height - (LAKE_ART.height - BOBBER_SPOT.row) * scale;
  const spotX = snap(BOBBER_SPOT.x * scale, unit);
  const t = look.seconds;

  if (look.phase === 'cast') {
    const share = t / FISHING_TIMES.cast;
    if (share < CAST_UP) return;
    // The bobber flies from the tip out to its spot.
    const u = (share - CAST_UP) / (1 - CAST_UP);
    const x = tipX + (spotX - tipX) * u;
    const bottom = tipY + (waterY - tipY) * u - Math.sin(Math.PI * u) * CAST_ARC * unit;
    drawLine(ctx, tipX, tipY, x, bottom - unit, unit, 0);
    drawBobber(ctx, x, bottom, unit);
    return;
  }

  let x = spotX;
  if (look.phase === 'reel') {
    // Pulled in toward the dock's tip, with a wake.
    const u = Math.min(1, t / FISHING_TIMES.reel);
    x = snap(spotX + (DOCK.left * scale - spotX) * u, unit);
  } else if (look.phase === 'land') {
    // At the dock's tip, jerking with the fish on the line.
    x = snap(DOCK.left * scale, unit);
    const jerk = Math.floor(t / LAND_JERK) % 2 ? unit : 0;
    drawLine(ctx, tipX, tipY, x, waterY - 2 * unit - jerk, unit, 0);
    drawBobber(ctx, x, waterY - jerk, unit, jerk ? 0 : 1);
    drawSplash(ctx, x, waterY - unit, unit, (t % FISHING_LOOPS.splash) / FISHING_LOOPS.splash);
    return;
  }
  const lift = look.phase === 'wait' && t % FISHING_LOOPS.bob > FISHING_LOOPS.bob / 2 ? unit : 0;
  drawLine(ctx, tipX, tipY, x, waterY - 2 * unit - lift, unit, look.phase === 'wait' ? LINE_SAG : 0);

  if (look.phase === 'wait') {
    drawBobber(ctx, x, waterY - lift, unit);
    // A ripple spreads now and then.
    const ripple = (t % FISHING_LOOPS.ripple) / FISHING_LOOPS.ripple;
    if (ripple < 0.35) {
      const reach = 2 + Math.floor(ripple * 9);
      dot(ctx, x - reach * unit, waterY - unit / 2, unit, RIPPLE);
      dot(ctx, x + reach * unit, waterY - unit / 2, unit, RIPPLE);
    }
  } else {
    drawBobber(ctx, x, waterY, unit, 1);
    const splash = (t % FISHING_LOOPS.splash) / FISHING_LOOPS.splash;
    drawSplash(ctx, x, waterY - unit, unit, splash);
  }
}

// The code-drawn catches: a pattern (rows of characters, facing left)
// and the color of each character in it ('.' is empty). Each is drawn
// with a 1px outline.
const FISH_SHAPE = [
  '...ddd...',
  '.bbbbbb.d',
  'bebbbbbdd',
  '.llllll.d',
  '...ll....',
];
const STRIPED_SHAPE = [
  '...ddd...',
  '.bsbsbb.d',
  'besbsbbdd',
  '.llllll.d',
  '...ll....',
];
const SPOTTED_SHAPE = [
  '...ddd...',
  '.bbsbsb.d',
  'bebbsbbdd',
  '.llllll.d',
  '...ll....',
];
const WHISKERED_SHAPE = [
  '...ddd...',
  '.bbbbbb.d',
  'bebbbbbdd',
  'wllllll.d',
  'w..ll....',
];
const LONG_SHAPE = [
  '.....dd....',
  '.bbbsbsbb.d',
  'bebbbbbbbdd',
  '.lllllllll.',
];
const BOOT_SHAPE = [
  '..ddd..',
  '..bbb..',
  '..bbb..',
  '.bbbbb.',
  'bbbbbbb',
  'ddddddd',
];
const EYE = '#2b2b3a';
const FISH_ART = {
  boot: { shape: BOOT_SHAPE, colors: { b: '#7a5a44', d: '#4f3a2c' } },
  carp: { shape: FISH_SHAPE, colors: { b: '#c9934b', l: '#ecd3a0', d: '#8f6233', e: EYE } },
  perch: { shape: STRIPED_SHAPE, colors: { b: '#9bbf5a', s: '#5f7f33', l: '#e9e3b0', d: '#e07a3f', e: EYE } },
  trout: { shape: SPOTTED_SHAPE, colors: { b: '#a7b6c8', s: '#5d6a80', l: '#f1c6cc', d: '#6f7f94', e: EYE } },
  catfish: { shape: WHISKERED_SHAPE, colors: { b: '#6f6a5e', l: '#c7bfa6', d: '#4c473f', w: '#4c473f', e: '#f1ece0' } },
  salmon: { shape: FISH_SHAPE, colors: { b: '#e98a6b', l: '#f8d1bf', d: '#b65b45', e: EYE } },
  pike: { shape: LONG_SHAPE, colors: { b: '#7c9a5e', s: '#cfe08a', l: '#dbe2b5', d: '#4f6a3a', e: EYE } },
  goldenKoi: { shape: SPOTTED_SHAPE, colors: { b: '#f2c14e', s: '#ffffff', l: '#fff1b8', d: '#e07a3f', e: EYE } },
};

const iconLayers = new Map();

// The code-drawn icon for fish `id` on its own outlined layer (cached),
// or all one color (`shade`) as a silhouette.
function iconLayer(id, shade) {
  const key = `${id}:${shade}`;
  if (!iconLayers.has(key)) {
    const { shape, colors } = FISH_ART[id] ?? FISH_ART.carp;
    const layer = createLayer(shape[0].length + 2, shape.length + 2);
    shape.forEach((line, row) => [...line].forEach((char, col) => {
      if (char !== '.') fill(layer, col + 1, row + 1, 1, 1, shade || colors[char]);
    }));
    outline(layer, shade || OUTLINE_COLOR);
    iconLayers.set(key, layer);
  }
  return iconLayers.get(key);
}

// The fish.<id> sprite's first frame as one flat color (cached).
function spriteSilhouette(id, sprite, shade) {
  const key = `sprite:${id}:${shade}`;
  if (!iconLayers.has(key)) {
    const layer = createLayer(sprite.frameWidth, sprite.frameHeight);
    drawSprite(layer.ctx, sprite, 0, 0, sprite.frameHeight, 1);
    layer.ctx.globalCompositeOperation = 'source-in';
    fill(layer, 0, 0, layer.width, layer.height, shade);
    iconLayers.set(key, layer);
  }
  return iconLayers.get(key);
}

// Fish `id`'s icon size in its own pixels: { width, height } (the
// sprite's frame, or the code-drawn icon with its outline).
export function fishIconSize(id) {
  const sprite = getSprite(`fish.${id}`);
  if (sprite) return { width: sprite.frameWidth, height: sprite.frameHeight };
  const layer = iconLayer(id, '');
  return { width: layer.width, height: layer.height };
}

// Draws fish `id`'s icon with its bottom edge at canvas row bottomY and
// its middle at canvas x (`align` 'center'), or its left or right edge
// there ('left', 'right'); each of its pixels is `scale` canvas pixels
// (a sprite's own `scale` wins unless `exact`): the fish.<id> sprite if
// there is one, otherwise code-drawn. `silhouette`: one flat color, true
// for the pale "not caught yet" one or a color.
export function drawFishIcon(ctx, id, x, bottomY, scale, { silhouette = false, align = 'center', exact = false } = {}) {
  const sprite = getSprite(`fish.${id}`);
  const shade = silhouette === true ? SILHOUETTE : silhouette || '';
  const own = sprite && !exact ? sprite.scale ?? scale : scale;
  let layer = null;
  if (!sprite) layer = iconLayer(id, shade);
  else if (shade) layer = spriteSilhouette(id, sprite, shade);
  const width = (sprite ? sprite.frameWidth : layer.width) * own;
  const shift = { center: width / 2, left: 0, right: width }[align];
  const left = Math.round(x - shift);
  if (layer) {
    drawLayer(ctx, layer, left, Math.round(bottomY), own);
  } else {
    drawSprite(ctx, sprite, 0, left, Math.round(bottomY), own);
  }
}
