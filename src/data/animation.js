// animation.js — Speeds and timings for the character's visual motion.
// Ranges are [min, max] in seconds; a random value is picked each time.

// Walking speed per life stage, in canvas pixels per second.
export const WALK_SPEED = { baby: 6, child: 18, teen: 22, adult: 20, elder: 10 };

// Canvas pixels walked per leg frame, so steps match the ground covered.
export const STRIDE_LENGTH = { baby: 2, child: 4, teen: 5, adult: 5, elder: 4 };

// Pause after wandering to a random spot, and after reaching a prop.
export const IDLE_PAUSE = [1.5, 5];
export const VISIT_PAUSE = [3, 7];

// Chance that the next walk heads to a prop instead of a random spot.
export const VISIT_CHANCE = 0.35;

// Shortest walk worth taking, in canvas pixels.
export const MIN_WALK_DISTANCE = 16;

export const BLINK_INTERVAL = [2, 6];
export const BLINK_DURATION = 0.15;

// Idle breathing: the head dips for the last 40% of each cycle.
export const BREATH_CYCLE = 2;
