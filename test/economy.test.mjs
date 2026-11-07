// economy.test.mjs — Pacing and money against the targets in AGENTS.md
// (real hours of running, about 8 a day): how long a life lasts, pay per
// real hour, side income, prices, and how often events and paydays come.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advanceClock } from '../src/game/clock.js';
import { realMinutesPerYear } from '../src/game/character.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { startEvent, chooseEvent, updateEvents } from '../src/game/events.js';
import { applyJobChange, updateJobs, careerView } from '../src/game/jobs.js';
import { LIFE_STAGES } from '../src/data/lifeStages.js';
import { SPEEDS } from '../src/data/balance.js';
import { JOBS } from '../src/data/jobs.js';
import { HOUSING_TIERS } from '../src/data/housing.js';
import { SESSION_MINUTES, SESSION_PAY, APPLE_EVERY_HOURS } from '../src/data/fortuneTree.js';
import { RICE } from '../src/data/farm.js';
import { CAFE_ORDERS } from '../src/data/cafe.js';
import { SHIFT, WORKPLACES } from '../src/data/work.js';
import { STORE_ITEMS } from '../src/data/store.js';
import { POST_ITEMS } from '../src/data/post.js';
import { ALLEY_ITEMS } from '../src/data/alley.js';
import { OFFICE_ITEMS } from '../src/data/office.js';
import { RAMEN_ITEMS } from '../src/data/ramen.js';

const HOUR_MS = 3600 * 1000;
const ADULT_HOURS_PER_YEAR = LIFE_STAGES.find((s) => s.id === 'adult').realMinutesPerYear / 60;

function lifeAt(age) {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.01;
  game.endOfLife.checkedAge = age;
  return game;
}

const near = (value, target, share) => Math.abs(value - target) <= target * share;

test('a year lasts 1 real hour as a child, 4 as an adult, 3 as an elder; a life about a month', () => {
  const hours = (age) => realMinutesPerYear(lifeAt(age).character, age + 0.5) / 60;
  assert.equal(hours(2), 1);
  assert.equal(hours(10), 1);
  assert.equal(hours(16), 1);
  assert.equal(hours(30), 4);
  assert.equal(hours(70), 3);

  let lifeHours = 0;
  for (let age = 0; age < 80; age++) lifeHours += hours(age);
  const days = lifeHours / 8;
  assert.ok(days > 25 && days < 35, `${days} days of 8 hours`);
});

test('the clock runs at the stage pace at normal speed and at a fixed pace fast', () => {
  const clock = createClock(30);
  advanceClock(clock, HOUR_MS, 240);
  assert.ok(Math.abs(clock.years - 30.25) < 1e-9);
  clock.speed = 'fast';
  advanceClock(clock, SPEEDS.fast.secondsPerYear * 1000, 240);
  assert.ok(Math.abs(clock.years - 31.25) < 1e-9);
});

test('entry jobs pay about $25 a real hour and the top job about $120', () => {
  const perHour = (pay) => pay / ADULT_HOURS_PER_YEAR;
  const entry = JOBS.filter((job) => Object.keys(job.levels[0].needs).length === 0);
  assert.ok(entry.length > 0);
  for (const job of entry) {
    assert.ok(near(perHour(job.levels[0].pay), 25, 0.1), `${job.id} $${perHour(job.levels[0].pay)}/h`);
  }
  const top = Math.max(...JOBS.flatMap((job) => job.levels.map((level) => level.pay)));
  assert.ok(near(perHour(top), 120, 0.1), `top $${perHour(top)}/h`);
  // Each career pays more at each level.
  for (const job of JOBS) {
    const pays = job.levels.map((level) => level.pay);
    assert.deepEqual([...pays].sort((a, b) => a - b), pays, job.id);
  }
});

test('pay comes monthly and a year of paydays adds up to the yearly pay', () => {
  const game = lifeAt(30);
  game.character.stats.money = 0;
  applyJobChange(game, { hire: 'cafe' });
  const yearly = careerView(game).pay;
  const hiredAt = game.clock.years;
  let paydays = 0;
  // Ticks of a quarter month, for one year (and a hair, past float sums).
  for (let i = 1; i <= 48; i++) {
    game.clock.years = hiredAt + i / 48 + 1e-9;
    paydays += updateJobs(game).length;
  }
  assert.equal(paydays, 12);
  assert.ok(Math.abs(game.character.stats.money - yearly) <= 1, `$${game.character.stats.money} of $${yearly}`);
});

test('promotion still waits PROMOTION_YEARS, checked on monthly paydays', () => {
  const game = lifeAt(30);
  game.character.stats.smarts = 60;
  applyJobChange(game, { hire: 'cafe' });
  const hiredAt = game.clock.years;
  while (careerView(game).level === 1) {
    game.clock.years += 1 / 48;
    updateJobs(game);
  }
  const years = game.clock.years - hiredAt;
  assert.ok(years > 2.95 && years < 3.05, `${years}`);
});

test('the tent costs about a day of entry work and the house about a week', () => {
  const entryPerHour = 100 / ADULT_HOURS_PER_YEAR;
  const hoursFor = (id) => HOUSING_TIERS.find((tier) => tier.id === id).price / entryPerHour;
  assert.ok(near(hoursFor('tent'), 8, 0.25), `tent ${hoursFor('tent')} h`);
  assert.ok(near(hoursFor('house'), 56, 0.25), `house ${hoursFor('house')} h`);
});

