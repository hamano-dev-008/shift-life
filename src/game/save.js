// save.js — Converts game state to and from the save format, and asks the
// main process (via window.shiftLife) to read and write the save file.

import { createClock } from './clock.js';
import { restoreCharacter } from './character.js';

const SAVE_VERSION = 1;

function toSaveData(game) {
  return {
    version: SAVE_VERSION,
    clock: { years: game.clock.years },
    character: game.character,
  };
}

// Returns the saved { clock, character }, or null if there's no usable save.
export async function loadGame() {
  const data = await window.shiftLife.loadSave();
  if (data?.version !== SAVE_VERSION || !Number.isFinite(data.clock?.years)) return null;
  const character = restoreCharacter(data.character);
  return character ? { clock: createClock(data.clock.years), character } : null;
}

export function saveGame(game) {
  window.shiftLife.save(toSaveData(game));
}

// Blocks until the save is written. Use while the window is closing.
export function saveGameNow(game) {
  window.shiftLife.saveSync(toSaveData(game));
}
