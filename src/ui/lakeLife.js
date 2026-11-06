// lakeLife.js — The Lake's ambient wildlife, purely visual: frogs (their
// ways in ui/lakeFrogs.js) and butterflies drifting in from the sides,
// fluttering in soft loops over the shore and reeds, resting on a reed
// for a while, then flying on or leaving (or caught by a frog's tongue).
// Clicking a frog makes it say "ribbit!" and hop; clicking a butterfly
// makes it flutter away fast. Nothing here is saved: the renderer makes a
// new one each time the Lake is shown. Positions are lake.png pixels
// (data/lakeLife.js); ui/lakeLifeArt.js draws it. No DOM here, so tests
// can run it.

import { LILY_PADS, FROGS, BUTTERFLIES, WILDLIFE_CLICK } from '../data/lakeLife.js';
import { LAKE_ART } from '../data/lake.js';
import {
  between, newFrog, updateFrog, plop, hopAway, isSitting, onPad,
} from './lakeFrogs.js';

// The code-drawn frog is 4 x 3 pixels and a butterfly 3 x 3; click areas
// and the scare distance use these.
export const FROG_SIZE = { width: 4, height: 3 };
export const BUTTERFLY_SIZE = { width: 3, height: 3 };
// How far past the window's sides a butterfly starts and is gone.
const OFF_SIDE = 4;
// Seconds a butterfly heads for one spot before picking another (so a
// loop around it never goes on forever).
const TARGET_SECONDS = 8;

function wholeBetween([min, max], random) {
  return min + Math.floor(random() * (max - min + 1));
}

// A butterfly's wing color, picked by weight (blue is rare).
export function pickButterflyColor(random = Math.random) {
  const total = BUTTERFLIES.colors.reduce((sum, color) => sum + color.weight, 0);
  let roll = random() * total;
  for (const color of BUTTERFLIES.colors) {
    roll -= color.weight;
    if (roll < 0) return color.id;
  }
  return BUTTERFLIES.colors.at(-1).id;
}

// The wildlife now: { time (seconds), frogs, butterflies, effects
// (ripples and splashes on the water), nextId, spawnIn }.
//   frog:      see newFrog() in ui/lakeFrogs.js.
//   butterfly: { id, color, x, row (middle and bottom), heading
//              (radians), state ('wander', 'land', 'leave', 'flee',
//              'caught' on a frog's tongue), t, target ({ x, row, reed }),
//              targetLeft (seconds before trying somewhere else),
//              stayLeft, landLeft, scared (a tongue just missed it),
//              eaten }
//   effect:    { kind ('ripple' or 'splash'), x, row, t }
export function createLakeLife(random = Math.random) {
  const life = { time: 0, frogs: [], butterflies: [], effects: [], nextId: 1, spawnIn: 0 };
  const count = Math.min(LILY_PADS.length, wholeBetween(FROGS.count, random));
  const pads = LILY_PADS.map((_, i) => i).sort(() => random() - 0.5).slice(0, count);
  for (const pad of pads) life.frogs.push(newFrog(life, pad, random));
  const start = wholeBetween(BUTTERFLIES.start, random);
  for (let i = 0; i < start; i++) addButterfly(life, random, null, true);
  life.spawnIn = between(BUTTERFLIES.spawnEvery, random);
  return life;
}

// Adds a butterfly (color `color`, or picked by weight). `inside`: it's
// already somewhere in the area (when the Lake is shown), not drifting in
// from a side. Returns it, or null with no room.
export function addButterfly(life, random = Math.random, color = null, inside = false) {
  if (life.butterflies.length >= BUTTERFLIES.max) return null;
  const { area } = BUTTERFLIES;
  const fromLeft = random() < 0.5;
  const butterfly = {
    id: life.nextId++,
    color: color ?? pickButterflyColor(random),
    x: inside ? between([area.left, area.right], random) : (fromLeft ? -OFF_SIDE : LAKE_ART.width + OFF_SIDE),
    row: inside ? between([area.top, area.bottom - 4], random) : between(BUTTERFLIES.enterRows, random),
    heading: fromLeft ? 0 : Math.PI,
    state: 'wander',
    t: random() * 10,
    target: null,
    targetLeft: 0,
    stayLeft: between(BUTTERFLIES.stay, random),
    landLeft: 0,
  };
  pickTarget(life, butterfly, random);
  life.butterflies.push(butterfly);
  return butterfly;
}

