// character.js — Character state: name, appearance, stats, personality
// traits, age, and life stage.

import { NAMES } from '../data/names.js';
import {
  SKIN_TONES, HAIR_COLORS, HAIR_STYLES, SHIRT_COLORS, MIN_HAIR_SKIN_DISTANCE,
} from '../data/appearance.js';
import { LIFE_STAGES } from '../data/lifeStages.js';
import { START_STATS } from '../data/stats.js';
import { TRAIT_PAIRS, TRAIT_COUNT } from '../data/traits.js';
import { MOOD_SMILE_AT, MOOD_FROWN_BELOW } from '../data/balance.js';

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Rolls TRAIT_COUNT traits, at most one from each opposite pair.
function rollTraits() {
  const [min, max] = TRAIT_COUNT;
  const count = min + Math.floor(Math.random() * (max - min + 1));
  return shuffled(TRAIT_PAIRS).slice(0, count).map(pick);
}

function toRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function toHex(rgb) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

// Returns `hair`, darkened in 10% steps if needed, so it differs from
// `skin` by at least MIN_HAIR_SKIN_DISTANCE and doesn't blend into the face.
function distinctHair(hair, skin) {
  const skinRgb = toRgb(skin);
  const hairRgb = toRgb(hair);
  for (let step = 0; step <= 10; step++) {
    const candidate = hairRgb.map((v) => v * (1 - step / 10));
    const distance = Math.hypot(...candidate.map((v, i) => v - skinRgb[i]));
    if (distance >= MIN_HAIR_SKIN_DISTANCE) return step === 0 ? hair : toHex(candidate);
  }
  return toHex([0, 0, 0]);
}

// Creates a newborn with a random name, look, and traits. bornAt is the clock time,
// in years, of their birth.
export function createCharacter(bornAt) {
  const skin = pick(SKIN_TONES);
  return {
    name: pick(NAMES),
    bornAt,
    stats: { ...START_STATS },
    traits: rollTraits(),
    appearance: {
      skin,
      hair: distinctHair(pick(HAIR_COLORS), skin),
      hairStyle: pick(HAIR_STYLES),
      shirt: pick(SHIRT_COLORS),
    },
  };
}

// Rebuilds a character from save data, or returns null if it's unusable.
export function restoreCharacter(data) {
  const look = data?.appearance;
  const isColor = (value) => typeof value === 'string' && value.startsWith('#');
  if (typeof data?.name !== 'string' || !Number.isFinite(data.bornAt) || !look) return null;
  if (![look.skin, look.hair, look.shirt].every(isColor)) return null;
  return {
    name: data.name,
    bornAt: data.bornAt,
    stats: restoreStats(data.stats, data.mood),
    traits: restoreTraits(data.traits),
    appearance: {
      skin: look.skin,
      // Also fixes lives saved before hair was kept distinct from skin.
      hair: distinctHair(look.hair, look.skin),
      // Fall back if a saved style has since been removed from the data.
      hairStyle: HAIR_STYLES.includes(look.hairStyle) ? look.hairStyle : HAIR_STYLES[0],
      shirt: look.shirt,
    },
  };
}

// Saved stats, with defaults for any that are missing. Saves from before
// stats existed carry their old placeholder `mood` over as happiness.
function restoreStats(saved, oldMood) {
  const stats = { ...START_STATS };
  if (Number.isFinite(oldMood)) stats.happiness = oldMood;
  for (const id of Object.keys(stats)) {
    if (Number.isFinite(saved?.[id])) stats[id] = saved[id];
    stats[id] = clampStat(id, stats[id]);
  }
  return stats;
}

// Saved traits that still exist, one per pair. Saves from before traits
// existed (or whose traits were all removed) roll new ones.
function restoreTraits(saved) {
  if (!Array.isArray(saved)) return rollTraits();
  const traits = TRAIT_PAIRS.map((pair) => pair.find((trait) => saved.includes(trait)))
    .filter(Boolean);
  return traits.length ? traits : rollTraits();
}

// Money is whole dollars, never negative; other stats are whole 0-100.
function clampStat(id, value) {
  const whole = Math.round(value);
  return id === 'money' ? Math.max(0, whole) : Math.min(100, Math.max(0, whole));
}

export function setStat(character, id, value) {
  character.stats[id] = clampStat(id, value);
}

// Adds `effects` ({ statId: amount }) to the stats and returns how much
// each one actually changed (after clamping), leaving out unchanged ones.
export function changeStats(character, effects) {
  const deltas = {};
  for (const [id, amount] of Object.entries(effects)) {
    if (!(id in character.stats)) continue;
    const before = character.stats[id];
    setStat(character, id, before + amount);
    if (character.stats[id] !== before) deltas[id] = character.stats[id] - before;
  }
  return deltas;
}

// Facial expression, which follows happiness: 'smile', 'neutral', or
// 'frown'.
export function expressionOf(character) {
  const { happiness } = character.stats;
  if (happiness >= MOOD_SMILE_AT) return 'smile';
  if (happiness < MOOD_FROWN_BELOW) return 'frown';
  return 'neutral';
}

// Age in whole years at clock time `years`.
export function ageOf(character, years) {
  return Math.max(0, Math.floor(years - character.bornAt));
}

// Life stage id ('baby', 'child', ...) for an age in whole years.
export function lifeStageOf(age) {
  let stage = LIFE_STAGES[0];
  for (const candidate of LIFE_STAGES) {
    if (age >= candidate.minAge) stage = candidate;
  }
  return stage.id;
}
