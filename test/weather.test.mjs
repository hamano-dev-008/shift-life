// weather.test.mjs — The weather: its kinds, durations and what comes
// next (sunny most of the time, storms only from heavy rain, rainbows
// after rain), real-time changes with the 60 s fade, saving and
// restoring, the blended look (tints, fog paler with distance, storms
// darkest), rain (at most 60 drops, splashes on the ground line, ripples
// on the Lake and the paddies, none past Home's glass), lightning (one at
// a time, 6 s apart at least, a soft single pulse, bolts far up in the
// sky), the shapes (extra clouds, fog bands, the rainbow, icons), the
// storm's wind and the Lightning flashes setting.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEATHER, FIRST_WEATHER, WEATHER_NEXT, WEATHER_FADE_SECONDS, WEATHER_ICONS, ICON_COLORS, RAIN, RAIN_WATER,
  LIGHTNING, WEATHER_CLOUDS, FOG, RAINBOW, WIND_PACES, INDOOR_PLACES, WEATHER_TEXT,
} from '../src/data/weather.js';
import {
  WEATHER_KINDS, weatherDurationMs, createWeatherState, restoreWeatherState, nextWeatherKind, updateWeather,
  setWeather, skipWeather, weatherMix, weatherLook, weatherView, weatherText,
} from '../src/game/weather.js';
import {
  createRain, updateRain, landingFor, dropDots, splashDots, rippleRuns, createLightning, updateLightning, flashLevel,
  boltCells, makeBolt, weatherClouds, cloudAlpha, fogBands, rainbowCells, iconPixels,
} from '../src/ui/weather.js';
import { createWind, updateWind, isGusting, windPush } from '../src/ui/treeDecor.js';
import { WIND } from '../src/data/fortuneTreeDecor.js';
import { LAKE_PLACE, DOCK } from '../src/data/lake.js';
import { FARM_PLACE, PADDIES, PADDY_WATER } from '../src/data/farm.js';
import { PLACES } from '../src/data/places.js';
import { DEFAULT_SETTINGS } from '../src/data/settings.js';
import { restoreSettings, settingsSaveData, setLightningFlashes } from '../src/game/settings.js';

// A repeatable random sequence.
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const MINUTE = 60000;

test('the kinds: names, icons and how long each lasts', () => {
  assert.deepEqual(WEATHER_KINDS, ['sunny', 'cloudy', 'fog', 'drizzle', 'rain', 'heavyRain', 'storm', 'rainbow']);
  assert.deepEqual(Object.fromEntries(WEATHER_KINDS.map((id) => [id, WEATHER[id].minutes])), {
    sunny: [60, 180], cloudy: [30, 90], fog: [15, 40], drizzle: [20, 60], rain: [20, 60], heavyRain: [20, 60],
    storm: [10, 25], rainbow: [5, 10],
  });
  assert.equal(WEATHER.storm.name, 'Thunderstorm');
  for (const id of WEATHER_KINDS) {
    const kind = WEATHER[id];
    assert.ok(kind.name && kind.name.length <= 16);
    assert.ok(WEATHER_ICONS[kind.icon], `${id}: no icon ${kind.icon}`);
    const random = seeded(id.length);
    for (let i = 0; i < 50; i++) {
      const ms = weatherDurationMs(id, random);
      assert.ok(ms >= kind.minutes[0] * MINUTE && ms <= kind.minutes[1] * MINUTE);
    }
    for (const key of ['rain', 'wet', 'clouds', 'shade', 'fog', 'rainbow']) {
      assert.ok(kind[key] >= 0 && kind[key] <= 1, `${id}.${key}`);
    }
    if (kind.rain > 0) {
      assert.ok(kind.drop.length[0] >= 2 && kind.drop.length[1] <= 3, `${id}: drops 1x2 to 1x3`);
      assert.ok(kind.cloudSpeed > WEATHER.sunny.cloudSpeed && kind.clouds > 0);
    }
  }
  assert.equal(WEATHER.cloudy.clouds > 0 && WEATHER.cloudy.cloudSpeed > 1, true);
  assert.deepEqual(new Set(WEATHER_KINDS.map((id) => WEATHER[id].icon)), new Set(['sun', 'cloud', 'rain', 'storm', 'fog', 'rainbow']));
  assert.equal(WEATHER_FADE_SECONDS, 60);
  assert.equal(FIRST_WEATHER, 'sunny');
});

