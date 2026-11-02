// farm.js — Rice farming at the Farm (data/farm.js): which paddies are
// owned (buying more), the rice in each (planting, real-time growth
// through seedlings, young and ripe, weeds that may come up once, the
// harvest's pay), and the short jobs at a paddy (plant, pull weeds,
// harvest) that only happen once the character has walked to the path in
// front of it (game/stay.js). Saved as game.farm: { paddies: { <id>: {
// owned, crop } }, job, harvested, earned }; a crop is { ms (real ms
// grown), weedsAt (ms when weeds come up, or null), weeds (up now),
// weeded }, a job { paddy, action, ms (real ms worked there) }.

import {
  FARM_PLACE, FARM_MIN_AGE, PADDIES, RICE, FARM_JOBS, FARM_TEXT,
} from '../data/farm.js';
import { ageOf, changeStats } from './character.js';
import { hasArrived } from './stay.js';

const HOUR_MS = 3600000;
export const GROW_MS = RICE.growHours * HOUR_MS;
const ACTIONS = Object.keys(FARM_JOBS);

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

export function paddyById(id) {
  return PADDIES.find((paddy) => paddy.id === id) ?? null;
}

// Every paddy as water; the free ones owned.
export function createFarmState() {
  const paddies = {};
  for (const paddy of PADDIES) paddies[paddy.id] = { owned: paddy.price === 0, crop: null };
  return { paddies, job: null, harvested: 0, earned: 0 };
}

function restoreCrop(crop) {
  if (!crop || !Number.isFinite(crop.ms)) return null;
  return {
    ms: Math.min(Math.max(0, crop.ms), GROW_MS),
    weedsAt: Number.isFinite(crop.weedsAt) ? crop.weedsAt : null,
    weeds: Boolean(crop.weeds),
    weeded: Boolean(crop.weeded),
  };
}

// The saved farm, with anything missing or unreadable as new.
export function restoreFarmState(data) {
  const farm = createFarmState();
  if (!data || typeof data !== 'object') return farm;
  for (const paddy of PADDIES) {
    const saved = data.paddies?.[paddy.id];
    if (!saved) continue;
    farm.paddies[paddy.id] = { owned: paddy.price === 0 || Boolean(saved.owned), crop: restoreCrop(saved.crop) };
  }
  const job = data.job;
  if (job && paddyById(job.paddy) && ACTIONS.includes(job.action)) {
    farm.job = { paddy: job.paddy, action: job.action, ms: Number.isFinite(job.ms) ? job.ms : 0 };
  }
  farm.harvested = Number.isFinite(data.harvested) ? data.harvested : 0;
  farm.earned = Number.isFinite(data.earned) ? data.earned : 0;
  return farm;
}

// 'empty', 'seedling', 'young' or 'ripe'.
export function stageOf(crop) {
  if (!crop) return 'empty';
  if (crop.ms >= GROW_MS) return 'ripe';
  return crop.ms >= RICE.young * GROW_MS ? 'young' : 'seedling';
}

export function canFarm(game) {
  return ageOf(game.character, game.clock.years) >= FARM_MIN_AGE;
}

export function currentFarmJob(game) {
  return game.farm.job;
}

// What the harvest of `crop` sells for.
export function harvestPay(crop) {
  return Math.round(RICE.pay * (1 + (crop?.weeded ? RICE.weedBonus : 0)));
}

// Whether `action` can be done at paddy `id` now (leaving out where the
// character is): planting an owned, empty paddy with the money for seed,
// pulling weeds that are up, harvesting a ripe one. Old enough either way.
export function canDo(game, id, action) {
  const state = game.farm.paddies[id];
  if (!state?.owned || !canFarm(game)) return false;
  const stage = stageOf(state.crop);
  if (action === 'plant') return stage === 'empty' && game.character.stats.money >= RICE.seedCost;
  if (action === 'weed') return Boolean(state.crop?.weeds);
  if (action === 'harvest') return stage === 'ripe';
  return false;
}

