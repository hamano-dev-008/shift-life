// postLife.js — Pedal Post's people and its dog, purely visual: the
// dispatcher behind the counter (stamping parcels with a thunk), the rider
// taking parcels from the pile out of the door and coming back for the
// next, customers bringing a parcel in to hand over, and Mochi the shiba
// on its bed (sleeping, sitting up, wagging, trotting to sniff the door).
// Clicking the dispatcher gets a line, clicking Mochi a woof. Nothing here
// is saved: the renderer makes a new one each time the hub is shown.
// Positions are the picture's pixels (data/post.js); ui/postLifeArt.js
// draws it. No DOM here, so tests can run it.

import {
  POST_COUNTER, POST_DOOR, POST_HAND_IN_X, POST_PILE_X, POST_DOG_BED, POST_DISPATCHER, POST_RIDER,
  POST_CUSTOMERS, POST_DOG,
} from '../data/post.js';
import { randomAppearance } from '../game/character.js';
import { toScene, between, pick, walkToward } from './people.js';

// Pedal Post's life now: { time (seconds), dispatcher, rider, customer
// (one at a time, or null), dog, nextId, spawnIn, playerSending (the
// character is handing mail over: the dispatcher stamps it; set by the
// renderer) }.
//   dispatcher: { x, facing, state ('idle', 'stamp'), t, left }
//   rider:      { x, facing, step ('out' gone delivering, 'in' walking to
//               the pile, 'pick', 'leave' walking to the door with a
//               parcel), t, left, walked }
//   customer:   { id, look, stage, x, facing, step ('in' walking to the
//               counter, 'hand', 'out'), t, left, walked }
//   dog:        { x, facing, state ('sleep', 'sit', 'walk'), t, left,
//               target, wagging, back (on the way back to the bed) }
export function createPostLife(random = Math.random) {
  return {
    time: 0,
    dispatcher: { x: POST_COUNTER.dispatcherX, facing: -1, state: 'idle', t: 0, left: between(POST_DISPATCHER.idle, random) },
    rider: { x: POST_DOOR.x, facing: 1, step: 'out', t: 0, left: between(POST_RIDER.firstOut, random), walked: 0 },
    customer: null,
    dog: {
      x: POST_DOG_BED.x, facing: -1, state: 'sleep', t: 0, left: between(POST_DOG.sleep, random),
      target: null, wagging: false, back: false,
    },
    nextId: 1,
    spawnIn: between(POST_CUSTOMERS.firstIn, random),
    playerSending: false,
  };
}

// The dispatcher stamps a parcel now (one handed in, or now and then).
function stamp(dispatcher) {
  dispatcher.state = 'stamp';
  dispatcher.t = 0;
  dispatcher.left = POST_DISPATCHER.stamp;
}

function updateDispatcher(life, dt, random) {
  const { dispatcher } = life;
  if (life.playerSending && dispatcher.state !== 'stamp') stamp(dispatcher);
  dispatcher.t += dt;
  dispatcher.left -= dt;
  if (dispatcher.left > 0) return;
  if (dispatcher.state === 'stamp') {
    dispatcher.state = 'idle';
    dispatcher.t = 0;
    dispatcher.left = between(POST_DISPATCHER.idle, random);
  } else {
    stamp(dispatcher);
  }
}

function updateRider(rider, dt, random) {
  rider.t += dt;
  const speed = toScene(POST_RIDER.speed);
  if (rider.step === 'out') {
    rider.left -= dt;
    if (rider.left > 0) return;
    rider.step = 'in';
    rider.x = POST_DOOR.x;
  } else if (rider.step === 'in') {
    if (walkToward(rider, POST_PILE_X, speed, dt)) {
      rider.step = 'pick';
      rider.t = 0;
    }
  } else if (rider.step === 'pick') {
    if (rider.t >= POST_RIDER.pick) rider.step = 'leave';
  } else if (walkToward(rider, POST_DOOR.x, speed, dt)) {
    rider.step = 'out';
    rider.left = between(POST_RIDER.out, random);
  }
}

// A customer coming in with a parcel. Returns them, or null if one is
// already here.
export function addPostCustomer(life, random = Math.random) {
  if (life.customer) return null;
  life.customer = {
    id: life.nextId++,
    look: randomAppearance(),
    stage: random() < POST_CUSTOMERS.elderShare ? 'elder' : 'adult',
    x: POST_DOOR.x,
    facing: 1,
    step: 'in',
    t: 0,
    walked: 0,
  };
  return life.customer;
}

