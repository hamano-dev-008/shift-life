// housing.js — Where the character lives: with their parents until
// MOVE_OUT_AGE, then their own place in My Yard (sleeping bag, tent,
// house), upgraded when the player buys the next tier. Also which places
// exist for that (requirements), which housing prop shows, and how fast
// resting restores health where they are. All numbers and text live in
// data/housing.js.

import {
  MOVE_OUT_AGE, HOUSING_TIERS, PARENTS_REST_MINUTES, HOUSING_TEXT,
} from '../data/housing.js';
import { ageOf, changeStats } from './character.js';

const FIRST_TIER = HOUSING_TIERS[0].id;
const TIER_PROPS = HOUSING_TIERS.map((tier) => tier.prop);

// movedOut: living in their own place. tier: the housing tier id there
// (kept from the start, so it's ready when they move out).
export function createHousingState() {
  return { movedOut: false, tier: FIRST_TIER };
}

// Rebuilds the housing state from save data. Saves from before housing
// existed: adults have already moved out (into the first tier); children
// still live with their parents.
export function restoreHousingState(data, age) {
  const state = createHousingState();
  state.movedOut = typeof data?.movedOut === 'boolean' ? data.movedOut : age >= MOVE_OUT_AGE;
  if (tierById(data?.tier)) state.tier = data.tier;
  return state;
}

function tierById(id) {
  return HOUSING_TIERS.find((tier) => tier.id === id) ?? null;
}

function tierIndex(id) {
  return HOUSING_TIERS.findIndex((tier) => tier.id === id);
}

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

const dollars = (amount) => amount.toLocaleString('en-US');

export function currentTier(game) {
  return tierById(game.housing.tier) ?? HOUSING_TIERS[0];
}

// Whether a place requirement (`requires` in data/places.js) is met:
// 'parents', 'movedOut', or 'tier:<id>' (that tier or better).
export function meetsRequirement(game, requirement) {
  if (!requirement) return true;
  const { movedOut, tier } = game.housing;
  if (requirement === 'parents') return !movedOut;
  if (requirement === 'movedOut') return movedOut;
  if (requirement.startsWith('tier:')) {
    const needed = tierIndex(requirement.slice(5));
    return movedOut && needed >= 0 && tierIndex(tier) >= needed;
  }
  return false;
}

// Whether scenery piece `name` shows: a housing tier's prop only at that
// tier; everything else always.
export function showsPiece(game, name) {
  return !TIER_PROPS.includes(name) || currentTier(game).prop === name;
}

// Real minutes per health gain when resting where they live: the
// parents' sofa before moving out, otherwise the current tier's rate.
export function restMinutes(game) {
  return game.housing.movedOut ? currentTier(game).restMinutes : PARENTS_REST_MINUTES;
}

// The next tier to buy, or null at the top.
export function nextTier(game) {
  return HOUSING_TIERS[tierIndex(currentTier(game).id) + 1] ?? null;
}

// What the upgrade offer shows: { label, affordable, need (text, when
// short of money) }, or null with nothing left to buy (or before moving
// out).
export function upgradeView(game) {
  const next = nextTier(game);
  if (!game.housing.movedOut || !next) return null;
  const short = next.price - game.character.stats.money;
  return {
    label: fill(HOUSING_TEXT.upgrade, { tier: next.name, price: dollars(next.price) }),
    affordable: short <= 0,
    need: short > 0 ? fill(HOUSING_TEXT.need, { amount: dollars(short) }) : null,
  };
}

// Buys the next tier if they can afford it. Returns the celebration
// bubble ({ heading, text, deltas, celebrate }), or null.
export function buyUpgrade(game) {
  const next = nextTier(game);
  if (!game.housing.movedOut || !next || game.character.stats.money < next.price) return null;
  const deltas = changeStats(game.character, { money: -next.price });
  game.housing.tier = next.id;
  const { heading, text } = HOUSING_TEXT.bought;
  return { heading, text: fill(text, { name: game.character.name, tier: next.name }), deltas, celebrate: true };
}

// Sets the tier directly (dev menu). Returns whether it changed.
export function setTier(game, id) {
  if (!tierById(id) || game.housing.tier === id) return false;
  game.housing.tier = id;
  return true;
}

// Call regularly. Moves the character out once they reach MOVE_OUT_AGE
// (also when years are skipped past it). Returns the "Moving out!"
// bubble when it happens, or null. The caller settles where they are.
export function updateHousing(game) {
  if (game.housing.movedOut || ageOf(game.character, game.clock.years) < MOVE_OUT_AGE) return null;
  game.housing.movedOut = true;
  const { heading, text } = HOUSING_TEXT.movedOut;
  return { heading, text: fill(text, { name: game.character.name }), deltas: {}, celebrate: true };
}

// A short line for the dev read-out: "Parents (tent later)", "Tent".
export function housingText(game) {
  const tier = currentTier(game).name;
  return game.housing.movedOut ? tier : `Parents (${tier.toLowerCase()} later)`;
}
