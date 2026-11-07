// ramen.js — Ramen Hinata's counter: a bowl of shoyu ramen (once an hour)
// or the chef's special (once a day), eaten sitting at the counter. Paid
// at once (game/visits.js runs it). Cooking shifts are game/shifts.js.
// Numbers and text in data/ramen.js.

import { RAMEN_PLACE, RAMEN_MIN_AGE, RAMEN_ITEMS, RAMEN_NEWS } from '../data/ramen.js';
import {
  createVisits, restoreVisits, isVisiting, visitBlock, startVisit, stopVisit, updateVisits, visitsView,
} from './visits.js';

const RAMEN = {
  key: 'ramen', place: RAMEN_PLACE, minAge: RAMEN_MIN_AGE, items: RAMEN_ITEMS, news: (id) => RAMEN_NEWS[id],
};

export const createRamenState = () => createVisits(RAMEN);
export const restoreRamenState = (data) => restoreVisits(RAMEN, data);
export const isEatingRamen = (game) => isVisiting(game, RAMEN);
export const ramenBlock = (game, item) => visitBlock(game, RAMEN, item);
export const orderRamen = (game, item) => startVisit(game, RAMEN, item);
export const stopRamen = (game) => stopVisit(game, RAMEN);
export const updateRamen = (game, realMs) => updateVisits(game, RAMEN, realMs);
export const ramenView = (game) => visitsView(game, RAMEN);
