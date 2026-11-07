// cafeLife.js — The Cafe's people and its cat, purely visual: the master
// behind the counter (polishing a cup, brewing at a siphon, walking
// between them), customers coming in at the door, sitting on a stool or
// at the table with a cup for a while and leaving, and Tama the cat on the
// window sill (sleeping, waking, stretching, padding along it). Clicking
// the master gets a friendly line, clicking the cat a meow. Nothing here is
// saved: the renderer makes a new one each time the Cafe is shown.
// Positions are the picture's pixels (data/cafe.js); ui/cafeLifeArt.js
// draws it. No DOM here, so tests can run it.

import {
  CAFE_COUNTER, CAFE_DOOR, CAFE_SEATS, CAFE_SILL, CAFE_MASTER, CAFE_CUSTOMERS, CAFE_CAT, CAFE_ART,
  CAFE_FEET_FROM_BOTTOM,
} from '../data/cafe.js';
import { CHARACTER_SCALE, SCENE_SCALE } from '../data/layout.js';
import { randomAppearance } from '../game/character.js';

// The row everyone in front of the counter walks on.
const CAFE_FLOOR_ROW = CAFE_ART.height - CAFE_FEET_FROM_BOTTOM;

// Character pixels a second to the picture's pixels a second.
const toScene = (speed) => (speed * CHARACTER_SCALE) / SCENE_SCALE;
const between = ([min, max], random) => min + (max - min) * random();
const pick = (list, random) => list[Math.floor(random() * list.length)];
const seatById = (id) => CAFE_SEATS.find((seat) => seat.id === id);

// The Cafe's life now: { time (seconds), master, customers, cat, nextId,
// spawnIn, orderServed (the character's order is on the table) }.
//   master:   { x, facing, state ('idle', 'walk', 'polish', 'brew',
//             'serve'), t, left (seconds of it left), target (x walking
//             to), next (the state once there), walked (character pixels,
//             for the walk cycle), floor (out in front of the counter,
//             serving), serving ({ phase ('out', 'table', 'place',
//             'back'), x (where they set it down) } or null) }
//   customer: { id, look, stage, seat (CAFE_SEATS entry), x, facing, state
//             ('walk' in, 'sit', 'out' walking to the door), t, left,
//             walked, served (a cup in front of them) }
//   cat:      { x, facing, state ('sleep', 'sit', 'stretch', 'walk'), t,
//             left, target, blinkIn, blinkLeft }
export function createCafeLife(random = Math.random) {
  const life = {
    time: 0,
    master: {
      x: CAFE_MASTER.spots.polish, facing: -1, state: 'polish', t: 0, left: between(CAFE_MASTER.polish, random),
      target: null, next: null, walked: 0, floor: false, serving: null,
    },
    orderServed: false,
    customers: [],
    cat: {
      x: between([CAFE_SILL.left + CAFE_CAT.margin, CAFE_SILL.right - CAFE_CAT.margin], random),
      facing: random() < 0.5 ? -1 : 1, state: 'sleep', t: 0, left: between(CAFE_CAT.sleep, random),
      target: null, blinkIn: between(CAFE_CAT.blink, random), blinkLeft: 0,
    },
    nextId: 1,
    spawnIn: between(CAFE_CUSTOMERS.firstIn, random),
  };
  // Sometimes someone's already there with their coffee.
  if (random() < 0.5) {
    const customer = addCustomer(life, random);
    if (customer) sitDown(customer, random, true);
  }
  return life;
}

// The seats nobody has (sitting there or on the way).
function freeSeats(life) {
  const taken = new Set(life.customers.map((customer) => customer.seat.id));
  return CAFE_CUSTOMERS.seats.filter((id) => !taken.has(id)).map(seatById);
}

// A customer coming in at the door, heading for a free seat. Returns
// them, or null with no room.
export function addCustomer(life, random = Math.random) {
  const seats = freeSeats(life);
  if (!seats.length || life.customers.length >= CAFE_CUSTOMERS.max) return null;
  const seat = pick(seats, random);
  const customer = {
    id: life.nextId++,
    look: randomAppearance(),
    stage: random() < CAFE_CUSTOMERS.elderShare ? 'elder' : 'adult',
    seat,
    x: CAFE_DOOR.x,
    facing: seat.x >= CAFE_DOOR.x ? 1 : -1,
    state: 'walk',
    t: 0,
    left: 0,
    walked: 0,
    served: false,
  };
  life.customers.push(customer);
  return customer;
}

