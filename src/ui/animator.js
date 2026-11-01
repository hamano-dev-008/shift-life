// animator.js — Purely visual motion for the character: wandering, visiting
// the house and tree, facing, walking legs, breathing, and blinking. Never
// touches game state. Speeds and timings live in data/animation.js.

import { PROPS, WANDER_MIN_X, WANDER_MAX_X } from '../data/layout.js';
import {
  WALK_SPEED, STRIDE_LENGTH, IDLE_PAUSE, VISIT_PAUSE, VISIT_CHANCE,
  MIN_WALK_DISTANCE, BLINK_INTERVAL, BLINK_DURATION, BREATH_CYCLE,
} from '../data/animation.js';

function randomIn([min, max]) {
  return min + Math.random() * (max - min);
}

export function createAnimator() {
  return {
    x: randomIn([WANDER_MIN_X + 30, WANDER_MAX_X - 30]),
    facing: 1, // 1 = right, -1 = left
    walking: false,
    targetX: 0,
    destination: null, // prop id being walked to, or null
    lastVisited: null,
    pauseLeft: randomIn([1, 3]),
    walked: 0, // canvas pixels walked, drives the leg frames
    blinkIn: randomIn(BLINK_INTERVAL),
    blinkLeft: 0,
    time: 0,
  };
}

// Sometimes heads to a prop (not the one just visited), otherwise to a
// random spot at least MIN_WALK_DISTANCE away.
function chooseTarget(anim) {
  if (Math.random() < VISIT_CHANCE) {
    const choices = Object.keys(PROPS).filter((id) => id !== anim.lastVisited);
    const id = choices[Math.floor(Math.random() * choices.length)];
    if (Math.abs(PROPS[id].visitX - anim.x) >= MIN_WALK_DISTANCE) {
      return { x: PROPS[id].visitX, destination: id };
    }
  }
  let x;
  do {
    x = randomIn([WANDER_MIN_X, WANDER_MAX_X]);
  } while (Math.abs(x - anim.x) < MIN_WALK_DISTANCE);
  return { x, destination: null };
}

export function updateAnimator(anim, dt, stage) {
  anim.time += dt;

  if (anim.walking) {
    const step = WALK_SPEED[stage] * dt;
    const distance = anim.targetX - anim.x;
    if (Math.abs(distance) <= step) {
      anim.walked += Math.abs(distance);
      anim.x = anim.targetX;
      anim.walking = false;
      anim.lastVisited = anim.destination;
      anim.pauseLeft = randomIn(anim.destination ? VISIT_PAUSE : IDLE_PAUSE);
    } else {
      anim.x += Math.sign(distance) * step;
      anim.walked += step;
    }
  } else if ((anim.pauseLeft -= dt) <= 0) {
    const target = chooseTarget(anim);
    anim.targetX = target.x;
    anim.destination = target.destination;
    anim.facing = Math.sign(target.x - anim.x);
    anim.walking = true;
  }

  if (anim.blinkLeft > 0) {
    anim.blinkLeft -= dt;
  } else if ((anim.blinkIn -= dt) <= 0) {
    anim.blinkLeft = BLINK_DURATION;
    anim.blinkIn = randomIn(BLINK_INTERVAL);
  }
}

// The current frame's pose, in the shape drawCharacter() expects.
export function poseOf(anim, stage) {
  return {
    x: Math.round(anim.x),
    facing: anim.facing,
    blinking: anim.blinkLeft > 0,
    breath: !anim.walking && anim.time % BREATH_CYCLE > BREATH_CYCLE * 0.6 ? 1 : 0,
    // 2-frame walk: legs together, then mid-stride, alternating with
    // ground covered so the feet don't slide.
    stride: anim.walking && Math.floor(anim.walked / STRIDE_LENGTH[stage]) % 2 === 1,
  };
}
