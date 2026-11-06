// cafe.test.mjs — The Cafe in town: reached from Go to (from every place
// with an edge, never a shortcut between others), left through its door,
// walls on both sides, its door and counter click areas, and its
// picture's numbers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView, routeBetween, existingPlaces, exitBetween, enterPlace } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import { transitionFor } from '../src/ui/parallax.js';
import {
  CAFE_PLACE, CAFE_ART, CAFE_DOOR, CAFE_DOOR_PROP, CAFE_COUNTER, CAFE_COUNTER_PROP, CAFE_WALK, CAFE_SEATS,
  CAFE_SILL, CAFE_FEET_FROM_BOTTOM,
} from '../src/data/cafe.js';
import { INDOOR_PLACES } from '../src/data/weather.js';
import { SCENE_SCALE } from '../src/data/layout.js';

const W = 320;
const H = 240;

function lifeAt(age, place = 'fortuneTree') {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.5;
  if (age >= 18) game.housing.movedOut = true;
  game.place = place;
  return game;
}

test('the Cafe is in town: one step from every outdoor place, at any age, never on the way elsewhere', () => {
  for (const age of [3, 12, 30]) {
    const game = lifeAt(age);
    assert.ok(existingPlaces(game).some((place) => place.id === CAFE_PLACE), `age ${age}`);
    for (const place of existingPlaces(game)) {
      if (place.id === CAFE_PLACE) continue;
      const route = routeBetween(game, place.id, CAFE_PLACE);
      assert.ok(route, `no way from ${place.id}`);
      assert.equal(route.at(-1), CAFE_PLACE);
      assert.ok(route.slice(0, -1).every((id) => id !== CAFE_PLACE));
      const back = routeBetween(game, CAFE_PLACE, place.id);
      assert.ok(back && back.at(-1) === place.id, `no way back to ${place.id}`);
    }
  }
  const child = lifeAt(12);
  // Indoors you go out through the house first.
  assert.deepEqual(routeBetween(child, 'home', CAFE_PLACE), ['yard', CAFE_PLACE]);
  assert.deepEqual(routeBetween(child, CAFE_PLACE, 'home'), ['yard', 'home']);
  // Outdoor trips still walk the row, not through town.
  assert.deepEqual(routeBetween(child, 'lake', 'farm'), ['fortuneTree', 'yard', 'farm']);
});

test('into town by walking off a side, out through the Cafe door, both shown with a fade', () => {
  const game = lifeAt(30);
  assert.deepEqual(exitBetween(game, 'fortuneTree', CAFE_PLACE), { to: CAFE_PLACE, via: 'town' });
  assert.deepEqual(exitBetween(game, CAFE_PLACE, 'fortuneTree'), { to: 'fortuneTree', via: CAFE_DOOR_PROP });
  assert.equal(exitBetween(game, 'myHome', CAFE_PLACE), null, 'no side to walk off indoors');
  assert.equal(transitionFor('fortuneTree', CAFE_PLACE, 'town', true), 'fade');
  assert.equal(transitionFor(CAFE_PLACE, 'fortuneTree', CAFE_DOOR_PROP, true), 'fade');
  assert.equal(transitionFor(CAFE_PLACE, 'fortuneTree', CAFE_DOOR_PROP, false), null);
  const cafe = placeView(game, CAFE_PLACE);
  assert.ok(cafe.exits.every((exit) => exit.via === CAFE_DOOR_PROP));
  assert.deepEqual(Object.keys(cafe.targets), [CAFE_DOOR_PROP]);
  assert.ok(INDOOR_PLACES.includes(CAFE_PLACE), 'no rain inside');
});

test('the Cafe layout: walls both sides, feet on the floor, the door and counter where the picture has them', () => {
  const layout = computeLayout(W, H, placeView(lifeAt(30, CAFE_PLACE), CAFE_PLACE));
  assert.deepEqual(layout.openSides, { left: false, right: false });
  assert.equal(layout.feetY, H - CAFE_FEET_FROM_BOTTOM * SCENE_SCALE);
  assert.equal(layout.wanderMinX, CAFE_WALK.minX * SCENE_SCALE);
  const door = layout.props[CAFE_DOOR_PROP];
  assert.ok(Math.abs(door.visitX / SCENE_SCALE - CAFE_DOOR.x) <= 1, `door spot at ${door.visitX / SCENE_SCALE}`);
  const counter = layout.props[CAFE_COUNTER_PROP];
  assert.ok(Math.abs(counter.visitX / SCENE_SCALE - CAFE_COUNTER.flap) <= 1);
  assert.ok(door.visitX >= layout.wanderMinX, 'the door is inside the walls');
});

test('the picture: everything inside it, seats in front of the counter or by the table, the sill under the window', () => {
  const inside = (x, row) => x >= 0 && x < CAFE_ART.width && row >= 0 && row < CAFE_ART.height;
  for (const seat of CAFE_SEATS) assert.ok(inside(seat.x, seat.row), seat.id);
  for (const seat of CAFE_SEATS.filter((s) => s.id.startsWith('stool'))) {
    assert.ok(seat.x > CAFE_COUNTER.left && seat.x < CAFE_COUNTER.right && seat.row > CAFE_COUNTER.top, seat.id);
  }
  const feetRow = CAFE_ART.height - CAFE_FEET_FROM_BOTTOM;
  assert.ok(CAFE_COUNTER.behindRow < feetRow && CAFE_COUNTER.behindRow > CAFE_COUNTER.top, 'behind the counter is further back');
  assert.ok(CAFE_SILL.left < CAFE_SILL.right && inside(CAFE_SILL.right, CAFE_SILL.row));
  assert.ok(CAFE_DOOR.x > CAFE_DOOR.left && CAFE_DOOR.x < CAFE_DOOR.right);
});

test("the Cafe's door leads back to wherever they came into town from", () => {
  const game = lifeAt(30, 'farm');
  enterPlace(game, CAFE_PLACE);
  assert.equal(game.townFrom, 'farm');
  const door = (g) => placeView(g, CAFE_PLACE).exits[0].to;
  assert.equal(door(game), 'farm');
  enterPlace(game, 'lake');
  enterPlace(game, CAFE_PLACE);
  assert.equal(door(game), 'lake');
  const fresh = lifeAt(30, CAFE_PLACE);
  assert.ok(placeView(fresh, door(fresh)), 'somewhere that exists, with nowhere remembered');
});
