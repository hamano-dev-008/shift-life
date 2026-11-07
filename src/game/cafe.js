// cafe.js — The Cafe's counter: ordering a coffee or a cake (paid at
// once, brought to the table, enjoyed a while, once an hour each) and,
// while the character works at the cafe, paid shifts behind the counter.
// Both only count once the character is at their spot (game/stay.js).
// Timers run on real time passed in by the renderer, so game speed
// doesn't change them and they pause while the app is closed. Numbers and
// text in data/cafe.js.

import {
  CAFE_PLACE, CAFE_MIN_AGE, CAFE_ORDERS, ORDER_TIMES, CAFE_JOB, SHIFT, CAFE_NEWS,
} from '../data/cafe.js';
import { LIFE_STAGES } from '../data/lifeStages.js';
import { ageOf, changeStats } from './character.js';
import { careerView } from './jobs.js';
import { hasArrived } from './stay.js';

const MINUTE_MS = 60 * 1000;
const SHIFT_MS = SHIFT.minutes * MINUTE_MS;
const ADULT_HOURS_PER_YEAR = LIFE_STAGES.find((stage) => stage.id === 'adult').realMinutesPerYear / 60;

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// waitMs: real ms until each item can be ordered again. order: { item,
// step ('serve', then 'enjoy'), ms (real time into the step) } or null.
// shift: { ms (real time worked) } or null. shifts: shifts finished this
// life.
export function createCafeState() {
  return { waitMs: { coffee: 0, cake: 0 }, order: null, shift: null, shifts: 0 };
}

const isAmount = (value) => Number.isFinite(value) && value >= 0;

// Rebuilds the cafe state from save data, dropping anything unusable.
export function restoreCafeState(data) {
  const state = createCafeState();
  for (const item of Object.keys(CAFE_ORDERS)) {
    if (isAmount(data?.waitMs?.[item])) state.waitMs[item] = Math.min(data.waitMs[item], CAFE_ORDERS[item].everyMinutes * MINUTE_MS);
  }
  const order = data?.order;
  if (CAFE_ORDERS[order?.item] && ['serve', 'enjoy'].includes(order.step) && isAmount(order.ms)) {
    state.order = { item: order.item, step: order.step, ms: order.ms };
  }
  if (isAmount(data?.shift?.ms)) state.shift = { ms: Math.min(data.shift.ms, SHIFT_MS) };
  if (Number.isInteger(data?.shifts) && data.shifts >= 0) state.shifts = data.shifts;
  return state;
}

// Whether the character works at the cafe now.
export function worksAtCafe(game) {
  return game.jobs.current?.id === CAFE_JOB;
}

// What a full shift pays now: SHIFT.rate of the job's hourly pay for
// SHIFT.minutes (whole dollars).
export function shiftPay(game) {
  const yearly = careerView(game)?.pay ?? 0;
  return Math.round((yearly / ADULT_HOURS_PER_YEAR) * SHIFT.rate * (SHIFT.minutes / 60));
}

export const isOrdering = (game) => Boolean(game.cafe.order);
export const isOnShift = (game) => Boolean(game.cafe.shift);
export const isAtCafeCounter = (game) => isOrdering(game) || isOnShift(game);

// Why `item` can't be ordered now ('tooYoung', 'busy', 'wait' or 'money'),
// or null if it can.
export function orderBlock(game, item) {
  if (ageOf(game.character, game.clock.years) < CAFE_MIN_AGE) return 'tooYoung';
  if (isAtCafeCounter(game)) return 'busy';
  if (game.cafe.waitMs[item] > 0) return 'wait';
  if (game.character.stats.money < CAFE_ORDERS[item].price) return 'money';
  return null;
}

