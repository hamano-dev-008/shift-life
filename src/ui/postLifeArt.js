// postLifeArt.js — Draws Pedal Post's life (ui/postLife.js): the
// dispatcher behind the counter, the rider and customers with the
// character art (drawCharacter(), at CHARACTER_SCALE), the parcels they
// carry, the dispatcher's stamp thunking down, and Mochi the shiba
// (code-drawn at SCENE_SCALE with an outline). Mochi goes in first, then
// the dispatcher, the counter's front over them (ui/post.js), then the
// rider and the customer (drawPostLifeFront()).

import {
  POST_ART, POST_COUNTER, POST_DOG_BED, POST_DISPATCHER, POST_RIDER, POST_DOG,
} from '../data/post.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { drawCharacter, heldHand } from './sprite.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { personPose, pictureRowY } from './people.js';
import { isWalking } from './postLife.js';

const rowY = (layout, row) => pictureRowY(layout, POST_ART.height, row);

// Pure art: a parcel's colors and the stamp's red.
const BOX = '#c99b62';
const BOX_DARK = '#a8794a';
const TAPE = '#e8d29a';
const STAMP = '#e2403a';
const CARD = '#fbf3e6';

// A parcel held at `hand` (heldHand()): a taped cardboard box.
export function drawHeldParcel(ctx, hand) {
  const u = hand.unit;
  const left = hand.x - u / 2 + (hand.facing < 0 ? -2 * u : 0);
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect(left - u, hand.y - 3.5 * u, 5 * u, 5 * u);
  ctx.fillStyle = BOX;
  ctx.fillRect(left, hand.y - 2.5 * u, 3 * u, 3 * u);
  ctx.fillStyle = BOX_DARK;
  ctx.fillRect(left, hand.y - 0.5 * u, 3 * u, u);
  ctx.fillStyle = TAPE;
  ctx.fillRect(left + u, hand.y - 2.5 * u, u, 3 * u);
}

// A postcard held at `hand`: a small card, a red stamp in its corner.
export function drawHeldPostcard(ctx, hand) {
  const u = hand.unit;
  const left = hand.x - u / 2 + (hand.facing < 0 ? -2 * u : 0);
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect(left - u, hand.y - 2.5 * u, 5 * u, 4 * u);
  ctx.fillStyle = CARD;
  ctx.fillRect(left, hand.y - 1.5 * u, 3 * u, 2 * u);
  ctx.fillStyle = STAMP;
  ctx.fillRect(left + (hand.facing < 0 ? 0 : 2 * u), hand.y - 1.5 * u, u, u);
}

// The dispatcher behind the counter (their legs hidden by the counter's
// front, drawn next), the stamp in hand going up and thunking down while
// they stamp.
export function drawDispatcher(ctx, layout, life) {
  const { dispatcher } = life;
  const stamping = dispatcher.state === 'stamp';
  const pose = personPose(layout, dispatcher, {
    stage: POST_DISPATCHER.stage, activity: stamping ? 'hold' : null, time: life.time, seed: 0, walking: false,
  });
  const groundY = rowY(layout, POST_COUNTER.behindRow);
  drawCharacter(ctx, pose, POST_DISPATCHER.stage, POST_DISPATCHER.look, 'smile', groundY, layout.characterScale, POST_DISPATCHER.item);
  if (!stamping) return;
  const hand = heldHand(POST_DISPATCHER.stage, pose, groundY, layout.characterScale);
  const up = Math.floor(dispatcher.t / POST_DISPATCHER.thunk) % 2 === 0;
  ctx.fillStyle = STAMP;
  ctx.fillRect(hand.x - hand.unit / 2 + hand.facing * hand.unit, hand.y - (up ? 2 : 0) * hand.unit, hand.unit, 2 * hand.unit);
}

