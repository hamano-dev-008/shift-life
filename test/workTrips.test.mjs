// workTrips.test.mjs — Work trips: the real-time cooldown (5-8 minutes,
// only when an idle pause ends), the quiet spell after a click, nothing
// while busy, the "Work trips" setting (default on, saved, off means they
// never leave), calling them back, and that nothing but work trips and
// travel ever walks the character past the window's edges (wandering,
// goal activities like jogging, toddler plops, pokes).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import {
  createAnimator, updateAnimator, poseOf, gaitOf, takeLeftForWork, isAtWork, callBackFromWork, goToWorkNow,
} from '../src/ui/animator.js';
import { reactionPose } from '../src/ui/interaction.js';
import { createInteraction, pokeCharacter } from '../src/game/interaction.js';
import {
  createWorkTrips, noteClick, mayGoToWork, workTripStarted,
} from '../src/game/workTrips.js';
import { restoreSettings, settingsSaveData, setWorkTrips } from '../src/game/settings.js';
import { DEFAULT_SETTINGS, SETTINGS_VERSION } from '../src/data/settings.js';
import {
  WORK_TRIP_EVERY_MINUTES, WORK_QUIET_SECONDS, WORK_AWAY, WORK_TRIP_TEXT, ACTIVITIES,
} from '../src/data/animation.js';
import { CRAWL_UNTIL_AGE, WALK_FROM_AGE } from '../src/data/infant.js';
import { LIFE_STAGES } from '../src/data/lifeStages.js';
import { HOUSING_TIERS } from '../src/data/housing.js';
import { POKE } from '../src/data/interaction.js';

const W = 320;
const H = 240;
const MIN = 60000;
const DT = 1 / 30;

function child() {
  return startNewLife({ clock: createClock() });
}

function adult(tier) {
  const game = child();
  game.clock.years = 30;
  game.housing.movedOut = true;
  game.housing.tier = tier;
  return game;
}

// Every place as it can look: growing up, and moved out at each tier.
function everyLayout() {
  const layouts = [];
  for (const id of ['lake', 'fortuneTree', 'yard', 'home']) {
    layouts.push({ name: id, layout: computeLayout(W, H, placeView(child(), id)) });
  }
  for (const tier of HOUSING_TIERS) {
    const game = adult(tier.id);
    for (const id of ['myYard', ...(tier.id === 'house' ? ['myHome'] : [])]) {
      layouts.push({ name: `${id} (${tier.id})`, layout: computeLayout(W, H, placeView(game, id)) });
    }
  }
  return layouts;
}

// Idle, with the pause just about to end.
function idleAnimator(layout) {
  const anim = createAnimator(layout);
  anim.mode = 'idle';
  anim.pauseLeft = 0.01;
  return anim;
}

test('work trip numbers and text are in data', () => {
  assert.deepEqual(WORK_TRIP_EVERY_MINUTES, [5, 8]);
  assert.equal(WORK_QUIET_SECONDS, 60);
  assert.deepEqual(WORK_AWAY, [20, 40]);
  assert.equal(WORK_TRIP_TEXT.leaving, 'Off to work!');
  assert.equal(WORK_TRIP_TEXT.atWork.replaceAll('{place}', 'Fortune Tree'), 'Fortune Tree - At work');
});

test('the cooldown: no trip for 5-8 real minutes after launch, then after each trip', () => {
  const ready = { enabled: true, employed: true, busy: false };
  for (const roll of [0, 0.5, 1]) {
    const trips = createWorkTrips(1000, () => roll);
    const wait = (5 + roll * 3) * MIN;
    assert.equal(trips.nextAt, 1000 + wait);
    assert.equal(mayGoToWork(trips, 1000, ready), false);
    assert.equal(mayGoToWork(trips, 1000 + wait - 1, ready), false);
    assert.equal(mayGoToWork(trips, 1000 + wait, ready), true);
    workTripStarted(trips, 1000 + wait, () => roll);
    assert.equal(mayGoToWork(trips, 1000 + wait + 1, ready), false);
    assert.equal(trips.nextAt, 1000 + 2 * wait);
  }
  // Random waits always fall in 5-8 minutes.
  let now = 0;
  const trips = createWorkTrips(now);
  for (let i = 0; i < 200; i++) {
    const wait = trips.nextAt - now;
    assert.ok(wait >= 5 * MIN && wait <= 8 * MIN, `wait ${wait}`);
    now = trips.nextAt;
    workTripStarted(trips, now);
  }
});

