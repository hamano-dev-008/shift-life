// lakeFrogs.js — The Lake's frogs, purely visual: sitting on the lily pads
// (blinking, croaking, hopping to the other free pad, plopping into the
// water and coming up again later, diving when the bobber lands near),
// now and then hopping up onto the shore grass, and there going for
// butterflies that come near: a crouch, a leap and a flick of the tongue
// that now and then catches one. ui/lakeLife.js runs them with the
// butterflies; positions are lake.png pixels (data/lakeLife.js).

import { LILY_PADS, LAND_SPOTS, FROGS } from '../data/lakeLife.js';

export function between([min, max], random) {
  return min + (max - min) * random();
}

const padCenter = (pad) => (pad.left + pad.right + 1) / 2;
const pick = (list, random) => list[Math.floor(random() * list.length)];

// Where a seat is: { x (middle), row (bottom edge) }. A seat is a pad
// ({ pad: index }) or a shore spot ({ spot: index }).
function seatAt(seat) {
  if (seat.pad != null) {
    const pad = LILY_PADS[seat.pad];
    return { x: padCenter(pad), row: pad.row };
  }
  return { x: LAND_SPOTS[seat.spot].x, row: LAND_SPOTS[seat.spot].row };
}

// frog: { id, pad or spot (the index of the pad or shore spot it sits on,
// else null), x (middle), row (bottom edge), state ('sit', 'croak',
// 'crouch', 'hop', 'under'), t (seconds into it), blinkIn, blinkLeft,
// croakIn, moveIn, huntIn, hunt (the butterfly id it's after), hop ({
// from, to, seat, seconds, height, flicked }), tongue ({ t, dx, drow (its
// full length), butterfly (id of one caught, or null) }), gulpLeft }.
export function newFrog(life, pad, random) {
  const frog = {
    id: life.nextId++, pad: null, spot: null, x: 0, row: 0, state: 'sit', t: 0, blinkIn: 0, blinkLeft: 0,
    croakIn: 0, moveIn: 0, huntIn: 0, hunt: null, hop: null, tongue: null, gulpLeft: 0,
  };
  sitAt(frog, { pad }, random);
  return frog;
}

// Puts the frog on `seat`, sitting, with fresh timers.
function sitAt(frog, seat, random) {
  frog.pad = seat.pad ?? null;
  frog.spot = seat.spot ?? null;
  Object.assign(frog, seatAt(seat));
  frog.state = 'sit';
  frog.t = 0;
  frog.hop = null;
  frog.hunt = null;
  frog.blinkIn = between(FROGS.blinkEvery, random);
  frog.croakIn = between(FROGS.croakEvery, random);
  frog.moveIn = between(frog.spot == null ? FROGS.moveEvery : FROGS.landFor, random);
  frog.huntIn = between(FROGS.hunt.delay, random);
}

// Pads (or with `land`, shore spots) nobody sits on or is hopping to.
export function freeSeats(life, land = false) {
  const key = land ? 'spot' : 'pad';
  const taken = new Set(life.frogs.flatMap((frog) => [frog[key], frog.hop?.seat[key]]).filter((i) => i != null));
  return (land ? LAND_SPOTS : LILY_PADS).map((_, i) => i).filter((i) => !taken.has(i))
    .map((i) => ({ [key]: i }));
}

// Sitting still (on a pad or the shore), so it can croak, be clicked or
// move.
export const isSitting = (frog) => frog.state === 'sit' || frog.state === 'croak' || frog.state === 'crouch';
export const onPad = (frog) => isSitting(frog) && frog.pad != null;

function addEffect(life, kind, x, row) {
  life.effects.push({ kind, x, row, t: 0 });
}

// Hops to `seat`, or on the spot (`seat` null). `kind` is the arc
// (FROGS.hop, or the hunt's leap).
function startHop(frog, seat, kind = seat ? FROGS.hop : FROGS.inPlaceHop) {
  const from = { x: frog.x, row: frog.row };
  const here = frog.pad != null ? { pad: frog.pad } : { spot: frog.spot };
  frog.hop = { from, to: seat ? seatAt(seat) : from, seat: seat ?? here, seconds: kind.seconds, height: kind.height,
    flicked: false };
  frog.pad = null;
  frog.spot = null;
  frog.state = 'hop';
  frog.t = 0;
}

