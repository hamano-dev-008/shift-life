// save.js — Converts game state to and from the save format, and asks the
// main process (via window.shiftLife) to read and write the save file.

import { createClock } from './clock.js';
import { restoreCharacter, ageOf } from './character.js';
import { restoreEventState } from './events.js';
import { restoreGoalState } from './goals.js';
import { restoreJobState } from './jobs.js';
import { restorePlace, settlePlace } from './places.js';
import { restoreTreeState } from './fortuneTree.js';
import { restoreHomeState } from './home.js';
import { restoreHousingState } from './housing.js';

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
    fortuneTree: game.fortuneTree,
    home: game.home,
    housing: game.housing,
  };
}

// Returns the saved { clock, character, events, goals, jobs, place,
// fortuneTree, home, housing }, or null if there's no usable save. Saves
// from before events, goals, jobs, places, the Fortune Tree, Home or
// housing existed get fresh state for them (and start at DEFAULT_PLACE;
// adults from before housing have moved out, and leave the parents'
// house for My Yard).
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
    fortuneTree: restoreTreeState(data.fortuneTree),
    home: restoreHomeState(data.home),
    housing: restoreHousingState(data.housing, ageOf(character, data.clock.years)),
  };
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
