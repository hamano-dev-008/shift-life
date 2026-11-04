// weatherEffects.js — What the weather does to the life on the life tick
// (numbers and text in data/weather.js, WEATHER_EFFECTS): a thunderstorm
// stops fishing (selling the bucket) and busking, and the first rainbow
// of each life cheers the character up. The smaller effects (the rice
// growing faster, quicker bites, busking's rainy pay, nothing starting in
// a storm) are read where they apply, from game/weather.js.

import { WEATHER_EFFECTS, WEATHER_EFFECTS_TEXT } from '../data/weather.js';
import { changeStats } from './character.js';
import { stopActivity } from './activities.js';
import { stopPlaying } from './fortuneTree.js';
import { isStormy, stormStops, weatherIn, createWeatherSeenState } from './weather.js';

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// Call on the life tick while the life goes on. Returns bubbles to show
// ([{ heading, text, deltas, celebrate }]).
export function updateWeatherEffects(game) {
  const bubbles = [];
  if (isStormy(game)) {
    const current = game.activities.current;
    if (current && stormStops(game, current.id)) {
      const sale = stopActivity(game);
      const said = WEATHER_EFFECTS_TEXT.stormStops[current.id];
      bubbles.push(sale
        ? { ...sale, heading: said ?? sale.heading }
        : { text: said ?? '', deltas: {}, celebrate: false });
    }
    if (stopPlaying(game)) {
      bubbles.push({ text: WEATHER_EFFECTS_TEXT.stormStops.busking, deltas: {}, celebrate: false });
    }
  }
  game.weatherSeen ??= createWeatherSeenState();
  const { kinds, stats } = WEATHER_EFFECTS.rainbow;
  if (!game.weatherSeen.rainbow && weatherIn(game, kinds)) {
    game.weatherSeen.rainbow = true;
    const { heading, text } = WEATHER_EFFECTS_TEXT.rainbow;
    bubbles.push({
      heading, text: fill(text, { name: game.character.name }), deltas: changeStats(game.character, stats), celebrate: true,
    });
  }
  return bubbles;
}
