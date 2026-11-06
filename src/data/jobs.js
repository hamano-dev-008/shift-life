// jobs.js — Jobs the character can hold, their career paths, pay and
// requirements, plus the numbers for job offers, promotions and
// retirement. Pure data: game/jobs.js reads it.

// Job offers start at this age (whole years), for anyone without a job.
export const JOB_MIN_AGE = 18;

// At this age the character retires: the job ends and a yearly pension
// starts, PENSION_SHARE of their last yearly pay, but at least
// PENSION_MIN dollars.
// PENSION_MIN is a quarter of an entry job's pay.
export const RETIRE_AGE = 65;
export const PENSION_SHARE = 0.25;
export const PENSION_MIN = 25;

// Pay and pension come in this many paydays a year (monthly: about every
// 20 real minutes for an adult), each its share of the yearly amount.
export const PAYDAYS_PER_YEAR = 12;

// How many jobs a job offer lists: [min, max]. Only jobs whose first
// level's `needs` are met are offered. If any of those suit the active
// goal (`goals`), one of them is always on the list, and the rest that
// suit it are GOAL_JOB_WEIGHT times as likely to fill the other spots.
export const OFFER_SIZE = [2, 3];
export const GOAL_JOB_WEIGHT = 3;

// Pay cuts from events never take yearly pay below this share of the
// level's `pay`.
export const MIN_PAY_SHARE = 0.5;

// Stat changes when the character takes a job.
export const HIRE_EFFECTS = { happiness: 5 };

// Years at a level before a promotion to the next is possible:
// PROMOTION_YEARS[0] at the first level, [1] at the second. Checked each
// payday; the promotion happens once the next level's `needs` are met.
// For an adult that's 12 and 24 real hours of work.
export const PROMOTION_YEARS = [3, 6];

// Text for job offers and the bubbles about work. {name} becomes the
// character's name, {job} a job title, {pay} yearly pay ("$40/yr").
export const JOB_TEXT = {
  offerPrompt: '{name} is looking for work, and a few places are hiring!',
  offerLabel: '{job}, {pay}',
  hired: 'Hired as {job}!',
  payday: { heading: 'Payday!', text: '{name} got paid.' },
  pension: { heading: 'Pension', text: 'The pension came in.' },
  promoted: { heading: 'Promoted!', text: '{name} is now {job}.' },
  retired: { heading: 'Retired!', text: '{name} retires. Time to rest!', detail: 'Pension {pay}' },
  // Stands in for {job} in event text when there's no job.
  noJob: 'nothing',
};

// The job rows in the stats panel: row names (6 characters at most, so
// they line up with the stats) and the words for no job and retired.
export const CAREER_LABELS = {
  job: 'Job', level: 'Level', pay: 'Pay', looking: 'Looking', retired: 'Retired',
};

