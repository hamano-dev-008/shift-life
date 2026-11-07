// cafe.js — The Cafe's counter: ordering a coffee or a cake (paid at
// once, brought to the table, enjoyed a while, once an hour each). It only
// counts once the character is at the table (game/stay.js). Timers run on
// real time passed in by the renderer, so game speed doesn't change them
// and they pause while the app is closed. Shifts behind the counter are
// game/shifts.js. Numbers and text in data/cafe.js.

import { CAFE_PLACE, CAFE_MIN_AGE, CAFE_ORDERS, ORDER_TIMES, CAFE_NEWS } from '../data/cafe.js';
import { ageOf, changeStats } from './character.js';
import { hasArrived } from './stay.js';
import { isOnShift } from './shifts.js';

const MINUTE_MS = 60 * 1000;

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// waitMs: real ms until each item can be ordered again. order: { item,
// step ('serve', then 'enjoy'), ms (real time into the step) } or null.
export function createCafeState() {
  return { waitMs: { coffee: 0, cake: 0 }, order: null };
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
  return state;
}

export const isOrdering = (game) => Boolean(game.cafe.order);

// Why `item` can't be ordered now ('tooYoung', 'busy', 'wait' or 'money'),
// or null if it can.
export function orderBlock(game, item) {
  if (ageOf(game.character, game.clock.years) < CAFE_MIN_AGE) return 'tooYoung';
  if (isOrdering(game) || isOnShift(game)) return 'busy';
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

// Stops the order: one not served yet is refunded (and can be had again
// at once); one already served just ends. Returns whether there was one.
export function stopOrder(game) {
  const { cafe } = game;
  if (cafe.order?.step === 'serve') {
    changeStats(game.character, { money: CAFE_ORDERS[cafe.order.item].price });
    cafe.waitMs[cafe.order.item] = 0;
  }
  const stopped = isOrdering(game);
  cafe.order = null;
  return stopped;
}

// Call on the life tick with the real ms passed. The wait for each item
// runs down; the order goes on once the character is at the table.
// Returns bubbles to show: the order served (with what it gave).
export function updateCafe(game, realMs) {
  const { cafe } = game;
  for (const item of Object.keys(cafe.waitMs)) cafe.waitMs[item] = Math.max(0, cafe.waitMs[item] - realMs);
  if (game.place !== CAFE_PLACE) {
    stopOrder(game);
    return [];
  }
  if (!hasArrived(game)) return [];
  const bubbles = [];
  const { order } = cafe;
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
  return bubbles;
}

// Everything the counter's menu shows about ordering: { minAge, tooYoung,
// items: [{ id, name, price, block, waitMs, need (dollars short) }],
// order }.
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
  };
}
