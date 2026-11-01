// places.js — Which place the character is at (game.place, a place id),
// how places connect, the route between two of them, and moving from one
// to the next (which ends busking or resting, since those belong to a
// place). All place content lives in data/places.js.

import { PLACES, DEFAULT_PLACE } from '../data/places.js';
import { FORTUNE_TREE_PLACE } from '../data/fortuneTree.js';
import { HOME_PLACE } from '../data/home.js';
import { stopPlaying } from './fortuneTree.js';
import { stopResting } from './home.js';

export function placeById(id) {
  return PLACES.find((place) => place.id === id) ?? null;
}

// A saved place id, or DEFAULT_PLACE if it's missing or no longer exists.
export function restorePlace(id) {
  return placeById(id) ? id : DEFAULT_PLACE;
}

// The current place's data: { id, name, scenery, exits, targets }.
export function currentPlace(game) {
  return placeById(game.place) ?? placeById(DEFAULT_PLACE);
}

// The exit from place `from` that leads straight to place `to`
// ({ to, via }), or null if they don't connect. Coming the other way,
// it's also where someone arriving in `from` from `to` comes in.
export function exitBetween(from, to) {
  return placeById(from)?.exits.find((exit) => exit.to === to) ?? null;
}

// The places passed through going from `from` to `to`, in order, ending
// with `to` (fewest steps first), or null if there's no way there.
export function routeBetween(from, to) {
  const cameFrom = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const id = queue.shift();
    if (id === to) break;
    for (const exit of placeById(id)?.exits ?? []) {
      if (cameFrom.has(exit.to) || !placeById(exit.to)) continue;
      cameFrom.set(exit.to, id);
      queue.push(exit.to);
    }
  }
  if (from === to || !cameFrom.has(to)) return null;
  const route = [];
  for (let id = to; id !== from; id = cameFrom.get(id)) route.unshift(id);
  return route;
}

// Ends whatever the character was doing that belongs to a place (busking,
// resting). Returns whether anything ended.
export function leavePlace(game) {
  const stoppedPlaying = stopPlaying(game);
  const stoppedResting = stopResting(game);
  return stoppedPlaying || stoppedResting;
}

// Ends busking or resting if the character isn't where they happen (a
// save from elsewhere).
export function settlePlace(game) {
  if (game.place !== FORTUNE_TREE_PLACE) stopPlaying(game);
  if (game.place !== HOME_PLACE) stopResting(game);
}

// Moves the character to place `id` (one step of a trip, or the dev
// menu's Go to).
export function enterPlace(game, id) {
  if (!placeById(id)) return;
  game.place = id;
  settlePlace(game);
}