test('what comes next: never the same, storms only from heavy rain, rainbows after rain, then sun', () => {
  for (const [from, options] of Object.entries(WEATHER_NEXT)) {
    assert.ok(from in WEATHER);
    for (const [to, weight] of Object.entries(options)) {
      assert.ok(to in WEATHER && to !== from && weight > 0, `${from} > ${to}`);
    }
  }
  const into = (kind) => Object.keys(WEATHER_NEXT).filter((from) => kind in WEATHER_NEXT[from]);
  assert.deepEqual(into('storm'), ['heavyRain']);
  const share = (from, to) => WEATHER_NEXT[from][to] / Object.values(WEATHER_NEXT[from]).reduce((a, b) => a + b, 0);
  assert.ok(share('rain', 'rainbow') >= 0.3);
  assert.ok(share('storm', 'rainbow') >= 0.3);
  assert.deepEqual(WEATHER_NEXT.rainbow, { sunny: 1 });
  // Picking follows the weights.
  const random = seeded(7);
  const counts = {};
  for (let i = 0; i < 4000; i++) {
    const next = nextWeatherKind('rain', random);
    counts[next] = (counts[next] ?? 0) + 1;
  }
  assert.ok(Math.abs(counts.rainbow / 4000 - share('rain', 'rainbow')) < 0.04);
  assert.equal(counts.storm, undefined);
});

test('over a long while sunny weather takes the most time', () => {
  const weather = createWeatherState(seeded(3));
  const random = seeded(11);
  const time = {};
  for (let i = 0; i < 200000; i++) {
    time[weather.kind] = (time[weather.kind] ?? 0) + 1;
    updateWeather(weather, MINUTE, random);
  }
  const sorted = Object.entries(time).sort((a, b) => b[1] - a[1]);
  assert.equal(sorted[0][0], 'sunny', JSON.stringify(time));
  assert.ok(time.sunny / 200000 > 0.3);
  for (const id of WEATHER_KINDS) assert.ok(time[id] > 0, `${id} never came`);
});

test('changes come in real time, fading over 60 seconds', () => {
  const random = seeded(5);
  const weather = createWeatherState(random);
  assert.equal(weather.kind, 'sunny');
  assert.equal(weatherMix(weather), 1);
  assert.equal(updateWeather(weather, 0, random), false);
  assert.equal(updateWeather(weather, -5, random), false);
  const left = weather.leftMs;
  assert.equal(updateWeather(weather, 1000, random), false);
  assert.equal(weather.leftMs, left - 1000);
  // Up to the end it stays; then the next one fades in.
  assert.equal(updateWeather(weather, weather.leftMs - 1, random), false);
  assert.equal(weather.kind, 'sunny');
  assert.equal(updateWeather(weather, 1, random), true);
  assert.notEqual(weather.kind, 'sunny');
  assert.equal(weather.previous, 'sunny');
  assert.equal(weatherMix(weather), 0);
  updateWeather(weather, 30000, random);
  assert.equal(weatherMix(weather), 0.5);
  updateWeather(weather, 30000, random);
  assert.equal(weatherMix(weather), 1);
  assert.equal(weather.previous, null);
  // The dev menu: set at once, or the next one fading in.
  assert.equal(setWeather(weather, 'storm', random, { fade: false }), true);
  assert.equal(weather.kind, 'storm');
  assert.equal(weatherMix(weather), 1);
  assert.equal(setWeather(weather, 'hail', random), false);
  assert.ok(['heavyRain', 'rain', 'rainbow'].includes(skipWeather(weather, random)));
  assert.equal(weather.previous, 'storm');
  assert.equal(weatherMix(weather), 0);
  assert.ok(weather.leftMs <= WEATHER[weather.kind].minutes[1] * MINUTE);
});

