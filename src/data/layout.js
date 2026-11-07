// layout.js — Scene scale, sizes, and positions. Everything in the scene is
// pixel art on a grid of "scene pixels"; each one is drawn as a
// SCENE_SCALE x SCENE_SCALE block of screen pixels. Sizes and positions
// below are in scene pixels, measured from the window edges, so they adapt
// when SCENE_SCALE changes.

import { LAKE_ART, DOCK, DOCK_PROP, FISHING_SPOT_X } from './lake.js';
import { WELL, WELL_PROP } from './fortuneTreeDecor.js';
import { FARM_ART, PADDIES, PADDY_WATER } from './farm.js';
import {
  CAFE_ART, CAFE_DOOR, CAFE_DOOR_PROP, CAFE_COUNTER, CAFE_COUNTER_PROP,
} from './cafe.js';
import {
  STORE_ART, STORE_DOOR, STORE_DOOR_PROP, STORE_COUNTER, STORE_COUNTER_PROP,
} from './store.js';
import {
  POST_ART, POST_DOOR, POST_DOOR_PROP, POST_COUNTER, POST_COUNTER_PROP,
} from './post.js';
import {
  ALLEY_ART, ALLEY_MOUTH, ALLEY_MOUTH_PROP, ALLEY_STALL, ALLEY_STALL_PROP,
} from './alley.js';

// Overall scene scale: screen pixels per scene pixel. Whole numbers only,
// so pixels stay crisp. Sizes everything except the character.
export const SCENE_SCALE = 3;

// The character's own size: screen pixels per pixel of the character's
// art, separate from SCENE_SCALE. Whole numbers only, so pixels stay
// crisp; the art itself never changes, so the face stays readable. 2 makes
// an adult 40px tall (two thirds of 3, the closest crisp size to 75%); 3
// matches the scene. Walk speed and stride are in character pixels
// (data/animation.js), so they scale with this and the feet stay planted.
export const CHARACTER_SCALE = 2;

// Height of the grass strip along the bottom of the window.
export const GROUND_HEIGHT = 16;

// Rows above the window bottom where the character's feet rest, and where
// the props stand (further back, so the character walks in front of them).
// A place can set its own feet row (feetFromBottom in data/places.js).
export const FEET_FROM_BOTTOM = 7;
export const PROP_BASE_FROM_BOTTOM = 12;

// Props, by id (also their sprite names, see data/sprites.js); a place
// shows the ones in its scenery (data/places.js). edge / margin: which
// window edge the prop sits against ('left' or 'right'), and how far from
// it; or 'center' for the middle of the window (margin unused). width /
// height: the prop's size. base: rows above the window bottom where its
// bottom sits (default PROP_BASE_FROM_BOTTOM; higher for things on a
// wall). visitOffset: how far from the prop's left side the character
// stops when visiting (the trunk, a door, the middle of the sofa or the
// sleeping bag). visit: false keeps the character from wandering over to
// it on their own (it can still be clicked).
export const PROPS = {
  tree: { edge: 'center', margin: 0, width: 18, height: 34, visitOffset: 9 },
  // The Fortune Tree's wishing well, left of the tree (data/fortuneTreeDecor.js).
  [WELL_PROP]: { edge: 'left', ...WELL, visit: false },
  'parents.house': { edge: 'right', margin: 8, width: 22, height: 26, visitOffset: 11 },
  'yard.sleepingBag': { edge: 'right', margin: 16, width: 22, height: 4, base: 9, visitOffset: 11 },
  'yard.tent': { edge: 'right', margin: 12, width: 26, height: 18, visitOffset: 13 },
  'yard.house': { edge: 'right', margin: 8, width: 22, height: 26, visitOffset: 11 },
  'home.window': { edge: 'center', margin: 0, width: 22, height: 17, base: 36, visitOffset: 11 },
  'home.door': { edge: 'left', margin: 4, width: 14, height: 27, base: 15, visitOffset: 7 },
  'home.sofa': { edge: 'right', margin: 6, width: 32, height: 13, visitOffset: 16 },
  // The Lake's dock is part of the background picture: this is its click
  // area (DOCK in data/lake.js, in the picture's pixels) and the fishing
  // spot. A code-drawn prop's click area is the prop plus a 1px outline
  // all round, hence the 1s.
  [DOCK_PROP]: {
    edge: 'left',
    margin: DOCK.left + 1,
    width: DOCK.right - DOCK.left - 1,
    height: DOCK.bottom - DOCK.top - 1,
    base: LAKE_ART.height - DOCK.bottom,
    visitOffset: FISHING_SPOT_X - DOCK.left - 1,
  },
  // The Farm's rice paddies are part of its background picture too: each
  // is its water's click area (PADDIES and PADDY_WATER in data/farm.js,
  // in the picture's pixels) and the spot on the path in front of its
  // middle. Not visited on a whim.
  ...Object.fromEntries(PADDIES.map((paddy) => [paddy.id, {
    edge: 'left',
    margin: paddy.left + 1,
    width: paddy.right - paddy.left - 1,
    height: PADDY_WATER.bottom - PADDY_WATER.top - 1,
    base: FARM_ART.height - PADDY_WATER.bottom,
    visitOffset: Math.floor((paddy.left + paddy.right) / 2) - paddy.left - 1,
    visit: false,
  }])),
  // The town places' doors and counters are part of their pictures too
  // (data/cafe.js, data/store.js, data/post.js, data/alley.js): click
  // areas, and the spots at the door and at the counter's flap.
  [CAFE_DOOR_PROP]: inPicture(CAFE_ART, CAFE_DOOR, CAFE_DOOR.x),
  [CAFE_COUNTER_PROP]: { ...inPicture(CAFE_ART, CAFE_COUNTER, CAFE_COUNTER.flap), visit: false },
  [STORE_DOOR_PROP]: inPicture(STORE_ART, STORE_DOOR, STORE_DOOR.x),
  [STORE_COUNTER_PROP]: { ...inPicture(STORE_ART, STORE_COUNTER, STORE_COUNTER.flap), visit: false },
  [POST_DOOR_PROP]: inPicture(POST_ART, POST_DOOR, POST_DOOR.x),
  [POST_COUNTER_PROP]: { ...inPicture(POST_ART, POST_COUNTER, POST_COUNTER.flap), visit: false },
  [ALLEY_MOUTH_PROP]: inPicture(ALLEY_ART, ALLEY_MOUTH, ALLEY_MOUTH.x),
  [ALLEY_STALL_PROP]: { ...inPicture(ALLEY_ART, ALLEY_STALL, ALLEY_STALL.x), visit: false },
};

// A prop that's part of a town place's picture (`art`): its click area
// is `box` (columns left..right, rows top..bottom) and its spot at x
// `spotX`. (A code-drawn prop's click area is the prop plus a 1px outline
// all round, hence the 1s.)
function inPicture(art, box, spotX) {
  return {
    edge: 'left',
    margin: box.left + 1,
    width: box.right - box.left - 1,
    height: box.bottom - box.top - 1,
    base: art.height - box.bottom,
    visitOffset: spotX - box.left - 1,
  };
}

// How close to the window edges the character's center may wander.
export const WANDER_MARGIN = 6;

// The "!" bubble shown over the character while an event waits: its box
// size and the height of the tail pointing down at the head.
export const EVENT_BUBBLE = { width: 7, height: 9, tail: 2 };

// Gap between the top of the character's head and the bubbles above it,
// leaving room for the tallest hair and the outline. In character pixels.
export const HEAD_CLEARANCE = 5;
