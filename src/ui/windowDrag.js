// windowDrag.js — Moves the window by dragging it, in JS instead of OS drag
// regions (-webkit-app-region), which on Windows go stale and swallow real
// clicks. A press on the background, a prop, the character or a critter
// becomes a drag once the pointer has moved past WINDOW_DRAG.threshold;
// then the window follows the pointer (once per animation frame) and the
// press never counts as a click or poke. Buttons, panels, bars and
// bubbles never start a drag.
import { WINDOW_DRAG } from '../data/interaction.js';

// Presses inside these stay ordinary clicks: they never drag the window.
const NO_DRAG = '.panel, #controls, #label, #place.at-work, #stats, #activity-bar, #event-bubble, #bite-bubble, '
  + '#reveal-close, #speech.clickable';

// api: { getPosition() -> Promise<{ x, y }>, setPosition(x, y), endDrag() }
// (window.shiftLife's window calls). Returns { isDragging() }: whether the
// window is being dragged right now.
export function enableWindowDrag(root, api) {
  let press = null; // { id, screenX, screenY, window: { x, y } | null, dragging, to, frame }
  let swallowClick = false;

  const moveWindow = () => {
    press.frame = 0;
    if (press.window && press.to) api.setPosition(press.window.x + press.to.dx, press.window.y + press.to.dy);
  };
  const finish = () => {
    if (!press) return;
    const done = press;
    press = null;
    if (!done.dragging) return;
    if (done.frame) cancelAnimationFrame(done.frame);
    if (done.window && done.to) api.setPosition(done.window.x + done.to.dx, done.window.y + done.to.dy);
    api.endDrag();
  };

  root.addEventListener('pointerdown', (event) => {
    swallowClick = false;
    if (event.button !== 0 || event.target.closest(NO_DRAG)) return;
    const current = { id: event.pointerId, screenX: event.screenX, screenY: event.screenY,
      window: null, dragging: false, to: null, frame: 0 };
    press = current;
    api.getPosition().then((position) => {
      if (press !== current) return;
      current.window = position;
      if (current.dragging && !current.frame) current.frame = requestAnimationFrame(moveWindow);
    });
  }, true);

  root.addEventListener('pointermove', (event) => {
    if (!press || event.pointerId !== press.id) return;
    const dx = Math.round(event.screenX - press.screenX);
    const dy = Math.round(event.screenY - press.screenY);
    if (!press.dragging) {
      if (Math.hypot(dx, dy) <= WINDOW_DRAG.threshold) return;
      press.dragging = true;
      // Capture on the root: fast moves past the window edge keep coming,
      // and the press no longer belongs to the prop or character under it.
      root.setPointerCapture(event.pointerId);
    }
    press.to = { dx, dy };
    if (!press.frame) press.frame = requestAnimationFrame(moveWindow);
  }, true);

  root.addEventListener('pointerup', (event) => {
    if (!press || event.pointerId !== press.id) return;
    if (press.dragging) {
      // A drag is never a click or a poke.
      event.stopPropagation();
      swallowClick = true;
      setTimeout(() => { swallowClick = false; }, 0);
    }
    finish();
  }, true);

  root.addEventListener('pointercancel', (event) => {
    if (press && event.pointerId === press.id) finish();
  }, true);
  // Only the root's own capture ending counts: the character's, handed
  // over to the root as the drag starts, bubbles up here too.
  root.addEventListener('lostpointercapture', (event) => {
    if (event.target === root && press?.dragging && event.pointerId === press.id) finish();
  });

  root.addEventListener('click', (event) => {
    if (!swallowClick) return;
    swallowClick = false;
    event.stopPropagation();
    event.preventDefault();
  }, true);

  return { isDragging: () => Boolean(press?.dragging) };
}
