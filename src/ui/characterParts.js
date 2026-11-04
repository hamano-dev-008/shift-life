// characterParts.js — The adult's layered part art (data/characterParts.js) for every adult pose, recolored per appearance.

import {
  PART_FRAME, PART_ANIMATIONS, PART_ORDER, PART_PLACES, LYING_PARTS, PART_MOUTH,
} from '../data/characterParts.js';
import { getSprite } from './assets.js';
import { partColorMap } from './characterColors.js';

const FACES = ['smile', 'neutral', 'frown', 'blink'];

// Recolored strips by part and colors, made once each.
const strips = new Map();

// Whether every part is there, by animation and hair style. Sprites load
// once at startup, so the answer is kept.
const complete = new Map();

// The part animation for an adult's pose ('idle', 'walk', 'sit' or
// 'lying'), or null for anyone else. Standing activities are idle and
// jogging is walk; the pose's own arm and props go on top.
export function partAnimation(stage, pose) {
  if (stage !== 'adult' || pose.gait !== 'walk') return null;
  if (pose.lying) return 'lying';
  if (pose.sit) return 'sit';
  return pose.walk ? 'walk' : 'idle';
}

function partName(animation, part, hairStyle, face) {
  return `parts.adult.${animation}.${part.replace('{hair}', hairStyle).replace(/^face$/, `face.${face}`)}`;
}

// The animation's parts for this hair style and face, back to front:
// [{ name, then, arm }].
function partsFor(animation, hairStyle, face) {
  if (animation === 'lying') {
    return LYING_PARTS.order.map((part) => ({ name: partName(animation, part, hairStyle) }));
  }
  return PART_ORDER
    .filter(({ onlyFor }) => !onlyFor || onlyFor === hairStyle)
    .map(({ part, then, arm }) => ({ name: partName(animation, part, hairStyle, face), then, arm }));
}

// A frame's size and the frames in a strip, for the animation.
function frameOf(animation) {
  if (animation === 'lying') return { ...LYING_PARTS.frame, frames: 1 };
  return { width: PART_FRAME.width, height: PART_FRAME.height, frames: PART_ANIMATIONS[animation].frames };
}

// Whether every part this hair style can show in the animation has a PNG
// big enough for its frames (every face too, so a blink never switches
// art). `lookup(name)` is getSprite() or a stand-in.
export function partsComplete(animation, hairStyle, lookup) {
  const { width, height, frames } = frameOf(animation);
  const names = new Set(FACES.flatMap((face) => partsFor(animation, hairStyle, face).map(({ name }) => name)));
  return [...names].every((name) => {
    const image = lookup(name)?.image;
    return Boolean(image) && image.naturalWidth >= width * frames && image.naturalHeight >= height;
  });
}

function hasAllParts(animation, hairStyle) {
  const key = `${animation}|${hairStyle}`;
  if (!complete.has(key)) complete.set(key, partsComplete(animation, hairStyle, getSprite));
  return complete.get(key);
}

// The sprite `name` with its colors swapped by `colors()`, cached.
function recolored(name, look, colors) {
  const key = `${name}|${look.skin}|${look.hair}|${look.shirt}`;
  let canvas = strips.get(key);
  if (canvas) return canvas;
  const { image } = getSprite(name);
  canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = pixels;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const from = `#${[data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    const to = colors().get(from);
    if (!to) continue;
    [1, 3, 5].forEach((at, c) => { data[i + c] = parseInt(to.slice(at, at + 2), 16); });
  }
  ctx.putImageData(pixels, 0, 0);
  strips.set(key, canvas);
  return canvas;
}

// The parts to draw for the pose, or null to draw it in code: {
// animation, frame, size ({ width, height }), place (PART_PLACES; null
// lying), mouth (the mouth's color), strips: [{ canvas, then, arm }] back
// to front }. `look` is the appearance with any job item's shirt swapped
// in.
export function adultParts(stage, pose, look, expression) {
  const animation = partAnimation(stage, pose);
  if (!animation || !hasAllParts(animation, look.hairStyle)) return null;
  const { width, height, frames } = frameOf(animation);
  const frame = animation === 'walk'
    ? Math.min(frames - 1, Math.floor(pose.walk.cycle * frames))
    : Math.min(frames - 1, animation === 'lying' ? 0 : pose.breath);
  let colors = null;
  const colorMap = () => (colors ??= partColorMap(look));
  return {
    animation,
    frame,
    size: { width, height },
    place: PART_PLACES[animation]?.[frame] ?? null,
    mouth: colorMap().get(PART_MOUTH),
    strips: partsFor(animation, look.hairStyle, pose.blinking ? 'blink' : expression)
      .map(({ name, then, arm }) => ({ canvas: recolored(name, look, colorMap), then, arm })),
  };
}

// Draws the parts' frame of `canvas` onto `layer` with its top-left at
// (left, top).
export function drawPartFrame(layer, parts, canvas, left, top) {
  const { width, height } = parts.size;
  layer.ctx.drawImage(canvas, parts.frame * width, 0, width, height, left, top, width, height);
}
