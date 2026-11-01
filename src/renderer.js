// renderer.js — Renderer entry point: loads the saved life or starts a new
// one, runs the clock, draws each frame, and wires up controls and saving.

import { createClock, startClock } from './game/clock.js';
import { createCharacter, ageOf, lifeStageOf, expressionOf, setMood } from './game/character.js';
import { loadGame, saveGame, saveGameNow } from './game/save.js';
import { SCENE_WIDTH, SCENE_HEIGHT, FEET_Y } from './data/layout.js';
import { createBackground } from './ui/scene.js';
import { createAnimator, updateAnimator, poseOf } from './ui/animator.js';
import { drawCharacter } from './ui/sprite.js';

const AUTOSAVE_MS = 10000;
// Caps one frame's animation step so a stalled window doesn't teleport the
// character when it resumes.
const MAX_FRAME_SECONDS = 0.1;
// Moods the Ctrl+Shift+M dev shortcut cycles through (smile, neutral, frown).
const DEV_MOODS = [80, 50, 20];

// The scene is drawn on a low-res canvas that CSS scales up 2x with
// nearest-neighbour filtering, so every pixel stays a crisp square.
const canvas = document.getElementById('scene');
canvas.width = SCENE_WIDTH;
canvas.height = SCENE_HEIGHT;
const ctx = canvas.getContext('2d');
const label = document.getElementById('label');

function newGame() {
  const clock = createClock();
  return { clock, character: createCharacter(clock.years) };
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

  // Hidden developer shortcuts: Ctrl+Shift+F toggles fast-forward,
  // Ctrl+Shift+M cycles the placeholder mood.
  window.addEventListener('keydown', (event) => {
    if (!event.ctrlKey || !event.shiftKey) return;
    if (event.code === 'KeyF') {
      game.clock.fastForward = !game.clock.fastForward;
    } else if (event.code === 'KeyM') {
      const next = DEV_MOODS.find((mood) => mood < game.character.mood) ?? DEV_MOODS[0];
      setMood(game.character, next);
    }
  });

  const background = createBackground();
  const animator = createAnimator();
  let last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
    last = now;
    const age = ageOf(game.character, game.clock.years);
    const stage = lifeStageOf(age);

    updateAnimator(animator, dt, stage);
    ctx.drawImage(background, 0, 0);
    drawCharacter(ctx, poseOf(animator, stage), stage, game.character.appearance,
      expressionOf(game.character), FEET_Y);
    setLabel(`${game.character.name} · ${age}y${game.clock.fastForward ? ' >>' : ''}`);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.getElementById('minimize-btn').addEventListener('click', () => window.shiftLife.minimize());
document.getElementById('close-btn').addEventListener('click', () => window.shiftLife.close());

start();
