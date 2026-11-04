// weatherEffects.test.mjs — What the weather does: the rice grows 25%
// faster in wet weather, fishing's bites come 30% faster in the rain and
// a thunderstorm stops fishing (selling the bucket) and busking (and
// neither can start), busking pays 25% less in the rain, their own plans
// go home to rest out of a storm (with a tent or house) and never fish or
// busk then, the Farm's chickens go into the barn in a storm and come
// back out after, the first rainbow of each life cheers them up once, and
// the weather events only come in their weather.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { createCollection } from '../src/game/fishing.js';
import { arriveAtStay } from '../src/game/stay.js';
import { saveGame, loadGame } from '../src/game/save.js';
import { GROW_MS, startFarmJob, updateFarm } from '../src/game/farm.js';
import {
  giveItem, startActivity, canStart, activityView, updateActivities,
} from '../src/game/activities.js';
import {
  startPlaying, isPlaying, updateFortuneTree, treeView,
} from '../src/game/fortuneTree.js';
import { possibleChoices, choiceWeight, choosePlan } from '../src/game/autonomy.js';
import { startEvent } from '../src/game/events.js';
import {
  createWeatherState, setWeather, riceGrowthSpeed, biteSpeed, buskingPay, isStormy, stormStops, animalsInBarn,
  restoreWeatherSeenState,
} from '../src/game/weather.js';
import { updateWeatherEffects } from '../src/game/weatherEffects.js';
import {
  createFarmAnimals, updateFarmAnimals, isOut, allInside, chickenFrame, chickensToDraw,
} from '../src/ui/farmAnimals.js';
import { WEATHER, WEATHER_EFFECTS, WEATHER_EFFECTS_TEXT } from '../src/data/weather.js';
import { CHICKENS } from '../src/data/farmAnimals.js';
import { EVENTS } from '../src/data/events.js';
import { FARM_PLACE, PADDIES, FARM_JOBS } from '../src/data/farm.js';
import { LAKE_PLACE } from '../src/data/lake.js';
import { FORTUNE_TREE_PLACE, SESSION_MINUTES, SESSION_PAY } from '../src/data/fortuneTree.js';
import { PLACE_ACTIVITIES } from '../src/data/activities.js';
import { HOUSING_TIERS } from '../src/data/housing.js';
import { LIFE_STAGES } from '../src/data/lifeStages.js';
import { TRAIT_LABELS } from '../src/data/traits.js';
import { GOALS } from '../src/data/goals.js';
import { SPRITES } from '../src/data/sprites.js';

const MINUTE = 60000;
const HOUR = 3600000;
const WET = ['drizzle', 'rain', 'heavyRain'];
const KINDS = Object.keys(WEATHER);

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function lifeAt(age = 20, { place = FARM_PLACE, weather = 'sunny', money = 100, tier = 'sleepingBag' } = {}) {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.5;
  game.character.stats.money = money;
  game.character.stats.health = 90;
  game.character.traits = [];
  game.goals.active = 'free';
  game.collection = createCollection();
  if (age >= 18) {
    game.housing.movedOut = true;
    game.housing.tier = tier;
  }
  game.place = place;
  game.weather = createWeatherState(seeded(1));
  setWeather(game.weather, weather, seeded(2), { fade: false });
  return game;
}
const weatherNow = (game, kind) => setWeather(game.weather, kind, seeded(3), { fade: false });

