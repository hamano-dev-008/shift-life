// ramenLife.js — Ramen Hinata's people, purely visual: the cook behind
// the counter (stirring a pot, moving between the pots, bringing each
// diner a bowl), and diners coming in, sitting on a stool, eating their
// bowl and leaving. The character's own bowl comes the same way when they
// eat here (the renderer sets `playerWaiting`); on a shift they carry
// bowls out themselves (serveDinerAt()). Clicking the cook gets a line.
// Nothing here is saved: the renderer makes a new one each time the shop
// is shown. Positions are the picture's pixels (data/ramen.js);
// ui/ramenLifeArt.js draws it. No DOM here, so tests can run it.

import {
  RAMEN_COUNTER, RAMEN_DOOR, RAMEN_STOOLS, RAMEN_MY_STOOL, RAMEN_COOK, RAMEN_DINERS,
} from '../data/ramen.js';
import { randomAppearance } from '../game/character.js';
import { toScene, between, pick, walkToward } from './people.js';

const MY_STOOL = RAMEN_STOOLS.find((stool) => stool.id === RAMEN_MY_STOOL);

// Ramen Hinata's life now: { time (seconds), cook, diners, nextId,
// spawnIn, playerWaiting (the character sits at their stool for a bowl;
// set by the renderer), playerServed (their bowl is on the counter) }.
//   cook:  { x, facing, state ('stir', 'walk', 'serve'), t, left, target,
//          walked, serving (the stool a bowl is going to, or null) }
//   diner: { id, look, stage, stool (RAMEN_STOOLS entry), x, facing,
//          state ('walk' in, 'sit', 'out'), t, left, walked, served }
export function createRamenLife(random = Math.random) {
  return {
    time: 0,
    cook: {
      x: RAMEN_COUNTER.cookSpots[0], facing: -1, state: 'stir', t: 0, left: between(RAMEN_COOK.stir, random),
      target: null, walked: 0, serving: null,
    },
    diners: [],
    nextId: 1,
    spawnIn: between(RAMEN_DINERS.firstIn, random),
    playerWaiting: false,
    playerServed: false,
  };
}

const freeStools = (life) => RAMEN_STOOLS.filter((stool) => stool !== MY_STOOL
  && !life.diners.some((diner) => diner.stool === stool));

// A diner in from the door, or null if every stool (or `max`) is taken.
export function addRamenDiner(life, random = Math.random) {
  const free = freeStools(life);
  if (!free.length || life.diners.length >= RAMEN_DINERS.max) return null;
  const diner = {
    id: life.nextId++,
    look: randomAppearance(),
    stage: random() < RAMEN_DINERS.elderShare ? 'elder' : 'adult',
    stool: pick(free, random),
    x: RAMEN_DOOR.x,
    facing: 1,
    state: 'walk',
    t: 0,
    left: 0,
    walked: 0,
    served: false,
  };
  life.diners.push(diner);
  return diner;
}

// The diner on the stool at x `x` gets their bowl (from the cook, or the
// character on a shift); they start eating. Returns whether one did.
export function serveDinerAt(life, x, random = Math.random) {
  const diner = life.diners.find((other) => other.state === 'sit' && !other.served && other.stool.x === x);
  if (!diner) return false;
  diner.served = true;
  diner.t = 0;
  diner.left = between(RAMEN_DINERS.eat, random);
  return true;
}

// The seated diner still waiting for a bowl, the longest first, or null.
export function waitingDiner(life) {
  return life.diners.filter((diner) => diner.state === 'sit' && !diner.served)
    .sort((a, b) => b.t - a.t)[0] ?? null;
}

function updateDiner(life, diner, dt) {
  diner.t += dt;
  const speed = toScene(RAMEN_DINERS.speed);
  if (diner.state === 'walk') {
    if (walkToward(diner, diner.stool.x, speed, dt)) {
      diner.state = 'sit';
      diner.facing = diner.stool.facing;
      diner.t = 0;
    }
  } else if (diner.state === 'sit') {
    if (!diner.served) return;
    diner.left -= dt;
    if (diner.left <= 0) diner.state = 'out';
  } else if (walkToward(diner, RAMEN_DOOR.x, speed, dt)) {
    life.diners = life.diners.filter((other) => other !== diner);
  }
}

// Who the cook brings a bowl to next: the character, or a diner seated
// `serveAfter` seconds.
function nextToServe(life) {
  if (life.playerWaiting && !life.playerServed) return MY_STOOL;
  const diner = waitingDiner(life);
  return diner && diner.t >= RAMEN_COOK.serveAfter ? diner.stool : null;
}

function updateCook(life, dt, random) {
  const { cook } = life;
  cook.t += dt;
  const speed = toScene(RAMEN_COOK.speed);
  if (cook.state === 'serve') {
    if (!walkToward(cook, cook.serving.x, speed, dt)) return;
    if (cook.serving === MY_STOOL) life.playerServed = life.playerWaiting;
    else serveDinerAt(life, cook.serving.x, random);
    cook.serving = null;
    cook.state = 'walk';
    cook.target = pick(RAMEN_COUNTER.cookSpots, random);
    return;
  }
  if (cook.state === 'walk') {
    if (walkToward(cook, cook.target, speed, dt)) {
      cook.state = 'stir';
      cook.t = 0;
      cook.left = between(RAMEN_COOK.stir, random);
      cook.facing = -1;
    }
    return;
  }
  const stool = nextToServe(life);
  if (stool) {
    cook.state = 'serve';
    cook.serving = stool;
    return;
  }
  cook.left -= dt;
  if (cook.left > 0) return;
  cook.state = 'walk';
  cook.target = RAMEN_COUNTER.cookSpots.find((x) => x !== cook.x) ?? RAMEN_COUNTER.cookSpots[0];
}

// Moves everything on by `dt` seconds.
export function updateRamenLife(life, dt, random = Math.random) {
  life.time += dt;
  if (!life.playerWaiting) life.playerServed = false;
  updateCook(life, dt, random);
  for (const diner of [...life.diners]) updateDiner(life, diner, dt);
  life.spawnIn -= dt;
  if (life.spawnIn <= 0) {
    addRamenDiner(life, random);
    life.spawnIn = between(RAMEN_DINERS.spawnEvery, random);
  }
}

// Whether the cook or a diner (`who`) is walking now (for their pose).
export const isWalkingInRamen = (who) => ['walk', 'serve', 'out'].includes(who.state);

// Clicked: the cook says one of their lines. Returns { kind, text, x, row
// (where the bubble goes) }, or null.
export function clickRamenCritter(life, id, random = Math.random) {
  if (id !== 'cook') return null;
  return { kind: 'cook', text: pick(RAMEN_COOK.lines, random), x: life.cook.x, row: RAMEN_COUNTER.behindRow - 22 };
}

// Where the cook can be clicked, in the picture's pixels (right and bottom
// exclusive): above the counter.
export function ramenBoxes(life) {
  const { cook } = life;
  return [{
    id: 'cook', kind: 'cook', left: cook.x - 4, right: cook.x + 4,
    top: RAMEN_COUNTER.behindRow - 20, bottom: RAMEN_COUNTER.top,
  }];
}
