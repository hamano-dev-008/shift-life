// fishing.js — Fishing's numbers and text: how long bites take, the
// catches (rarities, fish, sizes, values, odds), the timing of the cast,
// reel and catch, and the bubble and menu text. Pure data: game/fishing.js
// runs it, ui/fishing.js draws it. The activity itself (where, from what
// age, the rod) is in data/activities.js.

// Real seconds (game speed doesn't change them; nothing passes while the
// app is closed):
//   biteWait    A bite comes a random time in this range after each cast
//               (counted from the start of the cast).
//   biteWindow  How long the "!" stays up. Clicking it in time reels with
//               the click odds (rarer fish); otherwise the character reels
//               it in at normal odds.
//   reel        Reeling in.
//   show        Holding up the catch, before casting again.
//   cast        The cast at the start of each wait (looks only).
export const FISHING_TIMES = { biteWait: [30, 180], biteWindow: 4, reel: 3, show: 3, cast: 1.5 };

// Rarities, from junk to legendary. `weight` is the chance of a catch
// being this rarity (out of all the weights), split evenly between its
// fish. `clickBonus` multiplies the weight when the "!" was clicked in
// time. `celebrate`: the catch shows in a golden bubble.
//
// Tuned to about $4 per real minute at normal odds: a cast-to-cast cycle
// averages 105s of waiting + 4s bite + 3s reel + 3s showing = 115s, and a
// catch is worth 0.6 x $4.50 + 0.11 x $15 + 0.035 x $50 + 0.005 x $300 =
// $7.60 on average, so 7.60 / (115 / 60) = $3.97 a minute. Clicking the
// "!" roughly doubles that.
export const RARITIES = [
  { id: 'junk', name: 'Junk', weight: 250, clickBonus: 0.4, celebrate: false },
  { id: 'common', name: 'Common', weight: 600, clickBonus: 0.8, celebrate: false },
  { id: 'uncommon', name: 'Uncommon', weight: 110, clickBonus: 1.6, celebrate: false },
  { id: 'rare', name: 'Rare', weight: 35, clickBonus: 2.5, celebrate: true },
  { id: 'legendary', name: 'Legendary', weight: 5, clickBonus: 3, celebrate: true },
];

// Everything that can be caught. id: saved in the bucket and the
// collection (don't rename once shipped); also its icon's sprite name,
// fish.<id> (data/sprites.js). value: dollars when sold, or [min, max]
// for a random whole amount per catch. size: [min, max] whole cm, a
// random size per catch (none for junk); the biggest of each kind is
// kept in the fish collection.
export const FISH = [
  { id: 'boot', name: 'Old boot', rarity: 'junk', value: 0 },
  { id: 'carp', name: 'Carp', rarity: 'common', value: [3, 6], size: [25, 60] },
  { id: 'perch', name: 'Perch', rarity: 'common', value: [3, 6], size: [15, 35] },
  { id: 'trout', name: 'Trout', rarity: 'uncommon', value: 15, size: [25, 55] },
  { id: 'catfish', name: 'Catfish', rarity: 'uncommon', value: 15, size: [30, 80] },
  { id: 'salmon', name: 'Salmon', rarity: 'rare', value: 50, size: [50, 90] },
  { id: 'pike', name: 'Pike', rarity: 'rare', value: 50, size: [45, 110] },
  { id: 'goldenKoi', name: 'Golden koi', rarity: 'legendary', value: 300, size: [40, 75] },
];

// How much size changes a catch's value: the smallest of its kind sells
// for (1 - SIZE_VALUE) of its value, the biggest for (1 + SIZE_VALUE),
// rounded to whole dollars. Sizes are even across the range, so on
// average it's the plain value (the $4 a minute above still holds).
export const SIZE_VALUE = 0.2;

// Fishing visuals, in seconds: the bobber bobs every `bob`, a ripple
// spreads every `ripple`, the bite splash loops every `splash`, and the
// rod jiggles every `jiggle` during a bite.
export const FISHING_LOOPS = { bob: 0.7, ripple: 2.4, splash: 0.4, jiggle: 0.15 };

// Text. {fish} is a catch's name, {value}, {total} dollars, {count} a
// number, {list} the bucket's contents, {name} the character's name,
// {age} an age, {time} "0:42".
export const FISHING_TEXT = {
  caught: 'Caught a {fish}!',
  caughtJunk: 'Just an {fish}...',
  inBucket: '${value} in the bucket',
  newKind: 'New for the collection!',
  sold: { heading: 'Fishing', text: 'Sold {count} for ${total}.' },
  soldNothing: { heading: 'Fishing', text: 'Nothing in the bucket to sell.' },
  bucket: 'Bucket: {list}',
  bucketEmpty: 'Bucket: empty',
  worth: 'Worth ${total}',
  waiting: 'Waiting for a bite...',
  bite: 'A bite! Click the "!" quickly',
  reeling: 'Reeling in...',
  showing: 'Got one!',
  collection: 'Fish collection',
  collectionTitle: 'Fish collection ({count}/{total})',
  unknown: '???',
  firstCaught: '{name}, age {age}',
  // {size} in cm, {name} who caught it.
  biggest: 'Biggest: {size} cm ({name})',
  back: 'Back',
  // The dev read-out and menu.
  notFishing: 'Not fishing.',
};
