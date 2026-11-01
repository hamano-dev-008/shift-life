// scene.js — Works out where everything goes for the window's size and the
// scene scale, and draws the static backdrop (dithered sky, grassy ground
// strip, props) once to an offscreen canvas copied in every frame.

import {
  SCENE_SCALE, GROUND_HEIGHT, FEET_FROM_BOTTOM, PROP_BASE_FROM_BOTTOM, PROPS, WANDER_MARGIN,
} from '../data/layout.js';
import { createLayer, drawLayer } from './pixel.js';
import { drawProps } from './props.js';

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
    feetY: fromBottom(FEET_FROM_BOTTOM),
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

export function createBackground(layout) {
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');

  // Sky and grass are painted in scene pixels, then scaled up. The grid is
  // bottom-aligned so the grass rows are whole; any partial row or column
  // falls off the top or right edge.
  const grid = createLayer(Math.ceil(layout.width / layout.scale), Math.ceil(layout.height / layout.scale));
  const groundTop = grid.height - GROUND_HEIGHT;
  drawSky(grid, groundTop);
  drawGround(grid, groundTop);
  drawLayer(ctx, grid, 0, layout.height, layout.scale);

  drawProps(ctx, layout);
  return canvas;
}
