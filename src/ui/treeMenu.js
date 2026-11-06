// treeMenu.js — The Fortune Tree menu: a compact panel opened by clicking
// the tree (the renderer calls toggle()). Offers playing an instrument (or stopping) and picking the
// golden apple when one is ready, with busking progress, the next apple
// and the pick chance. It only calls the actions it's given; the logic is
// in game/fortuneTree.js. Text comes from TREE_TEXT in data/fortuneTree.js.

import { TREE_TEXT } from '../data/fortuneTree.js';
import { WEATHER_EFFECTS_TEXT } from '../data/weather.js';

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// "7:05" (minutes and seconds).
function clockTime(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// "1h 25m", "25m", or "<1m"; rounded up so it never says 0 too early.
function longTime(ms) {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 1) return '<1m';
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

// The buttons; rebuilt only when they change, so a click is never lost to
// a re-render.
function renderOptions(menu, view, actions) {
  const options = menu.querySelector('.menu-options');
  if (!view.unlocked) {
    options.replaceChildren();
    return;
  }
  const toggle = view.playing
    ? element('button', 'active', TREE_TEXT.stop)
    : element('button', '', TREE_TEXT.play);
  toggle.addEventListener('click', view.playing ? actions.stop : actions.play);
  // No busking in a thunderstorm (the status says why), nor while picking.
  toggle.disabled = !view.playing && (view.stormy || view.picking);
  const buttons = [toggle];
  if (view.appleReady) {
    const pick = element('button', 'golden', view.picking ? TREE_TEXT.picking : TREE_TEXT.pick);
    pick.addEventListener('click', actions.pick);
    pick.disabled = view.picking;
    buttons.push(pick);
  }
  options.replaceChildren(...buttons);
}

// The status lines, as text.
function statusLines(view) {
  if (!view.unlocked) return [fill(TREE_TEXT.tooYoung, { age: view.minAge })];
  let first = fill(TREE_TEXT.idleStatus, { pay: view.sessionPay, minutes: view.sessionMinutes });
  if (view.playing) {
    first = fill(TREE_TEXT.playingStatus, { time: clockTime(view.sessionMs), total: clockTime(view.sessionTotalMs) });
  } else if (view.stormy) {
    first = WEATHER_EFFECTS_TEXT.stormStops.busking;
  }
  return [
    first,
    fill(TREE_TEXT.sessions, { count: view.sessions }),
    view.appleReady ? TREE_TEXT.appleReady : fill(TREE_TEXT.appleGrowing, { time: longTime(view.appleInMs) }),
    fill(TREE_TEXT.chance, { percent: Math.round(view.chance * 100) }),
  ];
}

// `menu` is the #tree-menu element. `actions` is { play, stop, pick,
// onOpen } (onOpen closes other panels).
export function createTreeMenu(menu, actions) {
  let shownOptions = '';
  let shownStatus = '';
  const close = () => { menu.hidden = true; };
  // Every action closes the menu, so its bubble or the busking shows.
  const then = (action) => () => { action(); close(); };
  const wrapped = { play: then(actions.play), stop: then(actions.stop), pick: then(actions.pick) };

  menu.querySelector('.panel-close').addEventListener('click', close);

  return {
    close,
    // Opens the menu, or closes it if it's open (clicking the tree).
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
    // Call every frame with the place's name and treeView() (or null when
    // the place has no Fortune Tree). Updates the open menu only where
    // what it shows changed.
    update(title, view) {
      if (!view) close();
      if (menu.hidden) return;
      const titleNode = menu.querySelector('.menu-title');
      if (titleNode.textContent !== title) titleNode.textContent = title;
      const optionsKey = `${view.unlocked}|${view.playing}|${view.appleReady}|${view.stormy}|${view.picking}`;
      if (optionsKey !== shownOptions) {
        shownOptions = optionsKey;
        renderOptions(menu, view, wrapped);
      }
      const lines = statusLines(view);
      const statusKey = lines.join('|');
      if (statusKey === shownStatus) return;
      shownStatus = statusKey;
      menu.querySelector('.menu-status').replaceChildren(...lines.map((line) => element('span', '', line)));
    },
  };
}
