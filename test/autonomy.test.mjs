// autonomy.test.mjs — The character's own plans: when they may choose
// (the 20-60 minute cooldown, the 5 quiet minutes after a click, only
// when idle, the "Let them choose" setting, on by default and saved),
// what they can choose (age, the rod, low health for resting, places to
// visit), the weights by goal and trait, and a plan's life: walking
// there, starting only in the place, counting only once arrived, stopping
// by themselves (fishing sells the bucket), a visit ending on arrival,
// the player's stop or a trip elsewhere calling it off, events still
// frozen while it runs, and saving it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { enterPlace } from '../src/game/places.js';
import { giveItem, currentActivity, stopActivity } from '../src/game/activities.js';
import { isPlaying } from '../src/game/fortuneTree.js';
import { isResting } from '../src/game/home.js';
import { arriveAtStay, stayFreezesEvents } from '../src/game/stay.js';
import { createCollection, catchNow } from '../src/game/fishing.js';
import { restoreSettings, settingsSaveData, setOwnPlans } from '../src/game/settings.js';
import {
  createChoosing, noteClick, mayChoose, restartChoosing, possibleChoices, choiceWeight, choosePlan,
  startPlan, cancelPlan, endPlanNow, updateAutonomy, restoreAutonomyState, createAutonomyState,
} from '../src/game/autonomy.js';
import {
  AUTONOMY_QUIET_MINUTES, AUTONOMY_EVERY_MINUTES, AUTONOMY_DURATION_MINUTES, AUTONOMY_TEXT,
} from '../src/data/autonomy.js';

const MIN = 60000;

// A seeded random, the same every run.
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// An adult (or `age`) at the Fortune Tree, moved out, with no traits, the
// Free spirit goal and good health.
function lifeAt(age = 20, { goal = 'free', traits = [], health = 90, rod = false } = {}) {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.5;
  game.character.traits = traits;
  game.character.stats.health = health;
  game.goals.active = goal;
  game.collection = createCollection();
  if (age >= 18) {
    game.housing.movedOut = true;
    game.housing.tier = 'sleepingBag';
  }
  game.place = 'fortuneTree';
  if (rod) giveItem(game, 'fishing');
  return game;
}

const kinds = (game) => possibleChoices(game).map((choice) => choice.kind);

test('they only choose after the cooldown, 5 quiet minutes after a click, when idle, with the setting on', () => {
  const [min, max] = AUTONOMY_EVERY_MINUTES;
  assert.deepEqual([min, max], [20, 60]);
  assert.equal(AUTONOMY_QUIET_MINUTES, 5);
  for (const r of [0, 0.5, 0.999]) {
    const choosing = createChoosing(1000, () => r);
    const wait = (choosing.nextAt - 1000) / MIN;
    assert.ok(wait >= min && wait <= max, `wait ${wait}`);
    assert.equal(mayChoose(choosing, choosing.nextAt - 1, { idle: true }), false);
    assert.equal(mayChoose(choosing, choosing.nextAt, { idle: true }), true);
  }
  const choosing = createChoosing(0, () => 0);
  const due = choosing.nextAt;
  assert.equal(mayChoose(choosing, due, { idle: false }), false, 'not while something is going on');
  assert.equal(mayChoose(choosing, due, { idle: true, enabled: false }), false, 'not with the setting off');
  noteClick(choosing, due - 4 * MIN);
  assert.equal(mayChoose(choosing, due, { idle: true }), false, 'not within 5 minutes of a click');
  assert.equal(mayChoose(choosing, due + MIN, { idle: true }), true, '5 minutes after the click');
  restartChoosing(choosing, due + MIN, () => 0.5);
  assert.equal(mayChoose(choosing, due + 2 * MIN, { idle: true }), false, 'a fresh wait after a plan');
  assert.equal(choosing.nextAt, due + MIN + 40 * MIN);
});

test('the "Let them choose" setting is on by default, saved, and can be turned off', () => {
  const settings = restoreSettings(null);
  assert.equal(settings.ownPlans, true);
  assert.equal(setOwnPlans(settings, false), true);
  assert.equal(setOwnPlans(settings, false), false);
  const saved = settingsSaveData(settings);
  assert.equal(saved.ownPlans, false);
  assert.equal(restoreSettings(JSON.parse(JSON.stringify(saved))).ownPlans, false);
  assert.equal(restoreSettings({ ownPlans: 'yes' }).ownPlans, true, 'a wrong type keeps the default');
  assert.equal(restoreSettings({ workTrips: false }).ownPlans, true);
});

