// treeDecor.test.mjs — The Fortune Tree's decoration: golden leaves come
// now and then (never more than the most), start in the canopy, sway and
// fall, land on the grass and fade out in steps, flutter between two
// frames, and a rare one sparkles; the sparkles around a ready apple stay
// around it and twinkle in turn; the wind (calm, gusts now and then, the
// apple swinging through its frames and settling, leaves drifting with
// a gust); the apple's glow (pixel rings, strongest near the apple,
// pulsing, flashing when picked); the well is a prop left of the tree that
// the character never wanders to; the place's scenery and sprites.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createTreeDecor, updateTreeDecor, leafLook, appleSparkles, createWind, updateWind, startGust, isGusting,
  appleFrame, windPush, flashApple, isFlashing, glowDisc, glowLevel, appleGlow,
} from '../src/ui/treeDecor.js';
import {
  LEAVES, APPLE_SPARKLES, WELL, WELL_PROP, WELL_TEXT, TREE_BACKGROUND, TREE_BACKGROUND_FALLBACK,
  WIND, APPLE_SWING, APPLE_GLOW,
} from '../src/data/fortuneTreeDecor.js';
import { PROPS } from '../src/data/layout.js';
import { PLACES } from '../src/data/places.js';
import { SPRITES } from '../src/data/sprites.js';

// A repeatable random number generator (mulberry32).
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A canopy in scene pixels, in an 80-row window.
const AREA = { canopy: { left: 30, right: 70, top: 20, bottom: 45 }, rows: 80 };
const DT = 1 / 30;

test('leaves come every few seconds, never more than the most at once', () => {
  const random = seeded(1);
  const decor = createTreeDecor(random);
  assert.equal(decor.leaves.length, 0);
  let most = 0;
  let spawned = 0;
  let last = 0;
  for (let t = 0; t < 600; t += DT) {
    updateTreeDecor(decor, DT, AREA, random);
    if (decor.leaves.length > last) spawned += decor.leaves.length - last;
    last = decor.leaves.length;
    most = Math.max(most, decor.leaves.length);
  }
  assert.ok(most <= LEAVES.max, `${most} at once`);
  assert.ok(most >= 2);
  const [min, max] = LEAVES.every;
  assert.ok(spawned >= 600 / max * 0.8 && spawned <= 600 / min, `${spawned} in 10 minutes`);
});

test('a leaf starts in the canopy, sways as it drifts down, lands on the grass and fades out', () => {
  const random = seeded(5);
  const decor = createTreeDecor(random);
  while (!decor.leaves.length) updateTreeDecor(decor, DT, AREA, random);
  const leaf = decor.leaves[0];
  const { canopy } = AREA;
  assert.ok(leaf.y >= canopy.top && leaf.y <= canopy.bottom);
  assert.ok(leaf.baseX >= canopy.left && leaf.baseX <= canopy.right);
  const [lowRow, highRow] = LEAVES.landRows;
  assert.ok(leaf.landY >= AREA.rows - highRow && leaf.landY <= AREA.rows - lowRow);

  let lastY = leaf.y;
  const xs = [];
  const frames = new Set();
  while (!leaf.landed) {
    updateTreeDecor(decor, DT, AREA, random);
    assert.ok(leaf.y >= lastY, 'never rises');
    assert.ok(leaf.y - lastY <= LEAVES.fallSpeed[1] * DT + 1e-9, 'slow and gentle');
    lastY = leaf.y;
    xs.push(leaf.x);
    frames.add(leafLook(leaf).frame);
    assert.equal(leafLook(leaf).opacity, 1);
  }
  assert.equal(leaf.y, leaf.landY);
  assert.deepEqual([...frames].sort(), [0, 1], 'flutters between two frames');
  const swing = Math.max(...xs) - Math.min(...xs);
  assert.ok(swing > 1 && swing <= 2 * LEAVES.sway.amplitude[1] + 1e-9, `sways ${swing}`);

  // Lying on the grass: frame 0, fading in steps, then gone.
  const landedX = leaf.x;
  const opacities = new Set();
  while (decor.leaves.includes(leaf)) {
    const look = leafLook(leaf);
    assert.equal(look.frame, 0);
    assert.equal(look.glint, false);
    assert.equal(leaf.x, landedX);
    opacities.add(look.opacity);
    updateTreeDecor(decor, DT, AREA, random);
  }
  assert.ok(opacities.size >= 2 && opacities.size <= LEAVES.fadeSteps);
  assert.ok([...opacities].every((o) => o > 0 && o <= 1));
});

test('about one leaf in ten sparkles, and only as it falls', () => {
  const random = seeded(9);
  const decor = createTreeDecor(random);
  const seen = new Set();
  for (let t = 0; t < 3600; t += 0.1) {
    updateTreeDecor(decor, 0.1, AREA, random);
    decor.leaves.forEach((leaf) => seen.add(leaf));
  }
  const share = [...seen].filter((leaf) => leaf.sparkle).length / seen.size;
  assert.ok(seen.size > 400);
  assert.ok(share > LEAVES.sparkleChance / 2 && share < LEAVES.sparkleChance * 2, `${share}`);
  const sparkler = { ...[...seen].find((leaf) => leaf.sparkle), landed: false, age: 0 };
  assert.equal(leafLook(sparkler).glint, true);
  assert.equal(leafLook({ ...sparkler, landed: true }).glint, false);
});

