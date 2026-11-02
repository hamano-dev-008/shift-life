// lakeLife.test.mjs — The Lake's wildlife: the click reward's real-time
// cooldown, the data (pads, area, reeds, the rare blue), frogs (on
// distinct pads, hopping only to a free pad, plopping and coming back,
// diving when the bobber lands near, ribbit on click) and butterflies
// (never more than the most, staying near their area, resting on reeds,
// fleeing when clicked), and the click boxes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { createWildlifeReward, rewardWildlifeClick } from '../src/game/lakeLife.js';
import {
  createLakeLife, updateLakeLife, bobberLanded, clickCritter, critterBoxes, addButterfly, croakNow, hopNow,
  pickButterflyColor,
} from '../src/ui/lakeLife.js';
import { LILY_PADS, FROGS, BUTTERFLIES, WILDLIFE_CLICK } from '../src/data/lakeLife.js';
import { LAKE_ART, BOBBER_SPOT } from '../src/data/lake.js';

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

// Runs the wildlife for `seconds` in 60fps frames.
function run(life, seconds, random) {
  for (let t = 0; t < seconds; t += 1 / 60) updateLakeLife(life, 1 / 60, random);
}

// A life with `count` frogs and no butterflies.
function withFrogs(count, random) {
  for (let seed = 1; seed < 200; seed++) {
    const life = createLakeLife(seeded(seed));
    if (life.frogs.length === count) {
      life.butterflies = [];
      return life;
    }
  }
  throw new Error('no life with that many frogs');
}

test('clicking wildlife gives +1 happiness at most once per real-time cooldown', () => {
  const game = startNewLife({ clock: createClock() });
  game.character.stats.happiness = 50;
  const reward = createWildlifeReward();
  assert.deepEqual(rewardWildlifeClick(game.character, reward, 1000), { happiness: WILDLIFE_CLICK.happiness });
  assert.deepEqual(rewardWildlifeClick(game.character, reward, 1500), {});
  assert.deepEqual(rewardWildlifeClick(game.character, reward, 1000 + WILDLIFE_CLICK.cooldownMs - 1), {});
  assert.deepEqual(rewardWildlifeClick(game.character, reward, 1000 + WILDLIFE_CLICK.cooldownMs), { happiness: 1 });
  assert.equal(game.character.stats.happiness, 52);
  // Spamming for a long while still only pays once per cooldown.
  for (let ms = 0; ms < 60000; ms += 100) rewardWildlifeClick(game.character, reward, 40000 + ms);
  assert.ok(game.character.stats.happiness <= 54);
  game.character.stats.happiness = 100;
  assert.deepEqual(rewardWildlifeClick(game.character, reward, 500000), {});
});

test('the data fits the picture: pads, the butterflies\' area, reeds, a rare blue', () => {
  for (const pad of LILY_PADS) {
    assert.ok(pad.left >= 0 && pad.right < LAKE_ART.width && pad.left <= pad.right);
    assert.ok(pad.row > 0 && pad.row < LAKE_ART.height);
  }
  const { area, reeds, colors } = BUTTERFLIES;
  assert.ok(area.left < area.right && area.right <= LAKE_ART.width && area.top < area.bottom);
  for (const reed of reeds) {
    assert.ok(reed.x >= area.left && reed.x <= area.right && reed.row >= area.top && reed.row <= area.bottom);
  }
  assert.deepEqual(colors.map((c) => c.id), ['white', 'yellow', 'orange', 'blue']);
  const random = seeded(9);
  const counts = {};
  for (let i = 0; i < 20000; i++) {
    const id = pickButterflyColor(random);
    counts[id] = (counts[id] ?? 0) + 1;
  }
  assert.ok(counts.blue > 0 && counts.blue / 20000 < 0.08, `blue ${counts.blue}`);
  assert.ok(counts.white > counts.blue * 3);
});

test('frogs sit on different pads, blink and croak, and stay on pads or under water', () => {
  for (let seed = 1; seed < 30; seed++) {
    const random = seeded(seed);
    const life = createLakeLife(random);
    assert.ok(life.frogs.length >= FROGS.count[0] && life.frogs.length <= FROGS.count[1]);
    assert.equal(new Set(life.frogs.map((f) => f.pad)).size, life.frogs.length);
    assert.ok(life.butterflies.length <= BUTTERFLIES.start[1]);
  }
  const random = seeded(4);
  const life = withFrogs(1, random);
  const [frog] = life.frogs;
  let blinked = false;
  let croaked = false;
  const states = new Set();
  for (let t = 0; t < 400; t += 1 / 30) {
    updateLakeLife(life, 1 / 30, random);
    blinked ||= frog.blinkLeft > 0;
    croaked ||= frog.state === 'croak';
    states.add(frog.state);
    if (frog.state === 'sit') {
      assert.ok(LILY_PADS.some((pad) => frog.row === pad.row && frog.x === (pad.left + pad.right + 1) / 2));
    }
  }
  assert.ok(blinked && croaked);
  assert.ok(states.has('hop') || states.has('under'), [...states].join());
});

