// cafe.test.mjs — The Cafe in town: reached from Go to (from every place
// with an edge, never a shortcut between others), left through its door,
// walls on both sides, its door and counter click areas, and its
// picture's numbers; the master, customers and cat; ordering at the
// counter and shifts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView, routeBetween, existingPlaces, exitBetween, enterPlace } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import {
  orderItem, orderBlock, startShift, updateCafe, cafeView, worksAtCafe, shiftPay, isOrdering, isOnShift,
  createCafeState, restoreCafeState,
} from '../src/game/cafe.js';
import { applyJobChange } from '../src/game/jobs.js';
import { arriveAtStay, stayKey } from '../src/game/stay.js';
import { activityBarView, stopFromBar } from '../src/game/activityBar.js';
import { transitionFor } from '../src/ui/parallax.js';
import {
  CAFE_PLACE, CAFE_ART, CAFE_DOOR, CAFE_DOOR_PROP, CAFE_COUNTER, CAFE_COUNTER_PROP, CAFE_WALK, CAFE_SEATS,
  CAFE_SILL, CAFE_FEET_FROM_BOTTOM, CAFE_MASTER, CAFE_CUSTOMERS, CAFE_CAT, CAFE_ORDERS, ORDER_TIMES, CAFE_JOB,
  SHIFT, CAFE_BAR_TEXT,
} from '../src/data/cafe.js';
import { INDOOR_PLACES } from '../src/data/weather.js';
import {
  createCafeLife, updateCafeLife, addCustomer, clickCafeCritter, cafeBoxes,
} from '../src/ui/cafeLife.js';
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
  assert.deepEqual(Object.keys(cafe.targets), [CAFE_DOOR_PROP, CAFE_COUNTER_PROP]);
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

test('the master stays behind the counter, polishing and brewing; customers come, sit apart and go; the cat stays on the sill', () => {
  const random = seeded(5);
  const life = createCafeLife(random);
  const states = { master: new Set(), cat: new Set() };
  const seatsUsed = new Set();
  let visitors = 0;
  let left = 0;
  const seen = new Set();
  for (let t = 0; t < 1200; t += 1 / 20) {
    updateCafeLife(life, 1 / 20, random);
    const { master, cat, customers } = life;
    states.master.add(master.state);
    states.cat.add(cat.state);
    const spots = [CAFE_MASTER.spots.polish, ...CAFE_MASTER.spots.siphons];
    assert.ok(master.x >= Math.min(...spots) && master.x <= Math.max(...spots), `master at ${master.x}`);
    assert.ok(master.x > CAFE_COUNTER.flap, 'the flap is kept clear for the character');
    assert.ok(cat.x >= CAFE_SILL.left && cat.x <= CAFE_SILL.right, `cat at ${cat.x}`);
    assert.ok(customers.length <= CAFE_CUSTOMERS.max);
    assert.equal(new Set(customers.map((c) => c.seat.id)).size, customers.length, 'two on one seat');
    for (const customer of customers) {
      assert.ok(CAFE_CUSTOMERS.seats.includes(customer.seat.id), 'chairL is kept for the character');
      if (!seen.has(customer.id)) {
        seen.add(customer.id);
        visitors += 1;
      }
      if (customer.state === 'sit') seatsUsed.add(customer.seat.id);
    }
    left = visitors - customers.length;
  }
  assert.deepEqual([...states.master].sort(), ['brew', 'idle', 'polish', 'walk']);
  assert.deepEqual([...states.cat].sort(), ['sit', 'sleep', 'stretch', 'walk']);
  assert.ok(visitors >= 5 && left >= 4, `${visitors} came, ${left} left`);
  assert.ok(seatsUsed.size >= 3, [...seatsUsed].join());
});

test('a seated customer gets their cup after a moment and leaves by the door', () => {
  const random = seeded(9);
  const life = createCafeLife(random);
  life.customers = [];
  const customer = addCustomer(life, random);
  assert.equal(customer.x, CAFE_DOOR.x);
  for (let t = 0; t < 30 && customer.state !== 'sit'; t += 0.05) updateCafeLife(life, 0.05, random);
  assert.equal(customer.state, 'sit');
  assert.equal(customer.x, customer.seat.x);
  assert.equal(customer.served, false);
  for (let t = 0; t < CAFE_CUSTOMERS.servedAfter + 0.1; t += 0.05) updateCafeLife(life, 0.05, random);
  assert.equal(customer.served, true);
  customer.left = 0.01;
  for (let t = 0; t < 60 && life.customers.includes(customer); t += 0.05) updateCafeLife(life, 0.05, random);
  assert.ok(!life.customers.includes(customer), 'never left');
  assert.equal(customer.x, CAFE_DOOR.x);
});

test('clicking the master gets a line; the cat wakes with a mrrp, or meows; both clickable above the counter and on the sill', () => {
  const random = seeded(3);
  const life = createCafeLife(random);
  const said = clickCafeCritter(life, 'master', random);
  assert.equal(said.kind, 'master');
  assert.ok(CAFE_MASTER.lines.includes(said.text));
  life.cat.state = 'sleep';
  assert.equal(clickCafeCritter(life, 'cat', random).text, CAFE_CAT.lines.woken);
  assert.equal(life.cat.state, 'sit');
  assert.equal(clickCafeCritter(life, 'cat', random).text, CAFE_CAT.lines.awake);
  assert.equal(clickCafeCritter(life, 'nobody', random), null);
  const boxes = cafeBoxes(life);
  const master = boxes.find((box) => box.id === 'master');
  assert.ok(master.bottom <= CAFE_COUNTER.top + 1 && master.top < master.bottom);
  const cat = boxes.find((box) => box.id === 'cat');
  assert.ok(cat.bottom >= CAFE_SILL.row && cat.top < CAFE_SILL.row);
});

