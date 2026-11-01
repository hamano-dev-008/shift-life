// characterShapes.js — Body proportions per life stage, in character pixels
// (see data/layout.js). head: head width and height; body: torso height;
// legs: leg height; width: torso width; stoop: how far the head leans
// forward. An adult is 20 character pixels tall, plus hair.
//
// `toddler` isn't a life stage: it's the baby's body while toddling (see
// data/infant.js), with longer legs so the little steps show.

export const CHARACTER_SHAPES = {
  baby: { head: 7, body: 3, legs: 1, width: 6, stoop: 0 },
  toddler: { head: 7, body: 4, legs: 2, width: 6, stoop: 0 },
  child: { head: 8, body: 4, legs: 3, width: 6, stoop: 0 },
  teen: { head: 8, body: 5, legs: 5, width: 7, stoop: 0 },
  adult: { head: 8, body: 6, legs: 6, width: 8, stoop: 0 },
  elder: { head: 8, body: 6, legs: 5, width: 8, stoop: 1 },
};

// Crawling, the torso (`width` long, `body` thick) lies flat on arms and
// legs `limbs` rows tall, with the head raised so its top is `headAbove`
// rows above the torso's top. The torso starts `back` pixels behind the
// character's center; the knees trail `shin` pixels of lower leg behind.
export const CRAWL_POSE = { limbs: 2, headAbove: 5, back: 5, shin: 2 };

// Sitting, the legs stretch this many pixels forward from under the
// torso's front edge, ending in toes pointing up.
export const SIT_POSE = { legs: 4 };
