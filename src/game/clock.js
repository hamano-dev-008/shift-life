// clock.js — Real-time simulation clock. Tracks in-game time in years and
// advances it by real elapsed time while the app is running: at normal
// speed as fast as the life stage says (realMinutesPerYear in
// data/lifeStages.js), at the dev speeds (SPEEDS in data/balance.js) at
// their fixed rate. A stopped clock (the life has ended) stands still.

import { SPEEDS } from '../data/balance.js';

const TICK_MS = 250;

// A gap longer than this between ticks means the PC slept or the app
// stalled; only this much of it is counted.
const MAX_TICK_MS = 2000;

// stopped: true once the life has ended (not saved; it follows the end
// of life state).
export function createClock(years = 0) {
  return { years, speed: 'normal', stopped: false };
}

// minutesPerYear: real minutes per year at normal speed right now.
export function advanceClock(clock, realMs, minutesPerYear) {
  if (clock.stopped) return;
  const secondsPerYear = SPEEDS[clock.speed]?.secondsPerYear ?? minutesPerYear * 60;
  clock.years += realMs / (secondsPerYear * 1000);
}

// Starts advancing the clock in the background. Uses a timer rather than
// animation frames so time keeps passing while the window is minimized.
// minutesPerYear() gives the normal-speed rate for the current age.
export function startClock(clock, minutesPerYear) {
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    advanceClock(clock, Math.min(now - last, MAX_TICK_MS), minutesPerYear());
    last = now;
  }, TICK_MS);
}
