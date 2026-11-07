// goMenu.js — The "Go to" menu: a compact panel opened from the place
// button in the top bar, listing the other places that exist now (not
// the parents' house after moving out) in two columns: the places around
// home and a "Town..." button, which turns the page to the town places
// (and "Back"). Picking one starts the
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
  let page = 'home';
  const close = () => { menu.hidden = true; };

  button.addEventListener('click', () => {
    if (!menu.hidden) {
      close();
      return;
    }
    shown = '';
    page = 'home';
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
      const key = [page, place.id, ...places.map((other) => other.id)].join('|');
      if (menu.hidden || shown === key) return;
      shown = key;
      const choice = (text, onClick) => {
        const choiceButton = element('button', '', text);
        choiceButton.addEventListener('click', onClick);
        return choiceButton;
      };
      const goTo = (other) => choice(other.name, () => {
        close();
        actions.go(other.id);
      });
      // Turning the page rebuilds it on the next update.
      const turn = (to) => () => { page = to; };
      const others = places.filter((other) => other.id !== place.id);
      const inTown = page === 'town';
      menu.querySelector('.menu-title').textContent = inTown ? PLACE_TEXT.townTitle : PLACE_TEXT.goTitle;
      menu.querySelector('.menu-options').replaceChildren(...others.filter((other) => Boolean(other.town) === inTown).map(goTo),
        inTown ? choice(PLACE_TEXT.back, turn('home')) : choice(PLACE_TEXT.town, turn('town')));
      menu.querySelector('.menu-status').replaceChildren(
        element('span', '', PLACE_TEXT.here.replaceAll('{place}', place.name)),
      );
    },
  };
}
