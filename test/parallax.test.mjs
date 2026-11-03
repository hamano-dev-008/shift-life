// parallax.test.mjs — The parallax backgrounds: the layer sprites (all
// there, listed, and stacking into the old pictures pixel for pixel), the
// clouds' drift and wrap, the sway while dragging (opposite, by depth,
// within its most, whole pixels, back to rest), the pan's offsets and
// cross-fade, the door's fade, which trips pan or fade, the edge gaps, and
// the Parallax setting.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import {
  PARALLAX_LAYERS, LAYERED_BACKGROUNDS, PIECE_LAYERS, CLOUD_DRIFT, DRAG_SWAY, TRAVEL_PAN, PAN_PLACES, DOOR_FADE,
  PARALLAX_TEXT,
} from '../src/data/parallax.js';
import {
  BACK_LAYERS, cloudDrift, wrapX, edgeGaps, createDragSway, updateDragSway, swayShift, transitionFor,
  panProgress, panDone, panOffsets, panFade, doorFadeLeft, doorFadeDone,
} from '../src/ui/parallax.js';
import { PLACES } from '../src/data/places.js';
import { SCENE_SCALE } from '../src/data/layout.js';
import { DEFAULT_SETTINGS } from '../src/data/settings.js';
import { restoreSettings, settingsSaveData, setParallax } from '../src/game/settings.js';

const WIDTH = 320;
const SPRITES = new URL('../assets/sprites/', import.meta.url);

// A small PNG reader (8-bit, not interlaced): { width, height, data RGBA }.
function readPng(url) {
  const bytes = readFileSync(url);
  let at = 8;
  let header;
  let palette = null;
  let alpha = null;
  const chunks = [];
  while (at < bytes.length) {
    const length = bytes.readUInt32BE(at);
    const type = bytes.toString('ascii', at + 4, at + 8);
    const body = bytes.subarray(at + 8, at + 8 + length);
    if (type === 'IHDR') header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), depth: body[8], color: body[9] };
    if (type === 'PLTE') palette = body;
    if (type === 'tRNS') alpha = body;
    if (type === 'IDAT') chunks.push(body);
    at += 12 + length;
  }
  const { width, height, depth, color } = header;
  assert.equal(depth, 8, `${url}: only 8-bit PNGs`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[color];
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const data = Buffer.alloc(width * height * 4);
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? line[i - channels] : 0;
      const b = previous[i];
      const c = i >= channels ? previous[i - channels] : 0;
      let add = 0;
      if (filter === 1) add = a;
      else if (filter === 2) add = b;
      else if (filter === 3) add = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[i] = (line[i] + add) & 255;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (color === 6) line.copy(data, o, x * 4, x * 4 + 4);
      else if (color === 2) { line.copy(data, o, x * 3, x * 3 + 3); data[o + 3] = 255; }
      else if (color === 3) {
        palette.copy(data, o, line[x] * 3, line[x] * 3 + 3);
        data[o + 3] = alpha && line[x] < alpha.length ? alpha[line[x]] : 255;
      } else if (color === 0) { data.fill(line[x], o, o + 3); data[o + 3] = 255; }
      else { data.fill(line[x * 2], o, o + 3); data[o + 3] = line[x * 2 + 1]; }
    }
    previous = line;
  }
  return { width, height, data };
}

test('the layers: sky, clouds, hills, ground, for the Lake, the Fortune Tree and the Farm', () => {
  assert.deepEqual(PARALLAX_LAYERS, ['sky', 'clouds', 'hills', 'ground']);
  assert.deepEqual(BACK_LAYERS, ['sky', 'clouds', 'hills']);
  assert.deepEqual(LAYERED_BACKGROUNDS, { lake: 'lake', 'fortuneTree.background': 'fortuneTree', 'farm.background': 'farm' });
  // Each split picture is a place's first scenery piece.
  for (const [picture, prefix] of Object.entries(LAYERED_BACKGROUNDS)) {
    const place = PLACES.find((candidate) => candidate.scenery[0] === picture);
    assert.ok(place, `no place shows ${picture}`);
    assert.equal(place.id, prefix === 'lake' ? 'lake' : prefix);
  }
  // The Yard's code-drawn sky and grass count as its sky and ground; Home
  // has none.
  assert.deepEqual(PIECE_LAYERS, { sky: 'sky', grass: 'ground' });
  for (const id of ['home', 'myHome']) {
    const place = PLACES.find((candidate) => candidate.id === id);
    assert.ok(!place.scenery.some((piece) => piece in PIECE_LAYERS || piece in LAYERED_BACKGROUNDS));
  }
});

