// animator.js — Purely visual motion for the character: wandering, visiting
// the house and tree, turning, the walk cycle, breathing, and blinking.
// Never touches game state. Speeds and timings live in data/animation.js,
// in scene pixels; positions here are canvas pixels from computeLayout().

import {
  WALK_SPEED, STRIDE, IDLE_PAUSE, VISIT_PAUSE, TURN_BEAT, VISIT_CHANCE,
  MIN_WALK_DISTANCE, BLINK_INTERVAL, BLINK_DURATION, BREATH_CYCLE,
} from '../data/animation.js';

function randomIn([min, max]) {
  return min + Math.random() * (max - min);
}

export function createAnimator(layout) {
  const middle = (layout.wanderMinX + layout.wanderMaxX) / 2;
  const spread = (layout.wanderMaxX - layout.wanderMinX) / 4;
  const x = randomIn([middle - spread, middle + spread]);
  return {
    layout,
    x,
    facing: 1, // 1 = right, -1 = left
    mode: 'idle', // 'idle' (standing), 'turning' (beat after turning), 'walking'
    targetX: 0,
    destination: null, // prop id being walked to, or null
    lastVisited: null,
    pauseLeft: randomIn([1, 3]),
    gridX: Math.round(x / layout.scale), // position in whole scene pixels
    steps: 0, // whole scene pixels walked this walk; drives the walk cycle
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

function startWalking(anim) {
  anim.mode = 'walking';
  anim.steps = 0;
}

// Moves toward the target and counts each whole scene pixel crossed, so
// walk frames change exactly when the drawn sprite moves a pixel.
function walk(anim, dt, stage) {
  const { scale } = anim.layout;
  const step = WALK_SPEED[stage] * scale * dt;
  const distance = anim.targetX - anim.x;
  const arrived = Math.abs(distance) <= step;
  anim.x = arrived ? anim.targetX : anim.x + Math.sign(distance) * step;

  const gridX = Math.round(anim.x / scale);
  anim.steps += Math.abs(gridX - anim.gridX);
  anim.gridX = gridX;

  if (arrived) {
    anim.mode = 'idle';
    anim.lastVisited = anim.destination;
    anim.pauseLeft = randomIn(anim.destination ? VISIT_PAUSE : IDLE_PAUSE);
  }
}

export function updateAnimator(anim, dt, stage) {
  anim.time += dt;

  if (anim.mode === 'walking') {
    walk(anim, dt, stage);
  } else if ((anim.pauseLeft -= dt) <= 0) {
    if (anim.mode === 'turning') {
      startWalking(anim);
    } else {
      const target = chooseTarget(anim);
      anim.targetX = target.x;
      anim.destination = target.destination;
      const direction = Math.sign(target.x - anim.x);
      if (direction === anim.facing) {
        startWalking(anim);
      } else {
        // Turn around, then take a beat before setting off.
        anim.facing = direction;
        anim.mode = 'turning';
        anim.pauseLeft = randomIn(TURN_BEAT);
      }
    }
  }

  if (anim.blinkLeft > 0) {
    anim.blinkLeft -= dt;
  } else if ((anim.blinkIn -= dt) <= 0) {
    anim.blinkLeft = BLINK_DURATION;
    anim.blinkIn = randomIn(BLINK_INTERVAL);
  }
}

// Leg and frame details for a point in the walk cycle. `p` is whole scene
// pixels into the cycle (0 to 4 x stride - 1). Foot reach is relative to
// the hips, positive = forward.
//
// Each step, one foot is planted: its reach drops 1px for every pixel the
// body moves forward, so it stays fixed on the ground. The other foot
// swings from behind to in front, off the ground while passing.
function walkPose(p, stride) {
  const frame = Math.floor(p / stride); // 0 contact, 1 passing, 2 contact (other leg), 3 passing
  const intoStep = p % (2 * stride);
  const planted = stride - intoStep;
  const swinging = intoStep - stride;
  const nearPlanted = p < 2 * stride;
  const passing = frame % 2 === 1;
  return {
    frame,
    nearReach: nearPlanted ? planted : swinging,
    farReach: nearPlanted ? swinging : planted,
    nearLifted: passing && !nearPlanted,
    farLifted: passing && nearPlanted,
  };
}

// The current frame's pose, in the shape drawCharacter() expects. x is
// snapped to whole scene pixels so the sprite moves in crisp steps.
export function poseOf(anim, stage) {
  const walking = anim.mode === 'walking';
  const stride = STRIDE[stage];
  return {
    x: anim.gridX * anim.layout.scale,
    facing: anim.facing,
    blinking: anim.blinkLeft > 0,
    breath: !walking && anim.time % BREATH_CYCLE > BREATH_CYCLE * 0.6 ? 1 : 0,
    walk: walking ? walkPose(anim.steps % (4 * stride), stride) : null,
  };
}
