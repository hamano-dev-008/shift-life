// renderer.js — Renderer entry point: loads the saved life or starts a new
// one, runs the clock, life events and goals, draws each frame, and wires
// up controls, the dev settings menu (dev runs only) and saving.

import { createClock, startClock } from './game/clock.js';
import { createCharacter, ageOf, lifeStageOf, expressionOf, setStat } from './game/character.js';
import {
  createEventState, updateEvents, startEvent, postponeAutoDecide, pendingEventView, chooseEvent,
} from './game/events.js';
import {
  createGoalState, updateGoals, setGoal, goalView, activeActivity,
} from './game/goals.js';
import { loadGame, saveGame, saveGameNow } from './game/save.js';
import {
  newLife, setSpeed, toggleFastForward, skipYears, triggerEvent, addMoney, devReadout,
} from './game/dev.js';
import { RESULT_BUBBLE_SECONDS, MILESTONE_BUBBLE_SECONDS } from './data/animation.js';
import { SPEEDS } from './data/balance.js';
import { computeLayout, createBackground } from './ui/scene.js';
import {
  createAnimator, updateAnimator, poseOf, startActivityNow,
} from './ui/animator.js';
import { drawCharacter } from './ui/sprite.js';
import {
  bubbleBottomY, drawEventBubble, placeOver, placeSpeech, formatDeltas,
} from './ui/bubble.js';
import { createEventCard } from './ui/eventCard.js';
import { createGoalMenu } from './ui/goalMenu.js';
import { createDevMenu } from './ui/devMenu.js';
import { createStatsPanel } from './ui/statsPanel.js';

