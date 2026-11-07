// officeLife.js — Paperleaf Co.'s people and its plant, purely visual:
// two coworkers typing at their desks (now and then getting up for a chat
// by the water cooler), the boss strolling about and stopping by a desk or
// the whiteboard, and Gerald the plant swaying in his pot. Clicking the
// boss gets a line, clicking Gerald makes him perk up. Nothing here is
// saved: the renderer makes a new one each time the office is shown.
// Positions are the picture's pixels (data/office.js); ui/officeLifeArt.js
// draws it. No DOM here, so tests can run it.

import {
  OFFICE_DESKS, OFFICE_MY_DESK, OFFICE_COOLER_X, OFFICE_PLANT, OFFICE_COWORKERS, OFFICE_BOSS, OFFICE_PLANT_LIFE,
  OFFICE_ART, OFFICE_FEET_FROM_BOTTOM,
} from '../data/office.js';
import { toScene, between, pick, walkToward } from './people.js';

const FLOOR_ROW = OFFICE_ART.height - OFFICE_FEET_FROM_BOTTOM;

// Paperleaf Co.'s life now: { time (seconds), coworkers, boss, plant }.
//   coworker: { id, look, desk (OFFICE_DESKS entry), x, facing, state
//             ('type' at the desk, 'walk' to the cooler, 'chat', 'back'),
//             t, left, walked, chatX }
//   boss:     { x, facing, state ('walk', 'pause'), t, left, target,
//             walked }
//   plant:    { perk (seconds of perking up left) }
export function createOfficeLife(random = Math.random) {
  const desks = OFFICE_DESKS.filter((_, i) => i !== OFFICE_MY_DESK);
  return {
    time: 0,
    coworkers: desks.map((desk, i) => ({
      id: i + 1, look: OFFICE_COWORKERS.looks[i], desk, x: desk.seatX, facing: 1, state: 'type', t: 0,
      left: between(OFFICE_COWORKERS.type, random), walked: 0, chatX: OFFICE_COOLER_X + (i ? 4 : -4),
    })),
    boss: {
      x: pick(OFFICE_BOSS.stops, random), facing: -1, state: 'pause', t: 0, left: between(OFFICE_BOSS.pause, random),
      target: null, walked: 0,
    },
    plant: { perk: 0 },
  };
}

// Typing, now and then off to the cooler for a chat (facing the cooler)
// and back to the desk.
function updateCoworker(coworker, dt, random) {
  coworker.t += dt;
  const speed = toScene(OFFICE_COWORKERS.speed);
  if (coworker.state === 'walk') {
    if (walkToward(coworker, coworker.chatX, speed, dt)) {
      coworker.state = 'chat';
      coworker.t = 0;
      coworker.left = between(OFFICE_COWORKERS.chat, random);
      coworker.facing = Math.sign(OFFICE_COOLER_X - coworker.x) || 1;
    }
    return;
  }
  if (coworker.state === 'back') {
    if (walkToward(coworker, coworker.desk.seatX, speed, dt)) {
      coworker.state = 'type';
      coworker.facing = 1;
      coworker.t = 0;
      coworker.left = between(OFFICE_COWORKERS.type, random);
    }
    return;
  }
  coworker.left -= dt;
  if (coworker.left > 0) return;
  coworker.t = 0;
  if (coworker.state === 'chat') {
    coworker.state = 'back';
  } else if (random() < OFFICE_COWORKERS.breakChance) {
    coworker.state = 'walk';
  } else {
    coworker.left = between(OFFICE_COWORKERS.type, random);
  }
}

function updateBoss(boss, dt, random) {
  boss.t += dt;
  if (boss.state === 'walk') {
    if (walkToward(boss, boss.target, toScene(OFFICE_BOSS.speed), dt)) {
      boss.state = 'pause';
      boss.t = 0;
      boss.left = between(OFFICE_BOSS.pause, random);
    }
    return;
  }
  boss.left -= dt;
  if (boss.left > 0) return;
  boss.state = 'walk';
  boss.t = 0;
  boss.target = pick(OFFICE_BOSS.stops.filter((x) => x !== boss.x), random);
}

// Moves everything on by `dt` seconds.
export function updateOfficeLife(life, dt, random = Math.random) {
  life.time += dt;
  for (const coworker of life.coworkers) updateCoworker(coworker, dt, random);
  updateBoss(life.boss, dt, random);
  life.plant.perk = Math.max(0, life.plant.perk - dt);
}

// Whether a coworker or the boss (`who`) is walking now (for their pose).
export const isWalkingInOffice = (who) => ['walk', 'back'].includes(who.state);

// Clicked: the boss says one of their lines; Gerald perks up. Returns {
// kind, text, x, row (where the bubble goes) }, or null.
export function clickOfficeCritter(life, id, random = Math.random) {
  if (id === 'boss') {
    return { kind: 'boss', text: pick(OFFICE_BOSS.lines, random), x: life.boss.x, row: FLOOR_ROW - 22 };
  }
  if (id === 'plant') {
    life.plant.perk = OFFICE_PLANT_LIFE.perk;
    return { kind: 'plant', text: pick(OFFICE_PLANT_LIFE.lines, random), x: OFFICE_PLANT.x, row: OFFICE_PLANT.top - 4 };
  }
  return null;
}

// Where the boss and Gerald can be clicked, in the picture's pixels (right
// and bottom exclusive).
export function officeBoxes(life) {
  const { boss } = life;
  return [
    { id: 'boss', kind: 'boss', left: boss.x - 4, right: boss.x + 4, top: FLOOR_ROW - 18, bottom: FLOOR_ROW },
    { id: 'plant', kind: 'plant', left: OFFICE_PLANT.x - 4, right: OFFICE_PLANT.x + 5, top: OFFICE_PLANT.top, bottom: OFFICE_PLANT.bottom },
  ];
}
