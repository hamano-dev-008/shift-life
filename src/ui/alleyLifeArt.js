// alleyLifeArt.js — Draws Mural Alley's life (ui/alleyLife.js): the
// painter and the visitors with the character art (drawCharacter(), at
// CHARACTER_SCALE), the painter's spray can and its puffs, Rio the parrot
// (code-drawn at SCENE_SCALE with an outline), the easels' canvases
// filling in as they're painted, and a brush or a print in hand.

import {
  ALLEY_ART, ALLEY_PERCH, ALLEY_PAINTER, ALLEY_PARROT, EASEL_CANVAS_TOP,
} from '../data/alley.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { drawCharacter, raisedHand } from './sprite.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { personPose, pictureRowY } from './people.js';

const rowY = (layout, row) => pictureRowY(layout, ALLEY_ART.height, row);

// Pure art: the spray paint's colors, the brush, and a painting's.
const SPRAY = ['#e2403a', '#3b7dd8', '#f2d94e', '#e07a9f'];
const CAN = '#c0c4cc';
const HANDLE = '#8c6a4f';
const BRISTLES = '#3b7dd8';
const PAINTING_COLORS = { s: '#7fb8e0', y: '#f2a33a', g: '#6aa85a', b: '#2f7fb0', w: '#f4efe6' };

// A little painting (7 x 8, the canvas's pixels), filled in a stroke at a
// time in PAINT_ORDER.
const PAINTING = ['sssssss', 'syysssw', 'syysssw', 'sssssss', 'gggssgg', 'ggggggg', 'bbbbbbb', 'bbwbbwb'];
const CANVAS_W = 7;
const CANVAS_H = 8;
const PAINT_ORDER = Array.from({ length: CANVAS_W * CANVAS_H }, (_, i) => (i * 17) % (CANVAS_W * CANVAS_H));

// The canvas on the easel whose middle is at x `easelX`, `progress` (0-1)
// of it painted.
export function drawAlleyCanvas(ctx, layout, easelX, progress) {
  const { scale } = layout;
  const left = (easelX - 3) * scale;
  const top = rowY(layout, EASEL_CANVAS_TOP);
  const shown = Math.floor(Math.min(1, Math.max(0, progress)) * PAINT_ORDER.length);
  for (const cell of PAINT_ORDER.slice(0, shown)) {
    const col = cell % CANVAS_W;
    const row = Math.floor(cell / CANVAS_W);
    ctx.fillStyle = PAINTING_COLORS[PAINTING[row][col]];
    ctx.fillRect(left + col * scale, top + row * scale, scale, scale);
  }
}

// A brush held at `hand` (heldHand()), its tip toward the easel.
export function drawHeldBrush(ctx, hand, time) {
  const u = hand.unit;
  const dab = Math.floor(time * 3) % 2;
  const x = hand.x + hand.facing * u * 0.5;
  ctx.fillStyle = HANDLE;
  ctx.fillRect(Math.min(x, x + hand.facing * 3 * u), hand.y - u * (1 + dab), 3 * u, u);
  ctx.fillStyle = BRISTLES;
  ctx.fillRect(x + hand.facing * 3 * u - (hand.facing < 0 ? u : 0), hand.y - u * (1 + dab), u, u);
}

// A print held up at `hand`: a little framed picture.
export function drawHeldPrint(ctx, hand) {
  const u = hand.unit;
  const left = hand.x - u / 2 + (hand.facing < 0 ? -3 * u : 0);
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect(left - u, hand.y - 5 * u, 6 * u, 6 * u);
  ctx.fillStyle = HANDLE;
  ctx.fillRect(left, hand.y - 4 * u, 4 * u, 4 * u);
  ctx.fillStyle = PAINTING_COLORS.s;
  ctx.fillRect(left + u, hand.y - 3 * u, 2 * u, u);
  ctx.fillStyle = PAINTING_COLORS.y;
  ctx.fillRect(left + u, hand.y - 2 * u, u, u);
  ctx.fillStyle = PAINTING_COLORS.g;
  ctx.fillRect(left + 2 * u, hand.y - 2 * u, u, u);
}

