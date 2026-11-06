// parallax.js — The parallax backgrounds' motion, visual only (no DOM, so
// tests run it): the clouds' drift, the back layers' sway while the window
// is dragged (a soft spring), the pan between places (each layer's
// offset and the cross-fade), the door's fade, which of the two a trip
// gets, and the edge gaps a shifted layer leaves. Numbers in
// data/parallax.js; ui/scene.js draws the layers and the renderer puts
// it together. Every offset is in whole screen pixels.

import {
  CLOUD_DRIFT, DRAG_SWAY, TRAVEL_PAN, PAN_PLACES, DOOR_FADE,
} from '../data/parallax.js';

// The layers behind the ground, back to front: the ones that sway, drift
// and cross-fade.
export const BACK_LAYERS = ['sky', 'clouds', 'hills'];

const clamp = (value, low, high) => Math.min(Math.max(value, low), high);
// Rounds to a whole number, never -0.
const whole = (value) => Math.round(value) || 0;

// How far the clouds have drifted `seconds` in, in whole screen pixels at
// `scale` screen pixels per scene pixel (unbounded; drawing wraps it with
// wrapX()).
export function cloudDrift(seconds, scale) {
  const px = Math.floor((Math.max(0, seconds) * scale) / CLOUD_DRIFT.secondsPerPixel);
  return (CLOUD_DRIFT.direction * px) || 0;
}

// Where a layer `period` screen pixels wide, repeating side by side and
// shifted `shift`, starts: 0 <= x < period, so the drift wraps seamlessly.
export function wrapX(shift, period) {
  return ((Math.round(shift) % period) + period) % period;
}

// The empty columns a layer `artWidth` wide leaves when drawn `shift`
// screen pixels to the right in a window `width` wide: [{ from, to, edge }]
// (canvas x, `edge` 'first' or 'last': the layer's column that fills it).
export function edgeGaps(shift, artWidth, width) {
  const gaps = [];
  if (shift > 0) gaps.push({ from: 0, to: Math.min(shift, width), edge: 'first' });
  if (shift + artWidth < width) gaps.push({ from: Math.max(0, shift + artWidth), to: width, edge: 'last' });
  return gaps.filter((gap) => gap.to > gap.from);
}

// The sway while dragging the window: the window's smoothed speed (screen
// pixels a second), and the spring's position (-1 to 1 of each layer's
// most, the other way to the drag) and its velocity.
export function createDragSway() {
  return { lastX: null, speed: 0, offset: 0, velocity: 0 };
}

// Moves the sway on `dt` seconds. `dragX` is how far (screen pixels) the
// window has been dragged sideways so far in the drag under way, or null
// when there's none.
export function updateDragSway(sway, dt, dragX) {
  if (!(dt > 0)) return;
  let measured = 0;
  if (dragX == null) {
    sway.lastX = null;
  } else {
    if (sway.lastX != null) measured = (dragX - sway.lastX) / dt;
    sway.lastX = dragX;
  }
  sway.speed += (measured - sway.speed) * (1 - Math.exp(-dt / DRAG_SWAY.smoothing));
  const target = -clamp(sway.speed / DRAG_SWAY.fullSpeed, -1, 1);
  // Small steps keep the spring steady at any frame rate.
  const steps = Math.ceil(dt / (1 / 240));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    sway.velocity += (DRAG_SWAY.stiffness * (target - sway.offset) - DRAG_SWAY.damping * sway.velocity) * h;
    sway.offset += sway.velocity * h;
  }
  // At rest again: exactly still.
  if (dragX == null && Math.abs(sway.speed) < 1 && Math.abs(sway.offset) < 0.002
    && Math.abs(sway.velocity) < 0.02) {
    sway.speed = 0;
    sway.offset = 0;
    sway.velocity = 0;
  }
}

// How far layer `layer` is shifted by the sway now, in whole screen
// pixels at `scale` screen pixels per scene pixel (never more than its
// most; the ground never).
export function swayShift(sway, layer, scale) {
  const most = (DRAG_SWAY.max[layer] ?? 0) * scale;
  return whole(clamp(sway.offset * most, -most, most));
}

// Which way a trip from place `from` to `to` through `via` (an exit's,
// data/places.js) is shown: 'pan' through a side between outdoor places,
// 'fade' through a door or into town, or null (at once: parallax off).
export function transitionFor(from, to, via, enabled) {
  if (!enabled) return null;
  if (via === 'left' || via === 'right') {
    return PAN_PLACES.includes(from) && PAN_PLACES.includes(to) ? 'pan' : null;
  }
  return 'fade';
}

// How far through the pan `elapsed` seconds in is, eased in and out (0 to
// 1).
export function panProgress(elapsed) {
  const t = clamp(elapsed / TRAVEL_PAN.seconds, 0, 1);
  return (1 - Math.cos(Math.PI * t)) / 2;
}

export function panDone(elapsed) {
  return elapsed >= TRAVEL_PAN.seconds;
}

// Where layer `layer` of the place left (`from`) and of the place arrived
// at (`to`) are drawn, `progress` (panProgress()) through the pan, in a
// window `width` wide: canvas x offsets. `direction` is 1 when they walked
// out the right side (the view moves right: the old place slides off to
// the left, the new one comes in from the right), -1 for the left. The
// two are always the layer's share of the width apart, so the grounds
// meet edge to edge.
export function panOffsets(progress, layer, width, direction) {
  const share = TRAVEL_PAN.share[layer] ?? 1;
  const from = whole(-direction * share * width * progress);
  return { from, to: whole(from + direction * whole(share * width)) };
}

// How much of the new place's layers shows over the old one's,
// `progress` through the pan, in TRAVEL_PAN.fadeSteps steps (0 to 1).
export function panFade(progress) {
  const steps = TRAVEL_PAN.fadeSteps;
  return Math.round(clamp(progress, 0, 1) * steps) / steps;
}

// How strongly the old view still shows over the new one `elapsed`
// seconds into a door's fade, in DOOR_FADE.steps steps (1 to 0).
export function doorFadeLeft(elapsed) {
  const t = clamp(elapsed / DOOR_FADE.seconds, 0, 1);
  return 1 - Math.ceil(t * DOOR_FADE.steps) / DOOR_FADE.steps;
}

export function doorFadeDone(elapsed) {
  return elapsed >= DOOR_FADE.seconds;
}
