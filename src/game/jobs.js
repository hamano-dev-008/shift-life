// jobs.js — The character's working life: job offers (as events) from
// JOB_MIN_AGE, the job held and its level, yearly pay, promotions, job
// changes from work events, and retirement with a yearly pension. All job
// content lives in data/jobs.js.

import {
  JOBS, JOB_MIN_AGE, RETIRE_AGE, PENSION_SHARE, PENSION_MIN, OFFER_SIZE, GOAL_JOB_WEIGHT,
  HIRE_EFFECTS, PROMOTION_YEARS, JOB_TEXT, MIN_PAY_SHARE,
} from '../data/jobs.js';
import { ageOf, changeStats } from './character.js';

// The id job offers are saved and counted under in the event state.
export const JOB_OFFER_ID = 'job-offer';

export function jobById(id) {
  return JOBS.find((job) => job.id === id) ?? null;
}

// current: the job held, or null: { id, level (0-based), since (clock time
// it reached this level), hiredAge, bonus (raises minus pay cuts, dollars
// a year) }. retired: whether they've retired. pension: yearly pension
// once retired. nextPayAt: clock time of the next pay or pension, or null
// without an income. history: jobs left, oldest first, as { id, level,
// from, to (ages), pay (last yearly pay) }, for the end-of-life summary.
export function createJobState() {
  return { current: null, retired: false, pension: 0, nextPayAt: null, history: [] };
}

const isWholeAge = (value) => Number.isInteger(value) && value >= 0;

// Rebuilds job state from save data, dropping anything unusable (such as
// a job since removed from the data).
export function restoreJobState(data, years) {
  const state = createJobState();
  const current = data?.current;
  const job = jobById(current?.id);
  if (job && Number.isInteger(current.level) && Number.isFinite(current.since)) {
    state.current = {
      id: current.id,
      level: Math.min(Math.max(current.level, 0), job.levels.length - 1),
      since: Math.min(current.since, years),
      hiredAge: isWholeAge(current.hiredAge) ? current.hiredAge : 0,
      bonus: Number.isFinite(current.bonus) ? current.bonus : 0,
    };
  }
  state.retired = data?.retired === true;
  if (state.retired) state.current = null;
  if (Number.isFinite(data?.pension) && data.pension >= 0) state.pension = data.pension;
  if (state.current || state.retired) {
    state.nextPayAt = Number.isFinite(data?.nextPayAt) ? data.nextPayAt : years + 1;
  }
  if (Array.isArray(data?.history)) {
    state.history = data.history.filter((entry) => jobById(entry?.id)
      && Number.isInteger(entry.level) && isWholeAge(entry.from) && isWholeAge(entry.to)
      && Number.isFinite(entry.pay));
  }
  return state;
}

function levelOf(current) {
  return jobById(current.id).levels[current.level];
}

// Yearly pay for the job held: the level's pay plus raises, minus pay
// cuts, but never below MIN_PAY_SHARE of the level's pay.
function payOf(current) {
  const { pay } = levelOf(current);
  return Math.max(Math.round(pay * MIN_PAY_SHARE), pay + current.bonus);
}

function meets(character, needs) {
  return Object.entries(needs).every(([stat, min]) => character.stats[stat] >= min);
}

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

const payText = (amount) => `$${amount}/yr`;

export function isEmployed(game) {
  return Boolean(game.jobs.current);
}

// The job's title, or JOB_TEXT.noJob without one (for {job} in events).
export function jobTitle(game) {
  return game.jobs.current ? levelOf(game.jobs.current).title : JOB_TEXT.noJob;
}

// What the character wears or carries for their job (an item id from
// data/jobs.js), or null.
export function jobItem(game) {
  return game.jobs.current ? jobById(game.jobs.current.id).item : null;
}

