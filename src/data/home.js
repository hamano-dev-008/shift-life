// home.js — Numbers and text for resting: lying down on a sofa, in the
// sleeping bag or in the tent to slowly regain health. How fast depends
// on where (restMinutes in data/housing.js). Pure data: game/home.js and
// the drawing code read it.

// Props the character can rest on, with the height, in scene pixels above
// the prop's base (its bottom row), where they lie: the top of the sofa's
// seat cushions, the top of the sleeping bag, the tent's floor. A sprite
// for one of these should keep that height. A place's first resting prop
// that shows is where they rest there.
export const REST_SEATS = {
  'home.sofa': 6,
  'yard.sleepingBag': 3,
  'yard.tent': 0,
};

// Resting gains REST_HEALTH health every few real minutes (restMinutes in
// data/housing.js), never above REST_HEALTH_MAX. Real minutes: game speed
// doesn't change it, and time doesn't pass while the app is closed. The
// rest carries on (with no more gain) until the player picks "Get up".
export const REST_HEALTH = 1;
export const REST_HEALTH_MAX = 100;

// Resting visuals, in seconds: a "z" floats up every `z` and rises for
// `zRise`.
export const REST_LOOPS = { z: 1.2, zRise: 2.4 };

// Rest menu text (its title is the prop's name from `targets` in
// data/places.js). {amount} is REST_HEALTH, {minutes} the minutes per
// gain here, {health} and {max} the health now and REST_HEALTH_MAX,
// {time} and {total} the time rested towards the next gain and the time
// it takes.
export const REST_TEXT = {
  rest: 'Rest',
  getUp: 'Get up',
  idle: 'Resting restores {amount} health every {minutes} min.',
  resting: 'Resting: {time} of {total}',
  health: 'Health: {health}/{max}',
  full: 'Fully rested!',
  // The activity bar while resting.
  bar: 'Resting - Health {health}/{max}',
  // The activity bar while walking to the rest spot; {seat} from
  // REST_SPOT_NAMES.
  onTheWay: 'Going to the {seat}...',
};

// What each rest spot is called in running text.
export const REST_SPOT_NAMES = {
  'home.sofa': 'sofa',
  'yard.sleepingBag': 'sleeping bag',
  'yard.tent': 'tent',
};
