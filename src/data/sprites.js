// sprites.js — Sprite sheet info for the pixel-art PNGs in assets/sprites/.
// Pure data: ui/assets.js loads the PNGs at startup and drawing code uses
// a sprite instead of its code-drawn art wherever one exists.
//
// A PNG's name (without .png) is its sprite name; a sprite with no PNG
// falls back to the code-drawn art, so things can be swapped one at a
// time. A single still image needs no entry here: just add the PNG.
//
// Sprite names drawing code looks for:
//   Scenery (scene pixels, SCENE_SCALE in data/layout.js). Outdoors (the
//   Fortune Tree, the Parents' Yard and My Yard; each place shows its own,
//   data/places.js), back to front:
//     sky     Tiled across the window above the grass, its bottom edge
//             on the grass line.
//     grass   Tiled across the bottom of the window, bottom-aligned. Make
//             it at least GROUND_HEIGHT rows tall (taller for tufts).
//     tree    Centered where the code-drawn tree is (the middle of the
//             window, PROPS.tree in data/layout.js), bottom edge one row
//             below the prop's base line. The code-drawn tree plus its
//             1px outline is 20 x 36.
//     goldenApple  The Fortune Tree's golden apple, shown while one is
//             ready: 4 frames of 8 x 6 side by side (center, swung
//             right, center, swung left), picked by the wind
//             (data/fortuneTreeDecor.js), not by time. Drawn at the
//             tree's scale, its middle on APPLE_SPOT in
//             data/fortuneTree.js.
//   The Fortune Tree (data/fortuneTreeDecor.js):
//     fortuneTree.background  The whole background (sky and grass),
//             107 x 80, drawn from the window's bottom-left corner like
//             the Lake's. Without it the Fortune Tree shows sky and grass
//             (code-drawn, or their own sprites). Keep the grass at or
//             above the props' base line (PROP_BASE_FROM_BOTTOM rows up).
//     fortuneTree.well  The wishing well, against the left edge, left of
//             the tree (PROPS['fortuneTree.well'] in data/layout.js),
//             bottom edge one row below the prop's base line; code-drawn
//             with outline 18 x 22. Its click area follows the sprite's
//             visible pixels; keep it clear of the tree.
//     fortuneTree.leaf  A falling golden leaf, 2 frames (the flutter),
//             its top-left on the leaf's position; the first frame also
//             shows while it lies fading on the grass. The code-drawn
//             leaf is 3 x 2, no outline.
//     parents.house  The parents' house in the Parents' Yard, against
//             the right edge (PROPS['parents.house'] in data/layout.js),
//             bottom edge one row below the prop's base line. The
//             code-drawn house plus its 1px outline is 24 x 28; its door
//             is in the middle.
//   The Lake (data/lake.js):
//     lake    The whole background (sky, water, the dock and the shore),
//             drawn from the window's bottom-left corner. Positions in
//             data/lake.js (the dock, the feet row, where the character
//             may walk, the water for the shimmer) are in its pixels.
//             The water shimmer and the dock's click area are drawn and
//             placed in code over it.
//     lake.frog  A frog (data/lakeLife.js), 4 frames side by side: idle,
//             blink, croak (throat puffed), hop. Its bottom edge sits on
//             the lily pad's row (LILY_PADS), column `anchorX` on the
//             frog's middle. The code-drawn frog plus its outline is
//             6 x 5 (6 x 6 hopping).
//     lake.butterfly  A butterfly, 2 frames: wings open, wings closed.
//             Drawn white or gray, it's tinted with each butterfly's
//             color (BUTTERFLIES.colors); or give a color its own art as
//             lake.butterfly.<color> (white, yellow, orange, blue), used
//             as is. Bottom edge on the butterfly's row, `anchorX` on its
//             middle. The code-drawn one is 3 x 3, no outline.
//   The Cafe (data/cafe.js):
//     cafe    The whole room, 107 x 80, drawn from the window's
//             bottom-left corner like the Lake's; positions in
//             data/cafe.js are in its pixels. Without it the room is
//             code-drawn (ui/cafe.js), its counter drawn again over
//             whoever stands behind it.
//   The Farm (data/farm.js):
//     farm.background  The whole background (sky, the three rice
//             paddies, the path, the barn), 107 x 80, drawn from the
//             window's bottom-left corner like the Lake's. Positions in
//             data/farm.js (the paddies' water, the path) are in its
//             pixels. Without it: sky, grass and a code-drawn path and
//             paddies (farm.ground).
//     farm.rice.seedling, farm.rice.young, farm.rice.ripe  The rice in a
//             paddy at each stage, tiled across the paddy's water from
//             its left column, the tile's bottom edge on the water's
//             bottom row (PADDY_WATER); taller tiles reach up above the
//             water. farm.rice.ripe may have frames (the sway, by time).
//     farm.weeds  Weeds in a paddy, drawn once near its middle on the
//             water's bottom row, over the rice.
//     farm.chicken  A chicken (data/farmAnimals.js), facing right
//             (mirrored when facing left), 3 frames side by side: stand,
//             walk (the other leg forward), peck (head down). Its bottom
//             edge on the chicken's feet row, column `anchorX` (or the
//             middle) on its x. The code-drawn one plus its outline is
//             7 x 7.
//   Parallax layers (data/parallax.js): each outdoor picture above can be
//   split into four layers, back to front, each the picture's size
//   (107 x 80, drawn like it from the window's bottom-left corner, see-
//   through where a nearer layer or nothing is), together looking exactly
//   like it:
//     lake.sky, lake.clouds, lake.hills, lake.ground
//     fortuneTree.sky, fortuneTree.clouds, fortuneTree.hills,
//       fortuneTree.ground
//     farm.sky, farm.clouds, farm.hills, farm.ground
//     <place>.sky     The sky, filling the whole picture.
//     <place>.clouds  The clouds: they drift sideways all the time and
//             wrap around at the layer's width, so make its left and
//             right edges meet.
//     <place>.hills   The far hills.
//     <place>.ground  Everything else (water, the dock, paddies, grass);
//             it and everything on it never sway.
//             While the window is dragged the sky, clouds and hills shift
//             a little (gaps at the edge repeat its edge column), and
//             between places each slides by its depth. The four are used
//             only when all of them are there; otherwise the single
//             picture (lake, fortuneTree.background, farm.background) is,
//             with no parallax. Outdoors without a picture (the Yard),
//             sky and grass count as the sky and ground layers.
//   My Yard shows one housing tier (data/housing.js) at a time:
//     yard.sleepingBag  On the grass near the right edge
//             (PROPS['yard.sleepingBag']); code-drawn with outline 24 x 6,
//             pillow on the left. The character lies on it
//             REST_SEATS['yard.sleepingBag'] (data/home.js) scene pixels
//             above its base line.
//     yard.tent   Against the right edge (PROPS['yard.tent']);
//             code-drawn with outline 28 x 20, opening in the middle. The
//             character lies at its base line (REST_SEATS['yard.tent']).
//     yard.house  The character's own house, placed like parents.house
//             (PROPS['yard.house']); code-drawn it looks the same.
//   Home and the Parents' Home (the living room), back to front:
//     home.wall    The back wall, tiled across and upward from the floor
//             line, like sky.
//     home.floor   The floor, tiled across the bottom, like grass. Make it
//             at least GROUND_HEIGHT rows tall.
//     home.window  On the wall, centered (PROPS['home.window']); the
//             code-drawn window plus outline is 24 x 19.
//     home.door    The front door, against the left edge
//             (PROPS['home.door']); code-drawn with outline 16 x 29.
//     home.sofa    Against the right edge (PROPS['home.sofa']); code-drawn
//             with outline 34 x 15. The character lies on it
//             REST_SEATS['home.sofa'] (data/home.js) scene pixels above
//             its base line, so keep the seat at that height.
//   Props are placed like the tree: their outer column against their
//   window edge (or centered), bottom edge one row below the base line.
//   Fishing (data/fishing.js), at CHARACTER_SCALE:
//     fish.<id>  A catch's icon: fish.boot, fish.carp, fish.perch,
//             fish.trout, fish.catfish, fish.salmon, fish.pike,
//             fish.goldenKoi. Shown held up over the head after a catch
//             (its bottom middle on the raised hand), in the fish
//             collection, and drawn big on the catch reveal card (at a
//             whole-number scale that fits; its shape also makes the
//             dark silhouette). The code-drawn fish are 9 x 5 (the boot
//             7 x 6), facing left.
//   Character (character pixels, CHARACTER_SCALE in data/layout.js):
//     character.<body>.<animation>, optionally followed by .<expression>
//     (smile, neutral or frown) for a version that matches the mood,
//     e.g. character.adult.walk or character.adult.idle.frown.
//       body       baby, toddler, child, teen, adult or elder (a
//                  toddler is a baby from CRAWL_UNTIL_AGE until
//                  WALK_FROM_AGE in data/infant.js)
//       animation  idle, walk, sit (baby, toddler), crawl (baby), a goal
//                  activity (read, coins, wave, jog), busk (sitting
//                  under the Fortune Tree playing an instrument), fish
//                  (standing on the dock with the rod; the line, bobber
//                  and catch are drawn over it either way),
//                  rest (lying on the sofa, sleeping bag or in the tent;
//                  drawn raised to the seat), or plant, weed and harvest
//                  (at a rice paddy; harvest swings a sickle)
//     Drawn facing right (mirrored when facing left), with the frame's
//     bottom edge one row below the feet (the outline's row) and column
//     `anchorX` on the character's center. A sprite replaces the whole
//     figure for that animation, including job items and activity props.
//     walk, crawl and jog frames follow the distance walked (one loop per
//     full walk cycle, like the code-drawn legs); the others play by time.
//     parts.<set>.<animation>.<part>  Every pose from baby to elder in
//     layers (sets: baby, toddler, child, teen, adult, elder), recolored
//     to the appearance, with job items, activity arms and props drawn on
//     and one outline around it all (lying: only the head, the adult's;
//     babies and toddlers sleep code-drawn); each animation used only
//     when all its parts are there.
//     Frames, parts, order and colors are in data/characterParts.js.
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
  // The apple: 4 frames of 8 x 6 (center, right, center, left), drawn at
  // the tree's scale like the tree's own pixels. The wind picks the frame.
  goldenApple: { frames: 4, frameWidth: 8 },
  // The Lake's background, 107 x 80: one still frame, at the scene's scale.
  lake: { frames: 1 },
  // The Fortune Tree's background, 107 x 80, likewise; its falling leaf's
  // 2 flutter frames (the leaf's own timing, LEAVES.flutter).
  'fortuneTree.background': { frames: 1 },
  'fortuneTree.leaf': { frames: 2 },
  // The parallax layers (data/parallax.js) are still images like the
  // pictures they split: lake.sky ... farm.ground need no entry.
  // The Lake's wildlife: idle, blink, croak, hop; wings open, closed.
  'lake.frog': { frames: 4 },
  'lake.butterfly': { frames: 2 },
  'lake.butterfly.white': { frames: 2 },
  'lake.butterfly.yellow': { frames: 2 },
  'lake.butterfly.orange': { frames: 2 },
  'lake.butterfly.blue': { frames: 2 },
  // The Farm's chickens: stand, walk, peck.
  'farm.chicken': { frames: 3 },
};
