// fortuneTree.js — The Fortune Tree: busking under it for tips (a payout
// every full session of real playing time) and the golden apple that
// grows on it every few real hours, with a pick chance that builds with
// sessions played. Timers run on real time passed in by the renderer, so
// game speed doesn't change them and they pause while the app is closed.
// A session only counts once the character is sitting under the tree
// (game/stay.js). All numbers and text live in data/fortuneTree.js.

import {
  TREE_MIN_AGE, SESSION_MINUTES, SESSION_PAY, APPLE_EVERY_HOURS, PICK_CHANCE, APPLE_REWARD,
  TREE_TEXT,
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
// whole life (for the life summary).
export function createTreeState() {
  return {
    playing: false, sessionMs: 0, sessions: 0, appleReady: false, appleInMs: APPLE_MS,
    sessionsPlayed: 0, applesWon: 0,
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

// Starts busking (not in a thunderstorm). Returns whether it started.
export function startPlaying(game) {
  const tree = game.fortuneTree;
  if (tree.playing || !treeUnlocked(game) || isStormy(game)) return false;
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

// Tries to pick the apple. Success pays APPLE_REWARD and resets the
// sessions counted; failure just loses the apple. Either way the next one
// starts growing. Returns the bubble to show ({ heading, text, deltas,
// celebrate }), or null if there's no apple or the character is too young.
export function pickApple(game) {
  const tree = game.fortuneTree;
  if (!tree.appleReady || !treeUnlocked(game)) return null;
  const won = Math.random() < pickChance(game);
  tree.appleReady = false;
  tree.appleInMs = APPLE_MS;
  if (!won) return { text: TREE_TEXT.appleLost.text, deltas: {}, celebrate: false };
  tree.sessions = 0;
  tree.applesWon += 1;
  const deltas = changeStats(game.character, { money: APPLE_REWARD });
  const { heading, text } = TREE_TEXT.appleWon;
  return { heading, text: fill(text, { name: game.character.name }), deltas, celebrate: true };
}

// Call regularly with the real time passed since the last call, in ms
// (capped by the caller, so a sleeping PC doesn't count). Advances the
// session while playing under the tree (not on the way there) and the
// apple while none is ready. Returns bubbles to show, as [{ heading,
// text, deltas, celebrate }].
export function updateFortuneTree(game, realMs) {
  const tree = game.fortuneTree;
  const bubbles = [];
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
    chance: pickChance(game),
  };
}