test('the numbers: every kind listed is a weather kind, and the effects are small', () => {
  for (const [name, effect] of Object.entries(WEATHER_EFFECTS)) {
    assert.ok(effect.kinds.length > 0, name);
    for (const kind of effect.kinds) assert.ok(kind in WEATHER, `${name}: ${kind}`);
  }
  assert.equal(WEATHER_EFFECTS.riceGrowth.speed, 1.25);
  assert.deepEqual(WEATHER_EFFECTS.riceGrowth.kinds, [...WET, 'storm']);
  assert.equal(WEATHER_EFFECTS.bites.speed, 1.3);
  assert.equal(WEATHER_EFFECTS.buskingPay.share, 0.75);
  assert.deepEqual(WEATHER_EFFECTS.storm.kinds, ['storm']);
  assert.ok(WEATHER_EFFECTS.storm.activities.every((id) => id in PLACE_ACTIVITIES));
  assert.ok(WEATHER_EFFECTS.shelter.tiers.every((id) => HOUSING_TIERS.some((tier) => tier.id === id)));
  assert.deepEqual(WEATHER_EFFECTS.rainbow.stats, { happiness: 3 });
  assert.equal(WEATHER_EFFECTS_TEXT.stormStops.fishing, 'Too stormy to fish!');
  assert.equal(WEATHER_EFFECTS_TEXT.stormStops.busking, 'Not under a tree in a storm!');
  assert.equal(WEATHER_EFFECTS_TEXT.rainbow.heading, 'A rainbow!');
  // Without any weather (an old test game), nothing changes.
  const plain = { weather: undefined };
  assert.equal(riceGrowthSpeed(plain), 1);
  assert.equal(biteSpeed(plain), 1);
  assert.equal(buskingPay(plain, 10), 10);
  assert.equal(isStormy(plain), false);
});

test('rice grows 25% faster while it drizzles, rains or storms', () => {
  for (const kind of KINDS) {
    const game = lifeAt(20, { weather: kind });
    game.farm.paddies[PADDIES[0].id].crop = { ms: 0, weedsAt: null, weeds: false, weeded: false };
    for (let t = 0; t < HOUR; t += 250) updateFarm(game, 250);
    const grown = game.farm.paddies[PADDIES[0].id].crop.ms;
    const wet = [...WET, 'storm'].includes(kind);
    assert.equal(riceGrowthSpeed(game), wet ? 1.25 : 1, kind);
    assert.ok(Math.abs(grown - (wet ? 1.25 : 1) * HOUR) < 1, `${kind}: ${grown}`);
  }
  // Six hours become under five in the rain, and it stops at ripe.
  const game = lifeAt(20, { weather: 'rain' });
  game.farm.paddies[PADDIES[0].id].crop = { ms: 0, weedsAt: null, weeds: false, weeded: false };
  for (let t = 0; t < 4.8 * HOUR; t += 1000) updateFarm(game, 1000);
  assert.equal(game.farm.paddies[PADDIES[0].id].crop.ms, GROW_MS);
  // A job at a paddy takes as long as ever.
  const job = lifeAt(20, { weather: 'storm', money: 50 });
  assert.equal(startFarmJob(job, PADDIES[0].id, 'plant'), true);
  arriveAtStay(job);
  updateFarm(job, FARM_JOBS.plant.seconds * 1000 - 250);
  assert.ok(job.farm.job, 'planting ended early in the rain');
});

// A game fishing at the dock, arrived, waiting for a bite.
function fishingGame(kind) {
  const game = lifeAt(20, { place: LAKE_PLACE, weather: 'sunny' });
  giveItem(game, 'fishing');
  assert.equal(startActivity(game, 'fishing'), true);
  arriveAtStay(game);
  weatherNow(game, kind);
  const state = game.activities.current.fishing;
  state.phase = 'waiting';
  state.phaseMs = 0;
  state.waitMs = 100000;
  return { game, state };
}

test('bites come 30% faster in the rain', () => {
  for (const kind of KINDS) {
    if (kind === 'storm') continue;
    const { game, state } = fishingGame(kind);
    updateActivities(game, 1000);
    assert.equal(state.phase, 'waiting');
    assert.equal(state.phaseMs, WET.includes(kind) ? 1300 : 1000, kind);
  }
  // The bite comes after 100 s / 1.3 of rain, not 100 s.
  const { game, state } = fishingGame('rain');
  for (let t = 0; t < 76000; t += 250) updateActivities(game, 250, () => 0.5);
  assert.equal(state.phase, 'waiting');
  for (let t = 0; t < 1000; t += 250) updateActivities(game, 250, () => 0.5);
  assert.equal(state.phase, 'bite');
  // The bite's window is as long as ever.
  const before = state.phaseMs;
  updateActivities(game, 250, () => 0.5);
  assert.ok(Math.abs(state.phaseMs - before - 250) < 1e-6);
});

