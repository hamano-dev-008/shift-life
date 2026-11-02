// interaction.js — Pixel-shaped click regions and a visual-only poke wiggle.
import { POKE } from '../data/interaction.js';

export function reactionPose(pose, state, now, scale) {
  const elapsed = now - state.reactionAt;
  if (elapsed >= POKE.reactionMs) return { pose, expression: null };
  const direction = Math.floor(elapsed / POKE.wiggleBeatMs) % 2 ? -1 : 1;
  return { pose: { ...pose, x: pose.x + direction * POKE.wigglePixels * scale },
    expression: state.reaction };
}

export function createCharacterTarget(element, width, height, onPoke) {
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const ctx = mask.getContext('2d', { willReadFrequently: true });
  let pressed = null;
  element.setAttribute('aria-label', POKE.label);
  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    pressed = { x: event.clientX, y: event.clientY, at: performance.now(), moved: false };
    element.setPointerCapture(event.pointerId);
  });
  element.addEventListener('pointermove', (event) => {
    if (pressed && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > POKE.clickSlop) {
      pressed.moved = true;
    }
  });
  element.addEventListener('pointercancel', () => { pressed = null; });
  element.addEventListener('pointerup', (event) => {
    const down = pressed;
    pressed = null;
    if (!down || down.moved || event.button !== 0 || performance.now() - down.at > POKE.clickMs
      || Math.hypot(event.clientX - down.x, event.clientY - down.y) > POKE.clickSlop) return;
    const { left, top } = element.getBoundingClientRect();
    const x = Math.floor(event.clientX - left);
    const y = Math.floor(event.clientY - top);
    if (x >= 0 && y >= 0 && x < width && y < height
      && ctx.getImageData(x, y, 1, 1).data[3]) onPoke(performance.now());
  });
  return {
    ctx,
    update(draw) {
      ctx.clearRect(0, 0, width, height);
      draw(ctx);
      const pixels = ctx.getImageData(0, 0, width, height).data;
      // Only painted runs take pokes, so clicks in transparent gaps reach what's behind.
      const rects = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!pixels[(y * width + x) * 4 + 3]) continue;
          const start = x;
          while (x < width && pixels[(y * width + x) * 4 + 3]) x++;
          rects.push({ x: start, y, width: x - start });
        }
      }
      element.hidden = rects.length === 0;
      while (element.children.length > rects.length) element.lastChild.remove();
      rects.forEach((rect, index) => {
        const run = element.children[index] ?? element.appendChild(document.createElement('span'));
        Object.assign(run.style, { left: rect.x + 'px', top: rect.y + 'px',
          width: rect.width + 'px', height: '1px' });
      });
    },
  };
}
