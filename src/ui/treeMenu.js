// treeMenu.js — The Fortune Tree menu: a compact panel opened by clicking
// the tree. Offers playing an instrument (or stopping) and picking the
// golden apple when one is ready, with busking progress, the next apple
// and the pick chance. It only calls the actions it's given; the logic is
// in game/fortuneTree.js. Text comes from TREE_TEXT in data/fortuneTree.js.

import { TREE_TEXT } from '../data/fortuneTree.js';

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
  const options = menu.querySelector('.tree-options');
  if (!view.unlocked) {
    options.replaceChildren();
    return;
  }
  const toggle = view.playing
    ? element('button', 'active', TREE_TEXT.stop)
    : element('button', '', TREE_TEXT.play);
  toggle.addEventListener('click', view.playing ? actions.stop : actions.play);
  const buttons = [toggle];
  if (view.appleReady) {
    const pick = element('button', 'golden', TREE_TEXT.pick);
    pick.addEventListener('click', actions.pick);
    buttons.push(pick);
  }
  options.replaceChildren(...buttons);
}

// The status lines, as text.
function statusLines(view) {
  if (!view.unlocked) return [fill(TREE_TEXT.tooYoung, { age: view.minAge })];
  return [
    view.playing
      ? fill(TREE_TEXT.playingStatus, { time: clockTime(view.sessionMs), total: clockTime(view.sessionTotalMs) })
      : fill(TREE_TEXT.idleStatus, { pay: view.sessionPay, minutes: view.sessionMinutes }),
    fill(TREE_TEXT.sessions, { count: view.sessions }),
    view.appleReady ? TREE_TEXT.appleReady : fill(TREE_TEXT.appleGrowing, { time: longTime(view.appleInMs) }),
    fill(TREE_TEXT.chance, { percent: Math.round(view.chance * 100) }),
  ];
}

// `menu` is the #tree-menu element and `target` the #tree-target button
// over the tree. `actions` is { play, stop, pick, onOpen } (onOpen closes
// other panels).
export function createTreeMenu(menu, target, actions) {
  let shownOptions = '';
  let shownStatus = '';
  const close = () => { menu.hidden = true; };
  // Every action closes the menu, so its bubble or the busking shows.
  const then = (action) => () => { action(); close(); };
  const wrapped = { play: then(actions.play), stop: then(actions.stop), pick: then(actions.pick) };

  target.addEventListener('click', () => {
    if (!menu.hidden) {
      close();
      return;
    }
    shownOptions = '';
    shownStatus = '';
    menu.hidden = false;
    actions.onOpen();
  });
  menu.querySelector('.panel-close').addEventListener('click', close);

  return {
    close,
    // Call every frame with the place's name and treeView() (or null when
    // the place has no Fortune Tree). Updates the open menu only where
    // what it shows changed.
    update(title, view) {
      target.hidden = !view;
      if (!view) close();
      if (menu.hidden) return;
      const titleNode = menu.querySelector('.tree-title');
      if (titleNode.textContent !== title) titleNode.textContent = title;
      const optionsKey = `${view.unlocked}|${view.playing}|${view.appleReady}`;
      if (optionsKey !== shownOptions) {
        shownOptions = optionsKey;
        renderOptions(menu, view, wrapped);
      }
      const lines = statusLines(view);
      const statusKey = lines.join('|');
      if (statusKey === shownStatus) return;
      shownStatus = statusKey;
      menu.querySelector('.tree-status').replaceChildren(...lines.map((line) => element('span', '', line)));
    },
  };
}
