// weather.js — The game's weather: its kinds (name, icon, how long each
// lasts, how it looks), which comes next, the fade between them, and the
// numbers and colors for drawing it (tints, extra clouds, rain, splashes,
// ripples, fog, the rainbow, lightning, the top bar's icons). Pure data:
// game/weather.js runs it, ui/weather.js and ui/weatherArt.js draw it.
// Positions are in scene pixels: x from the window's left, rows from its
// top (the backgrounds' pictures are 80 rows, so their rows are the
// same).

import { LAKE_PLACE, SHIMMER } from './lake.js';
import { FARM_PLACE, PADDIES, PADDY_WATER } from './farm.js';

// Each kind of weather:
//   name      Shown on the top bar's icon (hover) and in the dev menu.
//   icon      Which of WEATHER_ICONS shows.
//   minutes   How long it lasts, in real minutes ([min, max], random).
//   rain      How hard it rains: the share of RAIN.maxDrops falling (0-1).
//   drop      The raindrops' look (the kind fading in decides): length in
//             scene pixels ([min, max]), fall speed (scene pixels a
//             second), and color.
//   slant     Scene pixels sideways per scene pixel down (with the wind).
//   wet       How wet the ground looks (0-1: GROUND_WET darkens it).
//   clouds    How cloudy: the share of WEATHER_CLOUDS shown (0-1), and
//   shade     how dark they are (0 light grey-blue, 1 dark slate).
//   cloudSpeed  How fast the clouds drift, times CLOUD_DRIFT's.
//   fog       How thick the haze bands are (0-1).
//   rainbow   How strongly the rainbow shows (0-1).
//   tint      A color laid over each parallax layer, with its strength
//             per layer (sky, clouds, hills, ground); none when missing.
//   wind      Optional: the wind's pace (WIND_PACES); the usual breeze
//             when missing.
//   lightning Optional: lightning flashes and bolts (LIGHTNING).
export const WEATHER = {
  sunny: {
    name: 'Sunny', icon: 'sun', minutes: [60, 180],
    rain: 0, slant: 0, wet: 0, clouds: 0, shade: 0, cloudSpeed: 1, fog: 0, rainbow: 0,
  },
  cloudy: {
    name: 'Cloudy', icon: 'cloud', minutes: [30, 90],
    rain: 0, slant: 0, wet: 0, clouds: 0.6, shade: 0.2, cloudSpeed: 1.8, fog: 0, rainbow: 0,
    tint: { color: '#8394ad', sky: 0.32, clouds: 0.28, hills: 0.22, ground: 0.14 },
  },
  fog: {
    name: 'Fog', icon: 'fog', minutes: [15, 40],
    rain: 0, slant: 0, wet: 0.2, clouds: 0.25, shade: 0.1, cloudSpeed: 0.6, fog: 1, rainbow: 0,
    // Paler with distance: the hills fade most.
    tint: { color: '#e3e7ec', sky: 0.4, clouds: 0.5, hills: 0.62, ground: 0.22 },
  },
  drizzle: {
    name: 'Drizzle', icon: 'rain', minutes: [20, 60],
    rain: 0.35, drop: { length: [2, 2], speed: 75, color: '#c6d6ea' },
    slant: 0.1, wet: 0.7, clouds: 0.6, shade: 0.3, cloudSpeed: 2, fog: 0.15, rainbow: 0,
    tint: { color: '#7c8ca4', sky: 0.34, clouds: 0.3, hills: 0.26, ground: 0.16 },
  },
  rain: {
    name: 'Rain', icon: 'rain', minutes: [20, 60],
    rain: 0.7, drop: { length: [2, 3], speed: 110, color: '#b5c9e3' },
    slant: 0.2, wet: 1, clouds: 0.8, shade: 0.5, cloudSpeed: 2.4, fog: 0, rainbow: 0,
    tint: { color: '#6d7d95', sky: 0.42, clouds: 0.36, hills: 0.32, ground: 0.22 },
  },
  heavyRain: {
    name: 'Heavy rain', icon: 'rain', minutes: [20, 60], wind: 'gusty',
    rain: 1, drop: { length: [3, 3], speed: 145, color: '#a9bfdc' },
    slant: 0.3, wet: 1, clouds: 1, shade: 0.75, cloudSpeed: 3, fog: 0, rainbow: 0,
    tint: { color: '#5b6880', sky: 0.5, clouds: 0.44, hills: 0.4, ground: 0.28 },
  },
  storm: {
    name: 'Thunderstorm', icon: 'storm', minutes: [10, 25], wind: 'storm', lightning: true,
    rain: 1, drop: { length: [3, 3], speed: 160, color: '#a3b8d6' },
    slant: 0.45, wet: 1, clouds: 1, shade: 1, cloudSpeed: 3.8, fog: 0, rainbow: 0,
    tint: { color: '#3e4659', sky: 0.6, clouds: 0.52, hills: 0.48, ground: 0.34 },
  },
  rainbow: {
    name: 'Rainbow', icon: 'rainbow', minutes: [5, 10],
    rain: 0, slant: 0, wet: 0.4, clouds: 0.2, shade: 0.1, cloudSpeed: 1.2, fog: 0, rainbow: 1,
    tint: { color: '#fff0d4', sky: 0.1, clouds: 0.08, hills: 0.05, ground: 0.04 },
  },
};