function updateCustomer(life, dt) {
  const { customer } = life;
  customer.t += dt;
  const speed = toScene(POST_CUSTOMERS.speed);
  if (customer.step === 'in') {
    if (walkToward(customer, POST_HAND_IN_X, speed, dt)) {
      customer.step = 'hand';
      customer.facing = 1;
      customer.t = 0;
      stamp(life.dispatcher);
    }
  } else if (customer.step === 'hand') {
    if (customer.t >= POST_CUSTOMERS.hand) customer.step = 'out';
  } else if (walkToward(customer, POST_DOOR.x, speed, dt)) {
    life.customer = null;
  }
}

// Mochi settles after a state ends: awake from sleep; from sitting maybe
// a trot to sniff the door, else back to sleep; back on the bed after the
// sniff.
function nextForDog(dog, random) {
  dog.t = 0;
  dog.wagging = false;
  if (dog.state === 'sleep') {
    dog.state = 'sit';
    dog.left = between(POST_DOG.sit, random);
    dog.wagging = random() < POST_DOG.wagChance;
  } else if (dog.state === 'sit' && dog.x === POST_DOG_BED.x && random() < POST_DOG.sniffChance) {
    dog.state = 'walk';
    dog.target = POST_DOOR.right + 3;
    dog.back = false;
  } else if (dog.state === 'sit' && dog.x !== POST_DOG_BED.x) {
    dog.state = 'walk';
    dog.target = POST_DOG_BED.x;
    dog.back = true;
  } else {
    dog.state = 'sleep';
    dog.left = between(POST_DOG.sleep, random);
  }
}

function updateDog(dog, dt, random) {
  dog.t += dt;
  if (dog.state === 'walk') {
    const step = POST_DOG.speed * dt;
    const distance = dog.target - dog.x;
    if (Math.abs(distance) > step) {
      dog.facing = Math.sign(distance);
      dog.x += dog.facing * step;
      return;
    }
    dog.x = dog.target;
    dog.t = 0;
    // At the door it sits and sniffs a moment; back on the bed it curls up.
    if (dog.back) {
      dog.state = 'sleep';
      dog.left = between(POST_DOG.sleep, random);
    } else {
      dog.state = 'sit';
      dog.left = POST_DOG.sniff;
    }
    return;
  }
  dog.left -= dt;
  if (dog.left <= 0) nextForDog(dog, random);
}

// Moves everything on by `dt` seconds.
export function updatePostLife(life, dt, random = Math.random) {
  life.time += dt;
  updateDispatcher(life, dt, random);
  updateRider(life.rider, dt, random);
  if (life.customer) updateCustomer(life, dt);
  updateDog(life.dog, dt, random);
  life.spawnIn -= dt;
  if (life.spawnIn <= 0) {
    addPostCustomer(life, random);
    life.spawnIn = between(POST_CUSTOMERS.spawnEvery, random);
  }
}

// Whether the rider or a customer (`who`) is walking now (for their pose).
export const isWalking = (who) => who.step === 'in' || who.step === 'leave' || who.step === 'out';

// Clicked: the dispatcher says one of their lines; Mochi wakes ("Woof?")
// or wags ("Woof!"). Returns { kind, text, x, row (where the bubble
// goes) }, or null.
export function clickPostCritter(life, id, random = Math.random) {
  if (id === 'dispatcher') {
    return { kind: 'dispatcher', text: pick(POST_DISPATCHER.lines, random), x: life.dispatcher.x, row: POST_COUNTER.behindRow - 14 };
  }
  if (id === 'dog') {
    const { dog } = life;
    const woken = dog.state === 'sleep';
    if (dog.state !== 'walk') {
      dog.state = 'sit';
      dog.t = 0;
      dog.left = between(POST_DOG.sit, random);
    }
    dog.wagging = true;
    return { kind: 'dog', text: woken ? POST_DOG.lines.woken : POST_DOG.lines.awake, x: dog.x, row: POST_DOG_BED.row - 7 };
  }
  return null;
}

// Where the dispatcher and Mochi can be clicked, in the picture's pixels
// (right and bottom exclusive): the dispatcher above the counter, Mochi
// wherever it is on the floor.
export function postBoxes(life) {
  const { dispatcher, dog } = life;
  return [
    {
      id: 'dispatcher', kind: 'dispatcher', left: dispatcher.x - 4, right: dispatcher.x + 4,
      top: POST_COUNTER.behindRow - 14, bottom: POST_COUNTER.top,
    },
    { id: 'dog', kind: 'dog', left: dog.x - 6, right: dog.x + 6, top: POST_DOG_BED.row - 7, bottom: POST_DOG_BED.row + 1 },
  ];
}
