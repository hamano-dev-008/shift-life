// clock.js — Real-time simulation clock. Tracks in-game time in years and
// advances it by real elapsed time while the app is running, at the
// current speed (SPEEDS in data/balance.js).

import { SPEEDS } from '../data/balance.js';

const TICK_MS = 250;

// A gap longer than this between ticks means the PC slept or the app
// stalled; only this much of it is counted.
const MAX_TICK_MS = 2000;

export function createClock(years = 0) {
  return { years, speed: 'normal' };
}

export function advanceClock(clock, realMs) {
  const msPerYear = (SPEEDS[clock.speed] ?? SPEEDS.normal).secondsPerYear * 1000;
  clock.years += realMs / msPerYear;
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
