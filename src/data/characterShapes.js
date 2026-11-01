// characterShapes.js — Body proportions per life stage, in sprite pixels.
// head: head width and height; body: torso height; legs: leg height;
// width: torso width; stoop: how far the head leans forward.
// An adult is 20 sprite pixels tall (40 canvas pixels, a third of the scene).

export const CHARACTER_SHAPES = {
  baby: { head: 7, body: 3, legs: 1, width: 6, stoop: 0 },
  child: { head: 8, body: 4, legs: 3, width: 6, stoop: 0 },
  teen: { head: 8, body: 5, legs: 5, width: 7, stoop: 0 },
  adult: { head: 8, body: 6, legs: 6, width: 8, stoop: 0 },
  elder: { head: 8, body: 6, legs: 5, width: 8, stoop: 1 },
};
