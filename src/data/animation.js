// animation.js — Speeds and timings for the character's visual motion.
// Distances are in scene pixels (see data/layout.js). Ranges are
// [min, max] in seconds; a random value is picked each time.

// Walking speed per life stage, in scene pixels per second.
export const WALK_SPEED = { baby: 3, child: 9, teen: 11, adult: 10, elder: 5 };

// Scene pixels walked per leg frame, so steps match the ground covered.
export const STRIDE_LENGTH = { baby: 1, child: 2, teen: 2.5, adult: 2.5, elder: 2 };

// Pause after wandering to a random spot, and after reaching a prop.
export const IDLE_PAUSE = [1.5, 5];
export const VISIT_PAUSE = [3, 7];

// Chance that the next walk heads to a prop instead of a random spot.
export const VISIT_CHANCE = 0.35;

// Shortest walk worth taking, in scene pixels.
export const MIN_WALK_DISTANCE = 8;

export const BLINK_INTERVAL = [2, 6];
export const BLINK_DURATION = 0.15;

// Idle breathing: the head dips for the last 40% of each cycle.
export const BREATH_CYCLE = 2;
