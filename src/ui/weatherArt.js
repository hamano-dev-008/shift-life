// weatherArt.js — Draws the weather (ui/weather.js works out what):
// the extra pixel clouds on the clouds layer, the rainbow and far-off
// lightning bolts in the sky, the fog's haze bands, raindrops and their
// splashes in front of everything, ripples on water, the lightning's
// soft flash, the weather through Home's window, and the top bar's icon.
// Whole scene pixels, nearest-neighbour, no smoothing.

import {
  WEATHER_CLOUDS, FOG, RAINBOW, RAIN, SPLASH, RIPPLE, LIGHTNING, HOME_GLASS,
} from '../data/weather.js';
import { LAKE_ART } from '../data/lake.js';
import {
  weatherClouds, cloudAlpha, fogBands, rainbowCells, dropDots, splashDots, rippleRuns, iconPixels,
} from './weather.js';
import { wrapX } from './parallax.js';

// Rows are counted from the top of the backgrounds' pictures, which sit on
// the window's bottom edge.
export function rowY(layout, row) {
  return layout.height - (LAKE_ART.height - row) * layout.scale;
}

// The scene row at canvas y (the other way round).
export function rowAt(layout, y) {
  return LAKE_ART.height - (layout.height - y) / layout.scale;
}

function dot(ctx, layout, col, row, width = 1, height = 1) {
  const { scale } = layout;
  ctx.fillRect(col * scale, rowY(layout, row), width * scale, height * scale);
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a, b, t) {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
}

const cloudCanvases = new Map();
// Extra cloud `index` at shade step `step`, drawn at `scale`.
function cloudCanvas(cloud, index, step, scale) {
  const key = `${index}:${step}:${scale}`;
  if (cloudCanvases.has(key)) return cloudCanvases.get(key);
  const { light, dark, shadeSteps } = WEATHER_CLOUDS;
  const t = shadeSteps > 1 ? step / (shadeSteps - 1) : 0;
  const colors = Object.fromEntries(Object.keys(light).map((part) => [part, mixHex(light[part], dark[part], t)]));
  const width = Math.max(...cloud.cells.map(([dx]) => dx)) + 1;
  const height = Math.max(...cloud.cells.map(([, dy]) => dy)) + 1;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  for (const [dx, dy, part] of cloud.cells) {
    ctx.fillStyle = colors[part];
    ctx.fillRect(dx * scale, dy * scale, scale, scale);
  }
  cloudCanvases.set(key, canvas);
  return canvas;
}

// The extra clouds of cloudy and wet weather, `shift` screen pixels to
// the right (the clouds layer's drift and sway), wrapping.
export function drawWeatherClouds(ctx, layout, look, shift) {
  if (look.clouds <= 0) return;
  const { scale } = layout;
  const step = Math.round(look.shade * (WEATHER_CLOUDS.shadeSteps - 1));
  const period = WEATHER_CLOUDS.period * scale;
  ctx.save();
  weatherClouds().forEach((cloud, index) => {
    const alpha = cloudAlpha(index, look.clouds);
    if (!alpha) return;
    const canvas = cloudCanvas(cloud, index, step, scale);
    ctx.globalAlpha = alpha;
    const y = rowY(layout, cloud.row);
    for (let x = wrapX(cloud.x * scale + shift, period) - period; x < layout.width; x += period) {
      ctx.drawImage(canvas, x, y);
    }
  });
  ctx.restore();
}

