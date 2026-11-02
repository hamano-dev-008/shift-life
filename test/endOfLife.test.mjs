// endOfLife.test.mjs — Ageing, when a life ends, the gentle stop, the life
// summary and title, the Book of past lives, saving, and new lives.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advanceClock } from '../src/game/clock.js';
import {
  startNewLife, updateEndOfLife, endLife, deathChance, ageingLoss, lifeSummary, lifeTitle,
  strongestTrait, createBook, restoreBook, recordLife, bookView, bookSaveData,
  restoreEndOfLifeState, restoreSummary, farewellText, isEnded,
} from '../src/game/endOfLife.js';
import { endLifeNow, setHealth, skipYears } from '../src/game/dev.js';
import { startPlaying } from '../src/game/fortuneTree.js';
import { DEATH, AGEING_FROM_AGE, AGEING_LOSS, BOOK_MAX_LIVES } from '../src/data/endOfLife.js';
import { NEW_LIFE_PLACE } from '../src/data/places.js';

const never = () => 0.999999;
const always = () => 0;

// A fresh life at clock time `age` (born at 0), with the year's checks
// already done, so only later birthdays count.
function lifeAt(age, { tier = 'house', health = 80 } = {}) {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.1;
  game.endOfLife.checkedAge = age;
  game.housing.movedOut = age >= 18;
  game.housing.tier = tier;
  game.character.stats.health = health;
  return game;
}

test('health drops each year from 50, fastest in a sleeping bag and slowest in a house', () => {
  const lost = {};
  for (const tier of ['sleepingBag', 'tent', 'house']) {
    const game = lifeAt(49, { tier });
    game.clock.years = 53.1;
    assert.equal(updateEndOfLife(game, never), null);
    lost[tier] = 80 - game.character.stats.health;
    assert.equal(lost[tier], 4 * AGEING_LOSS[tier]);
    assert.equal(ageingLoss(game), AGEING_LOSS[tier]);
  }
  assert.ok(lost.sleepingBag > lost.tent && lost.tent > lost.house);

  const young = lifeAt(40, { tier: 'sleepingBag' });
  young.clock.years = AGEING_FROM_AGE - 0.5;
  updateEndOfLife(young, never);
  assert.equal(young.character.stats.health, 80);
});

test('the yearly chance starts at 70, rises with age, falls with health, and is certain at 100', () => {
  assert.equal(deathChance(DEATH.fromAge - 1, 0), 0);
  assert.ok(deathChance(70, 50) > 0);
  assert.ok(deathChance(85, 50) > deathChance(75, 50));
  assert.ok(deathChance(80, 90) < deathChance(80, 20));
  assert.equal(deathChance(DEATH.maxAge, 100), 1);

  const lucky = lifeAt(69, { health: 100 });
  lucky.clock.years = 99.5;
  assert.equal(updateEndOfLife(lucky, never), null);
  lucky.clock.years = 100.2;
  const ended = updateEndOfLife(lucky, never);
  assert.equal(ended.cause, 'age');
  assert.equal(ended.summary.age, DEATH.maxAge);

  const unlucky = lifeAt(69);
  unlucky.clock.years = 75.4;
  assert.equal(updateEndOfLife(unlucky, always).summary.age, 70);
  // Skipped years past the end don't count.
  assert.equal(Math.floor(unlucky.clock.years), 70);
});

test('no health left ends an adult life, but babies and children never die', () => {
  for (const age of [0, 3, 8, 15, DEATH.minAge - 1]) {
    const child = lifeAt(age, { health: 0 });
    child.clock.years = age + 0.9;
    assert.equal(updateEndOfLife(child, always), null);
    assert.equal(isEnded(child), false);
    assert.equal(endLifeNow(child).ended, undefined);
  }
  const adult = lifeAt(30);
  setHealth(adult, 0);
  assert.equal(updateEndOfLife(adult, never).cause, 'health');
});

test('ending a life stops busking, resting, events and the clock', () => {
  const game = lifeAt(80);
  game.place = 'fortuneTree';
  assert.equal(startPlaying(game), true);
  game.events.pending = { id: 'x', shownAt: 80 };
  const { ended } = endLifeNow(game);
  assert.equal(ended.cause, 'dev');
  assert.equal(game.fortuneTree.playing, false);
  assert.equal(game.home.resting, false);
  assert.equal(game.events.pending, null);
  assert.equal(game.clock.stopped, true);
  const years = game.clock.years;
  advanceClock(game.clock, 60000);
  skipYears(game, 10);
  assert.equal(game.clock.years, years);
  assert.equal(updateEndOfLife(game, always), null);
  assert.equal(endLife(game), null);
  assert.equal(farewellText(ended), `${game.character.name} drifted off peacefully at 80.`);
  assert.equal(endLifeNow(game).note, 'This life has ended.');
});