test('apple sparkles stay around the apple, not on it, and twinkle in turn', () => {
  const inner = 5;
  let most = 0;
  const shown = new Set();
  for (let t = 0; t < 30; t += 0.05) {
    const sparkles = appleSparkles(t, inner);
    most = Math.max(most, sparkles.length);
    for (const { dx, dy, size, color } of sparkles) {
      const distance = Math.hypot(dx, dy);
      assert.ok(distance >= inner - 1 && distance <= inner + APPLE_SPARKLES.radius + 1, `${dx},${dy}`);
      assert.ok(size === 0 || size === 1);
      assert.ok(APPLE_SPARKLES.colors.includes(color));
      shown.add(`${dx},${dy}`);
    }
  }
  assert.ok(most >= 1 && most <= APPLE_SPARKLES.count);
  assert.ok(shown.size > APPLE_SPARKLES.count, 'they move about');
  assert.deepEqual(appleSparkles(12.3, inner), appleSparkles(12.3, inner), 'the same every run');
});

test('the well: a clickable prop left of the tree, never visited; the scenery and sprite names', () => {
  const well = PROPS[WELL_PROP];
  assert.equal(well.edge, 'left');
  assert.equal(well.visit, false);
  assert.equal(well.width, WELL.width);
  assert.equal(well.height, WELL.height);
  // Its right edge (with the outline) is left of the code-drawn tree's.
  const windowColumns = Math.floor(320 / 3);
  const treeLeft = Math.floor((windowColumns - PROPS.tree.width) / 2) - 1;
  assert.ok(well.margin + well.width + 1 < treeLeft);
  assert.equal(PROPS.tree.visit, undefined);

  const place = PLACES.find((candidate) => candidate.id === 'fortuneTree');
  assert.deepEqual(place.scenery, [TREE_BACKGROUND, WELL_PROP, 'tree']);
  assert.equal(place.targets[WELL_PROP], WELL_TEXT.title);
  assert.equal(place.targets.tree, 'Fortune Tree');
  assert.deepEqual(TREE_BACKGROUND_FALLBACK, ['sky', 'grass']);
  assert.equal(WELL_TEXT.bubble, 'A coin for luck? Coming soon!');
  assert.equal(SPRITES['fortuneTree.leaf'].frames, 2);
  assert.equal(SPRITES[TREE_BACKGROUND].frames, 1);
});

test('the wind: calm, a gust every 10-25 s lasting 2-4 s; the apple swings only in a gust', () => {
  assert.deepEqual(WIND.gustEvery, [10, 25]);
  assert.deepEqual(WIND.gustLength, [2, 4]);
  assert.deepEqual(APPLE_SWING.frames, ['center', 'right', 'center', 'left']);
  const random = seeded(3);
  const wind = createWind(random);
  let t = 0;
  let calmSince = 0;
  let gustSince = null;
  const calms = [];
  const gusts = [];
  let first = null;
  for (; t < 600; t += DT) {
    const was = isGusting(wind);
    updateWind(wind, DT, random);
    if (!was && isGusting(wind)) {
      first ??= t;
      if (calms.length || first !== t) calms.push(t - calmSince);
      gustSince = t;
    } else if (was && !isGusting(wind)) {
      gusts.push(t - gustSince);
      calmSince = t;
    }
    if (!wind.swinging) assert.equal(appleFrame(wind), 0, 'center in calm air');
  }
  assert.ok(first >= WIND.firstGustIn[0] - DT && first <= WIND.firstGustIn[1] + DT);
  assert.ok(gusts.length >= 15, `${gusts.length} gusts in 10 minutes`);
  for (const length of gusts) assert.ok(length >= 2 - 2 * DT && length <= 4 + 2 * DT, `gust ${length}`);
  for (const calm of calms.slice(1)) assert.ok(calm >= 10 - 2 * DT && calm <= 25 + 2 * DT, `calm ${calm}`);
});

test('in a gust the apple swings center, right, center, left every 0.3 s, then settles on center', () => {
  const wind = createWind(() => 0.99);
  assert.equal(appleFrame(wind), 0);
  startGust(wind, () => 0); // the shortest gust, 2 s
  assert.equal(isGusting(wind), true);
  const seen = [];
  let t = 0;
  while (isGusting(wind)) {
    seen.push(appleFrame(wind));
    updateWind(wind, DT, () => 0.5);
    t += DT;
  }
  const order = seen.filter((frame, i) => i === 0 || frame !== seen[i - 1]);
  assert.deepEqual(order.slice(0, 5), [0, 1, 2, 3, 0]);
  const perFrame = seen.filter((frame, i) => i < seen.indexOf(1) + 30 && frame === 1).length * DT;
  assert.ok(Math.abs(perFrame - WIND.swingFrame) < 2 * DT, `${perFrame}s per frame`);
  // Settles back on a center frame within one frame's time.
  let settle = 0;
  while (wind.swinging) {
    updateWind(wind, DT, () => 0.5);
    settle += DT;
  }
  assert.ok(settle <= WIND.swingFrame + DT);
  assert.equal(appleFrame(wind), 0);
  for (let i = 0; i < 30; i++) {
    updateWind(wind, DT, () => 0.5);
    assert.equal(appleFrame(wind), 0);
  }
});

