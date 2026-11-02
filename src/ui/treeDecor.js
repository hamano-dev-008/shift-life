// treeDecor.js — The Fortune Tree's falling golden leaves, its wind, and
// the glow and sparkles around a ready golden apple, purely visual: leaves
// drop from the canopy now and then, sway as they drift down, flutter,
// land on the grass and fade out; a rare one sparkles. Now and then a gust
// blows: the apple swings and falling leaves drift with it. A ready apple
// glows, pulsing, and flashes when picked. Nothing here is saved: the
// renderer makes a new one each time the Fortune Tree is shown and drops
// it elsewhere. Positions are in scene pixels from the window's top-left;
// ui/treeDecorArt.js works out the area (from the tree's drawn box) and
// draws it. No DOM here, so tests can run it.

import {
  LEAVES, APPLE_SPARKLES, WIND, APPLE_SWING, APPLE_GLOW,
} from '../data/fortuneTreeDecor.js';

function between([min, max], random) {
  return min + (max - min) * random();
}

// A fresh decoration: no leaves yet, the first one shortly; calm air,
// the first gust a little later; no flash.
export function createTreeDecor(random = Math.random) {
  return {
    leaves: [], nextIn: between(LEAVES.firstIn, random), wind: createWind(random), flashLeft: 0,
  };
}

// Calm air: no gust for WIND.firstGustIn seconds. `gustLeft` is what's
// left of the gust blowing (0 when calm), `direction` its way (-1 left,
// 1 right); `swinging` while the apple swings (during a gust, and until
// it's back on a center frame after), `swingTime` seconds into the swing.
export function createWind(random = Math.random) {
  return {
    calmLeft: between(WIND.firstGustIn, random), gustLeft: 0, direction: 1, swinging: false, swingTime: 0,
  };
}

// A gust starts now (or the one blowing starts over), WIND.gustLength
// seconds long, from a random side. Also the dev menu's "Gust now".
export function startGust(wind, random = Math.random) {
  wind.gustLeft = between(WIND.gustLength, random);
  wind.direction = random() < 0.5 ? -1 : 1;
  if (!wind.swinging) {
    wind.swinging = true;
    wind.swingTime = 0;
  }
}

export function isGusting(wind) {
  return wind.gustLeft > 0;
}

// The apple's frame now (APPLE_SWING.frames): center in calm air; during
// a gust center, right, center, left, over and over, every
// WIND.swingFrame seconds.
export function appleFrame(wind) {
  if (!wind.swinging) return 0;
  return Math.floor(wind.swingTime / WIND.swingFrame) % APPLE_SWING.frames.length;
}

// Moves the wind on by `dt` seconds: a gust blows out, then calm for
// WIND.gustEvery seconds, then the next gust. Once a gust is over the
// apple swings on until it's back on a center frame.
export function updateWind(wind, dt, random = Math.random) {
  if (wind.gustLeft > 0) {
    wind.gustLeft = Math.max(0, wind.gustLeft - dt);
    if (wind.gustLeft === 0) wind.calmLeft = between(WIND.gustEvery, random);
  } else if ((wind.calmLeft -= dt) <= 0) {
    startGust(wind, random);
  }
  if (!wind.swinging) return;
  wind.swingTime += dt;
  if (wind.gustLeft === 0 && APPLE_SWING.frames[appleFrame(wind)] === 'center') {
    wind.swinging = false;
    wind.swingTime = 0;
  }
}

// Scene pixels a second the wind pushes falling leaves sideways now.
export function windPush(wind) {
  return isGusting(wind) ? wind.direction * WIND.leafPush : 0;
}

// The apple was just picked (won or missed): its glow flashes, and the
// apple stays up until the flash is over.
export function flashApple(decor) {
  decor.flashLeft = APPLE_GLOW.flash.seconds;
}

// Whether the apple is still shown though it's been picked (flashing).
export function isFlashing(decor) {
  return decor.flashLeft > 0;
}

// Cells of a disc `radius` tree pixels around the apple's middle: [dx,
// dy] whole tree pixels from it (a cell spans dx to dx + 1), each whose
// middle is within the radius. Cached.
const discs = new Map();
export function glowDisc(radius) {
  if (discs.has(radius)) return discs.get(radius);
  const cells = [];
  const reach = Math.ceil(radius);
  for (let dy = -reach; dy < reach; dy++) {
    for (let dx = -reach; dx < reach; dx++) {
      if ((dx + 0.5) ** 2 + (dy + 0.5) ** 2 <= radius ** 2) cells.push([dx, dy]);
    }
  }
  discs.set(radius, cells);
  return cells;
}

// How bright the glow is `seconds` in: the pulse (APPLE_GLOW.pulse,
// between low and high and back every period, in steps), times the flash
// while `flashLeft` seconds of it are left (fading in steps).
export function glowLevel(seconds, flashLeft = 0) {
  const { period, low, high, steps } = APPLE_GLOW.pulse;
  const wave = (1 - Math.cos(((seconds % period) / period) * 2 * Math.PI)) / 2;
  let level = low + (high - low) * (Math.round(wave * (steps - 1)) / (steps - 1));
  if (flashLeft > 0) {
    const { seconds: length, boost, steps: flashSteps } = APPLE_GLOW.flash;
    const left = Math.ceil((Math.min(flashLeft, length) / length) * flashSteps) / flashSteps;
    level *= 1 + (boost - 1) * left;
  }
  return level;
}

