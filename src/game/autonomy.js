// autonomy.js — The character's own plans (data/autonomy.js): left alone
// long enough, now and then they choose something to do themselves
// (fishing, busking, resting, or visiting another place), weighted by
// their goal and traits; they walk there, start it once in the right
// place (it only counts on arrival, as always), and stop by themselves
// after a while. Anything the player starts or stops calls the plan off.
//
// Two parts: when they may choose (`createChoosing()`: a real-time
// cooldown and the quiet spell after a click; unsaved, it starts afresh
// each launch, like work trips; times are real monotonic ms, tests pass
// their own), and the plan itself (game.autonomy.plan, saved, so a plan
// carries on after a reload; its time left counts on the life tick).

import {
  AUTONOMY_QUIET_MINUTES, AUTONOMY_EVERY_MINUTES, AUTONOMY_DURATION_MINUTES,
  AUTONOMY_CHOICES, AUTONOMY_GOALS, AUTONOMY_TRAITS, AUTONOMY_TEXT,
} from '../data/autonomy.js';
import { REST_SEATS } from '../data/home.js';
import { FORTUNE_TREE_PLACE } from '../data/fortuneTree.js';
import { ageOf } from './character.js';
import {
  treeUnlocked, isPlaying, startPlaying, stopPlaying, isPicking,
} from './fortuneTree.js';
import { isOrdering } from './cafe.js';
import { isOnShift } from './shifts.js';
import { isResting, startResting, stopResting } from './home.js';
import {
  activityById, currentActivity, isDoingActivity, hasItem, startActivity, stopActivity,
} from './activities.js';
import { existingPlaces, placeView, routeBetween } from './places.js';
import { hasArrived } from './stay.js';
import { FARM_PLACE } from '../data/farm.js';
import { WEATHER_EFFECTS, WEATHER_EFFECTS_TEXT } from '../data/weather.js';
import { weatherIn } from './weather.js';
import {
  canFarm, paddiesFor, currentFarmJob, startFarmJob, stopFarmJob,
} from './farm.js';

const MINUTE_MS = 60000;
const KINDS = ['fish', 'busk', 'rest', 'visit', 'plant', 'weed', 'harvest'];

function between([min, max], random) {
  return min + random() * (max - min);
}

// --- When they may choose (unsaved) ---------------------------------

// The first plan can come AUTONOMY_EVERY_MINUTES after `now`.
export function createChoosing(now, random = Math.random) {
  return { nextAt: now + between(AUTONOMY_EVERY_MINUTES, random) * MINUTE_MS, lastClickAt: -Infinity };
}

// The player clicked somewhere on the game.
export function noteClick(choosing, now) {
  choosing.lastClickAt = now;
}

// Whether they may choose something now. `enabled` is the "Let them
// choose" setting; `idle` whether nothing is going on (nothing running,
// no event waiting, no menu, not travelling or at work, nothing showing).
export function mayChoose(choosing, now, { enabled = true, idle = false } = {}) {
  if (!enabled || !idle || now < choosing.nextAt) return false;
  return now - choosing.lastClickAt >= AUTONOMY_QUIET_MINUTES * MINUTE_MS;
}

// A plan just ended or was called off (or one was just tried): the next
// one waits a fresh spell.
export function restartChoosing(choosing, now, random = Math.random) {
  choosing.nextAt = now + between(AUTONOMY_EVERY_MINUTES, random) * MINUTE_MS;
}

// --- The plan (saved) ------------------------------------------------

export function createAutonomyState() {
  return { plan: null };
}

// A saved plan, or none if it's missing or unreadable.
export function restoreAutonomyState(data) {
  const plan = data?.plan;
  if (!plan || !KINDS.includes(plan.kind) || typeof plan.place !== 'string'
    || !['going', 'doing'].includes(plan.stage) || !Number.isFinite(plan.leftMs)) {
    return createAutonomyState();
  }
  return { plan: { kind: plan.kind, place: plan.place, stage: plan.stage, leftMs: plan.leftMs } };
}

export function currentPlan(game) {
  return game.autonomy.plan;
}

// The nearest place with something to rest on (here first), or null.
function restPlace(game) {
  let best = null;
  for (const place of existingPlaces(game)) {
    if (!place.scenery.some((name) => name in REST_SEATS)) continue;
    const steps = place.id === game.place ? 0 : routeBetween(game, game.place, place.id)?.length;
    if (steps == null) continue;
    if (!best || steps < best.steps) best = { id: place.id, steps };
  }
  return best?.id ?? null;
}

