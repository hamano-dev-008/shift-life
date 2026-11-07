// alley.test.mjs — Mural Alley in town: reached from Go to like the Cafe
// (never a shortcut, its way out back to where they came from), outdoors,
// its mouth and stall where the picture has them; the painter, visitors
// and Rio the parrot; art classes and prints at the stall, and painting
// shifts for the Artist job.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView, routeBetween, existingPlaces, exitBetween, enterPlace } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import { workplaceHere, shiftPay, startShift, updateShift } from '../src/game/shifts.js';
import {
  buyAtStall, stallBlock, updateAlley, isAtStall, createAlleyState, restoreAlleyState,
} from '../src/game/alley.js';
import { applyJobChange } from '../src/game/jobs.js';
import { arriveAtStay, stayKey, stayFreezesEvents } from '../src/game/stay.js';
import { activityBarView, stopFromBar } from '../src/game/activityBar.js';
import { PAINT_TEXT } from '../src/data/work.js';
import {
  createAlleyLife, updateAlleyLife, addAlleyVisitor, clickAlleyCritter, alleyBoxes,
} from '../src/ui/alleyLife.js';
import {
  ALLEY_PLACE, ALLEY_ART, ALLEY_MOUTH, ALLEY_MOUTH_PROP, ALLEY_STALL, ALLEY_STALL_PROP, ALLEY_WALK, ALLEY_MURAL,
  ALLEY_EASEL, CLASS_EASEL, ALLEY_PERCH, ALLEY_FEET_FROM_BOTTOM, ALLEY_JOB, ALLEY_PAINTER, ALLEY_VISITORS,
  ALLEY_PARROT, ALLEY_ITEMS, ALLEY_BAR_TEXT, ALLEY_NEWS, EASEL_CANVAS_TOP,
} from '../src/data/alley.js';
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

test('Mural Alley is in town and outdoors: one step from every outdoor place, never on the way, the way back', () => {
  const game = lifeAt(30);
  assert.ok(existingPlaces(game).some((place) => place.id === ALLEY_PLACE));
  assert.deepEqual(routeBetween(game, 'lake', ALLEY_PLACE), [ALLEY_PLACE]);
  assert.equal(exitBetween(game, 'farm', ALLEY_PLACE).via, 'town');
  assert.ok(placeView(game, ALLEY_PLACE).exits.every((exit) => exit.via === ALLEY_MOUTH_PROP));
  enterPlace(game, 'farm');
  enterPlace(game, ALLEY_PLACE);
  assert.equal(placeView(game, ALLEY_PLACE).exits[0].to, 'farm');
  assert.ok(!INDOOR_PLACES.includes(ALLEY_PLACE), 'it gets the weather');
  assert.ok(JOBS.some((job) => job.id === ALLEY_JOB));
});

test('the Mural Alley layout and picture: walls both sides, the mouth and the stall, everything inside', () => {
  const layout = computeLayout(W, H, placeView(lifeAt(30, ALLEY_PLACE), ALLEY_PLACE));
  assert.deepEqual(layout.openSides, { left: false, right: false });
  assert.equal(layout.feetY, H - ALLEY_FEET_FROM_BOTTOM * SCENE_SCALE);
  assert.ok(Math.abs(layout.props[ALLEY_MOUTH_PROP].visitX / SCENE_SCALE - ALLEY_MOUTH.x) <= 1);
  assert.ok(Math.abs(layout.props[ALLEY_STALL_PROP].visitX / SCENE_SCALE - ALLEY_STALL.x) <= 1);
  for (const x of [ALLEY_MOUTH.x, ALLEY_EASEL.standX, CLASS_EASEL.standX, ALLEY_STALL.x, ...ALLEY_PAINTER.spots,
    ...ALLEY_VISITORS.spots]) {
    assert.ok(x >= ALLEY_WALK.minX && x <= ALLEY_WALK.maxX, `${x}`);
  }
  for (const easel of [ALLEY_EASEL, CLASS_EASEL]) {
    assert.ok(Math.abs(easel.standX - easel.x) === 5 && Math.sign(easel.x - easel.standX) === easel.facing);
  }
  const feetRow = ALLEY_ART.height - ALLEY_FEET_FROM_BOTTOM;
  assert.ok(EASEL_CANVAS_TOP + 8 < feetRow);
  assert.ok(ALLEY_MURAL.left < ALLEY_MURAL.doneTo && ALLEY_MURAL.doneTo < ALLEY_MURAL.right);
  assert.ok(ALLEY_MURAL.right < ALLEY_STALL.left && ALLEY_PERCH.x < ALLEY_STALL.right);
  assert.ok(ALLEY_MURAL.top >= 8, 'the mural clears the top bar');
});

test("Mural Alley's life: the painter sprays, looks and moves along; visitors come and go, two at most", () => {
  const life = createAlleyLife(always(0));
  const { painter } = life;
  assert.equal(painter.state, 'spray');
  updateAlleyLife(life, ALLEY_PAINTER.spray[0] + 0.01, always(0));
  assert.equal(painter.state, 'gaze');
  const from = painter.x;
  updateAlleyLife(life, ALLEY_PAINTER.gaze[0] + 0.01, always(0));
  assert.equal(painter.state, 'walk');
  for (let i = 0; i < 400 && painter.state === 'walk'; i++) updateAlleyLife(life, 0.1, always(0.99));
  assert.notEqual(painter.x, from);
  assert.ok(ALLEY_PAINTER.spots.includes(painter.x));

  const quiet = createAlleyLife(always(0.5));
  quiet.spawnIn = 999;
  const first = addAlleyVisitor(quiet, always(0.5));
  const second = addAlleyVisitor(quiet, always(0));
  assert.equal(addAlleyVisitor(quiet), null, 'two at most');
  assert.notEqual(first.target, second.target, 'each at their own spot');
  assert.equal(second.stage, 'elder');
  for (let i = 0; i < 2000 && quiet.visitors.length; i++) updateAlleyLife(quiet, 0.1, always(0.99));
  assert.equal(quiet.visitors.length, 0, 'they leave by the street');
});

