// animator.js — Purely visual motion for the character: wandering, visiting
// the tree, goal activities (reading, counting coins, jogging,
// waving), walking off "to work" and back, busking under the Fortune
// Tree, resting on the sofa, sitting down for good at the end of a life
// (eyes closing), walking out of a place (off an edge or through a door)
// and into the next, turning, the walk cycle, crawling
// and toddling for the youngest (with sitting, fidgets and plops),
// breathing, and blinking. Never touches game state; the renderer passes
// in the gait for the age, which activity the goal calls for, whether the
// character has a job, where to busk or rest, and drives trips between
// places (travelTo(), enterScene()).
// Speeds and timings live in data/animation.js and data/infant.js
// (walking and crawling in character pixels, other distances in scene
// pixels); positions here are canvas pixels from computeLayout().

import {
  WALK_SPEED, STRIDE, IDLE_PAUSE, VISIT_PAUSE, TURN_BEAT, VISIT_CHANCE,
  MIN_WALK_DISTANCE, BLINK_INTERVAL, BLINK_DURATION, BREATH_CYCLE,
  ACTIVITY_CHANCE, ACTIVITIES, WORK_AWAY, WORK_EXIT,
} from '../data/animation.js';
import {
  CRAWL_UNTIL_AGE, WALK_FROM_AGE, CRAWL, TODDLE, PLOP_CHANCE, PLOP_DURATION,
  BABY_FIDGET_INTERVAL, BABY_LOOK_CHANCE, BABY_LOOK_DURATION, BABY_WOBBLE_DURATION,
} from '../data/infant.js';
import { FAREWELL } from '../data/endOfLife.js';

// Crawling and toddling numbers by gait; walking uses the per-stage
// WALK_SPEED and STRIDE.
const INFANT_GAITS = { crawl: CRAWL, toddle: TODDLE };

// Modes for staying put somewhere (see updateStay()): 'farewell' is
// sitting down at the end of a life; 'doing' is doing a place activity
// such as fishing (standing at its spot, facing its way).
const STAY_MODES = ['busking', 'resting', 'farewell', 'doing'];

// A wobble shifts the sitting baby's upper body through these columns.
const WOBBLE_STEPS = [1, 0, -1, 0];

function randomIn([min, max]) {
  return min + Math.random() * (max - min);
}

// How the character gets around at `age` (whole years): 'crawl',
// 'toddle', or 'walk'.
export function gaitOf(age) {
  if (age < CRAWL_UNTIL_AGE) return 'crawl';
  if (age < WALK_FROM_AGE) return 'toddle';
  return 'walk';
}

export function createAnimator(layout) {
  const middle = (layout.wanderMinX + layout.wanderMaxX) / 2;
  const spread = (layout.wanderMaxX - layout.wanderMinX) / 4;
  const x = randomIn([middle - spread, middle + spread]);
  return {
    layout,
    x,
    facing: 1, // 1 = right, -1 = left
    gait: 'walk', // set every update from the age
    // 'idle' (standing, or sitting for a crawler), 'turning' (beat after
    // turning), 'walking' (or crawling/toddling), 'plopped' (a toddler
    // sat down mid-walk), 'activity' (doing `activity`; jogging also
    // walks during it), 'away' (at work, off past the window's edge),
    // 'busking' (sitting under the tree playing), 'resting' (lying on the
    // sofa), 'farewell' (sitting, eyes closed, at the end of a life), or
    // 'exited' (reached the way out of the place, waiting for
    // the next one)
    mode: 'idle',
    activity: null, // activity id being done, or being walked to
    activityLeft: 0,
    activityTime: 0, // seconds into the current activity
    jogging: false, // running to a spot while jogging
    leftForWork: false, // just set off to work (takeLeftForWork() clears it)
    targetX: 0,
    destination: null, // prop id, 'work', 'stay' or 'exit' being walked to, or null
    travelling: false, // walking out of the place (travelTo())
    stayMode: null, // 'busking' or 'resting' once at the stay spot
    stayX: null, // the stay spot being walked to or stayed at
    stayLift: 0, // canvas pixels the figure is raised while staying
    stayActivity: null, // the pose's activity while 'doing' (e.g. 'fish')
    stayFacing: 0, // which way to face while staying (0: as they arrive)
    stayBed: null, // what they lie on while resting ({ pillow, cover, headLift })
    lastVisited: null,
    pauseLeft: randomIn([1, 3]),
    gridX: Math.round(x / layout.characterScale), // position in whole character pixels
    steps: 0, // whole character pixels walked this walk; drives the walk cycle
    fidgetIn: randomIn(BABY_FIDGET_INTERVAL),
    lookLeft: 0, // seconds left looking back over the shoulder
    wobbleLeft: 0, // seconds left wobbling
    blinkIn: randomIn(BLINK_INTERVAL),
    blinkLeft: 0,
    time: 0,
  };
}

