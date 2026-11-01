// home.js — Numbers and text for Home, the living room inside the house:
// resting on the sofa. Pure data: game/home.js and the drawing code read
// it.

// The place (data/places.js) with the sofa, and the prop (data/layout.js)
// that is the sofa.
export const HOME_PLACE = 'home';
export const SOFA_PROP = 'home.sofa';

// Resting on the sofa gains REST_HEALTH health every REST_MINUTES real
// minutes, never above REST_HEALTH_MAX. Real minutes: game speed doesn't
// change it, and time doesn't pass while the app is closed. The rest
// carries on (with no more gain) until the player picks "Get up".
export const REST_MINUTES = 1;
export const REST_HEALTH = 1;
export const REST_HEALTH_MAX = 100;

// The height, in scene pixels above the sofa's base (its bottom row),
// where the character lies: the top of the seat cushions. A home.sofa
// sprite should keep its seat at this height too.
export const SOFA_SEAT = 6;

// Resting visuals, in seconds: a "z" floats up every `z` and rises for
// `zRise`.
export const REST_LOOPS = { z: 1.2, zRise: 2.4 };

// Sofa menu text. {amount} is REST_HEALTH, {minutes} REST_MINUTES,
// {health} and {max} the health now and REST_HEALTH_MAX, {time} the time
// rested so far towards the next gain.
export const SOFA_TEXT = {
  title: 'Sofa',
  rest: 'Rest',
  getUp: 'Get up',
  idle: 'Resting restores {amount} health every {minutes} min.',
  resting: 'Resting: {time} of {total}',
  health: 'Health: {health}/{max}',
  full: 'Fully rested!',
};
