// shifts.js — Paid shifts at a workplace in town (data/work.js): while the
// character's job is the one that works there, they can work a shift
// behind its counter, paid when it's done. A shift only counts once
// they're behind the counter (game/stay.js), on real time passed in by
// the renderer. game.work holds { shift ({ place, ms } or null), shifts
// (finished this life) }.

import { WORKPLACES, SHIFT, SHIFT_TEXT } from '../data/work.js';
import { LIFE_STAGES } from '../data/lifeStages.js';
import { changeStats } from './character.js';
import { careerView } from './jobs.js';
import { hasArrived } from './stay.js';

const SHIFT_MS = SHIFT.minutes * 60 * 1000;
const ADULT_HOURS_PER_YEAR = LIFE_STAGES.find((stage) => stage.id === 'adult').realMinutesPerYear / 60;

export function createWorkState() {
  return { shift: null, shifts: 0 };
}

const isAmount = (value) => Number.isFinite(value) && value >= 0;

// Rebuilds the work state from save data. `cafe` is the old save's cafe
// state, where a shift was kept before there were other workplaces.
export function restoreWorkState(data, cafe = null) {
  const state = createWorkState();
  const shift = data?.shift ?? (cafe?.shift ? { place: WORKPLACES[0].place, ms: cafe.shift.ms } : null);
  if (WORKPLACES.some((work) => work.place === shift?.place) && isAmount(shift.ms)) {
    state.shift = { place: shift.place, ms: Math.min(shift.ms, SHIFT_MS) };
  }
  const shifts = data?.shifts ?? cafe?.shifts;
  if (Number.isInteger(shifts) && shifts >= 0) state.shifts = shifts;
  return state;
}

// The workplace at place `id`, or null.
export function workplaceAt(id) {
  return WORKPLACES.find((work) => work.place === id) ?? null;
}

// The workplace where the character is now, if their job works there.
export function workplaceHere(game) {
  const work = workplaceAt(game.place);
  return work && game.jobs.current?.id === work.job ? work : null;
}

export const isOnShift = (game) => Boolean(game.work.shift);

// What a full shift pays now: SHIFT.rate of the job's hourly pay for
// SHIFT.minutes (whole dollars).
export function shiftPay(game) {
  const yearly = careerView(game)?.pay ?? 0;
  return Math.round((yearly / ADULT_HOURS_PER_YEAR) * SHIFT.rate * (SHIFT.minutes / 60));
}

// Starts a shift here, if they work here and aren't on one. `busy`: the
// place has something else going on (an order). Returns whether it
// started.
export function startShift(game, busy = false) {
  if (!workplaceHere(game) || isOnShift(game) || busy) return false;
  game.work.shift = { place: game.place, ms: 0 };
  return true;
}

// Stops the shift; an unfinished one pays nothing. Returns whether there
// was one.
export function stopShift(game) {
  const was = isOnShift(game);
  game.work.shift = null;
  return was;
}

// Call on the life tick with the real ms passed: the shift goes on once
// they're behind the counter, and pays when done. One away from its place
// (or no longer the job's) stops. Returns bubbles to show.
export function updateShift(game, realMs) {
  const { shift } = game.work;
  if (!shift) return [];
  if (shift.place !== game.place || !workplaceHere(game)) {
    stopShift(game);
    return [];
  }
  if (!hasArrived(game)) return [];
  shift.ms += realMs;
  if (shift.ms < SHIFT_MS) return [];
  game.work.shift = null;
  game.work.shifts += 1;
  const { heading, text } = SHIFT_TEXT.done;
  return [{ heading, text, deltas: changeStats(game.character, { money: shiftPay(game) }), celebrate: false }];
}

// The shift as a workplace's menu shows it: { job (title), pay, ms (into
// the one under way, or null), totalMs }, or null if they don't work
// here.
export function shiftView(game) {
  if (!workplaceHere(game)) return null;
  return { job: careerView(game).title, pay: shiftPay(game), ms: game.work.shift?.ms ?? null, totalMs: SHIFT_MS };
}
