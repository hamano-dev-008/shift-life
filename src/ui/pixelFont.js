// pixelFont.js — A tiny 3 x 5 pixel font for signs painted in the town
// places' pictures (the 6-Eleven's, Pedal Post's): the letters they use,
// and writing a word onto a layer.

import { fill } from './pixel.js';

// Each letter's rows ('#' is a pixel); most are 3 wide, N 4, a space 2.
const LETTERS = {
  6: ['###', '#..', '###', '#.#', '###'],
  '-': ['...', '...', '###', '...', '...'],
  ' ': ['..', '..', '..', '..', '..'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  L: ['#..', '#..', '#..', '#..', '###'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  S: ['###', '#..', '###', '..#', '###'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
};

// Writes `text` on `layer` from column `x`, its top on row `row`, a pixel
// between letters, each letter in colorOf(letter). Returns its width.
export function drawText(layer, x, row, text, colorOf) {
  let left = x;
  for (const char of text) {
    const rows = LETTERS[char];
    rows.forEach((line, dy) => [...line].forEach((pixel, dx) => {
      if (pixel === '#') fill(layer, left + dx, row + dy, 1, 1, colorOf(char));
    }));
    left += rows[0].length + 1;
  }
  return left - x - 1;
}
