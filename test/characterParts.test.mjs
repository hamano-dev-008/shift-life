// characterParts.test.mjs — The layered character art's recolor math, each life stage's frame data, and its fallback to code art.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mix, partColorMap } from '../src/ui/characterColors.js';
import { partPose, partsComplete } from '../src/ui/characterParts.js';
import { PART_SETS, PART_COLORS, LYING_PARTS } from '../src/data/characterParts.js';
import { CHARACTER_SHAPES } from '../src/data/characterShapes.js';
import {
  SKIN_TONES, HAIR_COLORS, SHIRT_COLORS, HAIR_STYLES, ELDER_HAIR_COLOR,
} from '../src/data/appearance.js';

const ART_LOOK = { skin: '#f1c27d', hair: '#5a3825', shirt: '#e07a5f' };

test('mix moves each channel toward the target by k, rounded', () => {
  assert.deepEqual(mix('#000000', '#ffffff', 0.5), [128, 128, 128]);
  assert.deepEqual(mix([241, 194, 125], [70, 40, 90], 0.1), [224, 179, 122]);
  assert.deepEqual(mix([10, 20, 30], [70, 40, 90], 0), [10, 20, 30]);
  assert.deepEqual(mix([10, 20, 30], [70, 40, 90], 1), [70, 40, 90]);
});

test("the art's own look maps every art color to itself", () => {
  const map = partColorMap(ART_LOOK);
  assert.equal(map.size, PART_COLORS.length);
  for (const [from, to] of map) assert.equal(to, from);
});

test('skin, hair and shirt shades follow the appearance', () => {
  const map = partColorMap({ skin: '#5c3a21', hair: '#e6c36a', shirt: '#3d405b' });
  assert.equal(map.get('#f1c27d'), '#5c3a21'); // skin base
  assert.equal(map.get('#cfa376'), '#58362c'); // skin shade, 0.2
  assert.equal(map.get('#b08770'), '#543337'); // far leg, 0.38
  assert.equal(map.get('#e0b37a'), '#5a3827'); // chin, 0.1
  assert.equal(map.get('#5a3825'), '#e6c36a'); // hair base
  assert.equal(map.get('#553432'), '#be9c66'); // hair shade, 0.25
  assert.equal(map.get('#e07a5f'), '#3d405b'); // shirt base
  assert.equal(map.get('#c16a5e'), '#3f3b5b'); // shirt shade, 0.2
});

test('the hair highlight is stronger on hair brighter than R+G+B 200', () => {
  // Blonde (531): 0.3 toward the warm white.
  assert.equal(partColorMap({ ...ART_LOOK, hair: '#e6c36a' }).get('#6e4e39'), '#eed186');
  // Exactly 200 isn't over: 0.12.
  assert.equal(partColorMap({ ...ART_LOOK, hair: '#643c28' }).get('#6e4e39'), '#77523b');
  // 201 is: 0.3.
  assert.equal(partColorMap({ ...ART_LOOK, hair: '#653c28' }).get('#6e4e39'), '#937258');
});

test('the mouth is dark on light skin (R+G+B over 420) and light on dark skin', () => {
  assert.equal(partColorMap(ART_LOOK).get('#5f4036'), '#5f4036');
  assert.equal(partColorMap({ ...ART_LOOK, skin: '#5c3a21' }).get('#5f4036'), '#d49f92');
  // Exactly 420 isn't over: the light mouth.
  assert.equal(partColorMap({ ...ART_LOOK, skin: '#8c8c8c' }).get('#5f4036'), '#deafa7');
  assert.equal(partColorMap({ ...ART_LOOK, skin: '#8d8c8c' }).get('#5f4036'), '#4b3539');
});

test('pants, shoes, eyes and eye whites keep their colors', () => {
  const map = partColorMap({ skin: '#5c3a21', hair: '#1f1f2e', shirt: '#81b29a' });
  for (const kept of ['#4a4e69', '#363950', '#2e2a35', '#ffffff']) assert.equal(map.has(kept), false);
});

