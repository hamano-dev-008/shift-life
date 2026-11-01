// renderer.js — Renderer entry point: loads the saved life or starts a new
// one, runs the clock and life events, draws each frame, and wires up
// controls and saving.

import { createClock, startClock } from './game/clock.js';
import { createCharacter, ageOf, lifeStageOf, expressionOf, setStat } from './game/character.js';
import {
  createEventState, updateEvents, startEvent, postponeAutoDecide, pendingEventView, chooseEvent,
} from './game/events.js';
import { loadGame, saveGame, saveGameNow } from './game/save.js';
import { RESULT_BUBBLE_SECONDS } from './data/animation.js';
import { computeLayout, createBackground } from './ui/scene.js';
import { createAnimator, updateAnimator, poseOf } from './ui/animator.js';
import { drawCharacter } from './ui/sprite.js';
import {
  bubbleBottomY, drawEventBubble, placeOver, placeSpeech, formatDeltas,
} from './ui/bubble.js';
import { createEventCard } from './ui/eventCard.js';
import { createStatsPanel } from './ui/statsPanel.js';

const AUTOSAVE_MS = 10000;
// Events run on their own timer, like the clock, so they keep going (and
// auto-decide) while the window is minimized.
const EVENT_TICK_MS = 250;
// Caps one frame's animation step so a stalled window doesn't teleport the
// character when it resumes.
const MAX_FRAME_SECONDS = 0.1;
// Happiness values the Ctrl+Shift+M dev shortcut cycles through (smile,
// neutral, frown).
const DEV_MOODS = [80, 50, 20];

// The canvas matches the window's size in CSS pixels. The art is drawn
// in scene pixels and scaled up by whole numbers (see data/layout.js).
const canvas = document.getElementById('scene');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const ctx = canvas.getContext('2d');
const layout = computeLayout(canvas.width, canvas.height);
const label = document.getElementById('label');
const eventBubble = document.getElementById('event-bubble');
const speech = document.getElementById('speech');

function newGame() {
  const clock = createClock();
  return { clock, character: createCharacter(clock.years), events: createEventState(clock.years) };
}

function setLabel(text) {
  if (label.textContent !== text) label.textContent = text;
}

async function start() {
  const game = (await loadGame()) ?? newGame();
  saveGame(game);
  startClock(game.clock);
  setInterval(() => saveGame(game), AUTOSAVE_MS);
  // Fires however the window closes (button, Alt+F4, taskbar).
  window.addEventListener('beforeunload', () => saveGameNow(game));

  // Shows what happened after an event in a text bubble for a few seconds.
  // Nothing here focuses or flashes the window: events never pull the
  // player away from other apps.
  let speechUntil = 0;
  function showResult(result) {
    speech.textContent = result.text;
    const deltas = formatDeltas(result.deltas);
    if (deltas) {
      const line = document.createElement('span');
      line.className = 'deltas';
      line.textContent = deltas;
      speech.append(line);
    }
    speechUntil = performance.now() + RESULT_BUBBLE_SECONDS * 1000;
  }

  const eventCard = createEventCard(document.getElementById('event-card'), {
    onChoose: (index) => {
      const result = chooseEvent(game, index);
      if (!result) return;
      eventCard.close();
      showResult(result);
      saveGame(game);
    },
    // Closed without choosing: give the player another full wait.
    onDismiss: () => postponeAutoDecide(game),
  });
  eventBubble.addEventListener('click', () => {
    const view = pendingEventView(game);
    if (view) eventCard.open(view);
  });

  setInterval(() => {
    const result = updateEvents(game, { holdAutoDecide: eventCard.isOpen() });
    if (result) {
      showResult(result);
      saveGame(game);
    }
  }, EVENT_TICK_MS);

  const statsPanel = createStatsPanel(label, document.getElementById('stats'));

  // Hidden developer shortcuts: Ctrl+Shift+F toggles fast-forward,
  // Ctrl+Shift+M cycles happiness, Ctrl+Shift+E starts an event now.
  window.addEventListener('keydown', (event) => {
    if (!event.ctrlKey || !event.shiftKey) return;
    if (event.code === 'KeyF') {
      game.clock.fastForward = !game.clock.fastForward;
    } else if (event.code === 'KeyM') {
      const { happiness } = game.character.stats;
      setStat(game.character, 'happiness', DEV_MOODS.find((mood) => mood < happiness) ?? DEV_MOODS[0]);
    } else if (event.code === 'KeyE') {
      startEvent(game);
    }
  });

  const background = createBackground(layout);
  const animator = createAnimator(layout);
  let last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
    last = now;
    const age = ageOf(game.character, game.clock.years);
    const stage = lifeStageOf(age);

    updateAnimator(animator, dt, stage);
    const pose = poseOf(animator, stage);
    ctx.drawImage(background, 0, 0);
    drawCharacter(ctx, pose, stage, game.character.appearance,
      expressionOf(game.character), layout.feetY, layout.scale);
    setLabel(`${game.character.name} · ${age}y${game.clock.fastForward ? ' >>' : ''}`);

    // Bubbles follow the character's head. The result text takes the spot
    // first; a new "!" waits until it's gone.
    const bubbleY = bubbleBottomY(layout, stage);
    const speaking = now < speechUntil;
    speech.hidden = !speaking;
    if (speaking) placeSpeech(speech, layout, pose.x, bubbleY);
    const showBubble = Boolean(game.events.pending) && !speaking && !eventCard.isOpen();
    eventBubble.hidden = !showBubble;
    if (showBubble) {
      placeOver(eventBubble, drawEventBubble(ctx, layout, pose.x, bubbleY, animator.time));
    }
    statsPanel.update(game.character);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.getElementById('minimize-btn').addEventListener('click', () => window.shiftLife.minimize());
document.getElementById('close-btn').addEventListener('click', () => window.shiftLife.close());

start();
