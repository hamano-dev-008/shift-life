// renderer.js — Renderer entry point: loads the saved life or starts a new
// one, runs the clock, draws each frame, and wires up controls and saving.

import { createClock, startClock } from './game/clock.js';
import { createCharacter, ageOf, lifeStageOf } from './game/character.js';
import { loadGame, saveGame, saveGameNow } from './game/save.js';
import { createBackground, FEET_Y } from './ui/scene.js';
import { createAnimator, updateAnimator, poseOf } from './ui/animator.js';
import { drawCharacter } from './ui/sprite.js';

const AUTOSAVE_MS = 10000;
// Caps one frame's animation step so a stalled window doesn't teleport the
// character when it resumes.
const MAX_FRAME_SECONDS = 0.1;

// The scene is drawn on a low-res canvas (160x120) that CSS scales up 2x
// with nearest-neighbour filtering, so every pixel stays a crisp square.
const canvas = document.getElementById('scene');
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

  // Hidden developer shortcut: toggle fast-forward.
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyF') {
      game.clock.fastForward = !game.clock.fastForward;
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
    drawCharacter(ctx, poseOf(animator, stage), stage, game.character.appearance, FEET_Y);
    setLabel(`${game.character.name} · ${age}y${game.clock.fastForward ? ' >>' : ''}`);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.getElementById('minimize-btn').addEventListener('click', () => window.shiftLife.minimize());
document.getElementById('close-btn').addEventListener('click', () => window.shiftLife.close());

start();
