// farewell.js — The gentle goodbye's fade: a soft, pale veil drawn over
// the whole scene (character included) that thickens slowly in a few
// even steps after a life ends. Timing is in data/endOfLife.js
// (FAREWELL).

import { FAREWELL } from '../data/endOfLife.js';

// The veil's color: warm, misty white, so the scene drifts into light
// rather than going dark.
const FADE_RGB = '250, 244, 235';
// The fade thickens in this many even steps, so it reads as pixel art
// rather than a smooth film.
const FADE_STEPS = 12;

// How thick the veil is (0 to FAREWELL.fadeMax) `seconds` after the end.
export function fadeAmount(seconds) {
  const progress = Math.min(1, Math.max(0, seconds / FAREWELL.fadeSeconds));
  return (Math.floor(progress * FADE_STEPS) / FADE_STEPS) * FAREWELL.fadeMax;
}

// Draws the veil over everything on the canvas so far.
export function drawFarewellFade(ctx, width, height, seconds) {
  const amount = fadeAmount(seconds);
  if (amount <= 0) return;
  ctx.fillStyle = `rgba(${FADE_RGB}, ${amount})`;
  ctx.fillRect(0, 0, width, height);
}