test('what they can choose depends on age, the rod and health (lazy rests sooner)', () => {
  assert.deepEqual(kinds(lifeAt(20)), ['busk', 'visit']);
  assert.deepEqual(kinds(lifeAt(20, { rod: true })), ['fish', 'busk', 'visit']);
  assert.deepEqual(kinds(lifeAt(20, { health: 60 })), ['busk', 'rest', 'visit']);
  assert.deepEqual(kinds(lifeAt(20, { health: 80, traits: ['lazy'] })), ['busk', 'rest', 'visit']);
  assert.deepEqual(kinds(lifeAt(20, { health: 95, traits: ['lazy'] })), ['busk', 'visit']);
  assert.deepEqual(kinds(lifeAt(4, { rod: true })), ['visit'], 'too young to fish or busk');
  assert.deepEqual(kinds(lifeAt(1, { health: 50 })), ['rest'], 'a baby only naps');
  // Resting goes to the nearest bed: My Yard's sleeping bag from the tree.
  const tired = lifeAt(20, { health: 50 });
  assert.equal(possibleChoices(tired).find((c) => c.kind === 'rest').place, 'myYard');
  // A visit goes somewhere else.
  for (const seed of [1, 2, 3, 4, 5]) {
    const plan = choosePlan(lifeAt(20, { traits: ['curious', 'lazy'] }), seeded(seed));
    if (plan.kind === 'visit') assert.notEqual(plan.place, 'fortuneTree');
  }
});

test('goals and traits weight the choice', () => {
  const w = (opts, kind) => choiceWeight(lifeAt(20, opts), kind);
  assert.ok(w({ goal: 'fortune' }, 'fish') > w({ goal: 'fortune' }, 'rest'));
  assert.ok(w({ goal: 'fortune' }, 'busk') > w({ goal: 'fortune' }, 'visit'));
  assert.ok(w({ goal: 'healthy' }, 'rest') > w({ goal: 'healthy' }, 'busk'));
  assert.ok(w({ goal: 'healthy' }, 'visit') > w({ goal: 'healthy' }, 'fish'));
  assert.ok(w({ traits: ['lazy'] }, 'rest') > w({}, 'rest'));
  assert.ok(w({ traits: ['social'] }, 'busk') > w({}, 'busk'));
  assert.ok(w({ traits: ['curious'] }, 'visit') > w({}, 'visit'));
  // Over many choices: Fortune mostly fishes and busks; a healthy, lazy
  // one mostly rests and walks.
  const tally = (opts, runs = 400) => {
    const random = seeded(7);
    const count = {};
    for (let i = 0; i < runs; i++) {
      const plan = choosePlan(lifeAt(20, opts), random);
      count[plan.kind] = (count[plan.kind] ?? 0) + 1;
    }
    return count;
  };
  const fortune = tally({ goal: 'fortune', rod: true, health: 60 });
  assert.ok((fortune.fish + fortune.busk) / 400 > 0.65, JSON.stringify(fortune));
  const healthy = tally({ goal: 'healthy', rod: true, health: 60, traits: ['lazy'] });
  assert.ok((healthy.rest + healthy.visit) / 400 > 0.65, JSON.stringify(healthy));
  // A free spirit picks a bit of everything.
  const free = tally({ goal: 'free', rod: true, health: 60 });
  for (const kind of ['fish', 'busk', 'rest', 'visit']) assert.ok(free[kind] > 30, JSON.stringify(free));
});

test('a fishing plan walks there, starts at the Lake, counts once arrived and stops by itself, selling the bucket', () => {
  const game = lifeAt(20, { rod: true, goal: 'fortune' });
  startPlan(game, { kind: 'fish', place: 'lake' }, () => 0);
  assert.equal(game.autonomy.plan.leftMs, AUTONOMY_DURATION_MINUTES[0] * MIN);
  assert.deepEqual(updateAutonomy(game, 1000, { travelling: true }), { changed: false, ended: false, news: null });
  enterPlace(game, 'lake');
  const started = updateAutonomy(game, 1000);
  assert.equal(started.changed, true);
  assert.equal(currentActivity(game)?.id, 'fishing');
  assert.equal(game.autonomy.plan.stage, 'doing');
  // On the way to the dock: no time counts.
  updateAutonomy(game, 5 * MIN);
  assert.equal(game.autonomy.plan.leftMs, 10 * MIN);
  arriveAtStay(game);
  assert.equal(stayFreezesEvents(game), true, 'events are frozen while fishing, as always');
  catchNow(game, game.activities.current.fishing, 'uncommon', () => 0.5);
  const money = game.character.stats.money;
  updateAutonomy(game, 9 * MIN);
  assert.ok(game.autonomy.plan);
  const done = updateAutonomy(game, MIN);
  assert.equal(done.ended, true);
  assert.equal(game.autonomy.plan, null);
  assert.equal(currentActivity(game), null);
  assert.match(done.news.text, /Sold 1/);
  assert.ok(game.character.stats.money > money);
});

