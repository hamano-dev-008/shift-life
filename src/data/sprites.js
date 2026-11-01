// sprites.js — Sprite sheet info for the pixel-art PNGs in assets/sprites/.
// Pure data: ui/assets.js loads the PNGs at startup and drawing code uses
// a sprite instead of its code-drawn art wherever one exists.
//
// A PNG's name (without .png) is its sprite name; a sprite with no PNG
// falls back to the code-drawn art, so things can be swapped one at a
// time. A single still image needs no entry here: just add the PNG.
//
// Sprite names drawing code looks for:
//   Scenery (scene pixels, SCENE_SCALE in data/layout.js), back to front:
//     sky     Tiled across the window above the grass, its bottom edge
//             on the grass line.
//     grass   Tiled across the bottom of the window, bottom-aligned. Make
//             it at least GROUND_HEIGHT rows tall (taller for tufts).
//     tree    Centered where the code-drawn tree is (the middle of the
//             window, PROPS.tree in data/layout.js), bottom edge one row
//             below the prop's base line. The code-drawn tree plus its
//             1px outline is 20 x 36.
//     goldenApple  The Fortune Tree's golden apple, shown while one is
//             ready. Drawn at the tree's scale (or its own `scale`), its
//             middle pixel on APPLE_SPOT in data/fortuneTree.js.
//   Character (character pixels, CHARACTER_SCALE in data/layout.js):
//     character.<body>.<animation>, optionally followed by .<expression>
//     (smile, neutral or frown) for a version that matches the mood,
//     e.g. character.adult.walk or character.adult.idle.frown.
//       body       baby, toddler, child, teen, adult or elder (a
//                  toddler is a baby from CRAWL_UNTIL_AGE until
//                  WALK_FROM_AGE in data/infant.js)
//       animation  idle, walk, sit (baby, toddler), crawl (baby), a goal
//                  activity (read, coins, wave, jog), or busk (sitting
//                  under the Fortune Tree playing an instrument)
//     Drawn facing right (mirrored when facing left), with the frame's
//     bottom edge one row below the feet (the outline's row) and column
//     `anchorX` on the character's center. A sprite replaces the whole
//     figure for that animation, including job items and activity props.
//     walk, crawl and jog frames follow the distance walked (one loop per
//     full walk cycle, like the code-drawn legs); the others play by time.
//
// Entries are keyed by sprite name. Each field is optional:
//   frames         Frames side by side in one row, left to right
//                  (default 1, a still image).
//   frameWidth     Width of one frame in pixels (default: image width /
//                  frames).
//   frameHeight    Height of a frame (default: image height).
//   frameDuration  Seconds each frame shows, for time-played animations
//                  (default DEFAULT_FRAME_DURATION).
//   anchorX        Character sprites only: the column of the character's
//                  center (default: the middle of the frame).
//   scale          Screen pixels per sprite pixel, a whole number, to draw
//                  this sprite bigger or smaller than the rest (default:
//                  SCENE_SCALE for scenery, CHARACTER_SCALE for the
//                  character). It stays anchored the same way: a prop
//                  keeps its edge and base, the character its feet.
//
// Example, once grass.png has 4 frames of 32 x 18 side by side:
//   grass: { frames: 4, frameWidth: 32, frameDuration: 0.5 },

export const DEFAULT_FRAME_DURATION = 0.2;

export const SPRITES = {
  // The tree art is small for a tree; drawn bigger (5 vs the scene's 3)
  // so it stands tall in the middle of the scene.
  tree: { scale: 5 },
  // The apple art is 40 x 40, finely drawn: at the tree's scale it would
  // be bigger than the tree, so it's drawn 1:1.
  goldenApple: { scale: 1 },
};