test('clicking: the painter says a line, Rio repeats it once, then squawks its own', () => {
  const life = createAlleyLife(always(0));
  const said = clickAlleyCritter(life, 'painter', always(0));
  assert.equal(said.text, ALLEY_PAINTER.lines[0]);
  const repeated = clickAlleyCritter(life, 'parrot', always(0.99));
  assert.equal(repeated.text, said.text);
  assert.equal(life.parrot.state, 'flap');
  assert.ok(ALLEY_PARROT.lines.includes(clickAlleyCritter(life, 'parrot').text));
  assert.equal(clickAlleyCritter(life, 'nobody'), null);
  assert.deepEqual(alleyBoxes(life).map((box) => box.id), ['painter', 'parrot']);
});

function runAlley(game, seconds) {
  const bubbles = [];
  for (let ms = 0; ms < seconds * 1000; ms += 250) bubbles.push(...updateAlley(game, 250), ...updateShift(game, 250));
  return bubbles;
}

function inAlley(age = 30, money = 100) {
  const game = lifeAt(age, ALLEY_PLACE);
  Object.assign(game.character.stats, { money, happiness: 50, health: 50, smarts: 50 });
  return game;
}

test('an art class: paid at once, painted at the class easel for a minute, once a day', () => {
  const game = inAlley();
  assert.equal(stallBlock(inAlley(4), 'class'), 'tooYoung');
  assert.equal(buyAtStall(game, 'class'), true);
  assert.equal(game.character.stats.money, 100 - ALLEY_ITEMS.class.price);
  assert.equal(stayKey(game), 'alley:class');
  assert.equal(buyAtStall(game, 'print'), false, 'one at a time');
  assert.equal(activityBarView(game).text, ALLEY_BAR_TEXT.toEasel);
  assert.deepEqual(runAlley(game, 120), [], 'nothing until they get there');
  arriveAtStay(game);
  assert.equal(stayFreezesEvents(game), false);
  assert.equal(activityBarView(game).text, 'Art class - 0:00 of 1:00');
  const [done] = runAlley(game, ALLEY_ITEMS.class.seconds);
  assert.equal(done.heading, ALLEY_NEWS.class.heading);
  assert.deepEqual(done.deltas, ALLEY_ITEMS.class.effects);
  assert.equal(isAtStall(game), false);
  runAlley(game, 60 * 60);
  assert.equal(stallBlock(game, 'class'), 'wait', 'once a day');
  assert.equal(stallBlock(game, 'print'), null);
  assert.deepEqual(restoreAlleyState(JSON.parse(JSON.stringify(game.alley))), game.alley);
  assert.deepEqual(restoreAlleyState(null), createAlleyState());
});

test('a print: picked out at the stall, once an hour; stopping first, or leaving, refunds it', () => {
  const game = inAlley();
  buyAtStall(game, 'print');
  assert.equal(activityBarView(game).text, ALLEY_BAR_TEXT.toStall);
  arriveAtStay(game);
  assert.equal(activityBarView(game).text, ALLEY_BAR_TEXT.print);
  runAlley(game, 1);
  assert.deepEqual(stopFromBar(game), { stopped: true, news: null });
  assert.equal(game.character.stats.money, 100, 'refunded');
  buyAtStall(game, 'print');
  arriveAtStay(game);
  const [bought] = runAlley(game, ALLEY_ITEMS.print.seconds);
  assert.deepEqual(bought.deltas, ALLEY_ITEMS.print.effects);
  assert.equal(stallBlock(game, 'print'), 'wait');
  buyAtStall(game, 'class');
  enterPlace(game, 'lake');
  assert.equal(isAtStall(game), false);
  assert.equal(game.character.stats.money, 100 - ALLEY_ITEMS.print.price);
});

test('an Artist paints at the easel and can paint a shift ($6, $10, $18)', () => {
  const game = inAlley(30, 0);
  applyJobChange(game, { hire: ALLEY_JOB });
  const work = workplaceHere(game);
  assert.equal(work.place, ALLEY_PLACE);
  assert.deepEqual(work.spot, { x: ALLEY_EASEL.standX, lift: 0, facing: ALLEY_EASEL.facing });
  assert.equal(work.text, PAINT_TEXT);
  assert.equal(startShift(game), true);
  assert.equal(stallBlock(game, 'print'), 'busy');
  assert.equal(activityBarView(game).text, PAINT_TEXT.toCounter);
  arriveAtStay(game);
  assert.equal(activityBarView(game).text, 'Painting - 0:00 of 30:00');
  const done = runAlley(game, 30 * 60);
  assert.equal(done.at(-1).heading, PAINT_TEXT.done.heading);
  assert.equal(done.at(-1).deltas.money, 6);
  const pays = JOBS.find((job) => job.id === ALLEY_JOB).levels.map((_, level) => {
    game.jobs.current.level = level;
    return shiftPay(game);
  });
  assert.deepEqual(pays, [6, 10, 18]);
});