// Runs the life tick's cafe update for `seconds` in 250ms steps; returns
// the bubbles.
function runCafe(game, seconds) {
  const bubbles = [];
  for (let ms = 0; ms < seconds * 1000; ms += 250) bubbles.push(...updateCafe(game, 250));
  return bubbles;
}

function atCafe(age = 30, money = 100) {
  const game = lifeAt(age, CAFE_PLACE);
  game.character.stats.money = money;
  game.character.stats.happiness = 50;
  game.character.stats.health = 50;
  return game;
}

test('ordering: paid at once, brought to the table once seated, enjoyed a while, once an hour', () => {
  const game = atCafe();
  assert.equal(orderBlock(atCafe(4), 'coffee'), 'tooYoung');
  assert.equal(orderItem(game, 'coffee'), true);
  assert.equal(game.character.stats.money, 100 - CAFE_ORDERS.coffee.price);
  assert.equal(stayKey(game), 'cafe:order');
  assert.equal(orderItem(game, 'cake'), false, 'one thing at a time');
  assert.equal(activityBarView(game).text, CAFE_BAR_TEXT.toSeat);
  // Nothing comes until they're sitting there.
  assert.deepEqual(runCafe(game, 60), []);
  arriveAtStay(game);
  assert.equal(activityBarView(game).text, 'Waiting for the coffee...');
  const served = runCafe(game, ORDER_TIMES.serve);
  assert.equal(served.length, 1);
  assert.deepEqual(served[0].deltas, CAFE_ORDERS.coffee.effects);
  assert.equal(game.character.stats.happiness, 52);
  assert.equal(activityBarView(game).text, 'Enjoying the coffee...');
  runCafe(game, ORDER_TIMES.enjoy);
  assert.equal(isOrdering(game), false);
  assert.equal(orderBlock(game, 'coffee'), 'wait');
  assert.equal(orderBlock(game, 'cake'), null, 'each has its own wait');
  runCafe(game, CAFE_ORDERS.coffee.everyMinutes * 60);
  assert.equal(orderBlock(game, 'coffee'), null, 'again after an hour');
  const broke = atCafe(30, 2);
  assert.equal(orderBlock(broke, 'coffee'), 'money');
  assert.equal(cafeView(broke).items[0].need, 1);
});

test('stopping before it comes refunds the order; leaving the Cafe calls it off', () => {
  const game = atCafe();
  orderItem(game, 'cake');
  arriveAtStay(game);
  runCafe(game, 5);
  assert.deepEqual(stopFromBar(game), { stopped: true, news: null });
  assert.equal(game.character.stats.money, 100);
  assert.equal(orderBlock(game, 'cake'), null, 'can be had again at once');
  orderItem(game, 'cake');
  enterPlace(game, 'lake');
  assert.equal(isOrdering(game), false);
  assert.equal(game.character.stats.money, 100);
});

test('shifts: only for whoever works at the cafe, behind the counter, paid when done, nothing if stopped early', () => {
  const visitor = atCafe();
  assert.equal(startShift(visitor), false);
  assert.equal(cafeView(visitor).shift, null);
  const game = atCafe(30, 0);
  applyJobChange(game, { hire: CAFE_JOB });
  assert.equal(worksAtCafe(game), true);
  assert.equal(shiftPay(game), 6, 'a Barista: yearly $100 / 16');
  assert.equal(startShift(game), true);
  assert.equal(stayKey(game), 'cafe:shift');
  assert.equal(orderItem(game, 'coffee'), false, 'busy');
  runCafe(game, 60);
  assert.equal(game.cafe.shift.ms, 0, 'only counts behind the counter');
  arriveAtStay(game);
  assert.match(activityBarView(game).text, /^Shift - 0:00 of 30:00$/);
  runCafe(game, SHIFT.minutes * 60 - 1);
  assert.equal(game.character.stats.money, 0);
  const done = runCafe(game, 1);
  assert.equal(done.length, 1);
  assert.equal(done[0].deltas.money, 6);
  assert.equal(game.cafe.shifts, 1);
  assert.equal(isOnShift(game), false);
  startShift(game);
  arriveAtStay(game);
  runCafe(game, 600);
  stopFromBar(game);
  assert.equal(game.character.stats.money, 6, 'an unfinished shift pays nothing');
});

test('the cafe state saves and restores, dropping anything unusable', () => {
  const game = atCafe();
  orderItem(game, 'coffee');
  const restored = restoreCafeState(JSON.parse(JSON.stringify(game.cafe)));
  assert.deepEqual(restored, game.cafe);
  assert.deepEqual(restoreCafeState(null), createCafeState());
  assert.equal(restoreCafeState({ order: { item: 'pie', step: 'serve', ms: 0 } }).order, null);
  assert.equal(restoreCafeState({ waitMs: { coffee: 1e12 } }).waitMs.coffee, CAFE_ORDERS.coffee.everyMinutes * 60000);
});