test('side income stays below a career: busking about $5 an hour, rice below $25', () => {
  const busking = SESSION_PAY * (60 / SESSION_MINUTES);
  assert.ok(near(busking, 5, 0.2), `busking $${busking}/h`);
  const ricePerPaddy = (RICE.pay * (1 + RICE.weedBonus) - RICE.seedCost) / RICE.growHours;
  assert.ok(ricePerPaddy * 3 < 25, `rice $${ricePerPaddy * 3}/h for three paddies`);
  assert.equal(APPLE_EVERY_HOURS, 8);
});

test('events come every 15-30 real minutes for children and adults alike', () => {
  for (const age of [8, 30]) {
    const game = lifeAt(age);
    const minutesPerYear = realMinutesPerYear(game.character, game.clock.years);
    assert.equal(startEvent(game), true);
    assert.ok(chooseEvent(game, 0), `age ${age}`);
    const gap = (game.events.nextAt - game.clock.years) * minutesPerYear;
    assert.ok(gap >= 15 && gap <= 30, `age ${age}: ${gap} min`);
  }
});

test('an unanswered event is decided after a real minute at any age', () => {
  for (const age of [8, 30]) {
    const game = lifeAt(age);
    const minutesPerYear = realMinutesPerYear(game.character, game.clock.years);
    startEvent(game);
    game.clock.years += 0.9 / minutesPerYear;
    assert.equal(updateEvents(game), null, `age ${age}: too soon`);
    game.clock.years += 0.2 / minutesPerYear;
    assert.ok(updateEvents(game)?.auto, `age ${age}: decided`);
  }
});

test('workplace shifts pay half the job hourly rate on top (below a career); coffee and cake are sinks to match', () => {
  const levels = WORKPLACES.flatMap((work) => JOBS.find((job) => job.id === work.job).levels);
  assert.ok(levels.length >= 6);
  for (const level of levels) {
    const hourly = level.pay / ADULT_HOURS_PER_YEAR;
    const shiftsPerHour = 60 / SHIFT.minutes;
    const extra = Math.round((hourly * SHIFT.rate * SHIFT.minutes) / 60) * shiftsPerHour;
    assert.ok(Math.abs(extra - hourly * SHIFT.rate) <= 1, `${level.title}: $${extra}/h on top of $${hourly}/h`);
    assert.ok(extra < hourly, `${level.title}: extra $${extra}/h is not below the career's $${hourly}/h`);
  }
  // A coffee is a few minutes of entry pay, a cake under half an hour.
  const entryPerMinute = 100 / ADULT_HOURS_PER_YEAR / 60;
  assert.ok(CAFE_ORDERS.coffee.price / entryPerMinute < 15);
  assert.ok(CAFE_ORDERS.cake.price / entryPerMinute < 30);
});

test('the 6-Eleven sells small treats (a few minutes of entry pay) and a scratch card that loses on average', () => {
  const entryPerMinute = 100 / ADULT_HOURS_PER_YEAR / 60;
  for (const [id, item] of Object.entries(STORE_ITEMS)) {
    assert.ok(item.price / entryPerMinute <= 10, `${id}: ${item.price / entryPerMinute} minutes of pay`);
    assert.equal(item.everyMinutes, 60, `${id}: once an hour`);
  }
  const { price, prizes } = STORE_ITEMS.scratch;
  const back = prizes.reduce((sum, prize) => sum + prize.chance * prize.pay, 0);
  assert.ok(back < price * 0.75, `a $${price} card pays back $${back} on average`);
});

test("Pedal Post's mail is a small sink: a postcard a few minutes of entry pay, a gift parcel about half an hour's, once a day", () => {
  const entryPerMinute = 100 / ADULT_HOURS_PER_YEAR / 60;
  assert.ok(POST_ITEMS.postcard.price / entryPerMinute <= 10);
  assert.ok(POST_ITEMS.gift.price / entryPerMinute <= 45);
  assert.equal(POST_ITEMS.postcard.everyMinutes, 60);
  assert.equal(POST_ITEMS.gift.everyMinutes, 24 * 60);
});

test("Mural Alley's stall is a small sink: a print a quarter hour of entry pay, a class under half an hour's, once a day", () => {
  const entryPerMinute = 100 / ADULT_HOURS_PER_YEAR / 60;
  assert.ok(ALLEY_ITEMS.print.price / entryPerMinute <= 15);
  assert.ok(ALLEY_ITEMS.class.price / entryPerMinute <= 30);
  assert.equal(ALLEY_ITEMS.print.everyMinutes, 60);
  assert.equal(ALLEY_ITEMS.class.everyMinutes, 24 * 60);
});

test("Paperleaf Co.'s break corner is a small sink: a coffee a few minutes of entry pay hourly, a resume daily", () => {
  const entryPerMinute = 100 / ADULT_HOURS_PER_YEAR / 60;
  assert.ok(OFFICE_ITEMS.coffee.price / entryPerMinute <= 10);
  assert.ok(OFFICE_ITEMS.resume.price / entryPerMinute <= 10);
  assert.equal(OFFICE_ITEMS.coffee.everyMinutes, 60);
  assert.equal(OFFICE_ITEMS.resume.everyMinutes, 24 * 60);
});

test("Ramen Hinata's bowls are a small sink: ramen about ten minutes of entry pay hourly, the special daily", () => {
  const entryPerMinute = 100 / ADULT_HOURS_PER_YEAR / 60;
  assert.ok(RAMEN_ITEMS.ramen.price / entryPerMinute <= 10);
  assert.ok(RAMEN_ITEMS.special.price / entryPerMinute <= 30);
  assert.equal(RAMEN_ITEMS.ramen.everyMinutes, 60);
  assert.equal(RAMEN_ITEMS.special.everyMinutes, 24 * 60);
});
