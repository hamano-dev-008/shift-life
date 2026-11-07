// endOfLife.js — The end of a life: health dropping with age (slower in a
// better home), when a life ends (no health left, or a yearly chance in
// old age up to a natural limit), ending it gently (busking and resting
// stop, events and time stand still), the life summary and its title,
// the Book of past lives, and starting a new life. All numbers and text
// live in data/endOfLife.js.

import {
  AGEING_FROM_AGE, AGEING_LOSS, DEATH, TRAIT_SCORE, TRAIT_ADJECTIVES, TRAIT_GOALS,
  FALLBACK_ADJECTIVE, BUSKER, JOB_NOUNS, GOAL_NOUNS, FALLBACK_NOUN, TITLE_FORMAT, BOOK_MAX_LIVES,
  END_TEXT,
} from '../data/endOfLife.js';
import { NEW_LIFE_PLACE } from '../data/places.js';
import { createCharacter, ageOf, changeStats } from './character.js';
import { createEventState } from './events.js';
import { createGoalState, goalById } from './goals.js';
import { createJobState, jobById } from './jobs.js';
import { createTreeState } from './fortuneTree.js';
import { createHomeState } from './home.js';
import { createHousingState, currentTier } from './housing.js';
import { leavePlace } from './places.js';
import { createActivityState } from './activities.js';
import { createAutonomyState } from './autonomy.js';
import { createFarmState } from './farm.js';
import { createCafeState } from './cafe.js';
import { createWorkState } from './shifts.js';
import { createStoreState } from './store.js';
import { createPostState } from './post.js';
import { createAlleyState } from './alley.js';
import { createOfficeState } from './office.js';
import { collectionCount } from './fishing.js';
import { createWeatherSeenState } from './weather.js';

const BOOK_VERSION = 1;

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// checkedAge: the last birthday whose ageing and yearly chance have been
// applied. ended: null while alive; afterwards { id, endedOn (real date,
// ISO), at (clock time), cause ('health', 'age' or 'dev'), summary (see
// lifeSummary()) }.
export function createEndOfLifeState() {
  return { checkedAge: 0, ended: null };
}

const isWholeAge = (value) => Number.isInteger(value) && value >= 0;
const isText = (value) => typeof value === 'string';

// Rebuilds the state from save data. A save without it (from before the
// end of life existed) starts counting from the current `age`, so no
// years of ageing are applied at once.
export function restoreEndOfLifeState(data, age) {
  const state = createEndOfLifeState();
  state.checkedAge = isWholeAge(data?.checkedAge) ? Math.min(data.checkedAge, age) : age;
  const ended = data?.ended;
  const summary = restoreSummary(ended?.summary);
  if (summary && isText(ended.id) && Number.isFinite(ended.at)) {
    state.ended = {
      id: ended.id,
      endedOn: isText(ended.endedOn) ? ended.endedOn : '',
      at: ended.at,
      cause: isText(ended.cause) ? ended.cause : 'age',
      summary,
    };
  }
  return state;
}

export function isEnded(game) {
  return Boolean(game.endOfLife.ended);
}

// Health lost each year from AGEING_FROM_AGE where they live now.
export function ageingLoss(game) {
  if (!game.housing.movedOut) return AGEING_LOSS.parents;
  return AGEING_LOSS[currentTier(game).id] ?? AGEING_LOSS.parents;
}

// Chance (0-1) that a life ends on the birthday it turns `age`, with
// `health` (0-100).
export function deathChance(age, health) {
  if (age < Math.max(DEATH.minAge, DEATH.fromAge)) return 0;
  if (age >= DEATH.maxAge) return 1;
  const { base, perYear, lowHealthFactor, highHealthFactor } = DEATH;
  const factor = lowHealthFactor + (highHealthFactor - lowHealthFactor) * (health / 100);
  return Math.min(1, Math.max(0, (base + perYear * (age - DEATH.fromAge)) * factor));
}

export function canDie(game) {
  return ageOf(game.character, game.clock.years) >= DEATH.minAge;
}

// Call regularly (on the life tick), before the other updates. On each
// birthday not yet checked (catching up after skipped years), applies the
// year's ageing and rolls the chance; at any time, ends an adult's life
// with no health left. `random` returns 0-1 (tests pass their own).
// Returns the ended record when the life ends now, otherwise null.
export function updateEndOfLife(game, random = Math.random) {
  if (isEnded(game)) return null;
  const state = game.endOfLife;
  const { character } = game;
  const age = ageOf(character, game.clock.years);
  while (state.checkedAge < age) {
    state.checkedAge += 1;
    const year = state.checkedAge;
    if (year >= AGEING_FROM_AGE) changeStats(character, { health: -ageingLoss(game) });
    const cause = year < DEATH.minAge ? null
      : character.stats.health <= 0 ? 'health'
        : random() < deathChance(year, character.stats.health) ? 'age' : null;
    if (cause) {
      // Skipped years past the end don't count: the clock goes back to
      // the year it happened.
      game.clock.years = Math.min(game.clock.years, character.bornAt + year + 0.5);
      return endLife(game, cause);
    }
  }
  if (age >= DEATH.minAge && character.stats.health <= 0) return endLife(game, 'health');
  return null;
}

