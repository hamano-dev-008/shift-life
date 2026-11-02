// treeDecor.test.mjs — The Fortune Tree's decoration: golden leaves come
// now and then (never more than the most), start in the canopy, sway and
// fall, land on the grass and fade out in steps, flutter between two
// frames, and a rare one sparkles; the sparkles around a ready apple stay
// around it and twinkle in turn; the well is a prop left of the tree that
// the character never wanders to; the place's scenery and sprites.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTreeDecor, updateTreeDecor, leafLook, appleSparkles,
} from '../src/ui/treeDecor.js';
import {
  LEAVES, APPLE_SPARKLES, WELL, WELL_PROP, WELL_TEXT, TREE_BACKGROUND, TREE_BACKGROUND_FALLBACK,
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
