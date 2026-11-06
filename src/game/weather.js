// weather.js — The game's weather (data/weather.js), the same in every
// place: what it is, how long it has left (real time, so it pauses while
// the app is closed), which comes next (weighted), the fade from the last
// one, and how it looks right now blended between the two (for drawing).
// game.weather is saved: { kind, leftMs, previous (null once nothing is
// fading out), fadeMs (real ms into the fade) }. Also what the weather
// does that other game code reads (WEATHER_EFFECTS: the rice's growth,
// fishing's bites, busking's pay, storms), and the life's weather moments
// (game.weatherSeen, saved: { rainbow } once the first rainbow came).

import {
  WEATHER, FIRST_WEATHER, WEATHER_NEXT, WEATHER_FADE_SECONDS, WIND_PACES, WEATHER_TEXT, WEATHER_EFFECTS,
} from '../data/weather.js';
import { PARALLAX_LAYERS } from '../data/parallax.js';

const FADE_MS = WEATHER_FADE_SECONDS * 1000;

export const WEATHER_KINDS = Object.keys(WEATHER);

// How long `kind` lasts this time, in real ms (WEATHER[kind].minutes).
export function weatherDurationMs(kind, random = Math.random) {
  const [min, max] = WEATHER[kind].minutes;
  return (min + (max - min) * random()) * 60000;
}

// The weather a new game starts with: FIRST_WEATHER, fully there.
export function createWeatherState(random = Math.random) {
  return { kind: FIRST_WEATHER, leftMs: weatherDurationMs(FIRST_WEATHER, random), previous: null, fadeMs: FADE_MS };
}

// The saved weather, or a fresh one when it's missing or not usable.
export function restoreWeatherState(data, random = Math.random) {
  if (!data || !(data.kind in WEATHER) || !(Number.isFinite(data.leftMs) && data.leftMs > 0)) {
    return createWeatherState(random);
  }
  const previous = data.previous in WEATHER && data.previous !== data.kind ? data.previous : null;
  const fadeMs = Number.isFinite(data.fadeMs) ? Math.min(Math.max(data.fadeMs, 0), FADE_MS) : FADE_MS;
  const fading = previous && fadeMs < FADE_MS;
  return {
    kind: data.kind,
    leftMs: Math.min(data.leftMs, WEATHER[data.kind].minutes[1] * 60000),
    previous: fading ? previous : null,
    fadeMs: fading ? fadeMs : FADE_MS,
  };
}

// What comes after `kind`, picked by WEATHER_NEXT's weights.
export function nextWeatherKind(kind, random = Math.random) {
  const options = Object.entries(WEATHER_NEXT[kind] ?? { [FIRST_WEATHER]: 1 });
  const total = options.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [next, weight] of options) {
    roll -= weight;
    if (roll < 0) return next;
  }
  return options[options.length - 1][0];
}

function changeTo(weather, kind, random) {
  weather.previous = weather.kind === kind ? null : weather.kind;
  weather.kind = kind;
  weather.leftMs = weatherDurationMs(kind, random);
  weather.fadeMs = weather.previous ? 0 : FADE_MS;
}

// Moves the weather on by `realMs` real milliseconds: the fade goes on,
// and once its time is up the next weather comes (fading in). Returns
// whether it changed.
export function updateWeather(weather, realMs, random = Math.random) {
  if (!(realMs > 0)) return false;
  weather.fadeMs = Math.min(FADE_MS, weather.fadeMs + realMs);
  if (weather.fadeMs >= FADE_MS) weather.previous = null;
  weather.leftMs -= realMs;
  if (weather.leftMs > 0) return false;
  changeTo(weather, nextWeatherKind(weather.kind, random), random);
  return true;
}

// The dev menu: weather `kind` now, for its full time (fading in, or at
// once with `fade` false).
export function setWeather(weather, kind, random = Math.random, { fade = true } = {}) {
  if (!(kind in WEATHER)) return false;
  changeTo(weather, kind, random);
  if (!fade) {
    weather.previous = null;
    weather.fadeMs = FADE_MS;
  }
  return true;
}

// The dev menu's "Next weather": the next one comes now.
export function skipWeather(weather, random = Math.random) {
  changeTo(weather, nextWeatherKind(weather.kind, random), random);
  return weather.kind;
}

// How far the new weather has faded in (0-1; 1 with nothing fading out).
export function weatherMix(weather) {
  return weather.previous ? Math.min(1, weather.fadeMs / FADE_MS) : 1;
}

const lerp = (a, b, t) => a + (b - a) * t;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

