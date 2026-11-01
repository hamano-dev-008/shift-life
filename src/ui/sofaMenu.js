// sofaMenu.js — The sofa menu at Home: a compact panel opened by clicking
// the sofa (the renderer calls toggle()). Offers "Rest" or "Get up", with
// how resting is going and the character's health. It only calls the
// actions it's given; the logic is in game/home.js. Text comes from
// SOFA_TEXT in data/home.js.

import { SOFA_TEXT } from '../data/home.js';

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// "0:42" (minutes and seconds).
function clockTime(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function statusLines(view) {
  const lines = [view.resting
    ? fill(SOFA_TEXT.resting, { time: clockTime(view.restMs), total: clockTime(view.restTotalMs) })
    : fill(SOFA_TEXT.idle, { amount: view.amount, minutes: view.minutes })];
  lines.push(view.health >= view.max
    ? SOFA_TEXT.full
    : fill(SOFA_TEXT.health, { health: view.health, max: view.max }));
  return lines;
}

// `menu` is the #sofa-menu element. `actions` is { rest, getUp, onOpen }
// (onOpen closes other panels).
export function createSofaMenu(menu, actions) {
  let shownOptions = '';
  let shownStatus = '';
  const close = () => { menu.hidden = true; };
  // Either choice closes the menu, so the character can be seen.
  const then = (action) => () => { action(); close(); };

  menu.querySelector('.panel-close').addEventListener('click', close);
  menu.querySelector('.menu-title').textContent = SOFA_TEXT.title;

  return {
    close,
    // Opens the menu, or closes it if it's open (clicking the sofa).
    toggle() {
      if (!menu.hidden) {
        close();
        return;
      }
      shownOptions = '';
      shownStatus = '';
      menu.hidden = false;
      actions.onOpen();
    },
    // Call every frame with sofaView() (or null when the place has no
    // sofa). Updates the open menu only where what it shows changed; the
    // button is rebuilt only when it changes, so a click is never lost.
    update(view) {
      if (!view) close();
      if (menu.hidden) return;
      const optionsKey = String(view.resting);
      if (optionsKey !== shownOptions) {
        shownOptions = optionsKey;
        const button = view.resting
          ? element('button', 'active', SOFA_TEXT.getUp)
          : element('button', '', SOFA_TEXT.rest);
        button.addEventListener('click', then(view.resting ? actions.getUp : actions.rest));
        menu.querySelector('.menu-options').replaceChildren(button);
      }
      const lines = statusLines(view);
      const statusKey = lines.join('|');
      if (statusKey === shownStatus) return;
      shownStatus = statusKey;
      menu.querySelector('.menu-status').replaceChildren(...lines.map((line) => element('span', '', line)));
    },
  };
}
