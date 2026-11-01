// character.js — Character state: name, appearance, mood, age, and life
// stage.

import { NAMES } from '../data/names.js';
import { SKIN_TONES, HAIR_COLORS, HAIR_STYLES, SHIRT_COLORS } from '../data/appearance.js';
import { LIFE_STAGES } from '../data/lifeStages.js';
import { DEFAULT_MOOD, MOOD_SMILE_AT, MOOD_FROWN_BELOW } from '../data/balance.js';

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Creates a newborn with a random name and look. bornAt is the clock time,
// in years, of their birth.
export function createCharacter(bornAt) {
  return {
    name: pick(NAMES),
    bornAt,
    mood: DEFAULT_MOOD,
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
    // Saves from before mood existed get the default.
    mood: Number.isFinite(data.mood) ? clampMood(data.mood) : DEFAULT_MOOD,
    appearance: {
      skin: look.skin,
      hair: look.hair,
      // Fall back if a saved style has since been removed from the data.
      hairStyle: HAIR_STYLES.includes(look.hairStyle) ? look.hairStyle : HAIR_STYLES[0],
      shirt: look.shirt,
    },
  };
}

function clampMood(mood) {
  return Math.min(100, Math.max(0, mood));
}

export function setMood(character, mood) {
  character.mood = clampMood(mood);
}

// Facial expression for the current mood: 'smile', 'neutral', or 'frown'.
export function expressionOf(character) {
  if (character.mood >= MOOD_SMILE_AT) return 'smile';
  if (character.mood < MOOD_FROWN_BELOW) return 'frown';
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
