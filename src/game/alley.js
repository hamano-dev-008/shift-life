// alley.js — Mural Alley's print stall: an art class (once a day, painted
// at the class easel) or a print (once an hour, picked out at the stall).
// Paid at once; it only counts once the character is at its spot
// (game/stay.js). Timers run on real time passed in by the renderer, so
// game speed doesn't change them and they pause while the app is closed.
// Painting shifts are game/shifts.js. Numbers and text in data/alley.js.

import { ALLEY_PLACE, ALLEY_MIN_AGE, ALLEY_ITEMS, ALLEY_NEWS } from '../data/alley.js';
import { ageOf, changeStats } from './character.js';
import { hasArrived } from './stay.js';
import { isOnShift } from './shifts.js';
import {
  isAmount, createWaits, restoreWaits, startWait, tickWaits, itemsView,
} from './counter.js';

// waitMs: real ms until each item can be had again. visit: { item, ms
// (real time at its spot) } or null.
export function createAlleyState() {
  return { waitMs: createWaits(ALLEY_ITEMS), visit: null };
}

// Rebuilds the alley state from save data, dropping anything unusable.
export function restoreAlleyState(data) {
  const state = createAlleyState();
  state.waitMs = restoreWaits(data?.waitMs, ALLEY_ITEMS);
  const visit = data?.visit;
  if (ALLEY_ITEMS[visit?.item] && isAmount(visit.ms)) state.visit = { item: visit.item, ms: visit.ms };
  return state;
}

export const isAtStall = (game) => Boolean(game.alley.visit);

// Why `item` can't be had now ('tooYoung', 'busy', 'wait' or 'money'), or
// null if it can.
export function stallBlock(game, item) {
  if (ageOf(game.character, game.clock.years) < ALLEY_MIN_AGE) return 'tooYoung';
  if (isAtStall(game) || isOnShift(game)) return 'busy';
  if (game.alley.waitMs[item] > 0) return 'wait';
  if (game.character.stats.money < ALLEY_ITEMS[item].price) return 'money';
  return null;
}

// Pays for `item` (in Mural Alley) and sets off for its spot. Returns
// whether it was bought.
export function buyAtStall(game, item) {
  if (game.place !== ALLEY_PLACE || !ALLEY_ITEMS[item] || stallBlock(game, item)) return false;
  changeStats(game.character, { money: -ALLEY_ITEMS[item].price });
  startWait(game.alley.waitMs, ALLEY_ITEMS, item);
  game.alley.visit = { item, ms: 0 };
  return true;
}

// Stops it before it's done: refunded, and can be had again at once.
// Returns whether there was one.
export function stopVisit(game) {
  const { visit } = game.alley;
  if (!visit) return false;
  changeStats(game.character, { money: ALLEY_ITEMS[visit.item].price });
  game.alley.waitMs[visit.item] = 0;
  game.alley.visit = null;
  return true;
}

// Call on the life tick with the real ms passed. The waits run down; once
// at its spot the item takes its `seconds`, then its effects and bubble.
// Returns bubbles to show.
export function updateAlley(game, realMs) {
  const { alley } = game;
  tickWaits(alley.waitMs, realMs);
  if (game.place !== ALLEY_PLACE) {
    stopVisit(game);
    return [];
  }
  const { visit } = alley;
  if (!visit || !hasArrived(game)) return [];
  visit.ms += realMs;
  const { seconds, effects } = ALLEY_ITEMS[visit.item];
  if (visit.ms < seconds * 1000) return [];
  alley.visit = null;
  const { heading, text } = ALLEY_NEWS[visit.item];
  return [{ heading, text, deltas: changeStats(game.character, effects), celebrate: false }];
}

// Everything the stall's menu shows: { minAge, tooYoung, items: [{ id,
// name, price, block, waitMs, need }], visit (with its item's `thing`,
// and `totalMs`) }.
export function alleyView(game) {
  const { alley } = game;
  const visit = alley.visit && ALLEY_ITEMS[alley.visit.item];
  return {
    minAge: ALLEY_MIN_AGE,
    tooYoung: ageOf(game.character, game.clock.years) < ALLEY_MIN_AGE,
    items: itemsView(game, ALLEY_ITEMS, alley.waitMs, (id) => stallBlock(game, id)),
    visit: visit ? { ...alley.visit, thing: visit.thing, totalMs: visit.seconds * 1000 } : null,
  };
}
