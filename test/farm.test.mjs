// farm.test.mjs — The Farm: the place (right of the yard, the parents'
// before moving out and My Yard after, open on the left only, its feet
// row on the path and walking limits), the paddies' props and click areas
// over their water, owning and buying paddies, the age to farm, planting
// ($5), real-time growth over 6 hours through seedlings, young and ripe
// (only through the ms the life tick passes), weeds coming up at most
// once and the +20% for pulling them, the harvest ($25, $30 weeded) back
// to water, jobs only counting once arrived, the activity bar and Stop,
// leaving cancelling a job, saving, the dev actions, and the character's
// own plans to plant, weed and harvest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { createCollection } from '../src/game/fishing.js';
import {
  placeView, routeBetween, existingPlaces, enterPlace, leavePlace,
} from '../src/game/places.js';
import { arriveAtStay, reportArrival, hasArrived, stayKey } from '../src/game/stay.js';
import { activityBarView, stopFromBar } from '../src/game/activityBar.js';
import { saveGame, loadGame } from '../src/game/save.js';
import {
  GROW_MS, createFarmState, restoreFarmState, stageOf, canDo, buyPaddy, startFarmJob,
  currentFarmJob, updateFarm, paddyView, paddiesLook, growAllNextStage, giveAllPaddies,
  harvestPay, farmText,
} from '../src/game/farm.js';
import {
  possibleChoices, choiceWeight, choosePlan, startPlan, updateAutonomy, restoreAutonomyState,
} from '../src/game/autonomy.js';
import { computeLayout, propClickRect } from '../src/ui/scene.js';
import { createAnimator, updateAnimator, hasSettled } from '../src/ui/animator.js';
import {
  FARM_PLACE, FARM_ART, FARM_FEET_FROM_BOTTOM, FARM_WALK, FARM_MIN_AGE, PADDIES, PADDY_WATER,
  RICE, FARM_JOBS, FARM_TEXT,
} from '../src/data/farm.js';
import { AUTONOMY_TEXT } from '../src/data/autonomy.js';
import { SCENE_SCALE } from '../src/data/layout.js';
import { readFileSync } from 'node:fs';

const W = 320;
const H = 240;
const HOUR = 3600000;
const [P1, P2, P3] = PADDIES.map((paddy) => paddy.id);

// Random numbers from a list (the last repeated).
function from(...values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}
const noWeeds = () => 0.99;

// A life at `age` (moved out from 18), at the Farm, with `money`.
function lifeAt(age = 20, { money = 0, place = FARM_PLACE, goal = 'free', traits = [] } = {}) {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.5;
  game.character.stats.money = money;
  game.character.stats.health = 90;
  game.character.traits = traits;
  game.goals.active = goal;
  game.collection = createCollection();
  if (age >= 18) {
    game.housing.movedOut = true;
    game.housing.tier = 'sleepingBag';
  }
  game.place = place;
  return game;
}

// Runs the life tick's farm update for `ms` in 250 ms steps.
function run(game, ms, random = noWeeds) {
  const news = [];
  for (let t = 0; t < ms; t += 250) news.push(...updateFarm(game, Math.min(250, ms - t), random));
  return news;
}

// Starts a job and does it: walks there (arrives) and works its time.
function doJob(game, id, action, random = noWeeds) {
  assert.equal(startFarmJob(game, id, action), true, `${action} at ${id}`);
  arriveAtStay(game);
  return run(game, FARM_JOBS[action].seconds * 1000, random);
}

test('the Farm is right of the yard: the parents\' yard growing up, My Yard after moving out', () => {
  const child = lifeAt(12, { place: 'yard' });
  assert.ok(existingPlaces(child).some((place) => place.id === FARM_PLACE));
  assert.deepEqual(routeBetween(child, 'lake', FARM_PLACE), ['fortuneTree', 'yard', FARM_PLACE]);
  assert.deepEqual(routeBetween(child, FARM_PLACE, 'home'), ['yard', 'home']);
  const adult = lifeAt(30, { place: 'myYard' });
  assert.deepEqual(routeBetween(adult, 'lake', FARM_PLACE), ['fortuneTree', 'myYard', FARM_PLACE]);
  assert.deepEqual(routeBetween(adult, FARM_PLACE, 'fortuneTree'), ['myYard', 'fortuneTree']);
  const farm = placeView(adult, FARM_PLACE);
  assert.equal(farm.name, 'Farm');
  assert.deepEqual(farm.exits.map((exit) => exit.via), ['left', 'town', 'town', 'town', 'town', 'town', 'town'], 'only the left side leads anywhere (and town)');
  const baby = lifeAt(1, { place: 'yard' });
  assert.ok(existingPlaces(baby).some((place) => place.id === FARM_PLACE), 'any age can visit');
});

