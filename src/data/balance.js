// balance.js — Tunable numbers for game pacing.

// How long one in-game year lasts in real time, in minutes.
export const REAL_MINUTES_PER_YEAR = 3;

// Developer fast-forward (Ctrl+Shift+F): real seconds per in-game year.
export const FAST_FORWARD_SECONDS_PER_YEAR = 5;

// Mood runs 0-100. It's a placeholder until goals and events affect it.
export const DEFAULT_MOOD = 70;

// Mood at or above MOOD_SMILE_AT smiles; below MOOD_FROWN_BELOW frowns;
// anything between is neutral.
export const MOOD_SMILE_AT = 60;
export const MOOD_FROWN_BELOW = 35;
