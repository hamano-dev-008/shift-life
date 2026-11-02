// interaction.js — Poke dialogue, real-time pacing and visual reaction
// settings, and how far a press must move to drag the window.
export const POKE = {
  rewardMs: 30000,
  burstMs: 3000,
  burstCount: 4,
  calmMs: 5000,
  happiness: 1,
  annoyance: -1,
  reactionMs: 700,
  bubbleSeconds: 1.8,
  wiggleBeatMs: 90,
  wigglePixels: 1,
  clickSlop: 4,
  clickMs: 600,
  label: 'Gently poke',
  playful: ['Hey, stop that! It tickles!', 'Hehe! That tickles!', 'You found my ticklish spot!'],
  annoyed: ['Okay, enough poking!', 'A little space, please!'],
};

// A press (anywhere but buttons, panels, bars and bubbles) drags the window
// once the pointer has moved more than `threshold` screen pixels; until
// then it's an ordinary click.
export const WINDOW_DRAG = {
  threshold: 4,
};