test('no trip within 60 s of a click, while busy, without a job or with the setting off', () => {
  const trips = createWorkTrips(0, () => 0);
  const later = 10 * MIN;
  const ready = { enabled: true, employed: true, busy: false };
  assert.equal(mayGoToWork(trips, later, ready), true);
  noteClick(trips, later);
  assert.equal(mayGoToWork(trips, later + 1, ready), false);
  assert.equal(mayGoToWork(trips, later + WORK_QUIET_SECONDS * 1000 - 1, ready), false);
  assert.equal(mayGoToWork(trips, later + WORK_QUIET_SECONDS * 1000, ready), true);
  const after = later + 2 * MIN;
  assert.equal(mayGoToWork(trips, after, { ...ready, busy: true }), false);
  assert.equal(mayGoToWork(trips, after, { ...ready, employed: false }), false);
  assert.equal(mayGoToWork(trips, after, { ...ready, enabled: false }), false);
  assert.equal(mayGoToWork(trips, after), false); // not employed by default
});

test('a trip only starts when an idle pause ends, and says so once', () => {
  const layout = everyLayout().find((entry) => entry.name === 'fortuneTree').layout;
  const walking = createAnimator(layout);
  walking.mode = 'walking';
  walking.targetX = layout.wanderMaxX;
  walking.x = layout.wanderMinX;
  walking.gridX = Math.round(walking.x / layout.characterScale);
  updateAnimator(walking, DT, 'adult', 'walk', { employed: true, mayGoToWork: true });
  assert.equal(walking.mode, 'walking');
  assert.notEqual(walking.destination, 'work');
  assert.equal(takeLeftForWork(walking), false);

  const anim = idleAnimator(layout);
  updateAnimator(anim, DT, 'adult', 'walk', { employed: true, mayGoToWork: true });
  assert.equal(anim.destination, 'work');
  assert.equal(takeLeftForWork(anim), true);
  assert.equal(takeLeftForWork(anim), false);

  // Something on screen: no trip even when allowed.
  const needed = idleAnimator(layout);
  updateAnimator(needed, DT, 'adult', 'walk', { employed: true, mayGoToWork: true, needed: true });
  assert.notEqual(needed.destination, 'work');
});

test('without the cooldown allowing it an employed character never leaves (simulated 2 hours)', () => {
  const layout = everyLayout().find((entry) => entry.name === 'myYard (house)').layout;
  const anim = createAnimator(layout);
  for (let t = 0; t < 2 * 60 * 60; t += DT) {
    updateAnimator(anim, DT, 'adult', 'walk', { activity: 'jog', employed: true, mayGoToWork: false });
    assert.notEqual(anim.destination, 'work');
    assert.equal(isAtWork(anim), false);
  }
});

test('away 20-40 s, then back; the place label calls them back at once', () => {
  const layout = everyLayout().find((entry) => entry.name === 'fortuneTree').layout;
  const anim = createAnimator(layout);
  goToWorkNow(anim);
  takeLeftForWork(anim);
  let t = 0;
  while (!isAtWork(anim) && t < 60) {
    updateAnimator(anim, DT, 'adult', 'walk', { employed: true });
    t += DT;
  }
  assert.equal(isAtWork(anim), true);
  assert.ok(anim.pauseLeft >= WORK_AWAY[0] && anim.pauseLeft <= WORK_AWAY[1]);
  let away = 0;
  while (isAtWork(anim)) {
    updateAnimator(anim, DT, 'adult', 'walk', { employed: true });
    away += DT;
  }
  assert.ok(away >= WORK_AWAY[0] - 1 && away <= WORK_AWAY[1] + 1, `away ${away}`);

  goToWorkNow(anim);
  // Already heading out: called back, they turn around.
  assert.equal(callBackFromWork(anim), true);
  assert.notEqual(anim.destination, 'work');
  goToWorkNow(anim);
  while (!isAtWork(anim)) updateAnimator(anim, DT, 'adult', 'walk', { employed: true });
  assert.equal(callBackFromWork(anim), true);
  assert.equal(isAtWork(anim), false);
  assert.equal(callBackFromWork(createAnimator(layout)), false);
});

