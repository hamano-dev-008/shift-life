// home.js — Home's game logic: resting on the sofa, which slowly restores
// health over real time (passed in by the renderer, so game speed doesn't
// change it and it pauses while the app is closed). All numbers and text
// live in data/home.js.

import { REST_MINUTES, REST_HEALTH, REST_HEALTH_MAX } from '../data/home.js';
import { changeStats } from './character.js';

const REST_MS = REST_MINUTES * 60 * 1000;

// resting: lying on the sofa right now. restMs: real time rested towards
// the next health gain.
export function createHomeState() {
  return { resting: false, restMs: 0 };
}

// Rebuilds the home state from save data, with defaults for anything
// missing or unusable (such as saves from before Home existed).
export function restoreHomeState(data) {
  const state = createHomeState();
  state.resting = data?.resting === true;
  if (Number.isFinite(data?.restMs) && data.restMs >= 0) state.restMs = Math.min(data.restMs, REST_MS);
  return state;
}

export function isResting(game) {
  return game.home.resting;
}

// Lies down on the sofa. Returns whether resting started.
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

// Finishes the current rest period right away (dev menu). Returns whether
// they were resting.
export function finishRestPeriod(game) {
  if (!game.home.resting) return false;
  game.home.restMs = 0;
  restoreHealth(game);
  return true;
}

// Call regularly with the real time passed since the last call, in ms
// (capped by the caller, so a sleeping PC doesn't count). Returns the
// health gained.
export function updateHome(game, realMs) {
  const home = game.home;
  if (!home.resting) return 0;
  home.restMs += realMs;
  let gained = 0;
  while (home.restMs >= REST_MS) {
    home.restMs -= REST_MS;
    gained += restoreHealth(game);
  }
  return gained;
}

// Everything the sofa menu shows. Times are in ms.
export function sofaView(game) {
  return {
    resting: game.home.resting,
    restMs: game.home.restMs,
    restTotalMs: REST_MS,
    amount: REST_HEALTH,
    minutes: REST_MINUTES,
    health: game.character.stats.health,
    max: REST_HEALTH_MAX,
  };
}
