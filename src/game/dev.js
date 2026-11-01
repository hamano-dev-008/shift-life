// dev.js — Developer actions behind the dev settings menu and shortcuts:
// start a new life, change the clock speed, skip ahead, force an event,
// add money, finish a busking session, grow a golden apple, finish a rest
// period or switch place now, and a read-out of the character. The menu
// (ui/devMenu.js) only calls these.

import { SPEEDS } from '../data/balance.js';
import { STAT_TAGS } from '../data/stats.js';
import { TRAIT_LABELS } from '../data/traits.js';
import { createCharacter, changeStats, ageOf } from './character.js';
import { createEventState, startEvent } from './events.js';
import { createGoalState, goalById } from './goals.js';
import { createJobState, careerView } from './jobs.js';
import { NEW_LIFE_PLACE } from '../data/places.js';
import { createTreeState, finishSession, makeAppleReady, treeView } from './fortuneTree.js';
import { createHomeState, finishRestPeriod, isResting } from './home.js';
import { currentPlace, enterPlace, leavePlace } from './places.js';

// Replaces the life with a newborn, in place, so everything holding `game`
// sees the new one. The clock starts over at 0 and keeps its speed. Save
// right after to wipe the old life from the save file.
export function newLife(game) {
  game.clock.years = 0;
  game.character = createCharacter(0);
  game.events = createEventState(0);
  game.goals = createGoalState(0);
  game.jobs = createJobState();
  game.place = NEW_LIFE_PLACE;
  game.fortuneTree = createTreeState();
  game.home = createHomeState();
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

// Finishes the busking session being played right now, paying for it.
// Returns the payday bubble, or null if not playing.
export function finishBuskingSession(game) {
  return finishSession(game);
}

// Grows a golden apple on the Fortune Tree right away.
export function appleNow(game) {
  makeAppleReady(game);
}

// Finishes the current rest period on the sofa, gaining its health.
// Returns whether they were resting.
export function finishRest(game) {
  return finishRestPeriod(game);
}

// Switches to place `id` at once, without walking (ending busking or
// resting).
export function goToPlace(game, id) {
  leavePlace(game);
  enterPlace(game, id);
}

// A compact summary for the menu: "HP 80  JOY 70  IQ 35  $120",
// "Bold · Shy", "Scholar, 3y (age 12)", "Developer 2/3, $170/yr",
// "Tree: busking 2:10, 3 sess, apple 85m", "Place: Home, resting".
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
    tree: treeText(treeView(game)),
    place: `Place: ${currentPlace(game).name}${isResting(game) ? ', resting' : ''}`,
  };
}

function treeText(view) {
  const seconds = Math.floor(view.sessionMs / 1000);
  const playing = view.playing ? `busking ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'idle';
  const apple = view.appleReady ? 'apple!' : `apple ${Math.ceil(view.appleInMs / 60000)}m`;
  return `Tree: ${playing}, ${view.sessions} sess, ${apple}`;
}

function jobText(career) {
  if (!career) return 'Too young to work';
  if (career.status === 'retired') return `Retired, $${career.pay}/yr`;
  if (career.status === 'looking') return 'Looking for work';
  return `${career.title} ${career.level}/${career.levels}, $${career.pay}/yr`;
}
