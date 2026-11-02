// scene.js — Works out where everything goes for the window's size, the
// scene scale and a place (data/places.js), and draws that place's
// scenery: outdoors a dithered sky, grassy ground strip, the tree, the
// parents' house or the housing tier (ui/housing.js); at Home the wall, floor, window, door and sofa (ui/room.js);
// at the Lake its background and the water shimmer (ui/lake.js); at the
// Fortune Tree its background picture (or sky and grass) and the wishing
// well; at the Farm its background picture (or sky, grass and the
// code-drawn path and paddies, ui/farm.js).
// Each piece uses its sprite (ui/assets.js) when there is one, or the
// code-drawn art. Still pieces are drawn once to offscreen canvases
// copied in every frame; animated sprites and live pieces (the shimmer)
// are drawn every frame.

import {
  SCENE_SCALE, CHARACTER_SCALE, GROUND_HEIGHT, FEET_FROM_BOTTOM, PROP_BASE_FROM_BOTTOM, PROPS, WANDER_MARGIN,
} from '../data/layout.js';
import { createLayer, drawLayer } from './pixel.js';
import { drawTree, drawParentsHouse, drawHouse, drawWell } from './props.js';
import { drawSleepingBag, drawTent } from './housing.js';
import { drawWall, drawFloor, drawHomeWindow, drawHomeDoor, drawSofa } from './room.js';
import { drawLake, drawShimmer } from './lake.js';
import { DOCK_PROP } from '../data/lake.js';
import { FARM_BACKGROUND, FARM_BACKGROUND_FALLBACK, PADDIES } from '../data/farm.js';
import { drawFarmGround } from './farm.js';
import { TREE_BACKGROUND, TREE_BACKGROUND_FALLBACK, WELL_PROP } from '../data/fortuneTreeDecor.js';
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
// pixels for a canvas of the given size, with the props in `place`'s
// scenery, its feet row and where the character may walk (`walk`: a side
// with a limit is closed, see openSides). Everything that places things
// in the scene reads this instead of the raw data.
export function computeLayout(width, height, place) {
  const scale = SCENE_SCALE;
  const fromBottom = (rows) => height - rows * scale;
  const props = {};
  for (const [id, prop] of Object.entries(PROPS)) {
    if (!place.scenery.includes(id)) continue;
    let x;
    if (prop.edge === 'left') {
      x = prop.margin * scale;
    } else if (prop.edge === 'right') {
      x = width - (prop.margin + prop.width) * scale;
    } else {
      // Centered, on the scene pixel grid.
      x = Math.floor((width / scale - prop.width) / 2) * scale;
    }
    props[id] = {
      edge: prop.edge,
      x,
      baseY: fromBottom(prop.base ?? PROP_BASE_FROM_BOTTOM),
      width: prop.width,
      height: prop.height,
      visitX: x + prop.visitOffset * scale,
      visit: prop.visit !== false,
    };
  }
  const walk = place.walk ?? {};
  return {
    width,
    height,
    scale,
    characterScale: CHARACTER_SCALE,
    feetY: fromBottom(place.feetFromBottom ?? FEET_FROM_BOTTOM),
    groundY: fromBottom(GROUND_HEIGHT),
    props,
    wanderMinX: (walk.minX ?? WANDER_MARGIN) * scale,
    wanderMaxX: walk.maxX == null ? width - WANDER_MARGIN * scale : walk.maxX * scale,
    // Which window edges the character can walk out of (work trips).
    openSides: { left: walk.minX == null, right: walk.maxX == null },
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

// Sky and grass (and Home's wall and floor) are painted in scene pixels
// on a grid the size of the window, then scaled up. The grid is
// bottom-aligned so the ground rows are whole; any partial row or column
// falls off the top or right edge.
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

// Where prop `id` is drawn, in canvas pixels: { left, top, width, height,
// scale (screen pixels per pixel of its art), sprite (whether it's drawn
// from a sprite) }, or null if the place has no such prop. A prop sprite
// goes where the code-drawn prop and its 1px outline go: its outer column
// against the prop's window edge (or centered on a centered prop), its
// bottom row just below the prop's base. A sprite with its own scale
// grows away from that edge (or both ways) and upward.
export function propRect(layout, id) {
  const prop = layout.props[id];
  if (!prop) return null;
  const sprite = getSprite(id);
  const scale = sprite ? scaleOf(layout, sprite) : layout.scale;
  const width = (sprite ? sprite.frameWidth : prop.width + 2) * scale;
  const height = (sprite ? sprite.frameHeight : prop.height + 2) * scale;
  // (For code-drawn props every branch comes to prop.x - scale.)
  let left;
  if (prop.edge === 'left') {
    left = prop.x - scale;
  } else if (prop.edge === 'right') {
    left = prop.x + prop.width * layout.scale + scale - width;
  } else {
    left = Math.round(prop.x + (prop.width * layout.scale - width) / 2);
  }
  const bottom = prop.baseY + scale;
  return { left, top: bottom - height, width, height, scale, sprite: Boolean(sprite) };
}

// The part of prop `id` worth clicking, in canvas pixels ({ left, top,
// width, height }), or null if the place has no such prop: for a sprite,
// the box around its first frame's visible pixels (leaving out clear
// margins); otherwise the whole prop.
export function propClickRect(layout, id) {
  const rect = propRect(layout, id);
  if (!rect || !rect.sprite) return rect;
  const sprite = getSprite(id);
  const probe = createLayer(sprite.frameWidth, sprite.frameHeight);
  probe.ctx.drawImage(sprite.image, 0, 0, sprite.frameWidth, sprite.frameHeight,
    0, 0, sprite.frameWidth, sprite.frameHeight);
  const { data } = probe.ctx.getImageData(0, 0, sprite.frameWidth, sprite.frameHeight);
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -1, -1];
  for (let y = 0; y < sprite.frameHeight; y++) {
    for (let x = 0; x < sprite.frameWidth; x++) {
      if (data[(y * sprite.frameWidth + x) * 4 + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return rect;
  return {
    left: rect.left + minX * rect.scale,
    top: rect.top + minY * rect.scale,
    width: (maxX - minX + 1) * rect.scale,
    height: (maxY - minY + 1) * rect.scale,
  };
}

// Draws prop `id` alone, as the scenery draws it (an animated sprite's
// frame `seconds` in), for its hover outline's silhouette. Returns the
// screen pixels per pixel of its art, or null if the place has no such
// prop or it's drawn by something else (the dock is part of the Lake's
// picture).
export function drawPropAlone(ctx, layout, id, seconds = 0) {
  const piece = SCENERY.find((candidate) => candidate.name === id);
  if (!piece || !layout.props[id]) return null;
  const sprite = getSprite(id);
  if (sprite) {
    piece.drawSprite(ctx, layout, sprite, isAnimated(sprite) ? frameAtTime(sprite, seconds) : 0);
    return scaleOf(layout, sprite);
  }
  if (piece.drawCode === NO_ART) return null;
  piece.drawCode(ctx, layout);
  return layout.scale;
}

// Which frame of prop `id`'s sprite shows `seconds` in (0 for a still
// one or a code-drawn prop).
export function propArtFrame(id, seconds) {
  const sprite = getSprite(id);
  return sprite && isAnimated(sprite) ? frameAtTime(sprite, seconds) : 0;
}

function placeProp(ctx, layout, sprite, frame, id) {
  const rect = propRect(layout, id);
  drawSprite(ctx, sprite, frame, rect.left, rect.top + rect.height, rect.scale);
}

// A backdrop above the ground line (sky, wall): its sprite is tiled
// across and upward from the ground line.
function backdrop(name, paint) {
  return {
    name,
    drawSprite: (ctx, layout, sprite, frame) => {
      const step = sprite.frameHeight * scaleOf(layout, sprite);
      for (let bottom = layout.groundY; bottom > 0; bottom -= step) {
        tileAcross(ctx, layout, sprite, frame, bottom);
      }
    },
    drawCode: (ctx, layout) => paintOnGrid(ctx, layout, paint),
  };
}

// A ground strip along the bottom (grass, floor): its sprite is tiled
// across the bottom of the window.
function ground(name, paint) {
  return {
    name,
    drawSprite: (ctx, layout, sprite, frame) => tileAcross(ctx, layout, sprite, frame, layout.height),
    drawCode: (ctx, layout) => paintOnGrid(ctx, layout, paint),
  };
}

// A prop (data/layout.js), placed by propRect().
function prop(name, drawCode) {
  return {
    name,
    drawSprite: (ctx, layout, sprite, frame) => placeProp(ctx, layout, sprite, frame, name),
    drawCode,
  };
}

// A whole background in one picture (the Lake, the Fortune Tree): its
// sprite is drawn from the window's bottom-left corner. Without the
// sprite, `drawCode` draws it, or (with `fallback`, a list of other
// pieces' names) those pieces are drawn in its place, each as usual.
function background(name, drawCode, fallback = null) {
  return {
    name,
    drawSprite: (ctx, layout, sprite, frame) => drawSprite(ctx, sprite, frame, 0, layout.height, scaleOf(layout, sprite)),
    drawCode,
    fallback,
  };
}

// The drawing of a prop that has no art of its own (the dock).
function NO_ART() {}

// Every scenery piece a place can show (data/places.js lists which, back
// to front). Each has its sprite name (see data/sprites.js), how to draw
// that sprite's frame, and the code-drawn fallback; or, for a live piece,
// drawLive(ctx, layout, seconds), drawn in code every frame.
const SCENERY = [
  backdrop('sky', drawSky),
  ground('grass', drawGround),
  prop('tree', drawTree),
  prop('parents.house', drawParentsHouse),
  prop('yard.sleepingBag', drawSleepingBag),
  prop('yard.tent', drawTent),
  prop('yard.house', drawHouse),
  backdrop('home.wall', drawWall),
  ground('home.floor', drawFloor),
  prop('home.window', drawHomeWindow),
  prop('home.door', drawHomeDoor),
  prop('home.sofa', drawSofa),
  background('lake', drawLake),
  { name: 'lake.shimmer', drawLive: drawShimmer },
  // Part of the Lake's background; only its click area and visit spot.
  prop(DOCK_PROP, NO_ART),
  // The Fortune Tree's picture; sky and grass without it.
  background(TREE_BACKGROUND, null, TREE_BACKGROUND_FALLBACK),
  prop(WELL_PROP, drawWell),
  // The Farm's picture; sky, grass and a code-drawn path and paddies
  // without it. The paddies are part of it: only their click areas and
  // the spots in front of them (the rice is drawn by ui/farm.js).
  background(FARM_BACKGROUND, null, FARM_BACKGROUND_FALLBACK),
  background('farm.ground', drawFarmGround),
  ...PADDIES.map((paddy) => prop(paddy.id, NO_ART)),
];

function createCanvas(layout) {
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  return canvas;
}

// Prepares `place`'s scenery for drawing every frame. Still pieces next
// to each other (code-drawn, or one-frame sprites) are drawn once onto a
// shared offscreen canvas; an animated sprite or a live piece is drawn
// every frame between them, so the order back to front stays the same.
// Call after loadSprites().
export function createScenery(layout, place) {
  const parts = [];
  let still = null;
  const add = (name) => {
    const piece = SCENERY.find((candidate) => candidate.name === name);
    if (!piece) return;
    if (piece.drawLive) {
      parts.push({ live: piece });
      still = null;
      return;
    }
    const sprite = getSprite(piece.name);
    if (!sprite && piece.fallback) {
      piece.fallback.forEach(add);
      return;
    }
    if (sprite && isAnimated(sprite)) {
      parts.push({ piece, sprite });
      still = null;
      return;
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
  };
  place.scenery.forEach(add);
  return {
    // Draws the scenery as it looks `seconds` in (for animated sprites
    // and live pieces).
    draw(ctx, seconds) {
      for (const part of parts) {
        if (part.canvas) {
          ctx.drawImage(part.canvas, 0, 0);
        } else if (part.live) {
          part.live.drawLive(ctx, layout, seconds);
        } else {
          part.piece.drawSprite(ctx, layout, part.sprite, frameAtTime(part.sprite, seconds));
        }
      }
    },
  };
}
