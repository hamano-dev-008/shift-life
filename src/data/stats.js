// stats.js — The character's stats: starting values, display names, and
// the short tags used in the bubble that says what an event changed.

// health, happiness and smarts run 0-100. money is whole dollars and never
// goes below 0. The mouth follows happiness (thresholds in balance.js).
export const START_STATS = { health: 80, happiness: 70, smarts: 30, money: 0 };

// Names in the stats panel (6 characters at most, so the rows line up).
export const STAT_LABELS = {
  health: 'Health',
  happiness: 'Happy',
  smarts: 'Smarts',
  money: 'Money',
};

// Tags in the result bubble, e.g. "HP+5 JOY-3 +$20".
export const STAT_TAGS = { health: 'HP', happiness: 'JOY', smarts: 'IQ', money: '$' };
