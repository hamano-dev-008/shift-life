// scene.js — The static backdrop: a dithered sky, a grassy ground strip,
// and the props, drawn once to an offscreen canvas copied in every frame.

import { SCENE_WIDTH, SCENE_HEIGHT, GROUND_TOP } from '../data/layout.js';
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

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

// Cheap deterministic noise so the grass looks the same every launch.
function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// A soft gradient limited to a few shades, dithered where they meet.
function drawSky(ctx) {
  const image = ctx.createImageData(SCENE_WIDTH, GROUND_TOP);
  for (let y = 0; y < GROUND_TOP; y++) {
    const t = (y / (GROUND_TOP - 1)) * (SKY_SHADES - 1);
    for (let x = 0; x < SCENE_WIDTH; x++) {
      const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16;
      const shade = Math.floor(t) + (t % 1 > threshold ? 1 : 0);
      const color = mix(SKY_TOP, SKY_HORIZON, shade / (SKY_SHADES - 1));
      image.data.set([...color, 255], (y * SCENE_WIDTH + x) * 4);
    }
  }
  ctx.putImageData(image, 0, 0);
}

function drawGround(ctx) {
  ctx.fillStyle = GRASS;
  ctx.fillRect(0, GROUND_TOP, SCENE_WIDTH, SCENE_HEIGHT - GROUND_TOP);

  // Light top edge with tufts poking up into the sky.
  ctx.fillStyle = GRASS_LIGHT;
  ctx.fillRect(0, GROUND_TOP, SCENE_WIDTH, 2);
  for (let x = 0; x < SCENE_WIDTH; x++) {
    const n = noise(x, 0);
    if (n < 0.08) ctx.fillRect(x, GROUND_TOP - 2, 1, 2);
    else if (n < 0.3) ctx.fillRect(x, GROUND_TOP - 1, 1, 1);
  }

  // Darker speckles below the edge.
  ctx.fillStyle = GRASS_DARK;
  for (let y = GROUND_TOP + 3; y < SCENE_HEIGHT; y++) {
    for (let x = 0; x < SCENE_WIDTH; x++) {
      if (noise(x, y) < 0.07) ctx.fillRect(x, y, 1, 1);
    }
  }
}

export function createBackground() {
  const canvas = document.createElement('canvas');
  canvas.width = SCENE_WIDTH;
  canvas.height = SCENE_HEIGHT;
  const ctx = canvas.getContext('2d');
  drawSky(ctx);
  drawGround(ctx);
  drawProps(ctx);
  return canvas;
}