// Hops somewhere free: from a pad to the other pad (or on the spot),
// from the shore back to a pad, else to another spot (or on the spot).
export function hopAway(life, frog, random) {
  const pads = freeSeats(life);
  if (frog.pad != null) {
    startHop(frog, pads.length ? pick(pads, random) : null);
    return;
  }
  const spots = freeSeats(life, true);
  startHop(frog, pads.length ? pick(pads, random) : (spots.length ? pick(spots, random) : null));
}

// Into the water: a ripple (and a splash when scared), then under water
// for a while.
export function plop(life, frog, random, splash = false) {
  addEffect(life, 'ripple', frog.x, frog.row);
  if (splash) addEffect(life, 'splash', frog.x, frog.row);
  frog.pad = null;
  frog.hop = null;
  frog.hunt = null;
  frog.state = 'under';
  frog.t = 0;
  frog.moveIn = between(FROGS.underwater, random);
}

// A butterfly a frog on the shore could go for: flying or resting (not
// fleeing, caught, or off the window) within FROGS.hunt.notice.
function preyFor(life, frog) {
  const { cols, rows } = FROGS.hunt.notice;
  return life.butterflies.find((butterfly) => (butterfly.state === 'wander' || butterfly.state === 'land')
    && Math.abs(butterfly.x - frog.x) <= cols
    && frog.row - butterfly.row >= rows[0] && frog.row - butterfly.row <= rows[1]) ?? null;
}

// Leaps at the butterfly it's after: onto the free spot nearest it (or
// back onto its own).
function leap(life, frog, butterfly) {
  const spots = [...freeSeats(life, true), { spot: frog.spot }];
  const nearest = spots.reduce((best, seat) => (Math.abs(seatAt(seat).x - butterfly.x)
    < Math.abs(seatAt(best).x - butterfly.x) ? seat : best));
  startHop(frog, nearest, FROGS.hunt.leap);
  frog.hop.hunt = butterfly.id;
}

// The mouth: the middle of the frog's top, where the tongue comes from.
export const mouthOf = (frog) => ({ x: frog.x, row: frog.row - 2 });

// At the top of the leap: the tongue flicks toward the butterfly, up to
// its reach. One in reach is caught with FROGS.hunt.catchChance; any other
// gets a fright and flutters off.
function flick(life, frog, random) {
  const { reach } = FROGS.hunt.tongue;
  const butterfly = life.butterflies.find((candidate) => candidate.id === frog.hop.hunt);
  if (!butterfly || butterfly.state === 'flee' || butterfly.state === 'caught') return;
  const mouth = mouthOf(frog);
  const dx = butterfly.x - mouth.x;
  const drow = butterfly.row - 1 - mouth.row;
  const distance = Math.hypot(dx, drow) || 1;
  const length = Math.min(distance, reach);
  const caught = distance <= reach && random() < FROGS.hunt.catchChance;
  frog.tongue = { t: 0, dx: (dx / distance) * length, drow: (drow / distance) * length, butterfly: caught ? butterfly.id : null };
  if (caught) {
    butterfly.state = 'caught';
  } else {
    butterfly.scared = true;
  }
}

// How far out the tongue is (0-1): out over the first half, back over the
// second.
export function tongueOut(tongue) {
  const half = FROGS.hunt.tongue.seconds / 2;
  return tongue.t < half ? tongue.t / half : Math.max(0, 1 - (tongue.t - half) / half);
}

// The tongue moves on; a caught butterfly rides its tip back in and is
// eaten (`eaten`, so ui/lakeLife.js drops it) when it's all the way in.
function updateTongue(life, frog, dt) {
  const { tongue } = frog;
  tongue.t += dt;
  const butterfly = tongue.butterfly && life.butterflies.find((candidate) => candidate.id === tongue.butterfly);
  if (butterfly && tongue.t >= FROGS.hunt.tongue.seconds / 2) {
    const mouth = mouthOf(frog);
    const out = tongueOut(tongue);
    butterfly.x = mouth.x + tongue.dx * out;
    butterfly.row = mouth.row + tongue.drow * out + 1;
  }
  if (tongue.t < FROGS.hunt.tongue.seconds) return;
  if (butterfly) {
    butterfly.eaten = true;
    frog.gulpLeft = FROGS.hunt.gulp;
  }
  frog.tongue = null;
}

