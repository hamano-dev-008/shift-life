// places.js — Which place the character is at (game.place, a place id),
// which places exist right now (with their parents, or in their own
// place; see game/housing.js), what each one shows (its housing prop),
// how they connect, the route between two of them, and moving from one to
// the next (which ends busking or resting, since those belong to a place).
// All place content lives in data/places.js.

import { PLACES, DEFAULT_PLACE } from '../data/places.js';
import { FORTUNE_TREE_PLACE } from '../data/fortuneTree.js';
import { REST_SEATS } from '../data/home.js';
import { stopPlaying } from './fortuneTree.js';
import { stopResting } from './home.js';
import { meetsRequirement, showsPiece, updateHousing } from './housing.js';

// The place's data as written, whether or not it exists right now.
export function placeById(id) {
  return PLACES.find((place) => place.id === id) ?? null;
}

// A saved place id, or DEFAULT_PLACE if it's missing or no longer exists.
export function restorePlace(id) {
  return placeById(id) ? id : DEFAULT_PLACE;
}

export function placeExists(game, id) {
  const place = placeById(id);
  return Boolean(place) && meetsRequirement(game, place.requires);
}

// Place `id` as it is right now: { id, name, scenery, exits, targets }
// with only the scenery that shows (the current housing prop), the exits
// to places that exist through props that show, and the targets that
// show. Null if the place doesn't exist now.
export function placeView(game, id) {
  if (!placeExists(game, id)) return null;
  const place = placeById(id);
  const scenery = place.scenery.filter((name) => showsPiece(game, name));
  const shows = (via) => via === 'left' || via === 'right' || scenery.includes(via);
  return {
    ...place,
    scenery,
    exits: place.exits.filter((exit) => placeExists(game, exit.to) && shows(exit.via)),
    targets: Object.fromEntries(Object.entries(place.targets ?? {}).filter(([prop]) => scenery.includes(prop))),
  };
}

// The current place, as it is right now (see placeView()).
export function currentPlace(game) {
  return placeView(game, game.place) ?? placeView(game, DEFAULT_PLACE);
}

// Every place that exists right now, in data order (for Go to).
export function existingPlaces(game) {
  return PLACES.filter((place) => placeExists(game, place.id)).map((place) => placeView(game, place.id));
}

// The exit from place `from` that leads straight to place `to`
// ({ to, via }), or null if they don't connect now. Coming the other way,
// it's also where someone arriving in `from` from `to` comes in.
export function exitBetween(game, from, to) {
  return placeView(game, from)?.exits.find((exit) => exit.to === to) ?? null;
}

// The places passed through going from `from` to `to`, in order, ending
// with `to` (fewest steps first), or null if there's no way there now.
export function routeBetween(game, from, to) {
  const cameFrom = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const id = queue.shift();
    if (id === to) break;
    for (const exit of placeView(game, id)?.exits ?? []) {
      if (cameFrom.has(exit.to)) continue;
      cameFrom.set(exit.to, id);
      queue.push(exit.to);
    }
  }
  if (from === to || !cameFrom.has(to)) return null;
  const route = [];
  for (let id = to; id !== from; id = cameFrom.get(id)) route.unshift(id);
  return route;
}

// The prop the character rests on in the current place (the first
// resting prop in REST_SEATS that shows there), or null.
export function restSpotOf(game) {
  return currentPlace(game).scenery.find((name) => name in REST_SEATS) ?? null;
}

// Ends whatever the character was doing that belongs to a place (busking,
// resting). Returns whether anything ended.
export function leavePlace(game) {
  const stoppedPlaying = stopPlaying(game);
  const stoppedResting = stopResting(game);
  return stoppedPlaying || stoppedResting;
}

// Makes sure the character is somewhere that exists, and doing only what
// that place allows. A place that's gone (the parents' house after moving
// out, Home without the house) sends them to its `gone` place, ending
// busking or resting; busking needs the Fortune Tree and resting needs a
// resting prop. Returns whether the place changed.
export function settlePlace(game) {
  let moved = false;
  for (let tries = 0; !placeExists(game, game.place) && tries < PLACES.length; tries++) {
    game.place = placeById(game.place)?.gone ?? DEFAULT_PLACE;
    moved = true;
  }
  if (!placeExists(game, game.place)) game.place = DEFAULT_PLACE;
  if (moved) leavePlace(game);
  if (game.place !== FORTUNE_TREE_PLACE) stopPlaying(game);
  if (!restSpotOf(game)) stopResting(game);
  return moved;
}

// Moves the character to place `id` (one step of a trip, or the dev
// menu's Go to).
export function enterPlace(game, id) {
  if (!placeExists(game, id)) return;
  game.place = id;
  settlePlace(game);
}

// Call regularly: moves the character out at MOVE_OUT_AGE (taking them
// out of the parents' house if they're in it). Returns the "Moving out!"
// bubble when it happens, or null.
export function updatePlaces(game) {
  const news = updateHousing(game);
  if (news) settlePlace(game);
  return news;
}
