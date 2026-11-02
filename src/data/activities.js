// activities.js — Activities the character can do at a place, as data:
// where, from what age, what they need to buy first, how long it runs,
// and what it gives. Pure data: game/activities.js runs them, the
// activity menu (ui/activityMenu.js) offers them, and the character's
// look while doing one comes from its `animation` (ui/sprite.js, or a
// character.<body>.<animation> sprite).
//
// Busking and resting came first and still have their own code
// (game/fortuneTree.js, game/home.js).
//
// Entries are keyed by id (saved; don't rename once shipped). Each has:
//   name       Shown in the dev menu and read-out.
//   place      The place it happens at (data/places.js).
//   prop       The prop there (data/layout.js) whose click opens the
//              activity menu. The character does it at the prop's visit
//              spot (for the Lake's dock, the fishing spot).
//   facing     'left' or 'right': which way they face while doing it.
//   minAge     Whole years; younger, the menu only says to come back.
//   item       Optional: what they must buy first, once per life
//              ({ id, name, price }; id is saved).
//   runs       'untilStopped', or { minutes } for a fixed time of real
//              play (it stops by itself after that).
//   rewards    What it gives, any of:
//                catches   true: bites and catches (data/fishing.js); the
//                          bucket is sold when it stops.
//                every     { minutes, stats }: stat changes for each
//                          full period of real time while it runs.
//                onFinish  Stat changes when a fixed-time run ends.
//   freezeEvents  true: no new events while it runs (the event timer
//              waits, as while busking or resting).
//   animation  The pose's activity name while doing it.
//   text       Menu and bubble text. {item} is the item's name, {price}
//              and {amount} dollars, {age} an age, {name} the character's
//              name.
//
// Work trips never happen while doing an activity (the character stays
// at the spot), and travelling stops it.
//
// A future activity is a new entry here, a place and prop to do it at,
// and its animation, e.g.:
//   gym: { name: 'Gym', place: 'gym', prop: 'gym.bench', facing: 'right',
//     minAge: 14, item: { id: 'gymPass', name: 'gym pass', price: 50 },
//     runs: 'untilStopped', rewards: { every: { minutes: 5, stats: { health: 1 } } },
//     freezeEvents: true, animation: 'lift', text: { ... } },
//   workShift: { ..., runs: { minutes: 20 }, rewards: { onFinish: { money: 60 } } },

import { LAKE_PLACE, DOCK_PROP } from './lake.js';

export const PLACE_ACTIVITIES = {
  fishing: {
    name: 'Fishing',
    place: LAKE_PLACE,
    prop: DOCK_PROP,
    facing: 'left',
    minAge: 6,
    item: { id: 'fishingRod', name: 'fishing rod', price: 30 },
    runs: 'untilStopped',
    rewards: { catches: true },
    freezeEvents: true,
    animation: 'fish',
    text: {
      title: 'Dock',
      tooYoung: 'Come back at age {age} to fish here.',
      buy: 'Buy a {item} - ${price}',
      need: 'Need ${amount} more',
      bought: { heading: 'New fishing rod!', text: '{name} bought a {item}.' },
      idle: 'A bite every 30s-3m. Click the "!" fast for rarer fish.',
      idle: 'A bite every 30s-3m. Click the "!" fast for rarer fish.',
      start: 'Start fishing',
      stop: 'Stop fishing',
      done: { heading: 'Fishing', text: 'All done.' },
    },
  },
};