test('the weather is saved and goes on where it was; nothing passes while closed', () => {
  const random = seeded(9);
  const weather = createWeatherState(random);
  setWeather(weather, 'cloudy', random, { fade: false });
  skipWeather(weather, random);
  updateWeather(weather, 20000, random);
  const saved = JSON.parse(JSON.stringify(weather));
  const back = restoreWeatherState(saved, random);
  assert.deepEqual(back, weather);
  // Unusable saves start over sunny.
  for (const bad of [null, undefined, {}, { kind: 'hail', leftMs: 5 }, { kind: 'rain', leftMs: -1 }, { kind: 'rain' }]) {
    const fresh = restoreWeatherState(bad, random);
    assert.equal(fresh.kind, 'sunny');
    assert.equal(fresh.previous, null);
  }
  // Too long a time left is cut to the kind's longest; an odd fade fixed.
  const odd = restoreWeatherState({ kind: 'storm', leftMs: 999 * MINUTE, previous: 'storm', fadeMs: -3 }, random);
  assert.equal(odd.leftMs, 25 * MINUTE);
  assert.equal(odd.previous, null);
  assert.equal(odd.fadeMs, WEATHER_FADE_SECONDS * 1000);
});

const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255);
};

test('the look: blended between the two, fog paler with distance, storms darkest', () => {
  const weather = createWeatherState(seeded(2));
  const sunny = weatherLook(weather);
  assert.equal(sunny.rain, 0);
  assert.equal(sunny.tint.sky.alpha, 0);
  assert.equal(sunny.lightning, false);
  assert.equal(sunny.wind, null);
  setWeather(weather, 'rain', seeded(3));
  const start = weatherLook(weather);
  assert.equal(start.rain, 0);
  assert.equal(start.drop, WEATHER.rain.drop);
  updateWeather(weather, 30000, seeded(4));
  const half = weatherLook(weather);
  assert.equal(half.rain, WEATHER.rain.rain / 2);
  assert.equal(half.tint.sky.color, WEATHER.rain.tint.color);
  assert.ok(Math.abs(half.tint.sky.alpha - WEATHER.rain.tint.sky / 2) < 1e-9);
  // Fog: the hills fade most, the ground least.
  const fog = WEATHER.fog.tint;
  assert.ok(fog.hills > fog.clouds && fog.clouds > fog.sky && fog.sky > fog.ground);
  assert.ok(luminance(fog.color) > 200);
  // Cloudy grey-blue, storms dark slate, and darker as it gets wetter.
  const cloudy = WEATHER.cloudy.tint.color;
  assert.ok(parseInt(cloudy.slice(5), 16) > parseInt(cloudy.slice(1, 3), 16), 'cloudy should be bluish');
  const order = ['cloudy', 'drizzle', 'rain', 'heavyRain', 'storm'].map((id) => luminance(WEATHER[id].tint.color));
  assert.deepEqual([...order].sort((a, b) => b - a), order);
  // Lightning and the storm's wind once a thunderstorm is half there.
  setWeather(weather, 'storm', seeded(5));
  assert.equal(weatherLook(weather).lightning, false);
  updateWeather(weather, 30000, seeded(5));
  assert.equal(weatherLook(weather).lightning, true);
  assert.equal(weatherLook(weather).wind, WIND_PACES.storm);
  setWeather(weather, 'rainbow', seeded(6), { fade: false });
  assert.equal(weatherLook(weather).rainbow, 1);
});

