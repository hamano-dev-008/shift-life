// balance.js — Tunable numbers for game pacing.

// How long one in-game year lasts in real time, in minutes.
export const REAL_MINUTES_PER_YEAR = 3;

// Developer fast-forward (Ctrl+Shift+F): real seconds per in-game year.
export const FAST_FORWARD_SECONDS_PER_YEAR = 5;

// The mouth follows happiness (0-100). At or above MOOD_SMILE_AT smiles;
// below MOOD_FROWN_BELOW frowns; anything between is neutral.
export const MOOD_SMILE_AT = 60;
export const MOOD_FROWN_BELOW = 35;

// In-game years between one event being answered and the next appearing:
// [min, max], picked at random each time. Counting the wait for an answer,
// that's about 1 event per year if the player never answers and nearly 2
// if they answer right away.
export const EVENT_GAP_YEARS = [0.35, 0.75];

// If the player doesn't answer an event within this many real seconds (at
// normal speed; fast-forward shortens it to match), the character decides.
export const AUTO_DECIDE_SECONDS = 60;

// When deciding alone, each of the character's traits that leans toward a
// choice scores 1, plus a random 0 to DECISION_WHIM. Below 1, a matching
// trait always wins and the whim only breaks ties; above 1, the character
// sometimes surprises you.
export const DECISION_WHIM = 0.9;

// When deciding alone, a choice that serves the active goal (`goals` in
// data/events.js) scores this much extra. Above the most traits a choice
// can match plus DECISION_WHIM, so the goal always outweighs traits.
export const GOAL_DECISION_WEIGHT = 4;

// Events with a choice that serves the active goal are this many times as
// likely to be picked as others (among those seen least so far).
export const GOAL_EVENT_WEIGHT = 2;
