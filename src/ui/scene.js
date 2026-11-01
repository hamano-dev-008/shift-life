// scene.js — Works out where everything goes for the window's size and the
// scene scale, and draws the scenery: dithered sky, grassy ground strip,
// house and tree. Each piece uses its sprite (ui/assets.js) when there is
// one, or the code-drawn art. Still pieces are drawn once to offscreen
// canvases copied in every frame; animated sprites are drawn every frame.

import {
  SCENE_SCALE, CHARACTER_SCALE, GROUND_HEIGHT, FEET_FROM_BOTTOM, PROP_BASE_FROM_BOTTOM, PROPS, WANDER_MARGIN,
} from '../data/layout.js';
import { createLayer, drawLayer } from './pixel.js';
import { drawHouse, drawTree } from './props.js';
import { getSprite, isAnimated, frameAtTime, drawSprite } from './assets.js';

const SKY_TOP = [142, 202, 230];
const SKY_HORIZON = [253, 226, 200];
const SKY_SHADES = 6;
const GRASS = '#7cc46d';
const GRASS_LIGHT = '#a6dc8c';
const GRASS_DARK = '#62a95c';

// 4x4 Bayer matrix for ordered dithering between sky shades.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// Converts data/layout.js (scene pixels from the window edges) into canvas
// pixels for a canvas of the given size. Everything that places things in
// the scene reads this instead of the raw data.
export function computeLayout(width, height) {
  const scale = SCENE_SCALE;
  const fromBottom = (rows) => height - rows * scale;
  const props = {};
  for (const [id, prop] of Object.entries(PROPS)) {
    const x = prop.edge === 'left'
      ? prop.margin * scale
      : width - (prop.margin + prop.width) * scale;
    props[id] = {
      edge: prop.edge,
      x,
      baseY: fromBottom(PROP_BASE_FROM_BOTTOM),
      width: prop.width,
      height: prop.height,
      visitX: x + prop.visitOffset * scale,
    };
  }
  return {
    width,
    height,
    scale,
    characterScale: CHARACTER_SCALE,
    feetY: fromBottom(FEET_FROM_BOTTOM),
    groundY: fromBottom(GROUND_HEIGHT),
    props,
    wanderMinX: WANDER_MARGIN * scale,
    wanderMaxX: width - WANDER_MARGIN * scale,
  };
}

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

// Cheap deterministic noise so the grass looks the same every launch.
function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// A soft gradient limited to a few shades, dithered where they meet.
function drawSky(grid, groundTop) {
  const image = grid.ctx.createImageData(grid.width, groundTop);
  for (let y = 0; y < groundTop; y++) {
    const t = (y / (groundTop - 1)) * (SKY_SHADES - 1);
    for (let x = 0; x < grid.width; x++) {
      const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16;
      const shade = Math.floor(t) + (t % 1 > threshold ? 1 : 0);
      const color = mix(SKY_TOP, SKY_HORIZON, shade / (SKY_SHADES - 1));
      image.data.set([...color, 255], (y * grid.width + x) * 4);
    }
  }
  grid.ctx.putImageData(image, 0, 0);
}

