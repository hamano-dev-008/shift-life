// character.js — Character state: name, appearance, age, and life stage.

import { NAMES } from '../data/names.js';
import { SKIN_TONES, HAIR_COLORS, HAIR_STYLES, SHIRT_COLORS } from '../data/appearance.js';
import { LIFE_STAGES } from '../data/lifeStages.js';

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Creates a newborn with a random name and look. bornAt is the clock time,
// in years, of their birth.
export function createCharacter(bornAt) {
  return {
    name: pick(NAMES),
    bornAt,
    appearance: {
      skin: pick(SKIN_TONES),
      hair: pick(HAIR_COLORS),
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
    appearance: {
      skin: look.skin,
      hair: look.hair,
      // Fall back if a saved style has since been removed from the data.
      hairStyle: HAIR_STYLES.includes(look.hairStyle) ? look.hairStyle : HAIR_STYLES[0],
      shirt: look.shirt,
    },
  };
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
