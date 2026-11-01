// goalMenu.js — The goal menu: a compact panel, opened from the goal
// button in the top bar, to pick or change the life goal. Shows the current
// goal, how its yearly boost is building, and its milestones.

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

// "Smarts +3 a year, building to +4" / "+$15 a year, building to +$25".
function boostText(view) {
  if (!view.stat) return 'No yearly boost. Anything goes!';
  const amount = (n) => (view.money ? `+$${n}` : `+${n}`);
  const name = view.money ? '' : `${view.stat} `;
  const building = view.boostNext < view.boostMax ? `, building to ${amount(view.boostMax)}` : '';
  return `${name}${amount(view.boostNext)} a year${building}`;
}

function render(menu, view, onPick) {
  const options = menu.querySelector('.goal-options');
  options.replaceChildren(...view.options.map((option) => {
    const button = element('button', option.active ? 'active' : '', option.label);
    button.title = option.blurb;
    button.addEventListener('click', () => onPick(option.id));
    return button;
  }));

  const years = view.yearsIn === 1 ? '1 year' : `${view.yearsIn} years`;
  menu.querySelector('.goal-status').replaceChildren(
    element('span', '', `${view.label} for ${years}`),
    element('span', 'goal-boost', boostText(view)),
  );

  menu.querySelector('.goal-milestones').replaceChildren(...view.milestones.map((milestone) => {
    const reached = milestone.reachedAt !== null;
    const row = element('li', reached ? 'reached' : '');
    row.append(
      element('span', 'mark', reached ? '*' : '-'),
      element('span', 'name', milestone.label),
      element('span', 'progress', reached ? `age ${milestone.reachedAt}` : milestone.progress),
    );
    return row;
  }));
}

// `menu` is the #goal-menu element and `button` the #goal-btn that opens
// it. onPick(id) runs when a goal is clicked; onOpen() when the menu opens
// (to close other panels).
export function createGoalMenu(menu, button, { onPick, onOpen }) {
  let shown = '';
  const close = () => { menu.hidden = true; };

  button.addEventListener('click', () => {
    if (!menu.hidden) {
      close();
      return;
    }
    shown = '';
    menu.hidden = false;
    onOpen();
  });
  menu.querySelector('.panel-close').addEventListener('click', close);

  return {
    close,
    // Call every frame with goalView(). Keeps the button's label current
    // and re-renders the open menu only when something changed.
    update(view) {
      button.hidden = !view.unlocked;
      if (button.textContent !== view.label) button.textContent = view.label;
      if (!view.unlocked) close();
      if (menu.hidden) return;
      const key = JSON.stringify(view);
      if (key === shown) return;
      shown = key;
      render(menu, view, onPick);
    },
  };
}
