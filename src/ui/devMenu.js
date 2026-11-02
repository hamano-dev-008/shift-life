// devMenu.js — The developer settings menu: a compact panel opened from
// the gear button (shown only when running from source). Its buttons call
// the actions it's given (game/dev.js, wrapped by the renderer); it holds
// no game logic itself.

import { SPEEDS } from '../data/balance.js';
import { DEV_SKIP_YEARS, DEV_MONEY, DEV_HEALTH } from '../data/dev.js';
import { HOUSING_TIERS, MOVE_OUT_AGE } from '../data/housing.js';
import { RARITIES } from '../data/fishing.js';
import { BUTTERFLIES } from '../data/lakeLife.js';
import { WORK_TRIP_TEXT } from '../data/animation.js';
import { REST_DEV_TEXT } from '../data/home.js';

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
// (returns whether a busking session was playing), appleNow(), gustNow()
// (returns null, or a note such as "Only at the Fortune Tree."), finishRest()
// (returns whether they were resting), restNow() (lies down asleep where
// they are, or gets up; returns null or a note), restingNow(), goTo(placeId), place() (current
// place id), places() (the places that exist now, { id, name }),
// setTier(tierId), tier() (current housing tier id), toMoveOut()
// (returns whether the clock moved), endLife() (returns null, or a note
// on why the life can't end now), setHealth(n), giveRod(), biteNow() and
// catchRarity(rarityId) (each returns null, or a note such as "Not
// fishing."), showReveal(rarityId) (previews a reveal card),
// spawnButterfly(colorId or null), frogCroak() and frogHop() (each
// returns null, or a note such as "Only at the Lake."), workTrips()
// (whether the "Work trips" setting is on), setWorkTrips(on), readout()
// (returns { stats, traits, goal, job, tree, place, life, fishing }),
// speed() (current speed id), onOpen() }.
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
      button('Apple now', () => actions.appleNow()),
      button('Gust now', () => {
        note = actions.gustNow() ?? '';
        if (note) render(); else close();
      }));

    const home = row('Home',
      button('Rest 1 min', () => {
        if (actions.finishRest()) {
          note = '';
        } else {
          note = 'Not resting.';
        }
        render();
      }),
      button(REST_DEV_TEXT.button, () => {
        note = actions.restNow() ?? '';
        if (note) render(); else close();
      }, actions.restingNow() ? 'active' : ''));

    const housing = row('Housing', ...HOUSING_TIERS.map((tier) =>
      button(tier.name, () => { actions.setTier(tier.id); render(); },
        actions.tier() === tier.id ? 'active' : '')));

    shownPlaces = placesKey();
    const places = row('Go to', ...actions.places().map((place) =>
      button(place.name, () => { actions.goTo(place.id); render(); },
        actions.place() === place.id ? 'active' : '')));

    const life = row('Life',
      button('End life now', () => {
        note = actions.endLife() ?? '';
        if (note) {
          render();
        } else {
          close();
        }
      }, 'danger'));

    const health = row('Health', ...DEV_HEALTH.map((value) =>
      button(String(value), () => actions.setHealth(value))));

    const fish = row('Fish',
      button('Give rod', () => { actions.giveRod(); note = ''; render(); }),
      button('Bite now', () => {
        note = actions.biteNow() ?? '';
        if (note) render(); else close();
      }));

    const catches = row('Catch', ...RARITIES.map((rarity) =>
      button(rarity.name, () => {
        note = actions.catchRarity(rarity.id) ?? '';
        if (note) render(); else close();
      })));

    const reveals = row('Reveal', ...RARITIES.map((rarity) =>
      button(rarity.name, () => { actions.showReveal(rarity.id); close(); })));

    const lakeAction = (action) => () => {
      note = action() ?? '';
      if (note) render(); else close();
    };
    const rare = BUTTERFLIES.colors.reduce((least, color) => (color.weight < least.weight ? color : least));
    const wild = row('Wildlife',
      button('Butterfly', lakeAction(() => actions.spawnButterfly(null))),
      button(`${rare.id[0].toUpperCase()}${rare.id.slice(1)} one`, lakeAction(() => actions.spawnButterfly(rare.id))),
      button('Croak', lakeAction(actions.frogCroak)),
      button('Frog hop', lakeAction(actions.frogHop)));

    // A player setting, here until there's a player settings menu.
    const workTrips = row(WORK_TRIP_TEXT.setting, ...[true, false].map((on) =>
      button(on ? WORK_TRIP_TEXT.on : WORK_TRIP_TEXT.off, () => { actions.setWorkTrips(on); render(); },
        actions.workTrips() === on ? 'active' : '')));

    const children = [newLife, speeds, skips, extras, tree, home, housing, places, fish, catches, reveals,
      wild, workTrips, life, health];
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
      const {
        stats, traits, goal, job, tree, place, life, fishing,
      } = actions.readout();
      const lines = [stats, traits, goal, job, tree, place, fishing, life];
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
