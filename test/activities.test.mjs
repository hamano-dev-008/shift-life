// activities.test.mjs — The activity system and fishing: buying the rod,
// starting and stopping, the bite/reel/catch cycle in real time, click
// odds, earnings per minute, selling the bucket (also on travel), the
// event freeze, the fish collection across lives (with the biggest of
// each kind), sizes and their value, the life summary, saving, a
// data-only fixed-time activity, the catch reveal's timing and text, the
// activity bar, and the dev actions.
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
  fishingStatus, fishingLook, catchSize, catchValue, recordCatch, previewCatch, fishById, bucketTotals,
} from '../src/game/fishing.js';
import {
  createReveal, revealStage, revealLength, closeReveal, revealText,
} from '../src/game/catchReveal.js';
import { activityBarView, stopFromBar } from '../src/game/activityBar.js';
import { arriveAtStay } from '../src/game/stay.js';
import { startPlaying, isPlaying } from '../src/game/fortuneTree.js';
import { startResting, isResting } from '../src/game/home.js';
import { REVEAL_TIMES, REVEAL_RARITIES } from '../src/data/catchReveal.js';
import { leavePlace, settlePlace, placeView } from '../src/game/places.js';
import { fishBiteNow, catchRarityNow, giveFishingRod } from '../src/game/dev.js';
import { PLACE_ACTIVITIES } from '../src/data/activities.js';
import { FISHING_TIMES, RARITIES, FISH, SIZE_VALUE } from '../src/data/fishing.js';
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
  arriveAtStay(game);
  assert.equal(activityFreezesEvents(game), true);
  assert.equal(activityView(game, 'fishing').toggle.label, 'Stop fishing');
  stopActivity(game);
  assert.equal(activityFreezesEvents(game), false);
});

