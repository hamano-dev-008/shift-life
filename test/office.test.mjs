// office.test.mjs — Paperleaf Co. in town: reached from Go to like the
// Cafe (never a shortcut, its door back to where they came from), indoors,
// its door, vending machine and printer where the picture has them; the
// coworkers, the boss and Gerald the plant; coffee and resumes at the
// break corner, and desk shifts for the Office job.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView, routeBetween, existingPlaces, exitBetween, enterPlace } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import { workplaceHere, shiftPay, startShift, updateShift } from '../src/game/shifts.js';
import {
  buyAtBreak, breakBlock, updateOffice, isOnBreak, createOfficeState, restoreOfficeState,
} from '../src/game/office.js';
import { applyJobChange } from '../src/game/jobs.js';
import { arriveAtStay, stayKey, stayFreezesEvents } from '../src/game/stay.js';
import { activityBarView, stopFromBar } from '../src/game/activityBar.js';
import { TYPE_TEXT } from '../src/data/work.js';
import {
  createOfficeLife, updateOfficeLife, clickOfficeCritter, officeBoxes,
} from '../src/ui/officeLife.js';
import {
  OFFICE_PLACE, OFFICE_ART, OFFICE_DOOR, OFFICE_DOOR_PROP, OFFICE_VENDING, VENDING_PROP, OFFICE_PRINTER, PRINTER_PROP,
  OFFICE_WALK, OFFICE_DESKS, OFFICE_MY_DESK, OFFICE_COOLER_X, OFFICE_PLANT, OFFICE_SIGN, OFFICE_FEET_FROM_BOTTOM,
  OFFICE_JOB, OFFICE_BOSS, OFFICE_COWORKERS, OFFICE_PLANT_LIFE, OFFICE_ITEMS, OFFICE_BAR_TEXT, OFFICE_NEWS,
} from '../src/data/office.js';
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

test('Paperleaf Co. is in town: one step from every outdoor place, never on the way, the door back', () => {
  const game = lifeAt(30);
  assert.ok(existingPlaces(game).some((place) => place.id === OFFICE_PLACE));
  assert.deepEqual(routeBetween(game, 'lake', OFFICE_PLACE), [OFFICE_PLACE]);
  assert.equal(exitBetween(game, 'farm', OFFICE_PLACE).via, 'town');
  assert.ok(placeView(game, OFFICE_PLACE).exits.every((exit) => exit.via === OFFICE_DOOR_PROP));
  enterPlace(game, 'farm');
  enterPlace(game, OFFICE_PLACE);
  assert.equal(placeView(game, OFFICE_PLACE).exits[0].to, 'farm');
  assert.ok(INDOOR_PLACES.includes(OFFICE_PLACE));
  assert.ok(JOBS.some((job) => job.id === OFFICE_JOB));
});

test('the Paperleaf Co. layout and picture: walls both sides, the door and the break corner, everything inside', () => {
  const layout = computeLayout(W, H, placeView(lifeAt(30, OFFICE_PLACE), OFFICE_PLACE));
  assert.deepEqual(layout.openSides, { left: false, right: false });
  assert.equal(layout.feetY, H - OFFICE_FEET_FROM_BOTTOM * SCENE_SCALE);
  for (const [prop, box] of [[OFFICE_DOOR_PROP, OFFICE_DOOR], [VENDING_PROP, OFFICE_VENDING], [PRINTER_PROP, OFFICE_PRINTER]]) {
    assert.ok(Math.abs(layout.props[prop].visitX / SCENE_SCALE - box.x) <= 1, prop);
  }
  assert.ok(OFFICE_VENDING.right < OFFICE_PRINTER.left, 'the click areas apart');
  const feetRow = OFFICE_ART.height - OFFICE_FEET_FROM_BOTTOM;
  for (const desk of OFFICE_DESKS) {
    assert.ok(desk.seatX >= OFFICE_WALK.minX && desk.seatX <= OFFICE_WALK.maxX);
    assert.ok(desk.seatRow < feetRow && desk.left > desk.seatX && desk.right < OFFICE_ART.width);
  }
  for (const x of [OFFICE_COOLER_X, OFFICE_PLANT.x, ...OFFICE_BOSS.stops]) {
    assert.ok(x >= OFFICE_WALK.minX && x <= OFFICE_WALK.maxX, `${x}`);
  }
  assert.ok(OFFICE_SIGN.top >= 8 && OFFICE_SIGN.right < 98, 'the sign clears the top bar and the weather icon');
});

test("Paperleaf Co.'s life: coworkers type, sometimes chat by the cooler and go back; the boss strolls", () => {
  const life = createOfficeLife(always(0));
  assert.equal(life.coworkers.length, OFFICE_DESKS.length - 1);
  assert.ok(life.coworkers.every((coworker) => coworker.desk !== OFFICE_DESKS[OFFICE_MY_DESK]), 'their desk is kept');
  const [coworker] = life.coworkers;
  assert.equal(coworker.state, 'type');
  updateOfficeLife(life, OFFICE_COWORKERS.type[0] + 0.01, always(0));
  assert.equal(coworker.state, 'walk');
  for (let i = 0; i < 400 && coworker.state === 'walk'; i++) updateOfficeLife(life, 0.1, always(0.99));
  assert.equal(coworker.state, 'chat');
  assert.ok(Math.abs(coworker.x - OFFICE_COOLER_X) <= 4);
  for (let i = 0; i < 800 && coworker.state !== 'type'; i++) updateOfficeLife(life, 0.1, always(0.99));
  assert.equal(coworker.x, coworker.desk.seatX, 'back at the desk');
  const from = life.boss.x;
  for (let i = 0; i < 200 && life.boss.x === from; i++) updateOfficeLife(life, 0.1, always(0.5));
  assert.notEqual(life.boss.x, from, 'the boss walks on');
});