// The paddies where `action` can be done now (for the character's own
// plans).
export function paddiesFor(game, action) {
  return PADDIES.filter((paddy) => canDo(game, paddy.id, action)).map((paddy) => paddy.id);
}

// Buys paddy `id`. Returns its bubble, or null (owned already, too dear,
// or too young to farm).
export function buyPaddy(game, id) {
  const paddy = paddyById(id);
  const state = game.farm.paddies[id];
  if (!paddy || !state || state.owned || !canFarm(game)) return null;
  if (game.character.stats.money < paddy.price) return null;
  const deltas = changeStats(game.character, { money: -paddy.price });
  state.owned = true;
  const { heading, text } = FARM_TEXT.bought;
  return { heading, text: fill(text, { name: game.character.name }), deltas, celebrate: true };
}

// Starts `action` at paddy `id`: the character walks to the path in front
// of it and does it there. Only at the Farm. Replaces a job under way.
// Returns whether it started.
export function startFarmJob(game, id, action) {
  if (game.place !== FARM_PLACE || !canDo(game, id, action)) return false;
  game.farm.job = { paddy: id, action, ms: 0 };
  return true;
}

// Stops the job under way (nothing is done). Returns whether there was one.
export function stopFarmJob(game) {
  if (!game.farm?.job) return false;
  game.farm.job = null;
  return true;
}

// A new crop: weeds may come up once, at a random point of the growth.
function newCrop(random) {
  const [from, to] = RICE.weedsAt;
  const weedsAt = random() < RICE.weedChance ? Math.round((from + random() * (to - from)) * GROW_MS) : null;
  return { ms: 0, weedsAt, weeds: false, weeded: false };
}

// Does the job: returns its bubble.
function finishJob(game, job, random) {
  const state = game.farm.paddies[job.paddy];
  if (job.action === 'plant') {
    state.crop = newCrop(random);
    return { ...FARM_TEXT.planted, deltas: changeStats(game.character, { money: -RICE.seedCost }), celebrate: false };
  }
  if (job.action === 'weed') {
    state.crop.weeds = false;
    state.crop.weeded = true;
    return { ...FARM_TEXT.pulled, deltas: {}, celebrate: false };
  }
  const pay = harvestPay(state.crop);
  state.crop = null;
  game.farm.harvested += 1;
  game.farm.earned += pay;
  const { heading, text } = FARM_TEXT.harvested;
  return { heading, text: fill(text, { pay }), deltas: changeStats(game.character, { money: pay }), celebrate: false };
}

// Grows `crop` by `ms`; weeds come up when it passes weedsAt.
function grow(crop, ms) {
  if (crop.ms >= GROW_MS) return;
  crop.ms = Math.min(GROW_MS, crop.ms + ms);
  if (crop.weedsAt != null && crop.ms >= crop.weedsAt && !crop.weeded) {
    crop.weeds = true;
    crop.weedsAt = null;
  }
}

// Call on the life tick with the real ms passed (capped by the caller, so
// a sleeping PC doesn't count; nothing passes while the app is closed).
// Grows every paddy's rice, wherever the character is, and works on the
// job once they've arrived at its paddy: when its time is up it's done.
// A job that can't be done any more is dropped. Returns bubbles to show.
export function updateFarm(game, realMs, random = Math.random) {
  for (const state of Object.values(game.farm.paddies)) {
    if (state.crop) grow(state.crop, realMs);
  }
  const { job } = game.farm;
  if (!job) return [];
  if (!canDo(game, job.paddy, job.action) || game.place !== FARM_PLACE) {
    game.farm.job = null;
    return [];
  }
  if (!hasArrived(game)) return [];
  job.ms += realMs;
  if (job.ms < FARM_JOBS[job.action].seconds * 1000) return [];
  game.farm.job = null;
  return [finishJob(game, job, random)];
}

