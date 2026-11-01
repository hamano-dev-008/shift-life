// goMenu.js — The "Go to" menu: a compact panel opened from the place
// button in the top bar, listing the other places. Picking one starts the
// trip (the renderer walks the character there). The button is disabled
// while a trip is under way. Text comes from PLACE_TEXT in
// data/places.js.

import { PLACES, PLACE_TEXT } from '../data/places.js';

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

// `menu` is the #go-menu element and `button` the #go-btn that opens it.
// `actions` is { go(placeId), onOpen } (onOpen closes other panels).
export function createGoMenu(menu, button, actions) {
  let shown = '';
  const close = () => { menu.hidden = true; };

  menu.querySelector('.menu-title').textContent = PLACE_TEXT.goTitle;
  button.addEventListener('click', () => {
    if (!menu.hidden) {
      close();
      return;
    }
    shown = '';
    menu.hidden = false;
    actions.onOpen();
  });
  menu.querySelector('.panel-close').addEventListener('click', close);

  return {
    close,
    // Call every frame with the current place ({ id, name }) and whether a
    // trip is under way.
    update(place, travelling) {
      button.disabled = travelling;
      if (travelling) close();
      if (menu.hidden || shown === place.id) return;
      shown = place.id;
      menu.querySelector('.menu-options').replaceChildren(...PLACES
        .filter((other) => other.id !== place.id)
        .map((other) => {
          const choice = element('button', '', other.name);
          choice.addEventListener('click', () => {
            close();
            actions.go(other.id);
          });
          return choice;
        }));
      menu.querySelector('.menu-status').replaceChildren(
        element('span', '', PLACE_TEXT.here.replaceAll('{place}', place.name)),
      );
    },
  };
}
