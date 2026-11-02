// places.js — The places the character can be, how they connect, and the
// numbers for walking between them. Each place is a scene with its own
// name and scenery. Pure data: game/places.js, ui/scene.js and the
// renderer read it.

import { LAKE_PLACE, LAKE_FEET_FROM_BOTTOM, LAKE_WALK, DOCK_PROP } from './lake.js';

// Each place has:
//   id        Unique and saved; don't rename one once it has shipped.
//   name      Shown small under the name label and in the Go to menu (16
//             characters at most).
//   requires  Optional: when the place exists (see the requirements in
//             data/housing.js). A place that doesn't exist is left off the
//             map, the Go to menu and every route.
//   gone      Where the character ends up if they're in this place when
//             it stops existing (e.g. moving out at 18).
//   scenery   Scenery pieces, back to front: names from SCENERY in
//             ui/scene.js (also their sprite names, see data/sprites.js).
//             Pieces that are props in data/layout.js (PROPS) can be
//             visited, clicked and placed by the layout. A housing tier's
//             prop (data/housing.js) only shows at that tier.
//   exits     Ways to other places: { to, via }. `via` is 'left' or
//             'right' (walking off that window edge) or a prop id in this
//             place (a door: walking to it and going through). An exit
//             counts only while its place exists and its prop shows.
//             Links go both ways: the destination needs an exit back, and
//             that exit is where the character comes in (from that edge,
//             or at that door).
//   targets   Props that can be clicked, with the hover title: { propId:
//             title }. Clicking a prop that's an exit's `via` walks the
//             character through it; resting props (REST_SEATS in
//             data/home.js) open the rest menu; the tree opens its menu;
//             the Lake's dock shows its bubble (data/lake.js).
//   feetFromBottom  Optional: rows above the window bottom where the
//             character's feet rest here (default FEET_FROM_BOTTOM in
//             data/layout.js). Bubbles, pokes and the shadow follow it.
//   walk      Optional: { minX, maxX }, scene pixels from the window's
//             left edge the character's center may walk between here;
//             null or missing keeps the usual WANDER_MARGIN on that side.
//             A side with a limit is closed: work trips use the other.
//
// The row outdoors, left to right: Lake, Fortune Tree, then the Parents'
// Yard (or My Yard). The Go to menu lists places in this order.
export const PLACES = [
  {
    id: LAKE_PLACE,
    name: 'Lake',
    // The background picture, the water shimmer over it, and the dock
    // (part of the picture; only its click area and fishing spot).
    scenery: ['lake', 'lake.shimmer', DOCK_PROP],
    feetFromBottom: LAKE_FEET_FROM_BOTTOM,
    walk: LAKE_WALK,
    exits: [{ to: 'fortuneTree', via: 'right' }],
    targets: { [DOCK_PROP]: 'Dock' },
  },
  {
    id: 'fortuneTree',
    name: 'Fortune Tree',
    scenery: ['sky', 'grass', 'tree'],
    exits: [{ to: LAKE_PLACE, via: 'left' }, { to: 'yard', via: 'right' }, { to: 'myYard', via: 'right' }],
    targets: { tree: 'Fortune Tree' },
  },
  {
    id: 'yard',
    name: "Parents' Yard",
    requires: 'parents',
    gone: 'myYard',
    scenery: ['sky', 'grass', 'parents.house'],
    exits: [{ to: 'fortuneTree', via: 'left' }, { to: 'home', via: 'parents.house' }],
    targets: { 'parents.house': 'Go inside' },
  },
  {
    id: 'home',
    name: "Parents' Home",
    requires: 'parents',
    gone: 'myYard',
    scenery: ['home.wall', 'home.floor', 'home.window', 'home.door', 'home.sofa'],
    exits: [{ to: 'yard', via: 'home.door' }],
    targets: { 'home.sofa': 'Sofa', 'home.door': 'Go outside' },
  },
  {
    id: 'myYard',
    name: 'My Yard',
    requires: 'movedOut',
    gone: 'fortuneTree',
    scenery: ['sky', 'grass', 'yard.sleepingBag', 'yard.tent', 'yard.house'],
    exits: [{ to: 'fortuneTree', via: 'left' }, { to: 'myHome', via: 'yard.house' }],
    targets: { 'yard.sleepingBag': 'Sleeping bag', 'yard.tent': 'Tent', 'yard.house': 'Go inside' },
  },
  {
    id: 'myHome',
    name: 'Home',
    requires: 'tier:house',
    gone: 'myYard',
    scenery: ['home.wall', 'home.floor', 'home.window', 'home.door', 'home.sofa'],
    exits: [{ to: 'myYard', via: 'home.door' }],
    targets: { 'home.sofa': 'Sofa', 'home.door': 'Go outside' },
  },
];

// Where a new life starts (the parents' living room).
export const NEW_LIFE_PLACE = 'home';

// Where saves from before places existed are, and where a save with a
// place that no longer exists goes.
export const DEFAULT_PLACE = 'fortuneTree';

// Walking between places, in scene pixels: through an edge, the character
// walks `exitPast` beyond it before the next place shows; arriving at the
// last place of a trip through an edge, they walk `entryWalk` in from the
// edge's wander limit (WANDER_MARGIN in data/layout.js).
export const TRAVEL = { exitPast: 10, entryWalk: 20 };

// Text for the Go to menu and the place name while travelling. {place} is
// a place's name, {to} the trip's destination.
export const PLACE_TEXT = {
  goTitle: 'Go to',
  here: 'Now at: {place}',
  travelling: '{place} > {to}',
};