test('a thunderstorm stops fishing, selling the bucket, and keeps it from starting', () => {
  const { game, state } = fishingGame('sunny');
  state.bucket = [{ id: 'minnow', value: 5, size: 6 }, { id: 'perch', value: 12, size: 20 }];
  const money = game.character.stats.money;
  assert.deepEqual(updateWeatherEffects(game), []);
  weatherNow(game, 'storm');
  assert.equal(stormStops(game, 'fishing'), true);
  const news = updateWeatherEffects(game);
  assert.equal(game.activities.current, null);
  assert.equal(news.length, 1);
  assert.equal(news[0].heading, 'Too stormy to fish!');
  assert.match(news[0].text, /Sold 2 for \$17/);
  assert.equal(game.character.stats.money, money + 17);
  // It can't start again until the storm is over; the menu says why.
  assert.equal(canStart(game, 'fishing'), false);
  assert.equal(startActivity(game, 'fishing'), false);
  const view = activityView(game, 'fishing');
  assert.equal(view.toggle.enabled, false);
  assert.ok(view.status.includes('Too stormy to fish!'));
  weatherNow(game, 'heavyRain');
  assert.equal(activityView(game, 'fishing').toggle.enabled, true);
  assert.equal(startActivity(game, 'fishing'), true);
  // On the way to the dock: stopped with nothing to sell.
  weatherNow(game, 'storm');
  game.stay = { arrived: null };
  const onTheWay = updateWeatherEffects(game);
  assert.deepEqual(onTheWay.map((news) => news.text), ['Too stormy to fish!']);
});

test('busking pays 25% less in the rain; a thunderstorm stops it and keeps it from starting', () => {
  const sessionMs = SESSION_MINUTES * MINUTE;
  for (const kind of KINDS) {
    if (kind === 'storm') continue;
    const game = lifeAt(20, { place: FORTUNE_TREE_PLACE, weather: kind, money: 0 });
    assert.equal(startPlaying(game), true);
    arriveAtStay(game);
    for (let t = 0; t < sessionMs; t += 1000) updateFortuneTree(game, 1000);
    const pay = WET.includes(kind) ? Math.round(SESSION_PAY * 0.75) : SESSION_PAY;
    assert.equal(game.character.stats.money, pay, kind);
    assert.equal(treeView(game).sessionPay, pay);
  }
  assert.equal(buskingPay(lifeAt(20, { weather: 'rain' }), 10), 8);
  // A storm comes: busking stops, with its bubble.
  const game = lifeAt(20, { place: FORTUNE_TREE_PLACE, weather: 'cloudy' });
  assert.equal(startPlaying(game), true);
  arriveAtStay(game);
  weatherNow(game, 'storm');
  const news = updateWeatherEffects(game);
  assert.equal(isPlaying(game), false);
  assert.deepEqual(news.map((item) => item.text), ['Not under a tree in a storm!']);
  // And it can't start: the menu shows why.
  assert.equal(startPlaying(game), false);
  assert.equal(treeView(game).stormy, true);
  assert.deepEqual(updateWeatherEffects(game), []);
  weatherNow(game, 'rainbow');
  assert.equal(treeView(game).stormy, false);
  assert.equal(startPlaying(game), true);
});

