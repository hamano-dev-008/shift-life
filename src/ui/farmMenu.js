// farmMenu.js — A rice paddy's menu: a compact panel opened by clicking a
// paddy at the Farm (the renderer calls toggle(id)). Shows what can be
// done there now (buy it, plant rice, pull weeds, harvest; disabled when
// it's too dear) and how the rice is doing. It only calls the action it's
// given; the logic is in game/farm.js (paddyView() builds what it shows),
// the text in data/farm.js.

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

// `menu` is the #farm-menu element. `actions` is { act(paddyId, action)
// (action: 'buy', 'plant', 'weed' or 'harvest'), onOpen } (onOpen closes
// other panels).
export function createFarmMenu(menu, actions) {
  let paddy = null;
  let shownOptions = '';
  let shownStatus = '';
  const close = () => {
    menu.hidden = true;
    paddy = null;
  };
  menu.querySelector('.panel-close').addEventListener('click', close);

  return {
    close,
    // The paddy whose menu is open, or null.
    paddy: () => paddy,
    // Opens paddy `id`'s menu, or closes it if it's open already.
    toggle(id) {
      if (!menu.hidden && paddy === id) {
        close();
        return;
      }
      paddy = id;
      shownOptions = '';
      shownStatus = '';
      menu.hidden = false;
      actions.onOpen();
    },
    // Call every frame with paddyView() for the open paddy, or null when
    // it's gone (not at the Farm). Rebuilds the buttons only when they
    // change, so a click is never lost. A choice closes the menu, except
    // buying (the paddy's menu then offers planting).
    update(view) {
      if (!view) close();
      if (menu.hidden) return;
      const optionsKey = [view.title, ...view.options.map((o) => `${o.action}:${o.label}:${o.enabled}`)].join('|');
      if (optionsKey !== shownOptions) {
        shownOptions = optionsKey;
        menu.querySelector('.menu-title').textContent = view.title;
        menu.querySelector('.menu-options').replaceChildren(...view.options.map((option) => {
          const button = element('button', '', option.label);
          button.disabled = !option.enabled;
          button.dataset.action = option.action;
          button.addEventListener('click', () => {
            const id = paddy;
            if (option.action !== 'buy') close();
            actions.act(id, option.action);
          });
          return button;
        }));
      }
      const statusKey = view.status.join('|');
      if (statusKey === shownStatus) return;
      shownStatus = statusKey;
      menu.querySelector('.menu-status').replaceChildren(...view.status.map((line) => element('span', '', line)));
    },
  };
}