// Each job has:
//   id      Unique and saved; don't rename one once it has shipped.
//   lean    Traits (data/traits.js) that favor it when the character
//           picks from an offer alone.
//   goals   Goals (data/goals.js) it suits: offered more often while one
//           is active, and picked first when deciding alone.
//   item    What the character wears or carries at work. Each id must
//           have a matching case in drawJobItem() in src/ui/sprite.js.
//   levels  The career path, 3 levels, each { title, pay, needs }:
//             title  16 characters at most (the stats panel).
//             pay    Yearly pay in dollars. An adult year is 4 real
//                    hours (data/lifeStages.js), so pay / 4 is dollars
//                    per real hour. Targets (AGENTS.md): entry jobs
//                    about $25/h ($100), the top job about $120/h
//                    ($480); the rest sit in between, in their order.
//             needs  Minimum stats to be hired at (level 1) or promoted
//                    to this level, e.g. { smarts: 50, health: 40 }.
// Entry jobs (no needs at level 1) mean anyone can get work.
export const JOBS = [
  // ---- Entry jobs ----
  {
    id: 'cafe',
    lean: ['social'],
    goals: ['heart'],
    item: 'apron',
    levels: [
      { title: 'Barista', pay: 100, needs: {} },
      { title: 'Head Barista', pay: 130, needs: { smarts: 30 } },
      { title: 'Cafe Owner', pay: 205, needs: { smarts: 45 } },
    ],
  },
  {
    id: 'shop',
    lean: ['social', 'lazy'],
    goals: ['fortune'],
    item: 'cap',
    levels: [
      { title: 'Shop Clerk', pay: 105, needs: {} },
      { title: 'Shift Lead', pay: 135, needs: { smarts: 30 } },
      { title: 'Store Manager', pay: 215, needs: { smarts: 50 } },
    ],
  },
  {
    id: 'courier',
    lean: ['bold', 'curious'],
    goals: ['healthy', 'free'],
    item: 'satchel',
    levels: [
      { title: 'Courier', pay: 105, needs: {} },
      { title: 'Senior Courier', pay: 130, needs: { health: 60 } },
      { title: 'Route Boss', pay: 195, needs: { health: 60, smarts: 40 } },
    ],
  },
  {
    id: 'farm',
    lean: ['shy', 'careful'],
    goals: ['healthy', 'free'],
    item: 'strawHat',
    levels: [
      { title: 'Farmhand', pay: 100, needs: {} },
      { title: 'Grower', pay: 130, needs: { health: 55 } },
      { title: 'Farm Owner', pay: 225, needs: { health: 60, smarts: 40 } },
    ],
  },

  // ---- Some smarts or health ----
  {
    id: 'artist',
    lean: ['curious', 'shy'],
    goals: ['free', 'heart'],
    item: 'beret',
    levels: [
      { title: 'Street Artist', pay: 95, needs: { smarts: 30 } },
      { title: 'Illustrator', pay: 155, needs: { smarts: 45 } },
      { title: 'Gallery Star', pay: 290, needs: { smarts: 60 } },
    ],
  },
  {
    id: 'builder',
    lean: ['bold'],
    goals: ['healthy', 'fortune'],
    item: 'hardHat',
    levels: [
      { title: 'Site Helper', pay: 120, needs: { health: 60 } },
      { title: 'Builder', pay: 175, needs: { health: 65, smarts: 35 } },
      { title: 'Site Boss', pay: 280, needs: { health: 65, smarts: 50 } },
    ],
  },
  {
    id: 'chef',
    lean: ['bold', 'social'],
    goals: ['heart'],
    item: 'chefHat',
    levels: [
      { title: 'Line Cook', pay: 115, needs: { health: 45, smarts: 30 } },
      { title: 'Chef', pay: 175, needs: { health: 50, smarts: 45 } },
      { title: 'Head Chef', pay: 270, needs: { health: 50, smarts: 60 } },
    ],
  },
  {
    id: 'office',
    lean: ['careful', 'lazy'],
    goals: ['fortune'],
    item: 'tie',
    levels: [
      { title: 'Office Clerk', pay: 130, needs: { smarts: 40 } },
      { title: 'Manager', pay: 205, needs: { smarts: 55 } },
      { title: 'Director', pay: 355, needs: { smarts: 70 } },
    ],
  },
  {
    id: 'teacher',
    lean: ['social', 'curious'],
    goals: ['scholar', 'heart'],
    item: 'glasses',
    levels: [
      { title: 'Teaching Aide', pay: 130, needs: { smarts: 50 } },
      { title: 'Teacher', pay: 185, needs: { smarts: 60 } },
      { title: 'Principal', pay: 290, needs: { smarts: 75 } },
    ],
  },

  // ---- Lots of smarts ----
  {
    id: 'developer',
    lean: ['shy', 'curious'],
    goals: ['scholar', 'fortune'],
    item: 'headphones',
    levels: [
      { title: 'Junior Developer', pay: 155, needs: { smarts: 60 } },
      { title: 'Developer', pay: 235, needs: { smarts: 70 } },
      { title: 'Lead Developer', pay: 395, needs: { smarts: 82 } },
    ],
  },
  {
    id: 'scientist',
    lean: ['curious', 'careful'],
    goals: ['scholar'],
    item: 'labCoat',
    levels: [
      { title: 'Lab Assistant', pay: 150, needs: { smarts: 65 } },
      { title: 'Scientist', pay: 225, needs: { smarts: 75 } },
      { title: 'Lead Researcher', pay: 375, needs: { smarts: 88 } },
    ],
  },
  {
    id: 'doctor',
    lean: ['careful', 'social'],
    goals: ['healthy', 'scholar'],
    item: 'stethoscope',
    levels: [
      { title: 'Med Intern', pay: 165, needs: { smarts: 72, health: 50 } },
      { title: 'Doctor', pay: 290, needs: { smarts: 80, health: 50 } },
      { title: 'Chief Surgeon', pay: 480, needs: { smarts: 90, health: 55 } },
    ],
  },
];
