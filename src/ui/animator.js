// animator.js — Purely visual motion for the character: wandering, visiting
// the house and tree, facing, walking legs, breathing, and blinking. Never
// touches game state. Speeds and timings live in data/animation.js, in
// scene pixels; positions here are canvas pixels from computeLayout().

import {
  WALK_SPEED, STRIDE_LENGTH, IDLE_PAUSE, VISIT_PAUSE, VISIT_CHANCE,
  MIN_WALK_DISTANCE, BLINK_INTERVAL, BLINK_DURATION, BREATH_CYCLE,
} from '../data/animation.js';

function randomIn([min, max]) {
  return min + Math.random() * (max - min);
}

export function createAnimator(layout) {
  const middle = (layout.wanderMinX + layout.wanderMaxX) / 2;
  const spread = (layout.wanderMaxX - layout.wanderMinX) / 4;
  return {
    layout,
    x: randomIn([middle - spread, middle + spread]),
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
  const { props, wanderMinX, wanderMaxX, scale } = anim.layout;
  const minDistance = MIN_WALK_DISTANCE * scale;
  if (Math.random() < VISIT_CHANCE) {
    const choices = Object.keys(props).filter((id) => id !== anim.lastVisited);
    const id = choices[Math.floor(Math.random() * choices.length)];
    if (Math.abs(props[id].visitX - anim.x) >= minDistance) {
      return { x: props[id].visitX, destination: id };
    }
  }
  let x;
  do {
    x = randomIn([wanderMinX, wanderMaxX]);
  } while (Math.abs(x - anim.x) < minDistance);
  return { x, destination: null };
}

export function updateAnimator(anim, dt, stage) {
  anim.time += dt;

  if (anim.walking) {
    const step = WALK_SPEED[stage] * anim.layout.scale * dt;
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
    stride: anim.walking && Math.floor(anim.walked / (STRIDE_LENGTH[stage] * anim.layout.scale)) % 2 === 1,
  };
}
