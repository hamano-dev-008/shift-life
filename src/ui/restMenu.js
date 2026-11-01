// restMenu.js — The rest menu: a compact panel opened by clicking
// something to rest on (the sofa, the sleeping bag, the tent; the
// renderer calls toggle()). Offers "Rest" or "Get up", with how resting
// is going and the character's health, and in My Yard the next housing
// upgrade (disabled, with how much more is needed, when it's too dear).
// It only calls the actions it's given; the logic is in game/home.js and
// game/housing.js. Text comes from REST_TEXT in data/home.js and
// HOUSING_TEXT in data/housing.js.

import { REST_TEXT } from '../data/home.js';

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
    ? fill(REST_TEXT.resting, { time: clockTime(view.restMs), total: clockTime(view.restTotalMs) })
    : fill(REST_TEXT.idle, { amount: view.amount, minutes: view.minutes })];
  lines.push(view.health >= view.max
    ? REST_TEXT.full
    : fill(REST_TEXT.health, { health: view.health, max: view.max }));
  if (view.upgrade?.need) lines.push(view.upgrade.need);
  return lines;
}

// `menu` is the #rest-menu element. `actions` is { rest, getUp, upgrade,
// onOpen } (onOpen closes other panels).
export function createRestMenu(menu, actions) {
  let shownOptions = '';
  let shownStatus = '';
  const close = () => { menu.hidden = true; };
  // Either choice closes the menu, so the character can be seen.
  const then = (action) => () => { action(); close(); };

  menu.querySelector('.panel-close').addEventListener('click', close);

  return {
    close,
    // Opens the menu, or closes it if it's open (clicking the prop).
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
    // Call every frame with restView() plus `title` (the prop's name) and
    // `upgrade` (upgradeView(), or null), or with null when the place has
    // nothing to rest on. Updates the open menu only where what it shows
    // changed; buttons are rebuilt only when they change, so a click is
    // never lost.
    update(view) {
      if (!view) close();
      if (menu.hidden) return;
      const { upgrade } = view;
      const optionsKey = [view.title, view.resting, upgrade?.label, upgrade?.affordable].join('|');
      if (optionsKey !== shownOptions) {
        shownOptions = optionsKey;
        menu.querySelector('.menu-title').textContent = view.title;
        const button = view.resting
          ? element('button', 'active', REST_TEXT.getUp)
          : element('button', '', REST_TEXT.rest);
        button.addEventListener('click', then(view.resting ? actions.getUp : actions.rest));
        const buttons = [button];
        if (upgrade) {
          const buy = element('button', '', upgrade.label);
          buy.disabled = !upgrade.affordable;
          buy.addEventListener('click', then(actions.upgrade));
          buttons.push(buy);
        }
        menu.querySelector('.menu-options').replaceChildren(...buttons);
      }
      const lines = statusLines(view);
      const statusKey = lines.join('|');
      if (statusKey === shownStatus) return;
      shownStatus = statusKey;
      menu.querySelector('.menu-status').replaceChildren(...lines.map((line) => element('span', '', line)));
    },
  };
}
