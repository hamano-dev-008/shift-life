// activities.js — Runs the activities defined in data/activities.js:
// buying the item one needs, starting and stopping it, real-time
// progress (for fixed-time runs and periodic rewards), its rewards, and
// what the activity menu shows. Fishing's bites and catches come from
// game/fishing.js. Timers run on real time passed in by the renderer, so
// game speed doesn't change them and they pause while the app is closed.

import { PLACE_ACTIVITIES } from '../data/activities.js';
import { ageOf, changeStats } from './character.js';
import {
  createFishingState, restoreFishingState, updateFishing, sellBucket, fishingStatus,
} from './fishing.js';

const MINUTE = 60 * 1000;

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// The activity's data with its id, or null.
export function activityById(id) {
  return Object.hasOwn(PLACE_ACTIVITIES, id) ? { id, ...PLACE_ACTIVITIES[id] } : null;
}

// The activity done at prop `prop` in place `place`, or null.
export function activityAt(place, prop) {
  const entry = Object.entries(PLACE_ACTIVITIES).find(([, def]) => def.place === place && def.prop === prop);
  return entry ? activityById(entry[0]) : null;
}

// Per-life totals for an activity: sessions started, and for catches,
// how many were caught and what the bucket sold for.
function createTotals() {
  return { sessions: 0, caught: 0, earned: 0 };
}

// current: the activity running, or null: { id, ms (real time it has
// run), everyMs (towards the next periodic reward), fishing (the bites
// and bucket, for an activity with catches) }. items: ids of the items
// bought this life. totals: per activity id, see createTotals().
export function createActivityState() {
  const totals = Object.fromEntries(Object.keys(PLACE_ACTIVITIES).map((id) => [id, createTotals()]));
  return { current: null, items: [], totals };
}

const isAmount = (value) => Number.isFinite(value) && value >= 0;

// Rebuilds the activity state from save data, with defaults for anything
// missing or unusable (such as saves from before activities existed).
export function restoreActivityState(data) {
  const state = createActivityState();
  const knownItems = Object.values(PLACE_ACTIVITIES).map((def) => def.item?.id).filter(Boolean);
  if (Array.isArray(data?.items)) state.items = knownItems.filter((id) => data.items.includes(id));
  for (const [id, totals] of Object.entries(state.totals)) {
    for (const key of Object.keys(totals)) {
      if (isAmount(data?.totals?.[id]?.[key])) totals[key] = Math.floor(data.totals[id][key]);
    }
  }
  const saved = data?.current;
  const def = activityById(saved?.id);
  if (def) {
    state.current = {
      id: def.id,
      ms: isAmount(saved.ms) ? saved.ms : 0,
      everyMs: isAmount(saved.everyMs) ? saved.everyMs : 0,
      fishing: def.rewards.catches ? restoreFishingState(saved.fishing) : null,
    };
  }
  return state;
}

// The activity running now, as its data with its id, or null.
export function currentActivity(game) {
  return game.activities.current ? activityById(game.activities.current.id) : null;
}

export function isDoingActivity(game) {
  return Boolean(game.activities.current);
}

// While it runs, no new events (see data/activities.js).
export function activityFreezesEvents(game) {
  return Boolean(currentActivity(game)?.freezeEvents);
}

export function hasItem(game, itemId) {
  return game.activities.items.includes(itemId);
}

function oldEnough(game, def) {
  return ageOf(game.character, game.clock.years) >= def.minAge;
}

function needsItem(game, def) {
  return Boolean(def.item) && !hasItem(game, def.item.id);
}

// Buys the item activity `id` needs. Returns its bubble, or null if it's
// owned already, too dear, or the character is too young.
export function buyItem(game, id) {
  const def = activityById(id);
  if (!def || !needsItem(game, def) || !oldEnough(game, def)) return null;
  if (game.character.stats.money < def.item.price) return null;
  const deltas = changeStats(game.character, { money: -def.item.price });
  game.activities.items.push(def.item.id);
  const { heading, text } = def.text.bought;
  return { heading, text: fill(text, { name: game.character.name, item: def.item.name }), deltas, celebrate: true };
}