test('the layer sprites are there, listed in data/sprites.js, and stack into the old pictures exactly', () => {
  const listed = readFileSync(new URL('../src/data/sprites.js', import.meta.url), 'utf8');
  for (const [picture, prefix] of Object.entries(LAYERED_BACKGROUNDS)) {
    const old = readPng(new URL(`${picture}.png`, SPRITES));
    const stacked = Buffer.alloc(old.width * old.height * 4);
    for (const layer of PARALLAX_LAYERS) {
      const name = `${prefix}.${layer}`;
      assert.ok(listed.includes(name), `${name} not listed in data/sprites.js`);
      const url = new URL(`${name}.png`, SPRITES);
      assert.ok(existsSync(url), `${name}.png is missing`);
      const png = readPng(url);
      assert.deepEqual([png.width, png.height], [old.width, old.height], `${name} is not the picture's size`);
      for (let i = 0; i < png.width * png.height; i++) {
        const a = png.data[i * 4 + 3] / 255;
        for (let c = 0; c < 3; c++) {
          stacked[i * 4 + c] = Math.round(png.data[i * 4 + c] * a + stacked[i * 4 + c] * (1 - a));
        }
        stacked[i * 4 + 3] = Math.max(stacked[i * 4 + 3], png.data[i * 4 + 3]);
      }
    }
    let different = 0;
    for (let i = 0; i < stacked.length; i++) if (stacked[i] !== old.data[i]) different++;
    assert.equal(different, 0, `${prefix}'s layers don't stack into ${picture}.png`);
    // The sky fills it all; the window shows the whole width.
    const sky = readPng(new URL(`${prefix}.sky.png`, SPRITES));
    assert.ok([...Array(sky.width * sky.height).keys()].every((i) => sky.data[i * 4 + 3] === 255));
    assert.ok(sky.width * SCENE_SCALE >= WIDTH);
  }
});

test('the clouds drift about a scene pixel every 3-4 seconds, in whole screen pixels, wrapping at their width', () => {
  assert.ok(CLOUD_DRIFT.secondsPerPixel >= 3 && CLOUD_DRIFT.secondsPerPixel <= 4);
  assert.ok([1, -1].includes(CLOUD_DRIFT.direction));
  assert.equal(cloudDrift(0, SCENE_SCALE), 0);
  const perScenePixel = CLOUD_DRIFT.secondsPerPixel;
  assert.equal(Math.abs(cloudDrift(perScenePixel * 10, SCENE_SCALE)), 10 * SCENE_SCALE);
  for (let t = 0; t < 600; t += 0.37) {
    const drift = cloudDrift(t, SCENE_SCALE);
    assert.ok(Number.isInteger(drift));
    // Never more than a screen pixel between frames a 60th apart.
    assert.ok(Math.abs(cloudDrift(t + 1 / 60, SCENE_SCALE) - drift) <= 1);
  }
  // Seamless: a whole layer width further on looks the same.
  const period = 107 * SCENE_SCALE;
  for (const shift of [-700, -321, -1, 0, 5, 320, 321, 1000]) {
    const x = wrapX(shift, period);
    assert.ok(x >= 0 && x < period && Number.isInteger(x));
    assert.equal(wrapX(shift + period, period), x);
  }
  const loop = period * CLOUD_DRIFT.secondsPerPixel / SCENE_SCALE;
  assert.equal(wrapX(cloudDrift(loop + 12, SCENE_SCALE), period), wrapX(cloudDrift(12, SCENE_SCALE), period));
});

// Drags the window `speed` screen pixels a second for `seconds` (frames of
// 1/60 s), returning the sway; `then` seconds after, with the drag over.
function drag(sway, speed, seconds) {
  let x = 0;
  for (let t = 0; t < seconds; t += 1 / 60) {
    x += speed / 60;
    updateDragSway(sway, 1 / 60, Math.round(x));
  }
  return sway;
}
const shifts = (sway) => Object.fromEntries(PARALLAX_LAYERS.map((layer) => [layer, swayShift(sway, layer, SCENE_SCALE)]));

