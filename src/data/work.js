// work.js — Workplaces in town and their paid shifts: which job works
// where, where the worker stands behind the counter, how long a shift is
// and what it pays, and its text. Pure data: game/shifts.js runs it.

import { CAFE_PLACE, CAFE_JOB, CAFE_COUNTER, CAFE_ART, CAFE_FEET_FROM_BOTTOM } from './cafe.js';
import {
  STORE_PLACE, STORE_JOB, STORE_COUNTER, STORE_ART, STORE_FEET_FROM_BOTTOM,
} from './store.js';

// Each workplace: the place, the job (data/jobs.js) that works there at
// any level, and the spot behind its counter where the worker stands: x
// in the place's picture, `lift` (rows up from the place's feet row to
// the floor behind the counter) and the way they face, holding something
// in front of them (pose activity 'hold').
export const WORKPLACES = [
  {
    place: CAFE_PLACE,
    job: CAFE_JOB,
    spot: { x: CAFE_COUNTER.flap, lift: CAFE_ART.height - CAFE_FEET_FROM_BOTTOM - CAFE_COUNTER.behindRow, facing: -1 },
  },
  {
    place: STORE_PLACE,
    job: STORE_JOB,
    spot: { x: STORE_COUNTER.flap, lift: STORE_ART.height - STORE_FEET_FROM_BOTTOM - STORE_COUNTER.behindRow, facing: -1 },
  },
];

// A shift: `minutes` of real time (only once behind the counter; game
// speed doesn't change it, and it waits while the app is closed), paying
// `rate` of the job's hourly pay for that time when done (an adult year
// is 4 real hours, data/lifeStages.js), so yearly pay / 16: a Barista $6,
// a Shop Clerk $7, a Store Manager $13. Extra income below a career's (AGENTS.md: about
// $12-26 an hour on top). Stopping early pays nothing.
export const SHIFT = { minutes: 30, rate: 0.5 };

// The workplace menus' shift lines, the bar and the bubble. {pay} is
// dollars, {time} "3:07", {total} "30:00", {job} a job title.
export const SHIFT_TEXT = {
  start: 'Work a shift - ${pay}',
  stop: 'Stop the shift',
  working: 'Shift: {time} of {total}',
  staff: 'You work here: {job}',
  toCounter: 'Going behind the counter...',
  bar: 'Shift - {time} of {total}',
  done: { heading: 'Shift done!', text: 'Thanks for the help today.' },
};
