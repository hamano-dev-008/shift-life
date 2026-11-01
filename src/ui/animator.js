// animator.js — Purely visual motion for the character: wandering back and
// forth with pauses, facing, breathing, and blinking. Never touches game state.

import { SCENE_WIDTH } from './scene.js';

// Walking speed per life stage, in canvas pixels per second.
const WALK_SPEED = { baby: 3, child: 10, teen: 12, adult: 10, elder: 5 };
const MIN_X = 14;
const MAX_X = SCENE_WIDTH - 14;
const MIN_WALK_DISTANCE = 12;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function createAnimator() {
  return {
    x: rand(MIN_X + 20, MAX_X - 20),
    facing: 1, // 1 = right, -1 = left
    walking: false,
    targetX: 0,
    pauseLeft: rand(1, 3),
    blinkIn: rand(2, 5),
    blinkLeft: 0,
    time: 0,
  };
}

export function updateAnimator(anim, dt, stage) {
  anim.time += dt;

  if (anim.walking) {
    const step = WALK_SPEED[stage] * dt;
    const distance = anim.targetX - anim.x;
    if (Math.abs(distance) <= step) {
      anim.x = anim.targetX;
      anim.walking = false;
      anim.pauseLeft = rand(1.5, 6);
    } else {
      anim.x += Math.sign(distance) * step;
    }
  } else if ((anim.pauseLeft -= dt) <= 0) {
    do {
      anim.targetX = rand(MIN_X, MAX_X);
    } while (Math.abs(anim.targetX - anim.x) < MIN_WALK_DISTANCE);
    anim.facing = Math.sign(anim.targetX - anim.x);
    anim.walking = true;
  }

  if (anim.blinkLeft > 0) {
    anim.blinkLeft -= dt;
  } else if ((anim.blinkIn -= dt) <= 0) {
    anim.blinkLeft = 0.15;
    anim.blinkIn = rand(2, 6);
  }
}

// The current frame's pose, in the shape drawCharacter() expects.
export function poseOf(anim, stage) {
  return {
    x: Math.round(anim.x),
    facing: anim.facing,
    blinking: anim.blinkLeft > 0,
    // Idle breathing: the head dips 1px for part of each 2s cycle.
    breath: !anim.walking && anim.time % 2 > 1.2 ? 1 : 0,
    // Which leg is lifted (0 or 1); steps get quicker as walking speeds up.
    step: anim.walking ? Math.floor(anim.time * WALK_SPEED[stage] / 2) % 2 : -1,
  };
}
