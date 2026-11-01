// bubble.js — The bubbles that float above the character's head and follow
// them around: the pixel-art "!" bubble that means an event is waiting
// (drawn on the canvas, with an invisible button over it to catch clicks),
// and the text bubble saying what happened after an event (a DOM element).

import { CHARACTER_SHAPES } from '../data/characterShapes.js';
import { EVENT_BUBBLE, HEAD_CLEARANCE } from '../data/layout.js';
import { BUBBLE_BOB_CYCLE } from '../data/animation.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { STAT_TAGS } from '../data/stats.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';

const BUBBLE_FILL = '#ffffff';
const MARK = '#e0584a';

// Keeps the text bubble this many canvas pixels from the window edges.
const EDGE_GAP = 4;

const bubble = paintBubble();

// The "!" bubble on its own layer: a rounded box with a tail pointing down
// and a 1px "!" in the middle, outlined.
function paintBubble() {
  const { width: w, height: h, tail } = EVENT_BUBBLE;
  const layer = createLayer(w + 2, h + tail + 2);
  const px = (col, row, pw, ph, color) => fill(layer, col + 1, row + 1, pw, ph, color);
  const mid = Math.floor(w / 2);

  px(1, 0, w - 2, h, BUBBLE_FILL);
  px(0, 1, w, h - 2, BUBBLE_FILL);
  for (let i = 0; i < tail; i++) {
    const half = tail - 1 - i;
    px(mid - half, h + i, half * 2 + 1, 1, BUBBLE_FILL);
  }
  px(mid, 2, 1, h - 6, MARK);
  px(mid, h - 3, 1, 1, MARK);
  outline(layer, OUTLINE_COLOR);
  return layer;
}

// Canvas row just above the character's head and hair for a life stage;
// bubbles sit with their bottom here.
export function bubbleBottomY(layout, stage) {
  const { legs, body, head } = CHARACTER_SHAPES[stage];
  return layout.feetY - (legs + body + head + HEAD_CLEARANCE) * layout.characterScale;
}

// Draws the "!" bubble centered over canvas x, bobbing with `time`
// (seconds). Returns where it landed, { left, top, width, height } in
// canvas pixels, for placing the click target.
export function drawEventBubble(ctx, layout, x, bottomY, time) {
  const { scale } = layout;
  const width = bubble.width * scale;
  const height = bubble.height * scale;
  const centered = Math.round((x - width / 2) / scale) * scale;
  const left = Math.min(Math.max(centered, 0), layout.width - width);
  const bob = time % BUBBLE_BOB_CYCLE > BUBBLE_BOB_CYCLE / 2 ? scale : 0;
  const bottom = bottomY - bob;
  drawLayer(ctx, bubble, left, bottom, scale);
  return { left, top: bottom - height, width, height };
}

// Moves the invisible button over the bubble, touching the DOM only when
// the spot changes (each change also updates the window's drag regions).
export function placeOver(element, rect) {
  const key = `${rect.left},${rect.top},${rect.width},${rect.height}`;
  if (element.dataset.rect === key) return;
  element.dataset.rect = key;
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

// "HP+5 JOY-3 +$20" for an event's stat changes.
export function formatDeltas(deltas) {
  return Object.entries(deltas).map(([id, amount]) => {
    const sign = amount > 0 ? '+' : '-';
    return id === 'money'
      ? `${sign}${STAT_TAGS.money}${Math.abs(amount)}`
      : `${STAT_TAGS[id]}${sign}${Math.abs(amount)}`;
  }).join(' ');
}

// Puts the text bubble above canvas x, kept inside the window. Its tail
// (positioned by --tail-x in styles.css) still points at the character
// when the bubble is pushed in from an edge.
export function placeSpeech(element, layout, x, bottomY) {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const left = Math.min(Math.max(x - width / 2, EDGE_GAP), layout.width - width - EDGE_GAP);
  const top = Math.max(bottomY - height, EDGE_GAP);
  const tailX = Math.min(Math.max(x - left, 8), width - 8);
  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(top)}px`;
  element.style.setProperty('--tail-x', `${Math.round(tailX)}px`);
}
