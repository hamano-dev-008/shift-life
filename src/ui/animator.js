// animator.js — Purely visual motion for the character: wandering, visiting
// the house and tree, goal activities (reading, counting coins, jogging,
// waving), turning, the walk cycle, breathing, and blinking. Never touches
// game state; the renderer passes in which activity the goal calls for.
// Speeds and timings live in data/animation.js (walking in character
// pixels, other distances in scene pixels); positions here are canvas
// pixels from computeLayout().

import {
  WALK_SPEED, STRIDE, IDLE_PAUSE, VISIT_PAUSE, TURN_BEAT, VISIT_CHANCE,
  MIN_WALK_DISTANCE, BLINK_INTERVAL, BLINK_DURATION, BREATH_CYCLE,
  ACTIVITY_CHANCE, ACTIVITIES,
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
    // 'idle' (standing), 'turning' (beat after turning), 'walking', or
    // 'activity' (doing `activity`; jogging also walks during it)
    mode: 'idle',
    activity: null, // activity id being done, or being walked to
    activityLeft: 0,
    activityTime: 0, // seconds into the current activity
    jogging: false, // running to a spot while jogging
    targetX: 0,
    destination: null, // prop id being walked to, or null
    lastVisited: null,
    pauseLeft: randomIn([1, 3]),
    gridX: Math.round(x / layout.characterScale), // position in whole character pixels
    steps: 0, // whole character pixels walked this walk; drives the walk cycle
    blinkIn: randomIn(BLINK_INTERVAL),
    blinkLeft: 0,
    time: 0,
  };
}

// Sometimes heads to a prop (not the one just visited), otherwise to a
// random spot at least MIN_WALK_DISTANCE away.
function chooseTarget(anim) {
  const { props, scale } = anim.layout;
  const minDistance = MIN_WALK_DISTANCE * scale;
  if (Math.random() < VISIT_CHANCE) {
    const choices = Object.keys(props).filter((id) => id !== anim.lastVisited);
    const id = choices[Math.floor(Math.random() * choices.length)];
    if (Math.abs(props[id].visitX - anim.x) >= minDistance) {
      return { x: props[id].visitX, destination: id };
    }
  }
  return { x: randomSpot(anim), destination: null };
}

// A random spot in the wander area at least MIN_WALK_DISTANCE away.
function randomSpot(anim) {
  const { wanderMinX, wanderMaxX, scale } = anim.layout;
  let x;
  do {
    x = randomIn([wanderMinX, wanderMaxX]);
  } while (Math.abs(x - anim.x) < MIN_WALK_DISTANCE * scale);
  return x;
}

function startWalking(anim) {
  anim.mode = 'walking';
  anim.steps = 0;
}

// Heads for `target` ({ x, destination }). If it's behind, turns around
// first and takes a beat before setting off.
function setOff(anim, target) {
  anim.targetX = target.x;
  anim.destination = target.destination;
  const direction = Math.sign(target.x - anim.x);
  if (direction === anim.facing) {
    startWalking(anim);
  } else {
    anim.facing = direction;
    anim.mode = 'turning';
    anim.pauseLeft = randomIn(TURN_BEAT);
  }
}

// Moves toward the target at `speed` times the walking speed and counts
// each whole character pixel crossed, so walk frames change exactly when the
// drawn sprite moves a pixel. Returns whether the target was reached.
function walk(anim, dt, stage, speed = 1) {
  const { characterScale: scale } = anim.layout;
  const step = WALK_SPEED[stage] * speed * scale * dt;
  const distance = anim.targetX - anim.x;
  const arrived = Math.abs(distance) <= step;
  anim.x = arrived ? anim.targetX : anim.x + Math.sign(distance) * step;

  const gridX = Math.round(anim.x / scale);
  anim.steps += Math.abs(gridX - anim.gridX);
  anim.gridX = gridX;
  return arrived;
}

// End of a walk: start the activity walked to, or pause.
function arrive(anim) {
  anim.lastVisited = anim.destination;
  if (anim.activity) {
    startActivity(anim);
  } else {
    anim.mode = 'idle';
    anim.pauseLeft = randomIn(anim.destination ? VISIT_PAUSE : IDLE_PAUSE);
  }
}

// Walks to the activity's place first, if it has one and isn't there yet.
function beginActivity(anim, id) {
  anim.activity = id;
  const { place } = ACTIVITIES[id];
  const spot = place ? anim.layout.props[place].visitX : anim.x;
  if (Math.abs(spot - anim.x) >= anim.layout.scale) {
    setOff(anim, { x: spot, destination: place });
  } else {
    startActivity(anim);
  }
}

// At a prop, turns to face the middle of the window so the book or coins
// are in view rather than toward the edge.
function startActivity(anim) {
  if (ACTIVITIES[anim.activity].place) {
    const middle = (anim.layout.wanderMinX + anim.layout.wanderMaxX) / 2;
    anim.facing = Math.sign(middle - anim.x) || anim.facing;
  }
  anim.mode = 'activity';
  anim.activityLeft = randomIn(ACTIVITIES[anim.activity].duration);
  anim.activityTime = 0;
  anim.jogging = false;
}

// Jogging runs between random spots until time is up; the other
// activities happen standing in place.
function updateActivity(anim, dt, stage) {
  anim.activityTime += dt;
  if ((anim.activityLeft -= dt) <= 0) {
    anim.mode = 'idle';
    anim.activity = null;
    anim.jogging = false;
    anim.pauseLeft = randomIn(IDLE_PAUSE);
    return;
  }
  if (anim.activity !== 'jog') return;
  if (!anim.jogging) {
    anim.targetX = randomSpot(anim);
    anim.facing = Math.sign(anim.targetX - anim.x);
    anim.jogging = true;
    anim.steps = 0;
  }
  if (walk(anim, dt, stage, ACTIVITIES.jog.speed)) anim.jogging = false;
}

// Starts activity `id` right away, replacing whatever is going on. For the
// Ctrl+Shift+A dev shortcut.
export function startActivityNow(anim, id) {
  if (!ACTIVITIES[id]) return;
  anim.jogging = false;
  beginActivity(anim, id);
}

// `activity` is the goal's activity id (ACTIVITIES in data/animation.js),
// or null. It's only used when deciding what to do next.
export function updateAnimator(anim, dt, stage, activity = null) {
  anim.time += dt;

  if (anim.mode === 'walking') {
    if (walk(anim, dt, stage)) arrive(anim);
  } else if (anim.mode === 'activity') {
    updateActivity(anim, dt, stage);
  } else if ((anim.pauseLeft -= dt) <= 0) {
    if (anim.mode === 'turning') {
      startWalking(anim);
    } else if (ACTIVITIES[activity] && Math.random() < ACTIVITY_CHANCE) {
      beginActivity(anim, activity);
    } else {
      setOff(anim, chooseTarget(anim));
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
// snapped to whole character pixels so the sprite moves in crisp steps.
// `activity` is the activity being done (null when none) and
// `activityTime` how long it has been going, in seconds.
export function poseOf(anim, stage) {
  const doing = anim.mode === 'activity';
  const walking = anim.mode === 'walking' || (doing && anim.jogging);
  const stride = STRIDE[stage];
  return {
    x: anim.gridX * anim.layout.characterScale,
    facing: anim.facing,
    blinking: anim.blinkLeft > 0,
    breath: !walking && anim.time % BREATH_CYCLE > BREATH_CYCLE * 0.6 ? 1 : 0,
    walk: walking ? walkPose(anim.steps % (4 * stride), stride) : null,
    activity: doing ? anim.activity : null,
    activityTime: doing ? anim.activityTime : 0,
  };
}
