// goMenu.js — The "Go to" menu: a compact panel opened from the place
// button in the top bar, listing the other places that exist now (not
// the parents' house after moving out) in two columns: the places around
// home, and under "Town" the town places. Picking one starts the
// trip (the renderer walks the character there). The button is disabled
// while a trip is under way. Text comes from PLACE_TEXT in
// data/places.js.

import { PLACE_TEXT } from '../data/places.js';

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
    // Call every frame with the current place ({ id, name }), the places
    // that exist now (existingPlaces()) and whether a trip is under way.
    update(place, places, travelling) {
      button.disabled = travelling;
      if (travelling) close();
      const key = [place.id, ...places.map((other) => other.id)].join('|');
      if (menu.hidden || shown === key) return;
      shown = key;
      const choice = (other) => {
        const button = element('button', '', other.name);
        button.addEventListener('click', () => {
          close();
          actions.go(other.id);
        });
        return button;
      };
      const others = places.filter((other) => other.id !== place.id);
      const home = element('div', 'go-column');
      home.replaceChildren(...others.filter((other) => !other.town).map(choice));
      const town = element('div', 'go-column');
      town.replaceChildren(element('span', 'go-heading', PLACE_TEXT.town), ...others.filter((other) => other.town).map(choice));
      menu.querySelector('.menu-options').replaceChildren(home, town);
      menu.querySelector('.menu-status').replaceChildren(
        element('span', '', PLACE_TEXT.here.replaceAll('{place}', place.name)),
      );
    },
  };
}
