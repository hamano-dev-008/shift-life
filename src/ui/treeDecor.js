// treeDecor.js — The Fortune Tree's falling golden leaves and the
// sparkles around a ready golden apple, purely visual: leaves drop from
// the canopy now and then, sway as they drift down, flutter, land on the
// grass and fade out; a rare one sparkles. Nothing here is saved: the
// renderer makes a new one each time the Fortune Tree is shown and drops
// it elsewhere. Positions are in scene pixels from the window's top-left;
// ui/treeDecorArt.js works out the area (from the tree's drawn box) and
// draws it. No DOM here, so tests can run it.

import { LEAVES, APPLE_SPARKLES } from '../data/fortuneTreeDecor.js';

function between([min, max], random) {
  return min + (max - min) * random();
}

// A fresh decoration: no leaves yet, the first one shortly.
export function createTreeDecor(random = Math.random) {
  return { leaves: [], nextIn: between(LEAVES.firstIn, random) };
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

// Moves everything on by `dt` seconds in `area` ({ canopy, rows }):
// leaves fall and sway, land and fade, and a new one comes now and then
// (never more than LEAVES.max at once).
export function updateTreeDecor(decor, dt, area, random = Math.random) {
  for (const leaf of decor.leaves) {
    leaf.age += dt;
    if (leaf.landed) {
      leaf.fadeLeft -= dt;
      continue;
    }
    leaf.y = Math.min(leaf.landY, leaf.y + leaf.speed * dt);
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