// The weather a new game starts with.
export const FIRST_WEATHER = 'sunny';

// What comes next: weights per kind (never the same kind again). Sunny is
// most common; storms only come from heavy rain; a rainbow often follows
// rain clearing up, and gives way to sun.
export const WEATHER_NEXT = {
  sunny: { cloudy: 6, fog: 2, drizzle: 2 },
  cloudy: { sunny: 5, drizzle: 3, rain: 2, fog: 1 },
  fog: { sunny: 4, cloudy: 3, drizzle: 1 },
  drizzle: { sunny: 2, cloudy: 3, rain: 2, rainbow: 3 },
  rain: { heavyRain: 3, drizzle: 2, cloudy: 1, rainbow: 4, sunny: 1 },
  heavyRain: { storm: 4, rain: 3, rainbow: 2, cloudy: 1 },
  storm: { heavyRain: 2, rain: 3, rainbow: 3 },
  rainbow: { sunny: 1 },
};

// A change fades from the old weather into the new over this many real
// seconds.
export const WEATHER_FADE_SECONDS = 60;

// Where it's indoors: no weather but through the window (HOME_GLASS).
export const INDOOR_PLACES = ['home', 'myHome'];

// The glass of Home's window (the code-drawn home.window prop): insets in
// scene pixels from the prop's art edges. Rain, the sky's tint, fog and
// lightning show through it.
export const HOME_GLASS = { prop: 'home.window', left: 4, right: 4, top: 2, bottom: 3 };

// The wind's pace (the Fortune Tree's wind, data/fortuneTreeDecor.js WIND:
// seconds of calm between gusts, how long they blow, how hard they push
// leaves, scene pixels a second), and how much a gust slants the rain.
export const WIND_PACES = {
  gusty: { gustEvery: [6, 14], gustLength: [2, 4], leafPush: 14, rainSlant: 0.3 },
  storm: { gustEvery: [3, 7], gustLength: [2.5, 5], leafPush: 22, rainSlant: 0.45 },
};
// A usual gust's slant on the rain.
export const BREEZE_RAIN_SLANT = 0.15;

// Rain: at most `maxDrops` drops at once outdoors (`indoorDrops` in Home's
// window), each a column of 1-scene-pixel dots (WEATHER[kind].drop),
// drawn in front of the scene and the character, behind bubbles and
// menus, at `alpha`. A drop lands on the place's ground line (the feet
// row, give or take `groundRows`) with a splash, or on water (RAIN_WATER)
// with a ripple.
export const RAIN = { maxDrops: 60, indoorDrops: 8, alpha: 0.8, groundRows: [-1, 1] };
// A splash: 2 frames over `seconds` (a crown of 2 dots one row up, then 2
// dots 2 out on the row).
export const SPLASH = { seconds: 0.2, color: '#d7e3f1', alpha: 0.8 };
// A ripple on water: a ring seen from the side, 3 frames over `seconds`
// (1, then 3 with a gap, then 5 with a gap of 3 pixels wide).
export const RIPPLE = { seconds: 0.6, color: '#d9e8f7', alpha: 0.65 };
// Water drops can land in, per place: rectangles (columns left..right,
// rows top..bottom), minus `avoid` (the dock); `share` of the drops over
// it land in it (the rest on the ground line in front).
export const RAIN_WATER = {
  [LAKE_PLACE]: { areas: [SHIMMER.area], avoid: SHIMMER.avoid, share: 1 },
  [FARM_PLACE]: {
    areas: PADDIES.map((paddy) => ({ left: paddy.left, right: paddy.right, ...PADDY_WATER })),
    avoid: [],
    share: 0.6,
  },
};
// While wet, the ground layer darkens by this much (times `wet`).
export const GROUND_WET = { color: '#1d2a3a', alpha: 0.14 };

