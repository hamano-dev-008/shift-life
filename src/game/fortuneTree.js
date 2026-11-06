// fortuneTree.js — The Fortune Tree: busking under it for tips (a payout
// every full session of real playing time) and the golden apple that
// grows on it every few real hours, with a pick chance that builds with
// sessions played, picked by poking it down with a branch. Timers run on
// real time passed in by the renderer, so game speed doesn't change them
// and they pause while the app is closed. A session, or the picking, only
// counts once the character is at the spot (game/stay.js). All numbers
// and text live in data/fortuneTree.js.

import {
  TREE_MIN_AGE, SESSION_MINUTES, SESSION_PAY, APPLE_EVERY_HOURS, PICK_CHANCE, APPLE_REWARD,
  TREE_TEXT, PICK,
} from '../data/fortuneTree.js';
import { ageOf, changeStats } from './character.js';
import { hasArrived } from './stay.js';
import { buskingPay, isStormy } from './weather.js';

const SESSION_MS = SESSION_MINUTES * 60 * 1000;
const APPLE_MS = APPLE_EVERY_HOURS * 60 * 60 * 1000;

// playing: busking right now. sessionMs: real time played in the current
// session. sessions: full sessions since the last successful apple pick
// (each adds to the pick chance). appleReady: an apple hangs on the tree.
// appleInMs: real time until the next apple, while none is ready.
// sessionsPlayed and applesWon: full sessions and golden apples over the
// whole life (for the life summary). picking: the apple being picked, or
// null (not saved: after a load the apple just hangs there again, unless
// it already fell), as { step ('pickUp', 'poke', 'fall', then 'hold' or
// 'fairies'), ms (real time into the step), won (once decided), news (the
// result's bubble, once decided and until shown) }.
export function createTreeState() {
  return {
    playing: false, sessionMs: 0, sessions: 0, appleReady: false, appleInMs: APPLE_MS,
    sessionsPlayed: 0, applesWon: 0, picking: null,
  };
}

const isAmount = (value) => Number.isFinite(value) && value >= 0;

// Rebuilds the tree state from save data, with defaults for anything
// missing or unusable (such as saves from before the tree existed).
export function restoreTreeState(data) {
  const state = createTreeState();
  state.playing = data?.playing === true;
  if (isAmount(data?.sessionMs)) state.sessionMs = Math.min(data.sessionMs, SESSION_MS);
  if (Number.isInteger(data?.sessions) && data.sessions >= 0) state.sessions = data.sessions;
  state.appleReady = data?.appleReady === true;
  if (isAmount(data?.appleInMs)) state.appleInMs = Math.min(data.appleInMs, APPLE_MS);
  for (const id of ['sessionsPlayed', 'applesWon']) {
    if (Number.isInteger(data?.[id]) && data[id] >= 0) state[id] = data[id];
  }
  return state;
}

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

export function treeUnlocked(game) {
  return ageOf(game.character, game.clock.years) >= TREE_MIN_AGE;
}

export function isPlaying(game) {
  return game.fortuneTree.playing;
}

// Starts busking (not in a thunderstorm, nor while picking the apple).
// Returns whether it started.
export function startPlaying(game) {
  const tree = game.fortuneTree;
  if (tree.playing || tree.picking || !treeUnlocked(game) || isStormy(game)) return false;
  tree.playing = true;
  tree.sessionMs = 0;
  return true;
}

// Stops busking; the unfinished session pays nothing. Returns whether it
// was playing.
export function stopPlaying(game) {
  const tree = game.fortuneTree;
  if (!tree.playing) return false;
  tree.playing = false;
  tree.sessionMs = 0;
  return true;
}

// Pays for a full session and counts it. Returns the bubble to show.
function completeSession(game) {
  const tree = game.fortuneTree;
  tree.sessions += 1;
  tree.sessionsPlayed += 1;
  const deltas = changeStats(game.character, { money: buskingPay(game, SESSION_PAY) });
  const { heading, text } = TREE_TEXT.sessionPaid;
  return { heading, text: fill(text, { name: game.character.name }), deltas, celebrate: false };
}

// Finishes the current session right away (dev menu). Returns the bubble,
// or null if not playing.
export function finishSession(game) {
  const tree = game.fortuneTree;
  if (!tree.playing) return null;
  tree.sessionMs = 0;
  return completeSession(game);
}

// Grows the apple now (dev menu).
export function makeAppleReady(game) {
  game.fortuneTree.appleReady = true;
  game.fortuneTree.appleInMs = 0;
}

// Chance (0-1) that picking the apple works right now.
export function pickChance(game) {
  const { base, perSession, max } = PICK_CHANCE;
  return Math.min(max, base + perSession * game.fortuneTree.sessions);
}