// Gives the item without paying (dev menu). Returns whether it was new.
export function giveItem(game, id) {
  const def = activityById(id);
  if (!def?.item || hasItem(game, def.item.id)) return false;
  game.activities.items.push(def.item.id);
  return true;
}

// Whether activity `id` can start now: at its place, old enough, with its
// item, and nothing else running.
export function canStart(game, id) {
  const def = activityById(id);
  return Boolean(def) && !game.activities.current && game.place === def.place
    && oldEnough(game, def) && !needsItem(game, def);
}

// Starts activity `id`. Returns whether it started.
export function startActivity(game, id, random = Math.random) {
  if (!canStart(game, id)) return false;
  const def = activityById(id);
  game.activities.current = {
    id, ms: 0, everyMs: 0, fishing: def.rewards.catches ? createFishingState(random) : null,
  };
  game.activities.totals[id].sessions += 1;
  return true;
}

// Stops the activity running now: the bucket is sold, and an unfinished
// period or fixed-time run gives nothing. Returns its bubble (the sale
// for catches), or null if nothing was running.
export function stopActivity(game) {
  const { current } = game.activities;
  if (!current) return null;
  game.activities.current = null;
  if (current.fishing) return sellBucket(game, current.fishing);
  return null;
}

// Stat changes as a bubble.
function rewardBubble(game, stats, heading, text) {
  return { heading, text, deltas: changeStats(game.character, stats), celebrate: false };
}

// Call regularly with the real ms passed since the last call (capped by
// the caller, so a sleeping PC doesn't count). Runs the activity: catches,
// periodic rewards, and the end of a fixed-time run. Returns bubbles to
// show ([{ heading, text, detail, deltas, celebrate, collected }];
// `collected` means the fish collection changed).
export function updateActivities(game, realMs, random = Math.random) {
  const { current } = game.activities;
  if (!current) return [];
  const def = activityById(current.id);
  const bubbles = [];
  current.ms += realMs;
  if (current.fishing) bubbles.push(...updateFishing(game, current.fishing, realMs, random));
  const every = def.rewards.every;
  if (every) {
    current.everyMs += realMs;
    const period = every.minutes * MINUTE;
    while (current.everyMs >= period) {
      current.everyMs -= period;
      bubbles.push(rewardBubble(game, every.stats, def.name, def.text.reward ?? def.name));
    }
  }
  if (def.runs?.minutes && current.ms >= def.runs.minutes * MINUTE) {
    const { heading, text } = def.text.done;
    const finish = def.rewards.onFinish ? rewardBubble(game, def.rewards.onFinish, heading, text) : null;
    const sold = stopActivity(game);
    bubbles.push(...[finish, sold].filter(Boolean));
  }
  return bubbles;
}

// Everything the activity menu shows for activity `id`: { id, title,
// unlocked, tooYoung (text), buy ({ label, affordable, need }, or null
// once owned), toggle ({ label, running }, or null), status (lines),
// running }.
export function activityView(game, id) {
  const def = activityById(id);
  const unlocked = oldEnough(game, def);
  const running = game.activities.current?.id === id;
  const view = {
    id,
    title: def.text.title,
    unlocked,
    tooYoung: fill(def.text.tooYoung, { age: def.minAge }),
    buy: null,
    toggle: null,
    status: [],
    running,
  };
  if (!unlocked) return view;
  if (needsItem(game, def)) {
    const short = def.item.price - game.character.stats.money;
    view.buy = {
      label: fill(def.text.buy, { item: def.item.name, price: def.item.price }),
      affordable: short <= 0,
      need: short > 0 ? fill(def.text.need, { amount: short }) : '',
    };
    if (view.buy.need) view.status.push(view.buy.need);
    return view;
  }
  view.toggle = { label: running ? def.text.stop : def.text.start, running };
  if (running && game.activities.current.fishing) {
    view.status.push(...fishingStatus(game.activities.current.fishing));
  } else if (def.text.idle) {
    view.status.push(def.text.idle);
  }
  return view;
}
