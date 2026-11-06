// applePick.js — How picking the golden apple looks (the steps come from
// game/fortuneTree.js): the branches lying under the tree, the long one
// held up and jabbing at the apple, the apple shaking, falling and
// bouncing, then held up high when won, or bursting into golden fairies
// that fly into the wishing well when lost. Everything here follows the
// step and the seconds into it, so nothing needs saving. Numbers and
// colors in data/fortuneTreeDecor.js and data/fortuneTree.js.

import { BRANCHES, PICK_LOOK, FAIRIES, WELL_PROP } from '../data/fortuneTreeDecor.js';
import { PICK, TREE_PROP } from '../data/fortuneTree.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { appleCenter, drawGoldenApple } from './goldenApple.js';
import { propRect } from './scene.js';

// What shows at `t` seconds into `step` (null: walking under the apple):
// { activity (the character's pose: 'reachDown', 'reachUp' or null),
// stick ('ground', 'held', 'jab' (held, poking) or 'dropped'), apple
// ('tree', 'shaking', 'falling', 'ground', 'held' or null), fairies }.
export function pickLook(step, t) {
  switch (step) {
    case 'pickUp':
      return t < PICK.pickUp * PICK_LOOK.reachShare
        ? { activity: 'reachDown', stick: 'ground', apple: 'tree', fairies: false }
        : { activity: 'reachUp', stick: 'held', apple: 'tree', fairies: false };
    case 'poke':
      return { activity: 'reachUp', stick: 'jab', apple: 'shaking', fairies: false };
    case 'fall':
      return { activity: null, stick: 'dropped', apple: 'falling', fairies: false };
    case 'hold':
      return t < PICK_LOOK.grab
        ? { activity: 'reachDown', stick: 'dropped', apple: 'ground', fairies: false }
        : { activity: 'reachUp', stick: 'dropped', apple: 'held', fairies: false };
    case 'fairies':
      return { activity: null, stick: 'dropped', apple: null, fairies: true };
    default:
      return { activity: null, stick: 'ground', apple: 'tree', fairies: false };
  }
}

// Canvas x where the character stands to pick: PICK.standOff scene
// pixels to PICK.side of the apple, and the way they face (toward it).
// Null without a tree.
export function pickSpot(layout) {
  const apple = appleCenter(layout);
  if (!apple) return null;
  const side = PICK.side === 'left' ? -1 : 1;
  return { x: apple.x + side * PICK.standOff * layout.scale, facing: -side };
}

// The long branch's middle where it lies at first: under the apple.
function branchHomeX(layout) {
  const apple = appleCenter(layout);
  return apple ? apple.x + BRANCHES.long.dx * layout.scale : null;
}

// A branch lying down, `length` pixels: a thin stick bent a row in the
// middle, lit here and there, with a twig sticking up near one end
// (cached per length).
const branchLayers = new Map();
function branchLayer(length) {
  if (!branchLayers.has(length)) {
    const layer = createLayer(length + 2, 5);
    const { wood, light } = BRANCHES.colors;
    const bend = Math.floor(length / 2);
    fill(layer, 1, 3, bend, 1, wood);
    fill(layer, 1 + bend, 2, length - bend, 1, wood);
    for (let col = 2; col < length; col += 4) fill(layer, col + 1, col < bend ? 3 : 2, 1, 1, light);
    const twig = Math.max(1, length - 3);
    fill(layer, twig + 1, 1, 1, 1, wood);
    outline(layer, OUTLINE_COLOR);
    branchLayers.set(length, layer);
  }
  return branchLayers.get(length);
}

function drawBranch(ctx, layout, middleX, row, length) {
  const { scale } = layout;
  const layer = branchLayer(length);
  const left = Math.round(middleX / scale - layer.width / 2) * scale;
  drawLayer(ctx, layer, left, layout.feetY + (row + 1) * scale, scale);
}

