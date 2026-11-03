// weather.js — The weather's moving parts, visual only (no DOM, so tests
// run it; nothing here is saved): raindrops falling (slanted by the wind)
// and landing with a splash on the ground line or a ripple on water, the
// lightning's timing, flash and far-off bolts, and the shapes of the
// extra clouds, the fog's haze bands, the rainbow and the top bar's icons.
// Numbers in data/weather.js; ui/weatherArt.js draws it all. Positions
// are in scene pixels (x from the window's left, rows from its top).

import {
  RAIN, SPLASH, RIPPLE, WEATHER_CLOUDS, FOG, RAINBOW, LIGHTNING, WEATHER_ICONS, ICON_COLORS,
} from '../data/weather.js';

const between = ([min, max], random) => min + (max - min) * random();
const clamp = (value, low, high) => Math.min(Math.max(value, low), high);

// Cheap deterministic noise in [0, 1), so shapes are the same every run.
function noise(a, b) {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// --- Rain -------------------------------------------------------------

// No drops yet; the first ones fill the area at once (`fresh`), later
// ones start at its top.
export function createRain() {
  return { drops: [], splashes: [], ripples: [], fresh: true };
}

// Where a drop over column `x` lands, in `ground` ({ feetRow, water:
// RAIN_WATER entry or null, splash: whether it splashes there }): { row,
// kind: 'ripple' (on water), 'splash' or null }.
export function landingFor(x, ground, random = Math.random) {
  const col = Math.floor(x);
  const { water } = ground;
  if (water && random() < (water.share ?? 1)) {
    const areas = water.areas.filter((area) => col >= area.left && col <= area.right);
    if (areas.length) {
      const area = areas[Math.floor(random() * areas.length)];
      const row = Math.min(area.bottom, Math.floor(between([area.top, area.bottom + 1], random)));
      const blocked = water.avoid.some((rect) => col >= rect.left && col <= rect.right
        && row >= rect.top && row <= rect.bottom);
      if (!blocked) return { row, kind: 'ripple' };
    }
  }
  const row = ground.feetRow + Math.round(between(RAIN.groundRows, random));
  return { row, kind: ground.splash === false ? null : 'splash' };
}

function spawnDrop(rain, options, random) {
  const { area, ground, drop, slant } = options;
  const landX = between([area.left, area.right + 1], random);
  const landing = landingFor(landX, ground, random);
  const length = Math.round(between(drop.length, random));
  const top = area.top - length;
  const y = rain.fresh ? between([top, landing.row], random) : top - random() * 3;
  rain.drops.push({
    x: landX - slant * (landing.row - y),
    y,
    length,
    speed: drop.speed * between([0.85, 1.15], random),
    landRow: landing.row,
    kind: landing.kind,
  });
}

// Moves the rain on by `dt` seconds. `options`: { count (drops wanted,
// at most RAIN.maxDrops), area ({ left, right, top, bottom }: where they
// fall), ground (see landingFor()), drop (the weather's drop look, or
// null: no new ones), slant (scene pixels sideways per pixel down, with
// the wind) }. Drops reaching their row splash or ripple; new ones keep
// the count.
export function updateRain(rain, dt, options, random = Math.random) {
  const { slant } = options;
  const kept = [];
  for (const drop of rain.drops) {
    const fall = drop.speed * dt;
    drop.y += fall;
    drop.x += slant * fall;
    if (drop.y < drop.landRow) {
      kept.push(drop);
    } else if (drop.kind === 'splash') {
      rain.splashes.push({ col: Math.round(drop.x), row: drop.landRow, age: 0 });
    } else if (drop.kind === 'ripple') {
      rain.ripples.push({ col: Math.round(drop.x), row: drop.landRow, age: 0 });
    }
  }
  rain.drops = kept;
  for (const list of [rain.splashes, rain.ripples]) for (const effect of list) effect.age += dt;
  rain.splashes = rain.splashes.filter((splash) => splash.age < SPLASH.seconds);
  rain.ripples = rain.ripples.filter((ripple) => ripple.age < RIPPLE.seconds);
  const count = Math.min(RAIN.maxDrops, Math.max(0, Math.round(options.count)));
  if (options.drop) {
    while (rain.drops.length < count) spawnDrop(rain, options, random);
  }
  rain.fresh = false;
}

// A drop's dots now: [[col, row]], whole scene pixels, from its bottom
// up, each row a little back against the slant.
export function dropDots(drop, slant) {
  const dots = [];
  const col = Math.round(drop.x);
  const row = Math.round(drop.y);
  for (let i = 0; i < drop.length; i++) dots.push([col - Math.round(i * slant), row - i]);
  return dots;
}

// A splash's dots now (2 frames): [[col, row]].
export function splashDots(splash) {
  const frame = Math.floor((splash.age / SPLASH.seconds) * 2);
  const { col, row } = splash;
  return frame === 0 ? [[col - 1, row - 1], [col + 1, row - 1]] : [[col - 2, row], [col + 2, row]];
}

// A ripple's runs now (3 frames): [[col, row, width]].
export function rippleRuns(ripple) {
  const frame = Math.min(2, Math.floor((ripple.age / RIPPLE.seconds) * 3));
  const { col, row } = ripple;
  if (frame === 0) return [[col, row, 1]];
  if (frame === 1) return [[col - 1, row, 1], [col + 1, row, 1]];
  return [[col - 2, row, 1], [col + 2, row, 1]];
}

// --- Lightning --------------------------------------------------------

// No strike yet; the first `LIGHTNING.firstIn` seconds into a storm.
export function createLightning(random = Math.random) {
  return { nextIn: between(LIGHTNING.firstIn, random), age: null, bolt: null, sinceLast: Infinity };
}

const FLASH_SECONDS = LIGHTNING.flash.levels.length * LIGHTNING.flash.step;

// A small jagged bolt far off: [[col, row]], from a row in LIGHTNING.top
// down to one in LIGHTNING.bottom, a pixel sideways now and then, maybe
// with a short branch.
export function makeBolt(random = Math.random) {
  const top = Math.round(between(LIGHTNING.top, random));
  const bottom = Math.round(between(LIGHTNING.bottom, random));
  let col = Math.round(between(LIGHTNING.columns, random));
  const cells = [];
  const branchAt = random() < LIGHTNING.branchChance ? Math.round(top + (bottom - top) * between([0.3, 0.6], random)) : null;
  for (let row = top; row <= bottom; row++) {
    cells.push([col, row]);
    if (row === branchAt) {
      const way = random() < 0.5 ? -1 : 1;
      const length = 3 + Math.floor(random() * 3);
      for (let i = 1; i <= length; i++) cells.push([col + way * Math.ceil(i / 2), row + i]);
    }
    if (random() < 0.45) col += random() < 0.5 ? -1 : 1;
  }
  return cells;
}

// Moves the lightning on by `dt` seconds; `active` while there's a
// thunderstorm. A strike comes every LIGHTNING.gap seconds, never sooner
// than its minimum after the last. Returns whether one struck now.
export function updateLightning(state, dt, active, random = Math.random) {
  state.sinceLast += dt;
  if (state.age !== null) {
    state.age += dt;
    if (state.age >= Math.max(FLASH_SECONDS, state.bolt ? LIGHTNING.boltSeconds : 0)) {
      state.age = null;
      state.bolt = null;
    }
  }
  if (!active) {
    state.nextIn = Math.max(state.nextIn, LIGHTNING.firstIn[0]);
    return false;
  }
  state.nextIn -= dt;
  if (state.nextIn > 0 || state.sinceLast < LIGHTNING.gap[0]) return false;
  state.age = 0;
  state.sinceLast = 0;
  state.nextIn = between(LIGHTNING.gap, random);
  state.bolt = random() < LIGHTNING.boltChance ? makeBolt(random) : null;
  return true;
}

// How strongly the window whitens now (0 when no flash): one soft pulse,
// LIGHTNING.flash.levels in steps.
export function flashLevel(state) {
  if (state.age === null) return 0;
  return LIGHTNING.flash.levels[Math.floor(state.age / LIGHTNING.flash.step)] ?? 0;
}

// The bolt's cells while it shows, else [].
export function boltCells(state) {
  return state.bolt && state.age !== null && state.age < LIGHTNING.boltSeconds ? state.bolt : [];
}

// --- Shapes -----------------------------------------------------------

let clouds = null;
// The extra clouds (WEATHER_CLOUDS), the same every run: [{ x, row,
// cells: [[dx, dy, part ('top', 'body' or 'bottom')]] }].
export function weatherClouds() {
  if (clouds) return clouds;
  const { count, period, rows, width, height } = WEATHER_CLOUDS;
  clouds = [];
  for (let i = 0; i < count; i++) {
    const w = Math.round(between(width, () => noise(i, 1)));
    const h = Math.round(between(height, () => noise(i, 2)));
    const x = Math.floor(((i + noise(i, 3) * 0.6) / count) * period);
    const row = Math.round(between(rows, () => noise(i, 4)));
    const filled = new Set();
    for (let dy = 0; dy < h; dy++) {
      const t = (dy + 0.5) / h;
      const profile = Math.sqrt(1 - (1 - t) ** 2);
      const lump = dy < h - 1 ? Math.round((noise(i, dy + 10) - 0.5) * 2) : 0;
      const inset = Math.max(0, Math.round((w / 2) * (1 - profile)) + lump);
      for (let dx = inset; dx < w - inset; dx++) filled.add(`${dx},${dy}`);
    }
    const cells = [...filled].map((key) => {
      const [dx, dy] = key.split(',').map(Number);
      const part = dy === h - 1 ? 'bottom' : filled.has(`${dx},${dy - 1}`) ? 'body' : 'top';
      return [dx, dy, part];
    });
    clouds.push({ x, row, cells });
  }
  return clouds;
}

// How much of extra cloud `index` shows at cloudiness `amount` (0-1):
// they fade in one after another, in quarters.
export function cloudAlpha(index, amount) {
  return Math.round(clamp(amount * WEATHER_CLOUDS.count - index, 0, 1) * 4) / 4;
}

const fogRunsCache = new Map();
// The runs along fog band `index`: [{ start, length }], scene pixels
// across FOG.period, the same every run.
export function fogRuns(index) {
  if (fogRunsCache.has(index)) return fogRunsCache.get(index);
  const runs = [];
  let at = Math.floor(noise(index, 30) * FOG.gap[1]);
  for (let k = 0; at < FOG.period; k++) {
    const length = Math.round(between(FOG.run, () => noise(index, k * 2 + 31)));
    runs.push({ start: at, length: Math.min(length, FOG.period - at) });
    at += length + Math.round(between(FOG.gap, () => noise(index, k * 2 + 32)));
  }
  fogRunsCache.set(index, runs);
  return runs;
}

// The haze bands `seconds` in at fog `strength` (0-1): [{ row, height,
// alpha, offset (whole scene pixels, drifting), runs }], none when clear.
export function fogBands(seconds, strength) {
  if (strength <= 0) return [];
  return FOG.bands.map((band, i) => ({
    row: band.row,
    height: band.height,
    alpha: band.alpha * strength,
    offset: Math.floor(seconds * band.speed),
    runs: fogRuns(i),
  }));
}

let rainbow = null;
// The rainbow's cells: [{ x, row, color }], only above its center (the
// arc), the same every run.
export function rainbowCells() {
  if (rainbow) return rainbow;
  const { center, radius, colors } = RAINBOW;
  rainbow = [];
  for (let row = center.row - radius; row < center.row; row++) {
    for (let x = center.x - radius; x <= center.x + radius; x++) {
      const d = Math.hypot(x + 0.5 - center.x, row + 0.5 - center.row);
      const band = Math.floor(radius - d);
      if (band >= 0 && band < colors.length) rainbow.push({ x, row, color: colors[band] });
    }
  }
  return rainbow;
}

// An icon's pixels: [{ x, y, color }].
export function iconPixels(icon) {
  const rows = WEATHER_ICONS[icon] ?? [];
  const pixels = [];
  rows.forEach((line, y) => [...line].forEach((letter, x) => {
    if (ICON_COLORS[letter]) pixels.push({ x, y, color: ICON_COLORS[letter] });
  }));
  return pixels;
}