// "1:23" or "2h 05m" from ms.
function timeLeft(ms) {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

// What paddy `id`'s menu shows: { title, options: [{ action, label,
// enabled }], status: [lines] }, or null for an unknown paddy.
export function paddyView(game, id) {
  const index = PADDIES.findIndex((paddy) => paddy.id === id);
  if (index < 0) return null;
  const paddy = PADDIES[index];
  const state = game.farm.paddies[id];
  const title = FARM_TEXT.paddyNames[index];
  const { money } = game.character.stats;
  if (!canFarm(game)) return { title, options: [], status: [fill(FARM_TEXT.tooYoung, { age: FARM_MIN_AGE })] };
  if (!state.owned) {
    const status = [FARM_TEXT.forSale];
    if (money < paddy.price) status.push(fill(FARM_TEXT.need, { need: paddy.price - money }));
    return {
      title,
      options: [{ action: 'buy', label: fill(FARM_TEXT.buy, { price: paddy.price }), enabled: money >= paddy.price }],
      status,
    };
  }
  const stage = stageOf(state.crop);
  const options = [];
  const status = [];
  const working = game.farm.job?.paddy === id;
  if (stage === 'empty') {
    options.push({ action: 'plant', label: fill(FARM_TEXT.plant, { cost: RICE.seedCost }), enabled: canDo(game, id, 'plant') });
    status.push(FARM_TEXT.empty);
    if (money < RICE.seedCost) status.push(fill(FARM_TEXT.need, { need: RICE.seedCost - money }));
  } else if (stage === 'ripe') {
    options.push({ action: 'harvest', label: fill(FARM_TEXT.harvest, { pay: harvestPay(state.crop) }), enabled: true });
    status.push(FARM_TEXT.ready);
  } else {
    status.push(fill(FARM_TEXT.growing, { stage: FARM_TEXT.stages[stage], time: timeLeft(GROW_MS - state.crop.ms) }));
  }
  if (state.crop?.weeds) {
    options.unshift({ action: 'weed', label: FARM_TEXT.pullWeeds, enabled: true });
    status.push(FARM_TEXT.weeds);
  } else if (state.crop?.weeded) {
    status.push(FARM_TEXT.weeded);
  }
  if (working) status.push(FARM_TEXT.working);
  return { title, options, status };
}

// The paddies as drawn: [{ id, stage, weeds }] (ui/farm.js).
export function paddiesLook(game) {
  return PADDIES.map((paddy) => {
    const state = game.farm.paddies[paddy.id];
    return { id: paddy.id, stage: stageOf(state.crop), weeds: Boolean(state.crop?.weeds), owned: state.owned };
  });
}

// Dev menu: every owned paddy one stage on (water is planted for free,
// seedlings turn young, young turn ripe). Returns how many changed.
export function growAllNextStage(game, random = Math.random) {
  let changed = 0;
  for (const state of Object.values(game.farm.paddies)) {
    if (!state.owned) continue;
    const stage = stageOf(state.crop);
    if (stage === 'empty') {
      state.crop = newCrop(random);
    } else if (stage === 'seedling') {
      grow(state.crop, Math.ceil(RICE.young * GROW_MS) - state.crop.ms);
    } else if (stage === 'young') {
      grow(state.crop, GROW_MS - state.crop.ms);
    } else {
      continue;
    }
    changed += 1;
  }
  return changed;
}

// Dev menu: owns every paddy. Returns whether any was new.
export function giveAllPaddies(game) {
  let changed = false;
  for (const state of Object.values(game.farm.paddies)) {
    if (!state.owned) changed = true;
    state.owned = true;
  }
  return changed;
}

// A line for the dev read-out.
export function farmText(game) {
  const parts = PADDIES.map((paddy, i) => {
    const state = game.farm.paddies[paddy.id];
    if (!state.owned) return `${i + 1}:-`;
    const stage = stageOf(state.crop);
    return `${i + 1}:${stage}${state.crop?.weeds ? '+w' : ''}`;
  });
  const job = game.farm.job ? ` · ${game.farm.job.action} ${game.farm.job.paddy.slice(-1)}` : '';
  return `Farm: ${parts.join(' ')}${job} · ${game.farm.harvested} harvests`;
}
