// stay.test.mjs — The "on the way" stage (game/stay.js): busking, resting
// and place activities chosen but not yet reached count no time, pay
// nothing, get no bites and don't freeze events; the activity bar says
// they're on the way and Stop calls it off with nothing paid or sold; on
// arrival the timers start from zero and the freeze begins; arrival isn't
// saved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { startActivity, updateActivities, activityFreezesEvents } from '../src/game/activities.js';
import { createCollection } from '../src/game/fishing.js';
import { startPlaying, updateFortuneTree } from '../src/game/fortuneTree.js';
import { startResting, updateHome, isResting } from '../src/game/home.js';
import { updateEvents } from '../src/game/events.js';
import { activityBarView, stopFromBar } from '../src/game/activityBar.js';
import {
  arriveAtStay, reportArrival, hasArrived, isOnTheWay, stayFreezesEvents,
} from '../src/game/stay.js';
import { giveFishingRod } from '../src/game/dev.js';
import { saveGame } from '../src/game/save.js';
import { LAKE_PLACE } from '../src/data/lake.js';
import { SESSION_MINUTES } from '../src/data/fortuneTree.js';
import { FISHING_TIMES } from '../src/data/fishing.js';

const MINUTE = 60 * 1000;

// A life aged `age` at `place`, with `money`, a rod and a collection.
function lifeAt(age, place, { money = 0 } = {}) {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.5;
  game.endOfLife.checkedAge = age;
  game.housing.movedOut = age >= 18;
  game.place = place;
  game.character.stats.money = money;
  game.collection = createCollection();
  giveFishingRod(game);
  return game;
}

// Runs the life tick's real-time updates for `ms`, in 250ms ticks.
function tick(game, ms) {
  const news = [];
  for (let t = 0; t < ms; t += 250) {
    news.push(...updateFortuneTree(game, 250), ...updateActivities(game, 250));
    updateHome(game, 250);
  }
  return news;
}

test('busking on the way to the tree: no session time, no pay, no freeze; on arrival from 0:00', () => {
  const game = lifeAt(20, 'fortuneTree');
  assert.equal(startPlaying(game), true);
  assert.equal(isOnTheWay(game), true);
  assert.equal(hasArrived(game), false);
  assert.deepEqual(tick(game, 2 * SESSION_MINUTES * MINUTE), []);
  assert.equal(game.fortuneTree.sessionMs, 0);
  assert.equal(game.character.stats.money, 0);
  assert.equal(stayFreezesEvents(game), false);
  assert.equal(activityBarView(game).text, 'Walking to the tree...');
  assert.equal(activityBarView(game).onTheWay, true);

  // Arrived: the session starts from zero and events freeze.
  assert.equal(reportArrival(game, true), true);
  assert.equal(reportArrival(game, true), false);
  assert.equal(activityBarView(game).text, `Busking - 0:00 of ${SESSION_MINUTES}:00`);
  assert.equal(stayFreezesEvents(game), true);
  const paid = tick(game, SESSION_MINUTES * MINUTE);
  assert.equal(paid.length, 1);
  assert.ok(game.character.stats.money > 0);

  // Pulled off the spot (not settled): it stops counting again.
  reportArrival(game, false);
  const { sessionMs } = game.fortuneTree;
  tick(game, MINUTE);
  assert.equal(game.fortuneTree.sessionMs, sessionMs);
});

test('resting on the way to the bed: no health; Stop calls it off', () => {
  const game = lifeAt(30, 'myYard');
  game.character.stats.health = 50;
  startResting(game);
  tick(game, 60 * MINUTE);
  assert.equal(game.character.stats.health, 50);
  assert.equal(game.home.restMs, 0);
  assert.equal(stayFreezesEvents(game), false);
  assert.equal(activityBarView(game).text, 'Going to the sleeping bag...');
  assert.deepEqual(stopFromBar(game), { stopped: true, news: null });
  assert.equal(isResting(game), false);

  startResting(game);
  arriveAtStay(game);
  assert.match(activityBarView(game).text, /^Resting - Health 50/);
  tick(game, 60 * MINUTE);
  assert.ok(game.character.stats.health > 50);
});

test('fishing on the way to the dock: no bite, no cast, nothing sold; casts on arrival', () => {
  const game = lifeAt(20, LAKE_PLACE);
  startActivity(game, 'fishing', () => 0);
  const fishing = game.activities.current.fishing;
  assert.equal(activityBarView(game).text, 'Heading to the dock...');
  assert.equal(activityFreezesEvents(game), false);
  assert.equal(stayFreezesEvents(game), false);
  assert.deepEqual(tick(game, 10 * FISHING_TIMES.biteWait[1] * 1000), []);
  assert.equal(fishing.phase, 'waiting');
  assert.equal(fishing.phaseMs, 0);
  assert.equal(game.activities.current.ms, 0);
  assert.deepEqual(fishing.bucket, []);

  // Called off on the way: nothing sold, no bubble.
  assert.deepEqual(stopFromBar(game), { stopped: true, news: null });
  assert.equal(game.character.stats.money, 0);

  startActivity(game, 'fishing', () => 0);
  arriveAtStay(game);
  assert.equal(activityBarView(game).text, 'Fishing - 0 fish - $0');
  assert.equal(stayFreezesEvents(game), true);
  tick(game, (FISHING_TIMES.biteWait[0] + 1) * 1000);
  assert.equal(game.activities.current.fishing.phase, 'bite');
});

test('events keep coming on the way, and freeze once there', () => {
  const game = lifeAt(20, 'fortuneTree');
  startPlaying(game);
  game.events.nextAt = game.clock.years;
  game.events.pending = null;
  updateEvents(game, { freeze: stayFreezesEvents(game) });
  assert.ok(game.events.pending, 'an event comes on the way');
  assert.equal(game.events.frozenAt, null);

  game.events.pending = null;
  game.events.nextAt = game.clock.years;
  arriveAtStay(game);
  updateEvents(game, { freeze: stayFreezesEvents(game) });
  assert.equal(game.events.pending, null);
  assert.equal(game.events.frozenAt, game.clock.years);
});

test('arrival is not saved, and belongs to what was running', () => {
  const game = lifeAt(20, 'fortuneTree');
  startPlaying(game);
  arriveAtStay(game);
  let written = null;
  globalThis.window = { shiftLife: { save: (data) => { written = data; } } };
  try {
    saveGame(game);
  } finally {
    delete globalThis.window;
  }
  assert.equal(written.fortuneTree.playing, true);
  assert.doesNotMatch(JSON.stringify(written), /arrived|"stay"/);
  // A loaded game has no game.stay: on the way until the renderer reports.
  delete game.stay;
  assert.equal(isOnTheWay(game), true);
  arriveAtStay(game);
  // Switching to something else needs a new arrival.
  game.fortuneTree.playing = false;
  game.place = LAKE_PLACE;
  startActivity(game, 'fishing');
  assert.equal(hasArrived(game), false);
});
