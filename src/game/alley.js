// alley.js — Mural Alley's print stall: an art class (once a day, painted
// at the class easel) or a print (once an hour, picked out at the stall).
// Paid at once (game/visits.js runs it). Painting shifts are
// game/shifts.js. Numbers and text in data/alley.js.

import { ALLEY_PLACE, ALLEY_MIN_AGE, ALLEY_ITEMS, ALLEY_NEWS } from '../data/alley.js';
import {
  createVisits, restoreVisits, isVisiting, visitBlock, startVisit, stopVisit, updateVisits, visitsView,
} from './visits.js';

const ALLEY = {
  key: 'alley', place: ALLEY_PLACE, minAge: ALLEY_MIN_AGE, items: ALLEY_ITEMS, news: (id) => ALLEY_NEWS[id],
};

export const createAlleyState = () => createVisits(ALLEY);
export const restoreAlleyState = (data) => restoreVisits(ALLEY, data);
export const isAtStall = (game) => isVisiting(game, ALLEY);
export const stallBlock = (game, item) => visitBlock(game, ALLEY, item);
export const buyAtStall = (game, item) => startVisit(game, ALLEY, item);
export const stopAtStall = (game) => stopVisit(game, ALLEY);
export const updateAlley = (game, realMs) => updateVisits(game, ALLEY, realMs);
export const alleyView = (game) => visitsView(game, ALLEY);
