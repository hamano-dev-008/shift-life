// eventCard.js — The event card: a compact panel inside the window with
// the waiting event's prompt and a button per choice. It opens when the
// player clicks the "!" bubble.

import { STAT_LABELS } from '../data/stats.js';

// "Needs $50" / "Needs Smarts 60" for a choice the character can't pick.
function needsText(needs) {
  const parts = Object.entries(needs).map(([id, min]) =>
    (id === 'money' ? `$${min}` : `${STAT_LABELS[id]} ${min}`));
  return `Needs ${parts.join(', ')}`;
}

// `card` is the #event-card element. onChoose(index) runs when a choice is
// clicked; onDismiss() when the card is closed without choosing.
export function createEventCard(card, { onChoose, onDismiss }) {
  const prompt = card.querySelector('.event-prompt');
  const choices = card.querySelector('.event-choices');

  card.querySelector('.event-close').addEventListener('click', () => {
    card.hidden = true;
    onDismiss();
  });

  // `view` comes from pendingEventView() in game/events.js.
  function open(view) {
    prompt.textContent = view.prompt;
    choices.replaceChildren(...view.choices.map((choice, index) => {
      const button = document.createElement('button');
      button.textContent = choice.label;
      if (!choice.available) {
        button.disabled = true;
        button.title = needsText(choice.needs);
      }
      button.addEventListener('click', () => onChoose(index));
      return button;
    }));
    card.hidden = false;
  }

  return {
    open,
    close: () => { card.hidden = true; },
    isOpen: () => !card.hidden,
  };
}