// The extra code-drawn clouds of cloudy and wet weather, on the clouds
// layer (drifting with it, wrapping every `period` scene pixels): `count`
// of them, each `width` x `height` scene pixels somewhere in `rows`; as it
// gets cloudier more of them fade in one by one. Colors go from `light`
// to `dark` with the weather's shade (top edge, body, bottom edge), in
// `shadeSteps` steps.
export const WEATHER_CLOUDS = {
  count: 8,
  period: 107,
  rows: [3, 34],
  width: [12, 24],
  height: [4, 7],
  shadeSteps: 5,
  light: { top: '#dde3ec', body: '#b9c3d1', bottom: '#97a3b5' },
  dark: { top: '#6e7789', body: '#4f586b', bottom: '#3a4254' },
};

// Fog: soft haze bands drifting sideways, thickest near the horizon. Each
// is `height` rows from `row`, broken into runs, at `alpha` (its top and
// bottom rows at half), drifting `speed` scene pixels a second; all times
// the weather's fog.
export const FOG = {
  color: '#eef1f4',
  bands: [
    { row: 40, height: 2, alpha: 0.18, speed: 0.6 },
    { row: 48, height: 3, alpha: 0.3, speed: -0.9 },
    { row: 54, height: 4, alpha: 0.42, speed: 1.2 },
    { row: 59, height: 4, alpha: 0.5, speed: -0.7 },
    { row: 65, height: 3, alpha: 0.34, speed: 1 },
    { row: 72, height: 2, alpha: 0.2, speed: -1.3 },
  ],
  // Runs and gaps along a band, scene pixels.
  run: [10, 26],
  gap: [2, 7],
  period: 107,
};

// The rainbow: rings of `colors` (outermost first), one scene pixel each,
// around `center` (scene pixels; below the horizon, so only the arc
// shows) with the outer ring `radius` out, in the sky behind the hills,
// at `alpha` times the weather's rainbow.
export const RAINBOW = {
  center: { x: 64, row: 70 },
  radius: 40,
  colors: ['#e36d6d', '#ef9f58', '#f3d36c', '#86c978', '#68a8e0', '#9486d8'],
  alpha: 0.5,
};

// Lightning, in a thunderstorm: one at a time, `gap` seconds apart (never
// less than its minimum, so never rapid strobing). The window whitens
// softly (`flash`: its strength each `step` seconds, one pulse, never
// pure white) unless the "Lightning flashes" setting is off; with
// `boltChance` a small bolt shows far off in the sky (from a row in `top`
// down to a row in `bottom`, somewhere in `columns`, jagging a pixel at a
// time, maybe with a short `branch`) for `boltSeconds`, behind the hills.
export const LIGHTNING = {
  gap: [6, 15],
  firstIn: [3, 8],
  flash: { color: '#e7ecf8', levels: [0.3, 0.22, 0.12, 0.05], step: 0.06 },
  boltChance: 0.5,
  boltSeconds: 0.3,
  top: [6, 14],
  bottom: [36, 50],
  columns: [12, 94],
  branchChance: 0.5,
  boltColor: '#fff6c9',
  boltGlow: '#c9cff5',
};

