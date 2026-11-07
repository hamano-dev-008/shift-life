// timeText.js — Real times as short menu text: "7:05" (minutes and
// seconds) and "1h 25m" (hours and minutes).

// "7:05" from ms.
export function clockTime(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// "1h 25m", "25m", or "<1m"; rounded up so it never says 0 too early.
export function longTime(ms) {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 1) return '<1m';
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}