test('a bite comes after a real-time wait; ignored, it reels in at normal odds, then casts again', () => {
  const game = lifeAt(20);
  const random = seeded(7);
  startActivity(game, 'fishing', random);
  arriveAtStay(game);
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
  assert.equal(fishingLook(fishing).phase, 'land');
  assert.ok(landed[0].reveal.isNew);
  tick(Math.ceil(REVEAL_TIMES.suspense * 4) * 250);
  assert.equal(fishingLook(fishing).phase, 'show');
  tick(FISHING_TIMES.show * SECOND - Math.ceil(REVEAL_TIMES.suspense * 4) * 250);
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

test('ignoring every bite earns about $12 a real hour (AGENTS.md: fishing ~$12/h)', () => {
  // Expected value per catch over the expected cycle length.
  const odds = catchOdds(false);
  const total = odds.reduce((sum, e) => sum + e.weight, 0);
  const average = odds.reduce((sum, { fish, weight }) => {
    const value = Array.isArray(fish.value) ? (fish.value[0] + fish.value[1]) / 2 : fish.value;
    return sum + value * weight;
  }, 0) / total;
  const { biteWait, biteWindow, reel, show } = FISHING_TIMES;
  const cycleMinutes = ((biteWait[0] + biteWait[1]) / 2 + biteWindow + reel + show) / 60;
  const perHour = (average / cycleMinutes) * 60;
  assert.ok(perHour > 10.8 && perHour < 13.2, `$${perHour.toFixed(2)}/h`);
  assert.deepEqual(RARITIES.map((r) => r.id), ['junk', 'common', 'uncommon', 'rare', 'legendary']);

  // And a simulated 40 real hours of it, in 2s ticks.
  const game = lifeAt(30, { money: 0 });
  const random = seeded(42);
  startActivity(game, 'fishing', random);
  arriveAtStay(game);
  const minutes = 40 * 60;
  for (let ms = 0; ms < minutes * 60 * SECOND; ms += 2000) updateActivities(game, 2000, random);
  stopActivity(game);
  const simulated = (game.character.stats.money / minutes) * 60;
  assert.ok(simulated > 10 && simulated < 14, `$${simulated.toFixed(2)}/h simulated`);
});

test('stopping sells the bucket with the total in a bubble; travelling or leaving does too', () => {
  const game = lifeAt(25, { money: 0 });
  startActivity(game, 'fishing');
  catchRarityNow(game, 'rare');
  catchRarityNow(game, 'uncommon');
  catchRarityNow(game, 'junk');
  const sold = bucketTotals(game.activities.current.fishing);
  assert.equal(sold.count, 3);
  const news = stopActivity(game);
  assert.equal(news.text, `Sold 3 for $${sold.total}.`);
  assert.deepEqual(news.deltas, { money: sold.total });
  assert.equal(game.character.stats.money, sold.total);
  assert.equal(game.activities.current, null);
  assert.equal(game.activities.totals.fishing.earned, sold.total);

  startActivity(game, 'fishing');
  arriveAtStay(game);
  assert.equal(stopActivity(game).text, 'Nothing in the bucket to sell.');

  let money = game.character.stats.money;
  startActivity(game, 'fishing');
  catchRarityNow(game, 'legendary');
  const koi = bucketTotals(game.activities.current.fishing).total;
  assert.equal(leavePlace(game), true);
  assert.equal(game.character.stats.money, money + koi);

  money = game.character.stats.money;
  startActivity(game, 'fishing');
  catchRarityNow(game, 'uncommon');
  const trout = bucketTotals(game.activities.current.fishing).total;
  game.place = 'fortuneTree';
  settlePlace(game);
  assert.equal(game.activities.current, null);
  assert.equal(game.character.stats.money, money + trout);
});

test('the collection keeps the first catch of each kind across lives, and the summary counts it', () => {
  const game = lifeAt(23);
  game.character.name = 'Mia';
  startActivity(game, 'fishing');
  const first = catchRarityNow(game, 'legendary').news;
  assert.equal(first.collected, true);
  assert.equal(first.reveal.isNew, true);
  assert.equal(catchRarityNow(game, 'legendary').news.reveal.isNew, false);
  const koi = game.collection.fish.goldenKoi;
  assert.deepEqual({ ...koi, on: '', best: null }, { name: 'Mia', age: 23, on: '', best: null });
  assert.equal(koi.best.name, 'Mia');

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
    arriveAtStay(game);
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
  const [koi] = game.activities.current.fishing.bucket;
  assert.ok(koi.value >= 10 * (1 - SIZE_VALUE) && koi.value <= 10 * (1 + SIZE_VALUE), `${koi.value}`);
  assert.ok(koi.size >= 40 && koi.size <= 75);
});

test('each catch has a size in its range; bigger ones sell for a little more, junk has none', () => {
  const random = seeded(11);
  for (const fish of FISH) {
    const size = catchSize(fish, random);
    if (fish.rarity === 'junk') {
      assert.equal(size, null, fish.id);
      assert.equal(fish.size, undefined, fish.id);
      continue;
    }
    const [min, max] = fish.size;
    assert.ok(min > 0 && max > min, fish.id);
    assert.ok(Number.isInteger(size) && size >= min && size <= max, fish.id);
  }
  const koi = fishById('goldenKoi');
  assert.equal(catchValue(koi, koi.size[0]), Math.round(10 * (1 - SIZE_VALUE)));
  assert.equal(catchValue(koi, koi.size[1]), Math.round(10 * (1 + SIZE_VALUE)));
  assert.equal(catchValue(koi, (koi.size[0] + koi.size[1]) / 2), 10);
  assert.equal(catchValue(fishById('boot'), null), 0);

  // On average, sizes don't change what fishing earns.
  for (const id of ['trout', 'pike', 'goldenKoi']) {
    const fish = fishById(id);
    let sum = 0;
    const [min, max] = fish.size;
    for (let size = min; size <= max; size++) sum += catchValue(fish, size);
    const average = sum / (max - min + 1);
    assert.ok(Math.abs(average - fish.value) / fish.value < 0.02, `${id} ${average}`);
  }
});

test('the collection keeps the biggest of each kind: a record only when beaten', () => {
  const collection = createCollection();
  assert.deepEqual(recordCatch(collection, 'pike', 'Mia', 20, 60), { isNew: true, record: false, changed: true });
  assert.deepEqual(collection.fish.pike.best, { size: 60, name: 'Mia', age: 20 });
  assert.deepEqual(recordCatch(collection, 'pike', 'Bo', 30, 60), { isNew: false, record: false, changed: false });
  assert.deepEqual(recordCatch(collection, 'pike', 'Bo', 31, 59), { isNew: false, record: false, changed: false });
  assert.deepEqual(recordCatch(collection, 'pike', 'Bo', 32, 75), { isNew: false, record: true, changed: true });
  assert.deepEqual(collection.fish.pike.best, { size: 75, name: 'Bo', age: 32 });
  // Junk has no size: no biggest, no record.
  recordCatch(collection, 'boot', 'Mia', 20, null);
  assert.equal(collection.fish.boot.best, undefined);
  assert.deepEqual(recordCatch(collection, 'boot', 'Mia', 21, null), { isNew: false, record: false, changed: false });

  // A kind first caught before sizes gets its biggest without a record.
  const old = restoreCollection({ fish: { carp: { name: 'Al', age: 9, on: '' } } });
  assert.equal(old.fish.carp.best, undefined);
  assert.deepEqual(recordCatch(old, 'carp', 'Al', 40, 30), { isNew: false, record: false, changed: true });
  assert.deepEqual(recordCatch(old, 'carp', 'Al', 41, 31), { isNew: false, record: true, changed: true });

  const view = collectionView(collection);
  assert.equal(view.fish.find((f) => f.id === 'pike').biggest, 'Biggest: 75 cm (Bo)');
  assert.equal(view.fish.find((f) => f.id === 'boot').biggest, null);
  assert.equal(view.fish.find((f) => f.id === 'carp').biggest, null);

  const restored = restoreCollection(JSON.parse(JSON.stringify(collectionSaveData(collection))));
  assert.deepEqual(restored, collection);
  const bad = restoreCollection({ fish: { pike: { name: 'Mia', age: 1, best: { size: -3, name: 'Mia', age: 1 } } } });
  assert.equal(bad.fish.pike.best, undefined);

  // The bucket keeps sizes through a save; old entries have none.
  const game = lifeAt(30);
  startActivity(game, 'fishing');
  catchRarityNow(game, 'rare');
  const saved = JSON.parse(JSON.stringify(game.activities));
  saved.current.fishing.bucket.push({ id: 'carp', value: 4 });
  const [rare, carp] = restoreActivityState(saved).current.fishing.bucket;
  assert.equal(rare.size, game.activities.current.fishing.bucket[0].size);
  assert.equal(carp.size, null);
});

test('previewing a reveal changes nothing and shows the badges a catch would get', () => {
  const game = lifeAt(30);
  const before = JSON.stringify([game.collection, game.activities, game.character.stats]);
  const preview = previewCatch(game, 'rare', seeded(5));
  assert.equal(fishById(preview.fish).rarity, 'rare');
  assert.equal(preview.isNew, true);
  assert.equal(preview.record, false);
  assert.equal(JSON.stringify([game.collection, game.activities, game.character.stats]), before);
  assert.equal(previewCatch(game, 'nope'), null);
  recordCatch(game.collection, 'salmon', 'Mia', 30, 50);
  recordCatch(game.collection, 'pike', 'Mia', 30, 45);
  const again = previewCatch(game, 'rare', seeded(5));
  assert.equal(again.isNew, false);
  assert.equal(again.record, again.size > game.collection.fish[again.fish].best.size);
});

test('the reveal: suspense, pop-in, hold, fade; rarer stays longer; a click fades it sooner', () => {
  const caught = (fish, extra = {}) => ({ fish, size: 50, value: 10, isNew: false, record: false, ...extra });
  const common = createReveal(caught('carp'));
  const { suspense, flash, popIn, fadeOut } = REVEAL_TIMES;
  assert.equal(common.rarity, 'common');
  assert.equal(revealStage(common, 0).stage, 'suspense');
  assert.equal(revealStage(common, 0).silhouette, true);
  assert.equal(revealStage(common, flash * 1.5).silhouette, false);
  assert.equal(revealStage(common, 0).alpha, 0);
  const pop = revealStage(common, suspense + popIn * 0.5);
  assert.equal(pop.stage, 'pop');
  assert.ok(pop.scale > 0 && pop.scale < 1.2);
  assert.equal(revealStage(common, suspense + popIn + 0.1).stage, 'hold');
  assert.equal(revealStage(common, suspense + popIn + 0.1).scale, 1);
  const end = revealLength(common);
  assert.equal(end, suspense + popIn + REVEAL_RARITIES.common.hold + fadeOut);
  assert.equal(revealStage(common, end - fadeOut / 2).stage, 'fade');
  assert.ok(Math.abs(revealStage(common, end - fadeOut / 2).alpha - 0.5) < 1e-9);
  assert.equal(revealStage(common, end).stage, 'done');
  assert.equal(revealStage(common, 0.6).flash, 0);
  assert.equal(revealStage(common, 3).spin, 0);

  // Rarer fish stay longer.
  const lengths = ['boot', 'carp', 'trout', 'salmon', 'goldenKoi'].map((id) => revealLength(createReveal(caught(id))));
  assert.deepEqual([...lengths].sort((a, b) => a - b), lengths);

  // Legendary: a gold flash as it pops in, and the rays turn.
  const koi = createReveal(caught('goldenKoi'));
  assert.ok(revealStage(koi, suspense).flash > 0.9);
  assert.equal(revealStage(koi, suspense + REVEAL_RARITIES.legendary.flash + 0.1).flash, 0);
  assert.ok(revealStage(koi, suspense + 2).spin > 0);
  assert.ok(REVEAL_RARITIES.legendary.sparkles > 0 && REVEAL_RARITIES.rare.sparkles > 0);

  // No suspense (a preview can skip it); a click starts the fade.
  const quick = createReveal(caught('carp'), { suspense: false });
  assert.equal(revealStage(quick, 0).stage, 'pop');
  closeReveal(quick, popIn + 0.5);
  assert.equal(revealStage(quick, popIn + 0.6).stage, 'fade');
  assert.equal(revealLength(quick), popIn + 0.5 + fadeOut);
  // A click during the pop-in fades once it's in.
  const early = createReveal(caught('carp'));
  closeReveal(early, suspense + 0.05);
  assert.equal(revealStage(early, suspense + popIn - 0.01).stage, 'pop');
  assert.equal(revealStage(early, suspense + popIn + 0.01).stage, 'fade');
});

test('the reveal card text: banner, name, size and value, badges; junk is low-key', () => {
  const card = revealText(createReveal({ fish: 'pike', size: 88, value: 54, isNew: true, record: false }));
  assert.equal(card.banner, 'RARE');
  assert.equal(card.title, 'Pike');
  assert.equal(card.detail, '88 cm - $54');
  assert.deepEqual(card.badges.map((b) => b.text), ['NEW!']);
  const record = revealText(createReveal({ fish: 'goldenKoi', size: 70, value: 330, isNew: false, record: true }));
  assert.equal(record.banner, 'LEGENDARY');
  assert.deepEqual(record.badges.map((b) => b.text), ['NEW RECORD!']);
  const boot = revealText(createReveal({ fish: 'boot', size: null, value: 0, isNew: false, record: false }));
  assert.equal(boot.banner, 'JUNK');
  assert.equal(boot.title, 'Just an old boot...');
  assert.equal(boot.junk, true);
  assert.deepEqual(boot.badges, []);
});

test('the activity bar: what is running, the bucket, and Stop as its own menu does', () => {
  const game = lifeAt(30, { money: 0 });
  assert.equal(activityBarView(game), null);
  assert.deepEqual(stopFromBar(game), { stopped: false, news: null });

  startActivity(game, 'fishing');
  arriveAtStay(game);
  assert.equal(activityBarView(game).text, 'Fishing - 0 fish - $0');
  assert.equal(activityBarView(game).stop, 'Stop');
  catchRarityNow(game, 'uncommon');
  catchRarityNow(game, 'common');
  const { total } = bucketTotals(game.activities.current.fishing);
  assert.equal(activityBarView(game).text, `Fishing - 2 fish - $${total}`);
  const { stopped, news } = stopFromBar(game);
  assert.equal(stopped, true);
  assert.equal(news.text, `Sold 2 for $${total}.`);
  assert.equal(game.character.stats.money, total);
  assert.equal(activityBarView(game), null);

  game.place = 'fortuneTree';
  startPlaying(game);
  arriveAtStay(game);
  assert.equal(activityBarView(game).kind, 'busking');
  assert.equal(activityBarView(game).text, 'Busking - 0:00 of 60:00');
  assert.equal(stopFromBar(game).stopped, true);
  assert.equal(isPlaying(game), false);

  startResting(game);
  arriveAtStay(game);
  game.character.stats.health = 64;
  assert.equal(activityBarView(game).text, 'Resting - Health 64/100');
  assert.deepEqual(stopFromBar(game), { stopped: true, news: null });
  assert.equal(isResting(game), false);

  startResting(game);
  game.endOfLife.ended = { id: 'x' };
  assert.equal(activityBarView(game), null);
});
