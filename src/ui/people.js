// people.js — What the town places' people (the Cafe's master and
// customers, the 6-Eleven's clerk and shoppers) share: walking along a
// row of the place's picture, and their pose for drawCharacter(). Their
// positions are in the picture's pixels (x from its left, rows from its
// top); `artHeight` is the picture's height in rows.

import { CHARACTER_SCALE, SCENE_SCALE } from '../data/layout.js';
import { STRIDE } from '../data/animation.js';
import { walkPose } from './animator.js';

// Character pixels a second to the picture's pixels a second.
export const toScene = (speed) => (speed * CHARACTER_SCALE) / SCENE_SCALE;
export const between = ([min, max], random) => min + (max - min) * random();
export const pick = (list, random) => list[Math.floor(random() * list.length)];

// Walks `who` ({ x, facing, walked }) toward x `target` at `speed` (the
// picture's pixels a second), counting the character pixels walked for
// the walk cycle; returns whether they're there.
export function walkToward(who, target, speed, dt) {
  const step = speed * dt;
  const distance = target - who.x;
  if (Math.abs(distance) <= step) {
    who.walked += (Math.abs(distance) * SCENE_SCALE) / CHARACTER_SCALE;
    who.x = target;
    return true;
  }
  who.facing = Math.sign(distance);
  who.x += who.facing * step;
  who.walked += (step * SCENE_SCALE) / CHARACTER_SCALE;
  return false;
}

// Canvas y of the top edge of picture row `row`.
export function pictureRowY(layout, artHeight, row) {
  return layout.height - (artHeight - row) * layout.scale;
}

// Canvas x of the middle of picture column `x`, on the character grid.
function personX(layout, x) {
  const unit = layout.characterScale;
  return Math.round((x * layout.scale) / unit) * unit;
}

// A blink now and then, its own rhythm for each `seed`.
const blinking = (time, seed) => (time + seed * 1.7) % 4.3 < 0.15;

// A person's pose for drawCharacter() (`who` is { x, facing, walked, t,
// state }): standing, walking (`walking`, else while their state is
// 'walk' or 'out') or sitting, holding something out (`activity` 'hold')
// or not.
export function personPose(layout, who, { stage, sit = false, activity = null, time, seed, walking = null }) {
  const stride = STRIDE[stage];
  walking ??= who.state === 'walk' || who.state === 'out';
  return {
    x: personX(layout, who.x),
    facing: who.facing,
    gait: 'walk',
    sit,
    gaze: 0,
    wobble: 0,
    blinking: blinking(time, seed),
    breath: !walking && time % 3 > 1.8 ? 1 : 0,
    walk: walking ? walkPose(Math.floor(who.walked) % (4 * stride), stride) : null,
    lying: false,
    lift: 0,
    bed: null,
    activity,
    activityTime: who.t,
    time,
  };
}