test('the Farm\'s feet row is on the path, open on the left, walking stops before the right edge', () => {
  const layout = computeLayout(W, H, placeView(lifeAt(), FARM_PLACE));
  assert.equal(FARM_FEET_FROM_BOTTOM, 5);
  assert.equal(layout.feetY, H - (FARM_ART.height - 75) * SCENE_SCALE, 'feet on picture row 75');
  assert.deepEqual(layout.openSides, { left: true, right: false });
  assert.equal(layout.wanderMaxX, FARM_WALK.maxX * SCENE_SCALE);
  assert.ok(layout.wanderMaxX < W);
});

test('each paddy\'s click area covers its water, and its spot is on the path in front of it', () => {
  const game = lifeAt();
  const layout = computeLayout(W, H, placeView(game, FARM_PLACE));
  const top = H - FARM_ART.height * SCENE_SCALE;
  assert.deepEqual(PADDIES.map(({ left, right }) => [left, right]), [[1, 20], [22, 37], [39, 57]]);
  assert.deepEqual(PADDY_WATER, { top: 65, bottom: 69 });
  for (const paddy of PADDIES) {
    const rect = propClickRect(layout, paddy.id);
    assert.equal(rect.left, paddy.left * SCENE_SCALE, paddy.id);
    assert.equal(rect.width, (paddy.right - paddy.left + 1) * SCENE_SCALE, paddy.id);
    assert.equal(rect.top, top + PADDY_WATER.top * SCENE_SCALE, paddy.id);
    assert.equal(rect.height, (PADDY_WATER.bottom - PADDY_WATER.top + 1) * SCENE_SCALE, paddy.id);
    const spot = layout.props[paddy.id].visitX;
    assert.ok(spot > rect.left && spot < rect.left + rect.width, `${paddy.id} spot in front`);
    assert.equal(layout.props[paddy.id].visit, false, 'not visited on a whim');
  }
});

test('paddy 1 is owned from the start; 2 and 3 cost $100 and $250, offered on the first click', () => {
  const game = lifeAt(20, { money: 120 });
  assert.deepEqual(Object.values(game.farm.paddies).map((p) => p.owned), [true, false, false]);
  const view = paddyView(game, P2);
  assert.deepEqual(view.options.map((o) => [o.action, o.label, o.enabled]), [['buy', 'Buy this paddy - $100', true]]);
  const three = paddyView(game, P3);
  assert.equal(three.options[0].enabled, false);
  assert.ok(three.status.includes('Need $130 more.'));
  assert.equal(buyPaddy(game, P3), null, 'too dear');
  const news = buyPaddy(game, P2);
  assert.equal(news.deltas.money, -100);
  assert.equal(game.character.stats.money, 20);
  assert.equal(game.farm.paddies[P2].owned, true);
  assert.equal(buyPaddy(game, P2), null, 'already owned');
  assert.equal(paddyView(game, P2).options[0].action, 'plant', 'then it offers planting');
});

test('farming starts at 10; younger ones are told to come back', () => {
  assert.equal(FARM_MIN_AGE, 10);
  const young = lifeAt(9, { money: 500, place: FARM_PLACE });
  assert.equal(canDo(young, P1, 'plant'), false);
  assert.equal(startFarmJob(young, P1, 'plant'), false);
  assert.equal(buyPaddy(young, P2), null);
  assert.deepEqual(paddyView(young, P1).options, []);
  assert.match(paddyView(young, P1).status[0], /10/);
  assert.equal(canDo(lifeAt(10, { money: 5 }), P1, 'plant'), true);
});

test('planting costs $5, and only at the Farm with the money', () => {
  const broke = lifeAt(20, { money: 4 });
  assert.equal(startFarmJob(broke, P1, 'plant'), false);
  assert.equal(paddyView(broke, P1).options[0].enabled, false);
  const away = lifeAt(20, { money: 50, place: 'fortuneTree' });
  assert.equal(startFarmJob(away, P1, 'plant'), false, 'only at the Farm');
  const game = lifeAt(20, { money: 50 });
  const news = doJob(game, P1, 'plant');
  assert.equal(news.length, 1);
  assert.equal(news[0].text, FARM_TEXT.planted.text);
  assert.equal(game.character.stats.money, 45);
  assert.equal(stageOf(game.farm.paddies[P1].crop), 'seedling');
  assert.equal(currentFarmJob(game), null);
});

