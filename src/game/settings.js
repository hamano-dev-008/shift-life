// settings.js — Player settings (data/settings.js): restoring them from
// the settings file with defaults for anything missing or wrong, the
// data to save, and changing one.

import { DEFAULT_SETTINGS, SETTINGS_VERSION } from '../data/settings.js';

// Settings from the saved data, or the defaults. Only known settings of
// the right type are kept.
export function restoreSettings(data) {
  const settings = { ...DEFAULT_SETTINGS };
  if (!data || typeof data !== 'object') return settings;
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (typeof data[key] === typeof value) settings[key] = data[key];
  }
  return settings;
}

export function settingsSaveData(settings) {
  return { version: SETTINGS_VERSION, ...restoreSettings(settings) };
}

// Turns work trips on or off. Returns whether it changed.
export function setWorkTrips(settings, on) {
  if (settings.workTrips === Boolean(on)) return false;
  settings.workTrips = Boolean(on);
  return true;
}

// Turns the character's own plans ("Let them choose") on or off. Returns
// whether it changed.
export function setOwnPlans(settings, on) {
  if (settings.ownPlans === Boolean(on)) return false;
  settings.ownPlans = Boolean(on);
  return true;
}
