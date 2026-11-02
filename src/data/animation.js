// animation.js — Speeds and timings for the character's visual motion.
// Walk speed and stride are in character pixels (CHARACTER_SCALE in
// data/layout.js), so they scale with the character's size; other
// distances are in scene pixels. Ranges are [min, max] in seconds; a
// random value is picked each time.

// Walking speed per life stage, in character pixels per second: a calm
// stroll.
export const WALK_SPEED = { baby: 2, child: 7, teen: 7, adult: 6, elder: 3 };

// How far each foot reaches forward or back at a contact pose. The walk
// cycle (contact, passing, contact with the other leg, passing) advances
// one frame per STRIDE pixels walked, so each step covers 2 x STRIDE: the
// exact gap between the feet at contact, which keeps the feet planted.
// At adult speed that's 3 frames, or 1.5 steps, per second.
export const STRIDE = { baby: 1, child: 2, teen: 2, adult: 2, elder: 1 };

// Pause after wandering to a random spot, and after reaching a prop.
export const IDLE_PAUSE = [1.5, 5];
export const VISIT_PAUSE = [3, 7];

// After turning to face the other way, a beat before walking off.
export const TURN_BEAT = [0.4, 0.8];

// Chance that the next walk heads to a prop instead of a random spot.
export const VISIT_CHANCE = 0.35;

// Shortest walk worth taking, in scene pixels.
export const MIN_WALK_DISTANCE = 8;

export const BLINK_INTERVAL = [2, 6];
export const BLINK_DURATION = 0.15;

// Idle breathing: the head dips for the last 40% of each cycle.
export const BREATH_CYCLE = 2;

// The "!" bubble bobs up 1px for the second half of each cycle.
export const BUBBLE_BOB_CYCLE = 1;

// How long the bubble saying what happened after an event stays up.
export const RESULT_BUBBLE_SECONDS = 4;

// Goal activities (`activity` in data/goals.js). When an idle pause ends,
// this is the chance the character does their goal's activity instead of
// wandering. Per activity: where it happens (a prop id from layout.js, or
// null for right where they are), how long it lasts [min, max] in seconds,
// and for jogging, the speed as a multiple of WALK_SPEED.
export const ACTIVITY_CHANCE = 0.3;
export const ACTIVITIES = {
  read: { place: 'tree', duration: [5, 9] },
  coins: { place: null, duration: [4, 7] },
  jog: { place: null, duration: [5, 8], speed: 2.5 },
  wave: { place: null, duration: [3, 5] },
};

// Little loops while doing an activity, in seconds: a page flips every
// pageFlip; a coin is counted every coin; the waving hand rocks every
// wave; a heart floats up every heart; a sweat drop falls every sweat.
export const ACTIVITY_LOOPS = { pageFlip: 1.6, coin: 0.9, wave: 0.3, heart: 1.4, sweat: 0.8 };

// How long a milestone celebration bubble stays up.
export const MILESTONE_BUBBLE_SECONDS = 5;

// Going to work: while the character has a job (and the "Work trips"
// setting is on), they now and then walk out the nearest open side of the
// window "to work". At most one trip every WORK_TRIP_EVERY_MINUTES real
// minutes (a random wait in that range, drawn again after each trip), and
// only when an idle pause ends. Never within WORK_QUIET_SECONDS of the
// player clicking on the game, nor while a menu, card, bubble, catch
// reveal or the activity bar is showing. They stay away WORK_AWAY
// seconds, then walk back in from the same side; they come back early if
// something needs them (an event, a bubble) or the place label is
// clicked. WORK_EXIT is how far past the window edge they walk before
// they count as gone, in scene pixels.
export const WORK_TRIP_EVERY_MINUTES = [5, 8];
export const WORK_QUIET_SECONDS = 60;
export const WORK_AWAY = [20, 40];
export const WORK_EXIT = 10;

// Work trip text: the bubble as they leave (shown for bubbleSeconds), the
// place label while they're away ({place} is the place's name), its
// tooltip (click to call them back; {name} is the character's), and the
// dev menu's setting row.
export const WORK_TRIP_TEXT = {
  leaving: 'Off to work!',
  bubbleSeconds: 2.5,
  atWork: '{place} - At work',
  callBack: 'Call {name} back from work',
  setting: 'Work trips',
  on: 'On',
  off: 'Off',
};