// Picks up to `count` different items from `list`, each as likely as
// weight(item).
function sample(list, count, weight) {
  const pool = [...list];
  const picked = [];
  while (picked.length < count && pool.length) {
    let roll = Math.random() * pool.reduce((sum, item) => sum + weight(item), 0);
    let index = pool.findIndex((item) => (roll -= weight(item)) < 0);
    if (index === -1) index = pool.length - 1;
    picked.push(...pool.splice(index, 1));
  }
  return picked;
}

// Jobs the character could be hired for now (first level's needs met),
// minus `except`.
function hireableJobs(game, except = null) {
  return JOBS.filter((job) => job.id !== except && meets(game.character, job.levels[0].needs));
}

const goalWeight = (game) => (job) => (job.goals.includes(game.goals.active) ? GOAL_JOB_WEIGHT : 1);

// Whether the next event should be a job offer: an adult with no job who
// hasn't retired.
export function wantsJobOffer(game) {
  const age = ageOf(game.character, game.clock.years);
  return !game.jobs.current && !game.jobs.retired && age >= JOB_MIN_AGE && age < RETIRE_AGE;
}

// The job ids for a new offer: OFFER_SIZE jobs the character qualifies
// for, always including one that suits the active goal if there is one,
// and favoring those for the rest. Null if none fit.
export function makeJobOffer(game) {
  const [min, max] = OFFER_SIZE;
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const hireable = hireableJobs(game);
  const [first] = sample(hireable.filter((job) => job.goals.includes(game.goals.active)), 1, () => 1);
  const rest = hireable.filter((job) => job !== first);
  const picked = [...(first ? [first] : []), ...sample(rest, count - (first ? 1 : 0), goalWeight(game))];
  return picked.length ? shuffled(picked).map((job) => job.id) : null;
}

function shuffled(list) {
  return sample(list, list.length, () => 1);
}

// A job offer for `jobIds` in the shape of an event from data/events.js,
// so the event engine can show it, decide it, and resolve it: one choice
// per job, leaning and serving goals as the job does.
export function jobOfferEvent(jobIds) {
  return {
    id: JOB_OFFER_ID,
    prompt: JOB_TEXT.offerPrompt,
    choices: jobIds.map((id) => {
      const job = jobById(id);
      const { title, pay } = job.levels[0];
      return {
        label: fill(JOB_TEXT.offerLabel, { job: title, pay: payText(pay) }),
        lean: job.lean,
        goals: job.goals,
        effects: HIRE_EFFECTS,
        text: fill(JOB_TEXT.hired, { job: title }),
        job: { hire: id },
      };
    }),
  };
}

function startJob(game, id) {
  const { jobs, clock } = game;
  jobs.current = {
    id, level: 0, since: clock.years, hiredAge: ageOf(game.character, clock.years), bonus: 0,
  };
  jobs.nextPayAt = clock.years + 1;
}

// Ends the job held at clock time `at`, keeping it in the history.
function endJob(game, at) {
  const { jobs } = game;
  const { current } = jobs;
  if (!current) return;
  jobs.history.push({
    id: current.id,
    level: current.level,
    from: current.hiredAge,
    to: ageOf(game.character, at),
    pay: payOf(current),
  });
  jobs.current = null;
  jobs.nextPayAt = jobs.retired ? jobs.nextPayAt : null;
}

// Applies an event outcome's `job` change (see data/events.js): { hire:
// id }, { raise: dollars }, { leave: true } or { switch: true }. Returns
// { raise } (the change to yearly pay) or { newJob } (the new title), or
// null if nothing changed.
export function applyJobChange(game, change) {
  const { jobs, clock } = game;
  if (jobs.retired) return null;
  if (change.hire && jobById(change.hire)) {
    endJob(game, clock.years);
    startJob(game, change.hire);
    return { newJob: jobTitle(game) };
  }
  if (!jobs.current) return null;
  if (change.raise) {
    const before = payOf(jobs.current);
    jobs.current.bonus += change.raise;
    const raise = payOf(jobs.current) - before;
    return raise ? { raise } : null;
  }
  if (change.leave) {
    endJob(game, clock.years);
    return {};
  }
  if (change.switch) {
    const [next] = sample(hireableJobs(game, jobs.current.id), 1, goalWeight(game));
    if (!next) return null;
    endJob(game, clock.years);
    startJob(game, next.id);
    return { newJob: jobTitle(game) };
  }
  return null;
}

