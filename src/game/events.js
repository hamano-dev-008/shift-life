// events.js — Life event engine. Schedules events that fit the
// character's age and life stage, tracks the one waiting for an answer,
// applies the chosen outcome's stat effects, and has the character decide
// from their traits and goal when the player doesn't answer in time. Job
// offers (game/jobs.js) come through here too, ahead of other events, for
// an adult without a job. All event content lives in data/events.js.

import { EVENTS } from '../data/events.js';
import {
  EVENT_GAP_YEARS, AUTO_DECIDE_SECONDS, REAL_MINUTES_PER_YEAR, DECISION_WHIM,
  GOAL_DECISION_WEIGHT, GOAL_EVENT_WEIGHT,
} from '../data/balance.js';
import { ageOf, lifeStageOf, changeStats } from './character.js';
import {
  JOB_OFFER_ID, jobById, isEmployed, jobTitle, wantsJobOffer, makeJobOffer, jobOfferEvent,
  applyJobChange,
} from './jobs.js';

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

// The event a pending entry stands for: a job offer built from its saved
// `offer` (job ids), or one from data/events.js.
function eventOf(pending) {
  if (!pending) return null;
  return pending.offer ? jobOfferEvent(pending.offer) : eventById(pending.id);
}

// nextAt: clock time the next event is due. pending: the event waiting for
// an answer, { id, shownAt }, plus `offer` (job ids) for a job offer.
// seen: times each event has happened. lastId: the most recent event, so
// it isn't repeated back to back. frozenAt: clock time events were frozen
// (see updateEvents()), or null.
export function createEventState(years) {
  return { nextAt: years + randomGap(), pending: null, seen: {}, lastId: null, frozenAt: null };
}

// The time as events see it: the clock, or while frozen, the moment they
// froze. Scheduling uses this, so what's set up during a freeze lines up
// once the freeze ends.
function eventTime(game) {
  return game.events.frozenAt ?? game.clock.years;
}

// Rebuilds event state from save data, dropping anything unusable (such as
// a pending event that has since been removed from the data).
export function restoreEventState(data, years) {
  const state = createEventState(years);
  if (Number.isFinite(data?.nextAt)) state.nextAt = data.nextAt;
  const pending = data?.pending;
  const isOffer = pending?.id === JOB_OFFER_ID && Array.isArray(pending.offer)
    && pending.offer.length > 0 && pending.offer.every(jobById);
  if ((isOffer || eventById(pending?.id)) && Number.isFinite(pending.shownAt)) {
    state.pending = { id: pending.id, shownAt: pending.shownAt };
    if (isOffer) state.pending.offer = [...pending.offer];
  }
  for (const [id, count] of Object.entries(data?.seen ?? {})) {
    if (Number.isInteger(count) && count > 0) state.seen[id] = count;
  }
  if (typeof data?.lastId === 'string') state.lastId = data.lastId;
  if (Number.isFinite(data?.frozenAt) && data.frozenAt <= years) state.frozenAt = data.frozenAt;
  return state;
}

function fits(event, age, stage, employed) {
  return event.stages.includes(stage)
    && age >= (event.minAge ?? 0)
    && age <= (event.maxAge ?? Infinity)
    && (event.employed === undefined || event.employed === employed);
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
  const employed = isEmployed(game);
  const fitting = EVENTS.filter((event) => fits(event, age, stage, employed));
  const fresh = fitting.filter((event) => event.id !== lastId);
  const pool = fresh.length ? fresh : fitting;
  if (!pool.length) return null;
  const timesSeen = (event) => seen[event.id] ?? 0;
  const fewest = Math.min(...pool.map(timesSeen));
  const goal = game.goals.active;
  return pickWeighted(pool.filter((event) => timesSeen(event) === fewest),
    (event) => (servesGoal(event, goal) ? GOAL_EVENT_WEIGHT : 1));
}

