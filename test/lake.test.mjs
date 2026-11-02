// lake.test.mjs — The Lake: where it sits on the map and the routes to it,
// its feet row and walking limits in the layout, the dock's click area and
// fishing spot, work trips leaving by the open side, and the water shimmer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import {
  placeView, routeBetween, exitBetween, existingPlaces, restorePlace, enterPlace,
} from '../src/game/places.js';
import { computeLayout, propRect } from '../src/ui/scene.js';
import { createAnimator, goToWorkNow, updateAnimator } from '../src/ui/animator.js';
import { shimmerSparkles } from '../src/ui/lake.js';
import {
  LAKE_PLACE, LAKE_ART, LAKE_FEET_FROM_BOTTOM, LAKE_WALK, DOCK, DOCK_PROP, FISHING_SPOT_X, SHIMMER,
} from '../src/data/lake.js';
import { SCENE_SCALE, FEET_FROM_BOTTOM, WANDER_MARGIN } from '../src/data/layout.js';

const W = 320;
const H = 240;

function child() {
  return startNewLife({ clock: createClock() });
}

function adult() {
  const game = child();
  game.clock.years = 30;
  game.housing.movedOut = true;
  game.place = 'myYard';
  return game;
}

test('the Lake is left of the Fortune Tree, linked both ways through the edges', () => {
  const game = child();
  assert.deepEqual(exitBetween(game, 'fortuneTree', LAKE_PLACE), { to: LAKE_PLACE, via: 'left' });
  assert.deepEqual(exitBetween(game, LAKE_PLACE, 'fortuneTree'), { to: 'fortuneTree', via: 'right' });
  assert.equal(existingPlaces(game)[0].id, LAKE_PLACE);
  assert.equal(restorePlace(LAKE_PLACE), LAKE_PLACE);
  enterPlace(game, LAKE_PLACE);
  assert.equal(game.place, LAKE_PLACE);
});

test('routes to the Lake pass through the places in between, for babies and adults', () => {
  const baby = child();
  assert.deepEqual(routeBetween(baby, 'home', LAKE_PLACE), ['yard', 'fortuneTree', LAKE_PLACE]);
  assert.deepEqual(routeBetween(baby, LAKE_PLACE, 'home'), ['fortuneTree', 'yard', 'home']);
  const grown = adult();
  grown.housing.tier = 'house';
  assert.deepEqual(routeBetween(grown, 'myHome', LAKE_PLACE), ['myYard', 'fortuneTree', LAKE_PLACE]);
  assert.deepEqual(routeBetween(grown, LAKE_PLACE, 'myYard'), ['fortuneTree', 'myYard']);
});

test('the Lake has its own feet row and walking limits; other places keep theirs', () => {
  const game = child();
  const lake = computeLayout(W, H, placeView(game, LAKE_PLACE));
  assert.equal(lake.feetY, H - LAKE_FEET_FROM_BOTTOM * SCENE_SCALE);
  // Row 68 of the picture, drawn from the window's bottom.
  assert.equal(lake.feetY, H - (LAKE_ART.height - 68) * SCENE_SCALE);
  assert.equal(lake.wanderMinX, LAKE_WALK.minX * SCENE_SCALE);
  assert.equal(lake.wanderMaxX, W - WANDER_MARGIN * SCENE_SCALE);
  assert.deepEqual(lake.openSides, { left: false, right: true });

  for (const id of ['fortuneTree', 'yard', 'home']) {
    const layout = computeLayout(W, H, placeView(game, id));
    assert.equal(layout.feetY, H - FEET_FROM_BOTTOM * SCENE_SCALE);
    assert.equal(layout.wanderMinX, WANDER_MARGIN * SCENE_SCALE);
    assert.deepEqual(layout.openSides, { left: true, right: true });
  }
});

test('the dock is clickable over its data box, with the fishing spot near its tip', () => {
  const game = child();
  const view = placeView(game, LAKE_PLACE);
  assert.ok(DOCK_PROP in view.targets);
  const layout = computeLayout(W, H, view);
  const rect = propRect(layout, DOCK_PROP);
  const s = SCENE_SCALE;
  const top = H - (LAKE_ART.height - DOCK.top) * s;
  assert.deepEqual({ left: rect.left, top: rect.top, width: rect.width, height: rect.height }, {
    left: DOCK.left * s,
    top,
    width: (DOCK.right - DOCK.left + 1) * s,
    height: (DOCK.bottom - DOCK.top + 1) * s,
  });
  assert.equal(layout.props[DOCK_PROP].visitX, FISHING_SPOT_X * s);
  assert.ok(layout.props[DOCK_PROP].visitX >= layout.wanderMinX);
});

test('work trips from the Lake leave by the open right side, even from the dock tip', () => {
  const layout = computeLayout(W, H, placeView(child(), LAKE_PLACE));
  const anim = createAnimator(layout);
  anim.x = layout.wanderMinX;
  anim.gridX = Math.round(anim.x / layout.characterScale);
  goToWorkNow(anim);
  assert.equal(anim.destination, 'work');
  assert.ok(anim.targetX > W);

  const tree = computeLayout(W, H, placeView(child(), 'fortuneTree'));
  const near = createAnimator(tree);
  near.x = tree.wanderMinX;
  goToWorkNow(near);
  assert.ok(near.targetX < 0);
});

test('wandering at the Lake stays between the dock tip and the right edge', () => {
  const layout = computeLayout(W, H, placeView(child(), LAKE_PLACE));
  const anim = createAnimator(layout);
  for (let i = 0; i < 4000; i++) {
    updateAnimator(anim, 0.05, 'adult', 'walk');
    assert.ok(anim.x >= layout.wanderMinX - 1 && anim.x <= layout.wanderMaxX + 1, `x ${anim.x}`);
  }
});

test('the shimmer is a few sparkles on open water that twinkle and drift', () => {
  const { area, avoid, count, colors } = SHIMMER;
  let shown = 0;
  const spots = new Set();
  for (let t = 0; t < 120; t += 0.25) {
    const sparkles = shimmerSparkles(t);
    assert.ok(sparkles.length <= count);
    assert.deepEqual(sparkles, shimmerSparkles(t));
    for (const { x, y, width, color } of sparkles) {
      assert.ok(colors.includes(color));
      for (let col = x; col < x + width; col++) {
        assert.ok(col >= area.left && col <= area.right && y >= area.top && y <= area.bottom);
        assert.ok(!avoid.some((box) => col >= box.left && col <= box.right && y >= box.top && y <= box.bottom));
      }
      spots.add(`${x},${y}`);
    }
    shown += sparkles.length;
  }
  // Some show at any time on average, but not all of them (it's subtle),
  // and they move about.
  assert.ok(shown > 0 && shown / 480 < count * 0.75);
  assert.ok(spots.size > count * 3);
});
