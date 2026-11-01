// goals.js — The character's life goal: which one is active, the yearly
// stat drift it gives (building up the longer it's kept), and the
// milestones reached along the way. All goal content lives in
// data/goals.js.

import { GOALS, GOAL_MIN_AGE, DEFAULT_GOAL } from '../data/goals.js';
import { STAT_LABELS } from '../data/stats.js';
import { ageOf, changeStats } from './character.js';

export function goalById(id) {
  return GOALS.find((goal) => goal.id === id) ?? null;
}

// active: the goal id. since: clock time it was picked. nextDriftAt: clock
// time of the next yearly boost. pastYears: years spent with each goal
// before its current stretch. milestones: reached ones, in order, as
// { goal, id, age }.
export function createGoalState(years) {
  return { active: DEFAULT_GOAL, since: years, nextDriftAt: years + 1, pastYears: {}, milestones: [] };
}

// Rebuilds goal state from save data, dropping anything unusable (such as
// a goal or milestone since removed from the data).
export function restoreGoalState(data, years) {
  const state = createGoalState(years);
  if (goalById(data?.active)) state.active = data.active;
  if (Number.isFinite(data?.since) && data.since <= years) state.since = data.since;
  state.nextDriftAt = Number.isFinite(data?.nextDriftAt) ? data.nextDriftAt : state.since + 1;
  for (const [id, value] of Object.entries(data?.pastYears ?? {})) {
    if (goalById(id) && Number.isFinite(value) && value >= 0) state.pastYears[id] = value;
  }
  if (Array.isArray(data?.milestones)) {
    state.milestones = data.milestones.filter((m) => milestoneById(m?.goal, m?.id)
      && Number.isInteger(m.age));
  }
  return state;
}

function milestoneById(goalId, id) {
  return goalById(goalId)?.milestones.find((milestone) => milestone.id === id) ?? null;
}

export function goalsUnlocked(game) {
  return ageOf(game.character, game.clock.years) >= GOAL_MIN_AGE;
}

// Total years spent with goal `id`, including the current stretch.
function goalYears(game, id) {
  const { goals, clock } = game;
  return (goals.pastYears[id] ?? 0) + (goals.active === id ? clock.years - goals.since : 0);
}

// Switches the active goal. The yearly boost starts over from its first,
// smallest value. Returns whether the goal changed.
export function setGoal(game, id) {
  const { goals, clock } = game;
  if (!goalById(id) || id === goals.active || !goalsUnlocked(game)) return false;
  goals.pastYears[goals.active] = goalYears(game, goals.active);
  goals.active = id;
  goals.since = clock.years;
  goals.nextDriftAt = clock.years + 1;
  return true;
}

// The boost for the n-th year (1-based) since the goal was picked.
function driftFor(goal, year) {
  if (!goal.stat || !goal.drift.length) return 0;
  return goal.drift[Math.min(year, goal.drift.length) - 1];
}

// The goal's activity id for the animator, or null.
export function activeActivity(game) {
  return goalsUnlocked(game) ? goalById(game.goals.active)?.activity ?? null : null;
}

// How far a milestone's condition is: { current, target }.
function progressOf(game, goal, milestone) {
  const { when } = milestone;
  if (when.stat) return { current: game.character.stats[when.stat], target: when.atLeast };
  if (when.goalYears) return { current: Math.floor(goalYears(game, goal.id)), target: when.goalYears };
  return { current: Object.keys(game.events.seen).length, target: when.variety };
}

function isReached(game, goal, milestone) {
  return game.goals.milestones.some((m) => m.goal === goal.id && m.id === milestone.id);
}

// Call regularly (on the same timer as events). Gives the yearly boost
// when it's due and records newly reached milestones of the active goal.
// Returns the milestones just reached, as [{ label, goalLabel }].
export function updateGoals(game) {
  const { goals, clock, character } = game;
  const goal = goalById(goals.active);
  while (clock.years >= goals.nextDriftAt) {
    const year = Math.round(goals.nextDriftAt - goals.since);
    const amount = driftFor(goal, year);
    if (amount) changeStats(character, { [goal.stat]: amount });
    goals.nextDriftAt += 1;
  }

  if (!goalsUnlocked(game)) return [];
  const age = ageOf(character, clock.years);
  const reached = [];
  for (const milestone of goal.milestones) {
    if (isReached(game, goal, milestone)) continue;
    const { current, target } = progressOf(game, goal, milestone);
    if (current < target) continue;
    goals.milestones.push({ goal: goal.id, id: milestone.id, age });
    reached.push({ label: milestone.label, goalLabel: goal.label });
  }
  return reached;
}

function unitText(milestone, current, target) {
  const { when } = milestone;
  if (when.stat === 'money') return `$${current}/$${target}`;
  if (when.stat) return `${STAT_LABELS[when.stat]} ${current}/${target}`;
  if (when.goalYears) return `${current}/${target}y`;
  return `${current}/${target} events`;
}

// Everything the goal menu shows.
export function goalView(game) {
  const { goals, clock } = game;
  const goal = goalById(goals.active);
  const yearsIn = Math.floor(clock.years - goals.since);
  return {
    unlocked: goalsUnlocked(game),
    minAge: GOAL_MIN_AGE,
    options: GOALS.map(({ id, label, blurb }) => ({ id, label, blurb, active: id === goal.id })),
    label: goal.label,
    yearsIn,
    stat: goal.stat ? STAT_LABELS[goal.stat] : null,
    money: goal.stat === 'money',
    boostNext: driftFor(goal, yearsIn + 1),
    boostMax: goal.drift.length ? goal.drift[goal.drift.length - 1] : 0,
    milestones: goal.milestones.map((milestone) => {
      const reached = goals.milestones.find((m) => m.goal === goal.id && m.id === milestone.id);
      const { current, target } = progressOf(game, goal, milestone);
      return {
        label: milestone.label,
        reachedAt: reached ? reached.age : null,
        progress: unitText(milestone, Math.min(current, target), target),
      };
    }),
  };
}

