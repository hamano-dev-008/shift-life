// interaction.js — Unsaved poke state; all timestamps are real milliseconds.
import { POKE } from '../data/interaction.js';
import { changeStats } from './character.js';

export function createInteraction() {
  return { pokes: [], lastPoke: -Infinity, rewardedAt: -Infinity, annoyed: false,
    reactionAt: -Infinity, reaction: null };
}

export function calmInteraction(state, now) {
  if (now - state.lastPoke >= POKE.calmMs) {
    state.annoyed = false;
    state.pokes = [];
  }
}

export function pokeCharacter(character, state, now, random = Math.random) {
  calmInteraction(state, now);
  state.lastPoke = now;
  state.pokes = state.pokes.filter((time) => now - time <= POKE.burstMs);
  state.pokes.push(now);
  const wasAnnoyed = state.annoyed;
  state.annoyed ||= state.pokes.length >= POKE.burstCount;
  // Keep the rolling history bounded even during sustained spam.
  state.pokes = state.pokes.slice(-POKE.burstCount);
  state.reaction = state.annoyed ? 'frown' : 'smile';
  state.reactionAt = now;
  let amount = 0;
  if (state.annoyed && !wasAnnoyed) amount = POKE.annoyance;
  if (!state.annoyed && now - state.rewardedAt >= POKE.rewardMs) {
    amount = POKE.happiness;
    state.rewardedAt = now;
  }
  const deltas = changeStats(character, { happiness: amount });
  const lines = state.annoyed ? POKE.annoyed : POKE.playful;
  return { deltas, text: wasAnnoyed ? null : lines[Math.floor(random() * lines.length)],
    annoyed: state.annoyed };
}