// The rider and the customer, in front of the counter, each with the
// parcel they carry (the rider on the way out, the customer until it's
// handed over).
export function drawPostLifeFront(ctx, layout, life) {
  const groundY = rowY(layout, POST_ART.height - 8);
  const people = [];
  const { rider, customer } = life;
  if (rider.step !== 'out') {
    people.push({ who: rider, stage: POST_RIDER.stage, look: POST_RIDER.look, item: POST_RIDER.item, seed: 1,
      activity: rider.step === 'pick' ? 'reachDown' : rider.step === 'leave' ? 'hold' : null });
  }
  if (customer) {
    people.push({ who: customer, stage: customer.stage, look: customer.look, item: null, seed: customer.id,
      activity: customer.step === 'out' ? null : 'hold' });
  }
  for (const { who, stage, look, item, seed, activity } of people) {
    const pose = personPose(layout, who, { stage, activity, time: life.time, seed, walking: isWalking(who) });
    drawCharacter(ctx, pose, stage, look, 'smile', groundY, layout.characterScale, item);
    if (activity === 'hold') drawHeldParcel(ctx, heldHand(stage, pose, groundY, layout.characterScale));
  }
}

// Mochi, facing right (flipped to face left): o fur, c cream, d dark (the
// eye), n nose, t the curled tail. Sleeping curled (breathing), sitting
// (tail up, or wagging), and two trotting frames.
const DOG_FRAMES = {
  sleep: ['.......o.o.', '.tt..ooooo.', 'tooooooodoc', 'oooooooooon', '.cccccccc..'],
  sleepIn: ['.......o.o.', '.tt.oooooo.', 'tooooooodoc', 'oooooooooon', '.cccccccc..'],
  sit: ['.....o.o', '.....ooo', '.t...odo', 'tt..oocn', '.ooooocc', '.oooooo.', '.cc..cc.'],
  sitWag: ['.....o.o', '.....ooo', 't....odo', '.t..oocn', '.ooooocc', '.oooooo.', '.cc..cc.'],
  walk1: ['........o.o', '.t......ooo', 'tooooooooodo', 'tooooooooocn', '..c.c...c.c.'],
  walk2: ['........o.o', '.t......ooo', 'tooooooooodo', 'tooooooooocn', '...cc...cc..'],
};
const dogLayers = new Map();
function dogLayer(frame) {
  if (!dogLayers.has(frame)) {
    const rows = DOG_FRAMES[frame];
    const { fur, cream, dark, nose } = POST_DOG.colors;
    const colors = { o: fur, c: cream, d: dark, n: nose, t: fur };
    const width = Math.max(...rows.map((line) => line.length));
    const layer = createLayer(width + 2, rows.length + 2);
    rows.forEach((line, row) => [...line].forEach((char, col) => {
      if (char !== '.') fill(layer, col + 1, row + 1, 1, 1, colors[char]);
    }));
    outline(layer, OUTLINE_COLOR);
    dogLayers.set(frame, layer);
  }
  return dogLayers.get(frame);
}

function dogFrame(dog) {
  if (dog.state === 'sleep') return Math.floor(dog.t / POST_DOG.breath) % 2 ? 'sleepIn' : 'sleep';
  if (dog.state === 'walk') return Math.floor(dog.t * 6) % 2 ? 'walk1' : 'walk2';
  return dog.wagging && Math.floor(dog.t / POST_DOG.wag) % 2 ? 'sitWag' : 'sit';
}

// Mochi on the floor (behind the people).
export function drawDog(ctx, layout, life) {
  const { dog } = life;
  const layer = dogLayer(dogFrame(dog));
  const { scale } = layout;
  drawLayer(ctx, layer, Math.round(dog.x) * scale, rowY(layout, POST_DOG_BED.row) + scale, scale, {
    anchorCol: Math.floor(layer.width / 2), flip: dog.facing < 0,
  });
}

// Draws only the dispatcher or Mochi (`id`), for the hover outline's
// silhouette: the dispatcher only above the counter. Returns the screen
// pixels per pixel of its art.
export function drawPostCritter(ctx, layout, life, id) {
  if (id === 'dispatcher') {
    drawDispatcher(ctx, layout, life);
    const top = rowY(layout, POST_COUNTER.top);
    ctx.clearRect(0, top, layout.width, layout.height - top);
    return layout.characterScale;
  }
  drawDog(ctx, layout, life);
  return layout.scale;
}
