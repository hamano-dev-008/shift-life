// activities.test.mjs — The activity system and fishing: buying the rod,
// starting and stopping, the bite/reel/catch cycle in real time, click
// odds, earnings per minute, selling the bucket (also on travel), the
// event freeze, the fish collection across lives, the life summary,
// saving, a data-only fixed-time activity, and the dev actions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife, lifeSummary, restoreSummary } from '../src/game/endOfLife.js';
import {
  activityById, activityAt, activityView, buyItem, startActivity, stopActivity, updateActivities,
  activityFreezesEvents, hasItem, restoreActivityState, canStart,
} from '../src/game/activities.js';
import {
  catchOdds, pickCatch, reelIn, createCollection, restoreCollection, collectionSaveData, collectionView,
  fishingStatus, fishingLook,
} from '../src/game/fishing.js';
import { leavePlace, settlePlace, placeView } from '../src/game/places.js';
import { fishBiteNow, catchRarityNow, giveFishingRod } from '../src/game/dev.js';
import { PLACE_ACTIVITIES } from '../src/data/activities.js';
import { FISHING_TIMES, RARITIES, FISH } from '../src/data/fishing.js';
import { LAKE_PLACE, DOCK_PROP } from '../src/data/lake.js';

const SECOND = 1000;

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

// A life aged `age` at the Lake, with `money` and a collection.
function lifeAt(age, { money = 100, rod = true } = {}) {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.5;
  game.endOfLife.checkedAge = age;
  game.housing.movedOut = age >= 18;
  game.place = LAKE_PLACE;
  game.character.stats.money = money;
  game.collection = createCollection();
  if (rod) giveFishingRod(game);
  return game;
}

test('every activity is done at a prop that exists and can be clicked in its place', () => {
  const game = lifeAt(30);
  for (const [id, def] of Object.entries(PLACE_ACTIVITIES)) {
    const place = placeView(game, def.place);
    assert.ok(place, id);
    assert.ok(def.prop in place.targets, id);
    assert.equal(activityAt(def.place, def.prop).id, id);
    assert.ok(def.runs === 'untilStopped' || def.runs.minutes > 0, id);
  }
  assert.equal(activityAt(LAKE_PLACE, DOCK_PROP).id, 'fishing');
  assert.equal(activityAt('fortuneTree', DOCK_PROP), null);
});

test('the rod: from age 6, $30, disabled with how much more is needed', () => {
  const young = lifeAt(5, { rod: false });
  assert.equal(activityView(young, 'fishing').unlocked, false);
  assert.match(activityView(young, 'fishing').tooYoung, /age 6/);
  assert.equal(buyItem(young, 'fishing'), null);

  const poor = lifeAt(8, { money: 18, rod: false });
  const view = activityView(poor, 'fishing');
  assert.equal(view.buy.label, 'Buy a fishing rod - $30');
  assert.equal(view.buy.affordable, false);
  assert.equal(view.buy.need, 'Need $12 more');
  assert.equal(view.toggle, null);
  assert.equal(buyItem(poor, 'fishing'), null);
  assert.equal(canStart(poor, 'fishing'), false);

  poor.character.stats.money = 45;
  const news = buyItem(poor, 'fishing');
  assert.deepEqual(news.deltas, { money: -30 });
  assert.equal(poor.character.stats.money, 15);
  assert.equal(hasItem(poor, 'fishingRod'), true);
  assert.equal(buyItem(poor, 'fishing'), null);
  assert.equal(activityView(poor, 'fishing').toggle.label, 'Start fishing');
});

test('fishing only starts at the Lake with a rod, and freezes events while it runs', () => {
  const game = lifeAt(12);
  game.place = 'fortuneTree';
  assert.equal(startActivity(game, 'fishing'), false);
  game.place = LAKE_PLACE;
  assert.equal(startActivity(game, 'fishing'), true);
  assert.equal(startActivity(game, 'fishing'), false);
  assert.equal(activityFreezesEvents(game), true);
  assert.equal(activityView(game, 'fishing').toggle.label, 'Stop fishing');
  stopActivity(game);
  assert.equal(activityFreezesEvents(game), false);
});

