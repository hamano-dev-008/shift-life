// places.js — Which place the character is at (game.place, a place id),
// which places exist right now (with their parents, or in their own
// place; see game/housing.js), what each one shows (its housing prop),
// how they connect, the route between two of them, and moving from one to
// the next (which ends busking or resting, since those belong to a place).
// All place content lives in data/places.js.

import { PLACES, DEFAULT_PLACE } from '../data/places.js';
import { FORTUNE_TREE_PLACE } from '../data/fortuneTree.js';
import { REST_SEATS } from '../data/home.js';
import { stopPlaying, stopPicking, isPicking } from './fortuneTree.js';
import { stopOrder } from './cafe.js';
import { stopPurchase } from './store.js';
import { stopSending } from './post.js';
import { POST_PLACE } from '../data/post.js';
import { stopAtStall } from './alley.js';
import { ALLEY_PLACE } from '../data/alley.js';
import { stopBreak } from './office.js';
import { OFFICE_PLACE } from '../data/office.js';
import { stopRamen } from './ramen.js';
import { RAMEN_PLACE } from '../data/ramen.js';
import { STORE_PLACE } from '../data/store.js';
import { stopShift } from './shifts.js';
import { CAFE_PLACE } from '../data/cafe.js';
import { stopResting } from './home.js';
import { stopActivity, currentActivity } from './activities.js';
import { stopFarmJob } from './farm.js';
import { FARM_PLACE } from '../data/farm.js';
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

const isEdge = (via) => via === 'left' || via === 'right';
const hasEdgeExit = (place) => place.exits.some((exit) => isEdge(exit.via));

// The ways into town and back (`town` in data/places.js): from a place
// with an edge exit to each town place (`via: 'town'`), and from a town
// place out its door to each of those, the one they came from
// (game.townFrom) first, so the door leads back there.
function townExits(game, place) {
  if (place.town) {
    return PLACES.filter((other) => !other.town && hasEdgeExit(other))
      .sort((a, b) => (b.id === game.townFrom) - (a.id === game.townFrom))
      .map((other) => ({ to: other.id, via: place.door }));
  }
  if (!hasEdgeExit(place)) return [];
  return PLACES.filter((other) => other.town).map((other) => ({ to: other.id, via: 'town' }));
}

// Place `id` as it is right now: { id, name, scenery, exits, targets }
// with only the scenery that shows (the current housing prop), the exits
// to places that exist through props that show (and to and from town),
// and the targets that show. Null if the place doesn't exist now.
export function placeView(game, id) {
  if (!placeExists(game, id)) return null;
  const place = placeById(id);
  const scenery = place.scenery.filter((name) => showsPiece(game, name));
  const shows = (via) => isEdge(via) || via === 'town' || scenery.includes(via);
  return {
    ...place,
    scenery,
    exits: [...place.exits, ...townExits(game, place)].filter((exit) => placeExists(game, exit.to) && shows(exit.via)),
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
// with `to` (fewest steps first), or null if there's no way there now. A
// town place is only ever where a trip starts or ends, never a shortcut
// on the way.
export function routeBetween(game, from, to) {
  const cameFrom = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const id = queue.shift();
    if (id === to) break;
    if (id !== from && placeById(id).town) continue;
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
// picking the apple, a Cafe order, a 6-Eleven snack, a shift, resting, an
// activity such as fishing, which sells the bucket; call
// stopActivity() first to get its bubble). Returns whether anything ended.
export function leavePlace(game) {
  const stoppedPlaying = stopPlaying(game);
  const stoppedResting = stopResting(game);
  const stoppedActivity = Boolean(stopActivity(game));
  const stoppedJob = stopFarmJob(game);
  const stoppedPicking = isPicking(game);
  stopPicking(game);
  const stoppedOrder = stopOrder(game) || stopPurchase(game) || stopSending(game) || stopAtStall(game)
    || stopBreak(game) || stopRamen(game);
  const stoppedShift = stopShift(game);
  return stoppedPlaying || stoppedResting || stoppedActivity || stoppedJob || stoppedPicking || stoppedOrder
    || stoppedShift;
}

// Makes sure the character is somewhere that exists, and doing only what
// that place allows. A place that's gone (the parents' house after moving
// out, Home without the house) sends them to its `gone` place, ending
// busking or resting; busking needs the Fortune Tree, resting needs a
// resting prop and an activity its own place. Returns whether the place
// changed.
export function settlePlace(game) {
  let moved = false;
  for (let tries = 0; !placeExists(game, game.place) && tries < PLACES.length; tries++) {
    game.place = placeById(game.place)?.gone ?? DEFAULT_PLACE;
    moved = true;
  }
  if (!placeExists(game, game.place)) game.place = DEFAULT_PLACE;
  if (moved) leavePlace(game);
  if (game.place !== FORTUNE_TREE_PLACE) {
    stopPlaying(game);
    stopPicking(game);
  }
  if (!restSpotOf(game)) stopResting(game);
  if (currentActivity(game) && currentActivity(game).place !== game.place) stopActivity(game);
  if (game.place !== FARM_PLACE) stopFarmJob(game);
  if (game.place !== CAFE_PLACE) stopOrder(game);
  if (game.place !== STORE_PLACE) stopPurchase(game);
  if (game.place !== POST_PLACE) stopSending(game);
  if (game.place !== ALLEY_PLACE) stopAtStall(game);
  if (game.place !== OFFICE_PLACE) stopBreak(game);
  if (game.place !== RAMEN_PLACE) stopRamen(game);
  if (game.work.shift && game.work.shift.place !== game.place) stopShift(game);
  return moved;
}

// Moves the character to place `id` (one step of a trip, or the dev
// menu's Go to).
export function enterPlace(game, id) {
  if (!placeExists(game, id)) return;
  // Into town: remember where from (saved), for the way back out.
  if (placeById(id).town && !placeById(game.place)?.town) game.townFrom = game.place;
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
