// lifeStages.js — Life stages, the age (in whole years) each one starts
// at, and how long one of its years lasts. Ordered youngest first; a
// character is in the last stage whose minAge they have reached.
//
// realMinutesPerYear: real minutes per in-game year at normal speed.
// Targets (AGENTS.md, about 8 hours of running a day): childhood about 1
// real hour a year, adulthood about 4, old age about 3, so a life to 80
// lasts 18 + 188 + 45 = 251 hours, about a month.

export const LIFE_STAGES = [
  { id: 'baby', minAge: 0, realMinutesPerYear: 60 },
  { id: 'child', minAge: 4, realMinutesPerYear: 60 },
  { id: 'teen', minAge: 13, realMinutesPerYear: 60 },
  { id: 'adult', minAge: 18, realMinutesPerYear: 240 },
  { id: 'elder', minAge: 65, realMinutesPerYear: 180 },
];
