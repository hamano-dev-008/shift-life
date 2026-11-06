// applePick.test.mjs — Picking the golden apple: walking under it first,
// then the branch, the poking, the fall (when it's decided), holding up a
// won apple or the fairies of a lost one (and the well glowing as they
// go in), stopping, leaving, and what the bar and menu say.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/game/clock.js';
import { startNewLife } from '../src/game/endOfLife.js';
import {
  startPicking, stopPicking, isPicking, updateFortuneTree, makeAppleReady, startPlaying, isPlaying, treeView,
} from '../src/game/fortuneTree.js';
import { arriveAtStay, stayKey, stayFreezesEvents } from '../src/game/stay.js';
import { activityBarView, stopFromBar } from '../src/game/activityBar.js';
import { enterPlace } from '../src/game/places.js';
import { saveGame } from '../src/game/save.js';
import { PICK, APPLE_REWARD, TREE_TEXT, FORTUNE_TREE_PLACE } from '../src/data/fortuneTree.js';
import { FAIRIES } from '../src/data/fortuneTreeDecor.js';
import { wellGlowLevel } from '../src/ui/applePick.js';

const won = () => 0;
const lost = () => 0.999;

function atTree(age = 20) {
  const game = startNewLife({ clock: createClock() });
  game.clock.years = age + 0.5;
  game.endOfLife.checkedAge = age;
  game.housing.movedOut = age >= 18;
  game.place = FORTUNE_TREE_PLACE;
  game.character.stats.money = 0;
  makeAppleReady(game);
  return game;
}

// Runs the tree's real-time update for `seconds` in 250ms ticks; returns
// the bubbles.
function run(game, seconds, random) {
  const bubbles = [];
  for (let ms = 0; ms < seconds * 1000; ms += 250) bubbles.push(...updateFortuneTree(game, 250, random));
  return bubbles;
}

const untilFall = PICK.pickUp + PICK.poke;

test('picking needs an apple and the age, stops busking, and only counts once under the apple', () => {
  const young = atTree(4);
  assert.equal(startPicking(young), false);
  const none = atTree();
  none.fortuneTree.appleReady = false;
  assert.equal(startPicking(none), false);

  const game = atTree();
  assert.equal(startPlaying(game), true);
  assert.equal(startPicking(game), true);
  assert.equal(isPlaying(game), false);
  assert.equal(startPicking(game), false, 'one pick at a time');
  assert.equal(startPlaying(game), false, 'no busking while picking');
  assert.equal(stayKey(game), 'picking');
  assert.equal(activityBarView(game).text, TREE_TEXT.pickOnTheWay);
  // On the way nothing happens, however long.
  run(game, 60, won);
  assert.equal(game.fortuneTree.picking.step, 'pickUp');
  assert.equal(game.fortuneTree.appleReady, true);
  arriveAtStay(game);
  assert.equal(activityBarView(game).text, TREE_TEXT.pickBar);
  assert.equal(stayFreezesEvents(game), false, 'a few seconds; events carry on');
  assert.equal(treeView(game).picking, true);
});

test('the branch, the poking, then the apple falls; a won one pays as it falls and is held up before its bubble', () => {
  const game = atTree();
  startPicking(game);
  arriveAtStay(game);
  assert.deepEqual(run(game, PICK.pickUp - 0.25, won), []);
  assert.equal(game.fortuneTree.picking.step, 'pickUp');
  run(game, 0.25, won);
  assert.equal(game.fortuneTree.picking.step, 'poke');
  assert.equal(game.fortuneTree.appleReady, true, 'still hanging while poked');
  assert.deepEqual(run(game, PICK.poke, won), []);
  assert.equal(game.fortuneTree.picking.step, 'fall');
  assert.equal(game.fortuneTree.appleReady, false);
  assert.equal(game.character.stats.money, APPLE_REWARD, 'paid as it falls');
  assert.deepEqual(run(game, PICK.fall, won), []);
  assert.equal(game.fortuneTree.picking.step, 'hold');
  const held = run(game, PICK.hold, won);
  assert.equal(held.length, 1);
  assert.equal(held[0].celebrate, true);
  assert.equal(held[0].deltas.money, APPLE_REWARD);
  assert.equal(isPicking(game), false);
  assert.equal(game.fortuneTree.applesWon, 1);
  assert.equal(stayKey(game), null);
});

test('a lost apple bursts into fairies: the bubble says so as it lands, nothing paid', () => {
  const game = atTree();
  game.fortuneTree.sessions = 3;
  startPicking(game);
  arriveAtStay(game);
  const bubbles = run(game, untilFall + PICK.fall, lost);
  assert.equal(bubbles.length, 1);
  assert.equal(bubbles[0].text, TREE_TEXT.appleLost.text);
  assert.equal(bubbles[0].celebrate, false);
  assert.equal(game.fortuneTree.picking.step, 'fairies');
  assert.equal(game.character.stats.money, 0);
  assert.equal(game.fortuneTree.sessions, 3, 'sessions still count toward the next');
  run(game, PICK.fairies, lost);
  assert.equal(isPicking(game), false);
  assert.equal(game.fortuneTree.appleReady, false, 'the next apple starts growing');
});

test('stopping before the fall leaves the apple on the tree; after it, the unshown result comes back', () => {
  const early = atTree();
  startPicking(early);
  arriveAtStay(early);
  run(early, PICK.pickUp + 1, won);
  assert.deepEqual(stopFromBar(early), { stopped: true, news: null });
  assert.equal(early.fortuneTree.appleReady, true);
  assert.equal(early.character.stats.money, 0);

  const falling = atTree();
  startPicking(falling);
  arriveAtStay(falling);
  run(falling, untilFall, won);
  assert.equal(falling.fortuneTree.picking.step, 'fall');
  const { stopped, news } = stopFromBar(falling);
  assert.equal(stopped, true);
  assert.equal(news.celebrate, true);
  assert.equal(stopPicking(falling), null);
});

test('leaving the Fortune Tree calls the pick off; it is never saved', () => {
  const game = atTree();
  startPicking(game);
  let written = null;
  globalThis.window = { shiftLife: { save: (data) => { written = data; } } };
  saveGame(game);
  delete globalThis.window;
  assert.equal(written.fortuneTree.picking, null);
  assert.ok(isPicking(game), 'saving leaves the pick under way');
  enterPlace(game, 'lake');
  assert.equal(isPicking(game), false);
  assert.equal(game.fortuneTree.appleReady, true);
});

test('if the apple goes before it falls, the pick ends', () => {
  const game = atTree();
  startPicking(game);
  arriveAtStay(game);
  game.fortuneTree.appleReady = false;
  run(game, 0.25, won);
  assert.equal(isPicking(game), false);
});

test('the well glows a step brighter as each fairy goes in, then fades out before the pick is over', () => {
  const levels = [];
  for (let t = 0; t <= PICK.fairies; t += 0.05) levels.push(wellGlowLevel(t));
  assert.equal(levels[0], 0, 'dark until the first is in');
  const peak = levels.indexOf(1);
  assert.ok(peak > 0, 'full once all are in');
  const rising = levels.slice(0, peak + 1);
  assert.deepEqual(rising, [...rising].sort((a, b) => a - b), 'only brighter while they go in');
  assert.deepEqual(new Set(rising), new Set(Array.from({ length: FAIRIES.count + 1 }, (_, i) => i / FAIRIES.count)));
  const fading = levels.slice(peak);
  assert.deepEqual(fading, [...fading].sort((a, b) => b - a), 'only dimmer after');
  assert.equal(levels.at(-1), 0, 'dark again before the pick ends');
});
