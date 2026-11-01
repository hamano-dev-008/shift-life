// layout.js — Sizes and positions in the scene. Units are canvas pixels
// (the 160x120 canvas CSS scales 2x) unless noted as sprite pixels.

export const SCENE_WIDTH = 160;
export const SCENE_HEIGHT = 120;
export const GROUND_TOP = 96;

// Canvas row the character's feet rest on, in front of the props.
export const FEET_Y = 110;

// The character and props are drawn on their own low-res grid ("sprite
// pixels") and scaled up by this whole number with nearest-neighbour.
export const SPRITE_SCALE = 2;

// x / baseY: canvas position of the prop's left edge and bottom.
// width / height: the prop's size in sprite pixels.
// visitX: canvas x where the character stops when visiting it.
export const PROPS = {
  house: { x: 2, baseY: 102, width: 22, height: 26, visitX: 24 },
  tree: { x: 120, baseY: 102, width: 18, height: 34, visitX: 138 },
};

// How far left and right the character's center may wander.
export const WANDER_MIN_X = 14;
export const WANDER_MAX_X = SCENE_WIDTH - 14;