test('a bite comes after a real-time wait; ignored, it reels in at normal odds, then casts again', () => {
  const game = lifeAt(20);
  const random = seeded(7);
  startActivity(game, 'fishing', random);
  const fishing = game.activities.current.fishing;
  const [min, max] = FISHING_TIMES.biteWait;
  assert.ok(fishing.waitMs >= min * SECOND && fishing.waitMs <= max * SECOND);
  assert.equal(fishingLook(fishing).phase, 'cast');

  // Ticks of 250ms, like the renderer's life tick.
  const tick = (ms) => {
    const bubbles = [];
    for (let t = 0; t < ms; t += 250) bubbles.push(...updateActivities(game, 250, random));
    return bubbles;
  };
  assert.deepEqual(tick(fishing.waitMs - 500), []);
  assert.equal(fishing.phase, 'waiting');
  tick(500);
  assert.equal(fishing.phase, 'bite');
  tick(FISHING_TIMES.biteWindow * SECOND);
  assert.equal(fishing.phase, 'reeling');
  const landed = tick(FISHING_TIMES.reel * SECOND);
  assert.equal(landed.length, 1);
  assert.equal(fishing.phase, 'showing');
  assert.equal(fishing.bucket.length, 1);
  assert.equal(game.activities.totals.fishing.caught, 1);
  assert.equal(landed[0].collected, true);
  tick(FISHING_TIMES.show * SECOND);
  assert.equal(fishing.phase, 'waiting');
  assert.equal(fishing.catch, null);
  assert.match(fishingStatus(fishing)[1], /^Bucket: /);
});

test('clicking the "!" in time reels in at once with better odds for rarer fish', () => {
  const game = lifeAt(20);
  startActivity(game, 'fishing');
  const fishing = game.activities.current.fishing;
  assert.equal(reelIn(fishing), false);
  fishBiteNow(game);
  assert.equal(fishing.phase, 'bite');
  assert.equal(reelIn(fishing), true);
  assert.equal(fishing.phase, 'reeling');

  const share = (clicked, rarities) => {
    const odds = catchOdds(clicked);
    const total = odds.reduce((sum, entry) => sum + entry.weight, 0);
    return odds.filter(({ fish }) => rarities.includes(fish.rarity)).reduce((sum, e) => sum + e.weight, 0) / total;
  };
  for (const rarity of ['uncommon', 'rare', 'legendary']) {
    assert.ok(share(true, [rarity]) > share(false, [rarity]) * 1.5, rarity);
  }
  assert.ok(share(true, ['junk']) < share(false, ['junk']));

  const random = seeded(3);
  const counts = { true: 0, false: 0 };
  for (let i = 0; i < 20000; i++) {
    for (const clicked of [true, false]) {
      const id = pickCatch(clicked, random);
      if (FISH.find((f) => f.id === id).rarity === 'rare') counts[clicked] += 1;
    }
  }
  assert.ok(counts.true > counts.false * 1.8);
});

test('ignoring every bite earns about $4 a real minute', () => {
  // Expected value per catch over the expected cycle length.
  const odds = catchOdds(false);
  const total = odds.reduce((sum, e) => sum + e.weight, 0);
  const average = odds.reduce((sum, { fish, weight }) => {
    const value = Array.isArray(fish.value) ? (fish.value[0] + fish.value[1]) / 2 : fish.value;
    return sum + value * weight;
  }, 0) / total;
  const { biteWait, biteWindow, reel, show } = FISHING_TIMES;
  const cycleMinutes = ((biteWait[0] + biteWait[1]) / 2 + biteWindow + reel + show) / 60;
  const perMinute = average / cycleMinutes;
  assert.ok(perMinute > 3.6 && perMinute < 4.4, `$${perMinute.toFixed(2)}/min`);
  assert.deepEqual(RARITIES.map((r) => r.id), ['junk', 'common', 'uncommon', 'rare', 'legendary']);

  // And a simulated 40 real hours of it, in 2s ticks.
  const game = lifeAt(30, { money: 0 });
  const random = seeded(42);
  startActivity(game, 'fishing', random);
  const minutes = 40 * 60;
  for (let ms = 0; ms < minutes * 60 * SECOND; ms += 2000) updateActivities(game, 2000, random);
  stopActivity(game);
  const simulated = game.character.stats.money / minutes;
  assert.ok(simulated > 3.3 && simulated < 4.7, `$${simulated.toFixed(2)}/min simulated`);
});

test('stopping sells the bucket with the total in a bubble; travelling or leaving does too', () => {
  const game = lifeAt(25, { money: 0 });
  startActivity(game, 'fishing');
  catchRarityNow(game, 'rare');
  catchRarityNow(game, 'uncommon');
  catchRarityNow(game, 'junk');
  const news = stopActivity(game);
  assert.equal(news.text, 'Sold 3 for $65.');
  assert.deepEqual(news.deltas, { money: 65 });
  assert.equal(game.character.stats.money, 65);
  assert.equal(game.activities.current, null);
  assert.equal(game.activities.totals.fishing.earned, 65);

  startActivity(game, 'fishing');
  assert.equal(stopActivity(game).text, 'Nothing in the bucket to sell.');

  startActivity(game, 'fishing');
  catchRarityNow(game, 'legendary');
  assert.equal(leavePlace(game), true);
  assert.equal(game.character.stats.money, 365);

  startActivity(game, 'fishing');
  catchRarityNow(game, 'uncommon');
  game.place = 'fortuneTree';
  settlePlace(game);
  assert.equal(game.activities.current, null);
  assert.equal(game.character.stats.money, 380);
});