test('the icon and the read-out', () => {
  const weather = createWeatherState(seeded(1));
  assert.deepEqual(weatherView(weather), { kind: 'sunny', name: 'Sunny', icon: 'sun', title: 'Weather: Sunny' });
  setWeather(weather, 'heavyRain', seeded(2), { fade: false });
  assert.equal(weatherView(weather).icon, 'rain');
  assert.match(weatherText(weather), /^Weather: Heavy rain, \d+ min left$/);
  skipWeather(weather, seeded(3));
  assert.match(weatherText(weather), /\(from Heavy rain, 0%\)$/);
  for (const [id, rows] of Object.entries(WEATHER_ICONS)) {
    assert.equal(rows.length, 8, id);
    for (const line of rows) {
      assert.equal(line.length, 8, `${id}: "${line}"`);
      for (const letter of line) assert.ok(letter === ' ' || ICON_COLORS[letter], `${id}: ${letter}`);
    }
    assert.ok(iconPixels(id).length > 8);
  }
  assert.equal(WEATHER_TEXT.lightningSetting, 'Lightning flashes');
});

const lakeGround = { feetRow: 67, water: RAIN_WATER[LAKE_PLACE] };
const AREA = { left: 0, right: 106, top: 0, bottom: 79 };

test('rain: at most 60 drops, 1x2 to 1x3, falling with the slant and landing', () => {
  assert.equal(RAIN.maxDrops, 60);
  const rain = createRain();
  const random = seeded(8);
  const options = { count: 1000, area: AREA, ground: lakeGround, drop: WEATHER.storm.drop, slant: 0.4 };
  let splashes = 0;
  let ripples = 0;
  for (let i = 0; i < 600; i++) {
    updateRain(rain, 1 / 60, options, random);
    assert.ok(rain.drops.length <= RAIN.maxDrops);
    splashes = Math.max(splashes, rain.splashes.length);
    ripples = Math.max(ripples, rain.ripples.length);
  }
  assert.equal(rain.drops.length, RAIN.maxDrops);
  assert.ok(splashes > 0 && ripples > 0);
  for (const drop of rain.drops) {
    const dots = dropDots(drop, 0.4);
    assert.ok(dots.length >= 2 && dots.length <= 3);
    for (const [col, row] of dots) assert.ok(Number.isInteger(col) && Number.isInteger(row));
  }
  // Slanted: they move right as they fall.
  const one = { x: 10, y: 0, length: 3, speed: 100, landRow: 70, kind: 'splash' };
  const solo = { drops: [one], splashes: [], ripples: [], fresh: false };
  updateRain(solo, 0.1, { ...options, count: 0, slant: 0.5 }, random);
  assert.equal(one.y, 10);
  assert.equal(one.x, 15);
  // Drizzle's count, and none at all when it stops (the rest fall out).
  const light = createRain();
  updateRain(light, 1 / 60, { ...options, count: RAIN.maxDrops * WEATHER.drizzle.rain, drop: WEATHER.drizzle.drop }, random);
  assert.equal(light.drops.length, Math.round(RAIN.maxDrops * WEATHER.drizzle.rain));
  for (let i = 0; i < 300; i++) updateRain(light, 1 / 60, { ...options, count: 0, drop: null }, random);
  assert.equal(light.drops.length, 0);
  // Splashes and ripples are short little shapes.
  assert.equal(splashDots({ col: 5, row: 70, age: 0 }).length, 2);
  assert.deepEqual(rippleRuns({ col: 5, row: 70, age: 0 }), [[5, 70, 1]]);
  assert.equal(rippleRuns({ col: 5, row: 70, age: 0.59 }).length, 2);
});