// The branches in the grass (behind the character): the twigs around the
// trunk and the long one at `longX` (its middle; null: under the apple),
// unless it's in the character's hand (`longHeld`).
export function drawBranches(ctx, layout, { longX = null, longHeld = false } = {}) {
  const tree = propRect(layout, TREE_PROP);
  if (!tree) return;
  const middle = tree.left + tree.width / 2;
  for (const twig of BRANCHES.twigs) drawBranch(ctx, layout, middle + twig.dx * layout.scale, twig.row, twig.length);
  if (!longHeld) drawBranch(ctx, layout, longX ?? branchHomeX(layout), BRANCHES.long.row, BRANCHES.long.length);
}

// The long branch held up from `hand` (raisedHand() in ui/sprite.js) to
// the apple, in whole character pixels with an outline: the hand (in
// `skin`) grips it part way along, its tip under the apple; jabbing
// (`poking` seconds in), the tip pulls back between jabs.
export function drawHeldBranch(ctx, layout, hand, skin, poking = null) {
  const apple = appleCenter(layout);
  if (!apple) return;
  const unit = hand.unit;
  const length = Math.round((BRANCHES.long.length * layout.scale) / unit);
  const target = { x: apple.x, y: apple.y + apple.half / 2 };
  const dx = target.x - hand.x;
  const dy = target.y - hand.y;
  const distance = Math.hypot(dx, dy) || 1;
  const dir = { x: dx / distance, y: dy / distance };
  const back = poking !== null && Math.floor(poking / PICK.pokeBeat) % 2 === 1 ? PICK_LOOK.pullBack * unit : 0;
  const tip = { x: target.x - dir.x * back, y: target.y - dir.y * back };
  // On the hand's pixel grid, from the tip down along the branch.
  const originX = hand.x - unit / 2;
  const originY = hand.y - unit / 2;
  const cells = new Map();
  for (let i = 0; i <= length; i++) {
    const col = Math.round((tip.x - dir.x * i * unit - originX) / unit);
    const row = Math.round((tip.y - dir.y * i * unit - originY) / unit);
    cells.set(`${col},${row}`, [col, row]);
  }
  const at = ([col, row], color) => {
    ctx.fillStyle = color;
    ctx.fillRect(originX + col * unit, originY + row * unit, unit, unit);
  };
  for (const [col, row] of cells.values()) {
    for (const [c, r] of [[col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1]]) {
      if (!cells.has(`${c},${r}`)) at([c, r], OUTLINE_COLOR);
    }
  }
  for (const cell of cells.values()) at(cell, BRANCHES.colors.wood);
  // The hand over it.
  at([0, 0], skin);
}

// Where the apple lands: on the grass straight under where it hung.
function groundApple(layout) {
  const apple = appleCenter(layout);
  return { x: apple.x, y: layout.feetY + layout.scale - apple.half };
}

// The apple off the tree (`look.apple` from pickLook(), `t` seconds into
// the step): falling and bouncing, on the grass, or held up over `hand`.
export function drawPickedApple(ctx, layout, look, t, seconds, hand) {
  const apple = appleCenter(layout);
  if (!apple) return;
  const ground = groundApple(layout);
  if (look.apple === 'falling') {
    const u = Math.min(1, t / PICK.fall);
    const drop = 1 - PICK_LOOK.bounceShare;
    let y;
    if (u < drop) {
      y = apple.y + (ground.y - apple.y) * (u / drop) ** 2;
    } else {
      const b = (u - drop) / PICK_LOOK.bounceShare;
      y = ground.y - Math.sin(b * Math.PI) * PICK_LOOK.bounce * layout.scale;
    }
    drawGoldenApple(ctx, layout, seconds, 0, { x: ground.x, y: Math.round(y) });
  } else if (look.apple === 'ground') {
    drawGoldenApple(ctx, layout, seconds, 0, ground);
  } else if (look.apple === 'held' && hand) {
    // Resting on the hand, clear of the head.
    const y = hand.y - hand.unit * 2 - apple.half;
    drawGoldenApple(ctx, layout, seconds, 0, { x: Math.round(hand.x), y: Math.round(y) });
  }
}

