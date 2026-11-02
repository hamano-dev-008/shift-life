// lying.test.mjs — The sleeping (resting) pose's shape and timing: the
// head on the pillow at the left end, the shirt only at the shoulders,
// the blanket from the chest down past the feet with a bump for them, its
// top edge over the chest rising 1 pixel with each breath, the mouth
// opening to a tiny "o" every 4-6 seconds for a moment, every life stage
// fitting the sprite's layer, every rest spot having a bed, and the
// animator passing the bed and facing through to the pose.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTER_SHAPES } from '../src/data/characterShapes.js';
import {
  REST_SEATS, REST_BEDS, REST_PREVIEW_BED, REST_PILLOW, REST_BLANKET, SLEEP_LOOPS,
} from '../src/data/home.js';
import {
  lyingBody, lyingHeadCenter, lyingLayout, breathIn, mouthOpen, mouthOpensAt,
} from '../src/ui/lying.js';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import { placeView } from '../src/game/places.js';
import { computeLayout } from '../src/ui/scene.js';
import { createAnimator, updateAnimator, poseOf } from '../src/ui/animator.js';

const STAGES = ['baby', 'child', 'teen', 'adult', 'elder'];
const SOFA = REST_BEDS['home.sofa'];
const BAG = REST_BEDS['yard.sleepingBag'];
const INHALE = 0.1;
const EXHALE = SLEEP_LOOPS.breath * 0.75;

test('every rest spot has a bed; the sleeping bag is its own cover and pillow', () => {
  for (const spot of Object.keys(REST_SEATS)) {
    const bed = REST_BEDS[spot];
    assert.ok(bed, spot);
    assert.equal(typeof bed.head, 'number', spot);
    assert.ok(['blanket', 'bag'].includes(bed.cover), spot);
    assert.ok(bed.headLift >= 0, spot);
  }
  assert.equal(BAG.cover, 'bag');
  assert.equal(BAG.pillow, false);
  assert.equal(SOFA.pillow, true);
  assert.equal(REST_BEDS['yard.tent'].pillow, true);
  assert.equal(REST_PREVIEW_BED.cover, 'blanket');
});

test('the head lies at the left end, raised on the pillow, with the pillow under it', () => {
  for (const stage of STAGES) {
    const shape = CHARACTER_SHAPES[stage];
    const lay = lyingLayout(shape, SOFA, 0);
    assert.equal(lay.headBottom, SOFA.headLift, stage);
    assert.equal(lay.headTop - lay.headBottom + 1, shape.head, stage);
    assert.equal(lay.body.left + shape.head, lay.body.torsoLeft, stage);
    assert.equal(lyingHeadCenter(shape), lay.body.left + shape.head / 2, stage);
    // The pillow reaches past the head on both sides, under it.
    assert.equal(lay.pillow.left, lay.body.left - REST_PILLOW.overhang, stage);
    assert.equal(lay.pillow.width, shape.head + 2 * REST_PILLOW.overhang, stage);
    assert.ok(lay.pillow.rows > lay.headBottom - 1, `${stage}: the head rests on the pillow`);
    assert.equal(lyingLayout(shape, BAG, 0).pillow, null, stage);
  }
});

test('the blanket covers the chest down past the feet, with the shirt only at the shoulders', () => {
  for (const stage of STAGES) {
    const shape = CHARACTER_SHAPES[stage];
    const lay = lyingLayout(shape, SOFA, EXHALE);
    const { body, shoulders, blanket } = lay;
    assert.equal(shoulders.left, body.torsoLeft, stage);
    assert.ok(shoulders.width >= 1 && shoulders.width <= REST_BLANKET.shoulders, stage);
    assert.equal(blanket[0].col, shoulders.left + shoulders.width, `${stage}: starts after the shoulders`);
    const cols = blanket.map((b) => b.col);
    assert.deepEqual(cols, cols.map((_, i) => cols[0] + i), `${stage}: no gaps`);
    assert.equal(cols.at(-1), body.legsLeft + body.legs, `${stage}: one past the toes`);
    // The feet make a bump: higher than the legs and the drape after them.
    const top = (col) => blanket.find((b) => b.col === col).top;
    const toes = body.legsLeft + body.legs - 1;
    assert.ok(top(toes) > top(cols.at(-1)), `${stage}: bump over the drape`);
    if (body.legs > 2) assert.ok(top(toes) > top(body.legsLeft), `${stage}: bump over the legs`);
    // The chest is as high as the shoulders when breathing out.
    assert.equal(top(cols[0]), shoulders.top, stage);
  }
});