// Retires at clock time `at`: ends any job and starts the pension.
function retire(game, at) {
  const { jobs, character } = game;
  const lastPay = jobs.current ? payOf(jobs.current) : jobs.history.at(-1)?.pay ?? 0;
  jobs.retired = true;
  endJob(game, at);
  jobs.pension = Math.max(PENSION_MIN, Math.round(lastPay * PENSION_SHARE));
  jobs.nextPayAt = at + 1;
  const { retired } = JOB_TEXT;
  return {
    heading: retired.heading,
    text: fill(retired.text, { name: character.name }),
    detail: fill(retired.detail, { pay: payText(jobs.pension) }),
    celebrate: true,
  };
}

// Promotes to the next level if they've been at this one long enough
// (PROMOTION_YEARS) and meet its needs. `at` is the clock time of the
// payday doing the check. Returns a bubble, or null.
function checkPromotion(game, at) {
  const { current } = game.jobs;
  const job = jobById(current.id);
  const next = job.levels[current.level + 1];
  if (!next || Math.round(at - current.since) < PROMOTION_YEARS[current.level]) return null;
  if (!meets(game.character, next.needs)) return null;
  current.level += 1;
  current.since = at;
  return {
    heading: JOB_TEXT.promoted.heading,
    text: fill(JOB_TEXT.promoted.text, { name: game.character.name, job: next.title }),
    detail: payText(payOf(current)),
    celebrate: true,
  };
}

const retiresBy = (game, at) => !game.jobs.retired && ageOf(game.character, at) >= RETIRE_AGE;

// Call regularly (on the same timer as events). Pays the yearly pay or
// pension when due (catching up after skipped years), promotes, and
// retires at RETIRE_AGE. Returns bubbles to show, as [{ heading, text,
// deltas or detail, celebrate }]; paydays caught up at once share one.
export function updateJobs(game) {
  const { jobs, clock, character } = game;
  const bubbles = [];
  let paid = 0;
  // Whether any of it was pay from a job (or all of it pension).
  let salary = false;
  while (jobs.nextPayAt !== null && clock.years >= jobs.nextPayAt) {
    const at = jobs.nextPayAt;
    if (retiresBy(game, at)) {
      bubbles.push(retire(game, at));
      continue;
    }
    const amount = jobs.current ? payOf(jobs.current) : jobs.pension;
    salary ||= Boolean(jobs.current);
    paid += changeStats(character, { money: amount }).money ?? 0;
    if (jobs.current) {
      const promoted = checkPromotion(game, at);
      if (promoted) bubbles.push(promoted);
    }
    jobs.nextPayAt = at + 1;
  }
  if (retiresBy(game, clock.years)) bubbles.push(retire(game, clock.years));
  if (paid) {
    const { heading, text } = salary ? JOB_TEXT.payday : JOB_TEXT.pension;
    bubbles.unshift({
      heading, text: fill(text, { name: character.name }), deltas: { money: paid }, celebrate: false,
    });
  }
  return bubbles;
}

// The job at a glance, for the stats panel and dev read-out. Null before
// JOB_MIN_AGE (unless retired). Otherwise { status: 'working', 'looking'
// or 'retired', title, level (1-based), levels, pay (yearly, or the
// pension) }.
export function careerView(game) {
  const { jobs } = game;
  if (jobs.retired) return { status: 'retired', title: null, level: 0, levels: 0, pay: jobs.pension };
  if (!jobs.current) {
    if (ageOf(game.character, game.clock.years) < JOB_MIN_AGE) return null;
    return { status: 'looking', title: null, level: 0, levels: 0, pay: 0 };
  }
  const { current } = jobs;
  return {
    status: 'working',
    title: levelOf(current).title,
    level: current.level + 1,
    levels: jobById(current.id).levels.length,
    pay: payOf(current),
  };
}
