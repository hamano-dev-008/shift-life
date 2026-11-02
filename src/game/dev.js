// dev.js — Developer actions behind the dev settings menu and shortcuts:
// start a new life, change the clock speed, skip ahead, force an event,
// add money, finish a busking session, grow a golden apple, rest a
// minute, switch place, set the housing tier or jump to moving-out age
// now, end the life now, set health, give a fishing rod, a bite now, a
// catch of a chosen rarity now, preview a rarity's reveal card, and a
// read-out of the character (with the Farm's paddies; growing and giving
// them are in game/farm.js). The menu (ui/devMenu.js) only calls these.

import { SPEEDS } from '../data/balance.js';
import { STAT_TAGS } from '../data/stats.js';
import { TRAIT_LABELS } from '../data/traits.js';
import { DEATH, END_TEXT } from '../data/endOfLife.js';
import { FISHING_TEXT } from '../data/fishing.js';
import { changeStats, setStat, ageOf } from './character.js';
import { startEvent } from './events.js';
import { goalById } from './goals.js';
import { careerView } from './jobs.js';
import { finishSession, makeAppleReady, treeView } from './fortuneTree.js';
import { MOVE_OUT_AGE } from '../data/housing.js';
import { restOneMinute, isResting } from './home.js';
import { currentPlace, enterPlace, leavePlace, settlePlace } from './places.js';
import { setTier, housingText } from './housing.js';
import {
  startNewLife, endLife, canDie, isEnded, endOfLifeText,
} from './endOfLife.js';
import { giveItem, hasItem, activityById } from './activities.js';
import {
  biteNow, catchNow, fishingLook, bucketTotals, previewCatch,
} from './fishing.js';
import { farmText } from './farm.js';

// Replaces the life with a newborn, in place (see startNewLife()), without
// adding the old one to the Book. Save right after to wipe the old life
// from the save file.
export function newLife(game) {
  startNewLife(game);
}

// Ends the life now, as if it had come to its natural end. Returns the
// ended record, or a note on why not ({ note }): too young, or already
// ended.
export function endLifeNow(game) {
  if (isEnded(game)) return { note: END_TEXT.alreadyEnded };
  if (!canDie(game)) return { note: END_TEXT.tooYoung.replaceAll('{age}', DEATH.minAge) };
  return { ended: endLife(game, 'dev') };
}

// Sets health directly. At 0 an adult's life ends on the next tick.
export function setHealth(game, value) {
  setStat(game.character, 'health', value);
}

export function setSpeed(game, speed) {
  if (SPEEDS[speed]) game.clock.speed = speed;
}

// Ctrl+Shift+F: fast if at normal speed, otherwise back to normal.
export function toggleFastForward(game) {
  setSpeed(game, game.clock.speed === 'normal' ? 'fast' : 'normal');
}

// Moves the clock ahead `years` at once. The character ages, the goal's
// yearly boosts and paydays catch up (with promotions and retirement),
// and the next event (if due) comes right away; events aren't replayed
// for every skipped year.
export function skipYears(game, years) {
  if (!game.clock.stopped) game.clock.years += years;
}

// Replaces any waiting event with a new random one that fits the current
// age. Returns whether one started (babies have none).
export function triggerEvent(game) {
  const previous = game.events.pending;
  game.events.pending = null;
  if (startEvent(game)) return true;
  game.events.pending = previous;
  return false;
}

export function addMoney(game, amount) {
  changeStats(game.character, { money: amount });
}

// Finishes the busking session being played right now, paying for it.
// Returns the payday bubble, or null if not playing.
export function finishBuskingSession(game) {
  return finishSession(game);
}

// Grows a golden apple on the Fortune Tree right away.
export function appleNow(game) {
  makeAppleReady(game);
}

// Rests one more real minute at once (any health it earns is gained).
// Returns whether they were resting.
export function finishRest(game) {
  return restOneMinute(game);
}

// Sets the housing tier directly, ending a rest (the bed may be gone) and
// leaving Home if the house is. Applies once moved out.
export function setHousingTier(game, id) {
  if (!setTier(game, id)) return false;
  leavePlace(game);
  settlePlace(game);
  return true;
}