function reedTaken(life, reed) {
  return life.butterflies.some((other) => other.target?.reed === reed);
}

// Somewhere new to flutter to: now and then a free reed to rest on,
// otherwise a spot in the area.
function pickTarget(life, butterfly, random) {
  butterfly.target = null;
  butterfly.targetLeft = TARGET_SECONDS;
  const reeds = BUTTERFLIES.reeds.filter((reed) => !reedTaken(life, reed));
  if (reeds.length && random() < BUTTERFLIES.landChance) {
    const reed = reeds[Math.floor(random() * reeds.length)];
    butterfly.target = { x: reed.x, row: reed.row, reed };
    return;
  }
  const { area } = BUTTERFLIES;
  butterfly.target = { x: between([area.left, area.right], random), row: between([area.top, area.bottom - 4], random), reed: null };
}

// Off the nearest side.
function leave(butterfly, state) {
  butterfly.state = state;
  butterfly.t = 0;
  const right = butterfly.x > LAKE_ART.width / 2;
  butterfly.target = { x: right ? LAKE_ART.width + OFF_SIDE * 2 : -OFF_SIDE * 2, row: butterfly.row - 6, reed: null };
}

function angleTo(from, to) {
  let diff = to - from;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

function updateButterfly(life, butterfly, dt, random) {
  butterfly.t += dt;
  // The frog's tongue moves it.
  if (butterfly.state === 'caught') return;
  if (butterfly.scared) {
    butterfly.scared = false;
    leave(butterfly, 'flee');
  }
  if (butterfly.state === 'land') {
    butterfly.landLeft -= dt;
    if (butterfly.landLeft <= 0) {
      if (random() < BUTTERFLIES.leaveAfterLanding) {
        leave(butterfly, 'leave');
      } else {
        butterfly.state = 'wander';
        pickTarget(life, butterfly, random);
      }
      butterfly.heading = -Math.PI / 2;
    }
    return;
  }
  if (butterfly.state === 'wander') {
    butterfly.stayLeft -= dt;
    if (butterfly.stayLeft <= 0) leave(butterfly, 'leave');
  }
  const fleeing = butterfly.state === 'flee';
  const speed = fleeing ? BUTTERFLIES.flee : BUTTERFLIES.speed;
  const { target } = butterfly;
  const dx = target.x - butterfly.x;
  const dy = target.row - butterfly.row;
  const distance = Math.hypot(dx, dy);
  // Turning gently toward the target makes soft loops; fleeing, or
  // coming in to land on a reed, turns fast.
  const sharp = fleeing || (target.reed && distance < 8);
  const turn = (sharp ? BUTTERFLIES.turn * 4 : BUTTERFLIES.turn) * dt;
  const diff = angleTo(butterfly.heading, Math.atan2(dy, dx));
  butterfly.heading += Math.max(-turn, Math.min(turn, diff));
  // Landing: settle straight onto the reed once close.
  if (target.reed && distance < 1.5) {
    butterfly.x = target.x;
    butterfly.row = target.row;
    butterfly.state = 'land';
    butterfly.t = 0;
    butterfly.landLeft = between(BUTTERFLIES.landFor, random);
    return;
  }
  const step = Math.min(speed * dt, target.reed && distance < 4 ? distance : Infinity);
  butterfly.x += Math.cos(butterfly.heading) * step;
  butterfly.row += Math.sin(butterfly.heading) * step;
  butterfly.targetLeft -= dt;
  if (butterfly.state === 'wander' && ((!target.reed && distance < 2) || butterfly.targetLeft <= 0)) {
    pickTarget(life, butterfly, random);
  }
}

const isGone = (butterfly) => butterfly.eaten || ((butterfly.state === 'leave' || butterfly.state === 'flee')
  && (butterfly.x < -OFF_SIDE * 1.5 || butterfly.x > LAKE_ART.width + OFF_SIDE * 1.5));

// Moves everything on by `dt` seconds.
export function updateLakeLife(life, dt, random = Math.random) {
  life.time += dt;
  for (const frog of life.frogs) updateFrog(life, frog, dt, random);
  for (const butterfly of life.butterflies) updateButterfly(life, butterfly, dt, random);
  life.butterflies = life.butterflies.filter((butterfly) => !isGone(butterfly));
  life.effects = life.effects.filter((effect) => {
    effect.t += dt;
    return effect.t < (effect.kind === 'ripple' ? FROGS.ripple.seconds : FROGS.splash);
  });
  if (life.butterflies.length < BUTTERFLIES.max) {
    life.spawnIn -= dt;
    if (life.spawnIn <= 0) {
      addButterfly(life, random);
      life.spawnIn = between(BUTTERFLIES.spawnEvery, random);
    }
  }
}

// The bobber landed at column `x`: frogs sitting within FROGS.scare dive
// with a splash. Returns how many dove.
export function bobberLanded(life, x, random = Math.random) {
  let dove = 0;
  for (const frog of life.frogs) {
    if (onPad(frog) && Math.abs(frog.x - x) <= FROGS.scare) {
      plop(life, frog, random, true);
      dove += 1;
    }
  }
  return dove;
}

// A frog on a pad croaks now (dev menu). Returns whether one did.
export function croakNow(life) {
  const frog = life.frogs.find((candidate) => candidate.state === 'sit');
  if (!frog) return false;
  frog.state = 'croak';
  frog.t = 0;
  return true;
}

// A frog on a pad hops now: to the free pad if there is one, otherwise
// on the spot. Returns the frog, or null if none can.
export function hopNow(life, random = Math.random) {
  const frog = life.frogs.find(onPad);
  if (!frog) return null;
  hopAway(life, frog, random);
  return frog;
}

// Clicked: a sitting frog (on a pad or the shore) says "ribbit!" and hops
// away; a flying or resting butterfly flutters away fast. Returns { kind,
// text (or null), x, row (where the frog was, for its bubble) }, or null
// if it can't react (a frog mid-hop or under water, a butterfly already
// going or caught).
export function clickCritter(life, id, random = Math.random) {
  const frog = life.frogs.find((candidate) => candidate.id === id);
  if (frog) {
    if (!isSitting(frog)) return null;
    const at = { x: frog.x, row: frog.row };
    hopAway(life, frog, random);
    return { kind: 'frog', text: WILDLIFE_CLICK.ribbit, ...at };
  }
  const butterfly = life.butterflies.find((candidate) => candidate.id === id);
  if (!butterfly || butterfly.state === 'flee' || butterfly.state === 'caught') return null;
  leave(butterfly, 'flee');
  return { kind: 'butterfly', text: null, x: butterfly.x, row: butterfly.row };
}

// Where each frog and butterfly can be clicked, in lake.png pixels with
// WILDLIFE_CLICK.hitPadding around: [{ id, kind, left, top, right, bottom
// }] (right and bottom exclusive). Frogs under water and butterflies off
// the window have none.
export function critterBoxes(life) {
  const pad = WILDLIFE_CLICK.hitPadding;
  const boxes = [];
  for (const frog of life.frogs) {
    if (frog.state === 'under') continue;
    const left = frog.x - FROG_SIZE.width / 2;
    boxes.push({ id: frog.id, kind: 'frog', left: left - pad, right: left + FROG_SIZE.width + pad,
      top: frog.row - FROG_SIZE.height - pad, bottom: frog.row + pad });
  }
  for (const butterfly of life.butterflies) {
    if (butterfly.state === 'caught' || butterfly.x < -2 || butterfly.x > LAKE_ART.width + 2) continue;
    const left = butterfly.x - BUTTERFLY_SIZE.width / 2;
    boxes.push({ id: butterfly.id, kind: 'butterfly', left: left - pad, right: left + BUTTERFLY_SIZE.width + pad,
      top: butterfly.row - BUTTERFLY_SIZE.height - pad, bottom: butterfly.row + pad });
  }
  return boxes;
}
