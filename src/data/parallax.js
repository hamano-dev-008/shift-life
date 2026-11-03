// parallax.js — Numbers and text for the parallax backgrounds: the depth
// layers each outdoor place's background is split into, the clouds'
// drift, the sway while the window is dragged, the pan between places
// and the door's fade. Pure data: ui/parallax.js and ui/scene.js read it.

import { LAKE_PLACE } from './lake.js';
import { TREE_BACKGROUND } from './fortuneTreeDecor.js';
import { FARM_PLACE, FARM_BACKGROUND } from './farm.js';

// The depth layers, back to front. A place's background picture can be
// split into these as sprites named <prefix>.<layer> (each the picture's
// size, 107 x 80, drawn like it from the window's bottom-left corner);
// together they look exactly like the picture. Only when all four are
// there are they used; otherwise the single picture is (or its own
// fallback). The ground layer, and everything standing on it (props,
// wildlife, the character), never sways.
export const PARALLAX_LAYERS = ['sky', 'clouds', 'hills', 'ground'];

// Which background picture (a scenery piece, data/places.js) splits into
// which layer sprites: 'lake' into lake.sky, lake.clouds, lake.hills and
// lake.ground, and so on.
export const LAYERED_BACKGROUNDS = {
  lake: 'lake',
  [TREE_BACKGROUND]: 'fortuneTree',
  [FARM_BACKGROUND]: 'farm',
};

// Code-drawn (or single-sprite) scenery pieces that count as a layer: the
// Yard's sky and grass. Any other piece is part of the ground.
export const PIECE_LAYERS = { sky: 'sky', grass: 'ground' };

// The clouds drift sideways all the time: one scene pixel every
// `secondsPerPixel` seconds, `direction` 1 to the right or -1 to the
// left, in whole screen pixels. They wrap around every layer width.
export const CLOUD_DRIFT = { secondsPerPixel: 3.5, direction: 1 };

// While the window is dragged, the back layers lag behind it: they shift
// the other way, up to `max` scene pixels per layer, by how fast the
// window moves (all the way at `fullSpeed` screen pixels a second; the
// speed is smoothed over `smoothing` seconds). A soft spring (`stiffness`
// and `damping`, per second) carries them there and back to rest once
// the drag slows or stops. Gaps at the window's edge are filled with the
// layer's edge column. Offsets are whole screen pixels.
export const DRAG_SWAY = {
  max: { sky: 1, clouds: 2, hills: 3, ground: 0 },
  fullSpeed: 900,
  smoothing: 0.08,
  stiffness: 70,
  damping: 11,
};

// Walking off a side between outdoor places, the view pans: the place
// left slides out the way the character came from and the next slides in
// from the side they walked out of, each layer by its `share` of the
// window's width (the ground and everything on it a full width, so the
// two grounds meet edge to edge). Layers that move less than a full width
// cross-fade from the old place's to the new one's in `fadeSteps` steps.
// It takes `seconds`, eased in and out; the character walks in once it's
// over, and nothing can be clicked until then.
export const TRAVEL_PAN = {
  seconds: 1.2,
  share: { sky: 0.1, clouds: 0.25, hills: 0.5, ground: 1 },
  fadeSteps: 8,
};

// The places a pan goes between (any other trip, such as the front
// door, fades instead).
export const PAN_PLACES = [LAKE_PLACE, 'fortuneTree', 'yard', 'myYard', FARM_PLACE];

// Through a door (the Yard and Home): the old view fades into the new one
// over `seconds`, in `steps` steps.
export const DOOR_FADE = { seconds: 0.4, steps: 5 };

// The player setting (data/settings.js): Off keeps the backgrounds still
// and switches places at once, as before.
export const PARALLAX_TEXT = { setting: 'Parallax', on: 'On', off: 'Off' };
