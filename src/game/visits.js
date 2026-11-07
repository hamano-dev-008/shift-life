// visits.js — What a town place's counter sells when it's done at a spot
// there (Pedal Post's mail, Mural Alley's stall, the office's break
// corner): paid at once, each item once every `everyMinutes`; the
// character goes to its spot and it takes its `seconds` there (game/
// stay.js), then gives its effects. Stopped or left before then, it's
// refunded. A place's `spec` is { key (its state in game[key]), place,
// minAge, items ({ id: { name, thing, price, effects, everyMinutes,
// seconds } }), news(id) (the bubble's { heading, text }) }. Timers run
// on real time passed in by the renderer.

import { ageOf, changeStats } from './character.js';
import { hasArrived } from './stay.js';
import { isOnShift } from './shifts.js';
import {
  isAmount, createWaits, restoreWaits, startWait, tickWaits, itemsView,
} from './counter.js';

// waitMs: real ms until each item can be had again. visit: { item, ms
// (real time at its spot) } or null.
export function createVisits(spec) {
  return { waitMs: createWaits(spec.items), visit: null };
}

// Rebuilds a place's state from save data, dropping anything unusable.
export function restoreVisits(spec, data) {
  const state = createVisits(spec);
  state.waitMs = restoreWaits(data?.waitMs, spec.items);
  const visit = data?.visit;
  if (spec.items[visit?.item] && isAmount(visit.ms)) state.visit = { item: visit.item, ms: visit.ms };
  return state;
}

export const isVisiting = (game, spec) => Boolean(game[spec.key].visit);

// Why `item` can't be had now ('tooYoung', 'busy', 'wait' or 'money'), or
// null if it can.
export function visitBlock(game, spec, item) {
  if (ageOf(game.character, game.clock.years) < spec.minAge) return 'tooYoung';
  if (isVisiting(game, spec) || isOnShift(game)) return 'busy';
  if (game[spec.key].waitMs[item] > 0) return 'wait';
  if (game.character.stats.money < spec.items[item].price) return 'money';
  return null;
}

// Pays for `item` (at the place) and sets off for its spot. Returns
// whether it was bought.
export function startVisit(game, spec, item) {
  if (game.place !== spec.place || !spec.items[item] || visitBlock(game, spec, item)) return false;
  changeStats(game.character, { money: -spec.items[item].price });
  startWait(game[spec.key].waitMs, spec.items, item);
  game[spec.key].visit = { item, ms: 0 };
  return true;
}

// Stops it before it's done: refunded, and can be had again at once.
// Returns whether there was one.
export function stopVisit(game, spec) {
  const state = game[spec.key];
  if (!state.visit) return false;
  changeStats(game.character, { money: spec.items[state.visit.item].price });
  state.waitMs[state.visit.item] = 0;
  state.visit = null;
  return true;
}

// Call on the life tick with the real ms passed. The waits run down; once
// at its spot the item takes its `seconds`, then its effects and bubble.
// Away from the place it's called off. Returns bubbles to show.
export function updateVisits(game, spec, realMs) {
  const state = game[spec.key];
  tickWaits(state.waitMs, realMs);
  if (game.place !== spec.place) {
    stopVisit(game, spec);
    return [];
  }
  const { visit } = state;
  if (!visit || !hasArrived(game)) return [];
  visit.ms += realMs;
  const { seconds, effects } = spec.items[visit.item];
  if (visit.ms < seconds * 1000) return [];
  state.visit = null;
  return [{ ...spec.news(visit.item), deltas: changeStats(game.character, effects), celebrate: false }];
}

// Everything the place's menu shows: { minAge, tooYoung, items: [{ id,
// name, price, block, waitMs, need }], visit (with its item's `thing` and
// `totalMs`, or null) }.
export function visitsView(game, spec) {
  const state = game[spec.key];
  const item = state.visit && spec.items[state.visit.item];
  return {
    minAge: spec.minAge,
    tooYoung: ageOf(game.character, game.clock.years) < spec.minAge,
    items: itemsView(game, spec.items, state.waitMs, (id) => visitBlock(game, spec, id)),
    visit: item ? { ...state.visit, thing: item.thing, totalMs: item.seconds * 1000 } : null,
  };
}