test('a gust blows falling leaves sideways its way; landed leaves stay put', () => {
  const random = seeded(9);
  const decor = createTreeDecor(random);
  while (!decor.leaves.length) updateTreeDecor(decor, DT, AREA, random);
  const leaf = decor.leaves[0];
  decor.wind.calmLeft = 999;
  const calmBase = leaf.baseX;
  updateTreeDecor(decor, DT, AREA, random);
  assert.equal(leaf.baseX, calmBase, 'no drift in calm air');
  for (const [roll, way] of [[0.9, 1], [0.1, -1]]) {
    startGust(decor.wind, () => roll);
    assert.equal(windPush(decor.wind), way * WIND.leafPush);
    const before = leaf.baseX;
    updateTreeDecor(decor, 0.5, AREA, random);
    if (!leaf.landed) assert.ok(Math.abs(leaf.baseX - before - way * WIND.leafPush * 0.5) < 1e-9);
  }
});

test('the glow: pixel rings, strongest near the apple, pulsing about every 2 s', () => {
  assert.equal(APPLE_GLOW.color, '#ffe26e');
  const rings = appleGlow(0);
  assert.equal(rings.length, APPLE_GLOW.rings.length);
  // Outermost first, each a disc of whole cells, symmetric around the
  // apple's middle.
  for (let i = 1; i < rings.length; i++) assert.ok(rings[i].cells.length < rings[i - 1].cells.length);
  for (const ring of rings) {
    assert.ok(ring.alpha > 0 && ring.alpha < 1);
    const keys = new Set(ring.cells.map(([dx, dy]) => `${dx},${dy}`));
    for (const [dx, dy] of ring.cells) {
      assert.ok(Number.isInteger(dx) && Number.isInteger(dy));
      assert.ok(keys.has(`${-dx - 1},${dy}`) && keys.has(`${dx},${-dy - 1}`));
    }
  }
  // Every ring covers the cells by the apple; only the outer one the edge.
  const alphaAt = (dx, dy) => rings.filter((ring) => ring.cells.some(([x, y]) => x === dx && y === dy))
    .reduce((sum, ring) => sum + ring.alpha, 0);
  assert.ok(alphaAt(0, 0) > alphaAt(5, 0));
  assert.ok(alphaAt(5, 0) > alphaAt(7, 0));
  assert.ok(alphaAt(7, 0) > 0);
  assert.equal(alphaAt(9, 0), 0);
  assert.ok(glowDisc(5).every(([dx, dy]) => (dx + 0.5) ** 2 + (dy + 0.5) ** 2 <= 25));

  // The pulse: dim and bright and back every period, in a few steps.
  const { period, low, high, steps } = APPLE_GLOW.pulse;
  assert.equal(period, 2);
  const levels = new Set();
  for (let t = 0; t < period; t += 0.01) levels.add(glowLevel(t).toFixed(6));
  assert.ok(levels.size >= 3 && levels.size <= steps);
  assert.equal(glowLevel(0), low);
  assert.ok(Math.abs(glowLevel(period / 2) - high) < 1e-9);
  assert.equal(glowLevel(0.3), glowLevel(0.3 + period));
});

test('picking flashes the glow brightly, then the apple goes', () => {
  const decor = createTreeDecor(() => 0.5);
  assert.equal(isFlashing(decor), false);
  flashApple(decor);
  assert.equal(isFlashing(decor), true);
  assert.ok(glowLevel(0, decor.flashLeft) > 2 * glowLevel(0));
  assert.ok(glowLevel(0, decor.flashLeft) > glowLevel(0, APPLE_GLOW.flash.seconds / 4));
  let t = 0;
  while (isFlashing(decor)) {
    updateTreeDecor(decor, DT, AREA, () => 0.5);
    t += DT;
  }
  assert.ok(Math.abs(t - APPLE_GLOW.flash.seconds) < 2 * DT);
  assert.equal(glowLevel(0, decor.flashLeft), glowLevel(0));
});

test('the golden apple sprite: 4 frames of 8 x 6, at the tree scale', () => {
  assert.deepEqual(SPRITES.goldenApple, { frames: 4, frameWidth: 8 });
  assert.equal(SPRITES.goldenApple.scale, undefined);
  const png = readFileSync(new URL('../assets/sprites/goldenApple.png', import.meta.url));
  assert.equal(png.readUInt32BE(16), 4 * 8);
  assert.equal(png.readUInt32BE(20), 6);
});
