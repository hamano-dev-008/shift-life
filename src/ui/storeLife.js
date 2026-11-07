// storeLife.js — The 6-Eleven's people and its pigeon, purely visual: the
// clerk behind the register (standing, yawning and stretching on a long
// night, scanning while someone pays), shoppers coming in to a door
// chime, browsing the fridges and shelves, waiting their turn and paying
// at the register, and leaving (chime), and a pigeon on the sidewalk
// outside the glass front (walking with a bobbing head, pecking, flying
// off when clicked and coming back later). Clicking the clerk gets a
// line. Nothing here is saved: the renderer makes a new one each time the
// store is shown. Positions are the picture's pixels (data/store.js);
// ui/storeLifeArt.js draws it. No DOM here, so tests can run it.

import {
  STORE_COUNTER, STORE_DOOR, STORE_BROWSE, STORE_PAY_X, STORE_SIDEWALK, STORE_CLERK, STORE_SHOPPERS,
  STORE_PIGEON,
} from '../data/store.js';
import { randomAppearance } from '../game/character.js';
import { toScene, between, pick, walkToward } from './people.js';

// The store's life now: { time (seconds), clerk, shoppers, pigeon,
// nextId, spawnIn, chimes (door chimes not yet shown: the renderer takes
// them), playerPaying (the character is paying at the register: the
// renderer sets it) }.
//   clerk:   { x, facing, state ('idle', 'yawn', 'scan'), t, left }
//   shopper: { id, look, stage, x, facing, step ('browsing' walking to a
//            spot, 'browse', 'paying' walking to the register or waiting
//            their turn, 'pay', 'out'), t, left, target, looks (spots
//            browsed), reach (reaching up while browsing), walked, gone }
//   pigeon:  { x, facing, state ('walk', 'peck', 'idle', 'fly', 'away'),
//            t, left, target, rise (rows up while flying) }
export function createStoreLife(random = Math.random) {
  return {
    time: 0,
    clerk: { x: STORE_COUNTER.clerkX, facing: -1, state: 'idle', t: 0, left: between(STORE_CLERK.idle, random) },
    shoppers: [],
    pigeon: {
      x: between([STORE_SIDEWALK.left, STORE_SIDEWALK.right], random), facing: random() < 0.5 ? -1 : 1,
      state: 'idle', t: 0, left: between(STORE_PIGEON.idle, random), target: null, rise: 0,
    },
    nextId: 1,
    spawnIn: between(STORE_SHOPPERS.firstIn, random),
    chimes: [],
    playerPaying: false,
  };
}

// A shopper coming in at the door (it chimes), off to browse. Returns
// them, or null with the store full.
export function addShopper(life, random = Math.random) {
  if (life.shoppers.length >= STORE_SHOPPERS.max) return null;
  const shopper = {
    id: life.nextId++,
    look: randomAppearance(),
    stage: random() < STORE_SHOPPERS.elderShare ? 'elder' : 'adult',
    x: STORE_DOOR.x,
    facing: 1,
    step: 'browsing',
    t: 0,
    left: 0,
    target: pick(STORE_BROWSE, random),
    looks: 0,
    reach: false,
    walked: 0,
  };
  life.shoppers.push(shopper);
  life.chimes.push('in');
  return shopper;
}

// Whether `shopper` is walking now (for their pose).
export const isWalking = (shopper) => shopper.step === 'browsing' || shopper.step === 'paying' || shopper.step === 'out';

// Where a shopper heading to pay goes: the register, or behind whoever is
// paying there (the character too).
function payTarget(life, shopper) {
  const ahead = life.playerPaying || life.shoppers.some((other) => other !== shopper && (other.step === 'pay'
    || (other.step === 'paying' && other.x > shopper.x)));
  return ahead ? STORE_PAY_X - STORE_SHOPPERS.queueGap : STORE_PAY_X;
}

function updateShopper(life, shopper, dt, random) {
  shopper.t += dt;
  const speed = toScene(STORE_SHOPPERS.speed);
  if (shopper.step === 'browsing') {
    if (walkToward(shopper, shopper.target, speed, dt)) {
      shopper.step = 'browse';
      shopper.t = 0;
      shopper.left = between(STORE_SHOPPERS.browse, random);
      shopper.reach = random() < STORE_SHOPPERS.reachChance;
      shopper.looks += 1;
    }
  } else if (shopper.step === 'browse') {
    shopper.left -= dt;
    if (shopper.left > 0) return;
    shopper.reach = false;
    if (shopper.looks < 2 && random() < STORE_SHOPPERS.secondLook) {
      shopper.step = 'browsing';
      shopper.target = pick(STORE_BROWSE.filter((x) => x !== shopper.x), random);
    } else {
      shopper.step = 'paying';
    }
  } else if (shopper.step === 'paying') {
    const target = payTarget(life, shopper);
    if (walkToward(shopper, target, speed, dt) && target === STORE_PAY_X) {
      shopper.step = 'pay';
      shopper.facing = 1;
      shopper.t = 0;
      shopper.left = between(STORE_SHOPPERS.pay, random);
    } else if (shopper.x === target) {
      shopper.facing = 1;
    }
  } else if (shopper.step === 'pay') {
    shopper.left -= dt;
    if (shopper.left <= 0) shopper.step = 'out';
  } else if (walkToward(shopper, STORE_DOOR.x, speed, dt)) {
    shopper.gone = true;
    life.chimes.push('out');
  }
}

