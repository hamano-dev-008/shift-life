// post.js — Pedal Post's counter: sending a postcard (once an hour) or a
// gift parcel (once a day). Paid at once; the character hands it over at
// the counter while the dispatcher stamps it, and it only counts once
// they're there (game/stay.js). Timers run on real time passed in by the
// renderer, so game speed doesn't change them and they pause while the
// app is closed. Delivery runs (its shifts) are game/shifts.js. Numbers
// and text in data/post.js.

import { POST_PLACE, POST_MIN_AGE, POST_ITEMS, SEND_SECONDS, POST_NEWS } from '../data/post.js';
import { ageOf, changeStats } from './character.js';
import { hasArrived } from './stay.js';
import { isOnShift } from './shifts.js';
import {
  isAmount, createWaits, restoreWaits, startWait, tickWaits, itemsView,
} from './counter.js';

// waitMs: real ms until each item can be sent again. sending: { item, ms
// (real time at the counter) } or null.
export function createPostState() {
  return { waitMs: createWaits(POST_ITEMS), sending: null };
}

// Rebuilds the post state from save data, dropping anything unusable.
export function restorePostState(data) {
  const state = createPostState();
  state.waitMs = restoreWaits(data?.waitMs, POST_ITEMS);
  const sending = data?.sending;
  if (POST_ITEMS[sending?.item] && isAmount(sending.ms)) state.sending = { item: sending.item, ms: sending.ms };
  return state;
}

export const isSending = (game) => Boolean(game.post.sending);

// Why `item` can't be sent now ('tooYoung', 'busy', 'wait' or 'money'),
// or null if it can.
export function sendBlock(game, item) {
  if (ageOf(game.character, game.clock.years) < POST_MIN_AGE) return 'tooYoung';
  if (isSending(game) || isOnShift(game)) return 'busy';
  if (game.post.waitMs[item] > 0) return 'wait';
  if (game.character.stats.money < POST_ITEMS[item].price) return 'money';
  return null;
}

// Sends `item` (at Pedal Post): pays and sets off for the counter.
// Returns whether it was sent.
export function sendItem(game, item) {
  if (game.place !== POST_PLACE || !POST_ITEMS[item] || sendBlock(game, item)) return false;
  changeStats(game.character, { money: -POST_ITEMS[item].price });
  startWait(game.post.waitMs, POST_ITEMS, item);
  game.post.sending = { item, ms: 0 };
  return true;
}

// Stops sending: not handed over yet, so it's refunded (and can be sent
// again at once). Returns whether there was one.
export function stopSending(game) {
  const { sending } = game.post;
  if (!sending) return false;
  changeStats(game.character, { money: POST_ITEMS[sending.item].price });
  game.post.waitMs[sending.item] = 0;
  game.post.sending = null;
  return true;
}

// Call on the life tick with the real ms passed. The waits run down; once
// at the counter it's handed over, and after SEND_SECONDS it's sent ("Sent!"
// and its effects). Returns bubbles to show.
export function updatePost(game, realMs) {
  const { post } = game;
  tickWaits(post.waitMs, realMs);
  if (game.place !== POST_PLACE) {
    stopSending(game);
    return [];
  }
  const { sending } = post;
  if (!sending || !hasArrived(game)) return [];
  sending.ms += realMs;
  if (sending.ms < SEND_SECONDS * 1000) return [];
  post.sending = null;
  const { thing, effects } = POST_ITEMS[sending.item];
  const { heading, text } = POST_NEWS.sent;
  return [{ heading, text: text.replaceAll('{item}', thing), deltas: changeStats(game.character, effects), celebrate: false }];
}

// Everything the counter's menu shows about sending: { minAge, tooYoung,
// items: [{ id, name, price, block, waitMs, need }], sending (with its
// item's `thing`) }.
export function postView(game) {
  const { post } = game;
  return {
    minAge: POST_MIN_AGE,
    tooYoung: ageOf(game.character, game.clock.years) < POST_MIN_AGE,
    items: itemsView(game, POST_ITEMS, post.waitMs, (id) => sendBlock(game, id)),
    sending: post.sending ? { ...post.sending, thing: POST_ITEMS[post.sending.item].thing } : null,
  };
}
