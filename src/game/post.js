// post.js — Pedal Post's counter: sending a postcard (once an hour) or a
// gift parcel (once a day). Paid at once; the character hands it over at
// the counter while the dispatcher stamps it (game/visits.js runs it).
// Delivery runs (its shifts) are game/shifts.js. Numbers and text in
// data/post.js.

import { POST_PLACE, POST_MIN_AGE, POST_ITEMS, POST_NEWS } from '../data/post.js';
import {
  createVisits, restoreVisits, isVisiting, visitBlock, startVisit, stopVisit, updateVisits, visitsView,
} from './visits.js';

const POST = {
  key: 'post',
  place: POST_PLACE,
  minAge: POST_MIN_AGE,
  items: POST_ITEMS,
  news: (id) => ({ heading: POST_NEWS.sent.heading, text: POST_NEWS.sent.text.replaceAll('{item}', POST_ITEMS[id].thing) }),
};

export const createPostState = () => createVisits(POST);
export const restorePostState = (data) => restoreVisits(POST, data);
export const isSending = (game) => isVisiting(game, POST);
export const sendBlock = (game, item) => visitBlock(game, POST, item);
export const sendItem = (game, item) => startVisit(game, POST, item);
export const stopSending = (game) => stopVisit(game, POST);
export const updatePost = (game, realMs) => updateVisits(game, POST, realMs);
export const postView = (game) => visitsView(game, POST);