function drawGround(grid, groundTop) {
  const { ctx, width, height } = grid;
  ctx.fillStyle = GRASS;
  ctx.fillRect(0, groundTop, width, height - groundTop);

  // Light top edge with tufts poking up into the sky.
  ctx.fillStyle = GRASS_LIGHT;
  ctx.fillRect(0, groundTop, width, 2);
  for (let x = 0; x < width; x++) {
    const n = noise(x, 0);
    if (n < 0.08) ctx.fillRect(x, groundTop - 2, 1, 2);
    else if (n < 0.3) ctx.fillRect(x, groundTop - 1, 1, 1);
  }

  // Darker speckles below the edge.
  ctx.fillStyle = GRASS_DARK;
  for (let y = groundTop + 3; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (noise(x, y) < 0.07) ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Sky and grass are painted in scene pixels on a grid the size of the
// window, then scaled up. The grid is bottom-aligned so the grass rows
// are whole; any partial row or column falls off the top or right edge.
function paintOnGrid(ctx, layout, paint) {
  const grid = createLayer(Math.ceil(layout.width / layout.scale), Math.ceil(layout.height / layout.scale));
  paint(grid, grid.height - GROUND_HEIGHT);
  drawLayer(ctx, grid, 0, layout.height, layout.scale);
}

// Screen pixels per pixel of a scenery sprite: its own `scale`, or the
// scene's.
function scaleOf(layout, sprite) {
  return sprite.scale ?? layout.scale;
}

// Repeats a sprite frame side by side across the window, its bottom edge
// at canvas row bottomY.
function tileAcross(ctx, layout, sprite, frame, bottomY) {
  const scale = scaleOf(layout, sprite);
  const step = sprite.frameWidth * scale;
  for (let x = 0; x < layout.width; x += step) drawSprite(ctx, sprite, frame, x, bottomY, scale);
}

// A prop sprite goes where the code-drawn prop and its 1px outline go:
// its outer column against the prop's window edge, its bottom row just
// below the prop's base. A sprite with its own scale grows away from
// that edge and upward.
function placeProp(ctx, layout, sprite, frame, prop) {
  const scale = scaleOf(layout, sprite);
  const width = sprite.frameWidth * scale;
  const left = prop.edge === 'left'
    ? prop.x - scale
    : prop.x + prop.width * layout.scale + scale - width;
  drawSprite(ctx, sprite, frame, left, prop.baseY + scale, scale);
}

// The scenery, back to front. Each piece has its sprite name (see
// data/sprites.js), how to draw that sprite's frame, and the code-drawn
// fallback.
const SCENERY = [
  {
    name: 'sky',
    // Tiled across and upward from the grass line.
    drawSprite: (ctx, layout, sprite, frame) => {
      const step = sprite.frameHeight * scaleOf(layout, sprite);
      for (let bottom = layout.groundY; bottom > 0; bottom -= step) {
        tileAcross(ctx, layout, sprite, frame, bottom);
      }
    },
    drawCode: (ctx, layout) => paintOnGrid(ctx, layout, drawSky),
  },
  {
    name: 'grass',
    drawSprite: (ctx, layout, sprite, frame) => tileAcross(ctx, layout, sprite, frame, layout.height),
    drawCode: (ctx, layout) => paintOnGrid(ctx, layout, drawGround),
  },
  {
    name: 'house',
    drawSprite: (ctx, layout, sprite, frame) => placeProp(ctx, layout, sprite, frame, layout.props.house),
    drawCode: drawHouse,
  },
  {
    name: 'tree',
    drawSprite: (ctx, layout, sprite, frame) => placeProp(ctx, layout, sprite, frame, layout.props.tree),
    drawCode: drawTree,
  },
];

function createCanvas(layout) {
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  return canvas;
}

// Prepares the scenery for drawing every frame. Still pieces next to each
// other (code-drawn, or one-frame sprites) are drawn once onto a shared
// offscreen canvas; an animated sprite is drawn live between them, so
// the order back to front stays the same. Call after loadSprites().
export function createScenery(layout) {
  const parts = [];
  let still = null;
  for (const piece of SCENERY) {
    const sprite = getSprite(piece.name);
    if (sprite && isAnimated(sprite)) {
      parts.push({ piece, sprite });
      still = null;
      continue;
    }
    if (!still) {
      still = createCanvas(layout);
      parts.push({ canvas: still });
    }
    const ctx = still.getContext('2d');
    if (sprite) {
      piece.drawSprite(ctx, layout, sprite, 0);
    } else {
      piece.drawCode(ctx, layout);
    }
  }
  return {
    // Draws the scenery as it looks `seconds` in (for animated sprites).
    draw(ctx, seconds) {
      for (const part of parts) {
        if (part.canvas) {
          ctx.drawImage(part.canvas, 0, 0);
        } else {
          part.piece.drawSprite(ctx, layout, part.sprite, frameAtTime(part.sprite, seconds));
        }
      }
    },
  };
}
