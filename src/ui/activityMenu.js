// activityMenu.js — The activity menu: a compact panel opened by clicking
// an activity's prop (the Lake's dock for fishing; the renderer calls
// toggle()). Offers buying the item it needs ("Buy a fishing rod - $30",
// disabled with how much more is needed), then starting or stopping it,
// with its status (for fishing, what's happening and the bucket). For
// fishing it also opens the fish collection: every fish, its icon, and
// who caught it first at what age (unknown ones as "???"). It only calls
// the actions it's given; the logic is in game/activities.js and
// game/fishing.js. Text comes from data/activities.js and data/fishing.js.

import { FISHING_TEXT } from '../data/fishing.js';
import { drawFishIcon } from './fishing.js';

// Collection icons: screen pixels per icon pixel, and the canvas size
// (fits the biggest code-drawn icon with its outline).
const ICON_SCALE = 2;
const ICON_WIDTH = 13;
const ICON_HEIGHT = 8;

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// A small canvas with fish `id`'s icon (a silhouette if not caught yet).
function fishIcon(id, caught) {
  const canvas = element('canvas', 'fish-icon');
  canvas.width = ICON_WIDTH * ICON_SCALE;
  canvas.height = ICON_HEIGHT * ICON_SCALE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawFishIcon(ctx, id, canvas.width / 2, canvas.height, ICON_SCALE, { silhouette: !caught });
  return canvas;
}

// The collection's rows: icon, then the name and rarity (or "???") and
// who caught it first.
function collectionRows(collection) {
  return collection.fish.map((fish) => {
    const row = element('div', 'fish-row');
    const text = element('div', 'fish-text');
    text.append(element('span', '', fish.first ? `${fish.name} (${fish.rarity})` : FISHING_TEXT.unknown));
    if (fish.first) text.append(element('span', 'fish-first', fish.first));
    row.append(fishIcon(fish.id, Boolean(fish.first)), text);
    return row;
  });
}

// `menu` is the #activity-menu element. `actions` is { buy(id), start(id),
// stop(), onOpen() } (onOpen closes other panels).
export function createActivityMenu(menu, actions) {
  const title = menu.querySelector('.menu-title');
  const options = menu.querySelector('.menu-options');
  const status = menu.querySelector('.menu-status');
  let activity = null;
  let showingCollection = false;
  let shownOptions = '';
  let shownStatus = '';

  const close = () => {
    menu.hidden = true;
    showingCollection = false;
  };
  menu.querySelector('.panel-close').addEventListener('click', close);
  const refresh = () => {
    shownOptions = '';
    shownStatus = '';
  };

  return {
    close,
    // Opens the menu for activity `id`, or closes it if it's open
    // (clicking the prop).
    toggle(id) {
      if (!menu.hidden) {
        close();
        return;
      }
      activity = id;
      showingCollection = false;
      refresh();
      menu.hidden = false;
      actions.onOpen();
    },
    // Call every frame with `viewOf(id)`, which returns, for the open
    // activity, { view: activityView(), collection: collectionView() for
    // fishing, else null }, or null if it can't be done here now. Updates
    // the open menu only where what it shows changed; buttons are rebuilt
    // only when they change, so a click is never lost.
    update(viewOf) {
      if (menu.hidden) return;
      const shown = viewOf(activity);
      if (!shown) {
        close();
        return;
      }
      const { view, collection } = shown;
      if (showingCollection && collection) {
        const key = `collection|${collection.count}`;
        if (key === shownOptions) return;
        shownOptions = key;
        shownStatus = '';
        title.textContent = fill(FISHING_TEXT.collectionTitle, collection);
        const back = element('button', '', FISHING_TEXT.back);
        back.addEventListener('click', () => { showingCollection = false; refresh(); });
        options.replaceChildren(back);
        status.replaceChildren(...collectionRows(collection));
        return;
      }
      const optionsKey = [view.title, view.unlocked, view.buy?.label, view.buy?.affordable,
        view.toggle?.label, Boolean(collection)].join('|');
      if (optionsKey !== shownOptions) {
        shownOptions = optionsKey;
        title.textContent = view.title;
        const buttons = [];
        if (view.buy) {
          const buy = element('button', '', view.buy.label);
          buy.disabled = !view.buy.affordable;
          buy.addEventListener('click', () => actions.buy(view.id));
          buttons.push(buy);
        }
        if (view.toggle) {
          const toggle = element('button', view.toggle.running ? 'active' : '', view.toggle.label);
          // Starting or stopping closes the menu, so the character (or the
          // sale's bubble) can be seen.
          toggle.addEventListener('click', () => {
            if (view.toggle.running) actions.stop(); else actions.start(view.id);
            close();
          });
          buttons.push(toggle);
        }
        if (view.unlocked && collection) {
          const open = element('button', '', FISHING_TEXT.collection);
          open.addEventListener('click', () => { showingCollection = true; refresh(); });
          buttons.push(open);
        }
        options.replaceChildren(...buttons);
      }
      const lines = view.unlocked ? view.status : [view.tooYoung];
      const statusKey = lines.join('|');
      if (statusKey === shownStatus) return;
      shownStatus = statusKey;
      status.replaceChildren(...lines.map((line) => element('span', '', line)));
    },
  };
}
