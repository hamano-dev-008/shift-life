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
// (a job at a rice paddy), 'picking' (the golden apple), 'cafe:order'
// (at the Cafe's table), 'store:pay' and 'store:have' (at the 6-Eleven's
// register, then by its window), 'post:send' (at Pedal Post's counter),
// 'alley:class' and 'alley:print' (at Mural Alley's class easel or its
// stall), 'office:<item>' (at Paperleaf Co.'s vending machine or printer),
// 'ramen:<item>' (on Ramen Hinata's stool),
// 'shift:<place>' (behind a workplace's counter, or out of its door), 'busking', 'resting', or null. An activity comes first, as in the activity bar.
export function stayKey(game) {
  const activity = game.activities?.current;
  if (activity) return `activity:${activity.id}`;
  if (game.farm?.job) return `farm:${game.farm.job.paddy}`;
  if (game.fortuneTree?.picking) return 'picking';
  if (game.cafe?.order) return 'cafe:order';
  if (game.store?.purchase) return game.store.purchase.step === 'pay' ? 'store:pay' : 'store:have';
  if (game.post?.visit) return 'post:send';
  if (game.alley?.visit) return `alley:${game.alley.visit.item}`;
  if (game.office?.visit) return `office:${game.office.visit.item}`;
  if (game.ramen?.visit) return `ramen:${game.ramen.visit.item}`;
  if (game.work?.shift) return `shift:${game.work.shift.place}`;
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
// as normal. Picking the apple, a cafe order, a 6-Eleven snack, sending
// mail, the alley's class or print, an office break or a bowl of ramen
// (short, like a farm job) don't.
export function stayFreezesEvents(game) {
  const key = stayKey(game);
  if (!hasArrived(game) || key === 'picking' || key === 'cafe:order' || key.startsWith('store:')
    || key === 'post:send' || key.startsWith('alley:')
    || key.startsWith('office:') || key.startsWith('ramen:')) return false;
  const activity = game.activities?.current;
  if (activity) return Boolean(PLACE_ACTIVITIES[activity.id]?.freezeEvents);
  return true;
}