test('rain lands: splashes on the ground line, ripples on the Lake and the paddies, not on the dock', () => {
  const random = seeded(13);
  // Off the water: the ground line, give or take a row.
  for (let i = 0; i < 100; i++) {
    const landing = landingFor(100, lakeGround, random);
    assert.equal(landing.kind, 'splash');
    assert.ok(Math.abs(landing.row - 67) <= 1);
  }
  // The Lake's open water: ripples in it.
  for (let i = 0; i < 100; i++) {
    const landing = landingFor(5, lakeGround, random);
    assert.equal(landing.kind, 'ripple');
    assert.ok(landing.row >= 61 && landing.row <= 79);
  }
  // On the dock: never a ripple inside it.
  for (let i = 0; i < 200; i++) {
    const landing = landingFor(50, lakeGround, random);
    if (landing.kind === 'ripple') assert.ok(landing.row < DOCK.top - 1 || landing.row > DOCK.bottom + 4);
  }
  // The Farm: some on the paddies' water, the rest on the path.
  const farm = { feetRow: 74, water: RAIN_WATER[FARM_PLACE] };
  const kinds = { ripple: 0, splash: 0 };
  for (let i = 0; i < 1000; i++) {
    const landing = landingFor(PADDIES[0].left + 3, farm, random);
    kinds[landing.kind]++;
    if (landing.kind === 'ripple') assert.ok(landing.row >= PADDY_WATER.top && landing.row <= PADDY_WATER.bottom);
  }
  assert.ok(kinds.ripple > 450 && kinds.splash > 250, JSON.stringify(kinds));
  // Past the paddies: the path.
  assert.equal(landingFor(90, farm, random).kind, 'splash');
  // Home's glass: no splash.
  assert.equal(landingFor(10, { feetRow: 30, water: null, splash: false }, random).kind, null);
  assert.deepEqual(INDOOR_PLACES, ['home', 'myHome', 'cafe', 'store', 'post', 'office', 'ramen']);
  assert.ok(INDOOR_PLACES.every((id) => PLACES.some((place) => place.id === id)));
});

test('lightning: one soft pulse at a time, at least 6 seconds apart, bolts far up in the sky', () => {
  assert.ok(LIGHTNING.gap[0] >= 6);
  const levels = LIGHTNING.flash.levels;
  assert.ok(Math.max(...levels) <= 0.4, 'never close to white');
  assert.deepEqual([...levels].sort((a, b) => b - a), levels);
  assert.ok(levels.length * LIGHTNING.flash.step <= 0.4, 'short');
  const state = createLightning(seeded(1));
  const random = seeded(17);
  const strikes = [];
  let t = 0;
  let bolts = 0;
  for (let i = 0; i < 60 * 600; i++) {
    t += 1 / 60;
    if (updateLightning(state, 1 / 60, true, random)) {
      strikes.push(t);
      if (state.bolt) bolts++;
    }
    const level = flashLevel(state);
    assert.ok(level >= 0 && level <= levels[0]);
    for (const [col, row] of boltCells(state)) {
      assert.ok(row >= LIGHTNING.top[0] && row <= LIGHTNING.bottom[1] + 6 && row < 56, 'bolts stay above the hills');
      assert.ok(col >= LIGHTNING.columns[0] - 30 && col <= LIGHTNING.columns[1] + 30);
    }
  }
  assert.ok(strikes.length > 30, `${strikes.length} strikes in 10 minutes`);
  for (let i = 1; i < strikes.length; i++) assert.ok(strikes[i] - strikes[i - 1] >= LIGHTNING.gap[0] - 1e-6);
  assert.ok(bolts > 0 && bolts < strikes.length);
  // One pulse: after a strike the level only goes down, then nothing.
  const pulse = createLightning(() => 0);
  pulse.nextIn = 0;
  updateLightning(pulse, 0.001, true, () => 0.99);
  let before = Infinity;
  for (let i = 0; i < 40; i++) {
    const level = flashLevel(pulse);
    assert.ok(level <= before);
    before = level;
    updateLightning(pulse, 1 / 60, true, () => 0.99);
  }
  assert.equal(flashLevel(pulse), 0);
  // None but in a thunderstorm.
  const calm = createLightning(seeded(2));
  for (let i = 0; i < 60 * 120; i++) assert.equal(updateLightning(calm, 1 / 60, false, random), false);
  assert.ok(makeBolt(seeded(4)).length > LIGHTNING.bottom[0] - LIGHTNING.top[1]);
});

