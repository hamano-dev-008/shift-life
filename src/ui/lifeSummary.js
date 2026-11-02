// lifeSummary.js — The life summary card shown after a life ends: the
// life title, name and ages, goal and milestones, jobs and the highest
// title, money, the best home and golden apples won, with a "Start a new
// life" button. A compact panel that scrolls if it's taller than the
// window. summaryRows() also draws the summary for the Book of past lives
// (ui/pastLives.js). Text comes from END_TEXT in data/endOfLife.js; the
// summary itself from lifeSummary() in game/endOfLife.js.

import { END_TEXT } from '../data/endOfLife.js';

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// The summary's nodes: the life title, "Mia, 0-82", then a row per
// detail (a name, and one or more lines of value).
export function summaryRows(summary) {
  const { rows } = END_TEXT;
  const lines = (...texts) => {
    const value = element('div', 'summary-value');
    value.append(...texts.map((text) => element('span', '', text)));
    return value;
  };
  const row = (name, value) => [element('div', 'summary-name', name), value];
  const milestones = summary.milestones.length
    ? summary.milestones.map((m) => fill(END_TEXT.milestone, m))
    : [END_TEXT.noMilestones];
  const grid = element('div', 'summary-grid');
  grid.append(
    ...row(rows.goal, lines(summary.goal)),
    ...row(rows.milestones, lines(...milestones)),
    ...row(rows.jobs, lines(...(summary.jobs.length ? summary.jobs : [END_TEXT.noJobs]))),
    ...(summary.topTitle ? row(rows.topTitle, lines(summary.topTitle)) : []),
    ...row(rows.money, lines(fill(END_TEXT.money, { amount: summary.money.toLocaleString('en-US') }))),
    ...row(rows.home, lines(summary.home)),
    ...row(rows.apples, lines(String(summary.applesWon))),
  );
  return [
    element('h2', 'goal-title summary-title', summary.title),
    element('p', 'summary-ages', fill(END_TEXT.ages, { name: summary.name, from: 0, to: summary.age })),
    grid,
  ];
}

// `card` is the #summary-card element. onNewLife() runs when "Start a new
// life" is clicked; onOpen() when it opens (to close other panels).
export function createSummaryCard(card, { onNewLife, onOpen }) {
  const body = card.querySelector('.summary-body');
  const close = () => { card.hidden = true; };
  card.querySelector('.panel-close').addEventListener('click', close);
  const newLife = element('button', 'golden', END_TEXT.newLife);
  newLife.addEventListener('click', () => {
    close();
    onNewLife();
  });
  card.querySelector('.menu-options').replaceChildren(newLife);

  return {
    close,
    isOpen: () => !card.hidden,
    // Shows `summary` (lifeSummary()), scrolled to the top.
    open(summary) {
      body.replaceChildren(...summaryRows(summary));
      card.hidden = false;
      card.scrollTop = 0;
      onOpen();
    },
  };
}
