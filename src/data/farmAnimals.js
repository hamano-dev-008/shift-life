// farmAnimals.js — The Farm's chickens (visual only, never saved; behavior
// in ui/farmAnimals.js, drawing in ui/farmAnimalsArt.js): how many, where
// they peck about (the pen in front of the barn in farm.background.png),
// the barn's door they go in and out of, their timing, speed and colors.
// When they shelter in the barn is in data/weather.js (WEATHER_EFFECTS.
// animals). Positions are in the picture's pixels: x from the left, rows
// from the top (like data/farm.js).

export const CHICKENS = {
  count: 3,
  // Where their feet can be: between the back fence (row 63) and the
  // front rail (row 70), off the barn's front.
  area: { left: 62, right: 100, top: 65, bottom: 69 },
  // The barn's door (the white X), its middle and its foot row.
  door: { x: 91, row: 65 },
  // Scene pixels a second: strolling, and hurrying in out of a storm.
  speed: 5,
  hurry: 12,
  // Seconds standing still between things ([min, max], random).
  idle: [1, 4],
  // Pecking: how long ([min, max] seconds), and the head goes down every
  // `peckEvery` seconds for half of it.
  peck: [1.5, 3.5],
  peckEvery: 0.4,
  // After standing still: the share that peck (the rest stroll somewhere).
  peckChance: 0.5,
  // A stroll goes at most this far (scene pixels).
  strollMax: 14,
  // Coming back out after a storm: one every few seconds ([min, max]).
  outEvery: [0.8, 2],
  // Steps: the legs change every this many scene pixels walked.
  stride: 1,
  colors: {
    body: '#f6f2e8', wing: '#ddd5c3', comb: '#d9483b', beak: '#f0a830', legs: '#e08a2c', eye: '#2b2b2b',
  },
};