function sitDown(customer, random, served = false) {
  customer.x = customer.seat.x;
  customer.facing = customer.seat.facing;
  customer.state = 'sit';
  customer.t = served ? CAFE_CUSTOMERS.servedAfter : 0;
  customer.served = served;
  customer.left = between(CAFE_CUSTOMERS.stay, random);
}

// Walks `who` toward x `target` at `speed` (the picture's pixels a
// second); returns whether they're there.
function walkToward(who, target, speed, dt) {
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

// The master's next thing: polishing at the far end, brewing at a siphon,
// or standing a moment where they are; walking there first if need be.
function nextForMaster(master, random) {
  const roll = random();
  const [state, x] = roll < 0.5 ? ['polish', CAFE_MASTER.spots.polish]
    : roll < 0.85 ? ['brew', pick(CAFE_MASTER.spots.siphons, random)]
      : ['idle', master.x];
  master.t = 0;
  if (x !== master.x) {
    master.state = 'walk';
    master.target = x;
    master.next = state;
    return;
  }
  settleMaster(master, state, random);
}

function settleMaster(master, state, random) {
  master.state = state;
  master.t = 0;
  master.left = between(CAFE_MASTER[state], random);
  // At the counter they face its middle, the siphons on their left.
  master.facing = -1;
}

// The master brings the character's order to table spot `x`: out
// through the counter's flap, over to the table, sets it down, and back.
// Does nothing if it's already on its way or there.
export function serveOrder(life, x) {
  const { master } = life;
  if (master.serving || life.orderServed) return;
  master.state = 'serve';
  master.t = 0;
  master.serving = { phase: 'out', x };
}

// The order's over (eaten, or called off): the table is cleared, and a
// master on the way with it turns back.
export function clearOrder(life) {
  life.orderServed = false;
  if (life.master.serving && life.master.serving.phase !== 'back') life.master.serving.phase = 'back';
}

function updateServing(life, master, dt, random) {
  const { serving } = master;
  const speed = toScene(CAFE_MASTER.serveSpeed);
  if (serving.phase === 'out') {
    if (walkToward(master, CAFE_COUNTER.flap, speed, dt)) {
      master.floor = true;
      serving.phase = 'table';
    }
  } else if (serving.phase === 'table') {
    if (walkToward(master, serving.x, speed, dt)) {
      serving.phase = 'place';
      master.t = 0;
    }
  } else if (serving.phase === 'place') {
    if (master.t >= CAFE_MASTER.place) {
      life.orderServed = true;
      serving.phase = 'back';
    }
  } else if (walkToward(master, CAFE_COUNTER.flap, speed, dt)) {
    // Back behind the counter.
    if (master.floor) {
      master.floor = false;
      return;
    }
    master.serving = null;
    nextForMaster(master, random);
  }
}

function updateMaster(life, dt, random) {
  const { master } = life;
  master.t += dt;
  if (master.state === 'serve') {
    updateServing(life, master, dt, random);
    return;
  }
  if (master.state === 'walk') {
    if (walkToward(master, master.target, toScene(CAFE_MASTER.speed), dt)) settleMaster(master, master.next, random);
    return;
  }
  master.left -= dt;
  if (master.left <= 0) nextForMaster(master, random);
}

function updateCustomer(customer, dt, random) {
  customer.t += dt;
  const speed = toScene(CAFE_CUSTOMERS.speed);
  if (customer.state === 'walk') {
    if (walkToward(customer, customer.seat.x, speed, dt)) sitDown(customer, random);
  } else if (customer.state === 'sit') {
    customer.served ||= customer.t >= CAFE_CUSTOMERS.servedAfter;
    customer.left -= dt;
    if (customer.left <= 0) {
      customer.state = 'out';
      customer.served = false;
      customer.t = 0;
    }
  } else if (walkToward(customer, CAFE_DOOR.x, speed, dt)) {
    customer.gone = true;
  }
}

// The cat settles after `state` ends: from sleep she sits up; from
// sitting she may stretch; then she may pad somewhere else on the sill,
// else she curls up again.
function nextForCat(cat, random) {
  cat.t = 0;
  if (cat.state === 'sleep') {
    cat.state = 'sit';
    cat.left = between(CAFE_CAT.sit, random);
  } else if (cat.state === 'sit' && random() < CAFE_CAT.stretchChance) {
    cat.state = 'stretch';
    cat.left = CAFE_CAT.stretch;
  } else if (cat.state !== 'walk' && random() < CAFE_CAT.moveChance) {
    cat.state = 'walk';
    cat.target = between([CAFE_SILL.left + CAFE_CAT.margin, CAFE_SILL.right - CAFE_CAT.margin], random);
  } else {
    cat.state = 'sleep';
    cat.left = between(CAFE_CAT.sleep, random);
  }
}

function updateCat(cat, dt, random) {
  cat.t += dt;
  if (cat.blinkLeft > 0) cat.blinkLeft -= dt;
  cat.blinkIn -= dt;
  if (cat.blinkIn <= 0) {
    cat.blinkLeft = 0.2;
    cat.blinkIn = between(CAFE_CAT.blink, random);
  }
  if (cat.state === 'walk') {
    const step = CAFE_CAT.speed * dt;
    const distance = cat.target - cat.x;
    if (Math.abs(distance) <= step) {
      cat.x = cat.target;
      nextForCat(cat, random);
    } else {
      cat.facing = Math.sign(distance);
      cat.x += cat.facing * step;
    }
    return;
  }
  cat.left -= dt;
  if (cat.left <= 0) nextForCat(cat, random);
}

// Moves everything on by `dt` seconds.
export function updateCafeLife(life, dt, random = Math.random) {
  life.time += dt;
  updateMaster(life, dt, random);
  for (const customer of life.customers) updateCustomer(customer, dt, random);
  life.customers = life.customers.filter((customer) => !customer.gone);
  updateCat(life.cat, dt, random);
  life.spawnIn -= dt;
  if (life.spawnIn <= 0) {
    addCustomer(life, random);
    life.spawnIn = between(CAFE_CUSTOMERS.spawnEvery, random);
  }
}

// Clicked: the master says one of their lines; the cat wakes ("mrrp?")
// or meows. Returns { kind, text, x, row (where the bubble goes) }, or
// null for anything else.
export function clickCafeCritter(life, id, random = Math.random) {
  if (id === 'master') {
    const { master } = life;
    return { kind: 'master', text: pick(CAFE_MASTER.lines, random), x: master.x, row: masterTop(master) };
  }
  if (id === 'cat') {
    const { cat } = life;
    const woken = cat.state === 'sleep';
    if (woken) {
      cat.state = 'sit';
      cat.t = 0;
      cat.left = between(CAFE_CAT.sit, random);
    }
    return { kind: 'cat', text: woken ? CAFE_CAT.lines.woken : CAFE_CAT.lines.awake, x: cat.x, row: CAFE_SILL.row - 5 };
  }
  return null;
}

// The row the master stands on: behind the counter, or out on the floor.
export function masterRow(master) {
  return master.floor ? CAFE_FLOOR_ROW : CAFE_COUNTER.behindRow;
}
const masterTop = (master) => masterRow(master) - 15;

// Where the master and the cat can be clicked, in the picture's pixels
// (right and bottom exclusive): the master's head and shoulders above the
// counter (all of them out on the floor), and the cat on the sill.
export function cafeBoxes(life) {
  const { master, cat } = life;
  return [
    {
      id: 'master', kind: 'master', left: master.x - 4, right: master.x + 4, top: masterTop(master),
      bottom: master.floor ? CAFE_FLOOR_ROW : CAFE_COUNTER.top,
    },
    { id: 'cat', kind: 'cat', left: cat.x - 6, right: cat.x + 6, top: CAFE_SILL.row - 7, bottom: CAFE_SILL.row + 1 },
  ];
}
