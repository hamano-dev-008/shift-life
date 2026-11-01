// statsPanel.js — The small panel under the name label listing the
// character's stats and traits. Hovering the label shows it; clicking the
// label pins it open (click again to unpin).

import { STAT_LABELS } from '../data/stats.js';
import { TRAIT_LABELS } from '../data/traits.js';

// Stats drawn as 0-100 bars; money is shown as a dollar amount.
const BAR_STATS = ['health', 'happiness', 'smarts'];

function cell(className, text = '') {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = text;
  return element;
}

function bar(id, value) {
  const track = cell(`bar bar-${id}`);
  const filled = cell('bar-fill');
  filled.style.width = `${value}%`;
  track.append(filled);
  return track;
}

function render(panel, { stats, traits }) {
  const cells = BAR_STATS.flatMap((id) => [
    cell('stat-name', STAT_LABELS[id]),
    bar(id, stats[id]),
    cell('stat-value', String(stats[id])),
  ]);
  cells.push(cell('stat-name', STAT_LABELS.money), cell('stat-money', `$${stats.money}`));
  cells.push(cell('traits', traits.map((trait) => TRAIT_LABELS[trait]).join(' · ')));
  panel.replaceChildren(...cells);
}

export function createStatsPanel(label, panel) {
  let hovering = false;
  let pinned = false;
  let shown = '';

  const refresh = () => {
    panel.hidden = !hovering && !pinned;
    label.classList.toggle('pinned', pinned);
  };
  label.addEventListener('mouseenter', () => { hovering = true; refresh(); });
  label.addEventListener('mouseleave', () => { hovering = false; refresh(); });
  label.addEventListener('click', () => { pinned = !pinned; refresh(); });

  return {
    // Call every frame; re-renders only while visible and when something
    // changed.
    update(character) {
      if (panel.hidden) return;
      const key = JSON.stringify([character.stats, character.traits]);
      if (key === shown) return;
      shown = key;
      render(panel, character);
    },
  };
}
