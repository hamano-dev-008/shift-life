// post.test.mjs — Pedal Post in town: reached from Go to like the Cafe and
// the 6-Eleven (never a shortcut, its door back to where they came
// from), walls on both sides, its door and counter where the picture has
// them, and the picture's numbers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView, routeBetween, existingPlaces, exitBetween, enterPlace } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import {
  POST_PLACE, POST_ART, POST_DOOR, POST_DOOR_PROP, POST_COUNTER, POST_COUNTER_PROP, POST_WALK, POST_SIGN,
  POST_CARGO_BIKE, POST_DOG_BED, POST_HAND_IN_X, POST_PILE_X, POST_FEET_FROM_BOTTOM, POST_JOB,
} from '../src/data/post.js';
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

test('Pedal Post is in town: one step from every outdoor place, never on the way, the door back', () => {
  const game = lifeAt(30);
  assert.ok(existingPlaces(game).some((place) => place.id === POST_PLACE));
  assert.deepEqual(routeBetween(game, 'lake', POST_PLACE), [POST_PLACE]);
  assert.deepEqual(routeBetween(game, 'lake', 'farm'), ['fortuneTree', 'myYard', 'farm']);
  assert.equal(exitBetween(game, 'farm', POST_PLACE).via, 'town');
  assert.ok(placeView(game, POST_PLACE).exits.every((exit) => exit.via === POST_DOOR_PROP));
  enterPlace(game, 'farm');
  enterPlace(game, POST_PLACE);
  assert.equal(placeView(game, POST_PLACE).exits[0].to, 'farm');
  assert.ok(INDOOR_PLACES.includes(POST_PLACE));
  assert.ok(JOBS.some((job) => job.id === POST_JOB));
});

test('the Pedal Post layout and picture: walls both sides, the door and counter, everything inside', () => {
  const layout = computeLayout(W, H, placeView(lifeAt(30, POST_PLACE), POST_PLACE));
  assert.deepEqual(layout.openSides, { left: false, right: false });
  assert.equal(layout.feetY, H - POST_FEET_FROM_BOTTOM * SCENE_SCALE);
  assert.ok(Math.abs(layout.props[POST_DOOR_PROP].visitX / SCENE_SCALE - POST_DOOR.x) <= 1);
  assert.ok(Math.abs(layout.props[POST_COUNTER_PROP].visitX / SCENE_SCALE - POST_COUNTER.flap) <= 1);
  const feetRow = POST_ART.height - POST_FEET_FROM_BOTTOM;
  assert.ok(POST_COUNTER.behindRow > POST_COUNTER.top && POST_COUNTER.behindRow < feetRow);
  for (const x of [POST_DOOR.x, POST_CARGO_BIKE.x, POST_DOG_BED.x, POST_HAND_IN_X, POST_PILE_X]) {
    assert.ok(x >= POST_WALK.minX && x <= POST_WALK.maxX, `${x}`);
  }
  assert.ok(POST_HAND_IN_X > POST_COUNTER.left && POST_HAND_IN_X < POST_COUNTER.dispatcherX);
  assert.ok(POST_SIGN.top >= 8, 'the sign clears the top bar');
  assert.ok(POST_SIGN.right < POST_ART.width && POST_CARGO_BIKE.row < feetRow);
});
