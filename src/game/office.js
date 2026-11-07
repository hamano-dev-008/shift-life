// office.js — Paperleaf Co.'s break corner: a vending machine coffee (once
// an hour) or printing a resume (once a day), each had at its machine.
// Paid at once (game/visits.js runs it). Typing shifts at the desk are
// game/shifts.js. Numbers and text in data/office.js.

import { OFFICE_PLACE, OFFICE_MIN_AGE, OFFICE_ITEMS, OFFICE_NEWS } from '../data/office.js';
import {
  createVisits, restoreVisits, isVisiting, visitBlock, startVisit, stopVisit, updateVisits, visitsView,
} from './visits.js';

const OFFICE = {
  key: 'office', place: OFFICE_PLACE, minAge: OFFICE_MIN_AGE, items: OFFICE_ITEMS, news: (id) => OFFICE_NEWS[id],
};

export const createOfficeState = () => createVisits(OFFICE);
export const restoreOfficeState = (data) => restoreVisits(OFFICE, data);
export const isOnBreak = (game) => isVisiting(game, OFFICE);
export const breakBlock = (game, item) => visitBlock(game, OFFICE, item);
export const buyAtBreak = (game, item) => startVisit(game, OFFICE, item);
export const stopBreak = (game) => stopVisit(game, OFFICE);
export const updateOffice = (game, realMs) => updateVisits(game, OFFICE, realMs);
export const officeView = (game) => visitsView(game, OFFICE);
