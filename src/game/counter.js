// counter.js — What the town places' counters share (the Cafe's, the
// 6-Eleven's, Pedal Post's): each item can be had once every
// `everyMinutes` of real time, and the menu's list of items. `items` is a
// place's item data ({ id: { name, price, everyMinutes } }); `waits`
// holds real ms until each can be had again.

const MINUTE_MS = 60 * 1000;

export const isAmount = (value) => Number.isFinite(value) && value >= 0;

// No waits yet.
export function createWaits(items) {
  return Object.fromEntries(Object.keys(items).map((id) => [id, 0]));
}

// Waits from save data, each at most its item's full wait.
export function restoreWaits(data, items) {
  const waits = createWaits(items);
  for (const [id, item] of Object.entries(items)) {
    if (isAmount(data?.[id])) waits[id] = Math.min(data[id], item.everyMinutes * MINUTE_MS);
  }
  return waits;
}

// Item `id` was just had: its full wait starts.
export function startWait(waits, items, id) {
  waits[id] = items[id].everyMinutes * MINUTE_MS;
}

// The waits run down by `ms`.
export function tickWaits(waits, ms) {
  for (const id of Object.keys(waits)) waits[id] = Math.max(0, waits[id] - ms);
}

// The menu's items: [{ id, name, price, block (why it can't be had now,
// from blockOf(id), or null), waitMs, need (dollars short) }].
export function itemsView(game, items, waits, blockOf) {
  return Object.entries(items).map(([id, item]) => ({
    id,
    name: item.name,
    price: item.price,
    block: blockOf(id),
    waitMs: waits[id],
    need: Math.max(0, item.price - game.character.stats.money),
  }));
}
