// characterParts.js — The layered part art (data/characterParts.js) for every life stage's poses, recolored per appearance.

import { PART_FRAME, PART_SETS, LYING_PARTS, PART_MOUTH } from '../data/characterParts.js';
import { getSprite } from './assets.js';
import { partColorMap } from './characterColors.js';

const FACES = ['smile', 'neutral', 'frown', 'blink'];

// Recolored strips by part and colors, made once each.
const strips = new Map();

// Whether every part is there, by set, animation and hair style. Sprites
// load once at startup, so the answer is kept.
const complete = new Map();

// The part set and animation for the pose ({ set, animation }), or null
// to draw it in code. The set follows the body the code-drawn figure uses:
// a toddler on their feet or plopped down is `toddler`, lying down the life
// stage's. Standing activities are idle and jogging is walk; the pose's own
// arm and props go on top.
export function partPose(stage, pose) {
  if (pose.lying) {
    return PART_SETS[stage]?.lying ? { set: stage, animation: 'lying' } : null;
  }
  const set = pose.gait === 'toddle' ? 'toddler' : stage;
  let animation;
  if (pose.sit) animation = 'sit';
  else if (pose.gait === 'crawl') animation = 'crawl';
  else animation = pose.walk ? 'walk' : 'idle';
  return PART_SETS[set]?.animations[animation] ? { set, animation } : null;
}

function partName(set, animation, part, hairStyle, face) {
  return `parts.${set}.${animation}.${part.replace('{hair}', hairStyle).replace(/^face$/, `face.${face}`)}`;
}

// The parts for this set, animation, hair style and face, back to front:
// [{ name, then, arm, still }]. Asleep, the head parts of LYING_PARTS.
function partsFor(set, animation, hairStyle, face) {
  if (animation === 'lying') {
    return LYING_PARTS.order.map((part) => ({ name: partName(LYING_PARTS.set, animation, part, hairStyle) }));
  }
  return PART_SETS[set].order
    .filter(({ onlyFor, onlyIn }) => (!onlyFor || onlyFor === hairStyle) && (!onlyIn || onlyIn === animation))
    .map(({ part, then, arm, still }) => ({ name: partName(set, animation, part, hairStyle, face), then, arm, still }));
}

// A frame's size and the frames in a strip.
function frameOf(set, animation) {
  if (animation === 'lying') return { ...LYING_PARTS.frame, frames: 1 };
  return { width: PART_FRAME.width, height: PART_FRAME.height, frames: PART_SETS[set].animations[animation].frames };
}

// The faces the set can show in the animation.
function facesOf(set, animation) {
  return PART_SETS[set].lookBack && animation === 'sit' ? [...FACES, 'back'] : FACES;
}

// Whether every part this hair style can show in the set's animation has
// a PNG big enough for its frames (every face too, so a blink or a look
// back never switches art). `lookup(name)` is getSprite() or a stand-in.
export function partsComplete(set, animation, hairStyle, lookup) {
  const { width, height, frames } = frameOf(set, animation);
  const names = new Set(facesOf(set, animation)
    .flatMap((face) => partsFor(set, animation, hairStyle, face).map(({ name }) => name)));
  return [...names].every((name) => {
    const image = lookup(name)?.image;
    return Boolean(image) && image.naturalWidth >= width * frames && image.naturalHeight >= height;
  });
}

function hasAllParts(set, animation, hairStyle) {
  const key = `${set}|${animation}|${hairStyle}`;
  if (!complete.has(key)) complete.set(key, partsComplete(set, animation, hairStyle, getSprite));
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

// The face part for the pose: closed eyes while blinking, looking back
// (sitting, where the set has it), or the expression.
function faceOf(set, animation, pose, expression) {
  if (pose.blinking) return 'blink';
  if (pose.gaze === -1 && facesOf(set, animation).includes('back')) return 'back';
  return expression;
}

// The parts to draw for the pose, or null to draw it in code: { set,
// animation, frame, size ({ width, height }), place (the set's frame
// place; null lying), mouth (the mouth's color), strips: [{ canvas, then,
// arm, still }] back to front }. `look` is the appearance with any job
// item's shirt swapped in.
export function characterParts(stage, pose, look, expression) {
  const chosen = partPose(stage, pose);
  if (!chosen) return null;
  const { set, animation } = chosen;
  if (!hasAllParts(set, animation, look.hairStyle)) return null;
  const colored = PART_SETS[set].hair ? { ...look, hair: PART_SETS[set].hair } : look;
  const { width, height, frames } = frameOf(set, animation);
  const stepped = animation === 'walk' || animation === 'crawl';
  const frame = stepped
    ? Math.min(frames - 1, Math.floor((pose.walk?.cycle ?? 0) * frames))
    : Math.min(frames - 1, animation === 'lying' ? 0 : pose.breath);
  let colors = null;
  const colorMap = () => (colors ??= partColorMap(colored));
  return {
    set,
    animation,
    frame,
    size: { width, height },
    place: animation === 'lying' ? null : PART_SETS[set].animations[animation].places[frame],
    mouth: colorMap().get(PART_MOUTH),
    strips: partsFor(set, animation, look.hairStyle, faceOf(set, animation, pose, expression))
      .map(({ name, then, arm, still }) => ({ canvas: recolored(name, colored, colorMap), then, arm, still })),
  };
}

// Draws the parts' frame of `canvas` onto `layer` with its top-left at
// (left, top).
export function drawPartFrame(layer, parts, canvas, left, top) {
  const { width, height } = parts.size;
  layer.ctx.drawImage(canvas, parts.frame * width, 0, width, height, left, top, width, height);
}
