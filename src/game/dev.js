// dev.js — Developer actions behind the dev settings menu and shortcuts:
// start a new life, change the clock speed, skip ahead, force an event,
// add money, and a read-out of the character. The menu (ui/devMenu.js)
// only calls these.

import { SPEEDS } from '../data/balance.js';
import { STAT_TAGS } from '../data/stats.js';
import { TRAIT_LABELS } from '../data/traits.js';
import { createCharacter, changeStats, ageOf } from './character.js';
import { createEventState, startEvent } from './events.js';
import { createGoalState, goalById } from './goals.js';
import { createJobState, careerView } from './jobs.js';

// Replaces the life with a newborn, in place, so everything holding `game`
// sees the new one. The clock starts over at 0 and keeps its speed. Save
// right after to wipe the old life from the save file.
export function newLife(game) {
  game.clock.years = 0;
  game.character = createCharacter(0);
  game.events = createEventState(0);
  game.goals = createGoalState(0);
  game.jobs = createJobState();
}

export function setSpeed(game, speed) {
  if (SPEEDS[speed]) game.clock.speed = speed;
}

// Ctrl+Shift+F: fast if at normal speed, otherwise back to normal.
export function toggleFastForward(game) {
  setSpeed(game, game.clock.speed === 'normal' ? 'fast' : 'normal');
}

// Moves the clock ahead `years` at once. The character ages, the goal's
// yearly boosts and paydays catch up (with promotions and retirement),
// and the next event (if due) comes right away; events aren't replayed
// for every skipped year.
export function skipYears(game, years) {
  game.clock.years += years;
}

// Replaces any waiting event with a new random one that fits the current
// age. Returns whether one started (babies have none).
export function triggerEvent(game) {
  const previous = game.events.pending;
  game.events.pending = null;
  if (startEvent(game)) return true;
  game.events.pending = previous;
  return false;
}

export function addMoney(game, amount) {
  changeStats(game.character, { money: amount });
}

// A compact summary for the menu: "HP 80  JOY 70  IQ 35  $120",
// "Bold · Shy", "Scholar, 3y (age 12)", "Developer 2/3, $170/yr".
export function devReadout(game) {
  const { character, goals, clock } = game;
  const stats = Object.entries(character.stats).map(([id, value]) =>
    (id === 'money' ? `${STAT_TAGS.money}${value}` : `${STAT_TAGS[id]} ${value}`));
  const goalYears = Math.floor(clock.years - goals.since);
  return {
    stats: stats.join('  '),
    traits: character.traits.map((trait) => TRAIT_LABELS[trait]).join(' · '),
    goal: `${goalById(goals.active).label}, ${goalYears}y (age ${ageOf(character, clock.years)})`,
    job: jobText(careerView(game)),
  };
}

function jobText(career) {
  if (!career) return 'Too young to work';
  if (career.status === 'retired') return `Retired, $${career.pay}/yr`;
  if (career.status === 'looking') return 'Looking for work';
  return `${career.title} ${career.level}/${career.levels}, $${career.pay}/yr`;
}