// Starts a fitting event now, unless one is already waiting: a job offer
// if the character is looking for work, otherwise from data/events.js.
// Returns whether one started.
export function startEvent(game) {
  if (game.events.pending) return false;
  const offer = wantsJobOffer(game) ? makeJobOffer(game) : null;
  if (offer) {
    game.events.pending = { id: JOB_OFFER_ID, shownAt: eventTime(game), offer };
    return true;
  }
  const event = pickEvent(game);
  if (!event) return false;
  game.events.pending = { id: event.id, shownAt: eventTime(game) };
  return true;
}

// Call regularly (it runs on a timer, so it works while minimized). Starts
// an event when one is due, and has the character decide one left
// unanswered too long, unless holdAutoDecide is set (the player is reading
// it). Returns the result of an auto-decision, or null.
//
// `freeze` (while busking at the Fortune Tree) stops time for events: no
// new event starts, and both the wait for the next one and a waiting
// event's auto-decide wait stand still. Once it's no longer set, they pick
// up where they were, so events don't pile up. A waiting event can still
// be answered meanwhile.
export function updateEvents(game, { holdAutoDecide = false, freeze = false } = {}) {
  const { clock, events } = game;
  if (freeze) {
    if (events.frozenAt === null) events.frozenAt = clock.years;
    return null;
  }
  if (events.frozenAt !== null) {
    const frozenFor = clock.years - events.frozenAt;
    events.nextAt += frozenFor;
    if (events.pending) events.pending.shownAt += frozenFor;
    events.frozenAt = null;
  }
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
  if (game.events.pending) game.events.pending.shownAt = eventTime(game);
}

function canPick(character, choice) {
  return Object.entries(choice.needs ?? {})
    .every(([stat, min]) => character.stats[stat] >= min);
}

// Fills in {name}, {job} (the job held) and `extra` ({ newJob }).
function fillText(text, game, extra = {}) {
  const values = { name: game.character.name, job: jobTitle(game), ...extra };
  return Object.entries(values)
    .reduce((out, [key, value]) => (value === undefined ? out : out.replaceAll(`{${key}}`, value)), text);
}

// What to show for the waiting event: { prompt, choices: [{ label,
// available, needs }] }, or null if there is none.
export function pendingEventView(game) {
  const event = eventOf(game.events.pending);
  if (!event) return null;
  const { character } = game;
  return {
    prompt: fillText(event.prompt, game),
    choices: event.choices.map((choice) => ({
      label: fillText(choice.label, game),
      available: canPick(character, choice),
      needs: choice.needs ?? null,
    })),
  };
}

// The player picked choice `index` of the waiting event. Returns the result
// (see resolve()), or null if that choice can't be picked.
export function chooseEvent(game, index) {
  const event = eventOf(game.events.pending);
  const choice = event?.choices[index];
  if (!choice || !canPick(game.character, choice)) return null;
  return resolve(game, event, choice, false);
}

// Each of the character's traits that leans toward a choice scores 1, a
// choice serving the active goal scores GOAL_DECISION_WEIGHT, plus a random
// whim (see DECISION_WHIM); the highest score wins.
function autoDecide(game) {
  const event = eventOf(game.events.pending);
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

// Applies one of the choice's outcomes (stats, then any job change),
// clears the event, and schedules the next. Returns { text, deltas, raise,
// auto }: what happened, how much each stat actually changed, the change
// to yearly pay (0 if none), and whether the character decided alone.
function resolve(game, event, choice, auto) {
  const outcome = pickWeighted(choice.outcomes ?? [choice], (o) => o.weight ?? 1);
  const deltas = changeStats(game.character, outcome.effects ?? {});
  // {job} names the job as it was; {newJob} the one after a change.
  const job = jobTitle(game);
  const change = outcome.job ? applyJobChange(game, outcome.job) : null;
  const { events } = game;
  events.seen[event.id] = (events.seen[event.id] ?? 0) + 1;
  events.lastId = event.id;
  events.pending = null;
  events.nextAt = eventTime(game) + randomGap();
  const text = fillText(outcome.text, game, { job, newJob: change?.newJob });
  return { text, deltas, raise: change?.raise ?? 0, auto };
}
