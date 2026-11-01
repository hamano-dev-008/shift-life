// places.js — Which place the character is at (game.place, a place id).
// All place content lives in data/places.js.

import { PLACES, DEFAULT_PLACE } from '../data/places.js';

export function placeById(id) {
  return PLACES.find((place) => place.id === id) ?? null;
}

// A saved place id, or DEFAULT_PLACE if it's missing or no longer exists.
export function restorePlace(id) {
  return placeById(id) ? id : DEFAULT_PLACE;
}

// The current place's data: { id, name, scenery }.
export function currentPlace(game) {
  return placeById(game.place) ?? placeById(DEFAULT_PLACE);
}
