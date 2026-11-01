// assets.js — Loads the sprite PNGs in assets/sprites/ at startup and
// draws their frames crisply. Which files exist comes from the main
// process; frame layout comes from data/sprites.js. Drawing code asks
// getSprite(name) and falls back to its code-drawn art when it's null.

import { SPRITES, DEFAULT_FRAME_DURATION } from '../data/sprites.js';

// The sprite folder, relative to src/index.html.
const SPRITE_FOLDER = '../assets/sprites/';

const sprites = new Map();

// Turns a loaded image and its data entry into a sprite: { image, frames,
// frameWidth, frameHeight, frameDuration, anchorX }, or null (with a
// warning) if the image is too small for the frames it's said to have.
function toSprite(name, image, info) {
  const frames = Number.isInteger(info.frames) && info.frames > 0 ? info.frames : 1;
  const frameWidth = info.frameWidth ?? Math.floor(image.naturalWidth / frames);
  const frameHeight = info.frameHeight ?? image.naturalHeight;
  if (frameWidth < 1 || frameHeight < 1 || frameWidth * frames > image.naturalWidth
    || frameHeight > image.naturalHeight) {
    console.warn(`Sprite ${name}: the image is too small for ${frames} frames of ${frameWidth}x${frameHeight}; using the code-drawn art.`);
    return null;
  }
  return {
    image,
    frames,
    frameWidth,
    frameHeight,
    frameDuration: info.frameDuration > 0 ? info.frameDuration : DEFAULT_FRAME_DURATION,
    anchorX: info.anchorX ?? Math.floor(frameWidth / 2),
  };
}

// Loads every PNG in assets/sprites/. Call once at startup, before
// anything is drawn. A file that fails to load is skipped with a warning.
export async function loadSprites() {
  const files = await window.shiftLife.listSprites();
  await Promise.all(files.map(async (file) => {
    const name = file.replace(/\.png$/i, '');
    const image = new Image();
    image.src = SPRITE_FOLDER + encodeURIComponent(file);
    try {
      await image.decode();
    } catch {
      console.warn(`Sprite ${name}: ${file} could not be loaded; using the code-drawn art.`);
      return;
    }
    const sprite = toSprite(name, image, SPRITES[name] ?? {});
    if (sprite) sprites.set(name, sprite);
  }));
}

// The sprite called `name`, or null if there's no PNG for it.
export function getSprite(name) {
  return sprites.get(name) ?? null;
}

export function isAnimated(sprite) {
  return sprite.frames > 1;
}

// The frame to show `seconds` into a time-played animation (looping).
export function frameAtTime(sprite, seconds) {
  return Math.floor(Math.max(0, seconds) / sprite.frameDuration) % sprite.frames;
}

// The frame for `progress` (0 to 1) through one loop of the animation.
export function frameAtProgress(sprite, progress) {
  return Math.min(sprite.frames - 1, Math.floor(Math.max(0, progress) * sprite.frames));
}

// Draws frame `frame` scaled up by `scale` (whole numbers), with its
// bottom edge at canvas row bottomY and its column `anchorCol` at canvas
// x. `flip` mirrors it around x. Positions are rounded to whole pixels
// and scaling is nearest-neighbour, so pixels stay crisp squares.
export function drawSprite(ctx, sprite, frame, x, bottomY, scale, { anchorCol = 0, flip = false } = {}) {
  const { image, frameWidth: w, frameHeight: h } = sprite;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(bottomY) - h * scale);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, frame * w, 0, w, h, -anchorCol * scale, 0, w * scale, h * scale);
  ctx.restore();
}
