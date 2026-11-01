// interaction.test.mjs — Real-time poke rewards, spam bounds and visual isolation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInteraction, calmInteraction, pokeCharacter } from '../src/game/interaction.js';
import { reactionPose } from '../src/ui/interaction.js';

test('gentle pokes reward only once per 30 real seconds, independent of age or speed', () => {
  const character = { stats: { happiness: 50 } };
  const state = createInteraction();
  assert.equal(pokeCharacter(character, state, 0, () => 0).deltas.happiness, 1);
  assert.notEqual(pokeCharacter(character, state, 6000, () => 0.9).text,
    pokeCharacter(character, createInteraction(), 0, () => 0).text);
  assert.deepEqual(pokeCharacter(character, state, 29999).deltas, {});
  assert.equal(pokeCharacter(character, state, 30000).deltas.happiness, 1);
});

test('four pokes in three seconds annoy once; spam stays bounded and silence calms', () => {
  const character = { stats: { happiness: 50 } };
  const state = createInteraction();
  [0, 1000, 2000].forEach((now) => pokeCharacter(character, state, now));
  assert.equal(pokeCharacter(character, state, 3000).deltas.happiness, -1);
  for (let now = 3100; now <= 10000; now += 100) {
    const result = pokeCharacter(character, state, now);
    assert.deepEqual(result.deltas, {});
    assert.equal(result.text, null);
  }
  assert.equal(character.stats.happiness, 50);
  assert.ok(state.pokes.length <= 4);
  calmInteraction(state, 14999);
  assert.equal(state.annoyed, true);
  calmInteraction(state, 15000);
  assert.equal(state.annoyed, false);
  assert.equal(pokeCharacter(character, state, 15000).annoyed, false);
  assert.deepEqual(pokeCharacter(character, state, 21000).deltas, {});
});

test('slow clicks do not annoy and happiness remains clamped', () => {
  const character = { stats: { happiness: 100 } };
  const state = createInteraction();
  for (let now = 0; now < 30000; now += 1100) {
    assert.equal(pokeCharacter(character, state, now).annoyed, false);
  }
  assert.equal(character.stats.happiness, 100);
});

test('reaction moves pixels without mutating travel, rest, busking or walk poses', () => {
  for (const activity of [null, 'rest', 'busk']) {
    const pose = { x: 100, lift: 12, activity, walk: { cycle: 0.5 } };
    const state = createInteraction();
    pokeCharacter({ stats: { happiness: 50 } }, state, 0);
    const first = reactionPose(pose, state, 0, 2);
    const second = reactionPose(pose, state, 90, 2);
    assert.equal(first.pose.x, 102);
    assert.equal(second.pose.x, 98);
    assert.equal(pose.x, 100);
    assert.equal(first.pose.activity, activity);
    assert.equal(first.pose.walk, pose.walk);
    assert.equal(reactionPose(pose, state, 700, 2).pose, pose);
  }
});