const AUTOSAVE_MS = 10000;
// Events and goals run on their own timer, like the clock, so they keep
// going (and auto-decide) while the window is minimized.
const LIFE_TICK_MS = 250;
// Caps one frame's animation step so a stalled window doesn't teleport the
// character when it resumes.
const MAX_FRAME_SECONDS = 0.1;
// Happiness values the Ctrl+Shift+M dev shortcut cycles through (smile,
// neutral, frown).
const DEV_MOODS = [80, 50, 20];
// Most bubbles waiting to be shown (e.g. after a long time minimized); the
// oldest event results are dropped first, milestones are kept.
const MAX_QUEUED_BUBBLES = 4;

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
  return {
    clock,
    character: createCharacter(clock.years),
    events: createEventState(clock.years),
    goals: createGoalState(clock.years),
  };
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

  // Text bubbles over the head (event results, milestone celebrations) are
  // queued and shown one at a time by the frame loop. Nothing here focuses
  // or flashes the window: they never pull the player away from other apps.
  const bubbles = [];
  let speechUntil = 0;
  function queueBubble(bubble) {
    bubbles.push(bubble);
    if (bubbles.length > MAX_QUEUED_BUBBLES) {
      const oldest = bubbles.findIndex((queued) => !queued.celebrate);
      bubbles.splice(oldest === -1 ? 0 : oldest, 1);
    }
  }
  function showBubble(bubble, now) {
    speech.replaceChildren();
    speech.classList.toggle('celebrate', bubble.celebrate);
    if (bubble.heading) {
      const heading = document.createElement('span');
      heading.className = 'heading';
      heading.textContent = bubble.heading;
      speech.append(heading);
    }
    speech.append(bubble.text);
    if (bubble.detail) {
      const line = document.createElement('span');
      line.className = 'deltas';
      line.textContent = bubble.detail;
      speech.append(line);
    }
    speechUntil = now + bubble.seconds * 1000;
  }
  const showResult = (result) => queueBubble({
    text: result.text, detail: formatDeltas(result.deltas), seconds: RESULT_BUBBLE_SECONDS, celebrate: false,
  });
  const celebrate = (milestone) => queueBubble({
    heading: 'Milestone!', text: milestone.label, detail: milestone.goalLabel,
    seconds: MILESTONE_BUBBLE_SECONDS, celebrate: true,
  });

  // The event card, goal menu and dev menu share the space below the top
  // bar, so opening one closes the others.
  let devMenu = null;
  function closeEventCard() {
    if (!eventCard.isOpen()) return;
    eventCard.close();
    postponeAutoDecide(game);
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
  const goalMenu = createGoalMenu(document.getElementById('goal-menu'),
    document.getElementById('goal-btn'), {
      onPick: (id) => {
        if (setGoal(game, id)) saveGame(game);
      },
      onOpen: () => {
        closeEventCard();
        devMenu?.close();
      },
    });
  function openEventCard() {
    const view = pendingEventView(game);
    if (!view) return;
    goalMenu.close();
    devMenu?.close();
    eventCard.open(view);
  }
  eventBubble.addEventListener('click', openEventCard);

  setInterval(() => {
    const result = updateEvents(game, { holdAutoDecide: eventCard.isOpen() });
    if (result) showResult(result);
    const reached = updateGoals(game);
    reached.forEach(celebrate);
    if (result || reached.length) saveGame(game);
  }, LIFE_TICK_MS);

  const statsPanel = createStatsPanel(label, document.getElementById('stats'));
  const background = createBackground(layout);
  let animator = createAnimator(layout);

  // Developer settings, only when running from source (npm start). The
  // menu calls the game/dev.js actions through these wrappers, which also
  // keep the screen in step (saving, bubbles, the event card).
  if (await window.shiftLife.isDev()) {
    const gear = document.getElementById('dev-btn');
    gear.hidden = false;
    devMenu = createDevMenu(document.getElementById('dev-menu'), gear, {
      newLife: () => {
        newLife(game);
        saveGameNow(game);
        bubbles.length = 0;
        speechUntil = 0;
        eventCard.close();
        goalMenu.close();
        animator = createAnimator(layout);
      },
      setSpeed: (speed) => setSpeed(game, speed),
      speed: () => game.clock.speed,
      skipYears: (years) => skipYears(game, years),
      triggerEvent: () => {
        if (!triggerEvent(game)) return false;
        openEventCard();
        return true;
      },
      addMoney: (amount) => {
        addMoney(game, amount);
        saveGame(game);
      },
      readout: () => devReadout(game),
      onOpen: () => {
        closeEventCard();
        goalMenu.close();
      },
    });
  }

  // Hidden developer shortcuts: Ctrl+Shift+F toggles fast-forward,
  // Ctrl+Shift+M cycles happiness, Ctrl+Shift+E starts an event now,
  // Ctrl+Shift+A starts the goal's idle activity now.
  window.addEventListener('keydown', (event) => {
    if (!event.ctrlKey || !event.shiftKey) return;
    if (event.code === 'KeyF') {
      toggleFastForward(game);
    } else if (event.code === 'KeyM') {
      const { happiness } = game.character.stats;
      setStat(game.character, 'happiness', DEV_MOODS.find((mood) => mood < happiness) ?? DEV_MOODS[0]);
    } else if (event.code === 'KeyE') {
      startEvent(game);
    } else if (event.code === 'KeyA') {
      startActivityNow(animator, activeActivity(game));
    }
  });

  let last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
    last = now;
    const age = ageOf(game.character, game.clock.years);
    const stage = lifeStageOf(age);

    updateAnimator(animator, dt, stage, activeActivity(game));
    const pose = poseOf(animator, stage);
    ctx.drawImage(background, 0, 0);
    drawCharacter(ctx, pose, stage, game.character.appearance,
      expressionOf(game.character), layout.feetY, layout.characterScale);
    const { mark } = SPEEDS[game.clock.speed];
    setLabel(`${game.character.name} · ${age}y${mark ? ` ${mark}` : ''}`);

    // Bubbles follow the character's head. Text bubbles take the spot
    // first; a new "!" waits until they're done.
    if (now >= speechUntil && bubbles.length) showBubble(bubbles.shift(), now);
    const bubbleY = bubbleBottomY(layout, stage);
    const speaking = now < speechUntil;
    speech.hidden = !speaking;
    if (speaking) placeSpeech(speech, layout, pose.x, bubbleY);
    const showAlert = Boolean(game.events.pending) && !speaking && !eventCard.isOpen();
    eventBubble.hidden = !showAlert;
    if (showAlert) {
      placeOver(eventBubble, drawEventBubble(ctx, layout, pose.x, bubbleY, animator.time));
    }
    statsPanel.update(game.character);
    goalMenu.update(goalView(game));
    devMenu?.update();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.getElementById('minimize-btn').addEventListener('click', () => window.shiftLife.minimize());
document.getElementById('close-btn').addEventListener('click', () => window.shiftLife.close());

start();
