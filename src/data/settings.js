// settings.js — Player settings and their defaults. Saved in their own
// file (settings.json), so they last across launches and lives.

export const SETTINGS_VERSION = 1;

// workTrips: whether an employed character now and then walks off "to
// work" (see WORK_TRIP_EVERY_MINUTES in data/animation.js). Off means
// they never leave for work.
// ownPlans: whether, left alone, the character now and then chooses
// something to do by themselves (data/autonomy.js). Off means they never
// do.
// parallax: whether the backgrounds move (data/parallax.js): the clouds
// drift, the back layers sway while the window is dragged, side trips pan
// and doors fade. Off keeps them still and switches places at once.
export const DEFAULT_SETTINGS = {
  workTrips: true,
  ownPlans: true,
  parallax: true,
};