test('the blanket over the chest rises 1 pixel and falls back with each breath', () => {
  assert.equal(breathIn(INHALE), 1);
  assert.equal(breathIn(EXHALE), 0);
  assert.equal(breathIn(SLEEP_LOOPS.breath + INHALE), 1);
  assert.ok(SLEEP_LOOPS.breath >= 1.5 && SLEEP_LOOPS.breath <= 2);
  for (const stage of STAGES) {
    const shape = CHARACTER_SHAPES[stage];
    const out = lyingLayout(shape, SOFA, EXHALE).blanket;
    const inn = lyingLayout(shape, SOFA, INHALE).blanket;
    const diffs = out.map((b, i) => inn[i].top - b.top);
    assert.ok(diffs.every((d) => d === 0 || d === 1), stage);
    assert.equal(diffs[0], 1, `${stage}: the chest rises`);
    assert.equal(diffs.at(-1), 0, `${stage}: the feet stay`);
    assert.equal(diffs.at(-2), 0, `${stage}: the feet stay`);
  }
});

test('the sleeping mouth opens to a tiny "o" every 4-6 seconds, briefly', () => {
  const [min, max] = SLEEP_LOOPS.mouthEvery;
  assert.ok(min >= 4 && max <= 6);
  let last = 0;
  for (let k = 0; k < 300; k++) {
    const at = mouthOpensAt(k);
    const gap = at - last;
    assert.ok(gap >= min - 1e-9 && gap <= max + 1e-9, `gap ${k}: ${gap}`);
    assert.equal(mouthOpen(at + SLEEP_LOOPS.mouthOpen / 2), true, `open ${k}`);
    assert.equal(mouthOpen(at + SLEEP_LOOPS.mouthOpen + 0.01), false, `closed after ${k}`);
    assert.equal(mouthOpen(at - 0.01), false, `closed before ${k}`);
    last = at;
  }
  // Mostly closed: open a small share of the time, the same every run.
  let open = 0;
  for (let t = 0; t < 600; t += 0.05) if (mouthOpen(t)) open++;
  const share = open / (600 / 0.05);
  assert.ok(share > 0.08 && share < 0.16, `open share ${share}`);
  assert.equal(mouthOpensAt(7), mouthOpensAt(7));
});

test('every stage lying down fits the sprite layer (32 wide, anchor 16)', () => {
  for (const stage of STAGES) {
    const shape = CHARACTER_SHAPES[stage];
    const body = lyingBody(shape);
    const lay = lyingLayout(shape, SOFA, INHALE);
    // A bun sticks out 3 past the crown; the outline needs 1 more.
    const leftmost = Math.min(body.left - 3, lay.pillow.left) - 1;
    const rightmost = lay.blanket.at(-1).col + 1;
    assert.ok(leftmost >= -16, `${stage}: ${leftmost}`);
    assert.ok(rightmost <= 15, `${stage}: ${rightmost}`);
  }
});

test('resting passes the bed and facing right through to the pose', () => {
  const game = startNewLife({ clock: createClock() });
  game.housing.movedOut = true;
  game.housing.tier = 'sleepingBag';
  game.place = 'myYard';
  const layout = computeLayout(320, 240, placeView(game, 'myYard'));
  const anim = createAnimator(layout);
  const stay = { x: anim.x, mode: 'resting', lift: 9, facing: 1, bed: BAG };
  updateAnimator(anim, 0.1, 'adult', 'walk', { stay });
  updateAnimator(anim, 0.1, 'adult', 'walk', { stay });
  const pose = poseOf(anim, 'adult');
  assert.equal(pose.lying, true);
  assert.equal(pose.facing, 1);
  assert.equal(pose.lift, 9);
  assert.deepEqual(pose.bed, BAG);
  updateAnimator(anim, 0.1, 'adult', 'walk', {});
  assert.equal(poseOf(anim, 'adult').bed, null);
});
