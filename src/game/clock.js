// clock.js — Real-time simulation clock. Tracks in-game time in years and
// advances it by real elapsed time while the app is running.

import { REAL_MINUTES_PER_YEAR, FAST_FORWARD_SECONDS_PER_YEAR } from '../data/balance.js';

const NORMAL_MS_PER_YEAR = REAL_MINUTES_PER_YEAR * 60 * 1000;
const FAST_MS_PER_YEAR = FAST_FORWARD_SECONDS_PER_YEAR * 1000;
const TICK_MS = 250;

// A gap longer than this between ticks means the PC slept or the app
// stalled; only this much of it is counted.
const MAX_TICK_MS = 2000;

export function createClock(years = 0) {
  return { years, fastForward: false };
}

export function advanceClock(clock, realMs) {
  clock.years += realMs / (clock.fastForward ? FAST_MS_PER_YEAR : NORMAL_MS_PER_YEAR);
}

// Starts advancing the clock in the background. Uses a timer rather than
// animation frames so time keeps passing while the window is minimized.
export function startClock(clock) {
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    advanceClock(clock, Math.min(now - last, MAX_TICK_MS));
    last = now;
  }, TICK_MS);
}
