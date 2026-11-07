// devMenu.js — The developer settings menu: a compact panel opened from
// the gear button (shown only when running from source), its buttons in
// tabs by category (DEV_TABS in data/dev.js): the life, places, the Lake,
// the world, the player settings, and the read-out. Its buttons call the
// actions it's given (game/dev.js, wrapped by the renderer); it holds no
// game logic itself.

import { SPEEDS } from '../data/balance.js';
import { DEV_SKIP_YEARS, DEV_MONEY, DEV_HEALTH, DEV_TABS } from '../data/dev.js';
import { HOUSING_TIERS, MOVE_OUT_AGE } from '../data/housing.js';
import { RARITIES } from '../data/fishing.js';
import { BUTTERFLIES } from '../data/lakeLife.js';
import { WORK_TRIP_TEXT } from '../data/animation.js';
import { REST_DEV_TEXT } from '../data/home.js';
import { AUTONOMY_TEXT } from '../data/autonomy.js';
import { FARM_TEXT } from '../data/farm.js';
import { PARALLAX_TEXT } from '../data/parallax.js';
import { WEATHER, WEATHER_TEXT } from '../data/weather.js';

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
// spawnButterfly(colorId or null), frogCroak(), frogHop(), frogToLand()
// and frogHunt() (each
// returns null, or a note such as "Only at the Lake."), workTrips()
// (whether the "Work trips" setting is on), setWorkTrips(on), ownPlans()
// and setOwnPlans(on) (the "Let them choose" setting), planNow() (they
// choose something to do now; returns null or a note), parallax() and
// setParallax(on) (the "Parallax" setting), weather() (its kind id),
// setWeather(kind), nextWeather(), lightningFlashes() and
// setLightningFlashes(on) (the "Lightning flashes" setting), growPaddies()
// and givePaddies() (the Farm), readout() (returns { stats, traits,
// goal, job, tree, place, life, fishing, farm, plan, weather }),
// speed() (current speed id), onOpen() }.
export function createDevMenu(menu, gear, actions) {
  const tabs = menu.querySelector('.dev-tabs');
  const body = menu.querySelector('.dev-body');
  const readout = menu.querySelector('.dev-readout');
  let confirming = false;
  let note = '';
  let shown = '';
  let shownPlaces = '';
  // The tab showing; kept while the app runs, so the menu opens where it
  // was last left.
  let tab = DEV_TABS[0].id;
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

    // The Fortune Tree's wind (only there).
    const wind = row('Wind',
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
      button('Frog hop', lakeAction(actions.frogHop)),
      button('To shore', lakeAction(actions.frogToLand)),
      button('Hunt', lakeAction(actions.frogHunt)));

    // A player setting, here until there's a player settings menu.
    const workTrips = row(WORK_TRIP_TEXT.setting, ...[true, false].map((on) =>
      button(on ? WORK_TRIP_TEXT.on : WORK_TRIP_TEXT.off, () => { actions.setWorkTrips(on); render(); },
        actions.workTrips() === on ? 'active' : '')));

    const ownPlans = row(AUTONOMY_TEXT.setting, ...[true, false].map((on) =>
      button(on ? AUTONOMY_TEXT.on : AUTONOMY_TEXT.off, () => { actions.setOwnPlans(on); render(); },
        actions.ownPlans() === on ? 'active' : '')),
    button(AUTONOMY_TEXT.devNow, () => {
      note = actions.planNow() ?? '';
      if (note) render(); else close();
    }));

    const parallax = row(PARALLAX_TEXT.setting, ...[true, false].map((on) =>
      button(on ? PARALLAX_TEXT.on : PARALLAX_TEXT.off, () => { actions.setParallax(on); render(); },
        actions.parallax() === on ? 'active' : '')));

    const lightning = row(WEATHER_TEXT.lightningSetting, ...[true, false].map((on) =>
      button(on ? WEATHER_TEXT.on : WEATHER_TEXT.off, () => { actions.setLightningFlashes(on); render(); },
        actions.lightningFlashes() === on ? 'active' : '')));

    const weather = row(WEATHER_TEXT.devRow, ...Object.entries(WEATHER).map(([id, kind]) =>
      button(kind.name, () => { actions.setWeather(id); render(); }, actions.weather() === id ? 'active' : '')),
    button(WEATHER_TEXT.devNext, () => { actions.nextWeather(); render(); }));

    const farm = row('Farm',
      button(FARM_TEXT.devGrow, () => { actions.growPaddies(); note = ''; render(); }),
      button(FARM_TEXT.devGive, () => { actions.givePaddies(); note = ''; render(); }));

    const rows = {
      life: [newLife, speeds, skips, extras, health, housing, life],
      places: [places, tree, home, farm],
      lake: [fish, catches, reveals, wild],
      world: [weather, wind],
      settings: [workTrips, ownPlans, parallax, lightning],
      info: [],
    };
    tabs.replaceChildren(...DEV_TABS.map(({ id, name }) => {
      const node = button(name, () => {
        tab = id;
        note = '';
        confirming = false;
        render();
      }, `dev-tab${tab === id ? ' active' : ''}`);
      node.dataset.tab = id;
      return node;
    }));
    readout.hidden = tab !== 'info';
    const children = [...rows[tab]];
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
        stats, traits, goal, job, tree, place, life, fishing, farm, plan, weather,
      } = actions.readout();
      const lines = [stats, traits, goal, job, tree, place, fishing, farm, plan, weather, life];
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
