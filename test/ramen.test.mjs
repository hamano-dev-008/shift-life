// ramen.test.mjs — Ramen Hinata in town: reached from Go to like the Cafe
// (never a shortcut, its door back to where they came from), indoors, its
// door and counter where the picture has them; the cook and the diners;
// eating a bowl at the counter, and cooking shifts for the Chef job.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView, routeBetween, existingPlaces, exitBetween, enterPlace } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import { workplaceHere, shiftPay, startShift, updateShift } from '../src/game/shifts.js';
import {
  orderRamen, ramenBlock, updateRamen, isEatingRamen, createRamenState, restoreRamenState,
} from '../src/game/ramen.js';
import { applyJobChange } from '../src/game/jobs.js';
import { arriveAtStay, stayKey, stayFreezesEvents } from '../src/game/stay.js';
import { activityBarView, stopFromBar } from '../src/game/activityBar.js';
import { COOK_TEXT } from '../src/data/work.js';
import {
  createRamenLife, updateRamenLife, addRamenDiner, clickRamenCritter, ramenBoxes, serveDinerAt, waitingDiner,
} from '../src/ui/ramenLife.js';
import {
  RAMEN_PLACE, RAMEN_ART, RAMEN_DOOR, RAMEN_DOOR_PROP, RAMEN_COUNTER, RAMEN_COUNTER_PROP, RAMEN_WALK, RAMEN_STOOLS,
  RAMEN_MY_STOOL, RAMEN_POTS, RAMEN_SIGN, RAMEN_FEET_FROM_BOTTOM, RAMEN_JOB, RAMEN_COOK, RAMEN_DINERS, RAMEN_ITEMS,
  RAMEN_BAR_TEXT, RAMEN_NEWS, RAMEN_SERVING,
} from '../src/data/ramen.js';
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

// A random that always gives `value`.
const always = (value) => () => value;

test('Ramen Hinata is in town: one step from every outdoor place, never on the way, the door back', () => {
  const game = lifeAt(30);
  assert.ok(existingPlaces(game).some((place) => place.id === RAMEN_PLACE));
  assert.deepEqual(routeBetween(game, 'lake', RAMEN_PLACE), [RAMEN_PLACE]);
  assert.equal(exitBetween(game, 'farm', RAMEN_PLACE).via, 'town');
  assert.ok(placeView(game, RAMEN_PLACE).exits.every((exit) => exit.via === RAMEN_DOOR_PROP));
  enterPlace(game, 'farm');
  enterPlace(game, RAMEN_PLACE);
  assert.equal(placeView(game, RAMEN_PLACE).exits[0].to, 'farm');
  assert.ok(INDOOR_PLACES.includes(RAMEN_PLACE));
  assert.ok(JOBS.some((job) => job.id === RAMEN_JOB));
});

test('the Ramen Hinata layout and picture: walls both sides, the door and the counter, everything inside', () => {
  const layout = computeLayout(W, H, placeView(lifeAt(30, RAMEN_PLACE), RAMEN_PLACE));
  assert.deepEqual(layout.openSides, { left: false, right: false });
  assert.equal(layout.feetY, H - RAMEN_FEET_FROM_BOTTOM * SCENE_SCALE);
  assert.ok(Math.abs(layout.props[RAMEN_DOOR_PROP].visitX / SCENE_SCALE - RAMEN_DOOR.x) <= 1);
  assert.ok(Math.abs(layout.props[RAMEN_COUNTER_PROP].visitX / SCENE_SCALE - RAMEN_COUNTER.flap) <= 1);
  const feetRow = RAMEN_ART.height - RAMEN_FEET_FROM_BOTTOM;
  assert.ok(RAMEN_COUNTER.behindRow > RAMEN_COUNTER.top && RAMEN_COUNTER.behindRow < feetRow);
  for (const x of [RAMEN_COUNTER.stoveX, RAMEN_COUNTER.flap, ...RAMEN_COUNTER.cookSpots, ...RAMEN_POTS,
    ...RAMEN_STOOLS.map((stool) => stool.x)]) {
    assert.ok(x >= RAMEN_WALK.minX && x <= RAMEN_WALK.maxX && x > RAMEN_COUNTER.left, `${x}`);
  }
  for (const stool of RAMEN_STOOLS) {
    assert.ok(stool.row < feetRow && stool.row > RAMEN_COUNTER.top);
    assert.ok(stool.x - RAMEN_SERVING.gap > RAMEN_COUNTER.left - 2, 'room to serve beside it');
  }
  assert.ok(RAMEN_STOOLS.some((stool) => stool.id === RAMEN_MY_STOOL));
  assert.ok(RAMEN_SIGN.top >= 14, 'the sign clears the place name');
});

test("Ramen Hinata's life: diners sit on free stools (never the character's), the cook brings each a bowl", () => {
  const life = createRamenLife(always(0));
  life.spawnIn = 999;
  const diners = [addRamenDiner(life, always(0)), addRamenDiner(life, always(0)), addRamenDiner(life, always(0))];
  assert.equal(addRamenDiner(life), null, `${RAMEN_DINERS.max} at most`);
  assert.ok(diners.every((diner) => diner.stool.id !== RAMEN_MY_STOOL));
  assert.equal(new Set(diners.map((diner) => diner.stool)).size, 3, 'a stool each');
  for (let i = 0; i < 3000 && life.diners.some((diner) => !diner.served); i++) updateRamenLife(life, 0.1, always(0.99));
  assert.ok(life.diners.every((diner) => diner.served), 'everyone got a bowl');
  for (let i = 0; i < 3000 && life.diners.length; i++) updateRamenLife(life, 0.1, always(0.99));
  assert.equal(life.diners.length, 0, 'they leave');
});

