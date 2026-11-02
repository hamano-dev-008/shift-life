// pastLives.js — The Book of past lives: a panel opened from the book
// button in the top bar (shown once a life has ended), listing every
// finished life, newest first, by name, ages and life title. Clicking one
// shows its summary (summaryRows() from ui/lifeSummary.js) with a Back
// button. Scrolls if it's taller than the window. Text comes from
// END_TEXT in data/endOfLife.js; entries from bookView() in
// game/endOfLife.js.

import { END_TEXT } from '../data/endOfLife.js';
import { summaryRows } from './lifeSummary.js';

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

// `menu` is the #book-menu element and `button` the #book-btn that opens
// it. onOpen() runs when it opens (to close other panels).
export function createBookMenu(menu, button, { onOpen }) {
  const body = menu.querySelector('.book-body');
  let entries = [];
  let shown = '';
  // The entry being read, by id, or null for the list.
  let reading = null;

  const close = () => {
    menu.hidden = true;
    reading = null;
  };

  function render() {
    const entry = entries.find((candidate) => candidate.id === reading);
    if (entry) {
      const back = element('button', '', END_TEXT.back);
      back.addEventListener('click', () => { reading = null; render(); });
      const options = element('div', 'menu-options');
      options.append(back);
      body.replaceChildren(...summaryRows(entry.summary), options);
    } else {
      reading = null;
      const list = element('div', 'menu-options book-list');
      list.append(...entries.map((life) => {
        const item = element('button', '');
        item.append(element('span', 'book-name', life.label), element('span', 'book-life-title', life.title));
        item.addEventListener('click', () => { reading = life.id; render(); });
        return item;
      }));
      body.replaceChildren(element('h2', 'goal-title', END_TEXT.bookTitle),
        entries.length ? list : element('p', 'menu-status', END_TEXT.bookEmpty));
    }
    menu.scrollTop = 0;
  }

  button.addEventListener('click', () => {
    if (!menu.hidden) {
      close();
      return;
    }
    reading = null;
    render();
    menu.hidden = false;
    onOpen();
  });
  menu.querySelector('.panel-close').addEventListener('click', close);

  return {
    close,
    // Call every frame with bookView(). The button shows once there's a
    // life in the Book; the open list re-renders when a life is added.
    update(view) {
      entries = view;
      button.hidden = view.length === 0;
      const key = view.map((life) => life.id).join('|');
      if (key === shown) return;
      shown = key;
      if (!menu.hidden) render();
    },
  };
}
