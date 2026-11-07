// office.js — Paperleaf Co.'s numbers and text: a cozy small-company
// office in town, reached only from Go to. Where things are in its
// picture (the door, the window, the break corner's vending machine and
// printer, the water cooler, Gerald the plant, the whiteboard, the
// desks), where the character walks and where the worker sits. Pure data:
// data/places.js, data/layout.js and data/work.js use it, ui/office.js
// draws it.
//
// The office is one picture, code-drawn (ui/office.js) or the office
// sprite (assets/sprites/office.png) if there is one, drawn at
// SCENE_SCALE from the window's bottom-left corner like the Cafe's.
// Positions are in that picture's pixels: x from its left edge, rows from
// its top.

export const OFFICE_PLACE = 'office';
export const OFFICE_ART = { width: 107, height: 80 };

// Feet on row 72, 8 rows from the bottom, like the Cafe. Walls both sides.
export const OFFICE_FEET_FROM_BOTTOM = 8;
export const OFFICE_WALK = { minX: 8, maxX: 100 };

// The door on the left (its click area and the x where someone stands to
// go in or out).
export const OFFICE_DOOR_PROP = 'office.door';
export const OFFICE_DOOR = { left: 3, right: 15, top: 28, bottom: 66, x: 9 };

// The window over the break corner (columns left..right, rows
// top..bottom): the town outside.
export const OFFICE_WINDOW = { left: 19, right: 41, top: 14, bottom: 34 };

// The break corner: the vending machine and the printer on its cabinet,
// each a click area opening the corner's menu, and where someone stands
// at it.
export const VENDING_PROP = 'office.vending';
export const OFFICE_VENDING = { left: 19, right: 29, top: 38, bottom: 66, x: 24 };
export const PRINTER_PROP = 'office.printer';
export const OFFICE_PRINTER = { left: 31, right: 39, top: 51, bottom: 66, x: 35 };

// The water cooler (its middle; coworkers chat by it) and Gerald the
// plant in its pot (its middle, the top of his leaves and the pot's
// bottom row).
export const OFFICE_COOLER_X = 44;
export const OFFICE_PLANT = { x: 51, top: 46, bottom: 66 };

// The whiteboard and the sign over it (columns left..right, rows
// top..bottom; the sign's text in 3 x 5 pixel letters).
export const OFFICE_WHITEBOARD = { left: 74, right: 100, top: 20, bottom: 36 };
export const OFFICE_SIGN = { left: 58, right: 96, top: 10, bottom: 16, text: 'PAPERLEAF' };

// The desks: each a chair (its middle `seatX` and the seat's top row) with
// the desk to its right (columns left..right, its top row), the monitor at
// the desk's right end. The character's is the middle one
// (OFFICE_MY_DESK); coworkers have the others.
export const OFFICE_DESKS = [
  { seatX: 58, seatRow: 63, left: 61, right: 71, top: 59 },
  { seatX: 75, seatRow: 63, left: 78, right: 88, top: 59 },
  { seatX: 92, seatRow: 63, left: 95, right: 105, top: 59 },
];
export const OFFICE_MY_DESK = 1;

// The job that works here (data/jobs.js): they sit at their desk, and
// their shifts are typing there (data/work.js).
export const OFFICE_JOB = 'office';

// Names for the place's click areas.
export const OFFICE_TEXT = {
  name: 'Paperleaf Co.',
  door: 'Go outside',
  vending: 'Vending machine',
  printer: 'Printer',
};

// The break corner's menu (from OFFICE_MIN_AGE; the vending machine and
// the printer both open it): each item's price, what it gives, how long
// it takes at its spot (`at`: OFFICE_VENDING or OFFICE_PRINTER) and how
// often it can be had (real minutes; game speed doesn't change it, and it
// waits while the app is closed). Paid at once. `thing` names it in the
// bar and the bubble. Money sinks (AGENTS.md): a coffee is a few minutes
// of an entry job's pay, a resume (once a real day) under ten.
export const OFFICE_MIN_AGE = 6;
export const OFFICE_ITEMS = {
  coffee: {
    name: 'Vending coffee', thing: 'coffee', price: 2, effects: { happiness: 2 }, everyMinutes: 60, seconds: 6,
    at: 'vending',
  },
  resume: {
    name: 'Print a resume', thing: 'resume', price: 3, effects: { smarts: 1, happiness: 1 }, everyMinutes: 1440,
    seconds: 5, at: 'printer',
  },
};

// The menu, the bar and the bubbles. {item} is an item's `thing`, {age} an
// age.
export const OFFICE_MENU_TEXT = {
  title: 'Break corner',
  tooYoung: 'Come back at age {age} for a coffee.',
  busy: 'Busy with the {item}...',
  idle: 'Coffee break? Or polish that resume.',
};
export const OFFICE_BAR_TEXT = {
  toVending: 'Off to the vending machine...',
  toPrinter: 'Off to the printer...',
  coffee: 'Sipping a coffee...',
  resume: 'Printing the resume...',
};
export const OFFICE_NEWS = {
  coffee: { heading: 'Ahh.', text: 'Just what the day needed.' },
  resume: { heading: 'Printed!', text: 'Looking sharp on paper.' },
};

// Coworkers at their desks (OFFICE_DESKS other than the character's),
// typing; now and then (`breakChance` each time) one gets up for a chat by
// the water cooler for `chat` seconds and goes back, walking `speed`
// character pixels a second.
export const OFFICE_COWORKERS = {
  looks: [
    { skin: '#f1c27d', hair: '#2b1d14', hairStyle: 'short', shirt: '#81b29a' },
    { skin: '#8d5524', hair: '#1f1f2e', hairStyle: 'bun', shirt: '#e07a9f' },
  ],
  type: [6, 14],
  breakChance: 0.35,
  chat: [5, 9],
  speed: 9,
};

// The boss: an elder in a tie who strolls about, stops at a desk or the
// whiteboard (`stops`, x) for `pause` seconds, and walks on at `speed`.
// Clicking them gets one of `lines`.
export const OFFICE_BOSS = {
  look: { skin: '#e0ac69', hair: '#c9c9c9', hairStyle: 'short', shirt: '#5b7fb0' },
  stage: 'elder',
  item: 'tie',
  stops: [30, 46, 66, 84, 98],
  pause: [3, 7],
  speed: 7,
  label: 'Boss',
  lines: [
    'Great work, everyone!',
    'Synergy... is that a word?',
    "Who's watering Gerald?",
    'Meeting at three. Maybe.',
    'Paperleaf, paper-proud!',
    'Take a break, you earned it.',
  ],
};

// Gerald, the office's beloved potted plant (code-drawn at SCENE_SCALE):
// sways a little, and clicked it perks up (leaves lifted) for `perk`
// seconds with one of `lines`.
export const OFFICE_PLANT_LIFE = {
  sway: 1.6,
  perk: 2,
  label: 'Gerald',
  lines: ['(Gerald perks up!)', '(Gerald rustles happily.)', '(Gerald stands a little taller.)'],
  colors: { leaf: '#5fa55a', leafDark: '#3f7d45', leafLight: '#8fca6a', pot: '#c96f4a', potDark: '#a8573a' },
};