test("the cook serves the character's bowl once they're seated; a bowl carried out serves a waiting diner", () => {
  const life = createRamenLife(always(0));
  life.spawnIn = 999;
  life.playerWaiting = true;
  for (let i = 0; i < 600 && !life.playerServed; i++) updateRamenLife(life, 0.1, always(0.5));
  assert.equal(life.playerServed, true);
  life.playerWaiting = false;
  updateRamenLife(life, 0.1);
  assert.equal(life.playerServed, false, 'cleared once they stop');

  const quiet = createRamenLife(always(0));
  quiet.spawnIn = 999;
  quiet.cook.left = 999;
  const diner = addRamenDiner(quiet, always(0));
  for (let i = 0; i < 300 && diner.state !== 'sit'; i++) updateRamenLife(quiet, 0.1, always(0));
  assert.equal(waitingDiner(quiet), diner);
  assert.equal(serveDinerAt(quiet, diner.stool.x), true);
  assert.equal(diner.served, true);
  assert.equal(waitingDiner(quiet), null);
  assert.equal(serveDinerAt(quiet, diner.stool.x), false, 'already served');
});

test('clicking the cook gets a line, from above the counter', () => {
  const life = createRamenLife(always(0));
  assert.ok(RAMEN_COOK.lines.includes(clickRamenCritter(life, 'cook').text));
  assert.equal(clickRamenCritter(life, 'nobody'), null);
  const [box] = ramenBoxes(life);
  assert.equal(box.id, 'cook');
  assert.ok(box.bottom <= RAMEN_COUNTER.top);
});

function runRamen(game, seconds) {
  const bubbles = [];
  for (let ms = 0; ms < seconds * 1000; ms += 250) bubbles.push(...updateRamen(game, 250), ...updateShift(game, 250));
  return bubbles;
}

function inRamen(age = 30, money = 100) {
  const game = lifeAt(age, RAMEN_PLACE);
  Object.assign(game.character.stats, { money, happiness: 50, health: 50, smarts: 50 });
  return game;
}

test('a bowl at the counter: paid at once, eaten sitting a minute, ramen hourly, the special daily', () => {
  const game = inRamen();
  assert.equal(ramenBlock(inRamen(4), 'ramen'), 'tooYoung');
  assert.equal(orderRamen(game, 'ramen'), true);
  assert.equal(game.character.stats.money, 100 - RAMEN_ITEMS.ramen.price);
  assert.equal(stayKey(game), 'ramen:ramen');
  assert.equal(orderRamen(game, 'special'), false, 'one at a time');
  assert.equal(activityBarView(game).text, RAMEN_BAR_TEXT.toStool);
  arriveAtStay(game);
  assert.equal(stayFreezesEvents(game), false);
  assert.equal(activityBarView(game).text, 'Slurping the shoyu ramen...');
  const [eaten] = runRamen(game, RAMEN_ITEMS.ramen.seconds);
  assert.equal(eaten.heading, RAMEN_NEWS.ramen.heading);
  assert.deepEqual(eaten.deltas, RAMEN_ITEMS.ramen.effects);
  assert.equal(ramenBlock(game, 'ramen'), 'wait');
  orderRamen(game, 'special');
  assert.deepEqual(stopFromBar(game), { stopped: true, news: null });
  assert.equal(game.character.stats.money, 100 - RAMEN_ITEMS.ramen.price, 'refunded');
  orderRamen(game, 'special');
  arriveAtStay(game);
  assert.deepEqual(runRamen(game, RAMEN_ITEMS.special.seconds)[0].deltas, RAMEN_ITEMS.special.effects);
  runRamen(game, 60 * 60);
  assert.equal(ramenBlock(game, 'ramen'), null);
  assert.equal(ramenBlock(game, 'special'), 'wait', 'once a day');
  orderRamen(game, 'ramen');
  enterPlace(game, 'lake');
  assert.equal(isEatingRamen(game), false);
  assert.deepEqual(restoreRamenState(JSON.parse(JSON.stringify(game.ramen))), game.ramen);
  assert.deepEqual(restoreRamenState(null), createRamenState());
});

test('a Chef cooks behind the counter and can work a shift there ($7, $11, $17)', () => {
  const game = inRamen(30, 0);
  applyJobChange(game, { hire: RAMEN_JOB });
  const work = workplaceHere(game);
  assert.equal(work.place, RAMEN_PLACE);
  assert.deepEqual(work.spot, {
    x: RAMEN_COUNTER.stoveX, lift: RAMEN_ART.height - RAMEN_FEET_FROM_BOTTOM - RAMEN_COUNTER.behindRow, facing: -1,
  });
  assert.equal(work.text, COOK_TEXT);
  assert.equal(startShift(game), true);
  assert.equal(ramenBlock(game, 'ramen'), 'busy');
  assert.equal(activityBarView(game).text, COOK_TEXT.toCounter);
  arriveAtStay(game);
  assert.equal(activityBarView(game).text, 'Cooking - 0:00 of 30:00');
  const done = runRamen(game, 30 * 60);
  assert.equal(done.at(-1).heading, COOK_TEXT.done.heading);
  assert.equal(done.at(-1).deltas.money, 7);
  const pays = JOBS.find((job) => job.id === RAMEN_JOB).levels.map((_, level) => {
    game.jobs.current.level = level;
    return shiftPay(game);
  });
  assert.deepEqual(pays, [7, 11, 17]);
});