function updateSitting(life, frog, dt, random) {
  if (frog.blinkLeft > 0) frog.blinkLeft -= dt;
  if (frog.gulpLeft > 0) frog.gulpLeft -= dt;
  frog.blinkIn -= dt;
  if (frog.blinkIn <= 0) {
    frog.blinkLeft = FROGS.blinkFor;
    frog.blinkIn = between(FROGS.blinkEvery, random);
  }
  if (frog.state === 'crouch') {
    if (frog.t < FROGS.hunt.crouch) return;
    const butterfly = life.butterflies.find((candidate) => candidate.id === frog.hunt);
    if (butterfly && (butterfly.state === 'wander' || butterfly.state === 'land')) {
      leap(life, frog, butterfly);
    } else {
      frog.state = 'sit';
      frog.t = 0;
      frog.hunt = null;
    }
    return;
  }
  if (frog.state === 'croak') {
    if (frog.t >= FROGS.croakFrame * 3) {
      frog.state = 'sit';
      frog.t = 0;
    }
    return;
  }
  if (frog.spot != null && !frog.tongue) {
    frog.huntIn -= dt;
    if (frog.huntIn <= 0) {
      const butterfly = preyFor(life, frog);
      frog.huntIn = butterfly ? between(FROGS.hunt.delay, random) : FROGS.hunt.delay[0];
      if (butterfly) {
        frog.state = 'crouch';
        frog.t = 0;
        frog.hunt = butterfly.id;
        return;
      }
    }
  }
  frog.croakIn -= dt;
  if (frog.croakIn <= 0) {
    frog.state = 'croak';
    frog.t = 0;
    frog.croakIn = between(FROGS.croakEvery, random);
    return;
  }
  frog.moveIn -= dt;
  if (frog.moveIn > 0) return;
  if (frog.spot != null) {
    hopAway(life, frog, random);
    return;
  }
  const spots = freeSeats(life, true);
  const pads = freeSeats(life);
  if (spots.length && random() < FROGS.landShare) {
    startHop(frog, pick(spots, random));
  } else if (pads.length && random() < FROGS.hopShare) {
    startHop(frog, pick(pads, random));
  } else {
    plop(life, frog, random);
  }
}

export function updateFrog(life, frog, dt, random) {
  frog.t += dt;
  if (frog.tongue) updateTongue(life, frog, dt);
  if (isSitting(frog)) {
    updateSitting(life, frog, dt, random);
    return;
  }
  if (frog.state === 'hop') {
    const { hop } = frog;
    const u = Math.min(1, frog.t / hop.seconds);
    frog.x = hop.from.x + (hop.to.x - hop.from.x) * u;
    // An arc from seat to seat, rising about `height` above the higher.
    const line = hop.from.row + (hop.to.row - hop.from.row) * u;
    const rise = hop.height + Math.abs(hop.to.row - hop.from.row) / 2;
    frog.row = line - 4 * rise * u * (1 - u);
    if (hop.hunt && !hop.flicked && u >= 0.5) {
      hop.flicked = true;
      flick(life, frog, random);
    }
    if (u >= 1) {
      const moved = hop.to.x !== hop.from.x;
      sitAt(frog, hop.seat, random);
      if (moved && frog.pad != null) addEffect(life, 'ripple', frog.x, frog.row);
    }
    return;
  }
  // Under water: up again on a free pad when the time comes.
  frog.moveIn -= dt;
  if (frog.moveIn > 0) return;
  const pads = freeSeats(life);
  if (!pads.length) {
    frog.moveIn = between(FROGS.underwater, random) / 2;
    return;
  }
  sitAt(frog, pick(pads, random), random);
  addEffect(life, 'ripple', frog.x, frog.row);
}

// A frog on a pad hops up onto a free shore spot now (dev menu). Returns
// the frog, or null if none can.
export function toLandNow(life, random = Math.random) {
  const frog = life.frogs.find(onPad);
  const spots = freeSeats(life, true);
  if (!frog || !spots.length) return null;
  startHop(frog, pick(spots, random));
  return frog;
}

// A frog on the shore goes for the nearest butterfly in reach now,
// whatever the notice range (dev menu). Returns whether one did.
export function huntNow(life) {
  const frog = life.frogs.find((candidate) => candidate.state === 'sit' && candidate.spot != null);
  const prey = life.butterflies.filter((butterfly) => butterfly.state === 'wander' || butterfly.state === 'land');
  if (!frog || !prey.length) return false;
  const butterfly = prey.reduce((best, b) => (Math.abs(b.x - frog.x) < Math.abs(best.x - frog.x) ? b : best));
  frog.state = 'crouch';
  frog.t = 0;
  frog.hunt = butterfly.id;
  return true;
}