test('rice grows over 6 real hours: seedlings, young, then ripe; only by the ms passed', () => {
  assert.equal(RICE.growHours, 6);
  const game = lifeAt(20, { money: 50 });
  doJob(game, P1, 'plant');
  const crop = game.farm.paddies[P1].crop;
  updateFarm(game, 1.9 * HOUR, noWeeds);
  assert.equal(stageOf(crop), 'seedling');
  updateFarm(game, 0.2 * HOUR, noWeeds);
  assert.equal(stageOf(crop), 'young');
  // Closing the app passes no ms: the save keeps where it was.
  const reloaded = restoreFarmState(JSON.parse(JSON.stringify(game.farm)));
  assert.equal(reloaded.paddies[P1].crop.ms, crop.ms);
  updateFarm(game, 3.8 * HOUR, noWeeds);
  assert.equal(stageOf(crop), 'young');
  updateFarm(game, 0.2 * HOUR, noWeeds);
  assert.equal(stageOf(crop), 'ripe');
  assert.equal(crop.ms, GROW_MS);
  assert.deepEqual(paddiesLook(game)[0], { id: P1, stage: 'ripe', weeds: false, owned: true });
  assert.equal(paddyView(game, P1).options[0].action, 'harvest');
});

test('harvesting a ripe paddy sells it for $25 and it goes back to water', () => {
  const game = lifeAt(20, { money: 5 });
  doJob(game, P1, 'plant');
  updateFarm(game, GROW_MS, noWeeds);
  const news = doJob(game, P1, 'harvest');
  assert.equal(news[0].heading, FARM_TEXT.harvested.heading);
  assert.equal(news[0].text, 'Sold the rice for $25.');
  assert.equal(game.character.stats.money, 25);
  assert.equal(game.farm.paddies[P1].crop, null);
  assert.equal(game.farm.harvested, 1);
  assert.equal(game.farm.earned, 25);
  assert.equal(canDo(game, P1, 'harvest'), false);
});

test('weeds come up at most once while growing; pulling them adds 20% to the harvest', () => {
  // Weeds due halfway: the first roll is under the chance, then where.
  const game = lifeAt(20, { money: 5 });
  doJob(game, P1, 'plant', from(0.1, 0.6));
  const crop = game.farm.paddies[P1].crop;
  assert.ok(crop.weedsAt > 0.2 * GROW_MS && crop.weedsAt < 0.7 * GROW_MS);
  updateFarm(game, crop.weedsAt - 1, noWeeds);
  assert.equal(crop.weeds, false);
  updateFarm(game, 2, noWeeds);
  assert.equal(crop.weeds, true);
  assert.equal(paddiesLook(game)[0].weeds, true);
  assert.equal(paddyView(game, P1).options[0].action, 'weed');
  const news = doJob(game, P1, 'weed');
  assert.equal(news[0].text, FARM_TEXT.pulled.text);
  assert.equal(crop.weeds, false);
  assert.equal(crop.weeded, true);
  updateFarm(game, GROW_MS, noWeeds);
  assert.equal(crop.weeds, false, 'never twice');
  assert.equal(harvestPay(crop), 30);
  doJob(game, P1, 'harvest');
  assert.equal(game.character.stats.money, 30);
  // Without the roll, no weeds at all.
  const clean = lifeAt(20, { money: 5 });
  doJob(clean, P1, 'plant', noWeeds);
  updateFarm(clean, GROW_MS, noWeeds);
  assert.equal(clean.farm.paddies[P1].crop.weeds, false);
  assert.equal(harvestPay(clean.farm.paddies[P1].crop), 25);
});

