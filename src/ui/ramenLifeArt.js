// ramenLifeArt.js — Draws Ramen Hinata's life (ui/ramenLife.js): the
// cook behind the counter and the diners with the character art
// (drawCharacter(), at CHARACTER_SCALE), steam curling off the pots, and
// bowls of ramen (on the counter in front of whoever is eating, or
// carried in both hands).

import {
  RAMEN_ART, RAMEN_COUNTER, RAMEN_POTS, RAMEN_STOOLS, RAMEN_MY_STOOL, RAMEN_COOK, RAMEN_FEET_FROM_BOTTOM,
} from '../data/ramen.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { drawCharacter, heldHand } from './sprite.js';
import { personPose, pictureRowY } from './people.js';
import { isWalkingInRamen } from './ramenLife.js';

const rowY = (layout, row) => pictureRowY(layout, RAMEN_ART.height, row);

// Pure art: a bowl, its noodles and egg, and steam.
const BOWL = '#e07a5f';
const BOWL_DARK = '#b5443f';
const BROTH = '#d9a85a';
const EGG = '#f6d58a';
const STEAM = '#f4efe6';

const MY_STOOL = RAMEN_STOOLS.find((stool) => stool.id === RAMEN_MY_STOOL);

// A wisp of steam rising from (x, row) in the picture's pixels, drifting
// with the time; `seed` sets its own rhythm.
function steam(ctx, layout, x, row, time, seed) {
  const { scale } = layout;
  ctx.fillStyle = STEAM;
  for (let i = 0; i < 3; i++) {
    const phase = (time * 0.8 + seed * 0.37 + i / 3) % 1;
    const dx = Math.round(Math.sin((phase + seed) * Math.PI * 2));
    ctx.fillRect((x + dx) * scale, rowY(layout, row - 1 - Math.floor(phase * 6)), scale, scale);
  }
}

// A bowl of ramen on the counter, its middle at x.
function bowlOnCounter(ctx, layout, x, time) {
  const { scale } = layout;
  const top = RAMEN_COUNTER.top;
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect((x - 3) * scale, rowY(layout, top - 4), 7 * scale, 4 * scale);
  ctx.fillStyle = BOWL;
  ctx.fillRect((x - 2) * scale, rowY(layout, top - 3), 5 * scale, 2 * scale);
  ctx.fillStyle = BOWL_DARK;
  ctx.fillRect((x - 1) * scale, rowY(layout, top - 1), 3 * scale, scale);
  ctx.fillStyle = BROTH;
  ctx.fillRect((x - 2) * scale, rowY(layout, top - 4), 5 * scale, scale);
  ctx.fillStyle = EGG;
  ctx.fillRect(x * scale, rowY(layout, top - 4), scale, scale);
  steam(ctx, layout, x, top - 4, time, x);
}

// A bowl carried at `hand` (heldHand()).
export function drawHeldBowl(ctx, hand) {
  const u = hand.unit;
  const left = hand.x - u / 2 + (hand.facing < 0 ? -3 * u : 0);
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect(left - u, hand.y - 3 * u, 6 * u, 4 * u);
  ctx.fillStyle = BOWL;
  ctx.fillRect(left, hand.y - 2 * u, 4 * u, 2 * u);
  ctx.fillStyle = BROTH;
  ctx.fillRect(left, hand.y - 3 * u, 4 * u, u);
  ctx.fillStyle = EGG;
  ctx.fillRect(left + u, hand.y - 3 * u, u, u);
}

// The cook behind the counter (their legs hidden by the counter's front,
// drawn next): stirring, or carrying a bowl along the counter; steam off
// the pots behind them.
export function drawCook(ctx, layout, life) {
  for (const x of RAMEN_POTS) steam(ctx, layout, x, 39, life.time, x);
  const { cook } = life;
  const working = cook.state === 'stir' || cook.state === 'serve';
  const pose = personPose(layout, cook, {
    stage: RAMEN_COOK.stage, activity: working ? 'hold' : null, time: life.time, seed: 0, walking: isWalkingInRamen(cook),
  });
  const groundY = rowY(layout, RAMEN_COUNTER.behindRow);
  drawCharacter(ctx, pose, RAMEN_COOK.stage, RAMEN_COOK.look, 'smile', groundY, layout.characterScale, RAMEN_COOK.item);
  if (cook.state === 'serve') drawHeldBowl(ctx, heldHand(RAMEN_COOK.stage, pose, groundY, layout.characterScale));
}

// In front of the counter: the bowls served (the character's too), then
// the diners, sitting with their bowl or walking in and out.
export function drawRamenFront(ctx, layout, life) {
  const floorY = rowY(layout, RAMEN_ART.height - RAMEN_FEET_FROM_BOTTOM);
  for (const diner of life.diners) {
    if (diner.state === 'sit' && diner.served) bowlOnCounter(ctx, layout, diner.stool.x + diner.stool.facing * 4, life.time);
  }
  if (life.playerServed) bowlOnCounter(ctx, layout, MY_STOOL.x + MY_STOOL.facing * 4, life.time);
  for (const diner of life.diners) {
    const sitting = diner.state === 'sit';
    const pose = personPose(layout, diner, {
      stage: diner.stage, sit: sitting, activity: sitting && diner.served ? 'hold' : null, time: life.time,
      seed: diner.id, walking: isWalkingInRamen(diner),
    });
    drawCharacter(ctx, pose, diner.stage, diner.look, 'smile', sitting ? rowY(layout, diner.stool.row) : floorY,
      layout.characterScale, null);
  }
}

// Draws only the cook, for the hover outline's silhouette: above the
// counter. Returns the screen pixels per pixel of its art.
export function drawRamenCritter(ctx, layout, life) {
  drawCook(ctx, layout, life);
  const top = rowY(layout, RAMEN_COUNTER.top);
  ctx.clearRect(0, top, layout.width, layout.height - top);
  return layout.characterScale;
}
