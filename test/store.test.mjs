// store.test.mjs — The 6-Eleven in town: reached from Go to like the Cafe
// (never a shortcut, its door back to where they came from), walls on
// both sides, its door where the picture has it, and the picture's
// numbers; the clerk, shoppers and pigeon.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView, routeBetween, existingPlaces, exitBetween, enterPlace } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import { workplaceAt } from '../src/game/shifts.js';
import {
  createStoreLife, updateStoreLife, clickStoreCritter, storeBoxes,
} from '../src/ui/storeLife.js';
import {
  STORE_PLACE, STORE_ART, STORE_DOOR, STORE_DOOR_PROP, STORE_COUNTER, STORE_COUNTER_PROP, STORE_WALK,
  STORE_FRONT, STORE_SIDEWALK, STORE_SIGN, STORE_BROWSE, STORE_PAY_X, STORE_JOB, STORE_FEET_FROM_BOTTOM,
  STORE_SHOPPERS, STORE_CLERK, STORE_PIGEON,
} from '../src/data/store.js';
import { CAFE_PLACE } from '../src/data/cafe.js';
import { INDOOR_PLACES } from '../src/data/weather.js';
import { SCENE_SCALE } from '../src/data/layout.js';
import { JOBS } from '../src/data/jobs.js';

const W = 320;
const H = 240;

function lifeAt(age, place = 'fortuneTree') {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.5;
  if (age >= 18) game.housing.movedOut = true;
  game.place = place;
  return game;
}

test('the 6-Eleven is in town: one step from every outdoor place, never on the way, not a step from the Cafe', () => {
  const game = lifeAt(30);
  assert.ok(existingPlaces(game).some((place) => place.id === STORE_PLACE));
  assert.deepEqual(routeBetween(game, 'farm', STORE_PLACE), [STORE_PLACE]);
  assert.deepEqual(routeBetween(game, 'lake', 'farm'), ['fortuneTree', 'myYard', 'farm']);
  // Town to town goes out the door first.
  const route = routeBetween(game, CAFE_PLACE, STORE_PLACE);
  assert.equal(route.length, 2);
  assert.equal(route.at(-1), STORE_PLACE);
  assert.equal(exitBetween(game, 'fortuneTree', STORE_PLACE).via, 'town');
  assert.ok(placeView(game, STORE_PLACE).exits.every((exit) => exit.via === STORE_DOOR_PROP));
  enterPlace(game, 'lake');
  enterPlace(game, STORE_PLACE);
  assert.equal(placeView(game, STORE_PLACE).exits[0].to, 'lake', 'the door leads back where they came from');
  assert.ok(INDOOR_PLACES.includes(STORE_PLACE));
});

test('the 6-Eleven layout: walls both sides, feet on the floor, the door inside the walls', () => {
  const layout = computeLayout(W, H, placeView(lifeAt(30, STORE_PLACE), STORE_PLACE));
  assert.deepEqual(layout.openSides, { left: false, right: false });
  assert.equal(layout.feetY, H - STORE_FEET_FROM_BOTTOM * SCENE_SCALE);
  assert.equal(layout.wanderMinX, STORE_WALK.minX * SCENE_SCALE);
  const door = layout.props[STORE_DOOR_PROP];
  assert.ok(Math.abs(door.visitX / SCENE_SCALE - STORE_DOOR.x) <= 1);
  assert.ok(Math.abs(layout.props[STORE_COUNTER_PROP].visitX / SCENE_SCALE - STORE_COUNTER.flap) <= 1);
});

test('the picture: the door in the glass front, the sidewalk below it, the sign over the counter, browsing in reach', () => {
  const inside = (x, row) => x >= 0 && x < STORE_ART.width && row >= 0 && row < STORE_ART.height;
  assert.ok(STORE_DOOR.left >= STORE_FRONT.left && STORE_DOOR.right <= STORE_FRONT.right);
  assert.ok(STORE_SIDEWALK.row > STORE_FRONT.top && STORE_SIDEWALK.row < STORE_FRONT.bottom);
  assert.ok(STORE_SIGN.left >= STORE_COUNTER.left - 2 && STORE_SIGN.right < STORE_ART.width - 1, 'the sign fits');
  assert.ok(STORE_COUNTER.behindRow > STORE_COUNTER.top && STORE_COUNTER.behindRow < STORE_ART.height - STORE_FEET_FROM_BOTTOM);
  for (const x of [...STORE_BROWSE, STORE_PAY_X]) {
    assert.ok(inside(x, 0) && x >= STORE_WALK.minX && x <= STORE_WALK.maxX, `${x}`);
  }
  assert.ok(STORE_PAY_X < STORE_COUNTER.left + 15 && STORE_PAY_X > STORE_COUNTER.left, 'paying in front of the register');
});

