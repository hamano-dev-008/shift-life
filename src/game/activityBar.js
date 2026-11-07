// activityBar.js — The activity bar at the bottom of the window: what's
// running now (an activity such as fishing, busking under the Fortune
// Tree or picking its apple, or resting), its line of text (for fishing, the bucket's count
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
import {
  isPlaying, stopPlaying, treeView, isPicking, stopPicking,
} from './fortuneTree.js';
import { isResting, stopResting, restView } from './home.js';
import { currentFarmJob, stopFarmJob } from './farm.js';
import { isOrdering, stopOrder, cafeView } from './cafe.js';
import { isOnShift, stopShift, shiftView } from './shifts.js';
import { isBuying, stopPurchase, storeView } from './store.js';
import { STORE_BAR_TEXT } from '../data/store.js';
import { isSending, stopSending, postView } from './post.js';
import { POST_BAR_TEXT } from '../data/post.js';
import { isAtStall, stopAtStall, alleyView } from './alley.js';
import { ALLEY_BAR_TEXT } from '../data/alley.js';
import { isOnBreak, stopBreak, officeView } from './office.js';
import { OFFICE_BAR_TEXT, OFFICE_ITEMS } from '../data/office.js';
import { CAFE_BAR_TEXT } from '../data/cafe.js';
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

// What the bar shows now: { kind ('activity', 'farm', 'picking', 'cafe',
// 'store', 'post', 'alley', 'office', 'shift', 'busking' or 'resting'),
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
  if (kind === 'picking') return TREE_TEXT.pickOnTheWay;
  if (kind === 'cafe') return CAFE_BAR_TEXT.toSeat;
  if (kind === 'shift') return shiftView(game).text.toCounter;
  if (kind === 'store') return game.store.purchase.step === 'pay' ? STORE_BAR_TEXT.toRegister : STORE_BAR_TEXT.toWindow;
  if (kind === 'post') return POST_BAR_TEXT.toCounter;
  if (kind === 'alley') return game.alley.visit.item === 'class' ? ALLEY_BAR_TEXT.toEasel : ALLEY_BAR_TEXT.toStall;
  if (kind === 'office') {
    return OFFICE_ITEMS[game.office.visit.item].at === 'vending' ? OFFICE_BAR_TEXT.toVending : OFFICE_BAR_TEXT.toPrinter;
  }
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
  if (isPicking(game)) return { kind: 'picking', text: TREE_TEXT.pickBar, stop, onTheWay: false };
  if (isOrdering(game)) {
    const { order } = cafeView(game);
    const text = order.step === 'serve' ? CAFE_BAR_TEXT.waiting : CAFE_BAR_TEXT.enjoying;
    return { kind: 'cafe', text: fill(text, { item: order.name.toLowerCase() }), stop, onTheWay: false };
  }
  if (isBuying(game)) {
    const { purchase } = storeView(game);
    const text = purchase.step === 'pay' ? STORE_BAR_TEXT.paying
      : purchase.step === 'scratch' ? STORE_BAR_TEXT.scratching : STORE_BAR_TEXT.enjoying;
    return { kind: 'store', text: fill(text, { item: purchase.name.toLowerCase() }), stop, onTheWay: false };
  }
  if (isSending(game)) {
    return { kind: 'post', text: fill(POST_BAR_TEXT.sending, { item: postView(game).visit.thing }), stop, onTheWay: false };
  }
  if (isAtStall(game)) {
    const { visit } = alleyView(game);
    const text = visit.item === 'class'
      ? fill(ALLEY_BAR_TEXT.class, { time: clockTime(visit.ms), total: clockTime(visit.totalMs) }) : ALLEY_BAR_TEXT.print;
    return { kind: 'alley', text, stop, onTheWay: false };
  }
  if (isOnBreak(game)) return { kind: 'office', text: OFFICE_BAR_TEXT[officeView(game).visit.item], stop, onTheWay: false };
  if (isOnShift(game)) {
    const shift = shiftView(game);
    return {
      kind: 'shift',
      text: fill(shift.text.bar, { time: clockTime(shift.ms), total: clockTime(shift.totalMs) }),
      stop,
      onTheWay: false,
    };
  }
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
// to show: fishing's sale, a fallen apple's result not shown yet, or
// null) }.
export function stopFromBar(game) {
  if (currentActivity(game)) return { stopped: true, news: stopActivity(game) };
  if (stopFarmJob(game)) return { stopped: true, news: null };
  if (isPicking(game)) return { stopped: true, news: stopPicking(game) };
  if (isOrdering(game)) return { stopped: stopOrder(game), news: null };
  if (isBuying(game)) return { stopped: stopPurchase(game), news: null };
  if (isSending(game)) return { stopped: stopSending(game), news: null };
  if (isAtStall(game)) return { stopped: stopAtStall(game), news: null };
  if (isOnBreak(game)) return { stopped: stopBreak(game), news: null };
  if (isOnShift(game)) return { stopped: stopShift(game), news: null };
  if (stopPlaying(game)) return { stopped: true, news: null };
  if (stopResting(game)) return { stopped: true, news: null };
  return { stopped: false, news: null };
}
