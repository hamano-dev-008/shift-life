// save.js — Converts game state to and from the save format, and asks the
// main process (via window.shiftLife) to read and write the save file, the
// Book of past lives, the fish collection and the player settings (their
// own files, so they outlast each life).

import { createClock } from './clock.js';
import { restoreCharacter, ageOf } from './character.js';
import { restoreEventState } from './events.js';
import { restoreGoalState } from './goals.js';
import { restoreJobState } from './jobs.js';
import { restorePlace, settlePlace } from './places.js';
import { restoreTreeState } from './fortuneTree.js';
import { restoreHomeState } from './home.js';
import { restoreHousingState } from './housing.js';
import { restoreEndOfLifeState, restoreBook, bookSaveData } from './endOfLife.js';
import { restoreActivityState } from './activities.js';
import { restoreAutonomyState } from './autonomy.js';
import { restoreFarmState } from './farm.js';
import { restoreCafeState } from './cafe.js';
import { restoreWorkState } from './shifts.js';
import { restoreStoreState } from './store.js';
import { restorePostState } from './post.js';
import { restoreCollection, collectionSaveData } from './fishing.js';
import { restoreSettings, settingsSaveData } from './settings.js';
import { restoreWeatherState, restoreWeatherSeenState } from './weather.js';

const SAVE_VERSION = 1;

function toSaveData(game) {
  return {
    version: SAVE_VERSION,
    clock: { years: game.clock.years },
    character: game.character,
    events: game.events,
    goals: game.goals,
    jobs: game.jobs,
    place: game.place,
    townFrom: game.townFrom ?? null,
    // A pick under way isn't kept: after a load the apple hangs there
    // again (or, once fallen, the result has already been paid).
    fortuneTree: { ...game.fortuneTree, picking: null },
    home: game.home,
    housing: game.housing,
    endOfLife: game.endOfLife,
    activities: game.activities,
    autonomy: game.autonomy,
    farm: game.farm,
    cafe: game.cafe,
    work: game.work,
    store: game.store,
    post: game.post,
    weather: game.weather,
    weatherSeen: game.weatherSeen,
  };
}

// Returns the saved { clock, character, events, goals, jobs, place,
// townFrom (where they came into town from, or null), fortuneTree, home,
// housing, endOfLife, activities, autonomy, farm, cafe, work, store,
// post, weather, weatherSeen }, or null if there's no usable save. Saves from before events,
// goals, jobs, places, the Fortune Tree, Home, housing, the end of life,
// activities, the character's own plans, the Farm or the weather existed
// get
// fresh state for them (and
// start at DEFAULT_PLACE; adults from before housing have moved out, and
// leave the parents' house for My Yard; ageing counts from their age
// now). A life that has ended loads with its clock stopped.
export async function loadGame() {
  const data = await window.shiftLife.loadSave();
  if (data?.version !== SAVE_VERSION || !Number.isFinite(data.clock?.years)) return null;
  const character = restoreCharacter(data.character);
  if (!character) return null;
  const game = {
    clock: createClock(data.clock.years),
    character,
    events: restoreEventState(data.events, data.clock.years),
    goals: restoreGoalState(data.goals, data.clock.years),
    jobs: restoreJobState(data.jobs, data.clock.years),
    place: restorePlace(data.place),
    townFrom: typeof data.townFrom === 'string' ? data.townFrom : null,
    fortuneTree: restoreTreeState(data.fortuneTree),
    home: restoreHomeState(data.home),
    housing: restoreHousingState(data.housing, ageOf(character, data.clock.years)),
    endOfLife: restoreEndOfLifeState(data.endOfLife, ageOf(character, data.clock.years)),
    activities: restoreActivityState(data.activities),
    autonomy: restoreAutonomyState(data.autonomy),
    farm: restoreFarmState(data.farm),
    cafe: restoreCafeState(data.cafe),
    work: restoreWorkState(data.work, data.cafe),
    store: restoreStoreState(data.store),
    post: restorePostState(data.post),
    weather: restoreWeatherState(data.weather),
    weatherSeen: restoreWeatherSeenState(data.weatherSeen),
  };
  game.clock.stopped = Boolean(game.endOfLife.ended);
  settlePlace(game);
  return game;
}

export function saveGame(game) {
  window.shiftLife.save(toSaveData(game));
}

// Blocks until the save is written. Use while the window is closing.
export function saveGameNow(game) {
  window.shiftLife.saveSync(toSaveData(game));
}

// The Book of past lives ({ lives }), empty if there's no file yet or it
// can't be read.
export async function loadBook() {
  return restoreBook(await window.shiftLife.loadBook());
}

export function saveBook(book) {
  window.shiftLife.saveBook(bookSaveData(book));
}

// The fish collection ({ fish }), empty if there's no file yet or it
// can't be read. The renderer keeps it as game.collection (not part of
// the life's save).
export async function loadCollection() {
  return restoreCollection(await window.shiftLife.loadCollection());
}

export function saveCollection(collection) {
  window.shiftLife.saveCollection(collectionSaveData(collection));
}

// The player settings (data/settings.js), the defaults if there's no file
// yet or it can't be read.
export async function loadSettings() {
  return restoreSettings(await window.shiftLife.loadSettings());
}

export function saveSettings(settings) {
  window.shiftLife.saveSettings(settingsSaveData(settings));
}
