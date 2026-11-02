// hoverOutline.js — The white outline around the interactable thing under
// the pointer (a prop, a frog or butterfly, the character). Which thing
// that is comes from the topmost click target under the pointer
// (hoverTargetOf()); the outline traces its silhouette, painted from the
// same art that's drawn this frame, just outside its opaque pixels and
// HOVER_OUTLINE.thickness pixels of its own art thick, gently pulsing
// (data/hover.js).
//
// How: the thing is painted alone onto an offscreen mask; the mask is
// grown by one art pixel (`scale` screen pixels) up, down, left and right
// as many times as the thickness, its own pixels are cut out, and what's
// left (the ring) is filled with the outline color and drawn over the
// scene. Same result as pixel.js outline(), at any scale, with no grid to
// line up.

import { HOVER_OUTLINE } from '../data/hover.js';

const SHIFTS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// The thing whose click target `element` (the topmost element under the
// pointer) belongs to: { kind: 'prop', id } (a #targets button),
// { kind: 'critter', id } (a #wildlife button), { kind: 'character' }
// (one of #character-target's runs), or null.
export function hoverTargetOf(element) {
  if (!element) return null;
  const prop = element.closest('#targets button');
  if (prop?.dataset.prop) return { kind: 'prop', id: prop.dataset.prop };
  const critter = element.closest('#wildlife button');
  if (critter?.dataset.id) return { kind: 'critter', id: Number(critter.dataset.id) };
  if (element.closest('#character-target')) return { kind: 'character' };
  return null;
}

// The outline's opacity `seconds` in: between pulse.low and pulse.high
// and back every pulse.period seconds.
export function outlineAlpha(seconds) {
  const { period, low, high } = HOVER_OUTLINE.pulse;
  return low + (high - low) * ((1 - Math.cos(((seconds % period) / period) * 2 * Math.PI)) / 2);
}

// An outline drawer for a `width` x `height` canvas.
export function createHoverOutline(width, height) {
  const mask = createCanvas(width, height);
  let ring = createCanvas(width, height);
  let spare = createCanvas(width, height);
  const maskCtx = mask.getContext('2d');
  let ringKey = null;

  // Builds the ring around what's on the mask, `scale` screen pixels per
  // art pixel.
  function buildRing(scale) {
    let ringCtx = ring.getContext('2d');
    ringCtx.clearRect(0, 0, width, height);
    ringCtx.drawImage(mask, 0, 0);
    for (let step = 0; step < HOVER_OUTLINE.thickness; step++) {
      const spareCtx = spare.getContext('2d');
      spareCtx.clearRect(0, 0, width, height);
      spareCtx.drawImage(ring, 0, 0);
      for (const [dx, dy] of SHIFTS) spareCtx.drawImage(ring, dx * scale, dy * scale);
      [ring, spare] = [spare, ring];
    }
    ringCtx = ring.getContext('2d');
    ringCtx.globalCompositeOperation = 'destination-out';
    ringCtx.drawImage(mask, 0, 0);
    ringCtx.globalCompositeOperation = 'source-in';
    ringCtx.fillStyle = HOVER_OUTLINE.color;
    ringCtx.fillRect(0, 0, width, height);
    ringCtx.globalCompositeOperation = 'source-over';
  }

  return {
    // Draws the outline onto `ctx` around what `paint(maskCtx)` paints
    // (the thing alone, as it's drawn now), `seconds` in for the pulse.
    // `paint` returns the screen pixels per pixel of the thing's art, or
    // null if there's nothing to outline. With a `key`, the ring is kept
    // and reused while the key stays the same (still props).
    draw(ctx, paint, seconds, key = null) {
      if (key === null || key !== ringKey) {
        maskCtx.clearRect(0, 0, width, height);
        const scale = paint(maskCtx);
        if (!scale) {
          ringKey = null;
          return false;
        }
        buildRing(scale);
        ringKey = key;
      }
      ctx.save();
      ctx.globalAlpha = outlineAlpha(seconds);
      ctx.drawImage(ring, 0, 0);
      ctx.restore();
      return true;
    },
  };
}
