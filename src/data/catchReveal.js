// catchReveal.js — The catch reveal's numbers, colors and text: the card
// that pops up over the scene when a fish is landed (after a moment of
// suspense), its light rays, sparkles and badges, and how long each
// rarity's reveal lasts. Pure data: game/catchReveal.js times it,
// ui/catchReveal.js draws it.

// Seconds (real time):
//   suspense  Before the card: the bobber jerks and a dark silhouette of
//             the fish flashes.
//   flash     The silhouette is on, then off, for this long each.
//   popIn     The card's quick scale-up (overshooting a little, then
//             settling).
//   fadeOut   Fading away at the end (or after a click).
export const REVEAL_TIMES = { suspense: 0.5, flash: 0.1, popIn: 0.25, fadeOut: 0.6 };

// How far the pop-in overshoots (1.1 = 10% bigger, then back to full
// size), and the size it starts from.
export const REVEAL_POP = { from: 0.2, overshoot: 1.1 };

// Most reveals waiting to be shown (one at a time); the oldest go first.
export const REVEAL_MAX_QUEUED = 3;

// Per rarity (ids from data/fishing.js):
//   color     The rays, the banner and the sparkles' glow.
//   light     The space between the rays.
//   hold      Seconds the card stays fully shown (rarer stays longer).
//   rays      How many light rays.
//   spin      How fast the rays turn, in turns per second (0: still).
//   sparkles  How many sparkles twinkle around the fish (0: none).
//   flash     Seconds of a gold flash over the whole window as the card
//             pops in (0: none).
export const REVEAL_RARITIES = {
  junk: { color: '#9a958c', light: '#e4e0d8', hold: 2.5, rays: 6, spin: 0, sparkles: 0, flash: 0 },
  common: { color: '#6cbf58', light: '#dff3d3', hold: 3, rays: 8, spin: 0, sparkles: 0, flash: 0 },
  uncommon: { color: '#4f8fd9', light: '#d9e8fb', hold: 3.5, rays: 10, spin: 0, sparkles: 0, flash: 0 },
  rare: { color: '#9a5fd2', light: '#ecdff9', hold: 4.5, rays: 12, spin: 0, sparkles: 6, flash: 0 },
  legendary: { color: '#efb02e', light: '#fff3c4', hold: 7, rays: 14, spin: 0.06, sparkles: 10, flash: 0.9 },
};

// The card, in canvas pixels (the window is 320 x 240), centered in the
// window:
//   width, height  Its size, with its 2px border.
//   banner         Height of the rarity banner across the top.
//   art            The rays and the fish: { left, top, width, height }
//                  inside the card.
//   rayPixel       Canvas pixels per ray pixel (whole number).
//   fishScale      Most canvas pixels per fish pixel; smaller if the fish
//                  (or its sprite) wouldn't fit the art with `fishMargin`
//                  to spare on each side.
//   titleY, detailY  Text baselines inside the card.
//   badge          Badges: height, padding left and right of the text,
//                  and inset from the art's corners.
//   sparkle        { cycle (seconds one sparkle lives), size (canvas
//                  pixels per sparkle pixel) }. Each is white with a
//                  dark rim so it shows on the rays.
export const REVEAL_CARD = {
  width: 184,
  height: 150,
  banner: 18,
  art: { left: 8, top: 26, width: 168, height: 76 },
  rayPixel: 4,
  fishScale: 6,
  fishMargin: 6,
  titleY: 124,
  detailY: 140,
  badge: { height: 12, padding: 3, inset: 3 },
  sparkle: { cycle: 0.9, size: 3 },
};

// Pure art for the card.
export const REVEAL_COLORS = {
  card: '#fffaf0',
  border: '#3d3a4b',
  text: '#3d3a4b',
  muted: '#6b6478',
  bannerText: '#fffaf0',
  newBadge: '#e0584a',
  recordBadge: '#d98a1c',
  badgeText: '#fffaf0',
  silhouette: '#2a2633',
  sparkle: '#ffffff',
  sparkleRim: '#3d3a4b',
  flash: '#ffe7a0',
};

// Text. {fish} is the catch's name (lower case for junk's line), {size}
// cm, {value} dollars. The banner is the rarity's name in capitals.
export const REVEAL_TEXT = {
  new: 'NEW!',
  record: 'NEW RECORD!',
  detail: '{size} cm - ${value}',
  noSize: '${value}',
  junk: { title: 'Just an {fish}...', detail: 'Someone lost a shoe.' },
  close: 'Close',
};
