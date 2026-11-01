// places.js — The places the character can be, how they connect, and the
// numbers for walking between them. Each place is a scene with its own
// name and scenery. Pure data: game/places.js, ui/scene.js and the
// renderer read it.

// Each place has:
//   id       Unique and saved; don't rename one once it has shipped.
//   name     Shown small under the name label and in the Go to menu (16
//            characters at most).
//   scenery  Scenery pieces, back to front: names from SCENERY in
//            ui/scene.js (also their sprite names, see data/sprites.js).
//            Pieces that are props in data/layout.js (PROPS) can be
//            visited, clicked and placed by the layout.
//   exits    Ways to other places: { to, via }. `via` is 'left' or
//            'right' (walking off that window edge) or a prop id in this
//            place (a door: walking to it and going through). Links go
//            both ways: the destination needs an exit back, and that exit
//            is where the character comes in (from that edge, or at that
//            door).
//   targets  Props that can be clicked, with the hover title: { propId:
//            title }. Clicking a prop that's an exit's `via` walks the
//            character through it; other props open their own menu (the
//            tree, the sofa).
export const PLACES = [
  {
    id: 'fortuneTree',
    name: 'Fortune Tree',
    scenery: ['sky', 'grass', 'tree'],
    exits: [{ to: 'yard', via: 'right' }],
    targets: { tree: 'Fortune Tree' },
  },
  {
    id: 'yard',
    name: 'Yard',
    scenery: ['sky', 'grass', 'yard.house'],
    exits: [{ to: 'fortuneTree', via: 'left' }, { to: 'home', via: 'yard.house' }],
    targets: { 'yard.house': 'Go inside' },
  },
  {
    id: 'home',
    name: 'Home',
    scenery: ['home.wall', 'home.floor', 'home.window', 'home.door', 'home.sofa'],
    exits: [{ to: 'yard', via: 'home.door' }],
    targets: { 'home.sofa': 'Sofa', 'home.door': 'Go outside' },
  },
];

// Where a new life starts.
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