// The apple comes down: the pick is decided now. Success pays
// APPLE_REWARD and resets the sessions counted; failure just loses the
// apple. Either way the next one starts growing. Returns { won, news
// (the bubble to show: { heading, text, deltas, celebrate }) }.
function rollPick(game, random) {
  const tree = game.fortuneTree;
  const won = random() < pickChance(game);
  tree.appleReady = false;
  tree.appleInMs = APPLE_MS;
  if (!won) return { won, news: { text: TREE_TEXT.appleLost.text, deltas: {}, celebrate: false } };
  tree.sessions = 0;
  tree.applesWon += 1;
  const deltas = changeStats(game.character, { money: APPLE_REWARD });
  const { heading, text } = TREE_TEXT.appleWon;
  return { won, news: { heading, text: fill(text, { name: game.character.name }), deltas, celebrate: true } };
}

export function isPicking(game) {
  return Boolean(game.fortuneTree.picking);
}

// Sets off to pick the apple (stopping busking): walking under it, then
// the branch and the poking (updatePicking()). Returns whether it
// started: there must be an apple, the character old enough, and no pick
// already under way.
export function startPicking(game) {
  const tree = game.fortuneTree;
  if (!tree.appleReady || !treeUnlocked(game) || tree.picking) return false;
  stopPlaying(game);
  tree.picking = { step: 'pickUp', ms: 0, won: null, news: null };
  return true;
}

// Stops picking. Before the apple falls nothing happens (it still hangs
// there); once it has fallen the result stands. Returns the result's
// bubble if it hasn't been shown yet, else null.
export function stopPicking(game) {
  const tree = game.fortuneTree;
  const news = tree.picking?.news ?? null;
  tree.picking = null;
  return news;
}

// How long each step of the picking lasts, in real ms.
const stepMs = (step) => PICK[step] * 1000;

// The picking moves on by `realMs` once the character is under the apple:
// the branch, the poking, then the apple falls (decided now). A lost one
// bursts into fairies as it lands, and its bubble comes then (returned);
// a won one is held up high a while first, its bubble after, so the
// bubble doesn't cover it.
function updatePicking(game, realMs, random) {
  const tree = game.fortuneTree;
  const { picking } = tree;
  // The apple went before it fell (a new life, the dev menu).
  if (picking.won === null && !tree.appleReady) {
    tree.picking = null;
    return [];
  }
  if (!hasArrived(game)) return [];
  const bubbles = [];
  picking.ms += realMs;
  while (tree.picking && picking.ms >= stepMs(picking.step)) {
    picking.ms -= stepMs(picking.step);
    if (picking.step === 'pickUp') {
      picking.step = 'poke';
    } else if (picking.step === 'poke') {
      const { won, news } = rollPick(game, random);
      picking.step = 'fall';
      picking.won = won;
      picking.news = news;
    } else if (picking.step === 'fall') {
      picking.step = picking.won ? 'hold' : 'fairies';
      if (!picking.won) {
        bubbles.push(picking.news);
        picking.news = null;
      }
    } else {
      if (picking.news) bubbles.push(picking.news);
      tree.picking = null;
    }
  }
  return bubbles;
}

// Call regularly with the real time passed since the last call, in ms
// (capped by the caller, so a sleeping PC doesn't count). Advances the
// session while playing under the tree (not on the way there), the
// picking, and the apple while none is ready. Returns bubbles to show, as
// [{ heading, text, deltas, celebrate }].
export function updateFortuneTree(game, realMs, random = Math.random) {
  const tree = game.fortuneTree;
  const bubbles = tree.picking ? updatePicking(game, realMs, random) : [];
  if (tree.playing && hasArrived(game)) {
    tree.sessionMs += realMs;
    while (tree.sessionMs >= SESSION_MS) {
      tree.sessionMs -= SESSION_MS;
      bubbles.push(completeSession(game));
    }
  }
  if (!tree.appleReady) {
    tree.appleInMs -= realMs;
    if (tree.appleInMs <= 0) makeAppleReady(game);
  }
  return bubbles;
}

// Everything the tree menu shows. Times are in ms.
export function treeView(game) {
  const tree = game.fortuneTree;
  return {
    unlocked: treeUnlocked(game),
    minAge: TREE_MIN_AGE,
    playing: tree.playing,
    stormy: isStormy(game),
    sessionMs: tree.sessionMs,
    sessionTotalMs: SESSION_MS,
    sessionPay: buskingPay(game, SESSION_PAY),
    sessionMinutes: SESSION_MINUTES,
    sessions: tree.sessions,
    appleReady: tree.appleReady,
    appleInMs: tree.appleInMs,
    picking: Boolean(tree.picking),
    chance: pickChance(game),
  };
}
