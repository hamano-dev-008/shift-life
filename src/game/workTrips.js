// workTrips.js — When the character may walk off "to work": a real-time
// cooldown (at most one trip every WORK_TRIP_EVERY_MINUTES real minutes),
// a quiet spell after any player click, and nothing while something is
// showing or the "Work trips" setting is off. Unsaved: it starts afresh
// each launch, like the poke rules. Times are real monotonic milliseconds
// (performance.now() in the renderer); tests pass their own.

import { WORK_TRIP_EVERY_MINUTES, WORK_QUIET_SECONDS } from '../data/animation.js';

const MINUTE_MS = 60000;

function waitMs(random) {
  const [min, max] = WORK_TRIP_EVERY_MINUTES;
  return (min + random() * (max - min)) * MINUTE_MS;
}

// The first trip can come WORK_TRIP_EVERY_MINUTES after `now` at the
// earliest.
export function createWorkTrips(now, random = Math.random) {
  return { nextAt: now + waitMs(random), lastClickAt: -Infinity };
}

// The player clicked somewhere on the game.
export function noteClick(trips, now) {
  trips.lastClickAt = now;
}

// Whether a trip may start now. `enabled` is the "Work trips" setting,
// `employed` whether they have a job, `busy` whether a menu, card, bubble,
// catch reveal or the activity bar is showing (or anything else keeps
// them home).
export function mayGoToWork(trips, now, { enabled = true, employed = false, busy = false } = {}) {
  if (!enabled || !employed || busy) return false;
  if (now < trips.nextAt) return false;
  return now - trips.lastClickAt >= WORK_QUIET_SECONDS * 1000;
}

// A trip just started: the next one waits a fresh random spell.
export function workTripStarted(trips, now, random = Math.random) {
  trips.nextAt = now + waitMs(random);
}
