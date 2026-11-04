// fishing.js — Fishing's bites and catches, run by game/activities.js
// while the fishing activity runs: a random real-time wait after each
// cast, the bite (clicking its "!" in time reels with better odds for
// rarer fish), reeling in, the catch going into the bucket, and selling
// the bucket when fishing stops. Each catch has a random size (which
// nudges its value) and comes with what its reveal card shows. Also the
// fish collection: the first catch of each kind ever and the biggest,
// kept across lives in its own file (like the Book of past lives). All
// numbers and text live in data/fishing.js.

import {
  FISHING_TIMES, RARITIES, FISH, FISHING_TEXT, SIZE_VALUE,
} from '../data/fishing.js';
import { REVEAL_TIMES } from '../data/catchReveal.js';
import { ageOf, changeStats } from './character.js';
import { biteSpeed } from './weather.js';

const SECOND = 1000;
const PHASES = ['waiting', 'bite', 'reeling', 'showing'];

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

export function fishById(id) {
  return FISH.find((fish) => fish.id === id) ?? null;
}

export function rarityById(id) {
  return RARITIES.find((rarity) => rarity.id === id) ?? null;
}

// Real ms until the next bite, counted from the cast.
function biteWait(random) {
  const [min, max] = FISHING_TIMES.biteWait;
  return Math.round((min + (max - min) * random()) * SECOND);
}

// The fishing part of a running activity: phase 'waiting' (cast, waiting
// for a bite), 'bite' (the "!" is up), 'reeling' or 'showing' (holding up
// the catch); phaseMs: real time into the phase; waitMs: how long this
// wait lasts; bucket: [{ id, value, size }] caught so far (size in cm,
// null for junk); catch: the fish being reeled in or shown.
export function createFishingState(random = Math.random) {
  return { phase: 'waiting', phaseMs: 0, waitMs: biteWait(random), bucket: [], catch: null };
}

const isAmount = (value) => Number.isFinite(value) && value >= 0;
const isSize = (value) => Number.isFinite(value) && value > 0;

// Rebuilds the fishing state from save data; anything unusable starts a
// fresh cast (the bucket keeps what's valid).
export function restoreFishingState(data, random = Math.random) {
  const state = createFishingState(random);
  if (Array.isArray(data?.bucket)) {
    state.bucket = data.bucket
      .filter((entry) => fishById(entry?.id) && isAmount(entry.value))
      .map(({ id, value, size }) => ({ id, value: Math.floor(value), size: isSize(size) ? Math.floor(size) : null }));
  }
  if (!PHASES.includes(data?.phase)) return state;
  const caught = fishById(data.catch)?.id ?? null;
  if ((data.phase === 'reeling' || data.phase === 'showing') && !caught) return state;
  state.phase = data.phase;
  state.catch = caught;
  if (isAmount(data.waitMs)) state.waitMs = Math.min(data.waitMs, FISHING_TIMES.biteWait[1] * SECOND);
  if (isAmount(data.phaseMs)) state.phaseMs = Math.min(data.phaseMs, phaseLength(state));
  return state;
}

// Real ms the current phase lasts.
function phaseLength(state) {
  switch (state.phase) {
    case 'waiting': return state.waitMs;
    case 'bite': return FISHING_TIMES.biteWindow * SECOND;
    case 'reeling': return FISHING_TIMES.reel * SECOND;
    default: return FISHING_TIMES.show * SECOND;
  }
}

// The odds of each catch, [{ fish, weight }]: each rarity's weight split
// evenly between its fish, times its click bonus if `clicked`.
export function catchOdds(clicked = false) {
  return FISH.map((fish) => {
    const rarity = rarityById(fish.rarity);
    const kinds = FISH.filter((other) => other.rarity === fish.rarity).length;
    return { fish, weight: (rarity.weight / kinds) * (clicked ? rarity.clickBonus : 1) };
  });
}

// A random catch's id, by catchOdds().
export function pickCatch(clicked = false, random = Math.random) {
  const odds = catchOdds(clicked);
  const total = odds.reduce((sum, { weight }) => sum + weight, 0);
  let roll = random() * total;
  for (const { fish, weight } of odds) {
    roll -= weight;
    if (roll < 0) return fish.id;
  }
  return odds.at(-1).fish.id;
}

// A random whole size in cm in the fish's range, or null (junk).
export function catchSize(fish, random = Math.random) {
  if (!fish.size) return null;
  const [min, max] = fish.size;
  return min + Math.floor(random() * (max - min + 1));
}

// What a catch sells for: its value (or a random whole amount in its
// range), a little more for a big one and a little less for a small one
// (SIZE_VALUE).
export function catchValue(fish, size, random = Math.random) {
  let base = fish.value;
  if (Array.isArray(base)) {
    const [min, max] = base;
    base = min + Math.floor(random() * (max - min + 1));
  }
  if (size == null || !fish.size) return base;
  const [min, max] = fish.size;
  const share = max > min ? (size - min) / (max - min) : 0.5;
  return Math.round(base * (1 + SIZE_VALUE * (2 * share - 1)));
}

