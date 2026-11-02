// lakeLife.js — The one bit of the Lake's wildlife that touches the life:
// clicking a frog or a butterfly gives a little happiness, at most once
// per real-time cooldown (shared by all of them), so it can't be farmed.
// The state isn't saved (like the character's pokes). Numbers live in
// data/lakeLife.js; the wildlife itself is ui/lakeLife.js.

import { WILDLIFE_CLICK } from '../data/lakeLife.js';
import { changeStats } from './character.js';

// rewardedAt: real ms of the last reward.
export function createWildlifeReward() {
  return { rewardedAt: -Infinity };
}

// A frog or butterfly was clicked at real ms `now`. Returns the stat
// changes ({} while cooling down, or at full happiness).
export function rewardWildlifeClick(character, state, now) {
  if (now - state.rewardedAt < WILDLIFE_CLICK.cooldownMs) return {};
  state.rewardedAt = now;
  return changeStats(character, { happiness: WILDLIFE_CLICK.happiness });
}
