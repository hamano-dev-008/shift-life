// post.test.mjs — Pedal Post in town: reached from Go to like the Cafe and
// the 6-Eleven (never a shortcut, its door back to where they came
// from), walls on both sides, its door and counter where the picture has
// them, the picture's numbers, and its people and dog.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView, routeBetween, existingPlaces, exitBetween, enterPlace } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import {
  POST_PLACE, POST_ART, POST_DOOR, POST_DOOR_PROP, POST_COUNTER, POST_COUNTER_PROP, POST_WALK, POST_SIGN,
  POST_CARGO_BIKE, POST_DOG_BED, POST_HAND_IN_X, POST_PILE_X, POST_FEET_FROM_BOTTOM, POST_JOB,
  POST_RIDER, POST_DOG, POST_DISPATCHER,
} from '../src/data/post.js';
import { INDOOR_PLACES } from '../src/data/weather.js';
import { SCENE_SCALE } from '../src/data/layout.js';
import { JOBS } from '../src/data/jobs.js';
import {
  createPostLife, updatePostLife, addPostCustomer, clickPostCritter, postBoxes,
} from '../src/ui/postLife.js';

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

// A random that always gives `value` (between() then picks a range's low
// end at 0).
const always = (value) => () => value;

test("Pedal Post's life: the rider fetches a parcel and goes out, a customer hands one in and the dispatcher stamps it", () => {
  const life = createPostLife(always(0));
  assert.equal(life.rider.step, 'out');
  updatePostLife(life, POST_RIDER.firstOut[0] + 0.01, always(0));
  assert.equal(life.rider.step, 'in');
  for (let i = 0; i < 400 && life.rider.step === 'in'; i++) updatePostLife(life, 0.1, always(0.99));
  assert.equal(life.rider.step, 'pick');
  assert.equal(life.rider.x, POST_PILE_X);
  for (let i = 0; i < 400 && life.rider.step !== 'out'; i++) updatePostLife(life, 0.1, always(0.99));
  assert.equal(life.rider.x, POST_DOOR.x);

  life.customer = null;
  life.spawnIn = 999;
  const customer = addPostCustomer(life, always(0.99));
  assert.equal(customer.stage, 'adult');
  assert.equal(addPostCustomer(life), null, 'one customer at a time');
  life.dispatcher.state = 'idle';
  life.dispatcher.left = 999;
  for (let i = 0; i < 400 && customer.step === 'in'; i++) updatePostLife(life, 0.1, always(0.99));
  assert.equal(customer.step, 'hand');
  assert.equal(customer.x, POST_HAND_IN_X);
  assert.equal(life.dispatcher.state, 'stamp', 'a parcel handed in gets stamped');
  for (let i = 0; i < 400 && life.customer; i++) updatePostLife(life, 0.1, always(0.99));
  assert.equal(life.customer, null, 'they leave by the door');
});

test('Mochi wakes and sits, sometimes trots to the door and back to curl up; clicks woof', () => {
  const life = createPostLife(always(0));
  const { dog } = life;
  assert.equal(dog.state, 'sleep');
  updatePostLife(life, POST_DOG.sleep[0] + 0.01, always(0));
  assert.equal(dog.state, 'sit');
  updatePostLife(life, POST_DOG.sit[0] + 0.01, always(0));
  assert.equal(dog.state, 'walk');
  for (let i = 0; i < 400 && dog.state === 'walk'; i++) updatePostLife(life, 0.1, always(0.99));
  assert.equal(dog.state, 'sit');
  assert.ok(dog.x > POST_DOOR.right && dog.x < POST_DOG_BED.x, 'it sniffs by the door');
  for (let i = 0; i < 800 && dog.state !== 'sleep'; i++) updatePostLife(life, 0.1, always(0.99));
  assert.equal(dog.x, POST_DOG_BED.x, 'back on its bed');

  assert.deepEqual(postBoxes(life).map((box) => box.id), ['dispatcher', 'dog']);
  assert.equal(clickPostCritter(life, 'dog', always(0)).text, POST_DOG.lines.woken);
  assert.equal(dog.state, 'sit');
  assert.ok(dog.wagging);
  assert.equal(clickPostCritter(life, 'dog', always(0)).text, POST_DOG.lines.awake);
  assert.ok(POST_DISPATCHER.lines.includes(clickPostCritter(life, 'dispatcher').text));
  assert.equal(clickPostCritter(life, 'nobody'), null);
});