// What a catch's reveal card shows: { fish (id), size, value, isNew
// (first of its kind), record (bigger than the biggest so far) }.
function revealOf(fish, size, value, isNew, record) {
  return { fish: fish.id, size, value, isNew, record };
}

function enter(state, phase) {
  state.phase = phase;
  state.phaseMs = 0;
}

function startReeling(state, clicked, random) {
  enter(state, 'reeling');
  state.catch = pickCatch(clicked, random);
}

// The catch comes out of the water: a size and value, into the bucket,
// counted, and into the collection if it's the first of its kind or the
// biggest. Returns its bubble ({ heading, text, detail, celebrate,
// collected (the collection changed, so save it), reveal (for the reveal
// card, see revealOf()) }).
function land(game, state, random) {
  const fish = fishById(state.catch);
  const size = catchSize(fish, random);
  const value = catchValue(fish, size, random);
  state.bucket.push({ id: fish.id, value, size });
  const totals = game.activities.totals.fishing;
  totals.caught += 1;
  const { isNew, record, changed } = recordCatch(game.collection, fish.id, game.character.name,
    ageOf(game.character, game.clock.years), size);
  enter(state, 'showing');
  const rarity = rarityById(fish.rarity);
  const junk = value === 0;
  return {
    heading: isNew ? FISHING_TEXT.newKind : (rarity.celebrate ? rarity.name : undefined),
    text: fill(junk ? FISHING_TEXT.caughtJunk : FISHING_TEXT.caught, { fish: fish.name.toLowerCase() }),
    detail: junk ? '' : fill(FISHING_TEXT.inBucket, { value }),
    celebrate: rarity.celebrate || isNew,
    collected: changed,
    reveal: revealOf(fish, size, value, isNew, record),
  };
}

// Moves the phase on once it's over. Returns a bubble when a catch lands.
function advance(game, state, random) {
  switch (state.phase) {
    case 'waiting':
      enter(state, 'bite');
      return null;
    case 'bite':
      startReeling(state, false, random);
      return null;
    case 'reeling':
      return land(game, state, random);
    default:
      enter(state, 'waiting');
      state.waitMs = biteWait(random);
      state.catch = null;
      return null;
  }
}

// Call with the real ms passed while fishing. Returns bubbles for catches
// landed. In the rain the wait for a bite passes faster (biteSpeed());
// the bite, reeling and showing take as long as ever.
export function updateFishing(game, state, realMs, random = Math.random) {
  const bubbles = [];
  const waitSpeed = biteSpeed(game);
  let left = realMs;
  // A phase can't be shorter than a tick by much, but don't loop forever.
  for (let steps = 0; steps < 10; steps++) {
    const speed = state.phase === 'waiting' ? waitSpeed : 1;
    const remaining = (phaseLength(state) - state.phaseMs) / speed;
    if (left < remaining) {
      state.phaseMs += left * speed;
      break;
    }
    left -= Math.max(0, remaining);
    const bubble = advance(game, state, random);
    if (bubble) bubbles.push(bubble);
  }
  return bubbles;
}

// The "!" was clicked during a bite: reel in now, with the click odds.
// Returns whether there was a bite to reel.
export function reelIn(state, random = Math.random) {
  if (state.phase !== 'bite') return false;
  startReeling(state, true, random);
  return true;
}

// A bite right now (dev menu), unless one is already on the line.
// Returns whether it bit.
export function biteNow(state) {
  if (state.phase === 'bite' || state.phase === 'reeling') return false;
  enter(state, 'bite');
  state.catch = null;
  return true;
}

// Lands a fish of rarity `rarityId` right now (dev menu). Returns its
// bubble, or null for an unknown rarity.
export function catchNow(game, state, rarityId, random = Math.random) {
  const kinds = FISH.filter((fish) => fish.rarity === rarityId);
  if (!kinds.length) return null;
  state.catch = kinds[Math.floor(random() * kinds.length)].id;
  return land(game, state, random);
}

// A made-up catch of rarity `rarityId` for previewing its reveal card
// (dev menu): a random fish of that rarity, size and value, with the
// badges it would get. Changes nothing. Null for an unknown rarity.
export function previewCatch(game, rarityId, random = Math.random) {
  const kinds = FISH.filter((fish) => fish.rarity === rarityId);
  if (!kinds.length) return null;
  const fish = kinds[Math.floor(random() * kinds.length)];
  const size = catchSize(fish, random);
  const entry = game.collection?.fish[fish.id];
  const record = Boolean(entry?.best) && size != null && size > entry.best.size;
  return revealOf(fish, size, catchValue(fish, size, random), !entry, record);
}

// How many fish are in the bucket and what they're worth.
export function bucketTotals(state) {
  return { count: state.bucket.length, total: state.bucket.reduce((sum, entry) => sum + entry.value, 0) };
}

