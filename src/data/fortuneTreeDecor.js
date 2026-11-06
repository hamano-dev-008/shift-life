// fortuneTreeDecor.js — Numbers, colors and text for the Fortune Tree
// place's decoration: its background picture slot, the wishing well, the
// golden leaves falling from the tree and the sparkles around a ready
// golden apple. Pure data: ui/scene.js, ui/treeDecor.js and
// ui/treeDecorArt.js read it. Positions are in scene pixels.

// The background picture (assets/sprites/fortuneTree.background.png,
// 107 x 80, drawn from the window's bottom-left corner like the Lake's).
// Without it, these code-drawn pieces (or their own sprites) show instead.
export const TREE_BACKGROUND = 'fortuneTree.background';
export const TREE_BACKGROUND_FALLBACK = ['sky', 'grass'];

// The wishing well: a prop (data/layout.js) against the left edge, left
// of the tree, its base on the props' ground line. Code-drawn at
// SCENE_SCALE (plus a 1px outline), or the fortuneTree.well sprite.
// Clicking it shows `bubble` over it for `bubbleSeconds` (a coin toss
// for luck comes later). The character never wanders over to visit it.
export const WELL_PROP = 'fortuneTree.well';
export const WELL = { margin: 4, width: 16, height: 20, visitOffset: 8 };
export const WELL_TEXT = {
  title: 'Wishing well',
  bubble: 'A coin for luck? Coming soon!',
};
export const WELL_BUBBLE_SECONDS = 2.5;

// The well's code-drawn colors.
export const WELL_COLORS = {
  stone: '#b8b2bf',
  stoneLight: '#d6d1db',
  stoneDark: '#8f8899',
  water: '#3f5f7a',
  waterShine: '#7fb2d4',
  wood: '#9a6a45',
  woodDark: '#6e4630',
  roof: '#c8645c',
  roofDark: '#a24f49',
  rope: '#e3cfa8',
  bucket: '#8b5a3c',
  band: '#5a5560',
};

// Golden leaves falling from the canopy. A new one every `every` seconds
// (random between), at most `max` at once. They start somewhere in
// `canopy` (fractions of the tree's drawn box: 0 left/top, 1 right/
// bottom), fall `fallSpeed` scene pixels a second while swaying
// `sway.amplitude` pixels side to side every `sway.period` seconds,
// flutter between their 2 frames every `flutter` seconds, land on a row
// `landRows` above the window's bottom (on the grass), lie there and fade
// out over `fade` seconds in `fadeSteps` steps. About one in
// 1/sparkleChance sparkles as it falls (a glint every `sparkleEvery`
// seconds). Code-drawn 3 x 2 pixels, or the fortuneTree.leaf sprite
// (2 frames).
export const LEAVES = {
  every: [3, 7],
  firstIn: [0.5, 2.5],
  max: 4,
  canopy: { left: 0.15, right: 0.85, top: 0.12, bottom: 0.55 },
  fallSpeed: [4, 6.5],
  sway: { amplitude: [1.5, 3], period: [1.8, 2.8] },
  flutter: 0.3,
  landRows: [5, 11],
  fade: 2.5,
  fadeSteps: 4,
  sparkleChance: 0.1,
  sparkleEvery: 0.5,
};
export const LEAF_COLORS = { leaf: '#f2c14e', dark: '#d29a2a', sparkle: '#fffbe0' };

// While the golden apple is ready, `count` soft sparkles twinkle around
// it, each up to `radius` scene pixels out from the apple's edge: one cycle
// of `cycle` seconds (a dot, a little cross, a dot, then nothing for the
// rest), then it moves somewhere else; staggered so they don't all
// twinkle together.
export const APPLE_SPARKLES = {
  count: 3,
  radius: 4,
  cycle: 1.6,
  shine: 0.6,
  colors: ['#fffbe0', '#f7d77f'],
};

// The wind at the Fortune Tree, purely visual (not saved). Mostly calm:
// a gust comes every `gustEvery` real seconds (random between; the first
// `firstGustIn` after the tree is shown) and blows `gustLength` seconds,
// from the left or the right at random. During a gust the golden apple
// swings through its 4 frames (center, right, center, left) every
// `swingFrame` seconds, then settles back on a center frame; falling
// leaves drift `leafPush` more scene pixels a second in the wind's
// direction.
export const WIND = {
  gustEvery: [10, 25],
  firstGustIn: [4, 12],
  gustLength: [2, 4],
  swingFrame: 0.3,
  leafPush: 9,
};