test('dragging: the sky, clouds and hills shift the other way, hills most, within their most, never the ground', () => {
  assert.deepEqual(DRAG_SWAY.max, { sky: 1, clouds: 2, hills: 3, ground: 0 });
  const still = createDragSway();
  updateDragSway(still, 1 / 60, null);
  assert.deepEqual(shifts(still), { sky: 0, clouds: 0, hills: 0, ground: 0 });
  // Dragging right: everything behind shifts left.
  const right = shifts(drag(createDragSway(), 2000, 0.6));
  assert.ok(right.hills < 0 && right.clouds < 0 && right.sky < 0, JSON.stringify(right));
  assert.ok(-right.hills > -right.clouds && -right.clouds > -right.sky);
  assert.equal(right.ground, 0);
  // Dragging left: right.
  const left = shifts(drag(createDragSway(), -2000, 0.6));
  assert.ok(left.hills > 0 && left.clouds > 0 && left.sky > 0);
  // A slow drag shifts less than a fast one.
  const slow = shifts(drag(createDragSway(), 150, 0.6));
  assert.ok(Math.abs(slow.hills) < Math.abs(right.hills));
  // Whole screen pixels, never past the most, whatever the speed.
  const sway = createDragSway();
  for (let i = 0; i < 400; i++) {
    updateDragSway(sway, 1 / 60, i % 50 < 25 ? i * 40 : (50 - (i % 50)) * 40);
    for (const layer of PARALLAX_LAYERS) {
      const shift = swayShift(sway, layer, SCENE_SCALE);
      assert.ok(Number.isInteger(shift) && !Object.is(shift, -0));
      assert.ok(Math.abs(shift) <= DRAG_SWAY.max[layer] * SCENE_SCALE);
    }
  }
});

test('dragging: a soft spring eases them back once the drag slows or stops', () => {
  const sway = drag(createDragSway(), 2000, 0.5);
  assert.notEqual(swayShift(sway, 'hills', SCENE_SCALE), 0);
  // Held still (still dragging, not moving): back to rest.
  for (let t = 0; t < 2; t += 1 / 60) updateDragSway(sway, 1 / 60, sway.lastX);
  assert.deepEqual(shifts(sway), { sky: 0, clouds: 0, hills: 0, ground: 0 });
  // Let go: back to rest within two seconds, gently (a pixel or two a
  // frame at most) and exactly still after.
  const out = drag(createDragSway(), -2000, 0.5);
  let before = swayShift(out, 'hills', SCENE_SCALE);
  for (let t = 0; t < 2; t += 1 / 60) {
    updateDragSway(out, 1 / 60, null);
    const now = swayShift(out, 'hills', SCENE_SCALE);
    assert.ok(Math.abs(now - before) <= 2);
    before = now;
  }
  assert.deepEqual(shifts(out), { sky: 0, clouds: 0, hills: 0, ground: 0 });
  assert.equal(out.offset, 0);
  assert.equal(out.velocity, 0);
});

test('edge gaps: a shifted layer leaves its edge columns to repeat', () => {
  const art = 107 * SCENE_SCALE;
  assert.deepEqual(edgeGaps(0, art, WIDTH), []);
  assert.deepEqual(edgeGaps(-1, art, WIDTH), []);
  assert.deepEqual(edgeGaps(9, art, WIDTH), [{ from: 0, to: 9, edge: 'first' }]);
  assert.deepEqual(edgeGaps(-9, art, WIDTH), [{ from: 312, to: 320, edge: 'last' }]);
  assert.deepEqual(edgeGaps(-32, WIDTH, WIDTH), [{ from: 288, to: 320, edge: 'last' }]);
});

test('which trips pan: side exits between outdoor places; doors fade; none with Parallax off', () => {
  assert.deepEqual(PAN_PLACES, ['lake', 'fortuneTree', 'yard', 'myYard', 'farm']);
  let sides = 0;
  let doors = 0;
  for (const place of PLACES) {
    for (const exit of place.exits) {
      const kind = transitionFor(place.id, exit.to, exit.via, true);
      if (exit.via === 'left' || exit.via === 'right') {
        assert.equal(kind, 'pan', `${place.id} > ${exit.to}`);
        sides++;
      } else {
        assert.equal(kind, 'fade', `${place.id} > ${exit.to}`);
        doors++;
      }
      assert.equal(transitionFor(place.id, exit.to, exit.via, false), null);
    }
  }
  assert.ok(sides >= 8 && doors >= 4);
  assert.equal(transitionFor('home', 'yard', 'left', true), null);
});