// The longest trip for the current gait, in canvas pixels, or Infinity.
function maxTrip(anim) {
  const trip = INFANT_GAITS[anim.gait]?.maxTrip;
  return trip ? trip * anim.layout.scale : Infinity;
}

// Sometimes heads to a prop (not the one just visited, not one marked
// visit: false, and not beyond the gait's longest trip), otherwise to a
// random spot.
function chooseTarget(anim) {
  const { props, scale } = anim.layout;
  const minDistance = MIN_WALK_DISTANCE * scale;
  const choices = Object.keys(props).filter((id) => id !== anim.lastVisited && props[id].visit !== false);
  if (choices.length && Math.random() < VISIT_CHANCE) {
    const id = choices[Math.floor(Math.random() * choices.length)];
    const distance = Math.abs(props[id].visitX - anim.x);
    if (distance >= minDistance && distance <= maxTrip(anim)) {
      return { x: props[id].visitX, destination: id };
    }
  }
  return { x: randomSpot(anim), destination: null };
}

// A random spot in the wander area at least MIN_WALK_DISTANCE away and
// within the gait's longest trip.
function randomSpot(anim) {
  const { wanderMinX, wanderMaxX, scale } = anim.layout;
  const minDistance = MIN_WALK_DISTANCE * scale;
  const reach = maxTrip(anim);
  const low = Math.max(wanderMinX, anim.x - reach);
  const high = Math.min(wanderMaxX, anim.x + reach);
  for (let tries = 0; tries < 50; tries++) {
    const x = randomIn([low, high]);
    if (Math.abs(x - anim.x) >= minDistance) return x;
  }
  // Squeezed against an edge: go the longer way.
  return anim.x - low > high - anim.x ? low : high;
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

// Character pixels per second for the gait (and stage, when walking).
function gaitSpeed(anim, stage) {
  return INFANT_GAITS[anim.gait]?.speed ?? WALK_SPEED[stage];
}

function gaitStride(anim, stage) {
  return INFANT_GAITS[anim.gait]?.stride ?? STRIDE[stage];
}

// Moves toward the target at `speed` times the gait's speed and counts
// each whole character pixel crossed, so walk (or crawl) frames change
// exactly when the drawn sprite moves a pixel. Returns whether the target
// was reached.
function walk(anim, dt, stage, speed = 1) {
  const { characterScale: scale } = anim.layout;
  const step = gaitSpeed(anim, stage) * speed * scale * dt;
  const distance = anim.targetX - anim.x;
  const arrived = Math.abs(distance) <= step;
  anim.x = arrived ? anim.targetX : anim.x + Math.sign(distance) * step;

  const gridX = Math.round(anim.x / scale);
  anim.steps += Math.abs(gridX - anim.gridX);
  anim.gridX = gridX;
  return arrived;
}

// End of a walk: off at work, settle in to busk or rest, start the
// activity walked to, or pause.
function arrive(anim) {
  anim.lastVisited = anim.destination;
  if (anim.destination === 'stay') {
    startStay(anim);
  } else if (anim.destination === 'work') {
    anim.mode = 'away';
    anim.pauseLeft = randomIn(WORK_AWAY);
  } else if (anim.activity) {
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
  // A place without that prop: do it right here.
  const spot = anim.layout.props[place]?.visitX ?? anim.x;
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

// A crawler sitting still now and then looks back over their shoulder or
// wobbles. Anyone else (or a crawler on the move) stops fidgeting.
function updateFidgets(anim, dt) {
  anim.lookLeft = Math.max(0, anim.lookLeft - dt);
  anim.wobbleLeft = Math.max(0, anim.wobbleLeft - dt);
  const sitting = anim.gait === 'crawl' && (anim.mode === 'idle' || anim.mode === 'turning');
  if (!sitting) {
    anim.lookLeft = 0;
    anim.wobbleLeft = 0;
    return;
  }
  if ((anim.fidgetIn -= dt) > 0 || anim.lookLeft > 0 || anim.wobbleLeft > 0) return;
  if (Math.random() < BABY_LOOK_CHANCE) {
    anim.lookLeft = randomIn(BABY_LOOK_DURATION);
  } else {
    anim.wobbleLeft = BABY_WOBBLE_DURATION;
  }
  anim.fidgetIn = randomIn(BABY_FIDGET_INTERVAL);
}

// Walks out the nearest side of the window that's open (not the Lake's
// water), WORK_EXIT past the edge.
function goToWork(anim) {
  const { width, scale } = anim.layout;
  const open = anim.layout.openSides ?? { left: true, right: true };
  const left = open.left && (anim.x < width / 2 || !open.right);
  const x = left ? -WORK_EXIT * scale : width + WORK_EXIT * scale;
  anim.activity = null;
  anim.leftForWork = true;
  setOff(anim, { x, destination: 'work' });
}

// Whether the character just set off to work since the last call (for the
// renderer's "Off to work!" bubble and the trip cooldown); clears it.
export function takeLeftForWork(anim) {
  const left = anim.leftForWork;
  anim.leftForWork = false;
  return left;
}

// At work: off past the window's edge until they come back.
export function isAtWork(anim) {
  return anim.mode === 'away';
}

// Calls them back from work at once (clicking the place label): walks
// back in if away, turns back if on the way out. Returns whether they
// were at or heading to work.
export function callBackFromWork(anim) {
  if (anim.mode === 'away') {
    comeBack(anim);
    return true;
  }
  if (anim.destination === 'work' && !anim.travelling) {
    setOff(anim, { x: randomSpot(anim), destination: null });
    return true;
  }
  return false;
}

// Back from work (or called back early): walks in from the side they left
// by, already facing in, to a random spot.
function comeBack(anim) {
  anim.mode = 'idle';
  anim.gridX = Math.round(anim.x / anim.layout.characterScale);
  const target = { x: randomSpot(anim), destination: null };
  anim.facing = Math.sign(target.x - anim.x) || anim.facing;
  setOff(anim, target);
}

// Staying put to busk or rest, or walking to do so.
function isStaying(anim) {
  return STAY_MODES.includes(anim.mode) || anim.destination === 'stay';
}

// Sends the character to work right away, unless already there, staying
// put, or travelling. For the Ctrl+Shift+W dev shortcut.
export function goToWorkNow(anim) {
  if (anim.mode === 'away' || anim.destination === 'work') return;
  if (isStaying(anim) || anim.travelling) return;
  anim.jogging = false;
  goToWork(anim);
}

function startStay(anim) {
  anim.mode = anim.stayMode;
  if (anim.stayFacing) anim.facing = anim.stayFacing;
  anim.activity = null;
  anim.jogging = false;
  anim.activityTime = 0;
}

// While busking or resting, gets to the spot `stay.x` and stays there in
// `stay.mode`: back from work, done with any activity, and no wandering
// until it stops.
function updateStay(anim, dt, stage, stay) {
  anim.stayLift = stay.lift ?? 0;
  anim.stayActivity = stay.activity ?? null;
  anim.stayFacing = stay.facing ?? 0;
  anim.stayBed = stay.bed ?? null;
  // Staying there already; a new spot for the same mode (another rice
  // paddy) means walking over to it.
  const sameSpot = anim.stayX !== null && Math.abs(stay.x - anim.stayX) < 1;
  if (anim.mode === stay.mode && sameSpot) {
    if (anim.stayFacing) anim.facing = anim.stayFacing;
    anim.activityTime += dt;
    return;
  }
  anim.stayMode = stay.mode;
  if (anim.mode === 'away') {
    anim.mode = 'idle';
    anim.gridX = Math.round(anim.x / anim.layout.characterScale);
  }
  if (STAY_MODES.includes(anim.mode)) anim.mode = 'idle';
  const heading = anim.destination === 'stay' && sameSpot && ['walking', 'turning', 'plopped'].includes(anim.mode);
  if (!heading) {
    anim.activity = null;
    anim.jogging = false;
    anim.stayX = stay.x;
    if (Math.abs(stay.x - anim.x) < anim.layout.scale) {
      startStay(anim);
      return;
    }
    setOff(anim, { x: stay.x, destination: 'stay' });
  }
  if (anim.mode === 'walking') {
    if (walk(anim, dt, stage)) arrive(anim);
  } else if ((anim.pauseLeft -= dt) <= 0) {
    startWalking(anim);
  }
}

// Whether the character has arrived at `stay`'s spot (the same `stay`
// passed to updateAnimator()) and settled into its pose: sitting under
// the tree, lying down, at the activity's spot facing its way. The
// renderer reports it to the game (game/stay.js), which only then starts
// counting. Settled at another spot (a different rice paddy) doesn't
// count.
export function hasSettled(anim, stay) {
  return Boolean(stay) && !anim.travelling && anim.mode === stay.mode
    && anim.stayX !== null && Math.abs(stay.x - anim.stayX) < 1;
}

// Stops staying (or heading off to stay): gets up and carries on.
function stopStay(anim) {
  if (STAY_MODES.includes(anim.mode)) {
    anim.mode = 'idle';
    anim.pauseLeft = randomIn(IDLE_PAUSE);
  }
  if (anim.destination === 'stay') anim.destination = null;
}

// Starts activity `id` right away, replacing whatever is going on. For the
// Ctrl+Shift+A dev shortcut.
export function startActivityNow(anim, id) {
  if (!ACTIVITIES[id] || isStaying(anim) || anim.travelling) return;
  anim.jogging = false;
  beginActivity(anim, id);
}

// Starts walking to canvas x `x` to leave the place: off past an edge or
// to a door. Drops whatever was going on (staying, an activity, work: from
// off-screen they just walk to it). hasExited() says when they're there.
export function travelTo(anim, x) {
  if (anim.mode === 'away') anim.gridX = Math.round(anim.x / anim.layout.characterScale);
  anim.travelling = true;
  anim.activity = null;
  anim.jogging = false;
  anim.mode = 'idle';
  if (Math.abs(x - anim.x) < 1) {
    anim.x = x;
    anim.mode = 'exited';
    return;
  }
  setOff(anim, { x, destination: 'exit' });
}

export function hasExited(anim) {
  return anim.mode === 'exited';
}

export function isTravelling(anim) {
  return anim.travelling;
}

// Stops walking out of the place (the trip was called off); what to do
// next comes from the next update, e.g. walking back in to stay.
export function stopTravelling(anim) {
  anim.travelling = false;
  if (anim.destination === 'exit') anim.destination = null;
}

// Walking to the exit; toddlers still plop now and then.
function updateTravel(anim, dt, stage) {
  if (anim.mode === 'walking') {
    if (walk(anim, dt, stage)) {
      anim.mode = 'exited';
    } else if (anim.gait === 'toddle' && Math.random() < PLOP_CHANCE * dt) {
      anim.mode = 'plopped';
      anim.pauseLeft = randomIn(PLOP_DURATION);
    }
  } else if (anim.mode !== 'exited' && (anim.pauseLeft -= dt) <= 0) {
    startWalking(anim);
  }
}

// Puts the character into a new place's `layout` at canvas x `x`: past an
// edge (then walking in to `inX`, facing in) or at a door (`inX` null:
// standing there). Ends the travelling; call travelTo() again to carry on
// through.
export function enterScene(anim, layout, x, inX = null) {
  anim.layout = layout;
  anim.x = x;
  anim.gridX = Math.round(x / layout.characterScale);
  anim.travelling = false;
  anim.destination = null;
  anim.lastVisited = null;
  anim.activity = null;
  anim.jogging = false;
  anim.mode = 'idle';
  anim.pauseLeft = randomIn(IDLE_PAUSE);
  if (inX !== null) {
    anim.facing = Math.sign(inX - x) || anim.facing;
    setOff(anim, { x: inX, destination: null });
  }
}

// Swaps in a new `layout` for the same place (its props changed: a new
// housing tier), leaving the character where they are, doing what they
// were doing.
export function setLayout(anim, layout) {
  anim.layout = layout;
  anim.lastVisited = null;
}

// Moves the character into `layout` at once, somewhere near the middle
// (dev menu's Go to).
export function placeIn(anim, layout) {
  const middle = (layout.wanderMinX + layout.wanderMaxX) / 2;
  enterScene(anim, layout, middle + randomIn([-1, 1]) * (layout.wanderMaxX - layout.wanderMinX) / 4);
}

// `gait` is gaitOf(age). `activity` is the goal's activity id (ACTIVITIES
// in data/animation.js), or null; it's only used when deciding what to do
// next. `employed`: the character has a job and work trips are on; false
// brings them back from work. `mayGoToWork`: a work trip may start now
// (game/workTrips.js: the real-time cooldown, the quiet spell after a
// click, nothing showing); it's only taken when an idle pause ends, and
// is the only way they leave the window other than travelling.
// `needed`: something wants them on screen (an event, a bubble), so they
// don't leave, and come back if they're out. `stay`: while busking or
// resting, { x, mode, lift, activity, facing, bed }: they go to canvas x `x`
// and stay in `mode` ('busking', 'resting', 'farewell' or 'doing'), with
// no wandering, activities or work trips; `lift` raises the figure that
// many canvas pixels (lying on the sofa); while 'doing', `activity` is
// the pose's activity (e.g. 'fish') and `facing` (-1 or 1) the way they
// face once there.
// Null otherwise. Travelling (travelTo()) comes before all of this.
export function updateAnimator(anim, dt, stage, gait, {
  activity = null, employed = false, mayGoToWork = false, needed = false, stay = null,
} = {}) {
  anim.time += dt;
  anim.gait = gait;
  if (anim.travelling) {
    updateTravel(anim, dt, stage);
    updateTimers(anim, dt);
    return;
  }
  if (stay) {
    updateStay(anim, dt, stage, stay);
    updateTimers(anim, dt);
    return;
  }
  stopStay(anim);
  const headingToWork = ['walking', 'turning'].includes(anim.mode) && anim.destination === 'work';
  if (headingToWork && (needed || !employed)) {
    // Turn back: work can wait.
    setOff(anim, { x: randomSpot(anim), destination: null });
  }

  if (anim.mode === 'away') {
    if ((anim.pauseLeft -= dt) <= 0 || needed || !employed) comeBack(anim);
  } else if (anim.mode === 'walking') {
    if (walk(anim, dt, stage)) {
      arrive(anim);
    } else if (gait === 'toddle' && Math.random() < PLOP_CHANCE * dt) {
      // Plop! Sit for a moment, then carry on to the same spot.
      anim.mode = 'plopped';
      anim.pauseLeft = randomIn(PLOP_DURATION);
    }
  } else if (anim.mode === 'activity') {
    updateActivity(anim, dt, stage);
  } else if ((anim.pauseLeft -= dt) <= 0) {
    if (anim.mode === 'turning' || anim.mode === 'plopped') {
      startWalking(anim);
    } else if (employed && !needed && mayGoToWork) {
      goToWork(anim);
    } else if (ACTIVITIES[activity] && Math.random() < ACTIVITY_CHANCE) {
      beginActivity(anim, activity);
    } else {
      setOff(anim, chooseTarget(anim));
    }
  }
  updateTimers(anim, dt);
}

// Fidgets and blinking, whatever else is going on.
function updateTimers(anim, dt) {
  updateFidgets(anim, dt);
  if (anim.blinkLeft > 0) {
    anim.blinkLeft -= dt;
  } else if ((anim.blinkIn -= dt) <= 0) {
    anim.blinkLeft = BLINK_DURATION;
    anim.blinkIn = randomIn(BLINK_INTERVAL);
  }
}

// Leg and frame details for a point in the walk cycle. `p` is whole
// character pixels into the cycle (0 to 4 x stride - 1). Foot reach is
// relative to the hips, positive = forward.
//
// Each step, one foot is planted: its reach drops 1px for every pixel the
// body moves forward, so it stays fixed on the ground. The other foot
// swings from behind to in front, off the ground while passing. Crawling
// uses the same cycle: "near" is the near hand with the far knee, "far" is
// the far hand with the near knee, so opposite hand and knee move together.
// `cycle` is how far through the whole cycle, 0 to 1 (for sprite sheets).
function walkPose(p, stride) {
  const frame = Math.floor(p / stride); // 0 contact, 1 passing, 2 contact (other leg), 3 passing
  const intoStep = p % (2 * stride);
  const planted = stride - intoStep;
  const swinging = intoStep - stride;
  const nearPlanted = p < 2 * stride;
  const passing = frame % 2 === 1;
  return {
    frame,
    cycle: p / (4 * stride),
    nearReach: nearPlanted ? planted : swinging,
    farReach: nearPlanted ? swinging : planted,
    nearLifted: passing && !nearPlanted,
    farLifted: passing && nearPlanted,
  };
}

// The current frame's pose, in the shape drawCharacter() expects. x is
// snapped to whole character pixels so the sprite moves in crisp steps.
// `gait` is 'crawl', 'toddle' or 'walk'; `sit` means sitting on the ground
// (a crawler at rest, a toddler who plopped, busking, or the end of a
// life, eyes closed); `gaze` is -1 while looking back over the shoulder;
// `wobble` shifts the sitting upper body sideways. `lying` means lying down (resting on the sofa), raised `lift`
// canvas pixels above the feet row, on `bed` (REST_BEDS in data/home.js:
// the pillow, the blanket or sleeping bag, and how high the head lies). `activity` is the activity being done
// (null when none; 'busk' while busking, sitting; 'rest' while resting,
// lying; a place activity's animation, e.g. 'fish', standing) and
// `activityTime` how long it has been going, in seconds.
// `time` is seconds since the animator started (for sprite animations).
export function poseOf(anim, stage) {
  const busking = anim.mode === 'busking';
  const resting = anim.mode === 'resting';
  const farewell = anim.mode === 'farewell';
  const doingStay = anim.mode === 'doing';
  const staying = busking || resting || farewell || doingStay;
  const doing = anim.mode === 'activity';
  const walking = anim.mode === 'walking' || (doing && anim.jogging);
  const sit = busking || farewell || anim.mode === 'plopped'
    || (anim.gait === 'crawl' && !walking && !doing && !resting);
  const stride = gaitStride(anim, stage);
  const wobbleStep = Math.floor((BABY_WOBBLE_DURATION - anim.wobbleLeft) * 8) % WOBBLE_STEPS.length;
  return {
    x: anim.gridX * anim.layout.characterScale,
    facing: anim.facing,
    gait: anim.gait,
    sit,
    gaze: anim.lookLeft > 0 ? -1 : 0,
    wobble: anim.wobbleLeft > 0 ? WOBBLE_STEPS[wobbleStep] : 0,
    blinking: anim.blinkLeft > 0 || (farewell && anim.activityTime >= FAREWELL.eyesCloseAfter),
    breath: !walking && anim.time % BREATH_CYCLE > BREATH_CYCLE * 0.6 ? 1 : 0,
    walk: walking ? walkPose(anim.steps % (4 * stride), stride) : null,
    lying: resting,
    lift: resting ? anim.stayLift : 0,
    bed: resting ? anim.stayBed : null,
    activity: busking ? 'busk' : resting ? 'rest' : doingStay ? anim.stayActivity : doing ? anim.activity : null,
    activityTime: doing || staying ? anim.activityTime : 0,
    time: anim.time,
  };
}
