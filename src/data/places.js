// places.js — The places the character can be, how they connect, and the
// numbers for walking between them. Each place is a scene with its own
// name and scenery. Pure data: game/places.js, ui/scene.js and the
// renderer read it.

import { LAKE_PLACE, LAKE_FEET_FROM_BOTTOM, LAKE_WALK, DOCK_PROP } from './lake.js';
import { TREE_BACKGROUND, WELL_PROP, WELL_TEXT } from './fortuneTreeDecor.js';
import {
  FARM_PLACE, FARM_BACKGROUND, FARM_FEET_FROM_BOTTOM, FARM_WALK, PADDIES, FARM_TEXT,
} from './farm.js';
import {
  CAFE_PLACE, CAFE_FEET_FROM_BOTTOM, CAFE_WALK, CAFE_DOOR_PROP, CAFE_COUNTER_PROP, CAFE_TEXT,
} from './cafe.js';
import {
  STORE_PLACE, STORE_FEET_FROM_BOTTOM, STORE_WALK, STORE_DOOR_PROP, STORE_COUNTER_PROP, STORE_TEXT,
} from './store.js';
import {
  POST_PLACE, POST_FEET_FROM_BOTTOM, POST_WALK, POST_DOOR_PROP, POST_COUNTER_PROP, POST_TEXT,
} from './post.js';
import {
  ALLEY_PLACE, ALLEY_FEET_FROM_BOTTOM, ALLEY_WALK, ALLEY_MOUTH_PROP, ALLEY_STALL_PROP, ALLEY_TEXT,
} from './alley.js';
import {
  OFFICE_PLACE, OFFICE_FEET_FROM_BOTTOM, OFFICE_WALK, OFFICE_DOOR_PROP, VENDING_PROP, PRINTER_PROP, OFFICE_TEXT,
} from './office.js';
import {
  RAMEN_PLACE, RAMEN_FEET_FROM_BOTTOM, RAMEN_WALK, RAMEN_DOOR_PROP, RAMEN_COUNTER_PROP, RAMEN_TEXT,
} from './ramen.js';

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
//   town      Optional: a place in town, not beside any other. It's
//             reached from every place with an edge exit (walking off
//             the nearest open side, exit `via: 'town'`) and left through
//             its `door` prop back to any of them (game/places.js adds
//             these exits).
//   targets   Props that can be clicked, with the hover title: { propId:
//             title }. Clicking a prop that's an exit's `via` walks the
//             character through it; resting props (REST_SEATS in
//             data/home.js) open the rest menu; the tree opens its menu;
//             the Lake's dock opens its activity menu; the wishing well
//             shows its bubble (data/fortuneTreeDecor.js); a rice paddy
//             opens its menu (data/farm.js).
//   feetFromBottom  Optional: rows above the window bottom where the
//             character's feet rest here (default FEET_FROM_BOTTOM in
//             data/layout.js). Bubbles, pokes and the shadow follow it.
//   walk      Optional: { minX, maxX }, scene pixels from the window's
//             left edge the character's center may walk between here;
//             null or missing keeps the usual WANDER_MARGIN on that side.
//             A side with a limit is closed: work trips use the other.
//
// The row outdoors, left to right: Lake, Fortune Tree, then the Parents'
// Yard (or My Yard), then the Farm. The Go to menu lists places in this
// order.
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
    // Its background picture (sky and grass without it), the wishing well
    // and the tree (data/fortuneTreeDecor.js).
    scenery: [TREE_BACKGROUND, WELL_PROP, 'tree'],
    exits: [{ to: LAKE_PLACE, via: 'left' }, { to: 'yard', via: 'right' }, { to: 'myYard', via: 'right' }],
    targets: { tree: 'Fortune Tree', [WELL_PROP]: WELL_TEXT.title },
  },
  {
    id: 'yard',
    name: "Parents' Yard",
    requires: 'parents',
    gone: 'myYard',
    scenery: ['sky', 'grass', 'parents.house'],
    exits: [{ to: 'fortuneTree', via: 'left' }, { to: 'home', via: 'parents.house' }, { to: FARM_PLACE, via: 'right' }],
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
    exits: [{ to: 'fortuneTree', via: 'left' }, { to: 'myHome', via: 'yard.house' }, { to: FARM_PLACE, via: 'right' }],
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
  {
    id: FARM_PLACE,
    name: 'Farm',
    // The background picture (sky, the paddies, the path, the barn), and
    // the paddies (part of the picture; their click areas and the spots
    // on the path in front of them). The rice is drawn over the water by
    // the renderer (ui/farm.js).
    scenery: [FARM_BACKGROUND, ...PADDIES.map((paddy) => paddy.id)],
    feetFromBottom: FARM_FEET_FROM_BOTTOM,
    walk: FARM_WALK,
    // Beside the parents' yard while growing up, then My Yard.
    exits: [{ to: 'yard', via: 'left' }, { to: 'myYard', via: 'left' }],
    targets: Object.fromEntries(PADDIES.map((paddy, i) => [paddy.id, FARM_TEXT.paddyNames[i]])),
  },
  {
    id: CAFE_PLACE,
    name: CAFE_TEXT.name,
    // The room (one picture), and its door and counter (part of it). The
    // door leads back out to wherever they came into town from.
    scenery: ['cafe', CAFE_DOOR_PROP, CAFE_COUNTER_PROP],
    feetFromBottom: CAFE_FEET_FROM_BOTTOM,
    walk: CAFE_WALK,
    town: true,
    door: CAFE_DOOR_PROP,
    exits: [],
    targets: { [CAFE_DOOR_PROP]: CAFE_TEXT.door, [CAFE_COUNTER_PROP]: CAFE_TEXT.counter },
  },
  {
    id: STORE_PLACE,
    name: STORE_TEXT.name,
    // The store (one picture), and its door and register counter.
    scenery: ['store', STORE_DOOR_PROP, STORE_COUNTER_PROP],
    feetFromBottom: STORE_FEET_FROM_BOTTOM,
    walk: STORE_WALK,
    town: true,
    door: STORE_DOOR_PROP,
    exits: [],
    targets: { [STORE_DOOR_PROP]: STORE_TEXT.door, [STORE_COUNTER_PROP]: STORE_TEXT.counter },
  },
  {
    id: POST_PLACE,
    name: POST_TEXT.name,
    // The hub (one picture), and its door and counter.
    scenery: ['post', POST_DOOR_PROP, POST_COUNTER_PROP],
    feetFromBottom: POST_FEET_FROM_BOTTOM,
    walk: POST_WALK,
    town: true,
    door: POST_DOOR_PROP,
    exits: [],
    targets: { [POST_DOOR_PROP]: POST_TEXT.door, [POST_COUNTER_PROP]: POST_TEXT.counter },
  },
  {
    id: ALLEY_PLACE,
    name: ALLEY_TEXT.name,
    // The alley (one picture, outdoors), its way back out to the street
    // and its print stall.
    scenery: ['alley', ALLEY_MOUTH_PROP, ALLEY_STALL_PROP],
    feetFromBottom: ALLEY_FEET_FROM_BOTTOM,
    walk: ALLEY_WALK,
    town: true,
    door: ALLEY_MOUTH_PROP,
    exits: [],
    targets: { [ALLEY_MOUTH_PROP]: ALLEY_TEXT.mouth, [ALLEY_STALL_PROP]: ALLEY_TEXT.stall },
  },
  {
    id: OFFICE_PLACE,
    name: OFFICE_TEXT.name,
    // The office (one picture), its door, and the break corner's vending
    // machine and printer.
    scenery: ['office', OFFICE_DOOR_PROP, VENDING_PROP, PRINTER_PROP],
    feetFromBottom: OFFICE_FEET_FROM_BOTTOM,
    walk: OFFICE_WALK,
    town: true,
    door: OFFICE_DOOR_PROP,
    exits: [],
    targets: {
      [OFFICE_DOOR_PROP]: OFFICE_TEXT.door, [VENDING_PROP]: OFFICE_TEXT.vending, [PRINTER_PROP]: OFFICE_TEXT.printer,
    },
  },
  {
    id: RAMEN_PLACE,
    name: RAMEN_TEXT.name,
    // The shop (one picture), and its door and counter.
    scenery: ['ramen', RAMEN_DOOR_PROP, RAMEN_COUNTER_PROP],
    feetFromBottom: RAMEN_FEET_FROM_BOTTOM,
    walk: RAMEN_WALK,
    town: true,
    door: RAMEN_DOOR_PROP,
    exits: [],
    targets: { [RAMEN_DOOR_PROP]: RAMEN_TEXT.door, [RAMEN_COUNTER_PROP]: RAMEN_TEXT.counter },
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

// Text for the Go to menu (`town` turns it to the town places' page,
// `back` turns it back) and the place name while travelling. {place} is a
// place's name, {to} the trip's destination.
export const PLACE_TEXT = {
  goTitle: 'Go to',
  townTitle: 'Go to: Town',
  town: 'Town...',
  back: 'Back',
  here: 'Now at: {place}',
  travelling: '{place} > {to}',
};