test('the summary lists the goal, milestones, jobs, top title, money, home and apples', () => {
  const game = lifeAt(78);
  game.character.name = 'Mia';
  game.character.traits = ['bold', 'social'];
  game.character.stats.money = 4321;
  game.goals.active = 'heart';
  game.goals.milestones = [{ goal: 'heart', id: 'heart-sunny', age: 30 }, { goal: 'gone', id: 'x', age: 1 }];
  game.jobs.history = [{ id: 'cafe', level: 2, from: 18, to: 30, pay: 140 },
    { id: 'chef', level: 1, from: 30, to: 50, pay: 110 }];
  game.jobs.current = { id: 'chef', level: 2, since: 50, hiredAge: 50, bonus: 0 };
  game.fortuneTree.applesWon = 0;
  const summary = lifeSummary(game);
  assert.deepEqual(summary, {
    name: 'Mia',
    age: 78,
    title: 'The Friendly Chef',
    goal: 'Heart',
    milestones: [{ label: 'Sunny side', goal: 'Heart', age: 30 }],
    jobs: ['Cafe Owner', 'Chef', 'Head Chef'],
    topTitle: 'Head Chef',
    money: 4321,
    home: 'House',
    applesWon: 0,
  });
  // bold: 1 + 2x2 (both chef stints lean bold) = 5; social: 1 + 2x3 (all
  // three lean social) + 1 (Heart) = 8.
  assert.equal(strongestTrait(game), 'social');
  game.goals.active = 'fortune';
  game.jobs.history = [];
  // bold: 1 + 2 + 1 (Fortune); social: 1 + 2. Ties go to the first trait.
  assert.equal(strongestTrait(game), 'bold');
});

test('life titles come from the strongest trait and what the life was about', () => {
  const game = lifeAt(80);
  game.character.traits = ['careful'];
  game.goals.active = 'healthy';
  assert.equal(lifeTitle(game), 'The Steady Athlete');
  game.jobs.history = [{ id: 'farm', level: 0, from: 18, to: 60, pay: 40 }];
  assert.equal(lifeTitle(game), 'The Steady Farmer');
  game.fortuneTree.applesWon = 1;
  assert.equal(lifeTitle(game), 'The Steady Busker');
  game.character.traits = [];
  assert.equal(lifeTitle(game), 'The Gentle Busker');
});

test('the Book keeps each finished life once, newest first, and survives a round trip', () => {
  const book = createBook();
  const first = endLifeNow(lifeAt(70)).ended;
  const second = endLife(lifeAt(90), 'age', new Date(Date.now() + 1000));
  assert.equal(recordLife(book, first), true);
  assert.equal(recordLife(book, first), false);
  assert.equal(recordLife(book, second), true);
  assert.equal(recordLife(book, null), false);
  const view = bookView(book);
  assert.deepEqual(view.map((life) => life.id), [second.id, first.id]);
  assert.match(view[0].label, /, 0-90$/);

  const restored = restoreBook(JSON.parse(JSON.stringify(bookSaveData(book))));
  assert.deepEqual(restored, book);
  assert.deepEqual(restoreBook({ lives: [null, { id: 'x' }, { id: 2, summary: first.summary }] }), createBook());
  assert.deepEqual(restoreBook(null), createBook());

  for (let i = 0; i < BOOK_MAX_LIVES + 5; i++) {
    recordLife(book, { ...first, id: `life-${i}` });
  }
  assert.equal(book.lives.length, BOOK_MAX_LIVES);
  assert.equal(book.lives.at(-1).id, `life-${BOOK_MAX_LIVES + 4}`);
});

test('end of life state saves and loads; old saves start ageing from their age now', () => {
  const game = lifeAt(84);
  const ended = endLifeNow(game).ended;
  const saved = JSON.parse(JSON.stringify(game.endOfLife));
  assert.deepEqual(restoreEndOfLifeState(saved, 84), game.endOfLife);
  assert.deepEqual(restoreEndOfLifeState(undefined, 61), { checkedAge: 61, ended: null });
  assert.deepEqual(restoreEndOfLifeState({ checkedAge: 99, ended: { id: 'x' } }, 40),
    { checkedAge: 40, ended: null });
  assert.equal(restoreSummary({ ...ended.summary, jobs: ['A', 3], money: -5 }).money, 0);
  assert.deepEqual(restoreSummary({ ...ended.summary, jobs: ['A', 3] }).jobs, ['A']);
});

test('a new life is a fresh baby at the parents\' home with the clock running again', () => {
  const game = lifeAt(88);
  game.clock.speed = 'fast';
  endLifeNow(game);
  startNewLife(game);
  assert.equal(game.clock.years, 0);
  assert.equal(game.clock.stopped, false);
  assert.equal(game.clock.speed, 'fast');
  assert.equal(game.place, NEW_LIFE_PLACE);
  assert.equal(game.housing.movedOut, false);
  assert.equal(game.endOfLife.ended, null);
  assert.equal(game.endOfLife.checkedAge, 0);
  assert.equal(game.fortuneTree.applesWon, 0);
  assert.equal(game.jobs.current, null);
});