test('own plans in a storm: no fishing or busking; home to rest with a tent or house', () => {
  const kinds = (game) => possibleChoices(game).map((choice) => choice.kind);
  for (const tier of ['tent', 'house']) {
    const game = lifeAt(30, { place: FORTUNE_TREE_PLACE, weather: 'sunny', tier });
    game.character.stats.health = 100;
    giveItem(game, 'fishing');
    assert.ok(kinds(game).includes('fish') && kinds(game).includes('busk'));
    assert.ok(!kinds(game).includes('rest'), 'resting at full health in fair weather');
    const fair = choiceWeight(game, 'rest');
    weatherNow(game, 'storm');
    assert.ok(!kinds(game).includes('fish') && !kinds(game).includes('busk'), tier);
    const rest = possibleChoices(game).find((choice) => choice.kind === 'rest');
    assert.ok(rest, `${tier}: no going home to rest`);
    assert.equal(rest.place, tier === 'house' ? 'myHome' : 'myYard');
    assert.equal(choiceWeight(game, 'rest'), fair * WEATHER_EFFECTS.shelter.restWeight);
    // Mostly they go home, saying so.
    const random = seeded(4);
    let home = 0;
    for (let i = 0; i < 200; i++) {
      const plan = choosePlan(game, random);
      if (plan.kind === 'rest') {
        home++;
        assert.equal(plan.text, WEATHER_EFFECTS_TEXT.shelter);
      }
    }
    assert.ok(home > 120, `${tier}: home ${home} of 200`);
  }
  // A sleeping bag is no shelter, and children don't go home by themselves.
  for (const game of [lifeAt(30, { weather: 'storm', tier: 'sleepingBag' }), lifeAt(10, { weather: 'storm' })]) {
    game.character.stats.health = 100;
    giveItem(game, 'fishing');
    assert.ok(!kinds(game).includes('rest'));
    assert.ok(!kinds(game).includes('fish') && !kinds(game).includes('busk'));
  }
});

test('the chickens go into the barn in a storm and come back out after', () => {
  const random = seeded(6);
  const inArea = (chicken) => {
    const { left, right, top, bottom } = CHICKENS.area;
    return chicken.x >= left && chicken.x <= right && chicken.row >= top && chicken.row <= bottom;
  };
  const animals = createFarmAnimals(false, random);
  assert.equal(animals.chickens.length, CHICKENS.count);
  assert.ok(animals.chickens.every((chicken) => isOut(chicken) && inArea(chicken)));
  const frames = new Set();
  for (let i = 0; i < 60 * 60; i++) {
    updateFarmAnimals(animals, 1 / 60, false, random);
    for (const chicken of animals.chickens) {
      assert.ok(inArea(chicken), JSON.stringify(chicken));
      frames.add(chickenFrame(chicken));
    }
  }
  assert.deepEqual([...frames].sort(), ['peck', 'stand', 'walk']);
  // A storm: in through the door, all of them, within a few seconds.
  let t = 0;
  while (!allInside(animals) && t < 10) {
    updateFarmAnimals(animals, 1 / 60, true, random);
    t += 1 / 60;
  }
  assert.ok(allInside(animals), 'still out in the storm');
  assert.ok(t < 5, `${t} s to get in`);
  assert.deepEqual(chickensToDraw(animals), []);
  for (let i = 0; i < 600; i++) updateFarmAnimals(animals, 1 / 60, true, random);
  assert.ok(allInside(animals));
  // Over: out one by one, back to the pen.
  const seen = [];
  for (let i = 0; i < 60 * 15; i++) {
    updateFarmAnimals(animals, 1 / 60, false, random);
    seen.push(animals.chickens.filter(isOut).length);
  }
  assert.ok(seen.includes(1), 'they all came out at once');
  assert.ok(animals.chickens.every((chicken) => isOut(chicken) && inArea(chicken)));
  // Shown during a storm, they're already inside.
  assert.ok(allInside(createFarmAnimals(true, random)));
  // Drawn back to front.
  const rows = chickensToDraw(animals).map((chicken) => chicken.row);
  assert.deepEqual(rows, [...rows].sort((a, b) => a - b));
  assert.equal(animalsInBarn(lifeAt(20, { weather: 'storm' })), true);
  assert.equal(animalsInBarn(lifeAt(20, { weather: 'heavyRain' })), false);
  assert.deepEqual(SPRITES['farm.chicken'], { frames: 3 });
});

