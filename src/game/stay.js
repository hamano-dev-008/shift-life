// stay.js — The "on the way" stage shared by everything the character
// stays put to do: busking under the Fortune Tree, picking its apple,
// resting, and place activities (fishing, and any added in
// data/activities.js). Once one is
// chosen they walk to its spot; it only starts counting when they've
// arrived: its real-time timers, rewards and bites, and the event freeze.
// Arrival is visual: the animator settles into the pose, the renderer
// reports it here each frame. It's kept in game.stay, which isn't saved,
// so after loading they walk to the spot again and it resumes there.
// Reads the other modules' state directly (no imports), so they can all
// use it.

import { PLACE_ACTIVITIES } from '../data/activities.js';

// What's running that needs its spot: 'activity:<id>', 'farm:<paddy>'
// (a job at a rice paddy), 'picking' (the golden apple), 'busking',
// 'resting', or null. An activity comes first, as in the activity bar.
export function stayKey(game) {
  const activity = game.activities?.current;
  if (activity) return `activity:${activity.id}`;
  if (game.farm?.job) return `farm:${game.farm.job.paddy}`;
  if (game.fortuneTree?.picking) return 'picking';
  if (game.fortuneTree?.playing) return 'busking';
  if (game.home?.resting) return 'resting';
  return null;
}

// Whether the character has reached the spot of what's running now (false
// on the way, or with nothing running).
export function hasArrived(game) {
  const key = stayKey(game);
  return key !== null && game.stay?.arrived === key;
}

// Whether something is running and they're still walking to its spot.
export function isOnTheWay(game) {
  return stayKey(game) !== null && !hasArrived(game);
}

// The renderer's report from the animator: `arrived` is whether the
// character is settled at the spot of what's running (call it every frame;
// false clears it, e.g. after it stops). Returns whether they've just
// arrived.
export function reportArrival(game, arrived) {
  const key = arrived ? stayKey(game) : null;
  const was = game.stay?.arrived ?? null;
  game.stay = { arrived: key };
  return key !== null && key !== was;
}

// Marks the character as at the spot of what's running now (tests, and
// the renderer through reportArrival()).
export function arriveAtStay(game) {
  return reportArrival(game, true);
}

// Whether new events wait now: busking, resting, or an activity with
// `freezeEvents`, but only once they've arrived. Before that events come
// as normal. Picking the apple (a few seconds, like a farm job) doesn't.
export function stayFreezesEvents(game) {
  if (!hasArrived(game) || stayKey(game) === 'picking') return false;
  const activity = game.activities?.current;
  if (activity) return Boolean(PLACE_ACTIVITIES[activity.id]?.freezeEvents);
  return true;
}