test('a frog hops only to a free pad, else on the spot; plopped frogs come back on a free pad', () => {
  const random = seeded(2);
  const two = withFrogs(2, random);
  const [a, b] = two.frogs;
  const padA = a.pad;
  hopNow(two, random);
  assert.equal(a.state, 'hop');
  assert.equal(a.hop.toPad, padA);
  run(two, FROGS.inPlaceHop.seconds + 0.1, random);
  assert.equal(a.pad, padA);
  assert.notEqual(a.pad, b.pad);

  const one = withFrogs(1, random);
  const [frog] = one.frogs;
  const from = frog.pad;
  hopNow(one, random);
  assert.notEqual(frog.hop.toPad, from);
  // Mid-hop it's in the air above the line between the pads.
  run(one, FROGS.hop.seconds / 2, random);
  assert.ok(frog.row < Math.min(...LILY_PADS.map((p) => p.row)));
  run(one, FROGS.hop.seconds / 2 + 0.1, random);
  assert.equal(frog.state, 'sit');
  assert.notEqual(frog.pad, from);

  // Under water it frees its pad, then comes up on a free one.
  bobberLanded(one, frog.x);
  assert.equal(frog.state, 'under');
  assert.equal(frog.pad, null);
  assert.ok(one.effects.some((e) => e.kind === 'ripple') && one.effects.some((e) => e.kind === 'splash'));
  run(one, FROGS.underwater[1] + 1, random);
  assert.ok(frog.state !== 'under' || frog.moveIn > 0);
});

test('the bobber landing near a frog makes it dive; far away it stays', () => {
  const random = seeded(5);
  const life = withFrogs(2, random);
  const near = life.frogs.find((f) => Math.abs(f.x - BOBBER_SPOT.x) <= FROGS.scare);
  const far = life.frogs.find((f) => f !== near);
  assert.ok(near, 'the left pad is near where the bobber lands');
  assert.equal(bobberLanded(life, BOBBER_SPOT.x, random), 1);
  assert.equal(near.state, 'under');
  assert.equal(far.state, 'sit');
  assert.equal(bobberLanded(life, BOBBER_SPOT.x, random), 0);
});

test('clicking: a frog says ribbit and hops, a butterfly flees and is gone', () => {
  const random = seeded(8);
  const life = withFrogs(1, random);
  const [frog] = life.frogs;
  const reaction = clickCritter(life, frog.id, random);
  assert.equal(reaction.kind, 'frog');
  assert.equal(reaction.text, 'ribbit!');
  assert.equal(frog.state, 'hop');
  assert.equal(clickCritter(life, frog.id, random), null);

  const butterfly = addButterfly(life, random, 'yellow', true);
  assert.equal(clickCritter(life, butterfly.id, random).kind, 'butterfly');
  assert.equal(butterfly.state, 'flee');
  assert.equal(clickCritter(life, butterfly.id, random), null);
  run(life, 20, random);
  assert.ok(!life.butterflies.includes(butterfly));
  assert.equal(clickCritter(life, 9999, random), null);
});

test('butterflies: never more than the most, near their area, resting on reeds, leaving', () => {
  const random = seeded(12);
  const life = createLakeLife(random);
  life.frogs = [];
  const { area, max } = BUTTERFLIES;
  let landed = false;
  let most = 0;
  let seen = 0;
  const ids = new Set();
  for (let t = 0; t < 900; t += 1 / 20) {
    updateLakeLife(life, 1 / 20, random);
    most = Math.max(most, life.butterflies.length);
    for (const b of life.butterflies) {
      ids.add(b.id);
      if (b.state === 'land') {
        landed = true;
        assert.ok(BUTTERFLIES.reeds.some((reed) => reed.x === b.x && reed.row === b.row));
      }
      if (b.state === 'wander' && b.x > area.left) {
        assert.ok(b.row > area.top - 8 && b.row < area.bottom + 8, `row ${b.row}`);
      }
    }
    seen = ids.size;
  }
  assert.ok(most <= max);
  assert.ok(landed, 'one rested on a reed');
  assert.ok(seen > max, 'they come and go');
  // Spawning by hand respects the most too, and can pick the rare blue.
  life.butterflies = [];
  assert.equal(addButterfly(life, random, 'blue').color, 'blue');
  addButterfly(life, random);
  addButterfly(life, random);
  assert.equal(addButterfly(life, random), null);
});

test('dev: croak and hop need a frog on a pad; click boxes are generous', () => {
  const random = seeded(3);
  const life = withFrogs(1, random);
  const [frog] = life.frogs;
  assert.equal(croakNow(life), true);
  assert.equal(frog.state, 'croak');
  run(life, FROGS.croakFrame * 3 + 0.1, random);
  assert.equal(frog.state, 'sit');
  const [box] = critterBoxes(life);
  assert.equal(box.kind, 'frog');
  assert.ok(box.right - box.left >= 4 + WILDLIFE_CLICK.hitPadding * 2);
  assert.ok(box.left < frog.x && box.right > frog.x && box.bottom > frog.row - 1);
  bobberLanded(life, frog.x, random);
  assert.equal(croakNow(life), false);
  assert.equal(hopNow(life, random), null);
  assert.deepEqual(critterBoxes(life), []);
});