test('the pan: about 1.2 s, eased, each layer by its share of the width, the grounds edge to edge', () => {
  assert.equal(TRAVEL_PAN.seconds, 1.2);
  assert.deepEqual(TRAVEL_PAN.share, { sky: 0.1, clouds: 0.25, hills: 0.5, ground: 1 });
  assert.equal(panProgress(0), 0);
  assert.equal(panProgress(TRAVEL_PAN.seconds), 1);
  assert.equal(panProgress(99), 1);
  assert.ok(Math.abs(panProgress(TRAVEL_PAN.seconds / 2) - 0.5) < 1e-9);
  // Eased: slow at the ends.
  assert.ok(panProgress(0.1) < 0.1 / TRAVEL_PAN.seconds);
  assert.ok(!panDone(1.19) && panDone(1.2));
  for (const direction of [1, -1]) {
    for (const layer of PARALLAX_LAYERS) {
      const travel = TRAVEL_PAN.share[layer] * WIDTH;
      // The old place slides off away from the side walked out of, the
      // new one comes in from it.
      assert.deepEqual(panOffsets(0, layer, WIDTH, direction), { from: 0, to: direction * travel });
      assert.deepEqual(panOffsets(1, layer, WIDTH, direction), { from: -direction * travel, to: 0 });
      let last = panOffsets(0, layer, WIDTH, direction);
      for (let t = 0; t <= TRAVEL_PAN.seconds; t += 1 / 60) {
        const at = panOffsets(panProgress(t), layer, WIDTH, direction);
        assert.ok(Number.isInteger(at.from) && Number.isInteger(at.to));
        assert.equal(at.to - at.from, direction * travel);
        // Always the same way.
        assert.ok(direction * (at.from - last.from) <= 0);
        last = at;
      }
    }
  }
  // The ground (and props, wildlife) moves a full width; layers further
  // back less.
  assert.equal(panOffsets(1, 'ground', WIDTH, 1).from, -WIDTH);
  assert.equal(panOffsets(1, 'hills', WIDTH, 1).from, -160);
  assert.equal(panOffsets(1, 'clouds', WIDTH, 1).from, -80);
  assert.equal(panOffsets(1, 'sky', WIDTH, 1).from, -32);
});

test('the pan cross-fades in steps; the door fades in steps over a short while', () => {
  assert.equal(panFade(0), 0);
  assert.equal(panFade(1), 1);
  const seen = new Set();
  for (let p = 0; p <= 1; p += 0.01) {
    const fade = panFade(p);
    assert.ok(Number.isInteger(fade * TRAVEL_PAN.fadeSteps));
    seen.add(fade);
  }
  assert.equal(seen.size, TRAVEL_PAN.fadeSteps + 1);
  assert.ok(DOOR_FADE.seconds > 0 && DOOR_FADE.seconds <= 0.6);
  assert.equal(doorFadeLeft(0), 1);
  assert.equal(doorFadeLeft(DOOR_FADE.seconds), 0);
  let before = 1;
  for (let t = 0; t <= DOOR_FADE.seconds; t += 0.01) {
    const left = doorFadeLeft(t);
    assert.ok(left <= before && Number.isInteger(Math.round(left * DOOR_FADE.steps * 1e6) / 1e6));
    before = left;
  }
  assert.ok(!doorFadeDone(DOOR_FADE.seconds - 0.01) && doorFadeDone(DOOR_FADE.seconds));
});

test('the Parallax setting: On by default, saved, turned off and on', () => {
  assert.equal(DEFAULT_SETTINGS.parallax, true);
  assert.equal(restoreSettings(null).parallax, true);
  assert.equal(restoreSettings({ parallax: 'off' }).parallax, true);
  assert.equal(restoreSettings({ version: 1, workTrips: true }).parallax, true);
  const settings = restoreSettings(undefined);
  assert.equal(setParallax(settings, true), false);
  assert.equal(setParallax(settings, false), true);
  assert.equal(settingsSaveData(settings).parallax, false);
  assert.equal(restoreSettings(JSON.parse(JSON.stringify(settingsSaveData(settings)))).parallax, false);
  assert.deepEqual(PARALLAX_TEXT, { setting: 'Parallax', on: 'On', off: 'Off' });
});