// Layer `layer`'s tint blended from `from` to `to` (WEATHER entries) by
// `mix`: { color, alpha }, the color weighted by each side's strength.
function blendTint(from, to, layer, mix) {
  const a = (from.tint?.[layer] ?? 0) * (1 - mix);
  const b = (to.tint?.[layer] ?? 0) * mix;
  const alpha = a + b;
  if (alpha <= 0) return { color: '#000000', alpha: 0 };
  const colorA = hexToRgb(from.tint?.color ?? '#000000');
  const colorB = hexToRgb(to.tint?.color ?? '#000000');
  return { color: rgbToHex(colorA.map((v, i) => (v * a + colorB[i] * b) / alpha)), alpha };
}

// How the weather looks now, blended from the one fading out to the one
// fading in: { kind, previous, mix, rain, wet, clouds, shade, cloudSpeed,
// fog, rainbow, slant (the numbers in WEATHER, blended), tint: { sky,
// clouds, hills, ground: { color, alpha } }, drop (the raindrops' look:
// the kind with rain that's more there), wind (its pace, WIND_PACES, of
// the kind more there, or null for the usual breeze), lightning (a
// thunderstorm more than half there) }.
export function weatherLook(weather) {
  const mix = weatherMix(weather);
  const to = WEATHER[weather.kind];
  const from = WEATHER[weather.previous ?? weather.kind];
  const blend = (key) => lerp(from[key], to[key], mix);
  const main = mix >= 0.5 ? to : from;
  const rainy = to.drop && (mix >= 0.5 || !from.drop) ? to : from.drop ? from : to;
  return {
    kind: weather.kind,
    previous: weather.previous,
    mix,
    rain: blend('rain'),
    wet: blend('wet'),
    clouds: blend('clouds'),
    shade: blend('shade'),
    cloudSpeed: blend('cloudSpeed'),
    fog: blend('fog'),
    rainbow: blend('rainbow'),
    slant: blend('slant'),
    tint: Object.fromEntries(PARALLAX_LAYERS.map((layer) => [layer, blendTint(from, to, layer, mix)])),
    drop: rainy.drop ?? null,
    wind: main.wind ? WIND_PACES[main.wind] : null,
    lightning: Boolean(main.lightning),
  };
}

// The top bar's icon: { kind, name, icon, title }.
export function weatherView(weather) {
  const { name, icon } = WEATHER[weather.kind];
  return { kind: weather.kind, name, icon, title: WEATHER_TEXT.title.replaceAll('{name}', name) };
}

// The dev read-out's weather line.
export function weatherText(weather) {
  let text = WEATHER_TEXT.readout
    .replaceAll('{name}', WEATHER[weather.kind].name)
    .replaceAll('{left}', String(Math.ceil(weather.leftMs / 60000)));
  if (weather.previous) {
    text += WEATHER_TEXT.fading
      .replaceAll('{previous}', WEATHER[weather.previous].name)
      .replaceAll('{percent}', String(Math.round(weatherMix(weather) * 100)));
  }
  return text;
}

// ---- What the weather does ----

// The weather coming in now (game.weather.kind), or null without one.
export function weatherKindOf(game) {
  return game.weather?.kind ?? null;
}

// Whether the weather now is one of `kinds`.
export function weatherIn(game, kinds) {
  return kinds.includes(weatherKindOf(game));
}

// A thunderstorm (WEATHER_EFFECTS.storm): fishing and busking stop.
export function isStormy(game) {
  return weatherIn(game, WEATHER_EFFECTS.storm.kinds);
}

// How many times as fast the rice grows now.
export function riceGrowthSpeed(game) {
  const { kinds, speed } = WEATHER_EFFECTS.riceGrowth;
  return weatherIn(game, kinds) ? speed : 1;
}

// How many times as fast fishing's wait for a bite passes now.
export function biteSpeed(game) {
  const { kinds, speed } = WEATHER_EFFECTS.bites;
  return weatherIn(game, kinds) ? speed : 1;
}

// A busking session's pay now, from its usual `pay` (whole dollars).
export function buskingPay(game, pay) {
  const { kinds, share } = WEATHER_EFFECTS.buskingPay;
  return weatherIn(game, kinds) ? Math.round(pay * share) : pay;
}

// Whether activity `id` can't go on (or start) in this weather.
export function stormStops(game, id) {
  return isStormy(game) && WEATHER_EFFECTS.storm.activities.includes(id);
}

// Whether the Farm's chickens are in the barn (WEATHER_EFFECTS.animals).
export function animalsInBarn(game) {
  return weatherIn(game, WEATHER_EFFECTS.animals.kinds);
}

// Whether the Lake's butterflies stay away (WEATHER_EFFECTS.butterflies).
export function butterfliesAway(game) {
  return weatherIn(game, WEATHER_EFFECTS.butterflies.kinds);
}

// The life's weather moments: none yet.
export function createWeatherSeenState() {
  return { rainbow: false };
}

export function restoreWeatherSeenState(data) {
  return { rainbow: data?.rainbow === true };
}
