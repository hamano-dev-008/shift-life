// dev.js — Amounts used by the developer settings menu (src/ui/devMenu.js).
// The menu only appears when running from source (npm start), never in a
// packaged build.

// The dev menu's tabs, in order: each category's id and its tab's name.
export const DEV_TABS = [
  { id: 'life', name: 'Life' },
  { id: 'places', name: 'Places' },
  { id: 'lake', name: 'Lake' },
  { id: 'world', name: 'World' },
  { id: 'settings', name: 'Settings' },
  { id: 'info', name: 'Info' },
];

// The "skip ahead" buttons, in in-game years.
export const DEV_SKIP_YEARS = [1, 10];

// What the "add money" button gives, in dollars.
export const DEV_MONEY = 1000;

// The "set health" buttons. 0 ends an adult's life (no health left).
export const DEV_HEALTH = [0, 10, 50, 100];
