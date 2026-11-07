// cafeLifeArt.js — Draws the Cafe's life (ui/cafeLife.js): the master
// behind the counter and the customers with the character art
// (drawCharacter(), at CHARACTER_SCALE), the cup being polished, the
// customers' cups and their steam, the siphons bubbling while brewed, and
// Tama the cat on the sill (code-drawn at SCENE_SCALE with an outline).
// The master goes in first, then the counter's front over them
// (ui/cafe.js), then the rest (drawCafeLifeFront()).

import {
  CAFE_ART, CAFE_COUNTER, CAFE_SILL, CAFE_TABLE, CAFE_MASTER, CAFE_CAT, CAFE_CUP, CAFE_SIPHONS, CAFE_SEATS,
  ORDER_SEAT,
} from '../data/cafe.js';
import { masterRow } from './cafeLife.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { drawCharacter, heldHand } from './sprite.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { personPose, pictureRowY } from './people.js';

// Canvas y of the top edge of picture row `row`.
const rowY = (layout, row) => pictureRowY(layout, CAFE_ART.height, row);

// A cup held at `hand` (heldHand()), with a cloth going round it while
// polished (`polishing` seconds in, or null).
export function drawHeldCup(ctx, hand, polishing = null) {
  const u = hand.unit;
  const left = hand.x - u / 2 + hand.facing * u;
  ctx.fillStyle = CAFE_CUP.colors.cup;
  ctx.fillRect(left - (hand.facing < 0 ? u : 0), hand.y - u * 1.5, u * 2, u * 2);
  if (polishing === null) return;
  ctx.fillStyle = '#7fa6c9';
  const round = Math.floor(polishing * 4) % 2;
  ctx.fillRect(left + (round ? u : -u) * hand.facing, hand.y - u * (round ? 1.5 : 0.5), u, u);
}

// The master: behind the counter (their legs hidden by its front, drawn
// next) polishing a cup or brewing, or (with `front`) out on the floor
// bringing an order, the cup in hand. Each call draws them only where
// they are now.
export function drawMaster(ctx, layout, life, front = false) {
  const { master } = life;
  if (master.floor !== front) return;
  const serving = master.state === 'serve';
  const carrying = serving && master.serving && master.serving.phase !== 'back';
  const holding = master.state === 'polish' || master.state === 'brew' || carrying;
  const pose = personPose(layout, master, {
    stage: CAFE_MASTER.stage,
    activity: holding ? 'hold' : null,
    time: life.time,
    seed: 0,
    walking: master.state === 'walk' || (serving && master.serving?.phase !== 'place'),
  });
  const groundY = rowY(layout, masterRow(master));
  drawCharacter(ctx, pose, CAFE_MASTER.stage, CAFE_MASTER.look, 'smile', groundY, layout.characterScale, CAFE_MASTER.item);
  if (master.state === 'polish' || carrying) {
    drawHeldCup(ctx, heldHand(CAFE_MASTER.stage, pose, groundY, layout.characterScale), master.state === 'polish' ? master.t : null);
  }
}

// A customer: walking, or sitting on their seat.
function drawCustomer(ctx, layout, customer, time) {
  const sitting = customer.state === 'sit';
  const pose = personPose(layout, customer, { stage: customer.stage, sit: sitting, time, seed: customer.id });
  const groundY = rowY(layout, sitting ? customer.seat.row : CAFE_ART.height - 8);
  drawCharacter(ctx, pose, customer.stage, customer.look, 'smile', groundY, layout.characterScale);
}

function dot(ctx, layout, col, row, color, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(col) * layout.scale, rowY(layout, Math.round(row)), size * layout.scale, layout.scale);
}

// A cup at picture column `x` standing on row `row` (its bottom), with a
// wisp of steam rising now and then.
export function drawCup(ctx, layout, x, row, time) {
  const { cup, coffee, steam } = CAFE_CUP.colors;
  dot(ctx, layout, x - 1, row, OUTLINE_COLOR, 3);
  dot(ctx, layout, x - 1, row - 1, cup, 2);
  dot(ctx, layout, x + 1, row - 1, OUTLINE_COLOR);
  dot(ctx, layout, x - 1, row - 2, coffee, 2);
  const phase = (time % CAFE_CUP.steamEvery) / CAFE_CUP.steamEvery;
  if (phase < 0.7) dot(ctx, layout, x - 1 + (Math.floor(phase * 6) % 2), row - 3 - Math.floor(phase * CAFE_CUP.steamRise), steam);
}

// Where a seated customer's cup goes: on the counter in front of a stool,
// or on the table.
function cupSpot(seat) {
  if (seat.id.startsWith('stool')) return { x: seat.x + 2 * seat.facing, row: CAFE_COUNTER.top - 1 };
  return { x: CAFE_TABLE.x + Math.sign(seat.x - CAFE_TABLE.x) * 4, row: CAFE_TABLE.row - 1 };
}

