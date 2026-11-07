// cafeMenu.js — The Cafe counter's menu: a compact panel opened by
// clicking the counter (the renderer calls toggle()). Offers a coffee or
// a cake (each with its price; greyed out while too dear, already had
// this hour, or something else is going on) and, for whoever works at the
// cafe, a shift (or stopping it), with the shift's progress and the
// waits. It only calls the actions it's given; the logic is in
// game/cafe.js. Text comes from CAFE_MENU_TEXT in data/cafe.js.

import { CAFE_MENU_TEXT } from '../data/cafe.js';
import { SHIFT_TEXT } from '../data/work.js';
import { clockTime, longTime } from './timeText.js';

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// The buttons; rebuilt only when they change, so a click is never lost to
// a re-render.
function renderOptions(menu, view, actions) {
  const options = menu.querySelector('.menu-options');
  if (view.tooYoung) {
    options.replaceChildren();
    return;
  }
  const buttons = view.items.map((item) => {
    const button = element('button', '', fill(CAFE_MENU_TEXT.order, { item: item.name, price: item.price }));
    button.disabled = Boolean(item.block);
    button.addEventListener('click', () => actions.order(item.id));
    return button;
  });
  if (view.shift) {
    const working = view.shift.ms !== null;
    const shift = working
      ? element('button', 'active', SHIFT_TEXT.stop)
      : element('button', 'golden', fill(SHIFT_TEXT.start, { pay: view.shift.pay }));
    shift.disabled = !working && Boolean(view.order);
    shift.addEventListener('click', working ? actions.stopShift : actions.shift);
    buttons.push(shift);
  }
  options.replaceChildren(...buttons);
}

// The status lines, as text.
function statusLines(view) {
  if (view.tooYoung) return [fill(CAFE_MENU_TEXT.tooYoung, { age: view.minAge })];
  const lines = [];
  if (view.shift) lines.push(fill(SHIFT_TEXT.staff, { job: view.shift.job }));
  if (view.shift?.ms != null) {
    lines.push(fill(SHIFT_TEXT.working, { time: clockTime(view.shift.ms), total: clockTime(view.shift.totalMs) }));
  } else if (view.order) {
    lines.push(fill(CAFE_MENU_TEXT.ordering, { item: view.order.name.toLowerCase() }));
  } else {
    lines.push(CAFE_MENU_TEXT.idle);
  }
  for (const item of view.items) {
    if (item.block === 'wait') lines.push(fill(CAFE_MENU_TEXT.again, { item: item.name, time: longTime(item.waitMs) }));
  }
  const short = view.items.filter((item) => item.block === 'money');
  if (short.length) lines.push(fill(CAFE_MENU_TEXT.need, { need: Math.min(...short.map((item) => item.need)) }));
  return lines;
}

// `menu` is the #cafe-menu element. `actions` is { order(itemId), shift,
// stopShift, onOpen } (onOpen closes other panels).
export function createCafeMenu(menu, actions) {
  let shownOptions = '';
  let shownStatus = '';
  const close = () => { menu.hidden = true; };
  // Every action closes the menu, so the walk to the table or the counter
  // shows.
  const then = (action) => (...args) => { action(...args); close(); };
  const wrapped = { order: then(actions.order), shift: then(actions.shift), stopShift: then(actions.stopShift) };

  menu.querySelector('.panel-close').addEventListener('click', close);

  return {
    close,
    // Opens the menu, or closes it if it's open (clicking the counter).
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
    // Call every frame with cafeView() plus `shift` (shiftView()), or null
    // away from the Cafe.
    // Updates the open menu only where what it shows changed.
    update(view) {
      if (!view) close();
      if (menu.hidden) return;
      const titleNode = menu.querySelector('.menu-title');
      if (titleNode.textContent !== CAFE_MENU_TEXT.title) titleNode.textContent = CAFE_MENU_TEXT.title;
      const optionsKey = JSON.stringify([view.tooYoung, view.items.map((item) => item.block), view.order?.item,
        view.shift?.ms != null, view.shift?.pay]);
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
