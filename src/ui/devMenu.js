// devMenu.js — The developer settings menu: a compact panel opened from
// the gear button (shown only when running from source). Its buttons call
// the actions it's given (game/dev.js, wrapped by the renderer); it holds
// no game logic itself.

import { SPEEDS } from '../data/balance.js';
import { DEV_SKIP_YEARS, DEV_MONEY } from '../data/dev.js';
import { HOUSING_TIERS, MOVE_OUT_AGE } from '../data/housing.js';

function button(text, onClick, className = '') {
  const node = document.createElement('button');
  node.textContent = text;
  if (className) node.className = className;
  node.addEventListener('click', onClick);
  return node;
}

function row(label, ...children) {
  const node = document.createElement('div');
  node.className = 'dev-row';
  if (label) {
    const name = document.createElement('span');
    name.className = 'dev-label';
    name.textContent = label;
    node.append(name);
  }
  node.append(...children);
  return node;
}

// `menu` is the #dev-menu element and `gear` the #dev-btn that opens it.
// `actions` is { newLife, setSpeed(id), skipYears(n), triggerEvent()
// (returns whether an event started), addMoney(n), finishSession()
// (returns whether a busking session was playing), appleNow(), finishRest()
// (returns whether they were resting), goTo(placeId), place() (current
// place id), places() (the places that exist now, { id, name }),
// setTier(tierId), tier() (current housing tier id), toMoveOut()
// (returns whether the clock moved), readout() (returns { stats, traits,
// goal, job, tree, place }), speed() (current speed id), onOpen() }.
export function createDevMenu(menu, gear, actions) {
  const body = menu.querySelector('.dev-body');
  const readout = menu.querySelector('.dev-readout');
  let confirming = false;
  let note = '';
  let shown = '';
  let shownPlaces = '';
  const placesKey = () => actions.places().map((place) => place.id).join('|');

  const close = () => {
    menu.hidden = true;
    confirming = false;
    note = '';
  };

  function render() {
    const newLife = confirming
      ? row('Start a new life?',
        button('Yes', () => { actions.newLife(); close(); }, 'danger'),
        button('No', () => { confirming = false; render(); }))
      : row('', button('New life', () => { confirming = true; render(); }));

    const speeds = row('Speed', ...Object.entries(SPEEDS).map(([id, speed]) =>
      button(speed.label, () => { actions.setSpeed(id); render(); },
        actions.speed() === id ? 'active' : '')));

    const skips = row('Skip', ...DEV_SKIP_YEARS.map((years) =>
      button(`+${years} year${years === 1 ? '' : 's'}`, () => actions.skipYears(years))),
    button(`To ${MOVE_OUT_AGE}`, () => {
      note = actions.toMoveOut() ? '' : `Already ${MOVE_OUT_AGE} or older.`;
      render();
    }));

    const extras = row('',
      button('Trigger event', () => {
        if (actions.triggerEvent()) {
          close();
        } else {
          note = 'No events at this age.';
          render();
        }
      }),
      button(`Add $${DEV_MONEY.toLocaleString('en-US')}`, () => actions.addMoney(DEV_MONEY)));

    const tree = row('Tree',
      button('Finish session', () => {
        if (actions.finishSession()) {
          close();
        } else {
          note = 'Not playing.';
          render();
        }
      }),
      button('Apple now', () => actions.appleNow()));

    const home = row('Home',
      button('Rest 1 min', () => {
        if (actions.finishRest()) {
          note = '';
        } else {
          note = 'Not resting.';
        }
        render();
      }));

    const housing = row('Housing', ...HOUSING_TIERS.map((tier) =>
      button(tier.name, () => { actions.setTier(tier.id); render(); },
        actions.tier() === tier.id ? 'active' : '')));

    shownPlaces = placesKey();
    const places = row('Go to', ...actions.places().map((place) =>
      button(place.name, () => { actions.goTo(place.id); render(); },
        actions.place() === place.id ? 'active' : '')));

    const children = [newLife, speeds, skips, extras, tree, home, housing, places];
    if (note) {
      const message = document.createElement('p');
      message.className = 'dev-note';
      message.textContent = note;
      children.push(message);
    }
    body.replaceChildren(...children);
  }

  gear.addEventListener('click', () => {
    if (!menu.hidden) {
      close();
      return;
    }
    render();
    shown = '';
    menu.hidden = false;
    actions.onOpen();
  });
  menu.querySelector('.panel-close').addEventListener('click', close);

  return {
    close,
    // Call every frame; refreshes the read-out while the menu is open, and
    // the buttons when the places change (moving out, a new tier).
    update() {
      if (menu.hidden) return;
      if (placesKey() !== shownPlaces) render();
      const { stats, traits, goal, job, tree, place } = actions.readout();
      const lines = [stats, traits, goal, job, tree, place];
      const key = lines.join('|');
      if (key === shown) return;
      shown = key;
      readout.replaceChildren(...lines.map((text) => {
        const line = document.createElement('span');
        line.textContent = text;
        return line;
      }));
    },
  };
}