test('the shapes: extra clouds fade in one by one, fog thickest near the horizon, the rainbow an arc', () => {
  const clouds = weatherClouds();
  assert.equal(clouds.length, WEATHER_CLOUDS.count);
  for (const cloud of clouds) {
    assert.ok(cloud.row >= WEATHER_CLOUDS.rows[0] && cloud.row <= WEATHER_CLOUDS.rows[1]);
    assert.ok(cloud.x >= 0 && cloud.x < WEATHER_CLOUDS.period);
    assert.ok(cloud.cells.some(([, , part]) => part === 'top') && cloud.cells.some(([, , part]) => part === 'bottom'));
  }
  assert.equal(cloudAlpha(0, 0), 0);
  assert.equal(cloudAlpha(7, 1), 1);
  assert.equal(cloudAlpha(0, 0.5), 1);
  assert.equal(cloudAlpha(7, 0.5), 0);
  // Fog: the strongest bands near the horizon (the hills, rows 54-62).
  const bands = fogBands(10, 1);
  const strongest = bands.reduce((a, b) => (b.alpha > a.alpha ? b : a));
  assert.ok(strongest.row >= 52 && strongest.row <= 62);
  assert.ok(bands.every((band) => band.alpha <= strongest.alpha));
  assert.deepEqual(fogBands(10, 0), []);
  for (const band of bands) assert.ok(Number.isInteger(band.offset) && band.runs.length > 1);
  assert.notEqual(fogBands(0, 1)[2].offset, fogBands(20, 1)[2].offset, 'the bands drift');
  assert.ok(FOG.bands.length >= 4);
  // The rainbow: rings of its colors, outermost red, only above its center.
  const cells = rainbowCells();
  assert.ok(cells.length > 100);
  assert.ok(cells.every((cell) => cell.row < RAINBOW.center.row));
  assert.ok(new Set(cells.map((cell) => cell.color)).size === RAINBOW.colors.length);
  const top = cells.filter((cell) => cell.x === RAINBOW.center.x).sort((a, b) => a.row - b.row);
  assert.deepEqual(top.map((cell) => cell.color), RAINBOW.colors);
});

test('a storm blows gusts often (the Fortune Tree shares the wind); calm cut short', () => {
  const random = seeded(21);
  const wind = createWind(random);
  let gusts = 0;
  let was = false;
  let push = 0;
  for (let i = 0; i < 60 * 120; i++) {
    updateWind(wind, 1 / 60, random, WIND_PACES.storm);
    if (isGusting(wind) && !was) gusts++;
    was = isGusting(wind);
    push = Math.max(push, Math.abs(windPush(wind)));
  }
  assert.ok(gusts >= 12, `${gusts} gusts in two minutes`);
  assert.equal(push, WIND_PACES.storm.leafPush);
  assert.ok(WIND_PACES.storm.gustEvery[1] < WIND.gustEvery[0]);
  // A long calm from fair weather doesn't hold up the storm.
  const calm = createWind(random);
  calm.calmLeft = 25;
  updateWind(calm, 0.01, random, WIND_PACES.storm);
  assert.ok(calm.calmLeft <= WIND_PACES.storm.gustEvery[1]);
  // The usual breeze is as before.
  const usual = createWind(random);
  usual.calmLeft = 0;
  updateWind(usual, 0.01, random);
  assert.equal(Math.abs(windPush(usual)), WIND.leafPush);
});

test('the Lightning flashes setting: On by default, saved, turned off and on', () => {
  assert.equal(DEFAULT_SETTINGS.lightningFlashes, true);
  assert.equal(restoreSettings(null).lightningFlashes, true);
  assert.equal(restoreSettings({ lightningFlashes: 0 }).lightningFlashes, true);
  const settings = restoreSettings(undefined);
  assert.equal(setLightningFlashes(settings, true), false);
  assert.equal(setLightningFlashes(settings, false), true);
  assert.equal(restoreSettings(JSON.parse(JSON.stringify(settingsSaveData(settings)))).lightningFlashes, false);
});