let rainbowLayer = null;
// The rainbow, at `strength` (0-1, in eighths), `shift` screen pixels to
// the right.
export function drawRainbow(ctx, layout, strength, shift = 0) {
  const alpha = Math.round(RAINBOW.alpha * strength * 8) / 8;
  if (alpha <= 0) return;
  const cells = rainbowCells();
  const left = Math.min(...cells.map((cell) => cell.x));
  const top = Math.min(...cells.map((cell) => cell.row));
  if (!rainbowLayer) {
    rainbowLayer = document.createElement('canvas');
    rainbowLayer.width = Math.max(...cells.map((cell) => cell.x)) - left + 1;
    rainbowLayer.height = Math.max(...cells.map((cell) => cell.row)) - top + 1;
    const paint = rainbowLayer.getContext('2d');
    for (const cell of cells) {
      paint.fillStyle = cell.color;
      paint.fillRect(cell.x - left, cell.row - top, 1, 1);
    }
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.drawImage(rainbowLayer, left * layout.scale + shift, rowY(layout, top),
    rainbowLayer.width * layout.scale, rainbowLayer.height * layout.scale);
  ctx.restore();
}

// A far-off lightning bolt's cells, with a faint glow either side.
export function drawBolt(ctx, layout, cells, shift = 0) {
  if (!cells.length) return;
  ctx.save();
  ctx.translate(Math.round(shift), 0);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = LIGHTNING.boltGlow;
  for (const [col, row] of cells) {
    dot(ctx, layout, col - 1, row);
    dot(ctx, layout, col + 1, row);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = LIGHTNING.boltColor;
  for (const [col, row] of cells) dot(ctx, layout, col, row);
  ctx.restore();
}

// The fog's haze bands `seconds` in at `strength`, drifting and wrapping;
// each band's top and bottom rows at half its alpha.
export function drawFog(ctx, layout, seconds, strength) {
  const bands = fogBands(seconds, strength);
  if (!bands.length) return;
  ctx.save();
  ctx.fillStyle = FOG.color;
  for (const band of bands) {
    for (let r = 0; r < band.height; r++) {
      const edge = band.height > 2 && (r === 0 || r === band.height - 1);
      ctx.globalAlpha = edge ? band.alpha / 2 : band.alpha;
      for (const run of band.runs) {
        const start = wrapX(run.start + band.offset, FOG.period);
        dot(ctx, layout, start, band.row + r, run.length);
        if (start + run.length > FOG.period) dot(ctx, layout, start - FOG.period, band.row + r, run.length);
      }
    }
  }
  ctx.restore();
}

// Raindrops and their splashes, in front of the scene.
export function drawRain(ctx, layout, rain, slant, look) {
  if (!rain.drops.length && !rain.splashes.length) return;
  ctx.save();
  ctx.globalAlpha = RAIN.alpha;
  ctx.fillStyle = look.drop?.color ?? '#b5c9e3';
  for (const drop of rain.drops) {
    for (const [col, row] of dropDots(drop, slant)) dot(ctx, layout, col, row);
  }
  ctx.globalAlpha = SPLASH.alpha;
  ctx.fillStyle = SPLASH.color;
  for (const splash of rain.splashes) {
    for (const [col, row] of splashDots(splash)) dot(ctx, layout, col, row);
  }
  ctx.restore();
}

// Ripples where drops land on water (behind the character).
export function drawRipples(ctx, layout, rain) {
  if (!rain.ripples.length) return;
  ctx.save();
  ctx.globalAlpha = RIPPLE.alpha;
  ctx.fillStyle = RIPPLE.color;
  for (const ripple of rain.ripples) {
    for (const [col, row, width] of rippleRuns(ripple)) dot(ctx, layout, col, row, width);
  }
  ctx.restore();
}

// The lightning's soft whitening over `rect` ({ left, top, width,
// height }, canvas pixels) at `level`.
export function drawFlash(ctx, rect, level) {
  if (level <= 0) return;
  ctx.save();
  ctx.globalAlpha = level;
  ctx.fillStyle = LIGHTNING.flash.color;
  ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  ctx.restore();
}

// Home's window glass in canvas pixels ({ left, top, width, height }) and
// in scene pixels (`area`: { left, right, top, bottom }), or null without
// the window.
export function glassRect(layout) {
  const prop = layout.props[HOME_GLASS.prop];
  if (!prop) return null;
  const { scale } = layout;
  const left = prop.x + HOME_GLASS.left * scale;
  const top = prop.baseY - prop.height * scale + HOME_GLASS.top * scale;
  const width = (prop.width - HOME_GLASS.left - HOME_GLASS.right) * scale;
  const height = (prop.height - HOME_GLASS.top - HOME_GLASS.bottom) * scale;
  const area = {
    left: left / scale,
    right: (left + width) / scale - 1,
    top: rowAt(layout, top),
    bottom: rowAt(layout, top + height) - 1,
  };
  return { left, top, width, height, area };
}

// The weather seen through Home's window: the sky's tint, a little fog,
// the rain falling (only in the glass) and the lightning's flash.
export function drawGlassWeather(ctx, layout, look, rain, slant, flash) {
  const glass = glassRect(layout);
  if (!glass) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(glass.left, glass.top, glass.width, glass.height);
  ctx.clip();
  const sky = look.tint.sky;
  if (sky.alpha > 0) {
    ctx.globalAlpha = sky.alpha;
    ctx.fillStyle = sky.color;
    ctx.fillRect(glass.left, glass.top, glass.width, glass.height);
  }
  if (look.fog > 0) {
    ctx.globalAlpha = 0.45 * look.fog;
    ctx.fillStyle = FOG.color;
    ctx.fillRect(glass.left, glass.top, glass.width, glass.height);
  }
  ctx.globalAlpha = 1;
  drawRain(ctx, layout, rain, slant, look);
  drawFlash(ctx, glass, flash);
  ctx.restore();
}

// The top bar's weather icon on its 8 x 8 canvas.
export function drawWeatherIcon(canvas, icon) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const { x, y, color } of iconPixels(icon)) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }
}