// Moves the clock ahead to the moment the character turns MOVE_OUT_AGE
// (moving out follows on the next tick). Returns false if they're
// already that old.
export function jumpToMoveOut(game) {
  const target = game.character.bornAt + MOVE_OUT_AGE;
  if (game.clock.years >= target || game.clock.stopped) return false;
  game.clock.years = target;
  return true;
}

// Gives the fishing rod for free. Returns whether it was new.
export function giveFishingRod(game) {
  return giveItem(game, 'fishing');
}

// A fish bites right now. Returns { note } when not fishing, else
// { bit } (false if a fish is already on the line).
export function fishBiteNow(game) {
  const fishing = game.activities.current?.fishing;
  if (!fishing) return { note: FISHING_TEXT.notFishing };
  return { bit: biteNow(fishing) };
}

// Lands a fish of rarity `rarity` right now. Returns { note } when not
// fishing, else { news } (its bubble).
export function catchRarityNow(game, rarity) {
  const fishing = game.activities.current?.fishing;
  if (!fishing) return { note: FISHING_TEXT.notFishing };
  return { news: catchNow(game, fishing, rarity) };
}

// A made-up catch of rarity `rarity` to preview its reveal card, with
// or without fishing (nothing changes).
export function revealPreview(game, rarity) {
  return previewCatch(game, rarity);
}

// Switches to place `id` at once, without walking (ending busking or
// resting).
export function goToPlace(game, id) {
  leavePlace(game);
  enterPlace(game, id);
}

// A compact summary for the menu: "HP 80  JOY 70  IQ 35  $120",
// "Bold · Shy", "Scholar, 3y (age 12)", "Developer 2/3, $170/yr",
// "Tree: busking 2:10, 3 sess, apple 85m", "Place: My Yard, resting ·
// Tent", "Life: -2 HP/yr from 50, next bday 4%", "Fish: rod, wait 0:42/1:30,
// bucket 3 ($12), 5 caught".
export function devReadout(game) {
  const { character, goals, clock } = game;
  const stats = Object.entries(character.stats).map(([id, value]) =>
    (id === 'money' ? `${STAT_TAGS.money}${value}` : `${STAT_TAGS[id]} ${value}`));
  const goalYears = Math.floor(clock.years - goals.since);
  return {
    stats: stats.join('  '),
    traits: character.traits.map((trait) => TRAIT_LABELS[trait]).join(' · '),
    goal: `${goalById(goals.active).label}, ${goalYears}y (age ${ageOf(character, clock.years)})`,
    job: jobText(careerView(game)),
    tree: treeText(treeView(game)),
    place: `Place: ${currentPlace(game).name}${isResting(game) ? ', resting' : ''} · ${housingText(game)}`,
    life: endOfLifeText(game),
    fishing: fishingText(game),
    farm: farmText(game),
  };
}

function minutesSeconds(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function fishingText(game) {
  const rod = hasItem(game, activityById('fishing').item.id) ? 'rod' : 'no rod';
  const { caught } = game.activities.totals.fishing;
  const fishing = game.activities.current?.fishing;
  if (!fishing) return `Fish: ${rod}, ${caught} caught`;
  const { total } = bucketTotals(fishing);
  const phase = fishing.phase === 'waiting'
    ? `wait ${minutesSeconds(fishing.phaseMs)}/${minutesSeconds(fishing.waitMs)}`
    : fishingLook(fishing).phase;
  return `Fish: ${phase}, bucket ${fishing.bucket.length} ($${total}), ${caught} caught`;
}

function treeText(view) {
  const seconds = Math.floor(view.sessionMs / 1000);
  const playing = view.playing ? `busking ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'idle';
  const apple = view.appleReady ? 'apple!' : `apple ${Math.ceil(view.appleInMs / 60000)}m`;
  return `Tree: ${playing}, ${view.sessions} sess, ${apple}`;
}

function jobText(career) {
  if (!career) return 'Too young to work';
  if (career.status === 'retired') return `Retired, $${career.pay}/yr`;
  if (career.status === 'looking') return 'Looking for work';
  return `${career.title} ${career.level}/${career.levels}, $${career.pay}/yr`;
}
