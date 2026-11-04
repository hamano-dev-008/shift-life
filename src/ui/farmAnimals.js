// farmAnimals.js — The Farm's chickens, visual only (no DOM, so tests run
// it; drawn by ui/farmAnimalsArt.js; numbers in data/farmAnimals.js). They
// stand about, peck and stroll in the pen in front of the barn; while
// `sheltered` (a thunderstorm, game/weather.js animalsInBarn()) they hurry
// to the barn's door and go in, out of sight, and once it's over they come
// back out one by one. Made fresh each time the Farm is shown (already
// inside if it's storming then); never saved.
//
// A chicken: { id, x, row (its feet, scene pixels, fractional while
// moving), facing (1 right, -1 left), state ('idle', 'peck', 'walk',
// 'goingIn', 'in', 'comingOut'), t (seconds into the state), length (how
// long it lasts), to ({ x, row }, walking), walked (pixels, for the legs) }.

import { CHICKENS } from '../data/farmAnimals.js';

const between = ([min, max], random) => min + (max - min) * random();

function spotIn(random) {
  const { left, right, top, bottom } = CHICKENS.area;
  return { x: left + Math.round((right - left) * random()), row: top + Math.round((bottom - top) * random()) };
}

function idle(chicken, random) {
  chicken.state = 'idle';
  chicken.t = 0;
  chicken.length = between(CHICKENS.idle, random);
  chicken.to = null;
}

// The chickens, standing about the pen, or all inside when `sheltered`.
export function createFarmAnimals(sheltered = false, random = Math.random) {
  const chickens = [];
  for (let i = 0; i < CHICKENS.count; i++) {
    const spot = sheltered ? { ...CHICKENS.door } : spotIn(random);
    const chicken = { id: `chicken${i + 1}`, ...spot, facing: random() < 0.5 ? -1 : 1, walked: 0 };
    idle(chicken, random);
    if (sheltered) chicken.state = 'in';
    chickens.push(chicken);
  }
  return { chickens, outIn: 0 };
}

// Walks `chicken` toward its `to` at `speed`; returns whether it's there.
function step(chicken, dt, speed) {
  const dx = chicken.to.x - chicken.x;
  const dy = chicken.to.row - chicken.row;
  const distance = Math.hypot(dx, dy);
  const move = speed * dt;
  if (dx) chicken.facing = dx > 0 ? 1 : -1;
  if (distance <= move) {
    chicken.walked += distance;
    chicken.x = chicken.to.x;
    chicken.row = chicken.to.row;
    return true;
  }
  chicken.x += (dx / distance) * move;
  chicken.row += (dy / distance) * move;
  chicken.walked += move;
  return false;
}

// A stroll to somewhere near, in the pen.
function strollTarget(chicken, random) {
  const { left, right, top, bottom } = CHICKENS.area;
  const reach = CHICKENS.strollMax;
  const x = Math.min(right, Math.max(left, Math.round(chicken.x + (random() * 2 - 1) * reach)));
  const row = Math.min(bottom, Math.max(top, Math.round(chicken.row + (random() * 2 - 1) * 2)));
  return { x, row };
}

// Moves the chickens on by `dt` seconds.
export function updateFarmAnimals(animals, dt, sheltered, random = Math.random) {
  animals.outIn = Math.max(0, animals.outIn - dt);
  for (const chicken of animals.chickens) {
    chicken.t += dt;
    if (sheltered) {
      if (chicken.state === 'in') continue;
      if (chicken.state !== 'goingIn') {
        chicken.state = 'goingIn';
        chicken.to = { ...CHICKENS.door };
      }
      if (step(chicken, dt, CHICKENS.hurry)) {
        chicken.state = 'in';
        chicken.to = null;
      }
      continue;
    }
    switch (chicken.state) {
      case 'in':
        // Out again one at a time, to a spot in the pen.
        if (animals.outIn > 0) break;
        animals.outIn = between(CHICKENS.outEvery, random);
        chicken.state = 'comingOut';
        chicken.x = CHICKENS.door.x;
        chicken.row = CHICKENS.door.row;
        chicken.to = spotIn(random);
        break;
      case 'goingIn':
        // The storm passed before it got in: back to the pen.
        chicken.state = 'walk';
        chicken.to = spotIn(random);
        break;
      case 'comingOut':
      case 'walk':
        if (!chicken.to) chicken.to = spotIn(random);
        if (step(chicken, dt, CHICKENS.speed)) idle(chicken, random);
        break;
      case 'peck':
        if (chicken.t >= chicken.length) idle(chicken, random);
        break;
      default:
        if (chicken.t < chicken.length) break;
        chicken.t = 0;
        if (random() < CHICKENS.peckChance) {
          chicken.state = 'peck';
          chicken.length = between(CHICKENS.peck, random);
        } else {
          chicken.state = 'walk';
          chicken.to = strollTarget(chicken, random);
        }
    }
  }
}

// Whether a chicken can be seen (not inside the barn).
export function isOut(chicken) {
  return chicken.state !== 'in';
}

// Whether all of them are inside.
export function allInside(animals) {
  return animals.chickens.every((chicken) => !isOut(chicken));
}

// Which frame a chicken shows: 'peck' (head down), 'walk' (the other leg
// forward) or 'stand'.
export function chickenFrame(chicken) {
  if (chicken.state === 'peck') {
    return (chicken.t % CHICKENS.peckEvery) < CHICKENS.peckEvery / 2 ? 'peck' : 'stand';
  }
  const moving = chicken.state === 'walk' || chicken.state === 'goingIn' || chicken.state === 'comingOut';
  if (moving && Math.floor(chicken.walked / CHICKENS.stride) % 2 === 1) return 'walk';
  return 'stand';
}

// The chickens to draw, back to front (by their feet's row).
export function chickensToDraw(animals) {
  return animals.chickens.filter(isOut).sort((a, b) => a.row - b.row);
}
