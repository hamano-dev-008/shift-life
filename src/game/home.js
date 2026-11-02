// home.js — Resting: lying on the sofa, in the sleeping bag or in the
// tent to slowly restore health over real time (passed in by the
// renderer, so game speed doesn't change it and it pauses while the app
// is closed). How fast depends on where (restMinutes() in
// game/housing.js). Nothing counts until the character is lying on it
// (game/stay.js). Numbers and text live in data/home.js.

import { REST_HEALTH, REST_HEALTH_MAX } from '../data/home.js';
import { changeStats } from './character.js';
import { restMinutes } from './housing.js';
import { hasArrived } from './stay.js';

const MINUTE_MS = 60 * 1000;
// A saved rest time is never trusted past this (it's well over any rate).
const MAX_SAVED_REST_MS = 60 * MINUTE_MS;

// Real ms per health gain where the character rests now.
function restPeriodMs(game) {
  return restMinutes(game) * MINUTE_MS;
}

// resting: lying down right now. restMs: real time rested towards the
// next health gain. (Saved as `home`, its name from when only the sofa
// existed.)
export function createHomeState() {
  return { resting: false, restMs: 0 };
}

// Rebuilds the rest state from save data, with defaults for anything
// missing or unusable (such as saves from before resting existed).
export function restoreHomeState(data) {
  const state = createHomeState();
  state.resting = data?.resting === true;
  if (Number.isFinite(data?.restMs) && data.restMs >= 0) state.restMs = Math.min(data.restMs, MAX_SAVED_REST_MS);
  return state;
}

export function isResting(game) {
  return game.home.resting;
}

// Lies down. Returns whether resting started.
export function startResting(game) {
  if (game.home.resting) return false;
  game.home.resting = true;
  game.home.restMs = 0;
  return true;
}

// Gets up; time towards the next gain is lost. Returns whether they were
// resting.
export function stopResting(game) {
  if (!game.home.resting) return false;
  game.home.resting = false;
  game.home.restMs = 0;
  return true;
}

// One gain of health, never above REST_HEALTH_MAX. Returns the change.
function restoreHealth(game) {
  const room = Math.max(0, REST_HEALTH_MAX - game.character.stats.health);
  const amount = Math.min(REST_HEALTH, room);
  return amount ? changeStats(game.character, { health: amount }).health ?? 0 : 0;
}

// Call regularly with the real time passed since the last call, in ms
// (capped by the caller, so a sleeping PC doesn't count). Returns the
// health gained. Nothing counts on the way to the rest spot.
export function updateHome(game, realMs) {
  if (!game.home.resting || !hasArrived(game)) return 0;
  return rest(game, realMs);
}

// Rests `realMs` more. Returns the health gained.
function rest(game, realMs) {
  const home = game.home;
  const period = restPeriodMs(game);
  home.restMs += realMs;
  let gained = 0;
  while (home.restMs >= period) {
    home.restMs -= period;
    gained += restoreHealth(game);
  }
  return gained;
}

// Rests one more real minute right away (dev menu). Returns whether they
// were resting.
export function restOneMinute(game) {
  if (!game.home.resting) return false;
  rest(game, MINUTE_MS);
  return true;
}

// Everything the rest menu shows about resting. Times are in ms.
export function restView(game) {
  return {
    resting: game.home.resting,
    restMs: game.home.restMs,
    restTotalMs: restPeriodMs(game),
    amount: REST_HEALTH,
    minutes: restMinutes(game),
    health: game.character.stats.health,
    max: REST_HEALTH_MAX,
  };
}
