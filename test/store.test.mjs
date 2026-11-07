// store.test.mjs — The 6-Eleven in town: reached from Go to like the Cafe
// (never a shortcut, its door back to where they came from), walls on
// both sides, its door where the picture has it, and the picture's
// numbers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView, routeBetween, existingPlaces, exitBetween, enterPlace } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import { workplaceAt } from '../src/game/shifts.js';
import {
  STORE_PLACE, STORE_ART, STORE_DOOR, STORE_DOOR_PROP, STORE_COUNTER, STORE_COUNTER_PROP, STORE_WALK,
  STORE_FRONT, STORE_SIDEWALK, STORE_SIGN, STORE_BROWSE, STORE_PAY_X, STORE_JOB, STORE_FEET_FROM_BOTTOM,
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