// Sells the whole bucket. Returns the bubble with the total.
export function sellBucket(game, state) {
  const { bucket } = state;
  if (!bucket.length) return { ...FISHING_TEXT.soldNothing, deltas: {}, celebrate: false };
  const total = bucket.reduce((sum, entry) => sum + entry.value, 0);
  state.bucket = [];
  game.activities.totals.fishing.earned += total;
  const deltas = total ? changeStats(game.character, { money: total }) : {};
  const { heading, text } = FISHING_TEXT.sold;
  return { heading, text: fill(text, { count: bucket.length, total }), deltas, celebrate: false };
}

// The menu's status lines while fishing: what's happening, the bucket and
// what it's worth.
export function fishingStatus(state) {
  const phase = {
    waiting: FISHING_TEXT.waiting, bite: FISHING_TEXT.bite, reeling: FISHING_TEXT.reeling, showing: FISHING_TEXT.showing,
  }[state.phase];
  if (!state.bucket.length) return [phase, FISHING_TEXT.bucketEmpty];
  const counts = new Map();
  for (const { id } of state.bucket) counts.set(id, (counts.get(id) ?? 0) + 1);
  const list = [...counts].map(([id, count]) => `${fishById(id).name}${count > 1 ? ` x${count}` : ''}`).join(', ');
  const total = state.bucket.reduce((sum, entry) => sum + entry.value, 0);
  return [phase, fill(FISHING_TEXT.bucket, { list }), fill(FISHING_TEXT.worth, { total })];
}

// What the fishing looks like now, for drawing: { phase ('cast', 'wait',
// 'bite', 'reel', 'land' (the bobber jerking while the reveal's suspense
// plays) or 'show'), seconds into it, catch (the fish id being reeled or
// shown) }.
export function fishingLook(state) {
  const seconds = state.phaseMs / SECOND;
  let phase = { waiting: 'wait', bite: 'bite', reeling: 'reel', showing: 'show' }[state.phase];
  if (phase === 'wait' && seconds < FISHING_TIMES.cast) phase = 'cast';
  if (phase === 'show' && seconds < REVEAL_TIMES.suspense) phase = 'land';
  return { phase, seconds, catch: state.catch };
}

// The fish collection: { fish: { <fish id>: { name, age, on, best } } },
// the first catch of each kind (by whom, at what age, and the date), and
// the biggest one caught (best: { size (cm), name, age }; none for junk,
// or for kinds first caught before sizes). Kept in its own file across
// lives.
export function createCollection() {
  return { fish: {} };
}

const isText = (value) => typeof value === 'string' && value.length > 0;
const isAge = (value) => Number.isInteger(value) && value >= 0;

// Rebuilds the collection from its file, keeping known fish only.
export function restoreCollection(data) {
  const collection = createCollection();
  for (const fish of FISH) {
    const entry = data?.fish?.[fish.id];
    if (isText(entry?.name) && isAge(entry.age)) {
      const restored = { name: entry.name, age: entry.age, on: isText(entry.on) ? entry.on : '' };
      const { best } = entry;
      if (fish.size && isSize(best?.size) && isText(best.name) && isAge(best.age)) {
        restored.best = { size: Math.floor(best.size), name: best.name, age: best.age };
      }
      collection.fish[fish.id] = restored;
    }
  }
  return collection;
}

export function collectionSaveData(collection) {
  return { version: 1, fish: collection.fish };
}

// Records a catch: the first of its kind, and the biggest (`size` in cm,
// or null for junk). Returns { isNew (first of its kind), record (beat
// the biggest so far), changed (the collection changed) }. A missing
// collection (tests) records nothing.
export function recordCatch(collection, fishId, name, age, size = null, now = new Date()) {
  if (!collection) return { isNew: false, record: false, changed: false };
  const best = size != null ? { size, name, age } : null;
  const entry = collection.fish[fishId];
  if (!entry) {
    collection.fish[fishId] = { name, age, on: now.toISOString(), ...(best && { best }) };
    return { isNew: true, record: false, changed: true };
  }
  if (!best || (entry.best && size <= entry.best.size)) return { isNew: false, record: false, changed: false };
  // A kind first caught before sizes gets its first biggest without a
  // "record" (there was nothing to beat).
  const record = Boolean(entry.best);
  entry.best = best;
  return { isNew: false, record, changed: true };
}

// How many kinds have been caught, out of how many there are.
export function collectionCount(collection) {
  return { count: Object.keys(collection?.fish ?? {}).length, total: FISH.length };
}

// The collection view: every fish, caught or not, with who caught it
// first and at what age, and the biggest one (or null).
export function collectionView(collection) {
  return {
    ...collectionCount(collection),
    fish: FISH.map((fish) => {
      const entry = collection?.fish[fish.id];
      return {
        id: fish.id,
        name: fish.name,
        rarity: rarityById(fish.rarity).name,
        first: entry ? fill(FISHING_TEXT.firstCaught, entry) : null,
        biggest: entry?.best ? fill(FISHING_TEXT.biggest, entry.best) : null,
      };
    }),
  };
}
