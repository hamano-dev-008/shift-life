// alleyLife.js — Mural Alley's people and its parrot, purely visual: the
// painter at the mural (spraying the chalked-in part, stepping back to
// look, moving along), visitors in from the street looking at the mural
// or the stall's prints and leaving, and Rio the parrot on its perch
// (bobbing, flapping). Clicking the painter gets a line, clicking Rio a
// squawk (or the painter's last line, repeated). Nothing here is saved:
// the renderer makes a new one each time the alley is shown. Positions
// are the picture's pixels (data/alley.js); ui/alleyLifeArt.js draws it.
// No DOM here, so tests can run it.

import {
  ALLEY_MOUTH, ALLEY_PERCH, ALLEY_PAINTER, ALLEY_VISITORS, ALLEY_PARROT, ALLEY_ART, ALLEY_FEET_FROM_BOTTOM,
} from '../data/alley.js';
import { randomAppearance } from '../game/character.js';
import { toScene, between, pick, walkToward } from './people.js';

const FLOOR_ROW = ALLEY_ART.height - ALLEY_FEET_FROM_BOTTOM;

// Mural Alley's life now: { time (seconds), painter, visitors, parrot,
// nextId, spawnIn }.
//   painter: { x, facing, state ('spray', 'gaze', 'walk'), t, left,
//            target, walked }
//   visitor: { id, look, stage, x, facing, state ('walk' to a spot,
//            'gaze', 'out'), t, left, target, walked, looks (spots seen) }
//   parrot:  { state ('perch', 'bob', 'flap'), t, left, heard (the
//            painter's last line, or null) }
export function createAlleyLife(random = Math.random) {
  return {
    time: 0,
    painter: {
      x: pick(ALLEY_PAINTER.spots, random), facing: -1, state: 'spray', t: 0,
      left: between(ALLEY_PAINTER.spray, random), target: null, walked: 0,
    },
    visitors: [],
    parrot: { state: 'perch', t: 0, left: between(ALLEY_PARROT.bob, random), heard: null },
    nextId: 1,
    spawnIn: between(ALLEY_VISITORS.firstIn, random),
  };
}

// Spray, step back to look, move along; again.
function updatePainter(painter, dt, random) {
  painter.t += dt;
  if (painter.state === 'walk') {
    if (walkToward(painter, painter.target, toScene(ALLEY_PAINTER.speed), dt)) {
      painter.state = 'spray';
      painter.t = 0;
      painter.left = between(ALLEY_PAINTER.spray, random);
    }
    return;
  }
  painter.left -= dt;
  if (painter.left > 0) return;
  painter.t = 0;
  if (painter.state === 'spray') {
    painter.state = 'gaze';
    painter.left = between(ALLEY_PAINTER.gaze, random);
    return;
  }
  const others = ALLEY_PAINTER.spots.filter((x) => x !== painter.x);
  painter.state = 'walk';
  painter.target = pick(others, random);
}

// A visitor in from the street, or null if there are `max` already.
export function addAlleyVisitor(life, random = Math.random) {
  if (life.visitors.length >= ALLEY_VISITORS.max) return null;
  const roll = random();
  const stage = roll < ALLEY_VISITORS.elderShare ? 'elder'
    : roll < ALLEY_VISITORS.elderShare + ALLEY_VISITORS.childShare ? 'child' : 'adult';
  const taken = life.visitors.map((visitor) => visitor.target);
  const free = ALLEY_VISITORS.spots.filter((x) => !taken.includes(x));
  const visitor = {
    id: life.nextId++,
    look: randomAppearance(),
    stage,
    x: ALLEY_MOUTH.x,
    facing: 1,
    state: 'walk',
    t: 0,
    left: 0,
    target: pick(free, random),
    walked: 0,
    looks: 0,
  };
  life.visitors.push(visitor);
  return visitor;
}

function updateVisitor(life, visitor, dt, random) {
  visitor.t += dt;
  const speed = toScene(ALLEY_VISITORS.speed);
  if (visitor.state === 'walk') {
    if (walkToward(visitor, visitor.target, speed, dt)) {
      visitor.state = 'gaze';
      visitor.t = 0;
      visitor.left = between(ALLEY_VISITORS.gaze, random);
      visitor.looks += 1;
      visitor.facing = random() < 0.5 ? -1 : 1;
    }
  } else if (visitor.state === 'gaze') {
    visitor.left -= dt;
    if (visitor.left > 0) return;
    const taken = life.visitors.map((other) => other.target);
    const free = ALLEY_VISITORS.spots.filter((x) => !taken.includes(x));
    if (visitor.looks < 2 && free.length && random() < ALLEY_VISITORS.secondLook) {
      visitor.state = 'walk';
      visitor.target = pick(free, random);
    } else {
      visitor.state = 'out';
      visitor.target = ALLEY_MOUTH.x;
    }
  } else if (walkToward(visitor, ALLEY_MOUTH.x, speed, dt)) {
    life.visitors = life.visitors.filter((other) => other !== visitor);
  }
}

function updateParrot(parrot, dt, random) {
  parrot.t += dt;
  parrot.left -= dt;
  if (parrot.left > 0) return;
  parrot.t = 0;
  if (parrot.state !== 'perch') {
    parrot.state = 'perch';
    parrot.left = between(ALLEY_PARROT.bob, random);
  } else if (random() < ALLEY_PARROT.flapChance) {
    parrot.state = 'flap';
    parrot.left = ALLEY_PARROT.flap;
  } else {
    parrot.state = 'bob';
    parrot.left = ALLEY_PARROT.bobFor;
  }
}

// Moves everything on by `dt` seconds.
export function updateAlleyLife(life, dt, random = Math.random) {
  life.time += dt;
  updatePainter(life.painter, dt, random);
  for (const visitor of [...life.visitors]) updateVisitor(life, visitor, dt, random);
  updateParrot(life.parrot, dt, random);
  life.spawnIn -= dt;
  if (life.spawnIn <= 0) {
    addAlleyVisitor(life, random);
    life.spawnIn = between(ALLEY_VISITORS.spawnEvery, random);
  }
}

// Clicked: the painter says one of their lines (Rio hears it); Rio
// repeats it once, else squawks one of its own, flapping. Returns { kind,
// text, x, row (where the bubble goes) }, or null.
export function clickAlleyCritter(life, id, random = Math.random) {
  if (id === 'painter') {
    const text = pick(ALLEY_PAINTER.lines, random);
    life.parrot.heard = text;
    return { kind: 'painter', text, x: life.painter.x, row: FLOOR_ROW - 22 };
  }
  if (id === 'parrot') {
    const { parrot } = life;
    const text = parrot.heard ?? pick(ALLEY_PARROT.lines, random);
    parrot.heard = null;
    parrot.state = 'flap';
    parrot.t = 0;
    parrot.left = ALLEY_PARROT.flap;
    return { kind: 'parrot', text, x: ALLEY_PERCH.x, row: ALLEY_PERCH.row - 8 };
  }
  return null;
}

// Where the painter and Rio can be clicked, in the picture's pixels (right
// and bottom exclusive).
export function alleyBoxes(life) {
  const { painter } = life;
  return [
    { id: 'painter', kind: 'painter', left: painter.x - 4, right: painter.x + 4, top: FLOOR_ROW - 19, bottom: FLOOR_ROW },
    {
      id: 'parrot', kind: 'parrot', left: ALLEY_PERCH.x - 4, right: ALLEY_PERCH.x + 4,
      top: ALLEY_PERCH.row - 8, bottom: ALLEY_PERCH.row + 2,
    },
  ];
}