test('the Work trips setting: on by default, saved, and off keeps them home', () => {
  assert.equal(DEFAULT_SETTINGS.workTrips, true);
  assert.equal(restoreSettings(null).workTrips, true);
  assert.equal(restoreSettings({ workTrips: 'no' }).workTrips, true);
  assert.equal(restoreSettings({ version: 1, workTrips: false }).workTrips, false);
  const settings = restoreSettings(undefined);
  assert.equal(setWorkTrips(settings, true), false);
  assert.equal(setWorkTrips(settings, false), true);
  assert.deepEqual(settingsSaveData(settings), { version: SETTINGS_VERSION, workTrips: false, ownPlans: true });
  assert.equal(restoreSettings(JSON.parse(JSON.stringify(settingsSaveData(settings)))).workTrips, false);

  // Off: the renderer passes employed false; no trip, and anyone out
  // comes back (or turns back on the way out).
  const trips = createWorkTrips(0, () => 0);
  assert.equal(mayGoToWork(trips, 10 * MIN, { enabled: false, employed: true }), false);
  const layout = everyLayout().find((entry) => entry.name === 'fortuneTree').layout;
  const anim = createAnimator(layout);
  goToWorkNow(anim);
  updateAnimator(anim, DT, 'adult', 'walk', { employed: false });
  assert.notEqual(anim.destination, 'work');
  goToWorkNow(anim);
  while (!isAtWork(anim)) updateAnimator(anim, DT, 'adult', 'walk', { employed: true });
  updateAnimator(anim, DT, 'adult', 'walk', { employed: false });
  assert.equal(isAtWork(anim), false);
});

test('nothing but work trips and travel walks the character past the window edges', () => {
  const ages = [
    { age: 0, stage: 'baby' },
    { age: CRAWL_UNTIL_AGE, stage: 'baby' },
    { age: WALK_FROM_AGE, stage: 'child' },
    ...LIFE_STAGES.filter((stage) => stage.minAge >= 4).map((stage) => ({ age: stage.minAge, stage: stage.id })),
  ];
  const activities = [null, ...Object.keys(ACTIVITIES)];
  const wiggle = POKE.wigglePixels;
  for (const { name, layout } of everyLayout()) {
    // Where they may stand: the walking limits, and any prop visited.
    const spots = Object.values(layout.props).filter((prop) => prop.visit !== false).map((prop) => prop.visitX);
    const low = Math.min(layout.wanderMinX, ...spots) - (wiggle + 1) * layout.characterScale;
    const high = Math.max(layout.wanderMaxX, ...spots) + (wiggle + 1) * layout.characterScale;
    assert.ok(low >= 0 && high <= W, `${name}: limits inside the window`);
    for (const { age, stage } of ages) {
      for (const activity of activities) {
        const anim = createAnimator(layout);
        const poke = createInteraction();
        const character = { stats: { health: 50, happiness: 50, smarts: 50, money: 0 } };
        for (let t = 0, ms = 0; t < 240; t += DT, ms += DT * 1000) {
          // Employed, with things now and then needing them, but the
          // cooldown never allows a trip; poked every few seconds.
          updateAnimator(anim, DT, stage, gaitOf(age), {
            activity, employed: true, mayGoToWork: false, needed: Math.floor(t / 7) % 2 === 1,
          });
          if (Math.floor(t * 30) % 90 === 0) pokeCharacter(character, poke, ms, () => 0);
          const { pose } = reactionPose(poseOf(anim, stage), poke, ms, layout.characterScale);
          assert.ok(pose.x >= low && pose.x <= high,
            `${name}, age ${age}, ${activity}: x ${pose.x} outside ${low}-${high} (${anim.mode})`);
          assert.notEqual(anim.destination, 'work');
          assert.equal(isAtWork(anim), false);
        }
      }
    }
  }
});