// Ends the life now, gently: busking or resting stops, any waiting event
// goes, and the clock stops (so events, goals, jobs and the tree's timers
// stand still). Records the summary. Returns the ended record, or null if
// it had already ended.
export function endLife(game, cause = 'age', now = new Date()) {
  if (isEnded(game)) return null;
  leavePlace(game);
  if (game.autonomy) game.autonomy.plan = null;
  game.events.pending = null;
  game.clock.stopped = true;
  const summary = lifeSummary(game);
  game.endOfLife.ended = {
    id: `${now.getTime().toString(36)}-${summary.name}`,
    endedOn: now.toISOString(),
    at: game.clock.years,
    cause,
    summary,
  };
  return game.endOfLife.ended;
}

// The farewell bubble's text.
export function farewellText(ended) {
  return fill(END_TEXT.farewell, { name: ended.summary.name, age: ended.summary.age });
}

// Every job held, as { id, level }, oldest first, ending with the one
// held now.
function jobsHeld(game) {
  const { history, current } = game.jobs;
  return [...history, ...(current ? [current] : [])]
    .filter((entry) => jobById(entry.id)?.levels[entry.level]);
}

const titleOf = (entry) => jobById(entry.id).levels[entry.level].title;
const payOf = (entry) => jobById(entry.id).levels[entry.level].pay;

// The job and level with the highest title (the best-paid level reached),
// or null if they never worked. The later one wins a tie.
function topJob(game) {
  return jobsHeld(game).reduce((best, entry) => (!best || payOf(entry) >= payOf(best) ? entry : best), null);
}

// The trait that shows most in the life lived (TRAIT_SCORE), or null.
export function strongestTrait(game) {
  const held = jobsHeld(game).map((entry) => jobById(entry.id));
  const goal = game.goals.active;
  let best = null;
  let bestScore = -Infinity;
  for (const trait of game.character.traits) {
    const score = TRAIT_SCORE.base
      + TRAIT_SCORE.job * held.filter((job) => job.lean.includes(trait)).length
      + ((TRAIT_GOALS[trait] ?? []).includes(goal) ? TRAIT_SCORE.goal : 0);
    if (score > bestScore) {
      best = trait;
      bestScore = score;
    }
  }
  return best;
}

// "The Steady Chef": the strongest trait's adjective and what the life
// was about (see the title rules in data/endOfLife.js).
export function lifeTitle(game) {
  const trait = strongestTrait(game);
  const adjective = TRAIT_ADJECTIVES[trait] ?? FALLBACK_ADJECTIVE;
  const tree = game.fortuneTree;
  const top = topJob(game);
  let noun;
  if (tree.sessionsPlayed >= BUSKER.sessions || tree.applesWon >= BUSKER.apples) {
    noun = BUSKER.noun;
  } else if (top && JOB_NOUNS[top.id]) {
    noun = JOB_NOUNS[top.id];
  } else {
    noun = GOAL_NOUNS[game.goals.active] ?? FALLBACK_NOUN;
  }
  return fill(TITLE_FORMAT, { adjective, noun });
}

// The best home they had: the housing tier's name, or the parents'
// house if they never moved out.
function homeName(game) {
  return game.housing.movedOut ? currentTier(game).name : END_TEXT.parentsHome;
}

// Everything the summary card shows, kept with the life in the Book:
// { name, age, title, goal, milestones: [{ label, goal, age }], jobs
// (titles, in order), topTitle, money, home, applesWon }.
export function lifeSummary(game) {
  const { character } = game;
  const top = topJob(game);
  const jobs = [];
  for (const entry of jobsHeld(game)) {
    const title = titleOf(entry);
    if (jobs.at(-1) !== title) jobs.push(title);
  }
  return {
    name: character.name,
    age: ageOf(character, game.clock.years),
    title: lifeTitle(game),
    goal: goalById(game.goals.active)?.label ?? '',
    milestones: game.goals.milestones.map((reached) => {
      const goal = goalById(reached.goal);
      const milestone = goal?.milestones.find((m) => m.id === reached.id);
      return milestone ? { label: milestone.label, goal: goal.label, age: reached.age } : null;
    }).filter(Boolean),
    jobs,
    topTitle: top ? titleOf(top) : null,
    money: character.stats.money,
    home: homeName(game),
    applesWon: game.fortuneTree.applesWon,
    fish: { caught: game.activities.totals.fishing.caught, ...collectionCount(game.collection) },
  };
}