// In a thunderstorm (WEATHER_EFFECTS.shelter): whether they'd go home out
// of it (a home in its tiers to go to), and what they won't choose.
export function seeksShelter(game) {
  const { kinds, tiers } = WEATHER_EFFECTS.shelter;
  return weatherIn(game, kinds) && game.housing.movedOut && tiers.includes(game.housing.tier);
}

function stormAvoids(game, kind) {
  const { kinds, avoid } = WEATHER_EFFECTS.shelter;
  return weatherIn(game, kinds) && avoid.includes(kind);
}

function reachable(game, place) {
  return place === game.place || Boolean(routeBetween(game, game.place, place));
}

// Where each choice they can make now would take them: { kind, place },
// for those that fit (old enough, the rod for fishing, low health for
// resting, a place to go to). In a thunderstorm never fishing or busking,
// and with a home to go to, resting whatever their health (seeksShelter()).
export function possibleChoices(game) {
  const age = ageOf(game.character, game.clock.years);
  const { health } = game.character.stats;
  const lazy = game.character.traits.includes('lazy');
  const shelter = seeksShelter(game);
  const out = [];
  for (const kind of KINDS) {
    const choice = AUTONOMY_CHOICES[kind];
    if (age < choice.minAge || stormAvoids(game, kind)) continue;
    let place = null;
    if (kind === 'fish') {
      const def = activityById(choice.activity);
      if (!def || age < def.minAge || (def.item && !hasItem(game, def.item.id))) continue;
      place = def.place;
    } else if (kind === 'busk') {
      if (!treeUnlocked(game)) continue;
      place = FORTUNE_TREE_PLACE;
    } else if (kind === 'rest') {
      if (!shelter && health >= (lazy ? choice.lazyHealthBelow : choice.healthBelow)) continue;
      place = restPlace(game);
    } else if (choice.farm) {
      if (!canFarm(game) || !paddiesFor(game, kind).length) continue;
      place = FARM_PLACE;
    } else {
      const others = existingPlaces(game).filter((p) => p.id !== game.place && reachable(game, p.id));
      if (others.length) place = others;
    }
    if (place && (Array.isArray(place) || reachable(game, place))) out.push({ kind, place });
  }
  return out;
}

// A choice's weight without the whim: its base weight times the active
// goal's and each trait's multiplier (and going home to rest out of a
// storm WEATHER_EFFECTS.shelter.restWeight times as likely).
export function choiceWeight(game, kind) {
  let weight = AUTONOMY_CHOICES[kind].weight;
  weight *= AUTONOMY_GOALS[game.goals.active]?.weights?.[kind] ?? 1;
  for (const trait of game.character.traits) weight *= AUTONOMY_TRAITS[trait]?.[kind] ?? 1;
  if (kind === 'rest' && seeksShelter(game)) weight *= WEATHER_EFFECTS.shelter.restWeight;
  return weight;
}

// Picks what to do: { kind, place, text } (the place for a visit picked
// among the others at random), or null when nothing fits.
export function choosePlan(game, random = Math.random) {
  const choices = possibleChoices(game);
  if (!choices.length) return null;
  const whim = AUTONOMY_GOALS[game.goals.active]?.whim ?? 0;
  const weights = choices.map(({ kind }) => choiceWeight(game, kind) * (1 + whim * random()));
  let roll = random() * weights.reduce((sum, w) => sum + w, 0);
  let picked = choices.at(-1);
  for (let i = 0; i < choices.length; i++) {
    roll -= weights[i];
    if (roll < 0) {
      picked = choices[i];
      break;
    }
  }
  const place = Array.isArray(picked.place)
    ? picked.place[Math.floor(random() * picked.place.length)].id
    : picked.place;
  const text = picked.kind === 'rest' && seeksShelter(game) ? WEATHER_EFFECTS_TEXT.shelter : AUTONOMY_TEXT.going[picked.kind];
  return { kind: picked.kind, place, text };
}

// Takes on `plan` (from choosePlan()): how long they'll keep at it is
// picked now; it counts once they've arrived. The renderer walks them
// there when it's elsewhere.
export function startPlan(game, plan, random = Math.random) {
  game.autonomy.plan = {
    kind: plan.kind,
    place: plan.place,
    stage: 'going',
    leftMs: Math.round(between(AUTONOMY_DURATION_MINUTES, random) * MINUTE_MS),
  };
}