test('the collection keeps the first catch of each kind across lives, and the summary counts it', () => {
  const game = lifeAt(23);
  game.character.name = 'Mia';
  startActivity(game, 'fishing');
  assert.equal(catchRarityNow(game, 'legendary').news.collected, true);
  assert.equal(catchRarityNow(game, 'legendary').news.collected, false);
  assert.deepEqual({ ...game.collection.fish.goldenKoi, on: '' }, { name: 'Mia', age: 23, on: '' });

  const view = collectionView(game.collection);
  assert.equal(view.count, 1);
  assert.equal(view.total, FISH.length);
  assert.equal(view.fish.find((f) => f.id === 'goldenKoi').first, 'Mia, age 23');
  assert.equal(view.fish.find((f) => f.id === 'carp').first, null);

  const summary = lifeSummary(game);
  assert.deepEqual(summary.fish, { caught: 2, count: 1, total: FISH.length });
  assert.deepEqual(restoreSummary(JSON.parse(JSON.stringify(summary))).fish, summary.fish);
  assert.equal(restoreSummary({ ...summary, fish: undefined }).fish, null);

  // A new life keeps the collection (it's not part of the life), but not
  // the rod or the count.
  const { collection } = game;
  startNewLife(game);
  assert.equal(game.collection, collection);
  assert.equal(game.activities.totals.fishing.caught, 0);
  assert.equal(hasItem(game, 'fishingRod'), false);

  const restored = restoreCollection(JSON.parse(JSON.stringify(collectionSaveData(collection))));
  assert.deepEqual(restored, collection);
  assert.deepEqual(restoreCollection({ fish: { nope: { name: 'X', age: 1 }, carp: { name: '', age: 2 } } }),
    createCollection());
  assert.deepEqual(restoreCollection(null), createCollection());
});

test('activity state saves and loads, keeping the bucket and where the wait is', () => {
  const game = lifeAt(30);
  startActivity(game, 'fishing');
  catchRarityNow(game, 'common');
  updateActivities(game, 1000);
  const saved = JSON.parse(JSON.stringify(game.activities));
  const restored = restoreActivityState(saved);
  assert.deepEqual(restored, game.activities);
  assert.deepEqual(restoreActivityState(undefined).current, null);
  assert.deepEqual(restoreActivityState({ current: { id: 'nope' }, items: ['x', 'fishingRod'] }).items, ['fishingRod']);
  const broken = restoreActivityState({ current: { id: 'fishing', fishing: { phase: 'reeling', catch: 'nope' } } });
  assert.equal(broken.current.fishing.phase, 'waiting');
});

test('a new activity needs only data: a fixed-time run with rewards', () => {
  PLACE_ACTIVITIES.testShift = {
    name: 'Test shift',
    place: LAKE_PLACE,
    prop: 'lake.test',
    facing: 'right',
    minAge: 18,
    runs: { minutes: 2 },
    rewards: { every: { minutes: 1, stats: { smarts: 1 } }, onFinish: { money: 40 } },
    freezeEvents: false,
    animation: 'idle',
    text: { title: 'Shift', tooYoung: 'At {age}.', start: 'Work', stop: 'Stop', done: { heading: 'Shift', text: 'Done!' } },
  };
  try {
    const game = lifeAt(20, { money: 0 });
    game.character.stats.smarts = 10;
    assert.equal(activityById('testShift').runs.minutes, 2);
    assert.equal(startActivity(game, 'testShift'), true);
    assert.equal(activityFreezesEvents(game), false);
    let bubbles = [];
    for (let ms = 0; ms < 2 * 60 * SECOND; ms += 2000) bubbles = bubbles.concat(updateActivities(game, 2000));
    assert.equal(game.activities.current, null);
    assert.equal(game.character.stats.smarts, 12);
    assert.equal(game.character.stats.money, 40);
    assert.equal(bubbles.at(-1).text, 'Done!');
  } finally {
    delete PLACE_ACTIVITIES.testShift;
  }
});

test('dev actions: a bite or a catch needs fishing; give rod', () => {
  const game = lifeAt(15, { rod: false });
  assert.equal(fishBiteNow(game).note, 'Not fishing.');
  assert.equal(catchRarityNow(game, 'rare').note, 'Not fishing.');
  assert.equal(giveFishingRod(game), true);
  assert.equal(giveFishingRod(game), false);
  startActivity(game, 'fishing');
  assert.equal(fishBiteNow(game).bit, true);
  assert.equal(fishBiteNow(game).bit, false);
  const { news } = catchRarityNow(game, 'legendary');
  assert.equal(news.celebrate, true);
  assert.match(news.text, /golden koi/);
  assert.equal(game.activities.current.fishing.bucket[0].value, 300);
});
