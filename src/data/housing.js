// housing.js — Where the character lives: their parents' house until
// they move out, then their own place in My Yard, upgraded tier by tier.
// Prices, rest rates and text. Pure data: game/housing.js and the drawing
// code read it.

// At this age (whole years) the character moves out of their parents'
// house into My Yard, starting at the first tier.
export const MOVE_OUT_AGE = 18;

// Housing tiers, in upgrade order. Each has:
//   id           Unique and saved; don't rename one once it has shipped.
//   name         Shown in menus and bubbles.
//   price        Dollars to upgrade to it (the first tier is free).
//   prop         Its prop in My Yard (data/layout.js; also its sprite
//                name, data/sprites.js). Only the current tier's prop
//                shows.
//   restMinutes  Real minutes per REST_HEALTH health while resting at
//                this tier (in it, or on its sofa for the house).
export const HOUSING_TIERS = [
  { id: 'sleepingBag', name: 'Sleeping bag', price: 0, prop: 'yard.sleepingBag', restMinutes: 3 },
  { id: 'tent', name: 'Tent', price: 200, prop: 'yard.tent', restMinutes: 2 },
  { id: 'house', name: 'House', price: 1500, prop: 'yard.house', restMinutes: 1 },
];

// Resting on the sofa in the parents' living room (before moving out).
export const PARENTS_REST_MINUTES = 1;

// Requirements a place can have (`requires` in data/places.js):
//   parents   Still living with their parents (before MOVE_OUT_AGE).
//   movedOut  Moved out.
//   tier:<id> Moved out, at that housing tier or better.

// Text. {name} is the character's name, {tier} a tier's name, {price} and
// {amount} dollars.
export const HOUSING_TEXT = {
  upgrade: 'Upgrade to {tier} - ${price}',
  need: 'Need ${amount} more',
  bought: { heading: 'New home!', text: '{name} moved into a {tier}!' },
  movedOut: { heading: 'Moving out!', text: '{name} has a place of their own now.' },
};