// The painter (spraying with an arm up, puffs of paint drifting off the
// can) and the visitors.
export function drawAlleyPeople(ctx, layout, life) {
  const groundY = rowY(layout, ALLEY_ART.height - 8);
  const { painter } = life;
  const spraying = painter.state === 'spray';
  const pose = personPose(layout, painter, {
    stage: ALLEY_PAINTER.stage, activity: spraying ? 'reachUp' : null, time: life.time, seed: 0,
  });
  drawCharacter(ctx, pose, ALLEY_PAINTER.stage, ALLEY_PAINTER.look, 'smile', groundY, layout.characterScale, ALLEY_PAINTER.item);
  if (spraying) {
    const hand = raisedHand(ALLEY_PAINTER.stage, pose, groundY, layout.characterScale);
    const u = hand.unit;
    ctx.fillStyle = CAN;
    ctx.fillRect(hand.x - u / 2, hand.y - 2 * u, u, 2 * u);
    const step = Math.floor(painter.t / ALLEY_PAINTER.puffEvery);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = SPRAY[(step + i) % SPRAY.length];
      ctx.fillRect(hand.x + hand.facing * (2 + i) * u - u / 2, hand.y - (3 + ((step + i) % 2)) * u, u, u);
    }
  }
  for (const visitor of life.visitors) {
    const visitorPose = personPose(layout, visitor, { stage: visitor.stage, time: life.time, seed: visitor.id });
    drawCharacter(ctx, visitorPose, visitor.stage, visitor.look, 'smile', groundY, layout.characterScale, null);
  }
}

// Rio, facing left: o green, f the white face, k beak, w blue wing, t red
// tail. Sitting, bobbing its head down, and flapping.
const PARROT_FRAMES = {
  perch: ['.oo..', 'kfoo.', '.ooo.', '.owo.', '.oww.', '..wt.', '..t..'],
  bob: ['.....', '.oo..', 'kfoo.', '.owo.', '.oww.', '..wt.', '..t..'],
  flap: ['.oo..', 'kfoo.', 'wooow', 'w.o.w', '..o..', '..wt.', '..t..'],
};
const parrotLayers = new Map();
function parrotLayer(frame) {
  if (!parrotLayers.has(frame)) {
    const rows = PARROT_FRAMES[frame];
    const { body, wing, tail, face, beak } = ALLEY_PARROT.colors;
    const colors = { o: body, f: face, k: beak, w: wing, t: tail };
    const layer = createLayer(rows[0].length + 2, rows.length + 2);
    rows.forEach((line, row) => [...line].forEach((char, col) => {
      if (char !== '.') fill(layer, col + 1, row + 1, 1, 1, colors[char]);
    }));
    outline(layer, OUTLINE_COLOR);
    parrotLayers.set(frame, layer);
  }
  return parrotLayers.get(frame);
}

// Rio on its perch (a stick out from the stall's post).
export function drawParrot(ctx, layout, life) {
  const { scale } = layout;
  const perchY = rowY(layout, ALLEY_PERCH.row);
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect((ALLEY_PERCH.x - 3) * scale, perchY - scale, 7 * scale, 3 * scale);
  ctx.fillStyle = ALLEY_PARROT.colors.perch;
  ctx.fillRect((ALLEY_PERCH.x - 2) * scale, perchY, 5 * scale, scale);
  const { state, t } = life.parrot;
  const frame = state === 'flap' && Math.floor(t * 8) % 2 ? 'flap' : state === 'bob' ? 'bob' : 'perch';
  const layer = parrotLayer(frame);
  drawLayer(ctx, layer, ALLEY_PERCH.x * scale, perchY, scale, { anchorCol: Math.floor(layer.width / 2) });
}

// Draws only the painter or Rio (`id`), for the hover outline's
// silhouette. Returns the screen pixels per pixel of its art.
export function drawAlleyCritter(ctx, layout, life, id) {
  if (id === 'parrot') {
    drawParrot(ctx, layout, life);
    return layout.scale;
  }
  drawAlleyPeople(ctx, layout, { ...life, visitors: [] });
  return layout.characterScale;
}