// A saved summary, cleaned up, or null if it's unusable. Kept as saved
// (not re-checked against the data), so old lives stay readable after
// jobs or goals change.
export function restoreSummary(data) {
  if (!isText(data?.name) || !isWholeAge(data.age) || !isText(data.title)) return null;
  const count = (value) => (Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0);
  return {
    name: data.name,
    age: data.age,
    title: data.title,
    goal: isText(data.goal) ? data.goal : '',
    milestones: (Array.isArray(data.milestones) ? data.milestones : [])
      .filter((m) => isText(m?.label) && isText(m.goal) && isWholeAge(m.age))
      .map(({ label, goal, age }) => ({ label, goal, age })),
    jobs: (Array.isArray(data.jobs) ? data.jobs : []).filter(isText),
    topTitle: isText(data.topTitle) ? data.topTitle : null,
    money: count(data.money),
    home: isText(data.home) ? data.home : '',
    applesWon: count(data.applesWon),
    // Lives from before fishing have none.
    fish: data.fish ? { caught: count(data.fish.caught), count: count(data.fish.count), total: count(data.fish.total) } : null,
  };
}

// The Book of past lives: { lives: [{ id, endedOn, summary }] }, oldest
// first. Saved in its own file, so it carries on across new lives.
export function createBook() {
  return { lives: [] };
}

// Rebuilds the Book from its file, dropping unusable entries.
export function restoreBook(data) {
  const book = createBook();
  if (!Array.isArray(data?.lives)) return book;
  for (const entry of data.lives) {
    const summary = restoreSummary(entry?.summary);
    if (!summary || !isText(entry.id) || book.lives.some((life) => life.id === entry.id)) continue;
    book.lives.push({ id: entry.id, endedOn: isText(entry.endedOn) ? entry.endedOn : '', summary });
  }
  book.lives = book.lives.slice(-BOOK_MAX_LIVES);
  return book;
}

// What's written to the Book's file.
export function bookSaveData(book) {
  return { version: BOOK_VERSION, lives: book.lives };
}

// Adds the ended life to the Book (once: an id already there is left
// alone), keeping at most BOOK_MAX_LIVES. Returns whether it was added.
export function recordLife(book, ended) {
  if (!ended || book.lives.some((life) => life.id === ended.id)) return false;
  book.lives.push({ id: ended.id, endedOn: ended.endedOn, summary: ended.summary });
  if (book.lives.length > BOOK_MAX_LIVES) book.lives.splice(0, book.lives.length - BOOK_MAX_LIVES);
  return true;
}

// The Book's entries for its menu, newest first: { id, label ("Mia,
// 0-82"), title, summary }.
export function bookView(book) {
  return [...book.lives].reverse().map((life) => ({
    id: life.id,
    label: fill(END_TEXT.bookEntry, { name: life.summary.name, from: 0, to: life.summary.age }),
    title: life.summary.title,
    summary: life.summary,
  }));
}

// Replaces the life with a newborn at the parents' home, in place, so
// everything holding `game` sees the new one. The clock starts over at 0,
// running, at the same speed. Save right after.
//
// HOOK, not built yet: continuing as a child of the life that just ended.
// That will pass `{ parent: game.endOfLife.ended }` here and use it to
// hand things down (a family name, some money, the house); today
// `options.parent` is ignored and every new life starts fresh.
export function startNewLife(game, options = {}) {
  game.clock.years = 0;
  game.clock.stopped = false;
  game.character = createCharacter(0);
  game.events = createEventState(0);
  game.goals = createGoalState(0);
  game.jobs = createJobState();
  game.place = NEW_LIFE_PLACE;
  game.townFrom = null;
  game.fortuneTree = createTreeState();
  game.home = createHomeState();
  game.housing = createHousingState();
  game.endOfLife = createEndOfLifeState();
  game.activities = createActivityState();
  game.autonomy = createAutonomyState();
  game.farm = createFarmState();
  game.cafe = createCafeState();
  game.work = createWorkState();
  game.store = createStoreState();
  game.post = createPostState();
  game.alley = createAlleyState();
  game.office = createOfficeState();
  game.weatherSeen = createWeatherSeenState();
  return game;
}

// A short line for the dev read-out: "Life: -2 HP/yr from 50, 4%/yr" or
// "Life: ended at 82 (age)".
export function endOfLifeText(game) {
  const { ended } = game.endOfLife;
  if (ended) return `Life: ended at ${ended.summary.age} (${ended.cause})`;
  const age = ageOf(game.character, game.clock.years);
  const chance = Math.round(deathChance(age + 1, game.character.stats.health) * 100);
  return `Life: -${ageingLoss(game)} HP/yr from ${AGEING_FROM_AGE}, next bday ${chance}%`;
}
