// settings.js — Player settings and their defaults. Saved in their own
// file (settings.json), so they last across launches and lives.

export const SETTINGS_VERSION = 1;

// workTrips: whether an employed character now and then walks off "to
// work" (see WORK_TRIP_EVERY_MINUTES in data/animation.js). Off means
// they never leave for work.
export const DEFAULT_SETTINGS = {
  workTrips: true,
};