// The glow's rings now, outermost first: [{ cells (glowDisc()), alpha }].
export function appleGlow(seconds, flashLeft = 0) {
  const level = glowLevel(seconds, flashLeft);
  return [...APPLE_GLOW.rings]
    .sort((a, b) => b.radius - a.radius)
    .map((ring) => ({ cells: glowDisc(ring.radius), alpha: Math.min(1, ring.alpha * level) }));
}

// A new leaf somewhere in `area.canopy` ({ left, right, top, bottom },
// scene pixels), landing on a row in LEAVES.landRows above the bottom of
// a window `area.rows` scene pixels tall.
function newLeaf(area, random) {
  const { canopy } = area;
  const x = between([canopy.left, canopy.right], random);
  const y = between([canopy.top, canopy.bottom], random);
  return {
    x,
    y,
    baseX: x,
    age: 0,
    speed: between(LEAVES.fallSpeed, random),
    swayAmplitude: between(LEAVES.sway.amplitude, random),
    swayPeriod: between(LEAVES.sway.period, random),
    // Start each sway somewhere different, so they don't move in step.
    swayPhase: random(),
    landY: area.rows - between(LEAVES.landRows, random),
    landed: false,
    fadeLeft: LEAVES.fade,
    sparkle: random() < LEAVES.sparkleChance,
  };
}

// Moves everything on by `dt` seconds in `area` ({ canopy, rows }): the
// wind; leaves fall and sway (drifting with a gust), land and fade, and a
// new one comes now and then (never more than LEAVES.max at once); a
// picked apple's flash fades.
export function updateTreeDecor(decor, dt, area, random = Math.random) {
  updateWind(decor.wind, dt, random);
  decor.flashLeft = Math.max(0, decor.flashLeft - dt);
  const push = windPush(decor.wind);
  for (const leaf of decor.leaves) {
    leaf.age += dt;
    if (leaf.landed) {
      leaf.fadeLeft -= dt;
      continue;
    }
    leaf.y = Math.min(leaf.landY, leaf.y + leaf.speed * dt);
    leaf.baseX += push * dt;
    const turn = leaf.age / leaf.swayPeriod + leaf.swayPhase;
    leaf.x = leaf.baseX + leaf.swayAmplitude * Math.sin(turn * 2 * Math.PI);
    if (leaf.y >= leaf.landY) leaf.landed = true;
  }
  decor.leaves = decor.leaves.filter((leaf) => leaf.fadeLeft > 0);
  decor.nextIn -= dt;
  if (decor.nextIn <= 0) {
    if (decor.leaves.length < LEAVES.max) decor.leaves.push(newLeaf(area, random));
    decor.nextIn = between(LEAVES.every, random);
  }
}

// How a leaf looks now: { col, row (its top-left, whole scene pixels),
// frame (0 or 1: fluttering while it falls, 0 once landed), opacity
// (1 while falling, then down in LEAVES.fadeSteps steps), glint (a
// sparkling leaf's glint is showing) }.
export function leafLook(leaf) {
  const frame = leaf.landed ? 0 : Math.floor(leaf.age / LEAVES.flutter) % 2;
  const opacity = leaf.landed
    ? Math.ceil((leaf.fadeLeft / LEAVES.fade) * LEAVES.fadeSteps) / LEAVES.fadeSteps
    : 1;
  const glint = leaf.sparkle && !leaf.landed && (leaf.age % LEAVES.sparkleEvery) < LEAVES.sparkleEvery / 2;
  return { col: Math.round(leaf.x), row: Math.round(leaf.y), frame, opacity, glint };
}

// Cheap deterministic noise in [0, 1), so sparkles land in the same
// spots every run.
function noise(a, b) {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// The sparkles around a ready apple `seconds` in: [{ dx, dy (whole scene
// pixels from the apple's middle), size (0 a dot, 1 a little cross),
// color }], only those showing now, each between `inner` (the apple's
// half size, so they're around it, not on it) and `inner` +
// APPLE_SPARKLES.radius scene pixels out. Each twinkles once per cycle (a
// dot, a cross, a dot), staggered, then shows up somewhere else.
export function appleSparkles(seconds, inner = 2) {
  const { count, radius, cycle, shine, colors } = APPLE_SPARKLES;
  const shown = [];
  for (let i = 0; i < count; i++) {
    const t = seconds / cycle + i / count;
    const round = Math.floor(t);
    const into = t - round;
    if (into >= shine) continue;
    const angle = noise(i, round) * 2 * Math.PI;
    const distance = inner + noise(round, i + 7) * radius;
    const step = Math.floor((into / shine) * 3);
    shown.push({
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance),
      size: step === 1 ? 1 : 0,
      color: colors[(i + round) % colors.length],
    });
  }
  return shown;
}