// The clerk scans while someone pays (the character too); otherwise
// stands, and now and then yawns and stretches.
function updateClerk(life, dt, random) {
  const { clerk } = life;
  clerk.t += dt;
  const paying = life.playerPaying || life.shoppers.some((shopper) => shopper.step === 'pay');
  if (paying) {
    if (clerk.state !== 'scan') {
      clerk.state = 'scan';
      clerk.t = 0;
    }
    return;
  }
  if (clerk.state === 'scan') clerk.left = 0;
  clerk.left -= dt;
  if (clerk.left > 0) return;
  const yawn = clerk.state !== 'yawn' && random() < STORE_CLERK.yawnChance;
  clerk.state = yawn ? 'yawn' : 'idle';
  clerk.t = 0;
  clerk.left = yawn ? STORE_CLERK.yawn : between(STORE_CLERK.idle, random);
}

// The pigeon: wandering the sidewalk, pecking and standing; flying up and
// off once startled, and walking back in from the left a while later.
function updatePigeon(pigeon, dt, random) {
  pigeon.t += dt;
  if (pigeon.state === 'fly') {
    pigeon.x -= STORE_PIGEON.flySpeed * dt;
    pigeon.rise += STORE_PIGEON.flySpeed * 0.6 * dt;
    if (pigeon.x < -6) {
      pigeon.state = 'away';
      pigeon.left = between(STORE_PIGEON.returnIn, random);
    }
    return;
  }
  if (pigeon.state === 'away') {
    pigeon.left -= dt;
    if (pigeon.left > 0) return;
    pigeon.rise = 0;
    pigeon.x = STORE_SIDEWALK.left - 4;
    pigeon.state = 'walk';
    pigeon.target = between([STORE_SIDEWALK.left, STORE_SIDEWALK.right], random);
    return;
  }
  if (pigeon.state === 'walk') {
    const step = STORE_PIGEON.speed * dt;
    const distance = pigeon.target - pigeon.x;
    if (Math.abs(distance) > step) {
      pigeon.facing = Math.sign(distance);
      pigeon.x += pigeon.facing * step;
      return;
    }
    pigeon.x = pigeon.target;
    pigeon.state = random() < 0.6 ? 'peck' : 'idle';
    pigeon.t = 0;
    pigeon.left = between(STORE_PIGEON[pigeon.state], random);
    return;
  }
  pigeon.left -= dt;
  if (pigeon.left > 0) return;
  pigeon.state = 'walk';
  pigeon.target = between([STORE_SIDEWALK.left, STORE_SIDEWALK.right], random);
}

// Moves everything on by `dt` seconds.
export function updateStoreLife(life, dt, random = Math.random) {
  life.time += dt;
  for (const shopper of life.shoppers) updateShopper(life, shopper, dt, random);
  life.shoppers = life.shoppers.filter((shopper) => !shopper.gone);
  updateClerk(life, dt, random);
  updatePigeon(life.pigeon, dt, random);
  life.spawnIn -= dt;
  if (life.spawnIn <= 0) {
    addShopper(life, random);
    life.spawnIn = between(STORE_SHOPPERS.spawnEvery, random);
  }
}

// Clicked: the clerk says one of their lines; the pigeon coos and flies
// off. Returns { kind, text, x, row (where the bubble goes) }, or null.
export function clickStoreCritter(life, id, random = Math.random) {
  if (id === 'clerk') {
    return { kind: 'clerk', text: pick(STORE_CLERK.lines, random), x: life.clerk.x, row: STORE_COUNTER.behindRow - 14 };
  }
  const { pigeon } = life;
  if (id === 'pigeon' && pigeon.state !== 'fly' && pigeon.state !== 'away') {
    pigeon.state = 'fly';
    pigeon.t = 0;
    return { kind: 'pigeon', text: STORE_PIGEON.line, x: pigeon.x, row: STORE_SIDEWALK.row - 4 };
  }
  return null;
}

// Where the clerk and the pigeon can be clicked, in the picture's pixels
// (right and bottom exclusive): the clerk above the counter, the pigeon
// on the sidewalk (not while it's flying or gone).
export function storeBoxes(life) {
  const { clerk, pigeon } = life;
  const boxes = [{
    id: 'clerk', kind: 'clerk', left: clerk.x - 4, right: clerk.x + 4, top: STORE_COUNTER.behindRow - 14, bottom: STORE_COUNTER.top,
  }];
  if (pigeon.state !== 'fly' && pigeon.state !== 'away') {
    boxes.push({ id: 'pigeon', kind: 'pigeon', left: pigeon.x - 4, right: pigeon.x + 4, top: STORE_SIDEWALK.row - 5, bottom: STORE_SIDEWALK.row + 2 });
  }
  return boxes;
}
