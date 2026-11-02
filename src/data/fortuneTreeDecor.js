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