// Orders `item` (at the Cafe): pays for it and sets off for the table.
// Returns whether it was ordered.
export function orderItem(game, item) {
  if (game.place !== CAFE_PLACE || !CAFE_ORDERS[item] || orderBlock(game, item)) return false;
  changeStats(game.character, { money: -CAFE_ORDERS[item].price });
  game.cafe.waitMs[item] = CAFE_ORDERS[item].everyMinutes * MINUTE_MS;
  game.cafe.order = { item, step: 'serve', ms: 0 };
  return true;
}

// Starts a shift (at the Cafe, working there, nothing else at the
// counter). Returns whether it started.
export function startShift(game) {
  if (game.place !== CAFE_PLACE || !worksAtCafe(game) || isAtCafeCounter(game)) return false;
  game.cafe.shift = { ms: 0 };
  return true;
}

// Stops what's going on at the counter. A shift stopped early pays
// nothing; an order not served yet is refunded (and can be had again
// at once); one already served just ends. Returns whether anything
// stopped.
export function stopCafe(game) {
  const { cafe } = game;
  if (cafe.order?.step === 'serve') {
    changeStats(game.character, { money: CAFE_ORDERS[cafe.order.item].price });
    cafe.waitMs[cafe.order.item] = 0;
  }
  const stopped = isAtCafeCounter(game);
  cafe.order = null;
  cafe.shift = null;
  return stopped;
}

// Call on the life tick with the real ms passed. The wait for each item
// runs down; the order and the shift go on once the character is at
// their spot. Returns bubbles to show: the order served (with what it
// gave), the shift done (with its pay).
export function updateCafe(game, realMs) {
  const { cafe } = game;
  for (const item of Object.keys(cafe.waitMs)) cafe.waitMs[item] = Math.max(0, cafe.waitMs[item] - realMs);
  if (game.place !== CAFE_PLACE) {
    if (isAtCafeCounter(game)) stopCafe(game);
    return [];
  }
  if (!hasArrived(game)) return [];
  const bubbles = [];
  const { order, shift } = cafe;
  if (order) {
    order.ms += realMs;
    const { name, effects } = CAFE_ORDERS[order.item];
    if (order.step === 'serve' && order.ms >= ORDER_TIMES.serve * 1000) {
      order.step = 'enjoy';
      order.ms = 0;
      const { heading, text } = CAFE_NEWS.served;
      bubbles.push({ heading, text: fill(text, { item: name.toLowerCase() }), deltas: changeStats(game.character, effects), celebrate: false });
    } else if (order.step === 'enjoy' && order.ms >= ORDER_TIMES.enjoy * 1000) {
      cafe.order = null;
    }
  }
  if (shift) {
    shift.ms += realMs;
    if (shift.ms >= SHIFT_MS) {
      cafe.shift = null;
      cafe.shifts += 1;
      const { heading, text } = CAFE_NEWS.shiftDone;
      bubbles.push({ heading, text, deltas: changeStats(game.character, { money: shiftPay(game) }), celebrate: false });
    }
  }
  return bubbles;
}

// Everything the counter's menu shows: { minAge, tooYoung, items: [{ id,
// name, price, block, waitMs, need (dollars short) }], order, staff (the
// job title, or null),
// shift: { pay, ms, totalMs } or null }.
export function cafeView(game) {
  const { cafe } = game;
  return {
    minAge: CAFE_MIN_AGE,
    tooYoung: ageOf(game.character, game.clock.years) < CAFE_MIN_AGE,
    items: Object.entries(CAFE_ORDERS).map(([id, item]) => ({
      id,
      name: item.name,
      price: item.price,
      block: orderBlock(game, id),
      waitMs: cafe.waitMs[id],
      need: Math.max(0, item.price - game.character.stats.money),
    })),
    order: cafe.order ? { ...cafe.order, name: CAFE_ORDERS[cafe.order.item].name } : null,
    staff: worksAtCafe(game) ? careerView(game).title : null,
    shift: worksAtCafe(game) ? { pay: shiftPay(game), ms: cafe.shift?.ms ?? null, totalMs: SHIFT_MS } : null,
  };
}
