// characterParts.js — The adult's layered part art (data/characterParts.js) for standing idle and walking, recolored per appearance.

import { PART_FRAME, PART_ANIMATIONS, PART_ORDER, PART_PLACES } from '../data/characterParts.js';
import { getSprite } from './assets.js';
import { partColorMap } from './characterColors.js';

const EXPRESSIONS = ['smile', 'neutral', 'frown', 'blink'];

// Recolored strips by part and colors, made once each.
const strips = new Map();

// The part animation for the pose: plain standing or walking as an adult,
// else null (sitting, lying, activities and other stages stay code-drawn).
function animationOf(stage, pose) {
  if (stage !== 'adult' || pose.sit || pose.lying || pose.activity || pose.gait !== 'walk') return null;
  return pose.walk ? 'walk' : 'idle';
}

// Whether every part found for an animation and hair style, by key.
const complete = new Map();

// PART_ORDER's parts for this hair style and face: [{ name, then }].
function partsFor(animation, hairStyle, face) {
  return PART_ORDER
    .filter(({ onlyFor }) => !onlyFor || onlyFor === hairStyle)
    .map(({ part, then }) => ({
      name: `parts.adult.${animation}.${part.replace('{hair}', hairStyle).replace(/^face$/, `face.${face}`)}`,
      then,
    }));
}

// Whether every part this look can show in the animation has a PNG big
// enough for its frames (every face too, so a blink never switches art).
// Sprites load once at startup, so the answer is kept.
function hasAllParts(animation, hairStyle) {
  const key = `${animation}|${hairStyle}`;
  if (!complete.has(key)) {
    const { width, height } = PART_FRAME;
    const frames = PART_ANIMATIONS[animation].frames;
    const names = new Set(EXPRESSIONS.flatMap((face) => partsFor(animation, hairStyle, face).map(({ name }) => name)));
    complete.set(key, [...names].every((name) => {
      const image = getSprite(name)?.image;
      return image && image.naturalWidth >= width * frames && image.naturalHeight >= height;
    }));
  }
  return complete.get(key);
}

// The sprite `name` with its colors swapped by `colors`, cached.
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

// The parts to draw for the pose, or null to draw it in code: { frame,
// place (PART_PLACES), strips: [{ canvas, then }] back to front }. `look`
// is the appearance with any job item's shirt swapped in.
export function adultParts(stage, pose, look, expression) {
  const animation = animationOf(stage, pose);
  if (!animation || !hasAllParts(animation, look.hairStyle)) return null;
  const { frames } = PART_ANIMATIONS[animation];
  const frame = animation === 'walk'
    ? Math.min(frames - 1, Math.floor(pose.walk.cycle * frames))
    : Math.min(frames - 1, pose.breath);
  let colors = null;
  const colorMap = () => (colors ??= partColorMap(look));
  return {
    frame,
    place: PART_PLACES[animation][frame],
    strips: partsFor(animation, look.hairStyle, pose.blinking ? 'blink' : expression)
      .map(({ name, then }) => ({ canvas: recolored(name, look, colorMap), then })),
  };
}

// Draws frame `frame` of `canvas` onto `layer` with its top-left at
// (left, top).
export function drawPartFrame(layer, canvas, frame, left, top) {
  const { width, height } = PART_FRAME;
  layer.ctx.drawImage(canvas, frame * width, 0, width, height, left, top, width, height);
}