test('busking and resting plans start in their place and stop by themselves with a line', () => {
  const busker = lifeAt(20);
  startPlan(busker, { kind: 'busk', place: 'fortuneTree' }, () => 0);
  updateAutonomy(busker, 250);
  assert.equal(isPlaying(busker), true);
  arriveAtStay(busker);
  const done = updateAutonomy(busker, 10 * MIN);
  assert.equal(isPlaying(busker), false);
  assert.equal(done.news.text, AUTONOMY_TEXT.done.busk);

  const tired = lifeAt(20, { health: 50 });
  startPlan(tired, { kind: 'rest', place: 'myYard' }, () => 1);
  updateAutonomy(tired, 250);
  assert.equal(isResting(tired), false, 'not before getting there');
  assert.equal(tired.autonomy.plan, null, 'dropped: they never got there');
  startPlan(tired, { kind: 'rest', place: 'myYard' }, () => 1);
  enterPlace(tired, 'myYard');
  updateAutonomy(tired, 250);
  assert.equal(isResting(tired), true);
  arriveAtStay(tired);
  assert.equal(updateAutonomy(tired, 39 * MIN).ended, false);
  const rested = updateAutonomy(tired, MIN);
  assert.equal(isResting(tired), false);
  assert.equal(rested.news.text, AUTONOMY_TEXT.done.rest);
});

test('a visit ends on arrival with nothing started', () => {
  const game = lifeAt(20);
  startPlan(game, { kind: 'visit', place: 'lake' });
  updateAutonomy(game, 250, { travelling: true });
  assert.ok(game.autonomy.plan);
  enterPlace(game, 'lake');
  const result = updateAutonomy(game, 250);
  assert.equal(result.ended, true);
  assert.equal(game.autonomy.plan, null);
  assert.equal(currentActivity(game), null);
});

test('the player overrides a plan: stopping it, calling it off, or turning the setting off', () => {
  const game = lifeAt(20, { rod: true });
  enterPlace(game, 'lake');
  startPlan(game, { kind: 'fish', place: 'lake' });
  updateAutonomy(game, 250);
  arriveAtStay(game);
  // The player stops fishing: the plan is dropped, no bubble from it.
  stopActivity(game);
  assert.deepEqual(updateAutonomy(game, 250), { changed: true, ended: true, news: null });
  // Calling it off (the player started something) leaves it running.
  startPlan(game, { kind: 'fish', place: 'lake' });
  updateAutonomy(game, 250);
  assert.equal(cancelPlan(game), true);
  assert.equal(currentActivity(game)?.id, 'fishing');
  assert.equal(cancelPlan(game), false);
  stopActivity(game);
  // Turning the setting off ends one under way, stopping its thing.
  startPlan(game, { kind: 'fish', place: 'lake' });
  updateAutonomy(game, 250);
  arriveAtStay(game);
  const news = endPlanNow(game);
  assert.equal(currentActivity(game), null);
  assert.match(news.text, /Sold|nothing/i);
  assert.equal(game.autonomy.plan, null);
});

test('a plan whose trip ended elsewhere, or whose life ended, is dropped', () => {
  const game = lifeAt(20);
  startPlan(game, { kind: 'busk', place: 'lake' });
  assert.equal(updateAutonomy(game, 250).ended, true);
  startPlan(game, { kind: 'visit', place: 'lake' });
  game.endOfLife.ended = { id: 'x' };
  assert.equal(updateAutonomy(game, 250).ended, true);
  assert.equal(game.autonomy.plan, null);
});

test('a plan is saved and restored; bad data gives none', () => {
  const game = lifeAt(20);
  startPlan(game, { kind: 'rest', place: 'myYard' }, () => 0.5);
  const restored = restoreAutonomyState(JSON.parse(JSON.stringify(game.autonomy)));
  assert.deepEqual(restored, game.autonomy);
  assert.deepEqual(restoreAutonomyState(undefined), createAutonomyState());
  assert.deepEqual(restoreAutonomyState({ plan: { kind: 'dance', place: 'lake', stage: 'going', leftMs: 5 } }),
    createAutonomyState());
  assert.deepEqual(startNewLife({ clock: createClock() }).autonomy, createAutonomyState());
});