test('every palette look gives well-formed colors', () => {
  for (const skin of SKIN_TONES) {
    for (const hair of HAIR_COLORS) {
      for (const shirt of SHIRT_COLORS) {
        for (const color of partColorMap({ skin, hair, shirt }).values()) assert.match(color, /^#[0-9a-f]{6}$/);
      }
    }
  }
});

// The frames each part set has, per animation, as drawn.
const FRAMES = {
  baby: { sit: 2, crawl: 8 },
  toddler: { idle: 2, walk: 4, sit: 2 },
  child: { idle: 2, walk: 8, sit: 2 },
  teen: { idle: 2, walk: 8, sit: 2 },
  adult: { idle: 2, walk: 8, sit: 2 },
  elder: { idle: 2, walk: 4, sit: 2 },
};

test("each set's animations and frame counts", () => {
  assert.deepEqual(Object.keys(PART_SETS).sort(), Object.keys(FRAMES).sort());
  for (const [set, animations] of Object.entries(FRAMES)) {
    const has = Object.fromEntries(Object.entries(PART_SETS[set].animations).map(([a, { frames }]) => [a, frames]));
    assert.deepEqual(has, animations, set);
  }
});

test('every frame has the head and torso placed, and an arm from childhood on', () => {
  for (const [set, { animations }] of Object.entries(PART_SETS)) {
    const infant = set === 'baby' || set === 'toddler';
    for (const [animation, { frames, places }] of Object.entries(animations)) {
      assert.equal(places.length, frames, `${set} ${animation}`);
      for (const { head, body, arm } of places) {
        assert.equal(head.length, 2);
        assert.equal(body.length, 3);
        assert.equal(Boolean(arm), !infant, `${set} ${animation} arm`);
      }
    }
  }
});

test("standing still, heads and torsos sit where the code-drawn figure's are", () => {
  // Frame column = 10 + code column, frame row = code row - 4, with the
  // feet on the code layer's row 29; elders' heads lean a column forward.
  for (const set of ['toddler', 'child', 'teen', 'adult', 'elder']) {
    const shape = CHARACTER_SHAPES[set];
    const [still] = PART_SETS[set].animations.idle.places;
    const bodyLeft = 10 - Math.floor(shape.width / 2);
    const bodyTop = 29 - shape.legs - shape.body - 4;
    assert.deepEqual(still.body, [bodyLeft, bodyTop, shape.body], set);
    assert.deepEqual(still.head, [10 - Math.floor(shape.head / 2) + shape.stoop, bodyTop - shape.head], set);
    if (still.arm) assert.deepEqual(still.arm, [bodyLeft + shape.width, bodyTop], set);
  }
  assert.deepEqual(PART_SETS.adult.animations.sit.places.map(({ head }) => head), [[6, 11], [6, 12]]);
  assert.deepEqual(PART_SETS.elder.animations.sit.places.map(({ head }) => head), [[7, 11], [7, 12]]);
});

test('parts in order: adults and elders wear clothes, children and teens not, infants have legs and no arm', () => {
  const parts = (set) => PART_SETS[set].order.map(({ part }) => part);
  for (const set of ['adult', 'elder']) {
    assert.deepEqual(parts(set), ['hair.long.back', 'body', 'clothes', 'arm', 'face', 'hair.{hair}'], set);
    assert.equal(PART_SETS[set].order.find(({ part }) => part === 'clothes').then, 'bodyItem');
  }
  for (const set of ['child', 'teen']) {
    assert.deepEqual(parts(set), ['hair.long.back', 'body', 'arm', 'face', 'hair.{hair}'], set);
    assert.equal(PART_SETS[set].order.find(({ part }) => part === 'body').then, 'bodyItem');
  }
  for (const set of ['baby', 'toddler']) {
    assert.deepEqual(parts(set), ['legs', 'body', 'face', 'hair.tuft'], set);
    assert.deepEqual(PART_SETS[set].order[0], { part: 'legs', onlyIn: 'sit', still: true });
    assert.equal(PART_SETS[set].lookBack, true);
  }
  assert.equal(PART_SETS.elder.hair, ELDER_HAIR_COLOR);
});

test('each pose picks the part set and animation the figure is drawn with', () => {
  const base = { gait: 'walk', walk: null, sit: false, lying: false, activity: null };
  const walk = { cycle: 0.3 };
  for (const stage of ['child', 'teen', 'adult', 'elder']) {
    const is = (pose, animation, why) => assert.deepEqual(partPose(stage, pose), { set: stage, animation }, `${stage} ${why}`);
    is(base, 'idle', 'still');
    is({ ...base, walk }, 'walk', 'walking');
    for (const activity of ['read', 'coins', 'wave', 'fish', 'plant', 'weed', 'harvest']) is({ ...base, activity }, 'idle', activity);
    is({ ...base, activity: 'jog', walk }, 'walk', 'jogging');
    is({ ...base, sit: true }, 'sit', 'sitting');
    is({ ...base, sit: true, activity: 'busk' }, 'sit', 'busking');
    is({ ...base, lying: true, activity: 'rest' }, 'lying', 'resting');
  }
  // A crawling baby crawls or sits; toddling is the toddler set, plopped
  // down too; asleep, both stay code-drawn.
  assert.deepEqual(partPose('baby', { ...base, gait: 'crawl', walk }), { set: 'baby', animation: 'crawl' });
  assert.deepEqual(partPose('baby', { ...base, gait: 'crawl' }), { set: 'baby', animation: 'crawl' });
  assert.deepEqual(partPose('baby', { ...base, gait: 'crawl', sit: true }), { set: 'baby', animation: 'sit' });
  assert.deepEqual(partPose('baby', { ...base, gait: 'toddle' }), { set: 'toddler', animation: 'idle' });
  assert.deepEqual(partPose('baby', { ...base, gait: 'toddle', walk }), { set: 'toddler', animation: 'walk' });
  assert.deepEqual(partPose('baby', { ...base, gait: 'toddle', sit: true }), { set: 'toddler', animation: 'sit' });
  assert.equal(partPose('baby', { ...base, gait: 'crawl', lying: true }), null);
  assert.equal(partPose('baby', { ...base, gait: 'toddle', lying: true }), null);
});

// A stand-in for getSprite(): every part PNG at its size, except the names
// left out or shrunk.
function fakeSprites({ without = [], small = [] } = {}) {
  const size = (name) => {
    const [, set, animation] = name.split('.');
    if (animation === 'lying') return [16, 16];
    return [20 * FRAMES[set][animation], 26];
  };
  return (name) => {
    if (without.includes(name)) return null;
    const [w, h] = size(name);
    return { image: { naturalWidth: small.includes(name) ? w - 1 : w, naturalHeight: h } };
  };
}

// Every part each animation needs with short hair.
const FACES = ['face.smile', 'face.neutral', 'face.frown', 'face.blink'];
const NEEDED = {
  baby: {
    sit: ['legs', 'body', ...FACES, 'face.back', 'hair.tuft'],
    crawl: ['body', ...FACES, 'hair.tuft'],
  },
  toddler: {
    idle: ['body', ...FACES, 'hair.tuft'],
    walk: ['body', ...FACES, 'hair.tuft'],
    sit: ['legs', 'body', ...FACES, 'face.back', 'hair.tuft'],
  },
  ...Object.fromEntries(['child', 'teen'].map((set) => [set, Object.fromEntries(['idle', 'walk', 'sit']
    .map((animation) => [animation, ['body', 'arm', ...FACES, 'hair.short']]))])),
  ...Object.fromEntries(['adult', 'elder'].map((set) => [set, Object.fromEntries(['idle', 'walk', 'sit']
    .map((animation) => [animation, ['body', 'clothes', 'arm', ...FACES, 'hair.short']]))])),
};

test('each stage and animation uses the part art only with every PNG it needs, big enough', () => {
  const all = fakeSprites();
  for (const [set, animations] of Object.entries(FRAMES)) {
    for (const animation of Object.keys(animations)) {
      for (const hair of HAIR_STYLES) assert.equal(partsComplete(set, animation, hair, all), true, `${set} ${animation} ${hair}`);
    }
  }
  for (const [set, animations] of Object.entries(NEEDED)) {
    for (const [animation, parts] of Object.entries(animations)) {
      for (const part of parts) {
        const name = `parts.${set}.${animation}.${part}`;
        assert.equal(partsComplete(set, animation, 'short', fakeSprites({ without: [name] })), false, `missing ${name}`);
        assert.equal(partsComplete(set, animation, 'short', fakeSprites({ small: [name] })), false, `too small ${name}`);
      }
    }
  }
});

test('a missing part only matters to its own set, animation and hair style', () => {
  const noChildSitArm = fakeSprites({ without: ['parts.child.sit.arm'] });
  assert.equal(partsComplete('child', 'sit', 'bun', noChildSitArm), false);
  assert.equal(partsComplete('child', 'idle', 'bun', noChildSitArm), true);
  assert.equal(partsComplete('teen', 'sit', 'bun', noChildSitArm), true);
  const noElderLongBack = fakeSprites({ without: ['parts.elder.walk.hair.long.back'] });
  assert.equal(partsComplete('elder', 'walk', 'long', noElderLongBack), false);
  assert.equal(partsComplete('elder', 'walk', 'short', noElderLongBack), true);
  assert.equal(partsComplete('adult', 'walk', 'long', noElderLongBack), true);
  // Infants' hair is a tuft whatever the style, and only sitting needs
  // legs and the look back.
  for (const hair of HAIR_STYLES) {
    const noToddlerSit = fakeSprites({ without: ['parts.toddler.sit.legs'] });
    assert.equal(partsComplete('toddler', 'sit', hair, noToddlerSit), false);
    assert.equal(partsComplete('toddler', 'idle', hair, noToddlerSit), true);
    assert.equal(partsComplete('baby', 'crawl', hair, fakeSprites({ without: ['parts.baby.sit.face.back'] })), true);
  }
});

test('sleeping heads come from the adult lying parts; babies and toddlers sleep code-drawn', () => {
  for (const set of ['child', 'teen', 'adult', 'elder']) {
    assert.equal(PART_SETS[set].lying, true, set);
    assert.equal(partsComplete(set, 'lying', 'short', fakeSprites()), true, set);
    assert.equal(partsComplete(set, 'lying', 'short', fakeSprites({ without: ['parts.adult.lying.face.sleep'] })), false, set);
    assert.equal(partsComplete(set, 'lying', 'bun', fakeSprites({ without: ['parts.adult.lying.hair.bun'] })), false, set);
    assert.equal(partsComplete(set, 'lying', 'spiky', fakeSprites({ without: ['parts.adult.lying.hair.bun'] })), true, set);
  }
  assert.equal(PART_SETS.baby.lying, undefined);
  assert.equal(PART_SETS.toddler.lying, undefined);
  assert.deepEqual(LYING_PARTS.frame, { width: 16, height: 16 });
  assert.deepEqual(LYING_PARTS.head, [5, 4]);
  for (const [col, row] of LYING_PARTS.mouthOpen) {
    assert.ok(col >= 0 && col < 8 && row >= 0 && row < 8, 'inside the 8 x 8 head');
  }
});

test("an elder's hair is recolored from the elder grey", () => {
  const map = partColorMap({ ...ART_LOOK, hair: PART_SETS.elder.hair });
  assert.equal(map.get('#5a3825'), ELDER_HAIR_COLOR);
});

// getSprite() from the PNGs in assets/sprites, sized from each file's
// header (width and height are the IHDR chunk's first 8 bytes).
function spritesOnDisk(name) {
  const file = new URL(`../assets/sprites/${name}.png`, import.meta.url);
  if (!existsSync(file)) return null;
  const header = readFileSync(file).subarray(16, 24);
  return { image: { naturalWidth: header.readUInt32BE(0), naturalHeight: header.readUInt32BE(4) } };
}

test('the shipped PNGs cover every stage, animation and hair style', () => {
  for (const [set, animations] of Object.entries(FRAMES)) {
    for (const animation of [...Object.keys(animations), ...(PART_SETS[set].lying ? ['lying'] : [])]) {
      for (const hair of HAIR_STYLES) assert.equal(partsComplete(set, animation, hair, spritesOnDisk), true, `${set} ${animation} ${hair}`);
    }
  }
});
