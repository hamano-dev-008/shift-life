// events.js — Life event engine. Schedules events that fit the
// character's age and life stage, tracks the one waiting for an answer,
// applies the chosen outcome's stat effects, and has the character decide
// from their traits and goal when the player doesn't answer in time. All
// event content lives in data/events.js.

import { EVENTS } from '../data/events.js';
import {
  EVENT_GAP_YEARS, AUTO_DECIDE_SECONDS, REAL_MINUTES_PER_YEAR, DECISION_WHIM,
  GOAL_DECISION_WEIGHT, GOAL_EVENT_WEIGHT,
} from '../data/balance.js';
import { ageOf, lifeStageOf, changeStats } from './character.js';

// The auto-decide wait in in-game years, so fast-forward shortens it too.
const AUTO_DECIDE_YEARS = AUTO_DECIDE_SECONDS / (REAL_MINUTES_PER_YEAR * 60);

// Picks from `list`, each item as likely as weight(item).
function pickWeighted(list, weight) {
  let roll = Math.random() * list.reduce((sum, item) => sum + weight(item), 0);
  for (const item of list) {
    roll -= weight(item);
    if (roll < 0) return item;
  }
  return list[list.length - 1];
}

function randomGap() {
  const [min, max] = EVENT_GAP_YEARS;
  return min + Math.random() * (max - min);
}

function eventById(id) {
  return EVENTS.find((event) => event.id === id) ?? null;
}

// nextAt: clock time the next event is due. pending: the event waiting for
// an answer, { id, shownAt }. seen: times each event has happened.
// lastId: the most recent event, so it isn't repeated back to back.
export function createEventState(years) {
  return { nextAt: years + randomGap(), pending: null, seen: {}, lastId: null };
}

// Rebuilds event state from save data, dropping anything unusable (such as
// a pending event that has since been removed from the data).
export function restoreEventState(data, years) {
  const state = createEventState(years);
  if (Number.isFinite(data?.nextAt)) state.nextAt = data.nextAt;
  const pending = data?.pending;
  if (eventById(pending?.id) && Number.isFinite(pending.shownAt)) {
    state.pending = { id: pending.id, shownAt: pending.shownAt };
  }
  for (const [id, count] of Object.entries(data?.seen ?? {})) {
    if (Number.isInteger(count) && count > 0) state.seen[id] = count;
  }
  if (typeof data?.lastId === 'string') state.lastId = data.lastId;
  return state;
}

function fits(event, age, stage) {
  return event.stages.includes(stage)
    && age >= (event.minAge ?? 0)
    && age <= (event.maxAge ?? Infinity);
}

// True if one of the event's choices serves goal `goalId`.
function servesGoal(event, goalId) {
  return event.choices.some((choice) => choice.goals?.includes(goalId));
}

// A fitting event, favoring those seen least and avoiding the last one
// unless it's the only fit. Among those, events that serve the active goal
// are GOAL_EVENT_WEIGHT times as likely. Null if nothing fits (babies have
// no events).
function pickEvent(game) {
  const age = ageOf(game.character, game.clock.years);
  const stage = lifeStageOf(age);
  const { seen, lastId } = game.events;
  const fitting = EVENTS.filter((event) => fits(event, age, stage));
  const fresh = fitting.filter((event) => event.id !== lastId);
  const pool = fresh.length ? fresh : fitting;
  if (!pool.length) return null;
  const timesSeen = (event) => seen[event.id] ?? 0;
  const fewest = Math.min(...pool.map(timesSeen));
  const goal = game.goals.active;
  return pickWeighted(pool.filter((event) => timesSeen(event) === fewest),
    (event) => (servesGoal(event, goal) ? GOAL_EVENT_WEIGHT : 1));
}

// Starts a fitting event now, unless one is already waiting. Returns
// whether one started.
export function startEvent(game) {
  if (game.events.pending) return false;
  const event = pickEvent(game);
  if (!event) return false;
  game.events.pending = { id: event.id, shownAt: game.clock.years };
  return true;
}

// Call regularly (it runs on a timer, so it works while minimized). Starts
// an event when one is due, and has the character decide one left
// unanswered too long, unless holdAutoDecide is set (the player is reading
// it). Returns the result of an auto-decision, or null.
export function updateEvents(game, { holdAutoDecide = false } = {}) {
  const { clock, events } = game;
  if (events.pending) {
    const waited = clock.years - events.pending.shownAt;
    return !holdAutoDecide && waited >= AUTO_DECIDE_YEARS ? autoDecide(game) : null;
  }
  if (clock.years >= events.nextAt && !startEvent(game)) {
    // Nothing fits this age yet: look again after another gap.
    events.nextAt = clock.years + randomGap();
  }
  return null;
}

// Restarts the auto-decide wait, e.g. when the player closes the card
// without choosing.
export function postponeAutoDecide(game) {
  if (game.events.pending) game.events.pending.shownAt = game.clock.years;
}

function canPick(character, choice) {
  return Object.entries(choice.needs ?? {})
    .every(([stat, min]) => character.stats[stat] >= min);
}

function fillName(text, character) {
  return text.replaceAll('{name}', character.name);
}

// What to show for the waiting event: { prompt, choices: [{ label,
// available, needs }] }, or null if there is none.
export function pendingEventView(game) {
  const event = eventById(game.events.pending?.id);
  if (!event) return null;
  const { character } = game;
  return {
    prompt: fillName(event.prompt, character),
    choices: event.choices.map((choice) => ({
      label: fillName(choice.label, character),
      available: canPick(character, choice),
      needs: choice.needs ?? null,
    })),
  };
}

// The player picked choice `index` of the waiting event. Returns the result
// (see resolve()), or null if that choice can't be picked.
export function chooseEvent(game, index) {
  const event = eventById(game.events.pending?.id);
  const choice = event?.choices[index];
  if (!choice || !canPick(game.character, choice)) return null;
  return resolve(game, event, choice, false);
}

// Each of the character's traits that leans toward a choice scores 1, a
// choice serving the active goal scores GOAL_DECISION_WEIGHT, plus a random
// whim (see DECISION_WHIM); the highest score wins.
function autoDecide(game) {
  const event = eventById(game.events.pending.id);
  const { traits } = game.character;
  const goal = game.goals.active;
  const pickable = event.choices.filter((choice) => canPick(game.character, choice));
  const options = pickable.length ? pickable : event.choices;
  const score = (choice) => (choice.lean ?? []).filter((trait) => traits.includes(trait)).length
    + (choice.goals?.includes(goal) ? GOAL_DECISION_WEIGHT : 0)
    + Math.random() * DECISION_WHIM;
  const scored = options.map((choice) => ({ choice, score: score(choice) }));
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
  return resolve(game, event, best.choice, true);
}

// Applies one of the choice's outcomes, clears the event, and schedules the
// next. Returns { text, deltas, auto }: what happened, how much each stat
// actually changed, and whether the character decided alone.
function resolve(game, event, choice, auto) {
  const outcome = pickWeighted(choice.outcomes ?? [choice], (o) => o.weight ?? 1);
  const deltas = changeStats(game.character, outcome.effects ?? {});
  const { events } = game;
  events.seen[event.id] = (events.seen[event.id] ?? 0) + 1;
  events.lastId = event.id;
  events.pending = null;
  events.nextAt = game.clock.years + randomGap();
  return { text: fillName(outcome.text, game.character), deltas, auto };
}