// A repeatable 0-1 number for fairy `i`'s own path.
function share(i, salt) {
  const value = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

// A fairy, 3 x 3: wings up, then down.
const FAIRY_FRAMES = [['w.w', 'wbw', '.b.'], ['...', 'wbw', 'wbw']];
const fairyLayers = [];
function fairyLayer(frame) {
  if (!fairyLayers[frame]) {
    const layer = createLayer(3, 3);
    const { body, wing } = FAIRIES.colors;
    FAIRY_FRAMES[frame].forEach((line, row) => [...line].forEach((char, col) => {
      if (char !== '.') fill(layer, col, row, 1, 1, char === 'b' ? body : wing);
    }));
    fairyLayers[frame] = layer;
  }
  return fairyLayers[frame];
}

function dot(ctx, layout, x, y, color) {
  const { scale } = layout;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x / scale) * scale, Math.round(y / scale) * scale, scale, scale);
}

// The well's mouth in canvas pixels, or null without the well.
function wellMouth(layout) {
  const well = propRect(layout, WELL_PROP);
  if (!well) return null;
  return { x: well.left + well.width * FAIRIES.mouth.x, y: well.top + well.height * FAIRIES.mouth.y };
}

// `t` seconds into a lost apple's end: the burst where it landed, then
// the fairies flying off in arcs into the wishing well (or just up and
// away if there's no well).
export function drawFairies(ctx, layout, t) {
  const { scale } = layout;
  const from = groundApple(layout);
  const { burst } = FAIRIES;
  if (t < burst.seconds) {
    const r = (t / burst.seconds) * burst.radius * scale;
    for (let i = 0; i < burst.dots; i++) {
      const angle = (i / burst.dots) * 2 * Math.PI;
      dot(ctx, layout, from.x + Math.cos(angle) * r, from.y + Math.sin(angle) * r * 0.6, FAIRIES.colors.sparkle);
    }
  }
  const to = wellMouth(layout) ?? { x: from.x, y: -20 * scale };
  for (let i = 0; i < FAIRIES.count; i++) {
    const u = (t - burst.seconds * 0.5 - i * FAIRIES.stagger) / FAIRIES.fly;
    if (u < 0) continue;
    // In: a glint at the well's mouth for a moment.
    if (u >= 1) {
      if (u < 1 + FAIRIES.flap * 2 / FAIRIES.fly) dot(ctx, layout, to.x, to.y, FAIRIES.colors.wing);
      continue;
    }
    const start = { x: from.x + (share(i, 1) - 0.5) * 6 * scale, y: from.y };
    const [low, high] = FAIRIES.rise;
    const peak = Math.min(start.y, to.y) - (low + (high - low) * share(i, 2)) * scale;
    const mid = { x: (start.x + to.x) / 2, y: peak };
    // A curve from where it burst, up over, and down into the well.
    const x = (1 - u) ** 2 * start.x + 2 * (1 - u) * u * mid.x + u ** 2 * to.x;
    const y = (1 - u) ** 2 * start.y + 2 * (1 - u) * u * mid.y + u ** 2 * to.y
      + Math.sin(t * 9 + i * 2) * FAIRIES.wobble * scale;
    const layer = fairyLayer(Math.floor(t / FAIRIES.flap + i) % 2);
    drawLayer(ctx, layer, Math.round(x / scale - 1) * scale, Math.round(y / scale + 1) * scale, scale);
    // A glint trailing behind now and then.
    if (Math.floor(t / FAIRIES.flap + i) % 3 === 0) dot(ctx, layout, x + (to.x > start.x ? -2 : 2) * scale, y, FAIRIES.colors.sparkle);
  }
}
