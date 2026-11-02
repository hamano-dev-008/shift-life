// lying.js — The shape of the sleeping (lying down) pose, with no drawing
// and no DOM, so tests run it: where the head, pillow, shoulders and
// blanket go for a body, the blanket's breathing, and when the sleeping
// mouth opens to a tiny "o". ui/sprite.js paints it.
//
// Everything is in character pixels on the sprite's layer: columns from
// the character's anchor (the pose's x), rows up from `bottom`, the row
// the body lies on. The figure is painted facing right, head at the left
// (low columns), feet at the right; facing left mirrors it.

import { SLEEP_LOOPS, REST_PILLOW, REST_BLANKET } from '../data/home.js';

// The body's parts along its length: { left, head, torsoLeft, torso,
// legsLeft, legs, thick }. `left` is the crown's column, `thick` how many
// rows the torso is deep.
export function lyingBody(shape) {
  const torso = shape.body + 1;
  const length = shape.head + torso + shape.legs;
  const left = -Math.floor(length / 2);
  const torsoLeft = left + shape.head;
  return {
    left,
    head: shape.head,
    torsoLeft,
    torso,
    legsLeft: torsoLeft + torso,
    legs: shape.legs,
    thick: Math.ceil(shape.width / 2),
  };
}

// The head's middle, in columns from the anchor (the pose's x). The
// renderer lines this up with the bed's pillow end, and bubbles go over
// it.
export function lyingHeadCenter(shape) {
  const { left, head } = lyingBody(shape);
  return left + head / 2;
}

// The layout of a sleeping figure on `bed` ({ pillow, cover, headLift })
// at `t` seconds into the rest. Rows count up from the bottom row (0).
// Returns { body, headBottom, headTop, pillow, shoulders, blanket,
// breathing, mouthOpen }:
// - headBottom/headTop: the head's lowest and highest rows (the back of
//   the head rests `headLift` rows up, on the pillow);
// - pillow: { left, width, rows } under the head, or null;
// - shoulders: { left, width, top } the shirt showing above the blanket;
// - blanket: one { col, top } per column it covers (its top row; it
//   reaches down to row 0), chest to past the feet with a bump at the
//   feet; the chest's top edge is 1 higher while breathing in.
export function lyingLayout(shape, bed, t) {
  const body = lyingBody(shape);
  const headLift = bed?.headLift ?? 0;
  const headBottom = headLift;
  const headTop = headLift + body.head - 1;
  const pillow = bed?.pillow
    ? {
      left: body.left - REST_PILLOW.overhang,
      width: body.head + REST_PILLOW.overhang * 2,
      rows: REST_PILLOW.rows,
    }
    : null;
  const shoulderWidth = Math.min(REST_BLANKET.shoulders, Math.floor(body.torso / 2));
  const torsoTop = body.thick - 1;
  const shoulders = { left: body.torsoLeft, width: shoulderWidth, top: torsoTop };
  const breathing = breathIn(t);
  const legTop = Math.max(1, torsoTop - 1);
  const blanket = [];
  const chestLeft = body.torsoLeft + shoulderWidth;
  const end = body.legsLeft + body.legs; // one past the toes: the drape
  for (let col = chestLeft; col <= end; col++) {
    let top;
    if (col < body.legsLeft) {
      // The chest (its first half) breathes; the tummy stays.
      const chest = col < chestLeft + Math.ceil((body.legsLeft - chestLeft) / 2);
      top = torsoTop + (chest ? breathing : 0);
    } else if (col >= end - 2) {
      // Toes up under the blanket: the bump, then the drape just past it.
      top = col === end ? legTop : legTop + 2;
    } else {
      top = legTop;
    }
    blanket.push({ col, top });
  }
  return {
    body, headBottom, headTop, pillow, shoulders, blanket, breathing, mouthOpen: mouthOpen(t),
  };
}

// 1 while breathing in (the first half of each SLEEP_LOOPS.breath), else 0.
export function breathIn(t) {
  const { breath } = SLEEP_LOOPS;
  return ((t % breath) + breath) % breath < breath / 2 ? 1 : 0;
}

// A number in [0, 1) for whole number `n`, the same every run.
function noise(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// The times (seconds into the rest) the mouth opens: the k-th at k times
// the middle of SLEEP_LOOPS.mouthEvery, plus 0 to half its spread, so
// one comes every mouthEvery[0] to mouthEvery[1] seconds. The first is
// after one gap. The same every run.
export function mouthOpensAt(k) {
  const [min, max] = SLEEP_LOOPS.mouthEvery;
  const gap = (min + max) / 2;
  return (k + 1) * gap + noise(k) * ((max - min) / 2);
}

// Whether the sleeping mouth is open (the tiny "o") `t` seconds into the
// rest: for SLEEP_LOOPS.mouthOpen after each mouthOpensAt().
export function mouthOpen(t) {
  const [min, max] = SLEEP_LOOPS.mouthEvery;
  const gap = (min + max) / 2;
  const k = Math.floor(t / gap) - 1;
  for (const i of [k - 1, k]) {
    if (i < 0) continue;
    const start = mouthOpensAt(i);
    if (t >= start && t < start + SLEEP_LOOPS.mouthOpen) return true;
  }
  return false;
}
