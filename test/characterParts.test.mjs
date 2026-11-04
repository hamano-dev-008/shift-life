// characterParts.test.mjs — The layered adult art's recolor math and its frame data.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mix, partColorMap } from '../src/ui/characterColors.js';
import { PART_ANIMATIONS, PART_PLACES, PART_COLORS } from '../src/data/characterParts.js';
import { SKIN_TONES, HAIR_COLORS, SHIRT_COLORS } from '../src/data/appearance.js';

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

test('every frame has the head and torso placed', () => {
  for (const [animation, { frames }] of Object.entries(PART_ANIMATIONS)) {
    assert.equal(PART_PLACES[animation].length, frames, animation);
  }
});