test('clicking: the boss says a line, Gerald perks up for a moment', () => {
  const life = createOfficeLife(always(0));
  assert.ok(OFFICE_BOSS.lines.includes(clickOfficeCritter(life, 'boss').text));
  assert.ok(OFFICE_PLANT_LIFE.lines.includes(clickOfficeCritter(life, 'plant').text));
  assert.equal(life.plant.perk, OFFICE_PLANT_LIFE.perk);
  updateOfficeLife(life, OFFICE_PLANT_LIFE.perk + 0.1);
  assert.equal(life.plant.perk, 0);
  assert.equal(clickOfficeCritter(life, 'nobody'), null);
  assert.deepEqual(officeBoxes(life).map((box) => box.id), ['boss', 'plant']);
});

function runOffice(game, seconds) {
  const bubbles = [];
  for (let ms = 0; ms < seconds * 1000; ms += 250) bubbles.push(...updateOffice(game, 250), ...updateShift(game, 250));
  return bubbles;
}

function inOffice(age = 30, money = 100) {
  const game = lifeAt(age, OFFICE_PLACE);
  Object.assign(game.character.stats, { money, happiness: 50, health: 50, smarts: 50 });
  return game;
}

test('a vending coffee once an hour, a resume once a day, each at its machine; stopping first refunds it', () => {
  const game = inOffice();
  assert.equal(breakBlock(inOffice(4), 'coffee'), 'tooYoung');
  assert.equal(buyAtBreak(game, 'coffee'), true);
  assert.equal(game.character.stats.money, 100 - OFFICE_ITEMS.coffee.price);
  assert.equal(stayKey(game), 'office:coffee');
  assert.equal(activityBarView(game).text, OFFICE_BAR_TEXT.toVending);
  assert.equal(buyAtBreak(game, 'resume'), false, 'one at a time');
  arriveAtStay(game);
  assert.equal(stayFreezesEvents(game), false);
  assert.equal(activityBarView(game).text, OFFICE_BAR_TEXT.coffee);
  const [had] = runOffice(game, OFFICE_ITEMS.coffee.seconds);
  assert.equal(had.heading, OFFICE_NEWS.coffee.heading);
  assert.deepEqual(had.deltas, OFFICE_ITEMS.coffee.effects);
  assert.equal(breakBlock(game, 'coffee'), 'wait');
  buyAtBreak(game, 'resume');
  assert.equal(activityBarView(game).text, OFFICE_BAR_TEXT.toPrinter);
  assert.deepEqual(stopFromBar(game), { stopped: true, news: null });
  assert.equal(game.character.stats.money, 100 - OFFICE_ITEMS.coffee.price, 'refunded');
  buyAtBreak(game, 'resume');
  arriveAtStay(game);
  assert.deepEqual(runOffice(game, OFFICE_ITEMS.resume.seconds)[0].deltas, OFFICE_ITEMS.resume.effects);
  runOffice(game, 60 * 60);
  assert.equal(breakBlock(game, 'coffee'), null);
  assert.equal(breakBlock(game, 'resume'), 'wait', 'once a day');
  buyAtBreak(game, 'coffee');
  enterPlace(game, 'lake');
  assert.equal(isOnBreak(game), false);
  assert.deepEqual(restoreOfficeState(JSON.parse(JSON.stringify(game.office))), game.office);
  assert.deepEqual(restoreOfficeState(null), createOfficeState());
});

test('an Office worker sits at their desk and can work a shift there ($8, $13, $22)', () => {
  const game = inOffice(30, 0);
  applyJobChange(game, { hire: OFFICE_JOB });
  const work = workplaceHere(game);
  const desk = OFFICE_DESKS[OFFICE_MY_DESK];
  assert.equal(work.place, OFFICE_PLACE);
  assert.deepEqual(work.spot, {
    x: desk.seatX, lift: OFFICE_ART.height - OFFICE_FEET_FROM_BOTTOM - desk.seatRow, facing: 1, sit: true,
  });
  assert.equal(work.text, TYPE_TEXT);
  assert.equal(startShift(game), true);
  assert.equal(breakBlock(game, 'coffee'), 'busy');
  assert.equal(activityBarView(game).text, TYPE_TEXT.toCounter);
  arriveAtStay(game);
  assert.equal(activityBarView(game).text, 'At the desk - 0:00 of 30:00');
  const done = runOffice(game, 30 * 60);
  assert.equal(done.at(-1).heading, TYPE_TEXT.done.heading);
  assert.equal(done.at(-1).deltas.money, 8);
  const pays = JOBS.find((job) => job.id === OFFICE_JOB).levels.map((_, level) => {
    game.jobs.current.level = level;
    return shiftPay(game);
  });
  assert.deepEqual(pays, [8, 13, 22]);
});
