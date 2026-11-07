// counterMenu.js — A town place's counter menu (the Cafe's counter, the
// 6-Eleven's register): a compact panel opened by clicking the counter
// (the renderer calls toggle()). Offers the place's items (each with its
// price; greyed out while too dear, already had this hour, or something
// else is going on) and, for whoever works there, a shift (or stopping
// it), with the shift's progress and the waits. It only calls the actions
// it's given; the logic is in game/cafe.js, game/store.js and
// game/shifts.js. The place's own words come in the view; the items' and
// the shift's are COUNTER_TEXT and SHIFT_TEXT in data/work.js.

import { COUNTER_TEXT, SHIFT_TEXT } from '../data/work.js';
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
    const button = element('button', '', fill(COUNTER_TEXT.order, { item: item.name, price: item.price }));
    button.disabled = Boolean(item.block);
    button.addEventListener('click', () => actions.order(item.id));
    return button;
  });
  if (view.shift) {
    const working = view.shift.ms !== null;
    const shift = working
      ? element('button', 'active', SHIFT_TEXT.stop)
      : element('button', 'golden', fill(SHIFT_TEXT.start, { pay: view.shift.pay }));
    shift.disabled = !working && Boolean(view.busy);
    shift.addEventListener('click', working ? actions.stopShift : actions.shift);
    buttons.push(shift);
  }
  options.replaceChildren(...buttons);
}

// The status lines, as text.
function statusLines(view) {
  const { text } = view;
  if (view.tooYoung) return [fill(text.tooYoung, { age: view.minAge })];
  const lines = [];
  if (view.shift) lines.push(fill(SHIFT_TEXT.staff, { job: view.shift.job }));
  if (view.shift?.ms != null) {
    lines.push(fill(SHIFT_TEXT.working, { time: clockTime(view.shift.ms), total: clockTime(view.shift.totalMs) }));
  } else if (view.busy) {
    lines.push(fill(text.busy, { item: view.busy.toLowerCase() }));
  } else {
    lines.push(text.idle);
  }
  for (const item of view.items) {
    if (item.block === 'wait') lines.push(fill(COUNTER_TEXT.again, { item: item.name, time: longTime(item.waitMs) }));
  }
  const short = view.items.filter((item) => item.block === 'money');
  if (short.length) lines.push(fill(COUNTER_TEXT.need, { need: Math.min(...short.map((item) => item.need)) }));
  return lines;
}

// `menu` is the #counter-menu element. `actions` is { order(itemId),
// shift, stopShift, onOpen } (onOpen closes other panels).
export function createCounterMenu(menu, actions) {
  let shownOptions = '';
  let shownStatus = '';
  const close = () => { menu.hidden = true; };
  // Every action closes the menu, so the walk to the spot shows.
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
    // Call every frame with the place's counter view, or null away from a
    // counter: { text: { title, tooYoung, busy, idle }, minAge, tooYoung,
    // items: [{ id, name, price, block, waitMs, need }], busy (the name of
    // what they're having now, or null), shift (shiftView(), or null) }.
    // Updates the open menu only where what it shows changed.
    update(view) {
      if (!view) close();
      if (menu.hidden) return;
      const titleNode = menu.querySelector('.menu-title');
      if (titleNode.textContent !== view.text.title) titleNode.textContent = view.text.title;
      const optionsKey = JSON.stringify([view.text.title, view.tooYoung, view.items.map((item) => item.block),
        view.busy, view.shift?.ms != null, view.shift?.pay]);
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
