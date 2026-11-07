// storeLifeArt.js — Draws the 6-Eleven's life (ui/storeLife.js): the
// clerk behind the register and the shoppers with the character art
// (drawCharacter(), at CHARACTER_SCALE), the scanner's red beam while
// someone pays, the clerk's yawn, and the pigeon on the sidewalk outside
// (code-drawn at SCENE_SCALE with an outline). The pigeon goes in first
// (the glass's shine over it), then the clerk, the counter's front over
// them (ui/store.js), then the shoppers (drawStoreLifeFront()).

import {
  STORE_ART, STORE_COUNTER, STORE_SIDEWALK, STORE_CLERK, STORE_PIGEON, STORE_REGISTER_X, STORE_ITEM_COLORS,
} from '../data/store.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { drawCharacter } from './sprite.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { personPose, pictureRowY } from './people.js';
import { isWalking } from './storeLife.js';

const rowY = (layout, row) => pictureRowY(layout, STORE_ART.height, row);

// Pure art: the scanner's beam and the yawn's puff.
const BEAM = '#ff3b3b';
const PUFF = '#ffffff';

function dot(ctx, layout, col, row, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(col) * layout.scale, rowY(layout, Math.round(row)), layout.scale, layout.scale);
}

// The clerk behind the register (their legs hidden by the counter's
// front, drawn next): stretching an arm up mid-yawn, holding out the
// scanner while someone pays.
export function drawClerk(ctx, layout, life) {
  const { clerk } = life;
  const activity = clerk.state === 'yawn' ? 'reachUp' : clerk.state === 'scan' ? 'hold' : null;
  const pose = personPose(layout, clerk, { stage: STORE_CLERK.stage, activity, time: life.time, seed: 0, walking: false });
  const groundY = rowY(layout, STORE_COUNTER.behindRow);
  drawCharacter(ctx, pose, STORE_CLERK.stage, STORE_CLERK.look, 'smile', groundY, layout.characterScale, STORE_CLERK.item);
  // A little puff over the head mid-yawn.
  if (clerk.state === 'yawn' && clerk.t > 0.3) {
    const row = STORE_COUNTER.behindRow - 17 - Math.floor(clerk.t * 2);
    dot(ctx, layout, clerk.x - 2, row, PUFF);
    dot(ctx, layout, clerk.x - 3, row - 1, PUFF);
  }
}

// The scanner's beam flicking over the counter while someone pays.
function drawScan(ctx, layout, life) {
  if (life.clerk.state !== 'scan' || Math.floor(life.clerk.t * 6) % 3 === 0) return;
  for (let i = -3; i <= 1; i++) dot(ctx, layout, STORE_REGISTER_X - 6 + i, STORE_COUNTER.top - 1, BEAM);
}

// The shoppers (in front of the counter's front) and the scanner's beam.
export function drawStoreLifeFront(ctx, layout, life) {
  drawScan(ctx, layout, life);
  const groundY = rowY(layout, STORE_ART.height - 8);
  for (const shopper of life.shoppers) {
    const activity = shopper.step === 'browse' && shopper.reach ? 'reachUp' : shopper.step === 'pay' ? 'hold' : null;
    const pose = personPose(layout, shopper, {
      stage: shopper.stage, activity, time: life.time, seed: shopper.id, walking: isWalking(shopper),
    });
    drawCharacter(ctx, pose, shopper.stage, shopper.look, 'smile', groundY, layout.characterScale);
  }
}

// What the character has in hand at `hand` (heldHand()), `t` seconds in:
// an onigiri in its wrapper, an ice cream cone, a can, or a scratch card
// with its silver patch flickering as it's scratched.
export function drawHeldItem(ctx, hand, item, t) {
  const u = hand.unit;
  const { main, wrap } = STORE_ITEM_COLORS[item];
  const x = hand.x - u / 2 + hand.facing * u;
  const at = (dx, dy, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + (hand.facing < 0 ? -dx - w + 1 : dx) * u, hand.y - u / 2 + dy * u, w * u, h * u);
  };
  if (item === 'onigiri') {
    at(0, -2, 1, 1, main);
    at(-1, -1, 3, 1, main);
    at(-1, 0, 3, 1, wrap);
  } else if (item === 'iceCream') {
    at(-1, -2, 2, 2, main);
    at(0, 0, 1, 2, wrap);
  } else if (item === 'energyDrink') {
    at(0, -2, 2, 3, main);
    at(0, -1, 2, 1, wrap);
  } else {
    at(0, -2, 3, 2, main);
    at(Math.floor(t * 6) % 2, -2, 1, 1, wrap);
  }
}

// The pigeon, facing right (flipped to face left): b body, d dark (head,
// tail), n the green neck sheen, k beak, f feet. Standing, a step with
// its head bobbed forward, pecking, and flapping.
const PIGEON_FRAMES = {
  stand: ['....dd.', '...ddk.', '.bbbn..', 'dbbbb..', '..f.f..'],
  step: ['.....dd', '....ddk', '.bbbn..', 'dbbbb..', '...ff..'],
  peck: ['.......', '.......', '.bbbndd', 'dbbbbdk', '..f.f..'],
  flap: ['.b..b..', '..bbddk', '.bbbn..', 'dbbb...', '.......'],
};
const pigeonLayers = new Map();
function pigeonLayer(frame) {
  if (!pigeonLayers.has(frame)) {
    const rows = PIGEON_FRAMES[frame];
    const { body, dark, neck, beak, feet } = STORE_PIGEON.colors;
    const colors = { b: body, d: dark, n: neck, k: beak, f: feet };
    const layer = createLayer(rows[0].length + 2, rows.length + 2);
    rows.forEach((line, row) => [...line].forEach((char, col) => {
      if (char !== '.') fill(layer, col + 1, row + 1, 1, 1, colors[char]);
    }));
    outline(layer, OUTLINE_COLOR);
    pigeonLayers.set(frame, layer);
  }
  return pigeonLayers.get(frame);
}

function pigeonFrame(pigeon) {
  if (pigeon.state === 'fly') return Math.floor(pigeon.t * 10) % 2 ? 'flap' : 'stand';
  if (pigeon.state === 'peck') return Math.floor(pigeon.t * 3) % 2 ? 'peck' : 'stand';
  if (pigeon.state === 'walk') return Math.floor(pigeon.t / STORE_PIGEON.bob) % 2 ? 'step' : 'stand';
  return 'stand';
}

// The pigeon outside, behind the glass (the shine goes over it next).
export function drawPigeon(ctx, layout, life) {
  const { pigeon } = life;
  if (pigeon.state === 'away') return;
  const layer = pigeonLayer(pigeonFrame(pigeon));
  const { scale } = layout;
  const bottom = rowY(layout, STORE_SIDEWALK.row - Math.round(pigeon.rise)) + 2 * scale;
  drawLayer(ctx, layer, Math.round(pigeon.x) * scale, bottom, scale, {
    anchorCol: Math.floor(layer.width / 2), flip: pigeon.facing < 0,
  });
}

// Draws only the clerk or the pigeon (`id`), for the hover outline's
// silhouette: the clerk only above the counter. Returns the screen pixels
// per pixel of its art.
export function drawStoreCritter(ctx, layout, life, id) {
  if (id === 'clerk') {
    drawClerk(ctx, layout, life);
    const top = rowY(layout, STORE_COUNTER.top);
    ctx.clearRect(0, top, layout.width, layout.height - top);
    return layout.characterScale;
  }
  drawPigeon(ctx, layout, life);
  return layout.scale;
}
