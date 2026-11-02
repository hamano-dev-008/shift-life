// lakeLife.js — The Lake's ambient wildlife, as data: frogs on the lily
// pads (blinking, croaking, hopping, plopping into the water, diving when
// the bobber lands near) and butterflies over the shore and reeds
// (drifting in, fluttering in loops, resting on reeds, leaving), their
// colors and timing, and clicking them (a small happiness reward on a
// real-time cooldown). Pure data: ui/lakeLife.js runs them,
// ui/lakeLifeArt.js draws them, game/lakeLife.js gives the reward.
//
// Positions are in lake.png's pixels like data/lake.js: x from the
// picture's left edge, rows from its top (fractions are fine while
// moving). Times are real seconds. Everything is drawn at SCENE_SCALE.

// The lily pads in the picture: columns left..right (inclusive) and the
// row a frog sits on (its bottom edge on the top of that row, so the pad
// shows under it).
export const LILY_PADS = [
  { left: 3, right: 5, row: 70 },
  { left: 72, right: 77, row: 75 },
];

// Frogs:
//   count       How many live at the Lake ([min, max], picked each visit).
//   blinkEvery  Seconds between blinks ([min, max]); blinkFor how long.
//   croakEvery  Seconds between croaks ([min, max]); each croak is three
//               throat frames (puff, big puff, puff) of croakFrame.
//   moveEvery   Seconds between moves ([min, max]): a hop to the other
//               free pad (hopShare of the time, if one is free) or a plop
//               into the water.
//   hop         The jump between pads: seconds, and how many pixels the
//               arc rises above the higher pad. inPlaceHop: a little hop
//               on the spot (clicked with no free pad).
//   underwater  Seconds under water after a plop or a dive ([min, max])
//               before coming up on a free pad.
//   scare       How close (pixels, from the frog's middle) the bobber has
//               to land to make a frog dive.
//   ripple      The ring spreading on the water: seconds, widest radius
//               (pixels) and how flat it is (rows per column).
//   splash      Seconds the drops fly when diving.
//   colors      body, dark (legs), eye, throat (the croak's puff).
export const FROGS = {
  count: [1, 2],
  blinkEvery: [2.5, 6],
  blinkFor: 0.15,
  croakEvery: [9, 22],
  croakFrame: 0.2,
  moveEvery: [25, 55],
  hopShare: 0.6,
  hop: { seconds: 1.6, height: 10 },
  inPlaceHop: { seconds: 0.5, height: 3 },
  underwater: [12, 30],
  scare: 9,
  ripple: { seconds: 1.4, radius: 5, flat: 0.4 },
  splash: 0.5,
  colors: { body: '#5f9e3a', dark: '#3f6e27', eye: '#e9e27a', throat: '#e3ecb4' },
};

// Butterflies:
//   max         Most at once.
//   start       How many are already there when the Lake is shown
//               ([min, max]).
//   spawnEvery  Seconds between newcomers while there's room ([min, max]).
//   area        Where they wander: columns left..right, rows top..bottom.
//   enterRows   Rows they drift in at, from either side ([min, max]).
//   speed       Pixels a second while wandering; flee when clicked.
//   turn        How fast they turn toward where they're going (radians a
//               second): low makes soft loops.
//   bob         The flutter up and down: rows and seconds per cycle.
//   flap        Seconds per wing frame while flying; restFlap while
//               resting on a reed (slowly opening and closing).
//   stay        Seconds they wander before leaving ([min, max]).
//   landChance  Chance, each time they pick somewhere new, of heading for
//               a free reed; landFor seconds there ([min, max]), then they
//               fly on (or leave, leaveAfterLanding of the time).
//   reeds       Reed tops they rest on (x, and the row their feet touch).
//   colors      Wing colors and how likely each is (weight; blue is the
//               rare one). id: also the per-color sprite's suffix.
//   body        The body's color.
export const BUTTERFLIES = {
  max: 3,
  start: [0, 2],
  spawnEvery: [15, 45],
  area: { left: 70, right: 106, top: 45, bottom: 75 },
  enterRows: [46, 62],
  speed: 5,
  flee: 22,
  turn: 1.4,
  bob: { rows: 1.5, cycle: 1.1 },
  flap: 0.16,
  restFlap: 1.2,
  stay: [25, 60],
  landChance: 0.35,
  landFor: [3, 7],
  leaveAfterLanding: 0.3,
  reeds: [
    { x: 82, row: 63 },
    { x: 88, row: 65 },
    { x: 95, row: 61 },
    { x: 103, row: 56 },
  ],
  colors: [
    { id: 'white', wing: '#f6f2e6', weight: 32 },
    { id: 'yellow', wing: '#f4d64e', weight: 32 },
    { id: 'orange', wing: '#f0913c', weight: 31 },
    { id: 'blue', wing: '#5aa6ee', weight: 5 },
  ],
  body: '#3d3a4b',
};

// Clicking wildlife: a frog says "ribbit!" and hops, a butterfly flutters
// away quickly. Either gives `happiness`, at most once every cooldownMs
// of real time (like the character's pokes), shared by all of them.
// hitPadding: pixels added around each one's click area so they're easy
// to hit. bubbleSeconds: how long the ribbit stays up.
export const WILDLIFE_CLICK = {
  cooldownMs: 30000,
  happiness: 1,
  hitPadding: 3,
  bubbleSeconds: 1.2,
  ribbit: 'ribbit!',
  frogLabel: 'Frog',
  butterflyLabel: 'Butterfly',
};

// Dev menu notes.
export const LAKE_LIFE_TEXT = {
  notHere: 'Only at the Lake.',
  noFrog: 'No frog on a pad.',
  full: 'Already 3 butterflies.',
};