test('a job only counts once they\'ve walked to the paddy; the bar shows it and Stop ends it', () => {
  const game = lifeAt(20, { money: 50 });
  assert.equal(startFarmJob(game, P1, 'plant'), true);
  assert.equal(stayKey(game), `farm:${P1}`);
  assert.deepEqual(activityBarView(game), {
    kind: 'farm', text: FARM_TEXT.onTheWay, stop: activityBarView(game).stop, onTheWay: true,
  });
  run(game, 30000);
  assert.equal(game.farm.paddies[P1].crop, null, 'nothing on the way');
  assert.equal(game.character.stats.money, 50);
  arriveAtStay(game);
  assert.equal(hasArrived(game), true);
  assert.equal(activityBarView(game).text, FARM_TEXT.bar.plant);
  run(game, 2000);
  assert.ok(currentFarmJob(game).ms >= 2000);
  const stopped = stopFromBar(game);
  assert.equal(stopped.stopped, true);
  assert.equal(currentFarmJob(game), null);
  assert.equal(game.farm.paddies[P1].crop, null, 'stopped before done: not planted');
  assert.equal(game.character.stats.money, 50);
  assert.equal(activityBarView(game), null);
  // A new job needs a new arrival.
  startFarmJob(game, P1, 'plant');
  reportArrival(game, false);
  assert.equal(hasArrived(game), false);
});

test('leaving the Farm cancels a job; a job for something no longer possible is dropped', () => {
  const game = lifeAt(20, { money: 50 });
  startFarmJob(game, P1, 'plant');
  leavePlace(game);
  enterPlace(game, 'myYard');
  assert.equal(currentFarmJob(game), null);
  const there = lifeAt(20, { money: 50 });
  startFarmJob(there, P1, 'plant');
  there.character.stats.money = 0;
  arriveAtStay(there);
  run(there, 5000);
  assert.equal(currentFarmJob(there), null);
  assert.equal(there.farm.paddies[P1].crop, null);
});

// Saves `game` and loads it back, as the renderer does.
async function roundTrip(game) {
  let written = null;
  globalThis.window = {
    shiftLife: {
      save: (data) => { written = data; },
      loadSave: async () => JSON.parse(JSON.stringify(written)),
    },
  };
  try {
    saveGame(game);
    return await loadGame();
  } finally {
    delete globalThis.window;
  }
}

test('the farm is saved: paddies owned, crops, weeds, the job and totals', async () => {
  const game = lifeAt(20, { money: 500 });
  buyPaddy(game, P3);
  doJob(game, P1, 'plant', from(0.1, 0.5));
  updateFarm(game, 2 * HOUR, noWeeds);
  startFarmJob(game, P1, 'weed');
  const restored = await roundTrip(game);
  assert.deepEqual(restored.farm, game.farm);
  assert.deepEqual(restoreFarmState(undefined), createFarmState());
  const odd = restoreFarmState({
    paddies: { [P2]: { owned: true, crop: { ms: GROW_MS * 3 } }, nope: { owned: true } },
    job: { paddy: 'nope', action: 'plant' },
  });
  assert.equal(odd.paddies[P2].crop.ms, GROW_MS, 'capped at ripe');
  assert.equal(odd.paddies[P1].owned, true);
  assert.equal(odd.job, null);
  assert.equal(startNewLife({ clock: createClock() }).farm.paddies[P2].owned, false, 'a new life starts afresh');
});

test('dev: grow every owned paddy to its next stage, and give every paddy', () => {
  const game = lifeAt(20, { money: 0 });
  assert.equal(giveAllPaddies(game), true);
  assert.equal(giveAllPaddies(game), false);
  const stages = () => paddiesLook(game).map((look) => look.stage);
  growAllNextStage(game, noWeeds);
  assert.deepEqual(stages(), ['seedling', 'seedling', 'seedling'], 'planted free');
  assert.equal(game.character.stats.money, 0);
  growAllNextStage(game, noWeeds);
  assert.deepEqual(stages(), ['young', 'young', 'young']);
  growAllNextStage(game, noWeeds);
  assert.deepEqual(stages(), ['ripe', 'ripe', 'ripe']);
  assert.equal(growAllNextStage(game, noWeeds), 0, 'ripe stays ripe');
  assert.match(farmText(game), /^Farm: 1:ripe 2:ripe 3:ripe/);
});

