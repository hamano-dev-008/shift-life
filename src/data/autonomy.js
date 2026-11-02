// autonomy.js — The character's own plans: when, left alone, they pick
// something to do by themselves (fishing, busking, resting, or visiting
// another place), how the choice is weighted by the active goal and
// traits, how long they keep at it, and what they say. Pure data:
// game/autonomy.js reads it.

// Left alone: they only choose while nothing is going on and the player
// hasn't clicked anything in the game for QUIET_MINUTES real minutes.
export const AUTONOMY_QUIET_MINUTES = 5;

// How long, in real minutes, between one plan and the next ([min, max],
// random): from launch, and again after each plan ends or is called off.
export const AUTONOMY_EVERY_MINUTES = [20, 60];

// How long they keep at it once they've arrived at the spot, in real
// minutes ([min, max], random). Then they stop by themselves (fishing
// sells the bucket, as usual).
export const AUTONOMY_DURATION_MINUTES = [10, 40];

// What they can choose. Each has a base `weight`, a `minAge`, and:
//   fish   the place activity `activity` (data/activities.js); needs its
//          item (a rod) and its age.
//   busk   busking at the Fortune Tree (from TREE_MIN_AGE too).
//   rest   resting on the nearest rest spot (the current place first);
//          only while health is below `healthBelow`, or below
//          `lazyHealthBelow` for a lazy character.
//   visit  walking to another place that exists now, just to be there.
export const AUTONOMY_CHOICES = {
  fish: { weight: 1, minAge: 6, activity: 'fishing' },
  busk: { weight: 1, minAge: 6 },
  rest: { weight: 1, minAge: 0, healthBelow: 70, lazyHealthBelow: 90 },
  visit: { weight: 1, minAge: 3 },
  // At the Farm (data/farm.js), at a paddy that needs it: planting an
  // empty one (with the money for seed), pulling weeds that are up,
  // harvesting ripe rice. They're done when the job is (no time limit).
  plant: { weight: 1, minAge: 10, farm: true },
  weed: { weight: 1, minAge: 10, farm: true },
  harvest: { weight: 1.5, minAge: 10, farm: true },
};

// Multipliers on a choice's weight by the active goal (data/goals.js);
// missing ones are 1. `whim` (0-1) shakes the weights up each time (each
// multiplied by 1 to 1 + whim, at random): a free spirit varies most.
export const AUTONOMY_GOALS = {
  scholar: { weights: { visit: 1.5, rest: 1.2 }, whim: 0.3 },
  fortune: {
    weights: {
      fish: 3, busk: 3, plant: 2.5, weed: 2.5, harvest: 3,
    },
    whim: 0.3,
  },
  heart: { weights: { busk: 2, visit: 1.5 }, whim: 0.3 },
  healthy: {
    weights: {
      rest: 2.5, visit: 2.5, busk: 0.6, plant: 2, weed: 2, harvest: 2,
    },
    whim: 0.3,
  },
  free: { weights: {}, whim: 1.5 },
};

// Multipliers on a choice's weight by trait (data/traits.js); missing
// ones are 1.
export const AUTONOMY_TRAITS = {
  lazy: {
    rest: 3, visit: 0.6, plant: 0.4, weed: 0.4, harvest: 0.5,
  },
  curious: { visit: 2.5 },
  social: { busk: 2.5 },
  shy: { busk: 0.5, fish: 1.5 },
  bold: { visit: 1.3 },
  careful: { rest: 1.3 },
};

// What they say as they set off (a short bubble), and when they stop by
// themselves (fishing shows the sale instead; farm jobs their own bubble
// when done).
export const AUTONOMY_TEXT = {
  going: {
    fish: 'Going fishing!',
    busk: 'Time to play some music!',
    rest: 'I could use a nap...',
    visit: 'Time for a little walk!',
    plant: 'Time to plant rice!',
    weed: 'Those weeds have to go!',
    harvest: 'The rice is ready!',
  },
  done: {
    busk: 'That was fun to play.',
    rest: 'Ah, feeling rested.',
  },
  bubbleSeconds: 2.5,
  // The player setting (in the dev menu for now, next to Work trips).
  setting: 'Let them choose',
  on: 'On',
  off: 'Off',
  // The dev menu's "Choose now" (they pick something at once) and its
  // notes.
  devNow: 'Choose now',
  nothing: 'Nothing to choose right now.',
  notNow: 'Not now.',
};