// The top bar's weather icons, 8 x 8 pixels, one string per row: each
// letter a color in ICON_COLORS, a space clear.
export const WEATHER_ICONS = {
  sun: [
    'y  yy  y',
    '        ',
    '   yy   ',
    'y yyyy y',
    'y yyyo y',
    '   yo   ',
    '        ',
    'y  yy  y',
  ],
  cloud: [
    '        ',
    '        ',
    '   ll   ',
    ' llllll ',
    'llllllll',
    'gggggggg',
    '        ',
    '        ',
  ],
  rain: [
    '   ll   ',
    ' llllll ',
    'llllllll',
    'gggggggg',
    '        ',
    ' b  b  b',
    'b  b  b ',
    '        ',
  ],
  storm: [
    '   dd   ',
    ' dddddd ',
    'dddddddd',
    'ssssYsss',
    '   YY   ',
    '  YY    ',
    '   Y    ',
    '  Y     ',
  ],
  fog: [
    '        ',
    'gggggg  ',
    '        ',
    '  gggggg',
    '        ',
    'gggggg  ',
    '        ',
    '  gggg  ',
  ],
  rainbow: [
    '        ',
    '  rrrr  ',
    ' roooor ',
    'royyyyor',
    'roy  yor',
    'roy  yor',
    '        ',
    '        ',
  ],
};
export const ICON_COLORS = {
  y: '#f2b632', o: '#d98a1c', l: '#b9c4d3', g: '#7d8899', b: '#4a8fd8', d: '#4f586b', s: '#3a4254',
  Y: '#ffd23f', r: '#e36d6d',
};

// Text: the top bar icon's hover ("Weather: {name}"), the dev menu and
// its read-out, the "Lightning flashes" setting.
export const WEATHER_TEXT = {
  title: 'Weather: {name}',
  devRow: 'Weather',
  devNext: 'Next weather',
  readout: 'Weather: {name}, {left} min left',
  fading: ' (from {previous}, {percent}%)',
  lightningSetting: 'Lightning flashes',
  on: 'On',
  off: 'Off',
};

// ---- What the weather does (game/weather.js, game/weatherEffects.js) ----
// Small, cozy effects. They follow the weather that's coming in
// (game.weather.kind) from the moment it changes, not the fade.
//   riceGrowth  The paddies' rice grows `speed` times as fast in `kinds`.
//   bites       Fishing's wait for a bite passes `speed` times as fast in
//               `kinds` (bites come 30% faster).
//   buskingPay  A busking session pays `share` of SESSION_PAY in `kinds`
//               (rounded to whole dollars: $10 becomes $8).
//   storm       In `kinds`, `activities` (ids in data/activities.js) stop
//               on their own (fishing sells the bucket) and can't start,
//               and busking stops and can't start.
//   shelter     In `kinds`, the character's own plans (game/autonomy.js)
//               never choose `avoid`, and with a home in `tiers`
//               (data/housing.js) they may go home to rest whatever their
//               health, `restWeight` times as likely.
//   animals     In `kinds` the Farm's chickens (data/farmAnimals.js) go
//               into the barn, out of sight, and come back out after (the
//               rice keeps growing either way).
//   butterflies In `kinds` the Lake's butterflies (data/lakeLife.js)
//               fly off and no new ones come; they come back after.
//   rainbow     The first time `kinds` comes in each life (while alive):
//               these stat changes, with a golden bubble.
export const WEATHER_EFFECTS = {
  riceGrowth: { kinds: ['drizzle', 'rain', 'heavyRain', 'storm'], speed: 1.25 },
  bites: { kinds: ['drizzle', 'rain', 'heavyRain'], speed: 1.3 },
  buskingPay: { kinds: ['drizzle', 'rain', 'heavyRain'], share: 0.75 },
  storm: { kinds: ['storm'], activities: ['fishing'] },
  shelter: { kinds: ['storm'], avoid: ['fish', 'busk'], tiers: ['tent', 'house'], restWeight: 8 },
  animals: { kinds: ['storm'] },
  butterflies: { kinds: ['drizzle', 'rain', 'heavyRain', 'storm'] },
  rainbow: { kinds: ['rainbow'], stats: { happiness: 3 } },
};

// Their text: what's said when a storm stops something (the bubble; with
// fishing's sale under it) and the menus' note while it lasts, per
// activity id and for busking; going home out of the storm; the rainbow.
// {name} becomes the character's name.
export const WEATHER_EFFECTS_TEXT = {
  stormStops: {
    fishing: 'Too stormy to fish!',
    busking: 'Not under a tree in a storm!',
  },
  shelter: 'Better get out of the storm!',
  rainbow: { heading: 'A rainbow!', text: '{name} smiles up at the sky.' },
};
