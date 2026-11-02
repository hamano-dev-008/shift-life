// catchReveal.js — Draws the catch reveal over the scene when a fish is
// landed: first the fish's dark silhouette flashing (the suspense), then
// a card that pops in with the fish drawn big on a burst of light rays in
// its rarity's color, the rarity banner, its name, size and value, and
// NEW! / NEW RECORD! badges; sparkles for rare and legendary fish, and
// for legendary a gold flash over the window and slowly turning rays. It
// fades out by itself, or sooner when clicked (an invisible button over
// the card; nothing takes focus). Reveals wait their turn in a short
// queue. Timing and text come from game/catchReveal.js, numbers and
// colors from data/catchReveal.js.

import {
  REVEAL_CARD, REVEAL_COLORS, REVEAL_RARITIES, REVEAL_MAX_QUEUED,
} from '../data/catchReveal.js';
import {
  createReveal, revealLength, revealStage, closeReveal, revealText,
} from '../game/catchReveal.js';
import { drawFishIcon, fishIconSize } from './fishing.js';
import { placeOver } from './bubble.js';

const FONT = "8px 'Press Start 2P', monospace";
const BIG_FONT = "16px 'Press Start 2P', monospace";

// A repeatable 0-1 number for (a, b), for sparkle spots.
function noise(a, b) {
  const value = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

// Where the card sits in a `width` x `height` window, at full size.
export function cardRect(width, height) {
  const { width: w, height: h } = REVEAL_CARD;
  return { left: Math.round((width - w) / 2), top: Math.round((height - h) / 2), width: w, height: h };
}

// A pixel-rounded box: `inset` pixels in from the canvas edges, its
// corners cut by `cut`.
function box(ctx, inset, w, h, cut, color) {
  ctx.fillStyle = color;
  ctx.fillRect(inset + cut, inset, w - 2 * (inset + cut), h - 2 * inset);
  ctx.fillRect(inset, inset + cut, w - 2 * inset, h - 2 * (inset + cut));
  if (cut > 1) ctx.fillRect(inset + 1, inset + 1, w - 2 * (inset + 1), h - 2 * (inset + 1));
}

// The light rays behind the fish, on a grid of `rayPixel` squares: rays
// of `color` on `light`, turned by `spin` (0 to 1), with a bright glow
// in the middle.
function drawRays(ctx, art, rarity, spin) {
  const px = REVEAL_CARD.rayPixel;
  const cols = Math.ceil(art.width / px);
  const rows = Math.ceil(art.height / px);
  ctx.fillStyle = rarity.light;
  ctx.fillRect(art.left, art.top, art.width, art.height);
  ctx.fillStyle = rarity.color;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = col + 0.5 - cols / 2;
      const dy = row + 0.5 - rows / 2;
      // Leave a glow around the fish.
      if ((dx / (cols / 2)) ** 2 + (dy / (rows / 2)) ** 2 < 0.3) continue;
      const turn = Math.atan2(dy, dx) / (2 * Math.PI) + 1 + spin;
      if (Math.floor(turn * rarity.rays * 2) % 2) continue;
      const left = art.left + col * px;
      const top = art.top + row * px;
      ctx.fillRect(left, top, Math.min(px, art.left + art.width - left), Math.min(px, art.top + art.height - top));
    }
  }
}

// Sparkles twinkling around the art: each lives one cycle at its own
// spot (a dot, a plus, a dot), then shows up somewhere else.
function drawSparkles(ctx, art, count, time) {
  const { cycle, size } = REVEAL_CARD.sparkle;
  for (let i = 0; i < count; i++) {
    const age = time / cycle + i / count;
    const round = Math.floor(age);
    const progress = age - round;
    const x = art.left + size * 2 + Math.floor(noise(i, round) * (art.width - size * 5) / size) * size;
    const y = art.top + size * 2 + Math.floor(noise(round, i + 7) * (art.height - size * 5) / size) * size;
    const big = progress > 0.3 && progress < 0.7;
    // A dark rim one sparkle pixel around it, then the white: a plus at
    // its brightest, a dot otherwise.
    ctx.fillStyle = REVEAL_COLORS.sparkleRim;
    if (big) {
      ctx.fillRect(x - size * 2, y - size, size * 5, size * 3);
      ctx.fillRect(x - size, y - size * 2, size * 3, size * 5);
      ctx.fillStyle = REVEAL_COLORS.sparkle;
      ctx.fillRect(x - size, y, size * 3, size);
      ctx.fillRect(x, y - size, size, size * 3);
    } else {
      ctx.fillRect(x - size, y, size * 3, size);
      ctx.fillRect(x, y - size, size, size * 3);
      ctx.fillStyle = REVEAL_COLORS.sparkle;
      ctx.fillRect(x, y, size, size);
    }
  }
}

// The fish's scale and bottom row so it sits in the middle of the art.
function fishPlace(id, art) {
  const { width, height } = fishIconSize(id);
  const room = REVEAL_CARD.fishMargin * 2;
  const scale = Math.max(1, Math.min(REVEAL_CARD.fishScale,
    Math.floor((art.width - room) / width), Math.floor((art.height - room) / height)));
  return {
    scale,
    x: art.left + art.width / 2,
    bottom: art.top + Math.round((art.height + height * scale) / 2),
  };
}

function badge(ctx, text, color, x, y, alignRight) {
  const { height, padding } = REVEAL_CARD.badge;
  ctx.font = FONT;
  const width = Math.ceil(ctx.measureText(text).width) + padding * 2;
  const left = alignRight ? x - width : x;
  ctx.fillStyle = REVEAL_COLORS.border;
  ctx.fillRect(left - 1, y - 1, width + 2, height + 2);
  ctx.fillStyle = color;
  ctx.fillRect(left, y, width, height);
  ctx.fillStyle = REVEAL_COLORS.badgeText;
  ctx.textAlign = 'left';
  ctx.fillText(text, left + padding, y + height - 2);
}