test('the Shop job works at the 6-Eleven', () => {
  assert.ok(JOBS.some((job) => job.id === STORE_JOB));
  assert.equal(workplaceAt(STORE_PLACE).job, STORE_JOB);
});

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

test('shoppers come in to a chime, browse, pay one at a time while the clerk scans, and leave to a chime', () => {
  const random = seeded(4);
  const life = createStoreLife(random);
  const steps = new Set();
  const clerkStates = new Set();
  let chimes = 0;
  let visitors = 0;
  const seen = new Set();
  for (let t = 0; t < 1500; t += 1 / 20) {
    updateStoreLife(life, 1 / 20, random);
    chimes += life.chimes.length;
    life.chimes = [];
    clerkStates.add(life.clerk.state);
    assert.equal(life.clerk.x, STORE_COUNTER.clerkX, 'the clerk stays at the register');
    assert.ok(life.shoppers.length <= STORE_SHOPPERS.max);
    const paying = life.shoppers.filter((shopper) => shopper.step === 'pay');
    assert.ok(paying.length <= 1, 'two paying at once');
    if (paying.length) {
      assert.equal(paying[0].x, STORE_PAY_X);
      assert.equal(life.clerk.state, 'scan');
    }
    for (const shopper of life.shoppers) {
      steps.add(shopper.step);
      if (!seen.has(shopper.id)) {
        seen.add(shopper.id);
        visitors += 1;
      }
      if (shopper.step === 'browse') assert.ok(STORE_BROWSE.includes(shopper.x));
      assert.ok(shopper.x >= STORE_WALK.minX && shopper.x <= STORE_WALK.maxX);
    }
  }
  assert.deepEqual([...steps].sort(), ['browse', 'browsing', 'out', 'pay', 'paying']);
  assert.deepEqual([...clerkStates].sort(), ['idle', 'scan', 'yawn']);
  const left = visitors - life.shoppers.length;
  assert.ok(visitors >= 10, `${visitors} came`);
  assert.equal(chimes, visitors + left, 'a chime each way');
});

test('the pigeon pecks about the sidewalk; clicked it coos, flies off, and walks back in later', () => {
  const random = seeded(8);
  const life = createStoreLife(random);
  const states = new Set();
  for (let t = 0; t < 120; t += 1 / 20) {
    updateStoreLife(life, 1 / 20, random);
    states.add(life.pigeon.state);
    assert.ok(life.pigeon.x >= STORE_SIDEWALK.left - 4 && life.pigeon.x <= STORE_SIDEWALK.right);
  }
  assert.ok(states.has('walk') && states.has('peck'), [...states].join());
  life.pigeon.state = 'idle';
  const said = clickStoreCritter(life, 'pigeon', random);
  assert.equal(said.text, STORE_PIGEON.line);
  assert.equal(life.pigeon.state, 'fly');
  assert.equal(clickStoreCritter(life, 'pigeon', random), null, 'already off');
  assert.ok(!storeBoxes(life).some((box) => box.id === 'pigeon'));
  for (let t = 0; t < 3 && life.pigeon.state === 'fly'; t += 1 / 20) updateStoreLife(life, 1 / 20, random);
  assert.equal(life.pigeon.state, 'away');
  for (let t = 0; t < STORE_PIGEON.returnIn[1] + 1 && life.pigeon.state === 'away'; t += 1 / 20) updateStoreLife(life, 1 / 20, random);
  assert.notEqual(life.pigeon.state, 'away', 'came back');
  assert.ok(storeBoxes(life).some((box) => box.id === 'pigeon'));
  const clerk = clickStoreCritter(life, 'clerk', random);
  assert.ok(STORE_CLERK.lines.includes(clerk.text));
  const box = storeBoxes(life).find((b) => b.id === 'clerk');
  assert.ok(box.bottom <= STORE_COUNTER.top + 1);
});