// Bubbles rising in the lower bulb of the siphon the master is brewing at.
function drawBrewing(ctx, layout, life) {
  const { master } = life;
  if (master.state !== 'brew') return;
  const siphon = CAFE_SIPHONS.reduce((best, x) => (Math.abs(x - master.x) < Math.abs(best - master.x) ? x : best));
  const rise = Math.floor(master.t * 5) % 3;
  dot(ctx, layout, siphon - 1 + (rise % 2), CAFE_COUNTER.top - 2 - rise, CAFE_CUP.colors.steam);
}

// The character's order on the table, in front of their chair: a cup of
// coffee, or a slice of strawberry cake on a plate.
export function drawOrder(ctx, layout, item, time) {
  const spot = cupSpot(CAFE_SEATS.find((seat) => seat.id === ORDER_SEAT));
  if (item !== 'cake') {
    drawCup(ctx, layout, spot.x, spot.row, time);
    return;
  }
  dot(ctx, layout, spot.x - 2, spot.row, OUTLINE_COLOR, 5);
  dot(ctx, layout, spot.x - 2, spot.row - 1, CAFE_CUP.colors.cup, 5);
  dot(ctx, layout, spot.x - 1, spot.row - 2, '#fbe7c6', 3);
  dot(ctx, layout, spot.x - 1, spot.row - 3, '#f4c6c6', 2);
  dot(ctx, layout, spot.x, spot.row - 4, '#d9534f');
}

// The customers, their cups, the siphon brewing and the master out
// serving (all in front of the counter's front), back to front.
export function drawCafeLifeFront(ctx, layout, life) {
  drawBrewing(ctx, layout, life);
  for (const customer of life.customers) {
    drawCustomer(ctx, layout, customer, life.time);
    if (customer.served) {
      const spot = cupSpot(customer.seat);
      drawCup(ctx, layout, spot.x, spot.row, life.time);
    }
  }
  drawMaster(ctx, layout, life, true);
}

// Tama, facing right (flipped to face left): o fur, d stripes and tail, w
// white, e eye, p nose. Sleeping curled (breathing), sitting up (with a
// blink), stretching, and two walking frames.
const CAT_FRAMES = {
  sleep: ['........o.o', '..ooooo.ooo', '.ododododdo', 'oooooooooop', 'ddwwwwwwww.'],
  sleepIn: ['........o.o', '.oooooo.ooo', '.ododododdo', 'oooooooooop', 'ddwwwwwwww.'],
  sit: ['...o.o', '...ooo', '...eoe', '...opo', '..oooo', 'd.oddo', 'd.oooo', '.dwwww'],
  sitBlink: ['...o.o', '...ooo', '...dod', '...opo', '..oooo', 'd.oddo', 'd.oooo', '.dwwww'],
  stretch: ['dd..........', '.ooo........', '.oddodo..o.o', '..w.ooooooeo', '..w...wwwoop'],
  walk1: ['........o.o', 'd.......ooo', '.dooddodoeo', '..ooooooopo', '..w.w...w.w'],
  walk2: ['........o.o', 'd.......ooo', '.dooddodoeo', '..ooooooopo', '...w.w.w.w.'],
};
const catLayers = new Map();
function catLayer(frame) {
  if (!catLayers.has(frame)) {
    const rows = CAT_FRAMES[frame];
    const { fur, stripe, white, eye, nose } = CAFE_CAT.colors;
    const colors = { o: fur, d: stripe, w: white, e: eye, p: nose };
    const layer = createLayer(rows[0].length + 2, rows.length + 2);
    rows.forEach((line, row) => [...line].forEach((char, col) => {
      if (char !== '.') fill(layer, col + 1, row + 1, 1, 1, colors[char]);
    }));
    outline(layer, OUTLINE_COLOR);
    catLayers.set(frame, layer);
  }
  return catLayers.get(frame);
}

function catFrame(cat) {
  if (cat.state === 'sleep') return Math.floor(cat.t / CAFE_CAT.breath) % 2 ? 'sleepIn' : 'sleep';
  if (cat.state === 'walk') return Math.floor(cat.x) % 2 ? 'walk1' : 'walk2';
  if (cat.state === 'stretch') return 'stretch';
  return cat.blinkLeft > 0 ? 'sitBlink' : 'sit';
}

// Draws only the master or the cat (`id`), for the hover outline's
// silhouette: the master only above the counter while behind it.
// Returns the screen pixels per pixel of its art.
export function drawCafeCritter(ctx, layout, life, id) {
  if (id === 'master') {
    drawMaster(ctx, layout, life, life.master.floor);
    if (!life.master.floor) {
      const top = rowY(layout, CAFE_COUNTER.top);
      ctx.clearRect(0, top, layout.width, layout.height - top);
    }
    return layout.characterScale;
  }
  drawCat(ctx, layout, life);
  return layout.scale;
}

// The cat on the sill (behind everyone else).
export function drawCat(ctx, layout, life) {
  const { cat } = life;
  const layer = catLayer(catFrame(cat));
  const { scale } = layout;
  const anchorCol = Math.floor(layer.width / 2);
  drawLayer(ctx, layer, Math.round(cat.x) * scale, rowY(layout, CAFE_SILL.row) + scale, scale, { anchorCol, flip: cat.facing < 0 });
}
