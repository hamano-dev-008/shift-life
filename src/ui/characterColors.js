// characterColors.js — Works out the layered character art's recolors from an appearance (no DOM, so tests run it).

import { PART_COLORS } from '../data/characterParts.js';

// [r, g, b] from '#rrggbb' (an array passes through).
function rgb(color) {
  if (Array.isArray(color)) return color;
  return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
}

function hex(channels) {
  return `#${channels.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// c + (t - c) * k per channel, rounded.
export function mix(c, t, k) {
  const target = rgb(t);
  return rgb(c).map((v, i) => Math.round(v + (target[i] - v) * k));
}

// Map from each art color to its color for `look` ({ skin, hair, shirt }).
export function partColorMap(look) {
  const map = new Map();
  for (const { from, base, toward, amount, over } of PART_COLORS) {
    const color = rgb(look[base]);
    // With `over`, a two-item `toward` or `amount` is [if not over, if over].
    const bright = color[0] + color[1] + color[2] > over ? 1 : 0;
    const pick = (value) => (over !== undefined && Array.isArray(value) && value.length === 2 ? value[bright] : value);
    map.set(from, hex(toward ? mix(color, pick(toward), pick(amount)) : color));
  }
  return map;
}