// Saves `game` and loads it back (the save calls stubbed).
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

test('the first rainbow of each life: +3 happiness and a golden bubble, once', async () => {
  const game = lifeAt(8, { weather: 'rain' });
  game.character.stats.happiness = 50;
  assert.deepEqual(updateWeatherEffects(game), []);
  weatherNow(game, 'rainbow');
  const news = updateWeatherEffects(game);
  assert.equal(news.length, 1);
  assert.equal(news[0].heading, 'A rainbow!');
  assert.equal(news[0].celebrate, true);
  assert.deepEqual(news[0].deltas, { happiness: 3 });
  assert.equal(game.character.stats.happiness, 53);
  assert.equal(game.weatherSeen.rainbow, true);
  assert.deepEqual(updateWeatherEffects(game), []);
  weatherNow(game, 'sunny');
  weatherNow(game, 'rainbow');
  assert.deepEqual(updateWeatherEffects(game), [], 'a second rainbow cheered them up again');
  // Saved (a save from before has seen none); a new life sees its own
  // first one.
  assert.deepEqual((await roundTrip(game)).weatherSeen, { rainbow: true });
  assert.deepEqual(restoreWeatherSeenState(null), { rainbow: false });
  assert.deepEqual(restoreWeatherSeenState({ rainbow: 'yes' }), { rainbow: false });
  startNewLife(game);
  assert.equal(game.weatherSeen.rainbow, false);
  assert.equal(updateWeatherEffects(game).length, 1);
});

test('the weather events: only in their weather, and well formed', () => {
  const weatherEvents = EVENTS.filter((event) => event.weather);
  assert.ok(weatherEvents.length >= 3 && weatherEvents.length <= 4);
  const stages = new Set(LIFE_STAGES.map((stage) => stage.id));
  const goals = new Set(GOALS.map((goal) => goal.id));
  for (const event of weatherEvents) {
    assert.ok(event.weather.every((kind) => kind in WEATHER), event.id);
    assert.ok(event.stages.every((stage) => stages.has(stage)), event.id);
    assert.ok(event.prompt.length <= 100, `${event.id}: prompt ${event.prompt.length}`);
    assert.ok(event.choices.length >= 2 && event.choices.length <= 3);
    for (const choice of event.choices) {
      assert.ok(choice.label.length <= 28, `${event.id}: ${choice.label}`);
      assert.ok(choice.lean.every((trait) => trait in TRAIT_LABELS), choice.label);
      assert.ok((choice.goals ?? []).every((goal) => goals.has(goal)), choice.label);
      const texts = choice.outcomes ? choice.outcomes.map((outcome) => outcome.text) : [choice.text];
      for (const text of texts) assert.ok(text.length <= 30, `${event.id}: ${text}`);
    }
  }
  // Which events come, in each weather: the weather ones only in theirs.
  const ages = { child: 8, teen: 15, adult: 30, elder: 70 };
  for (const [stage, age] of Object.entries(ages)) {
    for (const kind of KINDS) {
      const game = lifeAt(age, { weather: kind });
      // (An adult without a job only gets job offers.)
      if (stage === 'adult') game.jobs.current = { id: 'cafe', level: 0, since: 20, hiredAge: 20, bonus: 0 };
      const came = new Set();
      for (let i = 0; i < 400; i++) {
        game.events.pending = null;
        game.events.lastId = null;
        startEvent(game);
        if (game.events.pending) came.add(game.events.pending.id);
      }
      for (const event of weatherEvents) {
        const fits = event.stages.includes(stage) && event.weather.includes(kind);
        assert.equal(came.has(event.id), fits, `${event.id} at ${stage} in ${kind}`);
      }
    }
  }
});