test('their own plans: planting, weeding and harvesting when a paddy needs it', () => {
  const kinds = (game) => possibleChoices(game).map((choice) => choice.kind);
  const broke = lifeAt(20, { place: 'fortuneTree' });
  assert.ok(!kinds(broke).includes('plant'), 'no money for seed');
  const game = lifeAt(20, { money: 50, place: 'fortuneTree' });
  assert.ok(kinds(game).includes('plant'));
  assert.equal(possibleChoices(game).find((c) => c.kind === 'plant').place, FARM_PLACE);
  assert.ok(!kinds(lifeAt(9, { money: 50, place: 'fortuneTree' })).includes('plant'), 'not under 10');
  game.farm.paddies[P1].crop = { ms: GROW_MS, weedsAt: null, weeds: true, weeded: false };
  assert.deepEqual(kinds(game).filter((k) => ['plant', 'weed', 'harvest'].includes(k)), ['weed', 'harvest']);
  // Weighted toward Fortune and Healthy, away from lazy.
  for (const kind of ['plant', 'weed', 'harvest']) {
    const free = choiceWeight(lifeAt(), kind);
    assert.ok(choiceWeight(lifeAt(20, { goal: 'fortune' }), kind) > free, `fortune ${kind}`);
    assert.ok(choiceWeight(lifeAt(20, { goal: 'healthy' }), kind) > free, `healthy ${kind}`);
    assert.ok(choiceWeight(lifeAt(20, { traits: ['lazy'] }), kind) < free, `lazy ${kind}`);
  }
  assert.equal(AUTONOMY_TEXT.going.plant, 'Time to plant rice!');
  assert.ok(AUTONOMY_TEXT.going.weed && AUTONOMY_TEXT.going.harvest);
});

test('a farm plan walks there, does the job on arrival and ends when it\'s done', () => {
  const game = lifeAt(20, { money: 50, place: 'myYard' });
  assert.ok(choosePlan(game, () => 0));
  startPlan(game, { kind: 'plant', place: FARM_PLACE, text: AUTONOMY_TEXT.going.plant }, () => 0);
  assert.deepEqual(updateAutonomy(game, 250, { travelling: false }), {
    changed: true, ended: true, news: null,
  }, 'not there: dropped');
  startPlan(game, { kind: 'plant', place: FARM_PLACE }, () => 0);
  enterPlace(game, FARM_PLACE);
  const started = updateAutonomy(game, 250);
  assert.equal(started.changed, true);
  assert.equal(game.autonomy.plan.stage, 'doing');
  assert.deepEqual(currentFarmJob(game), { paddy: P1, action: 'plant', ms: 0 });
  // On the way: nothing yet, and no time limit counts.
  run(game, 10000);
  updateAutonomy(game, 60 * 60000);
  assert.ok(game.autonomy.plan, 'a farm plan has no time limit');
  arriveAtStay(game);
  const news = run(game, FARM_JOBS.plant.seconds * 1000);
  assert.equal(news[0].text, FARM_TEXT.planted.text);
  assert.deepEqual(updateAutonomy(game, 250), { changed: true, ended: true, news: null });
  assert.equal(game.autonomy.plan, null);
  // Saved plans of the farm kinds come back.
  const saved = { plan: { kind: 'harvest', place: FARM_PLACE, stage: 'doing', leftMs: 1000 } };
  assert.deepEqual(restoreAutonomyState(saved).plan, saved.plan);
});

test('the crops have sprite names, listed in data/sprites.js', () => {
  const listed = readFileSync(new URL('../src/data/sprites.js', import.meta.url), 'utf8');
  for (const name of ['farm.background', 'farm.rice.seedling', 'farm.rice.young', 'farm.rice.ripe', 'farm.weeds']) {
    assert.ok(listed.includes(name), name);
  }
  for (const animation of ['plant', 'weed', 'harvest']) assert.equal(FARM_JOBS[animation].animation, animation);
});

test("from one paddy's job to another's, they walk over before it counts", () => {
  const layout = computeLayout(W, H, placeView(lifeAt(), FARM_PLACE));
  const anim = createAnimator(layout);
  const stayAt = (id) => ({ x: layout.props[id].visitX, mode: 'doing', activity: 'weed', facing: 1 });
  const settle = (stay) => {
    for (let i = 0; i < 400 && !hasSettled(anim, stay); i++) updateAnimator(anim, 0.05, 'adult', 'walk', { stay });
    return hasSettled(anim, stay);
  };
  assert.equal(settle(stayAt(P1)), true);
  assert.ok(Math.abs(anim.x - layout.props[P1].visitX) < layout.scale);
  const next = stayAt(P3);
  assert.equal(hasSettled(anim, next), false, 'settled at paddy 1 is not at paddy 3');
  updateAnimator(anim, 0.05, 'adult', 'walk', { stay: next });
  assert.equal(hasSettled(anim, next), false, 'still on the way');
  assert.equal(settle(next), true);
  assert.ok(Math.abs(anim.x - layout.props[P3].visitX) < layout.scale, `at ${anim.x}`);
});
