// statsPanel.js — The small panel under the name label listing the
// character's stats, job and traits. Hovering the label shows it; clicking
// the label pins it open (click again to unpin).

import { STAT_LABELS } from '../data/stats.js';
import { TRAIT_LABELS } from '../data/traits.js';
import { CAREER_LABELS } from '../data/jobs.js';

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

// Job rows for careerView() (game/jobs.js): what they do, the level, and
// yearly pay (or pension). None before working age.
function careerRows(career) {
  if (!career) return [];
  const row = (name, text) => [cell('stat-name', name), cell('stat-wide', text)];
  if (career.status === 'looking') return row(CAREER_LABELS.job, CAREER_LABELS.looking);
  if (career.status === 'retired') {
    return [...row(CAREER_LABELS.job, CAREER_LABELS.retired), ...row(CAREER_LABELS.pay, `$${career.pay}/yr`)];
  }
  return [
    ...row(CAREER_LABELS.job, career.title),
    ...row(CAREER_LABELS.level, `${career.level} of ${career.levels}`),
    ...row(CAREER_LABELS.pay, `$${career.pay}/yr`),
  ];
}

function render(panel, { stats, traits }, career) {
  const cells = BAR_STATS.flatMap((id) => [
    cell('stat-name', STAT_LABELS[id]),
    bar(id, stats[id]),
    cell('stat-value', String(stats[id])),
  ]);
  cells.push(cell('stat-name', STAT_LABELS.money), cell('stat-wide', `$${stats.money}`));
  cells.push(...careerRows(career));
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
    // Call every frame with the character and careerView(); re-renders
    // only while visible and when something changed.
    update(character, career) {
      if (panel.hidden) return;
      const key = JSON.stringify([character.stats, character.traits, career]);
      if (key === shown) return;
      shown = key;
      render(panel, character, career);
    },
  };
}
