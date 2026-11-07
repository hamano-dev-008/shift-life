// store.js — The 6-Eleven's register: buying a snack (onigiri, ice cream,
// an energy drink) or a scratch card, once an hour each. Paid at once;
// the character pays at the register while the clerk scans, then has it
// by the glass front (or scratches the card there). Each step only counts
// once they're at its spot (game/stay.js). Timers run on real time passed
// in by the renderer, so game speed doesn't change them and they pause
// while the app is closed. Shifts behind the register are game/shifts.js.
// Numbers and text in data/store.js.

import {
  STORE_PLACE, STORE_MIN_AGE, STORE_ITEMS, PURCHASE_TIMES, STORE_NEWS,
} from '../data/store.js';
import { ageOf, changeStats } from './character.js';
import { hasArrived } from './stay.js';
import { isOnShift } from './shifts.js';
import {
  isAmount, createWaits, restoreWaits, startWait, tickWaits, itemsView,
} from './counter.js';

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// waitMs: real ms until each item can be had again. purchase: { item,
// step ('pay', then 'enjoy' or 'scratch'), ms (real time into the step) }
// or null. scratchWins: dollars won on scratch cards this life.
export function createStoreState() {
  return { waitMs: createWaits(STORE_ITEMS), purchase: null, scratchWins: 0 };
}

// Rebuilds the store state from save data, dropping anything unusable.
export function restoreStoreState(data) {
  const state = createStoreState();
  state.waitMs = restoreWaits(data?.waitMs, STORE_ITEMS);
  const purchase = data?.purchase;
  if (STORE_ITEMS[purchase?.item] && ['pay', 'enjoy', 'scratch'].includes(purchase.step) && isAmount(purchase.ms)) {
    state.purchase = { item: purchase.item, step: purchase.step, ms: purchase.ms };
  }
  if (isAmount(data?.scratchWins)) state.scratchWins = data.scratchWins;
  return state;
}

export const isBuying = (game) => Boolean(game.store.purchase);

// Why `item` can't be had now ('tooYoung', 'busy', 'wait' or 'money'), or
// null if it can.
export function buyBlock(game, item) {
  if (ageOf(game.character, game.clock.years) < STORE_MIN_AGE) return 'tooYoung';
  if (isBuying(game) || isOnShift(game)) return 'busy';
  if (game.store.waitMs[item] > 0) return 'wait';
  if (game.character.stats.money < STORE_ITEMS[item].price) return 'money';
  return null;
}

// Buys `item` (at the 6-Eleven): pays and sets off for the register.
// Returns whether it was bought.
export function buyAtStore(game, item) {
  if (game.place !== STORE_PLACE || !STORE_ITEMS[item] || buyBlock(game, item)) return false;
  changeStats(game.character, { money: -STORE_ITEMS[item].price });
  startWait(game.store.waitMs, STORE_ITEMS, item);
  game.store.purchase = { item, step: 'pay', ms: 0 };
  return true;
}

// Stops the purchase: before it's paid at the register it's refunded (and
// can be had again at once); after, it just ends. Returns whether there
// was one.
export function stopPurchase(game) {
  const { store } = game;
  if (store.purchase?.step === 'pay') {
    changeStats(game.character, { money: STORE_ITEMS[store.purchase.item].price });
    store.waitMs[store.purchase.item] = 0;
  }
  const stopped = isBuying(game);
  store.purchase = null;
  return stopped;
}

// What a scratch card wins: the first prize whose chance comes up
// (`random` 0-1 picks), else 0.
export function scratchPrize(random) {
  let roll = random();
  for (const prize of STORE_ITEMS.scratch.prizes) {
    if (roll < prize.chance) return prize.pay;
    roll -= prize.chance;
  }
  return 0;
}

// The end of having the item: a snack's effects ("munch!"), or the
// scratch card's result.
function finish(game, item, random) {
  const { name, effects } = STORE_ITEMS[item];
  if (item !== 'scratch') {
    const { heading, text } = STORE_NEWS.munch;
    return { heading, text: fill(text, { item: name.toLowerCase() }), deltas: changeStats(game.character, effects), celebrate: false };
  }
  const pay = scratchPrize(random);
  if (!pay) return { text: STORE_NEWS.lost.text, deltas: {}, celebrate: false };
  game.store.scratchWins += pay;
  const { heading, text } = STORE_NEWS.won;
  return { heading, text: fill(text, { pay }), deltas: changeStats(game.character, { money: pay }), celebrate: true };
}

// Call on the life tick with the real ms passed. The waits run down; the
// purchase goes on once the character is at its spot: paid, then had (or
// scratched). Returns bubbles to show.
export function updateStore(game, realMs, random = Math.random) {
  const { store } = game;
  tickWaits(store.waitMs, realMs);
  if (game.place !== STORE_PLACE) {
    stopPurchase(game);
    return [];
  }
  const { purchase } = store;
  if (!purchase || !hasArrived(game)) return [];
  purchase.ms += realMs;
  if (purchase.step === 'pay') {
    if (purchase.ms >= PURCHASE_TIMES.pay * 1000) {
      purchase.step = purchase.item === 'scratch' ? 'scratch' : 'enjoy';
      purchase.ms = 0;
    }
    return [];
  }
  const done = purchase.step === 'scratch' ? purchase.ms >= PURCHASE_TIMES.scratch * 1000
    : purchase.ms >= PURCHASE_TIMES.enjoy * 1000;
  if (!done) return [];
  store.purchase = null;
  return [finish(game, purchase.item, random)];
}

// Everything the register's menu shows about buying: { minAge, tooYoung,
// items: [{ id, name, price, block, waitMs, need (dollars short) }],
// purchase (with its item's name) }.
export function storeView(game) {
  const { store } = game;
  return {
    minAge: STORE_MIN_AGE,
    tooYoung: ageOf(game.character, game.clock.years) < STORE_MIN_AGE,
    items: itemsView(game, STORE_ITEMS, store.waitMs, (id) => buyBlock(game, id)),
    purchase: store.purchase ? { ...store.purchase, name: STORE_ITEMS[store.purchase.item].name } : null,
  };
}
