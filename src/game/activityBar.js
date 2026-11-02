// activityBar.js — The activity bar at the bottom of the window: what's
// running now (an activity such as fishing, busking under the Fortune
// Tree, or resting), its line of text (for fishing, the bucket's count
// and value), and stopping it the same way its own menu does (fishing
// sells the bucket). While the character is still walking to the spot
// (game/stay.js) it says so ("Walking to the tree...") and Stop calls it
// off. Text lives in data/activities.js, data/fortuneTree.js and
// data/home.js.

import { ACTIVITY_BAR_TEXT } from '../data/activities.js';
import { FARM_TEXT } from '../data/farm.js';
import { TREE_TEXT } from '../data/fortuneTree.js';
import { REST_TEXT, REST_SPOT_NAMES } from '../data/home.js';
import { currentActivity, stopActivity } from './activities.js';
import { bucketTotals } from './fishing.js';
import { isPlaying, stopPlaying, treeView } from './fortuneTree.js';
import { isResting, stopResting, restView } from './home.js';
import { currentFarmJob, stopFarmJob } from './farm.js';
import { restSpotOf } from './places.js';
import { isOnTheWay } from './stay.js';

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// "3:07" from real ms.
function clockTime(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// What the bar shows now: { kind ('activity', 'farm', 'busking' or 'resting'),
// text, stop (the button's label), onTheWay (still walking to the spot) },
// or null when nothing is running (or the life has ended).
export function activityBarView(game) {
  if (game.endOfLife.ended) return null;
  const view = runningView(game);
  if (!view || !isOnTheWay(game)) return view;
  return { ...view, text: onTheWayText(game, view.kind), onTheWay: true };
}

// The bar's text while walking to the spot of what's running (`kind`).
function onTheWayText(game, kind) {
  if (kind === 'busking') return TREE_TEXT.onTheWay;
  if (kind === 'farm') return FARM_TEXT.onTheWay;
  if (kind === 'resting') {
    const seat = REST_SPOT_NAMES[restSpotOf(game)] ?? REST_SPOT_NAMES['home.sofa'];
    return fill(REST_TEXT.onTheWay, { seat });
  }
  const activity = currentActivity(game);
  return activity.text.onTheWay ?? activity.name;
}

// The bar for what's running, as once at the spot.
function runningView(game) {
  const { stop } = ACTIVITY_BAR_TEXT;
  const activity = currentActivity(game);
  if (activity) {
    const fishing = game.activities.current.fishing;
    const values = fishing ? bucketTotals(fishing) : {};
    return { kind: 'activity', text: fill(activity.text.bar ?? activity.name, values), stop, onTheWay: false };
  }
  const job = currentFarmJob(game);
  if (job) return { kind: 'farm', text: FARM_TEXT.bar[job.action], stop, onTheWay: false };
  if (isPlaying(game)) {
    const tree = treeView(game);
    return {
      kind: 'busking',
      text: fill(TREE_TEXT.bar, { time: clockTime(tree.sessionMs), total: clockTime(tree.sessionTotalMs) }),
      stop,
      onTheWay: false,
    };
  }
  if (isResting(game)) {
    const rest = restView(game);
    return { kind: 'resting', text: fill(REST_TEXT.bar, { health: rest.health, max: rest.max }), stop, onTheWay: false };
  }
  return null;
}

// Stops whatever is running, as its own Stop does (on the way, it's just
// called off: nothing paid or sold). Returns { stopped, news (the bubble
// to show: fishing's sale, or null) }.
export function stopFromBar(game) {
  if (currentActivity(game)) return { stopped: true, news: stopActivity(game) };
  if (stopFarmJob(game)) return { stopped: true, news: null };
  if (stopPlaying(game)) return { stopped: true, news: null };
  if (stopResting(game)) return { stopped: true, news: null };
  return { stopped: false, news: null };
}
