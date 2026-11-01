// appearance.js — Palettes and styles a character's look is picked from at
// birth, plus fixed colors used when drawing them.

export const SKIN_TONES = ['#ffdbc4', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a21'];

export const HAIR_COLORS = ['#2b1d14', '#5a3825', '#8b5a2b', '#c48a3a', '#e6c36a', '#b5452f', '#1f1f2e'];

// Hair closer than this to the skin color (RGB distance, 0-441) would blend
// into the face, so it's darkened until it's at least this far apart.
export const MIN_HAIR_SKIN_DISTANCE = 60;

// Each id must have a matching case in drawHair() in src/ui/sprite.js.
export const HAIR_STYLES = ['short', 'long', 'spiky', 'bun'];

export const SHIRT_COLORS = ['#e07a5f', '#81b29a', '#f2cc8f', '#6d9dc5', '#b48ead', '#f4a3b5', '#3d405b'];

// Elders' hair turns this color regardless of their original hair color.
export const ELDER_HAIR_COLOR = '#c9c9d1';

export const PANTS_COLOR = '#4a4e69';
export const SHOE_COLOR = '#2e2a35';
export const EYE_COLOR = '#2e2a35';
export const EYE_WHITE = '#ffffff';
export const MOUTH_COLOR = '#3a1f24';
// Used instead of MOUTH_COLOR on darker skin tones.
export const MOUTH_COLOR_LIGHT = '#f2b8ae';

// 1px border around the character and props so they read against the sky.
export const OUTLINE_COLOR = '#3d3a4b';
export const SHADOW_COLOR = 'rgba(40, 70, 40, 0.25)';