// Calls the plan off (the player started or stopped something, or went
// somewhere), leaving whatever is running as it is. Returns whether there
// was one.
export function cancelPlan(game) {
  const had = Boolean(game.autonomy.plan);
  game.autonomy.plan = null;
  return had;
}

// Ends the plan now, stopping its thing if it's under way (the "Let them
// choose" setting turned off). Returns its bubble, or null.
export function endPlanNow(game) {
  const { plan } = game.autonomy;
  if (!plan) return null;
  game.autonomy.plan = null;
  return plan.stage === 'doing' && planRunning(game, plan) ? stopPlanned(game, plan) : null;
}

// Whether the plan's own thing is running.
function planRunning(game, plan) {
  if (plan.kind === 'fish') return currentActivity(game)?.id === AUTONOMY_CHOICES.fish.activity;
  if (plan.kind === 'busk') return isPlaying(game);
  if (AUTONOMY_CHOICES[plan.kind].farm) return currentFarmJob(game)?.action === plan.kind;
  return isResting(game);
}

// Starts the plan's thing here. Returns whether it started.
function startPlanned(game, plan) {
  if (isDoingActivity(game) || isPlaying(game) || isResting(game) || currentFarmJob(game)
    || isPicking(game) || isOrdering(game) || isOnShift(game)) return false;
  if (plan.kind === 'fish') return startActivity(game, AUTONOMY_CHOICES.fish.activity);
  if (AUTONOMY_CHOICES[plan.kind].farm) {
    const [paddy] = paddiesFor(game, plan.kind);
    return Boolean(paddy) && startFarmJob(game, paddy, plan.kind);
  }
  if (plan.kind === 'busk') return game.place === FORTUNE_TREE_PLACE && startPlaying(game);
  return placeView(game, game.place).scenery.some((name) => name in REST_SEATS) && startResting(game);
}

// Stops the plan's thing by themselves. Returns its bubble (the sale for
// fishing; a short line otherwise), or null.
function stopPlanned(game, plan) {
  if (plan.kind === 'fish') return stopActivity(game);
  if (AUTONOMY_CHOICES[plan.kind].farm) {
    stopFarmJob(game);
    return null;
  }
  const stopped = plan.kind === 'busk' ? stopPlaying(game) : stopResting(game);
  const text = AUTONOMY_TEXT.done[plan.kind];
  return stopped && text ? { text, deltas: {}, celebrate: false } : null;
}

// Call on the life tick with the real ms passed (capped by the caller).
// `travelling`: a trip is under way. Once they're in the plan's place
// (and not travelling) it starts the thing there (a visit is then done);
// while it runs, once they've arrived at the spot, its time counts down,
// and at the end they stop by themselves. If the thing stopped or never
// started (the player stopped it, the life ended), or they ended up
// somewhere else, the plan is dropped. Returns { changed, ended, news }:
// `ended` when the plan is over (the caller restarts the cooldown),
// `news` a bubble to show or null.
export function updateAutonomy(game, realMs, { travelling = false } = {}) {
  const { plan } = game.autonomy;
  const result = { changed: false, ended: false, news: null };
  if (!plan) return result;
  const drop = () => {
    game.autonomy.plan = null;
    return { changed: true, ended: true, news: null };
  };
  if (game.endOfLife.ended) return drop();
  if (plan.stage === 'going') {
    if (travelling) return result;
    if (game.place !== plan.place) return drop();
    if (plan.kind === 'visit') return drop();
    if (!startPlanned(game, plan)) return drop();
    plan.stage = 'doing';
    return { ...result, changed: true };
  }
  if (!planRunning(game, plan)) return drop();
  // A farm job is over when it's done (game/farm.js), not by time.
  if (AUTONOMY_CHOICES[plan.kind].farm) return result;
  if (!hasArrived(game)) return result;
  plan.leftMs -= realMs;
  if (plan.leftMs > 0) return result;
  const news = stopPlanned(game, plan);
  game.autonomy.plan = null;
  return { changed: true, ended: true, news };
}

// A line for the dev read-out.
export function autonomyText(game, choosing, now) {
  const { plan } = game.autonomy;
  if (plan) {
    const left = plan.stage === 'doing' ? `, ${Math.ceil(plan.leftMs / MINUTE_MS)} min left` : '';
    return `Own plan: ${plan.kind} at ${plan.place} (${plan.stage}${left})`;
  }
  if (!choosing) return 'Own plan: none';
  const wait = Math.max(0, Math.ceil((choosing.nextAt - now) / MINUTE_MS));
  return `Own plan: none, next in ${wait} min`;
}
