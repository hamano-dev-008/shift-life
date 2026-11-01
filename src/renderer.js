// renderer.js — Renderer entry point: draws the placeholder pixel scene and
// wires up the window controls.

// The scene is drawn on a low-res canvas (160x120) that CSS scales up 2x
// with nearest-neighbour filtering, so every pixel stays a crisp square.
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 24;
const FONT = '8px "Press Start 2P"';

const SKY_TOP = [142, 202, 230];
const SKY_HORIZON = [253, 226, 200];
const SKY_SHADES = 6;
const GRASS = '#7cc46d';
const GRASS_LIGHT = '#a6dc8c';
const GRASS_DARK = '#62a95c';
const TEXT_COLOR = [61, 58, 75];
const TEXT_SHADOW = [255, 255, 255];

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
function drawSky() {
  const skyHeight = HEIGHT - GROUND_HEIGHT;
  const image = ctx.createImageData(WIDTH, skyHeight);
  for (let y = 0; y < skyHeight; y++) {
    const t = (y / (skyHeight - 1)) * (SKY_SHADES - 1);
    for (let x = 0; x < WIDTH; x++) {
      const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16;
      const shade = Math.floor(t) + (t % 1 > threshold ? 1 : 0);
      const color = mix(SKY_TOP, SKY_HORIZON, shade / (SKY_SHADES - 1));
      image.data.set([...color, 255], (y * WIDTH + x) * 4);
    }
  }
  ctx.putImageData(image, 0, 0);
}

function drawGround() {
  const top = HEIGHT - GROUND_HEIGHT;
  ctx.fillStyle = GRASS;
  ctx.fillRect(0, top, WIDTH, GROUND_HEIGHT);

  // Light top edge with tufts poking up into the sky.
  ctx.fillStyle = GRASS_LIGHT;
  ctx.fillRect(0, top, WIDTH, 2);
  for (let x = 0; x < WIDTH; x++) {
    const n = noise(x, 0);
    if (n < 0.08) ctx.fillRect(x, top - 2, 1, 2);
    else if (n < 0.3) ctx.fillRect(x, top - 1, 1, 1);
  }

  // Darker speckles below the edge.
  ctx.fillStyle = GRASS_DARK;
  for (let y = top + 3; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (noise(x, y) < 0.07) ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Draws text with hard edges: renders it to a scratch canvas, then snaps
// each pixel to fully opaque or fully transparent to remove anti-aliasing.
function drawPixelText(text, centerX, y, color) {
  const scratch = document.createElement('canvas');
  const sctx = scratch.getContext('2d');
  sctx.font = FONT;
  scratch.width = Math.ceil(sctx.measureText(text).width);
  scratch.height = 10;
  sctx.font = FONT; // resizing the canvas resets its context state
  sctx.textBaseline = 'top';
  sctx.fillText(text, 0, 0);

  const image = sctx.getImageData(0, 0, scratch.width, scratch.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const opaque = image.data[i + 3] >= 128;
    image.data.set(opaque ? [...color, 255] : [0, 0, 0, 0], i);
  }
  sctx.putImageData(image, 0, 0);
  ctx.drawImage(scratch, Math.round(centerX - scratch.width / 2), y);
}

async function drawScene() {
  drawSky();
  drawGround();
  await document.fonts.load(FONT);
  const centerX = WIDTH / 2;
  drawPixelText('Life loading...', centerX + 1, 45, TEXT_SHADOW);
  drawPixelText('Life loading...', centerX, 44, TEXT_COLOR);
}

document.getElementById('minimize-btn').addEventListener('click', () => window.shiftLife.minimize());
document.getElementById('close-btn').addEventListener('click', () => window.shiftLife.close());

drawScene();