// Paints the whole card at full size on `ctx` (its own canvas).
function paintCard(ctx, reveal, look) {
  const { width: w, height: h, banner, art } = REVEAL_CARD;
  const rarity = REVEAL_RARITIES[reveal.rarity];
  const text = revealText(reveal);
  ctx.clearRect(0, 0, w, h);
  box(ctx, 0, w, h, 2, REVEAL_COLORS.border);
  box(ctx, 2, w, h, 2, REVEAL_COLORS.card);
  // The rarity banner, with a line under it.
  ctx.fillStyle = rarity.color;
  ctx.fillRect(4, 2, w - 8, 2);
  ctx.fillRect(2, 4, w - 4, banner - 2);
  ctx.fillStyle = REVEAL_COLORS.border;
  ctx.fillRect(2, banner + 2, w - 4, 2);
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.fillStyle = REVEAL_COLORS.border;
  const baseline = 2 + Math.floor((banner + 8) / 2);
  ctx.fillText(text.banner, w / 2, baseline + 1);
  ctx.fillStyle = REVEAL_COLORS.bannerText;
  ctx.fillText(text.banner, w / 2, baseline);

  // The art: rays, sparkles and the fish, framed.
  ctx.fillStyle = REVEAL_COLORS.border;
  ctx.fillRect(art.left - 2, art.top - 2, art.width + 4, art.height + 4);
  drawRays(ctx, art, rarity, look.spin);
  if (rarity.sparkles) drawSparkles(ctx, art, rarity.sparkles, look.time);
  const fish = fishPlace(reveal.fish, art);
  drawFishIcon(ctx, reveal.fish, fish.x, fish.bottom, fish.scale, { exact: true });
  const { inset } = REVEAL_CARD.badge;
  text.badges.forEach((item, i) => {
    const color = item.kind === 'record' ? REVEAL_COLORS.recordBadge : REVEAL_COLORS.newBadge;
    badge(ctx, item.text, color, i ? art.left + art.width - inset : art.left + inset, art.top + inset, i > 0);
  });

  // Name, then size and value (or junk's joke).
  ctx.textAlign = 'center';
  ctx.fillStyle = REVEAL_COLORS.text;
  ctx.font = BIG_FONT;
  if (text.junk || ctx.measureText(text.title).width > w - 12) ctx.font = FONT;
  ctx.fillText(text.title, w / 2, REVEAL_CARD.titleY);
  ctx.font = FONT;
  ctx.fillStyle = REVEAL_COLORS.muted;
  ctx.fillText(text.detail, w / 2, REVEAL_CARD.detailY);
}

// `button` is the invisible #reveal-close over the card. Returns { show
// (caught, { suspense }), draw(ctx, now), isOpen(), clear() }.
export function createCatchReveal(button) {
  const queue = [];
  let current = null;
  let startedAt = 0;
  let last = 0;
  const card = document.createElement('canvas');
  card.width = REVEAL_CARD.width;
  card.height = REVEAL_CARD.height;
  const cardCtx = card.getContext('2d');
  cardCtx.imageSmoothingEnabled = false;

  button.addEventListener('click', () => {
    if (current) closeReveal(current, (last - startedAt) / 1000);
  });

  function finish() {
    current = null;
    button.hidden = true;
  }

  return {
    // Queues the reveal for a landed catch (its `reveal`), or a preview.
    show(caught, options) {
      queue.push(createReveal(caught, options));
      if (queue.length > REVEAL_MAX_QUEUED) queue.shift();
    },
    isOpen: () => Boolean(current) || queue.length > 0,
    clear() {
      queue.length = 0;
      finish();
    },
    // Call every frame, after the scene, with performance.now() ms.
    draw(ctx, now) {
      last = now;
      if (!current && queue.length) {
        current = queue.shift();
        startedAt = now;
      }
      if (!current) return;
      const seconds = (now - startedAt) / 1000;
      if (seconds >= revealLength(current)) {
        finish();
        return;
      }
      const look = revealStage(current, seconds);
      const { width, height } = ctx.canvas;
      const rect = cardRect(width, height);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (look.stage === 'suspense') {
        // The dark silhouette where the fish will be, flashing.
        if (look.silhouette) {
          const art = { ...REVEAL_CARD.art, left: rect.left + REVEAL_CARD.art.left, top: rect.top + REVEAL_CARD.art.top };
          const fish = fishPlace(current.fish, art);
          drawFishIcon(ctx, current.fish, fish.x, fish.bottom, fish.scale,
            { exact: true, silhouette: REVEAL_COLORS.silhouette });
        }
      } else {
        paintCard(cardCtx, current, look);
        const w = Math.round(rect.width * look.scale);
        const h = Math.round(rect.height * look.scale);
        ctx.globalAlpha = Math.max(0, look.alpha);
        ctx.drawImage(card, Math.round(rect.left + (rect.width - w) / 2), Math.round(rect.top + (rect.height - h) / 2), w, h);
        if (look.flash > 0) {
          ctx.globalAlpha = look.flash * 0.85;
          ctx.fillStyle = REVEAL_COLORS.flash;
          ctx.fillRect(0, 0, width, height);
        }
      }
      ctx.restore();
      button.hidden = look.stage === 'suspense' || look.stage === 'done';
      if (!button.hidden) placeOver(button, rect);
    },
  };
}