// The golden apple's frames, in the goldenApple sprite's order: still in
// calm air, then the swing. The code-drawn apple shifts `codeShift` tree
// pixels sideways for each frame instead.
export const APPLE_SWING = {
  frames: ['center', 'right', 'center', 'left'],
  codeShift: [0, 1, 0, -1],
};

// The soft glow behind a ready golden apple: `rings` of warm gold, each
// a disc of whole tree-sized pixels `radius` tree pixels from the apple's
// middle, drawn outermost first at `alpha` (they overlap, so it's
// strongest near the apple). It pulses: the alphas are multiplied by a
// level going between pulse.low and pulse.high and back every
// pulse.period seconds, in pulse.steps steps (so it stays pixel art).
// Picking the apple (won or missed) flashes it: flash.boost times as
// bright, fading in flash.steps steps over flash.seconds, with the apple
// still shown until it's done.
export const APPLE_GLOW = {
  color: '#ffe26e',
  rings: [
    { radius: 8, alpha: 0.1 },
    { radius: 6.5, alpha: 0.14 },
    { radius: 5, alpha: 0.2 },
  ],
  pulse: { period: 2, low: 0.65, high: 1.25, steps: 5 },
  flash: { seconds: 0.4, boost: 3.2, steps: 3 },
};

// Dev menu notes for the decoration.
export const TREE_DECOR_TEXT = {
  notHere: 'Only at the Fortune Tree.',
};

// Branches lying in the grass under the tree, code-drawn at SCENE_SCALE
// with an outline. Each is `length` scene pixels long, its middle `dx`
// scene pixels from the tree's middle (the long one: from the golden
// apple's), lying `row` rows below the character's feet row (negative is
// further back). The long one is what the character picks up to poke the
// apple down; once done they drop it where they stand, and it lies there
// until the Fortune Tree is shown again.
export const BRANCHES = {
  twigs: [
    { dx: -14, row: -1, length: 5 },
    { dx: 30, row: -1, length: 7 },
  ],
  long: { dx: -2, row: 0, length: 20 },
  colors: { wood: '#8b5a3c', light: '#b07a4f' },
};

// How picking the golden apple looks (its steps and times are PICK in
// data/fortuneTree.js): reaching down for the branch over the first
// `reachShare` of picking it up, the branch's tip pulling back `pullBack`
// character pixels between jabs (each PICK.pokeBeat), the apple bouncing
// `bounce` scene pixels over the last `bounceShare` of its fall, and
// `grab` seconds reaching down for a won apple before holding it up.
export const PICK_LOOK = { reachShare: 0.6, pullBack: 3, bounce: 3, bounceShare: 0.3, grab: 0.5 };

// A lost apple bursts (a ring of `burst.dots` sparkles spreading
// `burst.radius` scene pixels over `burst.seconds`) into `count` golden
// fairies. Each sets off `stagger` seconds after the one before, flies
// `fly` seconds in an arc rising `rise` scene pixels (random between)
// above the higher end, bobbing `wobble` pixels, wings beating every
// `flap` seconds, and dives into the wishing well's mouth (`mouth`:
// fractions of the well's drawn box). Code-drawn 3 x 3 at SCENE_SCALE.
export const FAIRIES = {
  count: 5,
  burst: { dots: 8, radius: 6, seconds: 0.4 },
  stagger: 0.2,
  fly: 2.4,
  rise: [3, 8],
  wobble: 1.5,
  flap: 0.1,
  mouth: { x: 0.5, y: 0.62 },
  colors: { body: '#f2c14e', wing: '#fffbe0', sparkle: '#ffe26e' },
};

// The wishing well glows as the fairies dive in: `rings` of `color` discs
// of whole scene pixels `radius` from a point `lift` scene pixels above
// the well's mouth (FAIRIES.mouth: over the opening, not the stones),
// outermost first at `alpha` times the level. Each fairy in brightens it
// a step (a share of the fairies), and once the last is in it holds
// `hold` seconds and fades out over `fade` seconds in `fadeSteps` steps.
export const WELL_GLOW = {
  color: '#ffe26e',
  lift: 3,
  rings: [
    { radius: 9, alpha: 0.16 },
    { radius: 6.5, alpha: 0.24 },
    { radius: 4, alpha: 0.36 },
  ],
  hold: 0.8,
  fade: 1.6,
  fadeSteps: 4,
};
