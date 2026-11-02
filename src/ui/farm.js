// farm.js — Draws the Farm's rice (data/farm.js), over the background's
// paddies: seedlings (tiny green tufts in rows), young rice (taller
// green), ripe rice (golden, heads bending, gently swaying), and weeds,
// each from its sprite (farm.rice.seedling / young / ripe, farm.weeds)
// or in code. Also the code-drawn ground used without the background
// picture (farm.ground): the dirt path and the paddies' banks and water.
// Positions are in the picture's pixels (rows from its top), drawn at
// SCENE_SCALE from the window's bottom-left corner.

import {
  FARM_ART, PADDIES, PADDY_WATER, RICE_ART, FARM_GROUND,
} from '../data/farm.js';
import { getSprite, isAnimated, frameAtTime, drawSprite } from './assets.js';

// Fills picture pixels (col, row, w, h) on the canvas.
function painter(ctx, layout) {
  const { scale } = layout;
  const top = layout.height - FARM_ART.height * scale;
  return (col, row, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(col * scale, top + row * scale, w * scale, h * scale);
  };
}

// The ground without the picture: the dirt path along the bottom and each
// paddy's bank and water (sky and grass are drawn first).
export function drawFarmGround(ctx, layout) {
  const px = painter(ctx, layout);
  const { path, bank, bankLight } = FARM_GROUND;
  px(0, path.top, FARM_ART.width, path.bottom - path.top + 1, path.color);
  px(0, path.top, FARM_ART.width, 1, path.edge);
  for (const paddy of PADDIES) {
    const width = paddy.right - paddy.left + 1;
    const height = PADDY_WATER.bottom - PADDY_WATER.top + 1;
    px(paddy.left - 1, PADDY_WATER.top - 1, width + 2, height + 2, bank);
    px(paddy.left - 1, PADDY_WATER.top - 1, width + 2, 1, bankLight);
    px(paddy.left, PADDY_WATER.top, width, height, RICE_ART.water);
  }
}

// Seedlings: tiny tufts (a dark root pixel, a light tip) in two rows,
// every third column, staggered.
function drawSeedlings(px, paddy) {
  const rows = [PADDY_WATER.top + 1, PADDY_WATER.top + 3];
  rows.forEach((row, i) => {
    for (let col = paddy.left + 1 + i; col <= paddy.right - 1; col += 3) {
      px(col, row, 1, 1, RICE_ART.seedlingDark);
      px(col, row - 1, 1, 1, RICE_ART.seedling);
    }
  });
}

// Young rice: green stalks every other column, of two heights, rising
// above the water.
function drawYoung(px, paddy) {
  const bottom = PADDY_WATER.bottom;
  for (let col = paddy.left + 1; col <= paddy.right - 1; col += 2) {
    const tall = (col - paddy.left) % 4 === 1 ? 6 : 5;
    px(col, bottom - tall + 1, 1, tall, RICE_ART.youngDark);
    px(col, bottom - tall + 1, 1, 2, RICE_ART.young);
  }
}

// Ripe rice: golden stalks with heavy heads bending to one side; a ready
// paddy sways, each stalk's head leaning one way then the other a little
// after its neighbour.
function drawRipe(px, paddy, seconds) {
  const bottom = PADDY_WATER.bottom;
  for (let col = paddy.left + 1; col <= paddy.right - 1; col += 2) {
    const tall = 7;
    const top = bottom - tall + 1;
    px(col, top + 1, 1, tall - 1, RICE_ART.ripeDark);
    const phase = Math.floor((seconds + (col - paddy.left) * 0.08) / RICE_ART.swayEvery) % 2;
    const lean = phase ? 1 : 0;
    px(col + lean, top, 1, 2, RICE_ART.ripe);
    px(col + lean, top - 1, 1, 1, RICE_ART.head);
  }
}

// Weeds: three scraggly bushy clumps rising from the water, darker than
// the rice with yellow-green leaves sticking out, so they stand out.
function drawWeeds(px, paddy) {
  const middle = Math.floor((paddy.left + paddy.right) / 2);
  const bottom = PADDY_WATER.bottom;
  for (const col of [paddy.left + 3, middle, paddy.right - 3]) {
    px(col - 1, bottom - 2, 3, 3, RICE_ART.weeds);
    px(col, bottom - 4, 1, 2, RICE_ART.weeds);
    px(col - 2, bottom - 3, 1, 1, RICE_ART.weedsLight);
    px(col - 1, bottom - 2, 1, 1, RICE_ART.weedsLight);
    px(col + 1, bottom - 4, 1, 1, RICE_ART.weedsLight);
    px(col + 2, bottom - 2, 1, 1, RICE_ART.weedsLight);
    px(col, bottom - 5, 1, 1, RICE_ART.weedsLight);
  }
}

const CODE = { seedling: drawSeedlings, young: drawYoung, ripe: drawRipe };

// Tiles `sprite` across the paddy's water from its left column, the
// tile's bottom on the water's bottom row, clipped at its right column.
function tileSprite(ctx, layout, sprite, frame, paddy) {
  const { scale } = layout;
  const top = layout.height - FARM_ART.height * scale;
  const bottomY = top + (PADDY_WATER.bottom + 1) * scale;
  const left = paddy.left * scale;
  const width = (paddy.right - paddy.left + 1) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, 0, width, bottomY);
  ctx.clip();
  for (let x = left; x < left + width; x += sprite.frameWidth * scale) {
    drawSprite(ctx, sprite, frame, x, bottomY, scale);
  }
  ctx.restore();
}

// Draws each paddy's rice and weeds as `looks` says ([{ id, stage, weeds
// }] from paddiesLook() in game/farm.js), `seconds` in (the sway).
export function drawFarmCrops(ctx, layout, looks, seconds) {
  const px = painter(ctx, layout);
  for (const look of looks) {
    const paddy = PADDIES.find((candidate) => candidate.id === look.id);
    if (!paddy) continue;
    if (look.stage !== 'empty') {
      const sprite = getSprite(`farm.rice.${look.stage}`);
      if (sprite) {
        tileSprite(ctx, layout, sprite, isAnimated(sprite) ? frameAtTime(sprite, seconds) : 0, paddy);
      } else {
        CODE[look.stage](px, paddy, seconds);
      }
    }
    if (look.weeds) {
      const sprite = getSprite('farm.weeds');
      if (sprite) {
        const { scale } = layout;
        const top = layout.height - FARM_ART.height * scale;
        const middle = Math.floor((paddy.left + paddy.right + 1) / 2);
        drawSprite(ctx, sprite, 0, (middle - Math.floor(sprite.frameWidth / 2)) * scale,
          top + (PADDY_WATER.bottom + 1) * scale, scale);
      } else {
        drawWeeds(px, paddy);
      }
    }
  }
}
